import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlalchemy import (
    String, Text, Integer, Boolean, DateTime, ForeignKey,
    CheckConstraint, Index, text, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.batch import Batch
    from backend.app.db.models.trainer import Trainer
    from backend.app.db.models.assessment_submission import AssessmentSubmission
    from backend.app.db.models.exam_proctoring_event import ExamProctoringEvent

class Assessment(Base):
    __tablename__ = "assessments"

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
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, server_default="quiz")
    topic: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("30"))
    total_marks: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("100"))
    passing_marks: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("50"))
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="published")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Added in Migration 015
    trainer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trainers.id", ondelete="SET NULL"),
        nullable=True,
    )
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    shuffle_questions: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    anti_cheat_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    questions: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, server_default=text("'[]'::jsonb")
    )

    # Relationships
    batch: Mapped["Batch"] = relationship("Batch", back_populates="assessments")
    trainer: Mapped[Optional["Trainer"]] = relationship("Trainer", back_populates="assessments")
    submissions: Mapped[List["AssessmentSubmission"]] = relationship(
        "AssessmentSubmission", back_populates="assessment", cascade="all, delete-orphan"
    )
    proctoring_events: Mapped[List["ExamProctoringEvent"]] = relationship(
        "ExamProctoringEvent", back_populates="assessment", cascade="all, delete-orphan"
    )

    @property
    def is_published(self) -> bool:
        return self.status == "published"

    @property
    def created_by(self) -> Optional[uuid.UUID]:
        return self.trainer_id

    @created_by.setter
    def created_by(self, value: Optional[uuid.UUID]) -> None:
        self.trainer_id = value

    @property
    def end_time(self) -> Optional[datetime]:
        return self.deadline or self.due_date

    @end_time.setter
    def end_time(self, value: Optional[datetime]) -> None:
        self.deadline = value
        self.due_date = value

    @property
    def instructions(self) -> Optional[str]:
        return self.description

    @instructions.setter
    def instructions(self, value: Optional[str]) -> None:
        self.description = value

    __table_args__ = (
        # Reconciled: Migration 013 defines inline unnamed CHECK (type IN (...)) -> assessments_type_check
        CheckConstraint(
            "type IN ('quiz', 'assignment', 'practical_test')",
            name="assessments_type_check",
        ),
        # Reconciled: Migration 013 defines inline unnamed CHECK (status IN (...)) -> assessments_status_check
        CheckConstraint(
            "status IN ('draft', 'published', 'closed')",
            name="assessments_status_check",
        ),
        Index("idx_assessments_batch_id", "batch_id"),
        Index("idx_assessments_trainer_id", "trainer_id"),
        Index("idx_assessments_schedule", "batch_id", "start_time", "deadline"),
        Index("idx_assessments_batch_status", "batch_id", "status"),
    )
