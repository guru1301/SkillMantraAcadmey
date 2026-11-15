import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from sqlalchemy import (
    String, Text, Integer, DateTime, ForeignKey,
    CheckConstraint, UniqueConstraint, Index, text, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.assessment import Assessment
    from backend.app.db.models.student import Student

class AssessmentSubmission(Base):
    __tablename__ = "assessment_submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, server_default="submitted"
    )
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, server_default=func.now()
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, server_default=func.now()
    )
    # Corrected: Migration 015 does NOT specify NOT NULL on answers
    answers: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, server_default=text("'{}'::jsonb")
    )
    # Corrected: Migration 015 does NOT specify NOT NULL on violations_count
    violations_count: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, server_default=text("0")
    )
    shuffled_question_order: Mapped[Optional[List[Any]]] = mapped_column(JSONB, nullable=True)
    version: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("1")
    )

    # Relationships
    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="submissions")
    student: Mapped["Student"] = relationship("Student", back_populates="assessment_submissions")

    __table_args__ = (
        # Reconciled: Migration 013 + Alembic 0008 status check constraint
        CheckConstraint(
            "status IN ('not_started', 'in_progress', 'submitted', 'evaluated', 'overdue', 'pending_review')",
            name="assessment_submissions_status_check",
        ),
        UniqueConstraint("assessment_id", "student_id", name="unq_student_assessment"),
        Index("idx_assessment_submissions_student", "student_id"),
        Index("idx_assessment_submissions_lookup", "assessment_id", "student_id"),
    )
