"""
Distributed Rate Limiting Service.

Provides atomic, multi-worker rate limiting across distributed FastAPI instances
using a shared PostgreSQL table (shared_rate_limits).
"""
from datetime import datetime, timedelta, timezone
from typing import Tuple
from uuid import uuid4
from sqlalchemy import delete, select, text
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.db.models.rate_limit import SharedRateLimit


def _ensure_utc(dt: datetime) -> datetime:
    """Ensure datetime has UTC timezone for cross-dialect compatibility (e.g. SQLite test engine)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def is_distributed_rate_limited(
    db: Session,
    scope: str,
    key: str,
    max_requests: int,
    window_seconds: int,
    fail_closed: bool = False,
) -> Tuple[bool, int]:
    """
    Checks if an IP or identifier has exceeded the rate limit.
    Returns (is_limited, remaining_attempts).
    Works across multiple application workers via PostgreSQL or SQLite shared_rate_limits.
    If fail_closed is True, any exception querying the limiter store treats the request
    as rate limited (returns (True, 0)).
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=window_seconds)

    try:
        row = db.execute(
            select(SharedRateLimit).where(
                SharedRateLimit.scope == scope,
                SharedRateLimit.key == key,
            )
        ).scalar_one_or_none()

        if not row:
            return (False, max_requests)

        w_start = _ensure_utc(row.window_start)
        if w_start < cutoff:
            # Window expired
            return (False, max_requests)

        if row.attempt_count >= max_requests:
            return (True, 0)

        return (False, max(0, max_requests - row.attempt_count))
    except Exception:
        if fail_closed:
            return (True, 0)
        # Otherwise fail open safely on database read issues so legitimate users are not hard-blocked
        return (False, max_requests)


def record_distributed_attempt(
    db: Session,
    scope: str,
    key: str,
    window_seconds: int,
) -> None:
    """
    Atomically records a failed attempt in the shared rate limit table.
    Works across multiple application workers using PostgreSQL ON CONFLICT DO UPDATE,
    or standard SQLAlchemy upsert on SQLite.
    """
    bind = db.get_bind() if hasattr(db, "get_bind") else None
    dialect = bind.dialect.name if bind else "postgresql"

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=window_seconds)

    if dialect == "postgresql":
        try:
            upsert_sql = text("""
                INSERT INTO shared_rate_limits (id, scope, key, attempt_count, window_start, last_attempt_at)
                VALUES (gen_random_uuid(), :scope, :key, 1, NOW(), NOW())
                ON CONFLICT (scope, key) DO UPDATE
                SET attempt_count = CASE
                        WHEN shared_rate_limits.window_start < NOW() - (:window_seconds || ' seconds')::interval
                        THEN 1
                        ELSE shared_rate_limits.attempt_count + 1
                    END,
                    window_start = CASE
                        WHEN shared_rate_limits.window_start < NOW() - (:window_seconds || ' seconds')::interval
                        THEN NOW()
                        ELSE shared_rate_limits.window_start
                    END,
                    last_attempt_at = NOW();
            """)
            db.execute(upsert_sql, {"scope": scope, "key": key, "window_seconds": window_seconds})
            db.commit()
        except Exception:
            db.rollback()
    else:
        # SQLite / in-memory fallback
        try:
            row = db.execute(
                select(SharedRateLimit).where(
                    SharedRateLimit.scope == scope,
                    SharedRateLimit.key == key,
                )
            ).scalar_one_or_none()

            if not row:
                row = SharedRateLimit(
                    id=uuid4(),
                    scope=scope,
                    key=key,
                    attempt_count=1,
                    window_start=now,
                    last_attempt_at=now,
                )
                db.add(row)
            else:
                w_start = _ensure_utc(row.window_start)
                if w_start < cutoff:
                    row.attempt_count = 1
                    row.window_start = now
                else:
                    row.attempt_count += 1
                row.last_attempt_at = now
            db.commit()
        except Exception:
            db.rollback()


def reset_distributed_rate_limit(
    db: Session,
    scope: str,
    key: str,
) -> None:
    """
    Resets the rate limit bucket for an identifier upon successful authentication/activation.
    """
    try:
        db.execute(
            delete(SharedRateLimit).where(
                SharedRateLimit.scope == scope,
                SharedRateLimit.key == key,
            )
        )
        db.commit()
    except Exception:
        db.rollback()

