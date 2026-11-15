"""
Trainer Business Service: Trainer registry, batch assignment, and portal data.
"""
from typing import Any, Dict, List, Optional, Union
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from backend.app.core.security import hash_password
from backend.app.core.password_policy import validate_password, PasswordPolicyViolation
from backend.app.db.models import Trainer, BatchTrainer, Batch, College, Program
from backend.app.schemas.trainer import TrainerAdminUpdate, TrainerCreate, TrainerSelfUpdate, TrainerUpdate
from backend.app.services.auth_service import revoke_all_user_sessions


def get_trainers_list(
    db: Session,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    college_id: Optional[UUID] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieves registered trainers with assigned batch counts.
    When college_id is provided, restricts both trainers and batch counts strictly
    to batches belonging to that college.
    """
    params: Dict[str, Any] = {}
    where_clauses = ["1=1"]

    if college_id is not None:
        batch_join = """
        JOIN batch_trainers bt ON bt.trainer_id = t.id
        JOIN batches b ON b.id = bt.batch_id
        """
        where_clauses.append("b.college_id = :college_id")
        params["college_id"] = college_id
    else:
        batch_join = "LEFT JOIN batch_trainers bt ON bt.trainer_id = t.id"

    if status_filter and status_filter != "all":
        where_clauses.append("t.status = :status_filter")
        params["status_filter"] = status_filter

    if search and search.strip():
        where_clauses.append(
            "(LOWER(t.full_name) LIKE :search OR LOWER(COALESCE(t.email, '')) LIKE :search)"
        )
        params["search"] = f"%{search.strip().lower()}%"

    where_sql = " AND ".join(where_clauses)

    order_and_pagination = "ORDER BY t.created_at DESC, t.full_name ASC"
    if limit is not None:
        order_and_pagination += " LIMIT :limit"
        params["limit"] = limit
    if offset is not None:
        order_and_pagination += " OFFSET :offset"
        params["offset"] = offset

    sql = f"""
        SELECT 
          t.id,
          t.full_name as name,
          t.email,
          t.phone,
          t.skills as bio,
          t.status,
          t.created_at,
          t.updated_at,
          COUNT(DISTINCT bt.batch_id)::int as assigned_batches_count
        FROM trainers t
        {batch_join}
        WHERE {where_sql}
        GROUP BY t.id
        {order_and_pagination}
    """
    rows = db.execute(text(sql), params).mappings().all()
    results = []
    for r in rows:
        d = dict(r)
        d["expertise"] = [s.strip() for s in d["bio"].split(",")] if d.get("bio") else []
        results.append(d)
    return results


def get_trainer_by_id(
    db: Session,
    trainer_id: UUID,
    college_id: Optional[UUID] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retrieves single trainer along with active and historical batch assignments.
    When college_id is provided, requires the trainer to have at least one batch
    in that college (else 403) and filters assigned_batches to that college only.
    """
    params: Dict[str, Any] = {"trainer_id": trainer_id}
    if college_id is not None:
        params["college_id"] = college_id
        sql = text("""
            SELECT 
              t.id,
              t.full_name as name,
              t.email,
              t.phone,
              t.skills as bio,
              t.status,
              t.created_at,
              t.updated_at,
              COUNT(DISTINCT b.id)::int as assigned_batches_count
            FROM trainers t
            LEFT JOIN batch_trainers bt ON bt.trainer_id = t.id
            LEFT JOIN batches b ON b.id = bt.batch_id AND b.college_id = :college_id
            WHERE t.id = :trainer_id
            GROUP BY t.id
        """)
    else:
        sql = text("""
            SELECT 
              t.id,
              t.full_name as name,
              t.email,
              t.phone,
              t.skills as bio,
              t.status,
              t.created_at,
              t.updated_at,
              COUNT(DISTINCT bt.batch_id)::int as assigned_batches_count
            FROM trainers t
            LEFT JOIN batch_trainers bt ON bt.trainer_id = t.id
            WHERE t.id = :trainer_id
            GROUP BY t.id
        """)

    trainer_row = db.execute(sql, params).mappings().first()
    if not trainer_row:
        return None

    if college_id is not None and (trainer_row.get("assigned_batches_count") or 0) == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant isolation violation: Trainer is not assigned to your college.",
        )

    trainer_dict = dict(trainer_row)
    trainer_dict["expertise"] = [s.strip() for s in trainer_dict["bio"].split(",")] if trainer_dict.get("bio") else []

    college_filter_sql = "AND b.college_id = :college_id" if college_id is not None else ""
    batches_sql = text(f"""
        SELECT 
          b.id as batch_id,
          b.code as batch_code,
          c.name as college_name,
          p.name as program_name,
          b.start_date::text as start_date,
          b.end_date::text as end_date,
          b.status as batch_status,
          bt.is_lead,
          bt.role,
          bt.assigned_at::text as assigned_at
        FROM batch_trainers bt
        JOIN batches b ON b.id = bt.batch_id
        JOIN colleges c ON c.id = b.college_id
        JOIN programs p ON p.id = b.program_id
        WHERE bt.trainer_id = :trainer_id
        {college_filter_sql}
        ORDER BY b.start_date DESC
    """)
    assigned_batches = [dict(r) for r in db.execute(batches_sql, params).mappings().all()]
    trainer_dict["assigned_batches"] = assigned_batches
    return trainer_dict


