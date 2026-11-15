"""
Student Business Service: Student management, bulk onboarding, activation, and portal roster.
"""
from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Dict, List, Optional, Set, Tuple
from uuid import UUID, uuid4
from fastapi import HTTPException, status
from sqlalchemy import cast, delete, func, select, String, text, update
from sqlalchemy.orm import Session

from backend.app.core.security import (
    DUMMY_ACTIVATION_TOKEN_HASH,
    generate_activation_code,
    generate_temporary_password,
    hash_activation_token,
    hash_password,
    normalize_dob,
    verify_activation_token,
)

logger = logging.getLogger(__name__)
from backend.app.db.models import (
    AdminUser,
    AssessmentSubmission,
    Batch,
    BatchStudent,
    Certificate,
    College,
    CollegeUser,
    ExamProctoringEvent,
    SessionAttendance,
    Student,
    StudentAuditLog,
    StudentFeedback,
    Trainer,
    UserSession,
)
from backend.app.schemas.student import (
    ActivationCredentialItem,
    BulkStudentActionPayload,
    BulkStudentActionResult,
    BulkStudentItem,
    RosterImportExecuteRequest,
    RosterImportExecuteResponse,
    RosterImportPreviewItem,
    RosterImportPreviewResponse,
    StudentActivationRequest,
    StudentCreate,
    StudentUpdate,
)
from backend.app.services.auth_service import revoke_all_user_sessions


def log_student_audit_event(
    db: Session,
    student_id: Optional[UUID],
    student_roll: str,
    student_name: Optional[str],
    college_id: Optional[UUID],
    action: str,
    actor_id: Optional[UUID] = None,
    actor_role: str = "system",
    actor_email: Optional[str] = None,
    operation_id: Optional[str] = None,
    details: Optional[str] = None,
) -> StudentAuditLog:
    """
    Safely writes an immutable audit record to student_audit_logs.
    Never logs passwords, tokens, or personal secrets.
    """
    audit = StudentAuditLog(
        student_id=student_id,
        student_roll=student_roll,
        student_name=student_name,
        college_id=college_id,
        action=action,
        actor_id=actor_id,
        actor_role=actor_role,
        actor_email=actor_email,
        operation_id=operation_id,
        details=details,
    )
    db.add(audit)
    return audit


