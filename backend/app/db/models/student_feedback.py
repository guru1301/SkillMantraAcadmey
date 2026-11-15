import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import (
    Integer, Text, DateTime, ForeignKey,
    CheckConstraint, UniqueConstraint, Index, text, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.batch import Batch
    from backend.app.db.models.student import Student


class StudentFeedback(Base):
    __tablename__ = "student_feedbacks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("batches.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )
    rating: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    comments: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    batch: Mapped["Batch"] = relationship("Batch", back_populates="feedbacks")
    student: Mapped["Student"] = relationship("Student", back_populates="feedbacks")

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 10", name="chk_student_feedback_rating"),
        UniqueConstraint("batch_id", "student_id", name="unq_student_batch_feedback"),
        Index("idx_student_feedbacks_batch_id", "batch_id"),
        Index("idx_student_feedbacks_student_id", "student_id"),
    )

