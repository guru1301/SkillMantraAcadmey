"""
College Business Service for Super Admin & College Portal Overview.
"""
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import func, select, text, update
from sqlalchemy.orm import Session

from backend.app.db.models import College, Batch, BatchStudent, BatchTrainer, Program, Student, Trainer, Resource
from backend.app.schemas.college import CollegeCreate, CollegeUpdate


def get_colleges_list(
    db: Session,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    city_filter: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieves colleges matching optional filters, with active batches and enrolled students counts.
    Supports optional pagination.
    """
    sql = """
        SELECT 
          c.id, 
          c.name,
          NULL::text as code,
          c.city, 
          c.state,
          NULL::text as address,
          NULL::text as pincode,
          c.contact_name, 
          c.contact_email, 
          c.contact_phone, 
          c.logo_url, 
          c.status, 
          c.created_at, 
          c.updated_at,
          COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END)::int as active_batches_count,
          COUNT(DISTINCT bs.id)::int as enrolled_students_count
        FROM colleges c
        LEFT JOIN batches b ON b.college_id = c.id
        LEFT JOIN batch_students bs ON bs.batch_id = b.id
        WHERE 1=1
    """
    params: Dict[str, Any] = {}

    if search and search.strip():
        sql += " AND (LOWER(c.name) LIKE :search OR LOWER(COALESCE(c.city, '')) LIKE :search)"
        params["search"] = f"%{search.strip().lower()}%"

    if status_filter and status_filter != "all":
        sql += " AND c.status = :status_filter"
        params["status_filter"] = status_filter

    if city_filter and city_filter != "all":
        sql += " AND LOWER(COALESCE(c.city, '')) = :city_filter"
        params["city_filter"] = city_filter.strip().lower()

    sql += " GROUP BY c.id ORDER BY c.created_at DESC, c.name ASC"
    if limit is not None:
        sql += " LIMIT :limit"
        params["limit"] = limit
    if offset is not None:
        sql += " OFFSET :offset"
        params["offset"] = offset

    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]


def get_distinct_cities(db: Session) -> List[str]:
    """
    Retrieves sorted list of unique non-empty cities where partner colleges are located.
    """
    sql = text("SELECT DISTINCT city FROM colleges WHERE city IS NOT NULL AND city != '' ORDER BY city ASC")
    rows = db.execute(sql).scalars().all()
    return list(rows)


def get_college_by_id(db: Session, college_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single college with batch and student counts.
    """
    sql = """
        SELECT 
          c.id, 
          c.name,
          NULL::text as code,
          c.city, 
          c.state,
          NULL::text as address,
          NULL::text as pincode,
          c.contact_name, 
          c.contact_email, 
          c.contact_phone, 
          c.logo_url, 
          c.status, 
          c.created_at, 
          c.updated_at,
          COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END)::int as active_batches_count,
          COUNT(DISTINCT bs.id)::int as enrolled_students_count
        FROM colleges c
        LEFT JOIN batches b ON b.college_id = c.id
        LEFT JOIN batch_students bs ON bs.batch_id = b.id
        WHERE c.id = :college_id
        GROUP BY c.id
    """
    row = db.execute(text(sql), {"college_id": college_id}).mappings().first()
    return dict(row) if row else None


def get_college_stats(db: Session, college_id: UUID) -> Dict[str, int]:
    """
    Computes college overview statistics matching existing application logic.
    """
    sql = text("""
        SELECT 
          COUNT(DISTINCT b.program_id)::int as programs_count,
          COUNT(DISTINCT b.id)::int as total_batches,
          COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END)::int as active_batches,
          (
            SELECT COUNT(DISTINCT bs.id)::int 
            FROM batch_students bs 
            JOIN batches b2 ON b2.id = bs.batch_id 
            WHERE b2.college_id = :college_id
          ) as enrolled_students,
          (
            SELECT COUNT(DISTINCT bt.trainer_id)::int 
            FROM batch_trainers bt 
            JOIN batches b3 ON b3.id = bt.batch_id 
            WHERE b3.college_id = :college_id
          ) as assigned_trainers
        FROM batches b
        WHERE b.college_id = :college_id
    """)
    res = db.execute(sql, {"college_id": college_id}).mappings().first()
    if not res:
        return {
            "programsCount": 0,
            "activeBatchesCount": 0,
            "totalBatchesCount": 0,
            "enrolledStudentsCount": 0,
            "assignedTrainersCount": 0,
        }
    return {
        "programsCount": res["programs_count"] or 0,
        "activeBatchesCount": res["active_batches"] or 0,
        "totalBatchesCount": res["total_batches"] or 0,
        "enrolledStudentsCount": res["enrolled_students"] or 0,
        "assignedTrainersCount": res["assigned_trainers"] or 0,
    }


def create_college(db: Session, data: CollegeCreate) -> College:
    """
    Creates a new college record.
    """
    college = College(
        name=data.name.strip(),
        city=data.city.strip() if data.city else None,
        state=data.state.strip() if data.state else None,
        contact_name=data.contact_name.strip() if data.contact_name else None,
        contact_email=str(data.contact_email).strip().lower() if data.contact_email else None,
        contact_phone=data.contact_phone.strip() if data.contact_phone else None,
        logo_url=data.logo_url.strip() if data.logo_url else None,
        status=data.status,
    )
    db.add(college)
    db.commit()
    db.refresh(college)
    return college


