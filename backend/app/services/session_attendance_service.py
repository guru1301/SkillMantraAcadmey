"""
Training Session & Attendance Service: Session scheduling, attendance marking, and histories.
"""
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func, select, text, update
from sqlalchemy.orm import Session

from backend.app.db.models import TrainingSession, SessionAttendance, Batch, Trainer, Student, BatchStudent, BatchTrainer
from backend.app.schemas.attendance import AttendanceMarkItem
from backend.app.schemas.session import TrainingSessionCreate, TrainingSessionUpdate


def _validate_session_trainer(db: Session, batch_id: UUID, trainer_id: UUID) -> Trainer:
    """
    Verifies a trainer_id supplied for a session exists, is active, and is assigned
    to the target batch in batch_trainers. Raises 400 or 403 on failure.
    """
    trainer = db.execute(select(Trainer).where(Trainer.id == trainer_id)).scalar_one_or_none()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplied trainer_id does not exist.",
        )
    if trainer.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplied trainer is not active and cannot be assigned to a session.",
        )
    assigned = db.execute(
        select(BatchTrainer.id).where(
            BatchTrainer.batch_id == batch_id,
            BatchTrainer.trainer_id == trainer_id,
        )
    ).scalar_one_or_none()
    if not assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplied trainer is not assigned to this batch.",
        )
    return trainer


def _assert_attendance_edit_window(session_date: Optional[date], caller_role: Optional[str]) -> None:
    """
    Enforces that attendance records older than 7 days can only be edited by super_admin.
    """
    if session_date is None:
        return
    normalized_date = session_date.date() if isinstance(session_date, datetime) else session_date
    age_days = (datetime.now(timezone.utc).date() - normalized_date).days
    if age_days > 7 and caller_role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Attendance older than 7 days can only be modified by a Super Administrator.",
        )


