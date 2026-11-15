"""
Program Business Service for Course & Curriculum Management.
"""
from typing import Any, Dict, List, Optional
from uuid import UUID
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from backend.app.db.models import Program, Batch
from backend.app.schemas.program import ProgramCreate, ProgramUpdate


def is_trainer_linked_to_college(db: Session, trainer_id: UUID, college_id: UUID) -> bool:
    """Returns True if the trainer is assigned to at least one batch in college_id."""
    sql = """
        SELECT 1
        FROM batch_trainers bt
        JOIN batches b ON b.id = bt.batch_id
        WHERE bt.trainer_id = :trainer_id
          AND b.college_id = :college_id
        LIMIT 1
    """
    return db.execute(text(sql), {"trainer_id": trainer_id, "college_id": college_id}).first() is not None


def get_programs_list(
    db: Session,
    status_filter: Optional[str] = None,
    college_id: Optional[UUID] = None,
    trainer_id: Optional[UUID] = None,
    student_id: Optional[UUID] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieves programs with tenant/actor-scoped batches_count.
    """
    params: Dict[str, Any] = {}
    where_clauses = ["1=1"]
    joins = ["LEFT JOIN batches b ON b.program_id = p.id"]

    if status_filter and status_filter != "all":
        where_clauses.append("p.status = :status_filter")
        params["status_filter"] = status_filter

    if college_id is not None:
        where_clauses.append("b.college_id = :college_id")
        params["college_id"] = college_id

    if trainer_id is not None:
        joins.append("JOIN batch_trainers bt ON bt.batch_id = b.id")
        where_clauses.append("bt.trainer_id = :trainer_id")
        params["trainer_id"] = trainer_id

    if student_id is not None:
        joins.append("JOIN batch_students bs ON bs.batch_id = b.id")
        where_clauses.append("bs.student_id = :student_id")
        params["student_id"] = student_id

    joins_sql = "\n        ".join(joins)
    where_sql = " AND ".join(where_clauses)

    sql = f"""
        SELECT 
          p.id, 
          p.name,
          NULL::text as code,
          p.description, 
          p.duration_days, 
          '[]'::jsonb as modules,
          p.progress_weights,
          p.status, 
          p.created_at, 
          p.updated_at,
          COUNT(DISTINCT b.id)::int as batches_count
        FROM programs p
        {joins_sql}
        WHERE {where_sql}
        GROUP BY p.id
        ORDER BY p.name ASC
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]


def get_program_by_id(
    db: Session,
    program_id: UUID,
    college_id: Optional[UUID] = None,
    trainer_id: Optional[UUID] = None,
    student_id: Optional[UUID] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single program with batches_count scoped to the caller's tenant/actor context.
    """
    params: Dict[str, Any] = {"program_id": program_id}
    batch_joins: List[str] = []
    batch_wheres = ["1=1"]

    if college_id is not None:
        batch_wheres.append("b.college_id = :college_id")
        params["college_id"] = college_id

    if trainer_id is not None:
        batch_joins.append("JOIN batch_trainers bt ON bt.batch_id = b.id")
        batch_wheres.append("bt.trainer_id = :trainer_id")
        params["trainer_id"] = trainer_id

    if student_id is not None:
        batch_joins.append("JOIN batch_students bs ON bs.batch_id = b.id")
        batch_wheres.append("bs.student_id = :student_id")
        params["student_id"] = student_id

    batch_join_sql = "\n              ".join(batch_joins)
    batch_where_sql = " AND ".join(batch_wheres)

    sql = f"""
        SELECT 
          p.id, 
          p.name,
          NULL::text as code,
          p.description, 
          p.duration_days, 
          '[]'::jsonb as modules,
          p.progress_weights,
          p.status, 
          p.created_at, 
          p.updated_at,
          COUNT(DISTINCT scoped_b.id)::int as batches_count
        FROM programs p
        LEFT JOIN (
            SELECT DISTINCT b.id, b.program_id
            FROM batches b
            {batch_join_sql}
            WHERE {batch_where_sql}
        ) scoped_b ON scoped_b.program_id = p.id
        WHERE p.id = :program_id
        GROUP BY p.id
    """
    row = db.execute(text(sql), params).mappings().first()
    return dict(row) if row else None


def create_program(db: Session, data: ProgramCreate) -> Program:
    """
    Creates a new program curriculum.
    """
    program = Program(
        name=data.name.strip(),
        description=data.description.strip() if data.description else None,
        duration_days=data.duration_days,
        progress_weights=data.progress_weights,
        status=data.status,
    )
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


def update_program(db: Session, program_id: UUID, data: ProgramUpdate) -> Optional[Program]:
    """
    Updates an existing program curriculum.
    """
    program = db.execute(select(Program).where(Program.id == program_id)).scalar_one_or_none()
    if not program:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    update_dict.pop("code", None)
    update_dict.pop("modules", None)

    for k, v in update_dict.items():
        if isinstance(v, str):
            setattr(program, k, v.strip())
        else:
            setattr(program, k, v)

    program.updated_at = func.now()
    db.commit()
    db.refresh(program)
    return program


def delete_program(db: Session, program_id: UUID) -> tuple[bool, Optional[str]]:
    """
    Deletes a program curriculum. Fails if active batches are assigned to this program.
    """
    program = db.execute(select(Program).where(Program.id == program_id)).scalar_one_or_none()
    if not program:
        return False, "Program not found."

    batches_count = db.execute(
        select(func.count(Batch.id)).where(Batch.program_id == program_id)
    ).scalar() or 0

    if batches_count > 0:
        return False, f"Cannot delete program: {batches_count} batches are actively assigned to it."

    db.delete(program)
    db.commit()
    return True, None