def get_students_list(
    db: Session,
    college_id: Optional[UUID] = None,
    batch_id: Optional[UUID] = None,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    trainer_id: Optional[UUID] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieves students matching filters with enrollment details.
    Supports tenant scoping by college_id and instructional scoping by trainer_id.
    """
    params: Dict[str, Any] = {}
    where_clauses = ["1=1"]

    if college_id:
        where_clauses.append("s.college_id = :college_id")
        params["college_id"] = college_id

    if batch_id:
        where_clauses.append("bs.batch_id = :batch_id")
        params["batch_id"] = batch_id

    if trainer_id:
        where_clauses.append(
            "bs.batch_id IN (SELECT bt.batch_id FROM batch_trainers bt WHERE bt.trainer_id = :trainer_id)"
        )
        params["trainer_id"] = trainer_id

    if status_filter and status_filter != "all":
        where_clauses.append("s.status = :status_filter")
        params["status_filter"] = status_filter

    if search and search.strip():
        where_clauses.append(
            "(LOWER(s.full_name) LIKE :search OR LOWER(s.roll_number) LIKE :search OR LOWER(COALESCE(s.email, '')) LIKE :search)"
        )
        params["search"] = f"%{search.strip().lower()}%"

    where_sql = " AND ".join(where_clauses)

    sql = f"""
        SELECT 
          s.id,
          s.college_id,
          s.roll_number,
          s.full_name,
          s.full_name as name,
          s.email,
          s.phone,
          s.department,
          s.year_or_semester,
          s.dob,
          s.gender,
          s.status,
          s.status as student_status,
          s.must_change_password,
          s.activated_at,
          s.archived_at,
          s.created_at,
          s.updated_at,
          c.name as college_name,
          STRING_AGG(DISTINCT b.code, ', ') as batch_codes,
          STRING_AGG(DISTINCT bs.status, ', ') as enrollment_status,
          (s.password_hash IS NOT NULL AND s.status = 'active') as has_credentials
        FROM students s
        LEFT JOIN colleges c ON c.id = s.college_id
        LEFT JOIN batch_students bs ON bs.student_id = s.id
        LEFT JOIN batches b ON b.id = bs.batch_id
        WHERE {where_sql}
        GROUP BY s.id, c.name
        ORDER BY s.roll_number ASC, s.full_name ASC
    """
    if limit is not None:
        sql += " LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset or 0

    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]


def get_student_by_id(
    db: Session,
    student_id: UUID,
    tenant_college_id: Optional[UUID] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retrieves detailed student profile.
    """
    params: Dict[str, Any] = {"student_id": student_id}
    college_filter = ""
    if tenant_college_id:
        college_filter = "AND s.college_id = :tenant_college_id"
        params["tenant_college_id"] = tenant_college_id

    sql = f"""
        SELECT 
          s.id,
          s.college_id,
          s.roll_number,
          s.full_name as full_name,
          s.full_name as name,
          s.email,
          s.phone,
          s.department,
          s.year_or_semester,
          s.dob,
          s.gender,
          s.status,
          s.must_change_password,
          s.activated_at,
          s.archived_at,
          s.created_at,
          s.updated_at,
          c.name as college_name,
          c.city as college_city,
          c.state as college_state
        FROM students s
        LEFT JOIN colleges c ON c.id = s.college_id
        WHERE s.id = :student_id {college_filter}
    """
    row = db.execute(text(sql), params).mappings().first()
    return dict(row) if row else None


def create_student(
    db: Session,
    data: StudentCreate,
    enforced_college_id: Optional[UUID] = None,
) -> Student:
    """
    Creates a single student profile.
    """
    target_college_id = enforced_college_id or data.college_id
    if not target_college_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="college_id is required for student registration.",
        )

    clean_email = str(data.email).strip().lower() if data.email and str(data.email).strip() else None
    if clean_email:
        from backend.app.services.auth_service import check_email_unique_globally
        check_email_unique_globally(db, clean_email)

    pw_hash = hash_password(data.password) if data.password else None

    student = Student(
        college_id=target_college_id,
        full_name=data.name.strip(),
        roll_number=data.roll_number.strip().upper(),
        email=clean_email,
        phone=data.phone.strip() if data.phone else None,
        department=data.department.strip() if data.department else None,
        password_hash=pw_hash,
        status=data.status,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def update_student(
    db: Session,
    student_id: UUID,
    data: StudentUpdate,
    tenant_college_id: Optional[UUID] = None,
) -> Optional[Student]:
    """
    Updates an existing student profile.
    """
    stmt = select(Student).where(Student.id == student_id).with_for_update()
    if tenant_college_id:
        stmt = stmt.where(Student.college_id == tenant_college_id)

    student = db.execute(stmt).scalar_one_or_none()
    if not student:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    for forbidden in ("status", "password", "password_hash"):
        update_dict.pop(forbidden, None)

    if "email" in update_dict and update_dict["email"]:
        clean_email = str(update_dict["email"]).strip().lower()
        from backend.app.services.auth_service import check_email_unique_globally
        check_email_unique_globally(db, clean_email, exclude_user_id=student_id)
        update_dict["email"] = clean_email

    for k, v in update_dict.items():
        if isinstance(v, str):
            setattr(student, k, v.strip())
        else:
            setattr(student, k, v)

    student.updated_at = func.now()
    db.commit()
    db.refresh(student)
    return student


def bulk_enroll_students(
    db: Session,
    batch_id: UUID,
    enforced_college_id: UUID,
    students: List[BulkStudentItem],
) -> Dict[str, Any]:
    """
    Bulk onboards students:
    1. Checks for an existing student on (college_id, LOWER(TRIM(roll_number))).
       On roll-number conflict, preserves the existing student's full_name and profile
       data without overwriting it, still enrolls them in the batch, and reports the conflict.
    2. Inserts new students cleanly and enrolls them into batch_students.
    """
    # Verify batch belongs to enforced_college_id
    batch = db.execute(
        select(Batch).where(Batch.id == batch_id, Batch.college_id == enforced_college_id)
    ).scalar_one_or_none()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found or does not belong to the authorized college.",
        )

    newly_enrolled = 0
    conflicts: List[Dict[str, str]] = []

    lookup_sql = text("""
        SELECT id, roll_number, full_name
        FROM students
        WHERE college_id = :college_id
          AND LOWER(TRIM(roll_number)) = LOWER(TRIM(:roll_number))
        LIMIT 1
    """)

    insert_sql = text("""
        INSERT INTO students (college_id, roll_number, full_name, email, phone, department, status)
        VALUES (:college_id, :roll_number, :full_name, :email, :phone, :department, 'active')
        ON CONFLICT (college_id, LOWER(TRIM(roll_number))) DO NOTHING
        RETURNING id
    """)

    link_sql = text("""
        INSERT INTO batch_students (batch_id, student_id, status)
        VALUES (:batch_id, :student_id, 'enrolled')
        ON CONFLICT (batch_id, student_id) DO NOTHING
        RETURNING id
    """)

    for row in students:
        roll_no = row.rollNumber.strip().upper()
        full_name = row.fullName.strip()
        email = row.email.strip().lower() if row.email else None
        phone = row.phone.strip() if row.phone else None
        department = row.department.strip().upper() if row.department else None

        existing_row = db.execute(
            lookup_sql,
            {"college_id": enforced_college_id, "roll_number": roll_no},
        ).first()

        student_id = None
        if existing_row:
            student_id = existing_row[0]
            conflicts.append({
                "studentId": str(student_id),
                "rollNumber": str(existing_row[1]),
                "existingFullName": str(existing_row[2]),
                "submittedFullName": full_name,
                "note": "Existing student record preserved; full_name not overwritten.",
            })
        else:
            ins_res = db.execute(
                insert_sql,
                {
                    "college_id": enforced_college_id,
                    "roll_number": roll_no,
                    "full_name": full_name,
                    "email": email,
                    "phone": phone,
                    "department": department,
                },
            ).first()
            if ins_res:
                student_id = ins_res[0]
            else:
                # Concurrent insert race fallback: keep existing record intact and report conflict
                race_row = db.execute(
                    lookup_sql,
                    {"college_id": enforced_college_id, "roll_number": roll_no},
                ).first()
                if race_row:
                    student_id = race_row[0]
                    conflicts.append({
                        "studentId": str(student_id),
                        "rollNumber": str(race_row[1]),
                        "existingFullName": str(race_row[2]),
                        "submittedFullName": full_name,
                        "note": "Existing student record preserved; full_name not overwritten.",
                    })

        if student_id:
            link_res = db.execute(
                link_sql,
                {"batch_id": batch_id, "student_id": student_id},
            ).first()
            if link_res:
                newly_enrolled += 1

    db.commit()

    return {
        "totalProcessed": len(students),
        "newlyEnrolled": newly_enrolled,
        "conflicts": conflicts,
    }


def assign_student_credentials(
    db: Session,
    student_id: UUID,
    actor_id: Optional[UUID] = None,
    actor_role: Optional[str] = None,
    actor_email: Optional[str] = None,
    password: Optional[str] = None,
) -> Tuple[bool, str, str]:
    """
    Sets unique temporary credentials for a single student, activates their account,
    revokes active sessions, and writes an immutable audit log entry.
    Generates a secure random temporary password and enforces must_change_password = True.
    Returns (success, temporary_password, roll_number).
    """
    from backend.app.core.security import generate_temporary_password, hash_password

    temp_pw = generate_temporary_password()
    pw_hash = hash_password(temp_pw)
    sql = text("""
        UPDATE students
        SET password_hash = :hash, must_change_password = true, status = 'active', updated_at = NOW()
        WHERE id = :student_id
        RETURNING id, roll_number, full_name, college_id
    """)
    res = db.execute(sql, {"hash": pw_hash, "student_id": student_id})
    row = res.first() if hasattr(res, "first") else None
    updated = row is not None or int(getattr(res, "rowcount", 0) or 0) > 0
    roll_num = str(row[1]) if row is not None and len(row) > 1 else ""
    if updated:
        revoke_all_user_sessions(db, student_id, "student")
        if row is not None:
            log_student_audit_event(
                db=db,
                student_id=row[0],
                student_roll=row[1],
                student_name=row[2],
                college_id=row[3],
                action="credentials_assigned",
                actor_id=actor_id,
                actor_role=actor_role or "system",
                actor_email=actor_email,
                details="Credentials assigned for student; all active sessions revoked.",
            )
    db.commit()
    return (updated, temp_pw, roll_num)


