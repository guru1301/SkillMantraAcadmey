import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Index, text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.db.base import Base

class UserSession(Base):
    """
    Server-side opaque session model supporting polymorphic multi-role users.
    
    Security Architecture Notes:
    1. Cryptographic Token Protection: Stores SHA-256 hash of the random 32-byte secret.
       This prevents token disclosure and offline impersonation in the event of an
       unauthorized database read/dump (defense-in-depth). It does NOT prevent direct
       tampering by actors with database write privileges.
    2. Tenant Authorization Precaution: The cached 'college_id' is stored strictly as a
       low-overhead routing optimization. Security dependencies MUST NOT treat this cached
       value as the sole source of truth; sensitive mutations must verify active institutional
       status against primary entity tables (e.g., college_users, colleges, batch_students).
    """
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    # Corrected: Removed duplicate unique=True; uniqueness is enforced solely by idx_user_sessions_token_hash
    session_token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        comment="SHA-256 hash of the cryptographically random 32-byte session secret",
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        comment="Foreign identity matching id in admin_users, college_users, trainers, or students",
    )
    user_role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Role type: super_admin | college_admin | trainer | student",
    )
    college_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        comment="Cached tenant college_id for routing optimization; verified against primary tables during sensitive operations",
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_user_sessions_token_hash", "session_token_hash", unique=True),
        Index("idx_user_sessions_user_lookup", "user_id", "user_role"),
        Index("idx_user_sessions_expires_at", "expires_at"),
    )
