"""
Resource Business Service: Learning materials and Google Drive / Document attachments.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from backend.app.db.models import Resource, BatchStudent
from backend.app.schemas.resource import ResourceCreate, ResourceUpdate


def create_resource(
    db: Session,
    data: ResourceCreate,
    creator_id: Optional[UUID] = None,
) -> Resource:
    """
    Adds courseware or resource link to a batch.
    """
    resource_title = data.title if hasattr(data, "title") and data.title else getattr(data, "name", "")
    resource = Resource(
        batch_id=data.batch_id,
        name=resource_title.strip(),
        description=data.description.strip() if data.description else None,
        type=data.type,
        url=data.url.strip(),
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


def update_resource(
    db: Session,
    resource_id: UUID,
    data: ResourceUpdate,
) -> Optional[Resource]:
    """
    Updates an existing resource item.
    """
    resource = db.execute(select(Resource).where(Resource.id == resource_id)).scalar_one_or_none()
    if not resource:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        attr_name = "name" if k == "title" else k
        if isinstance(v, str):
            setattr(resource, attr_name, v.strip())
        else:
            setattr(resource, attr_name, v)

    db.commit()
    db.refresh(resource)
    return resource


def list_resources_for_batch(db: Session, batch_id: UUID) -> List[Resource]:
    """
    Retrieves resources associated with a batch.
    """
    stmt = select(Resource).where(Resource.batch_id == batch_id).order_by(Resource.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def list_resources_for_student(db: Session, student_id: UUID) -> List[dict]:
    """
    Retrieves all resources across batches the student is enrolled in.
    """
    sql = text("""
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
        JOIN batch_students bs ON bs.batch_id = b.id
        WHERE bs.student_id = :student_id
        ORDER BY r.created_at DESC
    """)
    rows = db.execute(sql, {"student_id": student_id}).mappings().all()
    return [dict(r) for r in rows]