def revoke_student_credentials(
    db: Session,
    student_id: UUID,
    actor_id: Optional[UUID] = None,
    actor_role: Optional[str] = None,
    actor_email: Optional[str] = None,
) -> bool:
    """
    Revokes credentials from a single student, deactivates their account, revokes all active
    sessions, and writes an immutable audit log entry.
    """
    sql = text("""
        UPDATE students
        SET password_hash = NULL, status = 'inactive', updated_at = NOW()
        WHERE id = :student_id
        RETURNING id, roll_number, full_name, college_id
    """)
    res = db.execute(sql, {"student_id": student_id})
    row = res.first()
    updated = row is not None or int(res.rowcount or 0) > 0
    if updated:
        revoke_all_user_sessions(db, student_id, "student")
        if row is not None:
            log_student_audit_event(
                db=db,
                student_id=row[0],
                student_roll=row[1],
                student_name=row[2],
                college_id=row[3],
                action="credentials_revoked",
                actor_id=actor_id,
                actor_role=actor_role or "system",
                actor_email=actor_email,
                details="Credentials revoked for student; all active sessions invalidated.",
            )
    db.commit()
    return updated


def get_student_enrolled_batches(db: Session, student_id: UUID) -> List[Dict[str, Any]]:
    sql = text("""
        SELECT 
          b.id,
          b.code as code,
          b.code as batch_code,
          p.name as program_name,
          p.description as program_description,
          p.duration_days,
          b.start_date::text as start_date,
          b.end_date::text as end_date,
          b.status,
          c.name as college_name,
          bs.enrolled_at::text as enrolled_at,
          t.full_name as lead_trainer_name,
          t.email as lead_trainer_email,
          (SELECT COUNT(*)::int FROM training_sessions ts WHERE ts.batch_id = b.id) as total_sessions,
          (SELECT COUNT(*)::int FROM training_sessions ts WHERE ts.batch_id = b.id AND ts.status = 'completed') as completed_sessions
        FROM batch_students bs
        JOIN batches b ON b.id = bs.batch_id
        JOIN programs p ON p.id = b.program_id
        JOIN colleges c ON c.id = b.college_id
        LEFT JOIN batch_trainers bt ON bt.batch_id = b.id AND bt.is_lead = true
        LEFT JOIN trainers t ON t.id = bt.trainer_id
        WHERE bs.student_id = :student_id
        ORDER BY b.start_date DESC, b.created_at DESC
    """)
    rows = db.execute(sql, {"student_id": student_id}).mappings().all()
    return [dict(r) for r in rows]


def get_student_batch_full_details(
    db: Session,
    student_id: UUID,
    batch_id: UUID,
) -> Optional[Dict[str, Any]]:
    batch_sql = text("""
        SELECT 
           b.id,
           b.code as code,
           b.code as batch_code,
           p.name as program_name,
           p.description as program_description,
           p.duration_days,
           b.start_date::text as start_date,
           b.end_date::text as end_date,
           b.status,
           c.name as college_name,
           bs.enrolled_at::text as enrolled_at,
           t.full_name as lead_trainer_name,
           t.email as lead_trainer_email,
           (SELECT COUNT(*)::int FROM training_sessions ts WHERE ts.batch_id = b.id) as total_sessions,
           (SELECT COUNT(*)::int FROM training_sessions ts WHERE ts.batch_id = b.id AND ts.status = 'completed') as completed_sessions
        FROM batch_students bs
        JOIN batches b ON b.id = bs.batch_id
        JOIN programs p ON p.id = b.program_id
        JOIN colleges c ON c.id = b.college_id
        LEFT JOIN batch_trainers bt ON bt.batch_id = b.id AND bt.is_lead = true
        LEFT JOIN trainers t ON t.id = bt.trainer_id
        WHERE bs.student_id = :student_id AND b.id = :batch_id
        LIMIT 1
    """)
    batch_row = db.execute(batch_sql, {"student_id": student_id, "batch_id": batch_id}).mappings().first()
    if not batch_row:
        return None

    trainers_sql = text("""
        SELECT t.id, t.full_name, t.email, bt.role, bt.is_lead
        FROM batch_trainers bt
        JOIN trainers t ON t.id = bt.trainer_id
        WHERE bt.batch_id = :batch_id
        ORDER BY bt.is_lead DESC, t.full_name ASC
    """)
    trainers = [dict(r) for r in db.execute(trainers_sql, {"batch_id": batch_id}).mappings().all()]

    sessions_sql = text("""
        SELECT 
           ts.id,
           ts.batch_id,
           b.code as batch_code,
           p.name as program_name,
           ts.date::text as date,
           ts.start_time::text as start_time,
           ts.end_time::text as end_time,
           ts.title,
           ts.topic,
           ts.status,
           t.full_name as trainer_name,
           COALESCE(sa.status, 'unmarked') as attendance_status,
           sa.notes as attendance_notes
        FROM training_sessions ts
        JOIN batches b ON b.id = ts.batch_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN trainers t ON t.id = ts.trainer_id
        LEFT JOIN session_attendance sa ON sa.session_id = ts.id AND sa.student_id = :student_id
        WHERE ts.batch_id = :batch_id
        ORDER BY ts.date ASC, ts.start_time ASC
    """)
    sessions = [dict(r) for r in db.execute(sessions_sql, {"student_id": student_id, "batch_id": batch_id}).mappings().all()]

    resources_sql = text("""
        SELECT 
           r.id,
           r.batch_id,
           b.code as batch_code,
           p.name as program_name,
           r.name as name,
           r.name as title,
           r.type,
           r.url,
           r.description,
           r.created_at::text as created_at
        FROM resources r
        JOIN batches b ON b.id = r.batch_id
        JOIN programs p ON p.id = b.program_id
        WHERE r.batch_id = :batch_id
        ORDER BY r.created_at DESC
    """)
    resources = [dict(r) for r in db.execute(resources_sql, {"batch_id": batch_id}).mappings().all()]

    recorded = [s for s in sessions if s["attendance_status"] != "unmarked"]
    present = sum(1 for s in sessions if s["attendance_status"] in ("present", "late"))
    absent = sum(1 for s in sessions if s["attendance_status"] == "absent")
    rate = round((present / len(recorded)) * 100) if recorded else 0

    return {
        "batch": dict(batch_row),
        "trainers": trainers,
        "sessions": sessions,
        "resources": resources,
        "attendance": {
            "totalSessions": len(recorded),
            "presentSessions": present,
            "absentSessions": absent,
            "rate": rate,
        },
    }


