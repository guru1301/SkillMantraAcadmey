"""
Contact & Inquiry Business Service: Lead generation and institutional inquiries.
"""
from typing import Any, Dict, List, Optional
from uuid import UUID
from sqlalchemy import func, select, text, update
from sqlalchemy.orm import Session

from backend.app.db.models import ContactInquiry
from backend.app.schemas.inquiry import ContactInquiryCreate


def create_contact_inquiry(db: Session, data: ContactInquiryCreate) -> ContactInquiry:
    """
    Persists a public institutional lead/inquiry.
    """
    inquiry = ContactInquiry(
        name=data.name.strip(),
        designation=data.designation.strip() if data.designation else None,
        organization=data.organization.strip(),
        email=str(data.email).strip().lower(),
        phone=data.phone.strip(),
        requirement_type=data.requirement_type.strip(),
        area_of_interest=data.area_of_interest.strip() if data.area_of_interest else None,
        message=data.message.strip() if data.message else None,
        status="new",
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry


def list_contact_inquiries(
    db: Session,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
) -> List[ContactInquiry]:
    """
    Retrieves contact inquiries with optional status filtering and text search.
    """
    stmt = select(ContactInquiry)
    if status_filter and status_filter != "all":
        stmt = stmt.where(ContactInquiry.status == status_filter)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            (func.lower(ContactInquiry.name).like(term))
            | (func.lower(ContactInquiry.organization).like(term))
            | (func.lower(ContactInquiry.email).like(term))
        )

    stmt = stmt.order_by(ContactInquiry.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def update_inquiry_status(
    db: Session,
    inquiry_id: UUID,
    status_val: str,
) -> bool:
    """
    Updates the triage status of an inquiry.
    """
    stmt = (
        update(ContactInquiry)
        .where(ContactInquiry.id == inquiry_id)
        .values(status=status_val)
    )
    res = db.execute(stmt)
    db.commit()
    return res.rowcount > 0

