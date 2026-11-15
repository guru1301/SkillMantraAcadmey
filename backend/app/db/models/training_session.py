import uuid
from datetime import datetime, date, time
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import (
    Text, String, Date, Time, DateTime, ForeignKey,
    CheckConstraint, Index, text, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, foreign
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.batch import Batch
    from backend.app.db.models.trainer import Trainer
    from backend.app.db.models.session_attendance import SessionAttendance

class TrainingSession(Base):
    __tablename__ = "training_sessions"

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
    date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    topic: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)

    # Corrected: Migration 005 declares 'trainer_id UUID' with NO foreign key constraint to trainers.
    # We do NOT declare a ForeignKey here to preserve exact schema fidelity.
    # ORM relationship navigation is enabled via foreign() without emitting DDL foreign keys.
    trainer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="scheduled"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    batch: Mapped["Batch"] = relationship("Batch", back_populates="training_sessions")
    trainer: Mapped[Optional["Trainer"]] = relationship(
        "Trainer",
        primaryjoin="foreign(TrainingSession.trainer_id) == Trainer.id",
        back_populates="training_sessions",
    )
    attendances: Mapped[List["SessionAttendance"]] = relationship(
        "SessionAttendance", back_populates="session", cascade="all, delete-orphan"
    )

    @property
    def session_date(self) -> date:
        return self.date

    @session_date.setter
    def session_date(self, value: date) -> None:
        self.date = value

    @property
    def description(self) -> Optional[str]:
        return self.topic

    @description.setter
    def description(self, value: Optional[str]) -> None:
        self.topic = value

    __table_args__ = (
        CheckConstraint("status IN ('scheduled', 'completed', 'cancelled')", name="chk_session_status"),
        Index("idx_sessions_batch_id", "batch_id"),
        Index("idx_sessions_date", "date"),
        Index("idx_training_sessions_batch_date", "batch_id", "date"),
    )