def create_training_session(db: Session, data: TrainingSessionCreate) -> TrainingSession:
    """
    Schedules a new training session for a batch.
    Any supplied trainer_id must exist, be active, and be assigned to that batch.
    """
    batch = db.execute(select(Batch).where(Batch.id == data.batch_id)).scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    if data.trainer_id is not None:
        _validate_session_trainer(db, data.batch_id, data.trainer_id)

    resolved_date = data.session_date or data.date
    if resolved_date is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session date is required.")

    session = TrainingSession(
        batch_id=data.batch_id,
        trainer_id=data.trainer_id,
        title=data.title.strip(),
        topic=data.topic.strip() if data.topic else None,
        date=resolved_date,
        start_time=data.start_time,
        end_time=data.end_time,
        status="scheduled",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def update_training_session(
    db: Session,
    session_id: UUID,
    data: TrainingSessionUpdate,
) -> Optional[TrainingSession]:
    """
    Updates training session properties.
    Any supplied non-null trainer_id must exist, be active, and be assigned to that batch.
    """
    session = db.execute(select(TrainingSession).where(TrainingSession.id == session_id)).scalar_one_or_none()
    if not session:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    if "trainer_id" in update_dict and update_dict["trainer_id"] is not None:
        _validate_session_trainer(db, session.batch_id, update_dict["trainer_id"])

    if "session_date" in update_dict:
        session.date = update_dict.pop("session_date")
    update_dict.pop("session_number", None)
    update_dict.pop("meeting_link", None)
    update_dict.pop("recording_link", None)
    for k, v in update_dict.items():
        if hasattr(session, k):
            setattr(session, k, v)

    session.updated_at = func.now()
    db.commit()
    db.refresh(session)
    return session


def list_sessions_for_batch(db: Session, batch_id: UUID) -> List[Dict[str, Any]]:
    """
    Lists all sessions scheduled for a batch with attendance counts.
    """
    sql = text("""
        SELECT 
          ts.id,
          ts.batch_id,
          ts.trainer_id,
          t.full_name as trainer_name,
          NULL::int as session_number,
          ts.title,
          ts.topic,
          ts.date as session_date,
          ts.date,
          ts.start_time,
          ts.end_time,
          ts.status,
          NULL::text as meeting_link,
          NULL::text as recording_link,
          ts.created_at,
          ts.updated_at,
          COUNT(DISTINCT sa.id)::int as total_students,
          COUNT(DISTINCT CASE WHEN sa.status = 'present' THEN sa.id END)::int as present_count,
          COUNT(DISTINCT CASE WHEN sa.status = 'absent' THEN sa.id END)::int as absent_count
        FROM training_sessions ts
        LEFT JOIN trainers t ON t.id = ts.trainer_id
        LEFT JOIN session_attendance sa ON sa.session_id = ts.id
        WHERE ts.batch_id = :batch_id
        GROUP BY ts.id, t.full_name
        ORDER BY ts.date ASC, ts.start_time ASC
    """)
    rows = db.execute(sql, {"batch_id": batch_id}).mappings().all()
    return [dict(r) for r in rows]


def record_bulk_attendance(
    db: Session,
    session_id: UUID,
    records: List[AttendanceMarkItem],
    marker_id: Optional[UUID] = None,
    marker_role: Optional[str] = None,
) -> int:
    """
    Persists student attendance for a training session and marks session completed.
    Validates that every submitted student is actually enrolled in the session's batch.
    Only super_admin may edit attendance for sessions older than 7 days.
    """
    session = db.execute(
        select(TrainingSession).where(TrainingSession.id == session_id)
    ).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training session not found.")

    _assert_attendance_edit_window(session.date, marker_role)

    # Integrity verification: verify each submitted student belongs to this batch
    submitted_student_ids = [r.student_id for r in records]
    if submitted_student_ids:
        enrolled_ids_rows = db.execute(
            select(BatchStudent.student_id).where(
                BatchStudent.batch_id == session.batch_id,
                BatchStudent.student_id.in_(submitted_student_ids),
            )
        ).scalars().all()
        enrolled_set = set(enrolled_ids_rows)

        for r in records:
            if r.student_id not in enrolled_set:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Integrity violation: Student '{r.student_id}' is not enrolled in cohort batch '{session.batch_id}'.",
                )

    upsert_sql = text("""
        INSERT INTO session_attendance (
          session_id, student_id, status, notes, marked_at, marked_by_id, marked_by_role, updated_at
        )
        VALUES (
          :session_id, :student_id, :status, :notes, NOW(), :marked_by_id, :marked_by_role, NOW()
        )
        ON CONFLICT (session_id, student_id)
        DO UPDATE SET
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          marked_at = NOW(),
          marked_by_id = EXCLUDED.marked_by_id,
          marked_by_role = EXCLUDED.marked_by_role,
          updated_at = NOW()
    """)

    count = 0
    for r in records:
        note_val = r.remarks if hasattr(r, "remarks") and r.remarks else getattr(r, "notes", None)
        db.execute(
            upsert_sql,
            {
                "session_id": session_id,
                "student_id": r.student_id,
                "status": r.status,
                "notes": note_val.strip() if note_val else None,
                "marked_by_id": marker_id,
                "marked_by_role": marker_role,
            },
        )
        count += 1

    # Mark training session as completed
    session.status = "completed"
    session.updated_at = func.now()

    db.commit()
    return count


def get_student_attendance_summary(db: Session, student_id: UUID) -> Dict[str, Any]:
    """
    Calculates detailed attendance breakdown and session history for a student.
    Correctly reconciles completed unmarked sessions in the denominator.
    """
    sql = text("""
        SELECT DISTINCT
          ts.id as session_id,
          ts.batch_id,
          b.code as batch_code,
          p.name as program_name,
          ts.date::text as date,
          ts.title,
          ts.topic,
          ts.status as session_status,
          COALESCE(sa.status, 'unmarked') as status,
          sa.notes as remarks
        FROM training_sessions ts
        JOIN batches b ON b.id = ts.batch_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN session_attendance sa ON sa.session_id = ts.id AND sa.student_id = CAST(:student_id AS UUID)
        WHERE (sa.id IS NOT NULL)
           OR (ts.batch_id IN (SELECT batch_id FROM batch_students WHERE student_id = CAST(:student_id AS UUID)))
        ORDER BY ts.date DESC, ts.start_time DESC NULLS LAST
    """)
    student_uuid = student_id if isinstance(student_id, UUID) else UUID(str(student_id))
    rows = db.execute(sql, {"student_id": str(student_uuid)}).mappings().all()

    present_count = 0
    absent_count = 0
    late_count = 0
    excused_count = 0
    unmarked_completed = 0

    history = []
    for r in rows:
        att_status = r["status"]
        sess_status = r["session_status"]
        if att_status == "present":
            present_count += 1
        elif att_status == "absent":
            absent_count += 1
        elif att_status == "late":
            late_count += 1
        elif att_status == "excused":
            excused_count += 1
        elif sess_status == "completed":
            unmarked_completed += 1

        history.append({
            "session_id": r["session_id"],
            "sessionId": r["session_id"],
            "batch_id": r["batch_id"],
            "batchId": r["batch_id"],
            "batch_code": r["batch_code"],
            "batchCode": r["batch_code"],
            "program_name": r["program_name"],
            "programName": r["program_name"],
            "date": str(r["date"]),
            "title": r["title"],
            "topic": r["topic"],
            "status": sess_status,
            "attendance_status": att_status,
            "remarks": r["remarks"],
            "notes": r["remarks"],
            "attendance_notes": r["remarks"],
        })

    recorded = present_count + absent_count + late_count + excused_count
    attended = present_count + late_count
    # Effective denominator accounts for completed sessions that concluded without an attendance record
    effective_total = max(recorded, recorded + unmarked_completed)
    rate = round((attended / effective_total) * 100.0, 1) if effective_total > 0 else 0.0

    return {
        "studentId": student_id,
        "totalRecordedSessions": recorded,
        "totalSessions": effective_total,
        "presentCount": present_count,
        "absentCount": absent_count,
        "lateCount": late_count,
        "excusedCount": excused_count,
        "unmarkedCompletedSessions": unmarked_completed,
        "percentage": rate,
        "attendancePercentage": rate,
        "history": history,
    }