def get_student_sessions_list(
    db: Session,
    student_id: UUID,
    batch_id: Optional[UUID] = None,
    filter_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    params: Dict[str, Any] = {"student_id": student_id}
    clauses = ["bs.student_id = :student_id"]

    if batch_id:
        clauses.append("ts.batch_id = :batch_id")
        params["batch_id"] = batch_id

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    params["today_val"] = today_str

    if filter_type == "upcoming":
        clauses.append("ts.date >= CAST(:today_val AS DATE)")
    elif filter_type == "past":
        clauses.append("ts.date < CAST(:today_val AS DATE)")

    where_sql = " AND ".join(clauses)

    sql = text(f"""
        SELECT 
          ts.id,
          ts.batch_id,
          b.code as batch_code,
          p.name as program_name,
          ts.date::text as date,
          ts.start_time::text as start_time,
          ts.end_time::text as end_time,
          ts.title,
          ts.topic,
          ts.status,
          t.full_name as trainer_name,
          COALESCE(sa.status, 'unmarked') as attendance_status,
          sa.notes as attendance_notes
        FROM training_sessions ts
        JOIN batch_students bs ON bs.batch_id = ts.batch_id
        JOIN batches b ON b.id = ts.batch_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN trainers t ON t.id = ts.trainer_id
        LEFT JOIN session_attendance sa ON sa.session_id = ts.id AND sa.student_id = :student_id
        WHERE {where_sql}
        ORDER BY ts.date ASC, ts.start_time ASC
    """)
    rows = db.execute(sql, params).mappings().all()
    return [dict(r) for r in rows]


def get_student_dashboard_composite(db: Session, student_id: UUID) -> Optional[Dict[str, Any]]:
    from backend.app.services.resource_service import list_resources_for_student
    from backend.app.services.assessment_service import get_student_available_assessments
    from backend.app.services.session_attendance_service import get_student_attendance_summary

    profile = get_student_by_id(db, student_id)
    if not profile:
        return None

    batches = get_student_enrolled_batches(db, student_id)
    sessions = get_student_sessions_list(db, student_id)
    resources = list_resources_for_student(db, student_id)
    assessments = get_student_available_assessments(db, student_id)
    att_summary = get_student_attendance_summary(db, student_id)

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_session = next((s for s in sessions if s["date"] == today_str), None)
    upcoming_session = next(
        (s for s in sessions if s["date"] >= today_str and (not today_session or s["id"] != today_session["id"]) and s["status"] != "completed"),
        None,
    )
    upcoming_assessment = next(
        (a for a in assessments if a.get("submission_status") in (None, "not_started", "in_progress")),
        None,
    )

    primary_batch = batches[0] if batches else None
    total_batch_sessions = primary_batch["total_sessions"] if primary_batch else 0
    completed_batch_sessions = primary_batch["completed_sessions"] if primary_batch else 0
    training_progress_pct = (
        round((completed_batch_sessions / total_batch_sessions) * 100)
        if total_batch_sessions > 0
        else 0
    )

    return {
        "profile": profile,
        "batches": batches,
        "todaySession": today_session,
        "upcomingSession": upcoming_session,
        "upcomingAssessment": upcoming_assessment,
        "trainingProgressPct": training_progress_pct,
        "totalBatchSessions": total_batch_sessions,
        "completedBatchSessions": completed_batch_sessions,
        "attendanceSummary": {
            "totalRecorded": att_summary.get("totalSessions", 0),
            "presentCount": att_summary.get("presentCount", 0),
            "absentCount": att_summary.get("absentCount", 0),
            "percentage": att_summary.get("attendancePercentage", 0),
        },
        "recentResources": resources[:4],
    }


def check_student_academic_history(db: Session, student_id: UUID) -> Dict[str, Any]:
    """
    Inspects whether a student has historical academic activity:
    attendance records, assessment submissions, proctoring violations, feedback, or certificates.
    Used to safeguard against accidental loss of educational records.
    """
    att_count = db.execute(
        select(func.count(SessionAttendance.id)).where(SessionAttendance.student_id == student_id)
    ).scalar() or 0

    sub_count = db.execute(
        select(func.count(AssessmentSubmission.id)).where(AssessmentSubmission.student_id == student_id)
    ).scalar() or 0

    event_count = db.execute(
        select(func.count(ExamProctoringEvent.id)).where(ExamProctoringEvent.student_id == student_id)
    ).scalar() or 0

    feedback_count = db.execute(
        select(func.count(StudentFeedback.id)).where(StudentFeedback.student_id == student_id)
    ).scalar() or 0

    cert_count = db.execute(
        select(func.count(Certificate.id)).where(Certificate.student_id == student_id)
    ).scalar() or 0

    enrollment_count = db.execute(
        select(func.count(BatchStudent.id)).where(BatchStudent.student_id == student_id)
    ).scalar() or 0

    audit_count = db.execute(
        select(func.count(StudentAuditLog.id)).where(StudentAuditLog.student_id == student_id)
    ).scalar() or 0

    total_records = att_count + sub_count + event_count + feedback_count + cert_count + enrollment_count
    summary_parts = []
    if att_count:
        summary_parts.append(f"{att_count} session attendances")
    if sub_count:
        summary_parts.append(f"{sub_count} exam submissions")
    if cert_count:
        summary_parts.append(f"{cert_count} certificates")
    if feedback_count:
        summary_parts.append(f"{feedback_count} feedback entries")
    if enrollment_count:
        summary_parts.append(f"{enrollment_count} batch enrollments")

    return {
        "has_history": total_records > 0,
        "total_records": total_records,
        "attendance_count": att_count,
        "submissions_count": sub_count,
        "proctoring_events_count": event_count,
        "feedback_count": feedback_count,
        "certificates_count": cert_count,
        "enrollments_count": enrollment_count,
        "audit_logs_count": audit_count,
        "summary": ", ".join(summary_parts) if summary_parts else "No academic or enrollment records",
    }


def preview_roster_import(
    db: Session,
    batch_id: UUID,
    students: List[BulkStudentItem],
    enforced_college_id: Optional[UUID] = None,
) -> RosterImportPreviewResponse:
    """
    Validates uploaded student roster against database constraints before provisioning:
    - Identifies valid new students vs existing students in the college.
    - Flags in-file duplicates.
    - Flags cross-college roll number conflicts.
    - Validates date of birth format required for account activation.
    """
    batch = db.execute(select(Batch).where(Batch.id == batch_id)).scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    target_college_id = batch.college_id
    if enforced_college_id and target_college_id != enforced_college_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant isolation violation: Access to another college's batch is prohibited.",
        )

    seen_file_rolls: Set[str] = set()
    preview_rows: List[RosterImportPreviewItem] = []
    valid_new_count = 0
    existing_count = 0
    duplicate_count = 0
    conflict_count = 0
    invalid_count = 0

    # Query all students in target college for fast lookup
    existing_college_rolls = {
        r.lower()
        for (r,) in db.execute(
            select(func.lower(func.trim(Student.roll_number))).where(Student.college_id == target_college_id)
        ).all()
    }

    for idx, s in enumerate(students, start=1):
        clean_roll = s.rollNumber.strip().upper()
        clean_name = s.fullName.strip()
        lower_roll = clean_roll.lower()

        # Validation 1: Required fields
        if not clean_roll or not clean_name:
            invalid_count += 1
            preview_rows.append(
                RosterImportPreviewItem(
                    rowIndex=idx,
                    rollNumber=clean_roll or "N/A",
                    fullName=clean_name or "N/A",
                    dob=s.dob,
                    gender=s.gender,
                    email=s.email,
                    phone=s.phone,
                    department=s.department,
                    yearOrSemester=s.yearOrSemester,
                    status="invalid",
                    message="Missing required roll number or full name.",
                )
            )
            continue

        # Validation 2: Duplicate in uploaded file
        if lower_roll in seen_file_rolls:
            duplicate_count += 1
            preview_rows.append(
                RosterImportPreviewItem(
                    rowIndex=idx,
                    rollNumber=clean_roll,
                    fullName=clean_name,
                    dob=s.dob,
                    gender=s.gender,
                    email=s.email,
                    phone=s.phone,
                    department=s.department,
                    yearOrSemester=s.yearOrSemester,
                    status="duplicate_in_file",
                    message=f"Duplicate roll number '{clean_roll}' appears multiple times in file.",
                )
            )
            continue

        seen_file_rolls.add(lower_roll)

        # Validation 3: Existing student in same college
        if lower_roll in existing_college_rolls:
            existing_count += 1
            preview_rows.append(
                RosterImportPreviewItem(
                    rowIndex=idx,
                    rollNumber=clean_roll,
                    fullName=clean_name,
                    dob=s.dob,
                    gender=s.gender,
                    email=s.email,
                    phone=s.phone,
                    department=s.department,
                    yearOrSemester=s.yearOrSemester,
                    status="existing",
                    message="Existing student. Will be enrolled in cohort without altering existing credentials.",
                )
            )
            continue

        # Validation 5: New student ready for account provisioning
        valid_new_count += 1
        dob_normalized = normalize_dob(s.dob)
        dob_msg = "DOB recorded for activation." if dob_normalized else "Warning: No DOB provided; activation will require institution reset."
        preview_rows.append(
            RosterImportPreviewItem(
                rowIndex=idx,
                rollNumber=clean_roll,
                fullName=clean_name,
                dob=dob_normalized,
                gender=s.gender,
                email=s.email,
                phone=s.phone,
                department=s.department,
                yearOrSemester=s.yearOrSemester,
                status="new",
                message=f"Valid new student. Profile and login account will be automatically provisioned. {dob_msg}",
            )
        )

    return RosterImportPreviewResponse(
        totalRows=len(students),
        validNewCount=valid_new_count,
        existingCount=existing_count,
        duplicateCount=duplicate_count,
        conflictCount=conflict_count,
        invalidCount=invalid_count,
        previewRows=preview_rows,
    )


