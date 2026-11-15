import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Index, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.db.base import Base


class StudentAuditLog(Base):
    """
    Auditing student account lifecycle events:
    - account_created
    - account_activated
    - activation_reset
    - password_changed
    - account_deactivated
    - account_reactivated
    - individual_deleted
    - bulk_deleted
    - account_archived
    - session_revoked
    """
    __tablename__ = "student_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    student_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("students.id", ondelete="SET NULL"),
        nullable=True,
    )
    student_roll: Mapped[str] = mapped_column(String(100), nullable=False)
    student_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    college_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    actor_role: Mapped[str] = mapped_column(String(50), nullable=False, server_default="system")
    actor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    operation_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        Index("idx_student_audit_logs_student_id", "student_id"),
        Index("idx_student_audit_logs_student_roll", "student_roll"),
        Index("idx_student_audit_logs_action", "action"),
        Index("idx_student_audit_logs_college_id", "college_id"),
        Index("idx_student_audit_logs_created_at", "created_at"),
    )