def get_session_roster(db: Session, session_id: UUID) -> List[Dict[str, Any]]:
    """
    Retrieves student roster for a session's batch along with any existing attendance marks.
    """
    session_obj = db.execute(select(TrainingSession).where(TrainingSession.id == session_id)).scalar_one_or_none()
    if not session_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training session not found.")

    sql = text("""
        SELECT 
           st.id as student_id,
           st.roll_number,
           st.full_name,
           st.email,
           st.department,
           COALESCE(sa.status, 'unmarked') as status,
           sa.notes,
           sa.marked_at::text as marked_at
        FROM batch_students bs
        JOIN students st ON st.id = bs.student_id
        LEFT JOIN session_attendance sa ON sa.session_id = :session_id AND sa.student_id = st.id
        WHERE bs.batch_id = :batch_id
        ORDER BY st.roll_number ASC, st.full_name ASC
    """)
    rows = db.execute(sql, {"session_id": session_id, "batch_id": session_obj.batch_id}).mappings().all()
    return [dict(r) for r in rows]


def get_platform_attendance_stats(db: Session) -> Dict[str, Any]:
    """
    Retrieves platform-wide attendance metrics.
    """
    sql = text("""
        SELECT 
          (SELECT COUNT(*)::int FROM training_sessions) as total_sessions,
          (SELECT COUNT(*)::int FROM session_attendance) as total_records,
          (SELECT COUNT(*)::int FROM session_attendance WHERE status = 'present') as present_records
    """)
    row = db.execute(sql).mappings().first()
    total_sessions = int(row["total_sessions"]) if row and row["total_sessions"] else 0
    total_records = int(row["total_records"]) if row and row["total_records"] else 0
    present_records = int(row["present_records"]) if row and row["present_records"] else 0
    rate = round((present_records / total_records) * 100.0, 1) if total_records > 0 else 0.0

    return {
        "totalSessions": total_sessions,
        "totalRecordsMarked": total_records,
        "overallAttendanceRate": rate,
    }