def update_college(db: Session, college_id: UUID, data: CollegeUpdate) -> Optional[College]:
    """
    Updates an existing college's profile.
    """
    college = db.execute(select(College).where(College.id == college_id)).scalar_one_or_none()
    if not college:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    update_dict.pop("code", None)
    update_dict.pop("address", None)
    update_dict.pop("pincode", None)
    # Never overwrite the non-nullable colleges.status column with NULL
    if update_dict.get("status") is None:
        update_dict.pop("status", None)
    if "contact_email" in update_dict and update_dict["contact_email"]:
        update_dict["contact_email"] = str(update_dict["contact_email"]).strip().lower()

    for k, v in update_dict.items():
        if hasattr(college, k):
            if isinstance(v, str):
                setattr(college, k, v.strip())
            else:
                setattr(college, k, v)

    college.updated_at = func.now()
    db.commit()
    db.refresh(college)
    return college


def set_college_status(db: Session, college_id: UUID, status_val: str) -> bool:
    """
    Activates or deactivates a college.
    """
    stmt = (
        update(College)
        .where(College.id == college_id)
        .values(status=status_val, updated_at=func.now())
    )
    result = db.execute(stmt)
    db.commit()
    return result.rowcount > 0


def get_college_portal_data(db: Session, college_id: UUID) -> Dict[str, Any]:
    """
    Retrieves complete multi-tenant scoped overview for a college administrator.
    """
    college = db.execute(
        select(College).where(College.id == college_id, College.status == "active")
    ).scalar_one_or_none()

    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found or is currently inactive.",
        )

    # 1. Batches
    batches_sql = text("""
        SELECT 
           b.id,
           b.code as code,
           b.code as batch_code,
           p.name as program_name,
           b.start_date::text as start_date,
           b.end_date::text as end_date,
           b.target_strength,
           b.status,
           COUNT(DISTINCT bs.id)::int as enrolled_count,
           COUNT(DISTINCT bt.id)::int as trainers_count
        FROM batches b
        JOIN programs p ON p.id = b.program_id
        LEFT JOIN batch_students bs ON bs.batch_id = b.id
        LEFT JOIN batch_trainers bt ON bt.batch_id = b.id
        WHERE b.college_id = :college_id
        GROUP BY b.id, p.name
        ORDER BY b.start_date DESC, b.created_at DESC
    """)
    batches = [dict(r) for r in db.execute(batches_sql, {"college_id": college_id}).mappings().all()]

    # 2. Trainers
    trainers_sql = text("""
        SELECT DISTINCT
           t.id,
           t.full_name,
           t.full_name as name,
           t.email,
           t.phone,
           t.skills,
           b.code as batch_code,
           bt.is_lead,
           bt.role,
           t.status
        FROM batch_trainers bt
        JOIN batches b ON b.id = bt.batch_id
        JOIN trainers t ON t.id = bt.trainer_id
        WHERE b.college_id = :college_id
        ORDER BY t.full_name ASC
    """)
    trainers = [dict(r) for r in db.execute(trainers_sql, {"college_id": college_id}).mappings().all()]

    # 3. Students
    students_sql = text("""
        SELECT DISTINCT
           s.id,
           s.roll_number,
           s.full_name,
           s.full_name as name,
           s.email,
           s.phone,
           s.department,
           b.code as batch_code,
           bs.enrolled_at::text as enrolled_at
        FROM batch_students bs
        JOIN batches b ON b.id = bs.batch_id
        JOIN students s ON s.id = bs.student_id
        WHERE b.college_id = :college_id
        ORDER BY s.roll_number ASC
    """)
    students = [dict(r) for r in db.execute(students_sql, {"college_id": college_id}).mappings().all()]

    # 4. Resources
    resources_sql = text("""
        SELECT 
           r.id,
           r.name,
           r.name as title,
           r.type,
           r.url,
           r.description,
           b.code as batch_code
        FROM resources r
        JOIN batches b ON b.id = r.batch_id
        WHERE b.college_id = :college_id
        ORDER BY r.created_at DESC
    """)
    resources = [dict(r) for r in db.execute(resources_sql, {"college_id": college_id}).mappings().all()]

    # 5. Stats
    stats = {
        "totalBatches": len(batches),
        "activeBatches": sum(1 for b in batches if b["status"] == "active"),
        "totalStudents": len(students),
        "totalTrainers": len(trainers),
        "totalPrograms": len(set(b["program_name"] for b in batches)),
    }

    return {
        "college": {
            "id": college.id,
            "name": college.name,
            "city": college.city,
            "state": college.state,
            "contact_name": college.contact_name,
            "contact_email": college.contact_email,
            "contact_phone": college.contact_phone,
        },
        "stats": stats,
        "batches": batches,
        "trainers": trainers,
        "students": students,
        "resources": resources,
    }