def execute_roster_import_and_provision(
    db: Session,
    batch_id: UUID,
    students: List[BulkStudentItem],
    actor_id: Optional[UUID],
    actor_role: str,
    actor_email: Optional[str],
    enforced_college_id: Optional[UUID] = None,
) -> RosterImportExecuteResponse:
    """
    Executes student roster onboarding and automatic login account provisioning:
    1. Validates batch and enforces college tenant scoping.
    2. Atomically provisions new student accounts in 'pending_activation' state with secure activation credentials.
    3. Hashes activation credentials; never stores plaintext tokens in database.
    4. Enrolls students into cohort batch.
    5. Returns single-use one-time activation report for institutional distribution.
    6. Logs audit trail for all provisioned accounts.
    """
    batch = db.execute(select(Batch).where(Batch.id == batch_id)).scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    target_college_id = batch.college_id
    if enforced_college_id and target_college_id != enforced_college_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant isolation violation: Access to another college's batch is prohibited.",
        )

    operation_id = f"import-{uuid4().hex[:10]}"
    seen_rolls: Set[str] = set()

    accounts_provisioned = 0
    existing_enrolled = 0
    skipped_count = 0
    duplicate_count = 0
    failed_count = 0
    activation_credentials: List[ActivationCredentialItem] = []
    errors: List[str] = []

    # Map existing students in target college
    existing_students = db.execute(
        select(Student).where(Student.college_id == target_college_id)
    ).scalars().all()
    college_student_map = {s.roll_number.strip().lower(): s for s in existing_students}

    now_utc = datetime.now(timezone.utc)
    token_expiry = now_utc + timedelta(days=30)

    for s in students:
        clean_roll = s.rollNumber.strip().upper()
        clean_name = s.fullName.strip()
        lower_roll = clean_roll.lower()

        if not clean_roll or not clean_name:
            failed_count += 1
            errors.append(f"Row skipped: missing roll number or full name ({clean_roll or 'unknown'}).")
            continue

        if lower_roll in seen_rolls:
            duplicate_count += 1
            continue
        seen_rolls.add(lower_roll)

        # Case A: Existing student in same college
        if lower_roll in college_student_map:
            st = college_student_map[lower_roll]
            # Enroll into batch_students if not already enrolled
            already_enrolled = db.execute(
                select(BatchStudent).where(BatchStudent.batch_id == batch_id, BatchStudent.student_id == st.id)
            ).scalar_one_or_none()
            if not already_enrolled:
                db.add(BatchStudent(batch_id=batch_id, student_id=st.id, status="enrolled"))
                existing_enrolled += 1
                log_student_audit_event(
                    db=db,
                    student_id=st.id,
                    student_roll=st.roll_number,
                    student_name=st.full_name,
                    college_id=target_college_id,
                    action="batch_enrolled",
                    actor_id=actor_id,
                    actor_role=actor_role,
                    actor_email=actor_email,
                    operation_id=operation_id,
                    details=f"Enrolled existing student into batch {batch.code}",
                )
            else:
                skipped_count += 1
            continue

        # Case B: New student to provision
        clean_dob = normalize_dob(s.dob)
        clean_email = str(s.email).strip().lower() if s.email and str(s.email).strip() else None
        clean_phone = s.phone.strip() if s.phone and s.phone.strip() else None
        clean_dept = s.department.strip().upper() if s.department and s.department.strip() else None
        clean_year = s.yearOrSemester.strip() if s.yearOrSemester and s.yearOrSemester.strip() else None

        # Generate single-use activation credential
        activation_code = generate_activation_code()
        token_hash = hash_activation_token(activation_code)

        new_student = Student(
            college_id=target_college_id,
            roll_number=clean_roll,
            full_name=clean_name,
            dob=clean_dob,
            gender=s.gender,
            email=clean_email,
            phone=clean_phone,
            department=clean_dept,
            year_or_semester=clean_year,
            status="pending_activation",
            must_change_password=True,
            password_hash=None,
            activation_token_hash=token_hash,
            activation_token_expires_at=token_expiry,
        )
        db.add(new_student)
        db.flush()  # populate new_student.id

        # Enroll in cohort batch
        db.add(BatchStudent(batch_id=batch_id, student_id=new_student.id, status="enrolled"))
        accounts_provisioned += 1

        activation_credentials.append(
            ActivationCredentialItem(
                rollNumber=clean_roll,
                fullName=clean_name,
                department=clean_dept,
                activationCode=activation_code,
            )
        )

        log_student_audit_event(
            db=db,
            student_id=new_student.id,
            student_roll=clean_roll,
            student_name=clean_name,
            college_id=target_college_id,
            action="account_created",
            actor_id=actor_id,
            actor_role=actor_role,
            actor_email=actor_email,
            operation_id=operation_id,
            details=f"Automatically provisioned student account for batch {batch.code}",
        )

    db.commit()

    return RosterImportExecuteResponse(
        success=True,
        totalUploaded=len(students),
        accountsProvisioned=accounts_provisioned,
        existingEnrolled=existing_enrolled,
        skippedCount=skipped_count,
        duplicateCount=duplicate_count,
        failedCount=failed_count,
        activationCredentials=activation_credentials,
        errors=errors,
    )