def get_trainer_batch_live_roster(
    db: Session,
    trainer_id: UUID,
    batch_id: UUID,
    date_str: str,
    is_super_admin: bool = False,
    caller_role: Optional[str] = None,
    caller_college_id: Optional[UUID] = None,
) -> Dict[str, Any]:
    actor_role = caller_role or ("super_admin" if is_super_admin else "trainer")

    batch = db.execute(select(Batch).where(Batch.id == batch_id)).scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    if actor_role == "college_admin":
        if not caller_college_id or batch.college_id != caller_college_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant isolation violation: Batch belongs to another college institution.",
            )
    elif actor_role == "trainer" and not is_super_admin:
        assign_check = db.execute(
            select(BatchTrainer.id).where(
                BatchTrainer.batch_id == batch_id,
                BatchTrainer.trainer_id == trainer_id,
            )
        ).scalar_one_or_none()
        if not assign_check:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Trainer is not assigned to this batch cohort.",
            )

    batch_filter = "AND bt.trainer_id = :trainer_id" if actor_role == "trainer" else ""
    batch_sql = text(f"""
        SELECT 
           b.id,
           b.code as code,
           b.code as batch_code,
           b.college_id,
           c.name as college_name,
           c.city as college_city,
           b.program_id,
           p.name as program_name,
           b.start_date::text as start_date,
           b.end_date::text as end_date,
           b.target_strength,
           b.status,
           COALESCE(bt.role, 'faculty') as role,
           COALESCE(bt.is_lead, false) as is_lead,
           (SELECT COUNT(*)::int FROM batch_students bs WHERE bs.batch_id = b.id) as enrolled_count,
           EXISTS(
             SELECT 1 FROM training_sessions ts 
             WHERE ts.batch_id = b.id AND ts.date = CAST(:date_val AS DATE) AND ts.status = 'completed'
           ) as today_marked
        FROM batches b
        JOIN colleges c ON c.id = b.college_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN batch_trainers bt ON bt.batch_id = b.id {batch_filter}
        WHERE b.id = :batch_id
        LIMIT 1
    """)
    params: Dict[str, Any] = {"batch_id": batch_id, "date_val": date_str}
    if actor_role == "trainer":
        params["trainer_id"] = trainer_id

    batch_row = db.execute(batch_sql, params).mappings().first()
    if not batch_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    session_sql = text("""
        SELECT id, title, topic, status 
        FROM training_sessions 
        WHERE batch_id = :batch_id AND date = CAST(:date_val AS DATE)
        ORDER BY created_at DESC 
        LIMIT 1
    """)
    session_row = db.execute(session_sql, {"batch_id": batch_id, "date_val": date_str}).mappings().first()

    roster_sql = text("""
        SELECT 
           st.id as student_id,
           st.roll_number,
           st.full_name,
           st.email,
           st.department,
           st.phone,
           COALESCE(sa.status, 'unmarked') as status,
           sa.notes
        FROM batch_students bs
        JOIN students st ON st.id = bs.student_id
        LEFT JOIN training_sessions ts ON ts.batch_id = bs.batch_id AND ts.date = CAST(:date_val AS DATE)
        LEFT JOIN session_attendance sa ON sa.session_id = ts.id AND sa.student_id = st.id
        WHERE bs.batch_id = :batch_id
        ORDER BY st.roll_number ASC, st.full_name ASC
    """)
    roster_rows = db.execute(roster_sql, {"batch_id": batch_id, "date_val": date_str}).mappings().all()

    return {
        "batch": dict(batch_row),
        "existingSession": dict(session_row) if session_row else None,
        "roster": [dict(r) for r in roster_rows],
    }


