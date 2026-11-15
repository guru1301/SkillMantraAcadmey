import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlalchemy import Text, String, Integer, DateTime, CheckConstraint, Index, text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.batch import Batch

class Program(Base):
    __tablename__ = "programs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_days: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    # Corrected: Migration 003 does NOT specify NOT NULL on progress_weights
    progress_weights: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True, server_default=text("'{}'::jsonb")
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    batches: Mapped[List["Batch"]] = relationship("Batch", back_populates="program")

    @property
    def code(self) -> Optional[str]:
        return None

    @property
    def modules(self) -> List[Any]:
        return []

    __table_args__ = (
        # Reconciled: Migration 003 defines inline unnamed CHECK (duration_days >= 0) -> programs_duration_days_check
        CheckConstraint("duration_days >= 0", name="programs_duration_days_check"),
        # Migration 003 defines explicit CONSTRAINT chk_program_status CHECK (status IN ('active', 'inactive'))
        CheckConstraint("status IN ('active', 'inactive')", name="chk_program_status"),
        Index("idx_programs_name_lower", func.lower(func.trim(name)), unique=True),
        Index("idx_programs_status", "status"),
    )
