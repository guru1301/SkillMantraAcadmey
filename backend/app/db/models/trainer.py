import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, CheckConstraint, Index, text, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, foreign
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.batch import BatchTrainer
    from backend.app.db.models.training_session import TrainingSession
    from backend.app.db.models.assessment import Assessment

class Trainer(Base):
    __tablename__ = "trainers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="active")
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false"), default=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    batch_assignments: Mapped[List["BatchTrainer"]] = relationship("BatchTrainer", back_populates="trainer")
    # Matching relationship without DB foreign key (migration 005)
    training_sessions: Mapped[List["TrainingSession"]] = relationship(
        "TrainingSession",
        primaryjoin="Trainer.id == foreign(TrainingSession.trainer_id)",
        back_populates="trainer",
    )
    assessments: Mapped[List["Assessment"]] = relationship("Assessment", back_populates="trainer")

    @property
    def name(self) -> str:
        return self.full_name

    @name.setter
    def name(self, value: str) -> None:
        self.full_name = value

    @property
    def bio(self) -> Optional[str]:
        return self.skills

    @bio.setter
    def bio(self, value: Optional[str]) -> None:
        self.skills = value

    @property
    def expertise(self) -> List[str]:
        return [s.strip() for s in self.skills.split(",")] if self.skills else []

    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive')", name="chk_trainer_status"),
        Index(
            "idx_trainers_email_lower",
            func.lower(func.trim(email)),
            unique=True,
            postgresql_where=text("email IS NOT NULL AND TRIM(email) != ''"),
        ),
        Index("idx_trainers_status", "status"),
        Index("idx_trainers_name_lower", func.lower(func.trim(full_name))),
        Index("idx_trainers_created_at", created_at.desc()),
        Index(
            "idx_trainers_email_active",
            func.lower(func.trim(email)),
            postgresql_where=text("email IS NOT NULL AND status = 'active'"),
        ),
        Index("idx_trainers_lower_email", func.lower(func.trim(email))),
    )
