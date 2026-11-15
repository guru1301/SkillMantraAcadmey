import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String, DateTime, Float, ForeignKey, Index, text, func, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.student import Student
    from backend.app.db.models.batch import Batch
    from backend.app.db.models.program import Program
    from backend.app.db.models.college import College

class Certificate(Base):
    """
    Master Certificate Record.
    Persists officially issued credentials with cryptographic verification codes.
    """
    __tablename__ = "certificates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    certificate_number: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("batches.id", ondelete="CASCADE"),
        nullable=False,
    )
    program_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programs.id", ondelete="CASCADE"),
        nullable=False,
    )
    college_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("colleges.id", ondelete="RESTRICT"),
        nullable=False,
    )
    student_name: Mapped[str] = mapped_column(String(255), nullable=False)
    student_roll: Mapped[str] = mapped_column(String(100), nullable=False)
    college_name: Mapped[str] = mapped_column(String(255), nullable=False)
    program_name: Mapped[str] = mapped_column(String(255), nullable=False)
    attendance_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    verification_code: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="active"
    )
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    student: Mapped["Student"] = relationship("Student")
    batch: Mapped["Batch"] = relationship("Batch")
    program: Mapped["Program"] = relationship("Program")
    college: Mapped["College"] = relationship("College")

    __table_args__ = (
        UniqueConstraint("student_id", "batch_id", name="unq_certificate_student_batch"),
        Index("idx_certificates_student_id", "student_id"),
        Index("idx_certificates_batch_id", "batch_id"),
        Index("idx_certificates_college_id", "college_id"),
        Index("idx_certificates_verification_code", "verification_code"),
    )

