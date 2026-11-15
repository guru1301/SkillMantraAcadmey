"""
Batch Business Service: Multi-tenant cohort scheduling and management.
"""
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import delete, func, select, text, update
from sqlalchemy.orm import Session

from backend.app.db.models import Batch, College, Program, BatchStudent, BatchTrainer, TrainingSession, SessionAttendance, Assessment
from backend.app.schemas.batch import BatchCreate, BatchUpdate


def get_batches_list(
    db: Session,
    college_id: Optional[UUID] = None,
    program_id: Optional[UUID] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    trainer_id: Optional[UUID] = None,
    student_id: Optional[UUID] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieves batches matching filters, joining college and program names and computing cohort counts.
    Supports scoping by college_id, trainer_id, and student_id, with optional pagination.
    """
    params: Dict[str, Any] = {}
    where_clauses = ["1=1"]

    if college_id:
        where_clauses.append("b.college_id = :college_id")
        params["college_id"] = college_id

    if program_id:
        where_clauses.append("b.program_id = :program_id")
        params["program_id"] = program_id

    if trainer_id:
        where_clauses.append(
            "b.id IN (SELECT bt_in.batch_id FROM batch_trainers bt_in WHERE bt_in.trainer_id = :trainer_id)"
        )
        params["trainer_id"] = trainer_id

    if student_id:
        where_clauses.append(
            "b.id IN (SELECT bs_in.batch_id FROM batch_students bs_in WHERE bs_in.student_id = :student_id)"
        )
        params["student_id"] = student_id

    if status_filter and status_filter != "all":
        where_clauses.append("b.status = :status_filter")
        params["status_filter"] = status_filter

    if search and search.strip():
        where_clauses.append(
            "(LOWER(b.code) LIKE :search OR LOWER(c.name) LIKE :search OR LOWER(p.name) LIKE :search)"
        )
        params["search"] = f"%{search.strip().lower()}%"

    where_sql = " AND ".join(where_clauses)

    order_and_pagination = "ORDER BY b.start_date DESC, b.created_at DESC"
    if limit is not None:
        order_and_pagination += " LIMIT :limit"
        params["limit"] = limit
    if offset is not None:
        order_and_pagination += " OFFSET :offset"
        params["offset"] = offset

    sql = f"""
        SELECT 
          b.id,
          b.code as code,
          b.code as batch_code,
          p.name as name,
          b.college_id,
          c.name as college_name,
          c.city as college_city,
          b.program_id,
          p.name as program_name,
          b.start_date,
          b.end_date,
          b.target_strength,
          COUNT(DISTINCT bs.id)::int as actual_students_count,
          COUNT(DISTINCT bt.id)::int as trainers_count,
          STRING_AGG(DISTINCT t.full_name, ', ') as assigned_trainers,
          COUNT(DISTINCT ts.id)::int as sessions_count,
          b.status,
          b.created_at,
          b.updated_at
        FROM batches b
        JOIN colleges c ON c.id = b.college_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN batch_students bs ON bs.batch_id = b.id
        LEFT JOIN batch_trainers bt ON bt.batch_id = b.id
        LEFT JOIN trainers t ON t.id = bt.trainer_id
        LEFT JOIN training_sessions ts ON ts.batch_id = b.id
        WHERE {where_sql}
        GROUP BY b.id, c.name, c.city, p.name
        {order_and_pagination}
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]


