import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    Text, String, DateTime, ForeignKey,
    CheckConstraint, UniqueConstraint, Index, text, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.training_session import TrainingSession
    from backend.app.db.models.student import Student

class SessionAttendance(Base):
    __tablename__ = "session_attendance"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("training_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="present"
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    marked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    marked_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )
    marked_by_role: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    session: Mapped["TrainingSession"] = relationship("TrainingSession", back_populates="attendances")
    student: Mapped["Student"] = relationship("Student", back_populates="session_attendances")

    @property
    def remarks(self) -> Optional[str]:
        return self.notes

    @remarks.setter
    def remarks(self, value: Optional[str]) -> None:
        self.notes = value

    __table_args__ = (
        # Reconciled: Migration 011 defines inline unnamed CHECK (status IN ('present', 'absent', 'late', 'excused')) -> session_attendance_status_check
        CheckConstraint(
            "status IN ('present', 'absent', 'late', 'excused')",
            name="session_attendance_status_check",
        ),
        UniqueConstraint("session_id", "student_id", name="unq_session_student_attendance"),
        Index("idx_attendance_session_id", "session_id"),
        Index("idx_attendance_student_id", "student_id"),
        Index("idx_attendance_status", "status"),
        Index("idx_session_attendance_student_session", "student_id", "session_id"),
        Index("idx_session_attendance_session_status", "session_id", "status"),
    )