def save_live_batch_attendance(
    db: Session,
    trainer_id: UUID,
    batch_id: UUID,
    date_str: str,
    title: str,
    topic: Optional[str],
    records: List[Dict[str, Any]],
    is_super_admin: bool = False,
    caller_role: Optional[str] = None,
    caller_college_id: Optional[UUID] = None,
) -> Dict[str, Any]:
    actor_role = caller_role or ("super_admin" if is_super_admin else "trainer")

    if actor_role == "college_admin":
        if caller_college_id is not None:
            batch = db.execute(select(Batch).where(Batch.id == batch_id)).scalar_one_or_none()
            if not batch:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")
            if batch.college_id != caller_college_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tenant isolation violation: Batch belongs to another college institution.",
                )
    elif actor_role != "super_admin":
        assign_check = db.execute(
            select(BatchTrainer.id).where(
                BatchTrainer.batch_id == batch_id,
                BatchTrainer.trainer_id == trainer_id,
            )
        ).scalar_one_or_none()
        if not assign_check:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: You are not assigned to instruct or mark attendance for this cohort.",
            )

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Expected YYYY-MM-DD.",
        )

    today_utc = datetime.now(timezone.utc).date()
    if target_date > today_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Future dates are locked. Attendance cannot be recorded or modified for tomorrow or future dates.",
        )

    _assert_attendance_edit_window(target_date, actor_role)

    enrolled_ids = db.execute(
        select(BatchStudent.student_id).where(BatchStudent.batch_id == batch_id)
    ).scalars().all()
    enrolled_set = set(enrolled_ids)

    if not enrolled_set:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This batch has no enrolled students. Cannot record attendance for an empty cohort.",
        )

    valid_statuses = {"present", "absent", "late", "excused"}
    submitted_set = set()

    for r in records:
        s_id = UUID(str(r.get("studentId") or r.get("student_id")))
        if s_id not in enrolled_set:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid submission: Student ID {s_id} is not enrolled in this cohort.",
            )
        if r.get("status") not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{r.get('status')}'. Every student must be marked present, absent, late, or excused.",
            )
        submitted_set.add(s_id)

    if len(submitted_set) < len(enrolled_set):
        missing = len(enrolled_set) - len(submitted_set)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incomplete roster: {missing} enrolled students have no recorded attendance status.",
        )

    existing_session = db.execute(
        select(TrainingSession).where(
            TrainingSession.batch_id == batch_id,
            TrainingSession.date == date_str,
        )
    ).scalar_one_or_none()

    session_trainer_id = trainer_id if actor_role == "trainer" else None
    if existing_session:
        session_id = existing_session.id
        existing_session.title = title
        existing_session.topic = topic
        if session_trainer_id is not None:
            existing_session.trainer_id = session_trainer_id
        existing_session.status = "completed"
        existing_session.updated_at = func.now()
    else:
        new_session = TrainingSession(
            batch_id=batch_id,
            date=date_str,
            title=title,
            topic=topic,
            trainer_id=session_trainer_id,
            status="completed",
        )
        db.add(new_session)
        db.flush()
        session_id = new_session.id

    present_cnt = sum(1 for r in records if r["status"] == "present")
    absent_cnt = sum(1 for r in records if r["status"] == "absent")
    late_cnt = sum(1 for r in records if r["status"] == "late")
    excused_cnt = sum(1 for r in records if r["status"] == "excused")

    upsert_sql = text("""
        INSERT INTO session_attendance (
          session_id, student_id, status, notes, marked_at, marked_by_id, marked_by_role, updated_at
        )
        VALUES (
          :session_id, :student_id, :status, :notes, NOW(), :marked_by_id, :marked_by_role, NOW()
        )
        ON CONFLICT (session_id, student_id)
        DO UPDATE SET
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          marked_at = NOW(),
          marked_by_id = EXCLUDED.marked_by_id,
          marked_by_role = EXCLUDED.marked_by_role,
          updated_at = NOW()
    """)

    for r in records:
        s_id = UUID(str(r.get("studentId") or r.get("student_id")))
        db.execute(
            upsert_sql,
            {
                "session_id": session_id,
                "student_id": s_id,
                "status": r["status"],
                "notes": r.get("notes"),
                "marked_by_id": trainer_id,
                "marked_by_role": actor_role,
            },
        )

    db.commit()

    return {
        "sessionId": str(session_id),
        "savedCount": len(records),
        "presentCount": present_cnt,
        "absentCount": absent_cnt,
        "lateCount": late_cnt,
        "excusedCount": excused_cnt,
    }


def get_batch_calendar_sessions(db: Session, batch_id: UUID) -> List[Dict[str, Any]]:
    sql = text("""
        SELECT 
           ts.id,
           ts.date::text as date,
           ts.title,
           ts.topic,
           ts.status,
           COUNT(sa.id)::int as total_marked,
           COUNT(CASE WHEN sa.status = 'present' THEN 1 END)::int as present_count,
           COUNT(CASE WHEN sa.status = 'absent' THEN 1 END)::int as absent_count,
           COUNT(CASE WHEN sa.status = 'late' THEN 1 END)::int as late_count,
           COUNT(CASE WHEN sa.status = 'excused' THEN 1 END)::int as excused_count,
           CASE 
             WHEN COUNT(sa.id) > 0 THEN ROUND((COUNT(CASE WHEN sa.status = 'present' THEN 1 END)::numeric / COUNT(sa.id)::numeric) * 100)::int 
             ELSE 0 
           END as attendance_rate
        FROM training_sessions ts
        LEFT JOIN session_attendance sa ON sa.session_id = ts.id
        WHERE ts.batch_id = :batch_id
        GROUP BY ts.id, ts.date, ts.title, ts.topic, ts.status
        ORDER BY ts.date DESC
    """)
    rows = db.execute(sql, {"batch_id": batch_id}).mappings().all()
    return [
        {
            "id": str(r["id"]),
            "date": r["date"],
            "title": r["title"],
            "topic": r["topic"],
            "status": r["status"],
            "totalMarked": r["total_marked"],
            "presentCount": r["present_count"],
            "absentCount": r["absent_count"],
            "lateCount": r["late_count"],
            "excusedCount": r["excused_count"],
            "attendanceRate": r["attendance_rate"],
        }
        for r in rows
    ]

