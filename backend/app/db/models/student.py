import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Index, Boolean, text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.college import College
    from backend.app.db.models.batch import BatchStudent
    from backend.app.db.models.session_attendance import SessionAttendance
    from backend.app.db.models.assessment_submission import AssessmentSubmission
    from backend.app.db.models.student_feedback import StudentFeedback
    from backend.app.db.models.exam_proctoring_event import ExamProctoringEvent

class Student(Base):
    """
    Master Student Model.
    NOTE: Uniqueness is enforced via an expression-based unique index:
    CREATE UNIQUE INDEX idx_students_college_roll_lower ON students (college_id, LOWER(TRIM(roll_number))),
    NOT a conventional table-level UNIQUE(college_id, roll_number) constraint.
    """
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    college_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("colleges.id", ondelete="RESTRICT"),
        nullable=True,
    )
    roll_number: Mapped[str] = mapped_column(String(100), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    year_or_semester: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    dob: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # YYYY-MM-DD
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"), default=False)
    activation_token_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    activation_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    activated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    college: Mapped[Optional["College"]] = relationship("College", back_populates="students")
    batch_enrollments: Mapped[List["BatchStudent"]] = relationship("BatchStudent", back_populates="student", cascade="all, delete-orphan")
    session_attendances: Mapped[List["SessionAttendance"]] = relationship("SessionAttendance", back_populates="student", cascade="all, delete-orphan")
    assessment_submissions: Mapped[List["AssessmentSubmission"]] = relationship("AssessmentSubmission", back_populates="student", cascade="all, delete-orphan")
    feedbacks: Mapped[List["StudentFeedback"]] = relationship("StudentFeedback", back_populates="student", cascade="all, delete-orphan")
    proctoring_events: Mapped[List["ExamProctoringEvent"]] = relationship("ExamProctoringEvent", back_populates="student", cascade="all, delete-orphan")

    @property
    def name(self) -> str:
        return self.full_name

    @name.setter
    def name(self, value: str) -> None:
        self.full_name = value

    __table_args__ = (
        # Expression-based composite uniqueness from Migration 007
        Index(
            "idx_students_college_roll_lower",
            "college_id",
            func.lower(func.trim(roll_number)),
            unique=True,
        ),
        Index("idx_students_college_id", "college_id"),
        Index("idx_students_email", func.lower(email)),
        Index("idx_students_department", "department"),
        Index("idx_students_status", "status"),
        Index("idx_students_roll_lower", func.lower(func.trim(roll_number))),
        Index("idx_students_lower_roll", func.lower(func.trim(roll_number))),
        Index(
            "idx_students_lower_email",
            func.lower(func.trim(email)),
            postgresql_where=text("email IS NOT NULL"),
        ),
    )
