import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, CheckConstraint, Index, text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.db.base import Base

class ContactInquiry(Base):
    """
    Model for institutional training inquiries and contact submissions.
    Supports persistent storage replacing the previously mocked setTimeout behavior.
    """
    __tablename__ = "contact_inquiries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    designation: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    organization: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    requirement_type: Mapped[str] = mapped_column(String(100), nullable=False)
    area_of_interest: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="new")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('new', 'contacted', 'resolved', 'archived')",
            name="chk_contact_inquiry_status",
        ),
        Index("idx_contact_inquiries_status", "status"),
        Index("idx_contact_inquiries_created_at", created_at.desc()),
    )