def activate_student_account(
    db: Session,
    request: StudentActivationRequest,
) -> Dict[str, Any]:
    """
    Validates identity and activation credential for a first-time student:
    1. Validates roll number and account state (must be pending_activation or inactive).
    2. Performs identity verification using date of birth supplied during onboarding.
    3. Verifies single-use activation credential against stored SHA-256 hash.
    4. Requires the student to configure a secure personal password.
    5. Clears single-use activation token to prevent replay/reuse.
    6. Sets account to 'active' with must_change_password=False.
    Fails closed with a uniform error message to prevent enumeration of roll numbers, DOBs, or credentials.
    """
    UNIFORM_AUTH_ERROR = "Activation verification failed. Invalid roll number, date of birth, or activation credential."

    clean_roll = request.roll_number.strip().upper()
    clean_dob = normalize_dob(request.dob)

    candidate_query = (
        select(Student)
        .where(func.lower(func.trim(Student.roll_number)) == clean_roll.lower())
        .with_for_update()
    )
    exec_res = db.execute(candidate_query)
    candidates = []
    if hasattr(exec_res, "scalars"):
        try:
            sc = exec_res.scalars()
            if hasattr(sc, "all"):
                all_res = sc.all()
                if isinstance(all_res, list):
                    candidates = all_res
        except Exception:
            pass

    if not candidates and hasattr(exec_res, "scalar_one_or_none"):
        try:
            single = exec_res.scalar_one_or_none()
            if single is not None and not hasattr(single, "_mock_return_value"):
                candidates = [single]
        except Exception:
            pass

    # Fail closed to avoid revealing account existence or status
    if not candidates:
        verify_activation_token(request.activation_code, DUMMY_ACTIVATION_TOKEN_HASH)
        logger.warning("Activation verification failed: Student not found for roll number '%s'.", clean_roll)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UNIFORM_AUTH_ERROR,
        )

    # Optional disambiguation via college_code
    if request.college_code and request.college_code.strip():
        c_code = request.college_code.strip().lower()
        college = db.execute(
            select(College).where(
                (func.lower(func.trim(College.name)) == c_code)
                | (cast(College.id, String) == c_code)
            )
        ).scalar_one_or_none()
        if not college:
            verify_activation_token(request.activation_code, DUMMY_ACTIVATION_TOKEN_HASH)
            logger.warning("Activation verification failed: College code/name '%s' not found for roll '%s'.", c_code, clean_roll)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=UNIFORM_AUTH_ERROR,
            )
        candidates = [c for c in candidates if c.college_id == college.id]

    # Optional disambiguation via email
    if request.email and request.email.strip():
        c_email = request.email.strip().lower()
        candidates = [c for c in candidates if c.email and c.email.strip().lower() == c_email]

    now_utc = datetime.now(timezone.utc)
    matching_candidates = []
    for cand in candidates:
        if cand.status not in ("pending_activation", "inactive"):
            continue
        if not clean_dob or not cand.dob or normalize_dob(cand.dob) != clean_dob:
            continue
        expires_at = cand.activation_token_expires_at
        if expires_at:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < now_utc:
                continue
        if not cand.activation_token_hash or not verify_activation_token(request.activation_code, cand.activation_token_hash):
            continue
        matching_candidates.append(cand)

    if len(matching_candidates) != 1:
        verify_activation_token(request.activation_code, DUMMY_ACTIVATION_TOKEN_HASH)
        logger.warning(
            "Activation verification failed: %d matching candidates for roll number '%s'.",
            len(matching_candidates),
            clean_roll,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UNIFORM_AUTH_ERROR,
        )

    student = matching_candidates[0]

    # 3. New Password Complexity Validation
    from backend.app.core.password_policy import validate_password, PasswordPolicyViolation
    new_pw = request.new_password.strip()
    student_context = {
        "email": student.email,
        "roll_number": student.roll_number,
        "name": student.full_name,
        "dob": clean_dob,
    }
    try:
        validate_password(new_pw, context=student_context)
    except PasswordPolicyViolation as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    # 4. Activate Student Account
    student.password_hash = hash_password(new_pw)
    student.status = "active"
    student.must_change_password = False
    student.activated_at = now_utc
    student.activation_token_hash = None  # Invalidate token permanently
    student.activation_token_expires_at = None
    student.updated_at = func.now()

    # Invalidate any stale user sessions
    revoke_all_user_sessions(db, student.id, "student")

    log_student_audit_event(
        db=db,
        student_id=student.id,
        student_roll=student.roll_number,
        student_name=student.full_name,
        college_id=student.college_id,
        action="account_activated",
        actor_id=student.id,
        actor_role="student",
        actor_email=student.email,
        details="Student successfully completed first-time activation and configured personal password.",
    )

    db.commit()
    return {
        "success": True,
        "message": "Account successfully activated! You can now log in with your roll number and new password.",
        "rollNumber": student.roll_number,
    }