def create_trainer(db: Session, data: TrainerCreate) -> Trainer:
    """
    Registers a new trainer.
    """
    clean_email = str(data.email).strip().lower()

    if data.password:
        try:
            validate_password(data.password, context={"email": clean_email, "name": data.name})
        except PasswordPolicyViolation as e:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    from backend.app.services.auth_service import check_email_unique_globally
    check_email_unique_globally(db, clean_email)

    pw_hash = hash_password(data.password) if data.password else None
    skills_text = ", ".join(data.expertise) if data.expertise else data.bio

    trainer = Trainer(
        full_name=data.name.strip(),
        email=clean_email,
        phone=data.phone.strip() if data.phone else None,
        skills=skills_text.strip() if skills_text else None,
        password_hash=pw_hash,
        status=data.status,
        must_change_password=True if pw_hash else False,
    )
    db.add(trainer)
    db.commit()
    db.refresh(trainer)
    return trainer


def update_trainer(
    db: Session,
    trainer_id: UUID,
    data: Union[TrainerSelfUpdate, TrainerAdminUpdate],
) -> Optional[Trainer]:
    """
    Updates trainer profile. When called by an admin updating status or password,
    revokes all active sessions for that trainer.
    """
    trainer = db.execute(select(Trainer).where(Trainer.id == trainer_id)).scalar_one_or_none()
    if not trainer:
        return None

    old_status = trainer.status
    password_updated = False
    status_supplied = False
    update_dict = data.model_dump(exclude_unset=True)

    # Defense-in-depth: strip privileged fields if schema is TrainerSelfUpdate
    if isinstance(data, TrainerSelfUpdate):
        for forbidden in ("status", "email", "password", "password_hash"):
            update_dict.pop(forbidden, None)

    if "email" in update_dict:
        email_val = update_dict.pop("email")
        if email_val:
            clean_email = str(email_val).strip().lower()
            from backend.app.services.auth_service import check_email_unique_globally
            check_email_unique_globally(db, clean_email, exclude_user_id=trainer_id)
            trainer.email = clean_email
    if "full_name" in update_dict:
        fn_val = update_dict.pop("full_name")
        if fn_val:
            trainer.full_name = fn_val.strip()
    if "name" in update_dict:
        name_val = update_dict.pop("name")
        if name_val:
            trainer.full_name = name_val.strip()
    if "password" in update_dict:
        pw_val = update_dict.pop("password")
        if pw_val:
            try:
                validate_password(pw_val, context={"email": trainer.email, "name": trainer.full_name})
            except PasswordPolicyViolation as e:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
            trainer.password_hash = hash_password(pw_val)
            trainer.must_change_password = True
            password_updated = True
    if "skills" in update_dict:
        skills_val = update_dict.pop("skills")
        if isinstance(skills_val, list):
            trainer.skills = ", ".join(str(s).strip() for s in skills_val if str(s).strip())
        elif isinstance(skills_val, str):
            trainer.skills = skills_val.strip()
        elif skills_val is None:
            trainer.skills = None
    if "expertise" in update_dict:
        exp_val = update_dict.pop("expertise")
        if exp_val is not None:
            trainer.skills = ", ".join(str(s).strip() for s in exp_val if str(s).strip())
    if "bio" in update_dict:
        bio_val = update_dict.pop("bio")
        if bio_val is not None and not trainer.skills:
            trainer.skills = str(bio_val).strip()
        elif bio_val and "skills" not in data.model_dump(exclude_unset=True) and "expertise" not in data.model_dump(exclude_unset=True):
            trainer.skills = str(bio_val).strip()

    if "status" in update_dict:
        status_supplied = True

    allowed_direct_fields = {"phone", "status"} if not isinstance(data, TrainerSelfUpdate) else {"phone"}
    for k, v in update_dict.items():
        if k in allowed_direct_fields and hasattr(trainer, k):
            setattr(trainer, k, v.strip() if isinstance(v, str) else v)

    if password_updated or (status_supplied and (trainer.status != old_status or trainer.status != "active")):
        revoke_all_user_sessions(db, trainer.id, "trainer")

    trainer.updated_at = func.now()
    db.commit()
    db.refresh(trainer)
    return trainer