def get_batch_by_id(
    db: Session,
    batch_id: UUID,
    tenant_college_id: Optional[UUID] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single batch with full relational details. Enforces tenant college scoping if provided.
    """
    params: Dict[str, Any] = {"batch_id": batch_id}
    college_filter = ""
    if tenant_college_id:
        college_filter = "AND b.college_id = :tenant_college_id"
        params["tenant_college_id"] = tenant_college_id

    sql = f"""
        SELECT 
          b.id,
          b.code as code,
          b.code as batch_code,
          p.name as name,
          b.college_id,
          c.name as college_name,
          c.city as college_city,
          b.program_id,
          p.name as program_name,
          b.start_date,
          b.end_date,
          b.target_strength,
          COUNT(DISTINCT bs.id)::int as actual_students_count,
          COUNT(DISTINCT bt.id)::int as trainers_count,
          STRING_AGG(DISTINCT t.full_name, ', ') as assigned_trainers,
          COUNT(DISTINCT ts.id)::int as sessions_count,
          b.status,
          b.created_at,
          b.updated_at
        FROM batches b
        JOIN colleges c ON c.id = b.college_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN batch_students bs ON bs.batch_id = b.id
        LEFT JOIN batch_trainers bt ON bt.batch_id = b.id
        LEFT JOIN trainers t ON t.id = bt.trainer_id
        LEFT JOIN training_sessions ts ON ts.batch_id = b.id
        WHERE b.id = :batch_id {college_filter}
        GROUP BY b.id, c.name, c.city, p.name
    """
    row = db.execute(text(sql), params).mappings().first()
    return dict(row) if row else None


def create_batch(
    db: Session,
    data: BatchCreate,
    creator_id: UUID,
    enforced_college_id: Optional[UUID] = None,
) -> Batch:
    """
    Provisions a new cohort batch with an auto-generated batch code if not provided.
    """
    target_college_id = enforced_college_id or data.college_id
    if not target_college_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="college_id is required to create a batch.",
        )

    # Validate college exists
    college = db.execute(select(College).where(College.id == target_college_id)).scalar_one_or_none()
    if not college:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified college not found.")

    # Validate program exists
    program = db.execute(select(Program).where(Program.id == data.program_id)).scalar_one_or_none()
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified program not found.")

    # Generate batch code if not provided: <COLLEGE_CODE>-<PROGRAM_CODE>-<YEAR>-<COUNT>
    code = data.batch_code
    if not code:
        college_prefix = (college.name[:3]).upper()
        program_prefix = (program.name[:3]).upper()
        year = data.start_date.year
        existing_count = (
            db.execute(
                select(func.count(Batch.id)).where(
                    Batch.college_id == target_college_id,
                    Batch.program_id == data.program_id,
                )
            ).scalar()
            or 0
        )
        code = f"{college_prefix}-{program_prefix}-{year}-{existing_count + 1:02d}"

    batch = Batch(
        college_id=target_college_id,
        program_id=data.program_id,
        code=code,
        created_by=creator_id,
        start_date=data.start_date,
        end_date=data.end_date,
        target_strength=data.target_strength,
        status=data.status,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def update_batch(
    db: Session,
    batch_id: UUID,
    data: BatchUpdate,
    tenant_college_id: Optional[UUID] = None,
) -> Optional[Batch]:
    """
    Updates cohort schedule, target capacity, or name.
    """
    stmt = select(Batch).where(Batch.id == batch_id)
    if tenant_college_id:
        stmt = stmt.where(Batch.college_id == tenant_college_id)

    batch = db.execute(stmt).scalar_one_or_none()
    if not batch:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        if k == "target_strength" and v is not None:
            batch.target_strength = int(v)
        elif k in ("batch_code", "code") and v:
            batch.code = str(v).strip()
        elif k == "name":
            pass
        elif hasattr(batch, k):
            setattr(batch, k, v)

    batch.updated_at = func.now()
    db.commit()
    db.refresh(batch)
    return batch


def set_batch_status(
    db: Session,
    batch_id: UUID,
    status_val: str,
    tenant_college_id: Optional[UUID] = None,
) -> bool:
    """
    Transitions cohort status.
    """
    stmt = update(Batch).where(Batch.id == batch_id)
    if tenant_college_id:
        stmt = stmt.where(Batch.college_id == tenant_college_id)

    stmt = stmt.values(status=status_val, updated_at=func.now())
    result = db.execute(stmt)
    db.commit()
    return result.rowcount > 0


def get_batch_stats(
    db: Session,
    batch_id: UUID,
    tenant_college_id: Optional[UUID] = None,
) -> Dict[str, Any]:
    """
    Calculates detailed metrics for a batch.
    """
    batch = get_batch_by_id(db, batch_id, tenant_college_id=tenant_college_id)
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found.")

    # Attendance rate calculation
    att_sql = text("""
        SELECT 
          COUNT(*)::int as total,
          COUNT(CASE WHEN sa.status IN ('present', 'late') THEN 1 END)::int as attended
        FROM session_attendance sa
        JOIN training_sessions ts ON ts.id = sa.session_id
        WHERE ts.batch_id = :batch_id
    """)
    res = db.execute(att_sql, {"batch_id": batch_id}).mappings().first()
    total = res["total"] if res else 0
    attended = res["attended"] if res else 0
    rate = round((attended / total) * 100.0, 1) if total > 0 else 0.0

    return {
        "batchId": batch_id,
        "batchCode": batch["batch_code"],
        "enrolledStudents": batch["actual_students_count"],
        "assignedTrainers": batch["trainers_count"],
        "totalSessions": batch["sessions_count"],
        "attendancePercentage": rate,
    }


def get_batch_trainers(db: Session, batch_id: UUID) -> List[Dict[str, Any]]:
    """
    Retrieves all trainers assigned to a batch.
    """
    sql = text("""
        SELECT 
          bt.id as assignment_id,
          t.id as trainer_id,
          t.full_name as name,
          t.email,
          t.phone,
          t.status as trainer_status,
          bt.is_lead,
          bt.role,
          bt.created_at as assigned_at
        FROM batch_trainers bt
        JOIN trainers t ON t.id = bt.trainer_id
        WHERE bt.batch_id = :batch_id
        ORDER BY bt.is_lead DESC, bt.created_at ASC, t.full_name ASC
    """)
    rows = db.execute(sql, {"batch_id": batch_id}).mappings().all()
    results = []
    for r in rows:
        d = dict(r)
        d["expertise"] = []
        results.append(d)
    return results


def set_batch_lead_trainer(db: Session, batch_id: UUID, trainer_id: UUID) -> bool:
    """
    Sets the lead trainer for a batch, demoting other trainers.
    """
    existing = db.execute(
        select(BatchTrainer).where(BatchTrainer.batch_id == batch_id, BatchTrainer.trainer_id == trainer_id)
    ).scalar_one_or_none()
    if not existing:
        return False

    db.execute(
        update(BatchTrainer)
        .where(BatchTrainer.batch_id == batch_id)
        .values(is_lead=False, role="Assistant Trainer")
    )
    existing.is_lead = True
    existing.role = "Lead Trainer"
    db.commit()
    return True


def remove_trainer_from_batch(db: Session, batch_id: UUID, trainer_id: UUID) -> bool:
    """
    Removes a trainer assignment from a batch.
    """
    stmt = delete(BatchTrainer).where(BatchTrainer.batch_id == batch_id, BatchTrainer.trainer_id == trainer_id)
    res = db.execute(stmt)
    db.commit()
    return res.rowcount > 0


def remove_student_from_batch(db: Session, batch_id: UUID, student_id: UUID) -> bool:
    """
    Removes a student enrollment from a batch.
    """
    stmt = delete(BatchStudent).where(BatchStudent.batch_id == batch_id, BatchStudent.student_id == student_id)
    res = db.execute(stmt)
    db.commit()
    return res.rowcount > 0


def assign_batch_student_credentials(
    db: Session,
    batch_id: UUID,
    actor_id: Optional[UUID] = None,
    actor_role: Optional[str] = None,
    actor_email: Optional[str] = None,
    password: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Generates unique temporary credentials for each student in the batch.
    Does not accept custom or shared passwords.
    Sets must_change_password = True on all affected students, revokes active sessions,
    and returns a list of student credentials {student_id, roll_number, full_name, temporary_password}.
    """
    from backend.app.core.security import generate_temporary_password, hash_password
    from backend.app.services.auth_service import revoke_all_user_sessions
    from backend.app.services.student_service import log_student_audit_event

    select_sql = text("""
        SELECT s.id, s.roll_number, s.full_name, s.college_id
        FROM students s
        WHERE s.id IN (SELECT student_id FROM batch_students WHERE batch_id = :batch_id)
    """)
    res = db.execute(select_sql, {"batch_id": batch_id})
    students_rows = res.fetchall() if hasattr(res, "fetchall") else []

    update_sql = text("""
        UPDATE students
        SET password_hash = :hash, must_change_password = true, status = 'active', updated_at = NOW()
        WHERE id = :student_id
    """)

    credentials: List[Dict[str, Any]] = []
    for row in students_rows:
        st_id, st_roll, st_name, st_college = row[0], row[1], row[2], row[3]
        temp_pw = generate_temporary_password()
        pw_hash = hash_password(temp_pw)
        db.execute(update_sql, {"hash": pw_hash, "student_id": st_id})
        revoke_all_user_sessions(db, st_id, "student")
        log_student_audit_event(
            db=db,
            student_id=st_id,
            student_roll=st_roll,
            student_name=st_name,
            college_id=st_college,
            action="batch_credentials_assigned",
            actor_id=actor_id,
            actor_role=actor_role or "system",
            actor_email=actor_email,
            details=f"Assigned unique credentials via batch {batch_id}; all active sessions revoked.",
        )
        credentials.append({
            "student_id": st_id,
            "roll_number": st_roll,
            "full_name": st_name,
            "temporary_password": temp_pw,
        })
    db.commit()
    return credentials


def revoke_batch_student_credentials(
    db: Session,
    batch_id: UUID,
    actor_id: Optional[UUID] = None,
    actor_role: Optional[str] = None,
    actor_email: Optional[str] = None,
) -> int:
    """
    Revokes credentials from all students in a batch, revokes all active sessions,
    and writes student_audit_logs entries for each affected student.
    """
    from backend.app.services.auth_service import revoke_all_user_sessions
    from backend.app.services.student_service import log_student_audit_event

    sql = text("""
        UPDATE students
        SET password_hash = NULL, status = 'inactive', updated_at = NOW()
        WHERE id IN (SELECT student_id FROM batch_students WHERE batch_id = :batch_id)
        RETURNING id, roll_number, full_name, college_id
    """)
    res = db.execute(sql, {"batch_id": batch_id})
    affected_rows = res.fetchall()
    for row in affected_rows:
        st_id, st_roll, st_name, st_college = row[0], row[1], row[2], row[3]
        revoke_all_user_sessions(db, st_id, "student")
        log_student_audit_event(
            db=db,
            student_id=st_id,
            student_roll=st_roll,
            student_name=st_name,
            college_id=st_college,
            action="batch_credentials_revoked",
            actor_id=actor_id,
            actor_role=actor_role or "system",
            actor_email=actor_email,
            details=f"Revoked credentials via batch {batch_id}; all active sessions invalidated.",
        )
    db.commit()
    return len(affected_rows) if affected_rows else int(res.rowcount or 0)

