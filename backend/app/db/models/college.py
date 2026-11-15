import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Text, String, DateTime, CheckConstraint, Index, text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

if TYPE_CHECKING:
    from backend.app.db.models.batch import Batch
    from backend.app.db.models.student import Student
    from backend.app.db.models.college_user import CollegeUser

class College(Base):
    __tablename__ = "colleges"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    state: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    batches: Mapped[List["Batch"]] = relationship("Batch", back_populates="college")
    students: Mapped[List["Student"]] = relationship("Student", back_populates="college")
    college_users: Mapped[List["CollegeUser"]] = relationship("CollegeUser", back_populates="college")

    @property
    def code(self) -> Optional[str]:
        return None

    @property
    def address(self) -> Optional[str]:
        return None

    @property
    def pincode(self) -> Optional[str]:
        return None

    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive')", name="chk_college_status"),
        Index(
            "idx_colleges_name_city_lower",
            func.lower(func.trim(name)),
            func.lower(func.trim(func.coalesce(city, ""))),
            unique=True,
        ),
        Index("idx_colleges_status", "status"),
        Index("idx_colleges_city", func.lower(city)),
        Index("idx_colleges_created_at", created_at.desc()),
    )

