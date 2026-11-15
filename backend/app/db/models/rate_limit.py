"""
PostgreSQL-backed Shared Rate Limiter Model for distributed multi-worker FastAPI synchronization.
"""
from datetime import datetime, timezone
import uuid
from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.base import Base


class SharedRateLimit(Base):
    __tablename__ = "shared_rate_limits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    scope: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Rate limit scope: e.g. 'activation_ip' or 'activation_roll'",
    )
    key: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Normalized rate limit key (e.g. client IP or lower-cased roll number)",
    )
    attempt_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )
    window_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    last_attempt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("idx_shared_rate_limits_scope_key", "scope", "key", unique=True),
        Index("idx_shared_rate_limits_window", "window_start"),
    )
