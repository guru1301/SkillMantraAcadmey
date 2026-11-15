import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy import (
    String, Integer, Numeric, Boolean, DateTime, ForeignKey,
    CheckConstraint, Index, text, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.assessment import Assessment
    from backend.app.db.models.student import Student


class ExamProctoringEvent(Base):
    __tablename__ = "exam_proctoring_events"

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
    event_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    sequence_number: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("1")
    )
    duration_seconds: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, server_default=text("0.0")
    )
    event_metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    acknowledged: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    idempotency_key: Mapped[Optional[str]] = mapped_column(
        String(128), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    assessment: Mapped["Assessment"] = relationship(
        "Assessment", back_populates="proctoring_events"
    )
    student: Mapped["Student"] = relationship(
        "Student", back_populates="proctoring_events"
    )

    __table_args__ = (
        CheckConstraint(
            "event_type IN ('TAB_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'PAGE_HIDDEN', 'CONNECTION_LOST', 'CONNECTION_RESTORED', 'EXAM_RESUMED')",
            name="chk_proctoring_event_type",
        ),
        Index("idx_exam_events_assessment_student", "assessment_id", "student_id"),
        Index("idx_exam_events_type", "event_type"),
        Index("idx_exam_events_created", "created_at"),
        Index(
            "idx_exam_events_idempotency",
            "assessment_id",
            "student_id",
            "idempotency_key",
            unique=True,
            postgresql_where=text("idempotency_key IS NOT NULL"),
        ),
        Index("idx_exam_events_seq", "assessment_id", "student_id", "sequence_number"),
    )