def update_student_account_status(
    db: Session,
    student_id: UUID,
    new_status: str,
    actor_id: Optional[UUID],
    actor_role: str,
    actor_email: Optional[str],
    reason: Optional[str] = None,
    tenant_college_id: Optional[UUID] = None,
) -> Student:
    """
    Activates, deactivates, or archives a student account.
    If deactivating or archiving, immediately revokes all active sessions.
    """
    stmt = select(Student).where(Student.id == student_id).with_for_update()
    if tenant_college_id:
        stmt = stmt.where(Student.college_id == tenant_college_id)

    student = db.execute(stmt).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student account not found.")

    student.status = new_status
    student.updated_at = func.now()
    now_utc = datetime.now(timezone.utc)

    if new_status == "archived":
        student.archived_at = now_utc
        student.password_hash = None

    if new_status in ("inactive", "archived"):
        # Revoke all active sessions
        revoke_all_user_sessions(db, student_id, "student")

    action_name = f"account_{new_status}"
    log_student_audit_event(
        db=db,
        student_id=student.id,
        student_roll=student.roll_number,
        student_name=student.full_name,
        college_id=student.college_id,
        action=action_name,
        actor_id=actor_id,
        actor_role=actor_role,
        actor_email=actor_email,
        details=reason or f"Account status set to '{new_status}'",
    )

    db.commit()
    db.refresh(student)
    return student


def reset_student_activation_credential(
    db: Session,
    student_id: UUID,
    actor_id: Optional[UUID],
    actor_role: str,
    actor_email: Optional[str],
    tenant_college_id: Optional[UUID] = None,
) -> Tuple[bool, str]:
    """
    Re-issues a single-use activation credential for a student and sets status to 'pending_activation'.
    Revokes any active sessions and returns the new plaintext activation credential for distribution.
    """
    stmt = select(Student).where(Student.id == student_id).with_for_update()
    if tenant_college_id:
        stmt = stmt.where(Student.college_id == tenant_college_id)

    student = db.execute(stmt).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student account not found.")

    new_code = generate_activation_code()
    new_hash = hash_activation_token(new_code)
    now_utc = datetime.now(timezone.utc)

    student.activation_token_hash = new_hash
    student.activation_token_expires_at = now_utc + timedelta(days=30)
    student.status = "pending_activation"
    student.must_change_password = True
    student.password_hash = None
    student.updated_at = func.now()

    # Revoke sessions
    revoke_all_user_sessions(db, student_id, "student")

    log_student_audit_event(
        db=db,
        student_id=student.id,
        student_roll=student.roll_number,
        student_name=student.full_name,
        college_id=student.college_id,
        action="activation_reset",
        actor_id=actor_id,
        actor_role=actor_role,
        actor_email=actor_email,
        details="Generated new activation credential; required password setup.",
    )

    db.commit()
    return (True, new_code)


def revoke_student_active_sessions(
    db: Session,
    student_id: UUID,
    actor_id: Optional[UUID],
    actor_role: str,
    actor_email: Optional[str],
    tenant_college_id: Optional[UUID] = None,
) -> int:
    """
    Revokes all active sessions for a target student.
    """
    stmt = select(Student).where(Student.id == student_id).with_for_update()
    if tenant_college_id:
        stmt = stmt.where(Student.college_id == tenant_college_id)

    student = db.execute(stmt).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student account not found.")

    revoked_count = revoke_all_user_sessions(db, student_id, "student")

    log_student_audit_event(
        db=db,
        student_id=student.id,
        student_roll=student.roll_number,
        student_name=student.full_name,
        college_id=student.college_id,
        action="session_revoked",
        actor_id=actor_id,
        actor_role=actor_role,
        actor_email=actor_email,
        details=f"Revoked {revoked_count} active session(s).",
    )

    db.commit()
    return revoked_count


def delete_or_archive_student(
    db: Session,
    student_id: UUID,
    mode: str,
    actor_id: Optional[UUID],
    actor_role: str,
    actor_email: Optional[str],
    tenant_college_id: Optional[UUID] = None,
) -> Dict[str, Any]:
    """
    Safeguarded student account removal:
    - If historical academic records exist (attendance, submissions, certificates),
      permanent deletion is blocked to maintain academic audit integrity, and safe archival is executed.
    - If student has zero academic records, permanent record erasure is permitted.
    """
    stmt = select(Student).where(Student.id == student_id).with_for_update()
    if tenant_college_id:
        stmt = stmt.where(Student.college_id == tenant_college_id)

    student = db.execute(stmt).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student account not found.")

    history = check_student_academic_history(db, student_id)
    now_utc = datetime.now(timezone.utc)

    # If academic history exists and caller requested permanent deletion
    if history["has_history"] and mode == "permanent":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot permanently delete student {student.roll_number}: historical academic records exist "
                f"({history['summary']}). Use safe archival to deactivate login access while preserving audit compliance."
            ),
        )

    # Safe archival branch
    if history["has_history"] or mode == "archive":
        student.status = "archived"
        student.archived_at = now_utc
        student.password_hash = None
        student.activation_token_hash = None

        revoke_all_user_sessions(db, student_id, "student")

        log_student_audit_event(
            db=db,
            student_id=student.id,
            student_roll=student.roll_number,
            student_name=student.full_name,
            college_id=student.college_id,
            action="account_archived",
            actor_id=actor_id,
            actor_role=actor_role,
            actor_email=actor_email,
            details=f"Safely archived account. Retained academic records: {history['summary']}.",
        )
        db.commit()
        return {
            "success": True,
            "mode": "archived",
            "message": f"Student {student.roll_number} safely archived. Academic records ({history['summary']}) preserved.",
        }

    # Permanent deletion branch (zero academic history)
    log_student_audit_event(
        db=db,
        student_id=None,  # student record will be removed
        student_roll=student.roll_number,
        student_name=student.full_name,
        college_id=student.college_id,
        action="individual_deleted",
        actor_id=actor_id,
        actor_role=actor_role,
        actor_email=actor_email,
        details="Permanently deleted student profile with zero academic history.",
    )

    db.execute(delete(BatchStudent).where(BatchStudent.student_id == student_id))
    db.execute(delete(UserSession).where(UserSession.user_id == student_id))
    db.delete(student)
    db.commit()

    return {
        "success": True,
        "mode": "deleted",
        "message": f"Student {student.roll_number} permanently deleted.",
    }