def assign_trainer_to_batch(
    db: Session,
    batch_id: UUID,
    trainer_id: UUID,
    role: str = "Lead Trainer",
    is_lead: bool = False,
    tenant_college_id: Optional[UUID] = None,
) -> BatchTrainer:
    """
    Assigns a trainer to a batch.
    Validates batch exists, trainer exists, and enforces partial unique index:
    At most one lead trainer per batch.
    """
    # 1. Validate batch
    batch_stmt = select(Batch).where(Batch.id == batch_id)
    if tenant_college_id:
        batch_stmt = batch_stmt.where(Batch.college_id == tenant_college_id)
    batch = db.execute(batch_stmt).scalar_one_or_none()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found or not accessible within your institution.",
        )

    # 2. Validate trainer exists and is active
    trainer = db.execute(select(Trainer).where(Trainer.id == trainer_id)).scalar_one_or_none()
    if not trainer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainer not found.")
    if getattr(trainer, "status", None) != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive trainer cannot be assigned to a batch.",
        )

    # 3. Check for lead trainer constraint
    if is_lead:
        existing_lead = db.execute(
            select(BatchTrainer).where(
                BatchTrainer.batch_id == batch_id,
                BatchTrainer.is_lead == True,
                BatchTrainer.trainer_id != trainer_id,
            )
        ).scalar_one_or_none()
        if existing_lead:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This batch already has a designated lead trainer. Demote the current lead first.",
            )

    # 4. Check for duplicate assignment
    existing_assignment = db.execute(
        select(BatchTrainer).where(
            BatchTrainer.batch_id == batch_id,
            BatchTrainer.trainer_id == trainer_id,
        )
    ).scalar_one_or_none()

    if existing_assignment:
        existing_assignment.role = role
        existing_assignment.is_lead = is_lead
        db.commit()
        db.refresh(existing_assignment)
        return existing_assignment

    assignment = BatchTrainer(
        batch_id=batch_id,
        trainer_id=trainer_id,
        role=role,
        is_lead=is_lead,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def get_trainer_assigned_batches(db: Session, trainer_id: UUID) -> List[Dict[str, Any]]:
    """
    Retrieves all batches assigned to the current trainer with schedule, cohort progress, and today's live session status.
    """
    sql = text("""
        SELECT 
          b.id,
          b.id as batch_id,
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
          b.status as batch_status,
          bt.role,
          bt.is_lead,
          COUNT(DISTINCT bs.id)::int as enrolled_count,
          COUNT(DISTINCT bs.id)::int as students_count,
          COUNT(DISTINCT ts.id)::int as total_sessions,
          COUNT(DISTINCT CASE WHEN ts.status = 'completed' THEN ts.id END)::int as completed_sessions,
          EXISTS(
            SELECT 1 FROM training_sessions ts2 
            WHERE ts2.batch_id = b.id AND ts2.date = CURRENT_DATE AND ts2.status = 'completed'
          ) as today_marked,
          (
            SELECT ts3.id FROM training_sessions ts3 
            WHERE ts3.batch_id = b.id AND ts3.date = CURRENT_DATE 
            ORDER BY ts3.created_at DESC LIMIT 1
          ) as today_session_id,
          (
            SELECT COUNT(*)::int FROM session_attendance sa 
            JOIN training_sessions ts4 ON ts4.id = sa.session_id 
            WHERE ts4.batch_id = b.id AND ts4.date = CURRENT_DATE AND sa.status = 'present'
          ) as today_present_count
        FROM batch_trainers bt
        JOIN batches b ON b.id = bt.batch_id
        JOIN colleges c ON c.id = b.college_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN batch_students bs ON bs.batch_id = b.id
        LEFT JOIN training_sessions ts ON ts.batch_id = b.id
        WHERE bt.trainer_id = :trainer_id
        GROUP BY b.id, b.code, c.name, c.city, p.name, bt.is_lead, bt.role
        ORDER BY b.start_date DESC, b.code ASC
    """)
    rows = db.execute(sql, {"trainer_id": trainer_id}).mappings().all()
    return [dict(r) for r in rows]


def get_trainer_batches_with_rosters(db: Session, trainer_id: UUID) -> List[Dict[str, Any]]:
    batches = get_trainer_assigned_batches(db, trainer_id)
    if not batches:
        return []
    batch_ids = [b["id"] for b in batches]
    students_sql = text("""
        SELECT 
           st.id as student_id,
           bs.batch_id,
           st.roll_number,
           st.full_name,
           st.email,
           st.department,
           st.phone
        FROM batch_students bs
        JOIN students st ON st.id = bs.student_id
        WHERE bs.batch_id = ANY(:batch_ids)
        ORDER BY st.roll_number ASC, st.full_name ASC
    """)
    students_rows = db.execute(students_sql, {"batch_ids": batch_ids}).mappings().all()
    students_by_batch: Dict[Any, List[Any]] = {}
    for s in students_rows:
        b_id = s["batch_id"]
        if b_id not in students_by_batch:
            students_by_batch[b_id] = []
        students_by_batch[b_id].append(dict(s))

    result = []
    for b in batches:
        b_copy = dict(b)
        b_copy["students"] = students_by_batch.get(b["id"], [])
        result.append(b_copy)
    return result


def get_trainer_recent_sessions(db: Session, trainer_id: UUID, limit: int = 10) -> List[Dict[str, Any]]:
    sql = text("""
        SELECT 
           ts.id as session_id,
           ts.batch_id,
           b.code as batch_code,
           c.name as college_name,
           p.name as program_name,
           ts.date::text as date,
           ts.title,
           ts.topic,
           COUNT(sa.id)::int as total_students,
           COUNT(CASE WHEN sa.status = 'present' THEN 1 END)::int as present_count,
           COUNT(CASE WHEN sa.status = 'absent' THEN 1 END)::int as absent_count,
           COUNT(CASE WHEN sa.status = 'late' THEN 1 END)::int as late_count,
           CASE 
             WHEN COUNT(sa.id) > 0 THEN ROUND((COUNT(CASE WHEN sa.status = 'present' THEN 1 END)::numeric / COUNT(sa.id)::numeric) * 100)::int 
             ELSE 0 
           END as attendance_rate,
           ts.updated_at::text as updated_at
        FROM training_sessions ts
        JOIN batches b ON b.id = ts.batch_id
        JOIN batch_trainers bt ON bt.batch_id = b.id AND bt.trainer_id = :trainer_id
        JOIN colleges c ON c.id = b.college_id
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN session_attendance sa ON sa.session_id = ts.id
        WHERE ts.status = 'completed'
        GROUP BY ts.id, b.code, c.name, p.name, ts.date, ts.title, ts.topic, ts.updated_at
        ORDER BY ts.date DESC, ts.updated_at DESC
        LIMIT :limit
    """)
    rows = db.execute(sql, {"trainer_id": trainer_id, "limit": limit}).mappings().all()
    return [dict(r) for r in rows]


def get_available_trainers_for_batch(
    db: Session,
    batch_id: UUID,
    include_contact_pii: bool = True,
) -> List[Dict[str, Any]]:
    """
    Retrieves active trainers not currently assigned to a given batch.
    When include_contact_pii is False (for college_admin), returns only id, full_name,
    and skills without querying or exposing email or phone.
    """
    if not include_contact_pii:
        sql = text("""
            SELECT 
              id, 
              full_name, 
              skills
            FROM trainers
            WHERE status = 'active'
              AND id NOT IN (SELECT trainer_id FROM batch_trainers WHERE batch_id = :batch_id)
            ORDER BY full_name ASC
        """)
        rows = db.execute(sql, {"batch_id": batch_id}).mappings().all()
        return [
            {
                "id": r["id"],
                "full_name": r["full_name"],
                "skills": r["skills"],
            }
            for r in rows
        ]

    sql = text("""
        SELECT 
          id, 
          full_name as name, 
          email, 
          phone, 
          skills, 
          status,
          created_at,
          updated_at
        FROM trainers
        WHERE status = 'active'
          AND id NOT IN (SELECT trainer_id FROM batch_trainers WHERE batch_id = :batch_id)
        ORDER BY full_name ASC
    """)
    rows = db.execute(sql, {"batch_id": batch_id}).mappings().all()
    results = []
    for r in rows:
        d = dict(r)
        d["expertise"] = [s.strip() for s in d["skills"].split(",")] if d.get("skills") else []
        d["assigned_batches_count"] = 0
        results.append(d)
    return results

