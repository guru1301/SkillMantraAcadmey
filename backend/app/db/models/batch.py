import uuid
from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import (
    String, Integer, Date, DateTime, Boolean, ForeignKey,
    CheckConstraint, UniqueConstraint, Index, text, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.college import College
    from backend.app.db.models.program import Program
    from backend.app.db.models.admin_user import AdminUser
    from backend.app.db.models.student import Student
    from backend.app.db.models.trainer import Trainer
    from backend.app.db.models.training_session import TrainingSession
    from backend.app.db.models.resource import Resource
    from backend.app.db.models.assessment import Assessment
    from backend.app.db.models.batch_feedback_unlock import BatchFeedbackUnlock
    from backend.app.db.models.student_feedback import StudentFeedback


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    college_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("colleges.id", ondelete="RESTRICT"),
        nullable=False,
    )
    program_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programs.id", ondelete="RESTRICT"),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    target_strength: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="planned"
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("admin_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    college: Mapped["College"] = relationship("College", back_populates="batches")
    program: Mapped["Program"] = relationship("Program", back_populates="batches")
    creator: Mapped[Optional["AdminUser"]] = relationship("AdminUser")
    batch_students: Mapped[List["BatchStudent"]] = relationship("BatchStudent", back_populates="batch", cascade="all, delete-orphan")
    batch_trainers: Mapped[List["BatchTrainer"]] = relationship("BatchTrainer", back_populates="batch", cascade="all, delete-orphan")
    training_sessions: Mapped[List["TrainingSession"]] = relationship("TrainingSession", back_populates="batch", cascade="all, delete-orphan")
    resources: Mapped[List["Resource"]] = relationship("Resource", back_populates="batch", cascade="all, delete-orphan")
    assessments: Mapped[List["Assessment"]] = relationship("Assessment", back_populates="batch", cascade="all, delete-orphan")
    feedback_unlock: Mapped[Optional["BatchFeedbackUnlock"]] = relationship("BatchFeedbackUnlock", back_populates="batch", uselist=False, cascade="all, delete-orphan")
    feedbacks: Mapped[List["StudentFeedback"]] = relationship("StudentFeedback", back_populates="batch", cascade="all, delete-orphan")

    @property
    def batch_code(self) -> str:
        return self.code

    @batch_code.setter
    def batch_code(self, value: str) -> None:
        self.code = value

    @property
    def name(self) -> str:
        return self.code

    @name.setter
    def name(self, value: str) -> None:
        self.code = value

    __table_args__ = (
        CheckConstraint("status IN ('planned', 'active', 'completed', 'cancelled')", name="chk_batch_status"),
        CheckConstraint("end_date >= start_date", name="chk_batch_dates"),
        # Reconciled: Migration 004 defines inline unnamed CHECK (target_strength >= 0) -> batches_target_strength_check
        CheckConstraint("target_strength >= 0", name="batches_target_strength_check"),
        Index("idx_batches_college_id", "college_id"),
        Index("idx_batches_program_id", "program_id"),
        Index("idx_batches_status", "status"),
        Index("idx_batches_start_date", start_date.desc()),
        Index("idx_batches_college_status", "college_id", "status"),
        Index("idx_batches_created_at", created_at.desc()),
    )


class BatchStudent(Base):
    __tablename__ = "batch_students"

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
        ForeignKey("students.id", ondelete="CASCADE", name="fk_batch_students_student"),
        nullable=False,
    )
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="enrolled")

    # Relationships
    batch: Mapped["Batch"] = relationship("Batch", back_populates="batch_students")
    student: Mapped["Student"] = relationship("Student", back_populates="batch_enrollments")

    __table_args__ = (
        UniqueConstraint("batch_id", "student_id", name="unq_batch_student"),
        Index("idx_batch_students_batch_id", "batch_id"),
        Index("idx_batch_students_student_id", "student_id"),
    )


class BatchTrainer(Base):
    __tablename__ = "batch_trainers"

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
    trainer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("trainers.id", ondelete="RESTRICT", name="fk_batch_trainers_trainer"),
        nullable=False,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False, server_default="lead_trainer")
    is_lead: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))

    # Relationships
    batch: Mapped["Batch"] = relationship("Batch", back_populates="batch_trainers")
    trainer: Mapped["Trainer"] = relationship("Trainer", back_populates="batch_assignments")

    @property
    def created_at(self) -> datetime:
        return self.assigned_at

    __table_args__ = (
        UniqueConstraint("batch_id", "trainer_id", name="unq_batch_trainer"),
        # PostgreSQL partial unique index: at most ONE lead trainer per batch
        Index(
            "idx_batch_trainers_one_lead_per_batch",
            "batch_id",
            unique=True,
            postgresql_where=text("is_lead = true"),
        ),
        Index("idx_batch_trainers_batch_id", "batch_id"),
        Index("idx_batch_trainers_trainer_id", "trainer_id"),
        Index("idx_batch_trainers_batch_trainer", "batch_id", "trainer_id"),
        Index("idx_batch_trainers_is_lead", "batch_id", "is_lead"),
        Index("idx_batch_trainers_batch_trainer_lead", "trainer_id", "is_lead"),
    )