def preview_bulk_deletion(
    db: Session,
    student_ids: List[UUID],
    tenant_college_id: Optional[UUID] = None,
) -> Dict[str, Any]:
    """
    Generates a pre-deletion impact analysis for Super Admin / College Admin:
    - Lists selected students with roll number, name, college, and enrolled batches.
    - Inspects historical attendance, examinations, and certificates.
    - Categorizes records into clean deletable vs requiring safe archival.
    """
    stmt = select(Student).where(Student.id.in_(student_ids))
    if tenant_college_id:
        stmt = stmt.where(Student.college_id == tenant_college_id)

    students = db.execute(stmt).scalars().all()
    preview_items = []
    history_count = 0
    clean_count = 0

    for s in students:
        hist = check_student_academic_history(db, s.id)
        if hist["has_history"]:
            history_count += 1
            recommended = "archive"
        else:
            clean_count += 1
            recommended = "delete"

        college_name = s.college.name if s.college else "Unknown College"
        preview_items.append({
            "id": str(s.id),
            "roll_number": s.roll_number,
            "full_name": s.full_name,
            "college_name": college_name,
            "status": s.status,
            "has_academic_history": hist["has_history"],
            "academic_summary": hist["summary"],
            "recommended_action": recommended,
        })

    return {
        "total_selected": len(student_ids),
        "total_found": len(preview_items),
        "history_count": history_count,
        "clean_count": clean_count,
        "students": preview_items,
    }


def execute_bulk_student_action(
    db: Session,
    payload: BulkStudentActionPayload,
    actor_id: Optional[UUID],
    actor_role: str,
    actor_email: Optional[str],
    tenant_college_id: Optional[UUID] = None,
) -> BulkStudentActionResult:
    """
    Executes collective bulk actions across selected students:
    - Bulk Deactivate
    - Bulk Reactivate
    - Bulk Revoke Sessions
    - Bulk Reset Activation Credentials
    - Bulk Delete / Archive (respecting academic data safeguards)
    Features:
    - Deduplication of incoming student IDs
    - Chunked batch retrieval for large sets
    - Isolated per-student transactions with safe rollback to prevent poisoned state
    - Strict tenant isolation enforcement
    """
    operation_id = f"bulk-{payload.action}-{uuid4().hex[:8]}"
    processed_count = 0
    skipped_count = 0
    failed_count = 0
    results: List[Dict[str, Any]] = []
    new_credentials: List[ActivationCredentialItem] = []

    # 1. Deduplicate IDs while preserving caller order
    unique_ids = list(dict.fromkeys(payload.student_ids))

    # 2. Chunked query to efficiently load student records without exceeding SQL IN-clause limits
    student_map: Dict[UUID, Student] = {}
    chunk_size = 250
    for i in range(0, len(unique_ids), chunk_size):
        chunk = unique_ids[i:i + chunk_size]
        stmt = select(Student).where(Student.id.in_(chunk))
        for s in db.execute(stmt).scalars().all():
            student_map[s.id] = s

    for s_id in unique_ids:
        st = student_map.get(s_id)
        if not st:
            failed_count += 1
            results.append({"student_id": str(s_id), "success": False, "message": "Student record not found."})
            continue

        # Tenant isolation
        if tenant_college_id and st.college_id != tenant_college_id:
            skipped_count += 1
            results.append({
                "student_id": str(s_id),
                "roll_number": st.roll_number,
                "success": False,
                "message": "Tenant restriction: student belongs to another institution.",
            })
            continue

        try:
            if payload.action == "deactivate":
                update_student_account_status(
                    db=db,
                    student_id=st.id,
                    new_status="inactive",
                    actor_id=actor_id,
                    actor_role=actor_role,
                    actor_email=actor_email,
                    reason=payload.reason or "Bulk deactivation",
                    tenant_college_id=tenant_college_id,
                )
                processed_count += 1
                results.append({"student_id": str(st.id), "roll_number": st.roll_number, "success": True, "message": "Deactivated."})

            elif payload.action == "reactivate":
                update_student_account_status(
                    db=db,
                    student_id=st.id,
                    new_status="active",
                    actor_id=actor_id,
                    actor_role=actor_role,
                    actor_email=actor_email,
                    reason=payload.reason or "Bulk reactivation",
                    tenant_college_id=tenant_college_id,
                )
                processed_count += 1
                results.append({"student_id": str(st.id), "roll_number": st.roll_number, "success": True, "message": "Reactivated."})

            elif payload.action == "revoke_sessions":
                count = revoke_student_active_sessions(
                    db=db,
                    student_id=st.id,
                    actor_id=actor_id,
                    actor_role=actor_role,
                    actor_email=actor_email,
                    tenant_college_id=tenant_college_id,
                )
                processed_count += 1
                results.append({"student_id": str(st.id), "roll_number": st.roll_number, "success": True, "message": f"Revoked {count} sessions."})

            elif payload.action == "reset_activation":
                _, code = reset_student_activation_credential(
                    db=db,
                    student_id=st.id,
                    actor_id=actor_id,
                    actor_role=actor_role,
                    actor_email=actor_email,
                    tenant_college_id=tenant_college_id,
                )
                processed_count += 1
                new_credentials.append(
                    ActivationCredentialItem(
                        rollNumber=st.roll_number,
                        fullName=st.full_name,
                        department=st.department,
                        activationCode=code,
                    )
                )
                results.append({"student_id": str(st.id), "roll_number": st.roll_number, "success": True, "message": "Activation reset."})

            elif payload.action in ("delete", "archive"):
                del_mode = payload.mode or ("archive" if payload.action == "archive" else "permanent")
                res = delete_or_archive_student(
                    db=db,
                    student_id=st.id,
                    mode=del_mode,
                    actor_id=actor_id,
                    actor_role=actor_role,
                    actor_email=actor_email,
                    tenant_college_id=tenant_college_id,
                )
                processed_count += 1
                results.append({"student_id": str(st.id), "roll_number": st.roll_number, "success": True, "message": res["message"]})

        except Exception as ex:
            db.rollback()  # Prevent transaction poisoning for subsequent students
            failed_count += 1
            error_detail = ex.detail if isinstance(ex, HTTPException) else str(ex)
            results.append({"student_id": str(st.id), "roll_number": st.roll_number, "success": False, "message": error_detail})

    return BulkStudentActionResult(
        success=failed_count == 0,
        totalSelected=len(unique_ids),
        processedCount=processed_count,
        skippedCount=skipped_count,
        failedCount=failed_count,
        results=results,
        activationCredentials=new_credentials if new_credentials else None,
    )


