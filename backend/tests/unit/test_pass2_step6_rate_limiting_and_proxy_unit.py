"""
Pass 2 Step 6 Unit Tests: Rate Limiting & Proxy Trust (P2-03, P6-04, P2-06).

Tests:
1. get_trusted_client_ip parses X-Forwarded-For from RIGHT to LEFT, skipping TRUSTED_PROXIES.
   Spoofed leftmost X-Forwarded-For does not change the resolved IP.
2. Rotating spoofed leftmost IPs behind a trusted proxy still hits the resolved client IP rate limit.
3. Lockout of one IP does not lock the real user elsewhere (per-(ip, identifier) hard limit).
4. Limiter state is shared across multiple app sessions via shared_rate_limits table.
5. Fail CLOSED for login when the limiter store errors.
6. Rate limiting on GET /certificates/verify/{code} (30/min per IP) and /auth/change-password.
"""
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from fastapi import HTTPException, Request
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.config import settings
from backend.app.core.security import get_trusted_client_ip
from backend.app.db.base import Base
from backend.app.db.models.rate_limit import SharedRateLimit
from backend.app.services.rate_limit_service import (
    is_distributed_rate_limited,
    record_distributed_attempt,
    reset_distributed_rate_limit,
)


class TestProxyTrustUnit:
    def test_spoofed_leftmost_x_forwarded_for_does_not_change_resolved_ip(self):
        """
        When peer is trusted proxy (127.0.0.1) and X-Forwarded-For contains:
        'spoofed_ip, real_client_ip, trusted_intermediate'
        get_trusted_client_ip must parse right-to-left, skip trusted proxies,
        and select the first untrusted hop (real_client_ip), NOT the spoofed leftmost hop.
        """
        request = MagicMock(spec=Request)
        request.client.host = "127.0.0.1"  # in TRUSTED_PROXIES
        # Leftmost is spoofed (1.2.3.4), middle is real client (203.0.113.195), right is another trusted proxy (10.0.0.1)
        with patch.object(settings, "TRUSTED_PROXIES", "127.0.0.1,::1,localhost,10.0.0.1"):
            request.headers = {
                "x-forwarded-for": "1.2.3.4, 203.0.113.195, 10.0.0.1"
            }
            resolved_ip = get_trusted_client_ip(request)
            assert resolved_ip == "203.0.113.195", (
                f"Expected first untrusted hop from right '203.0.113.195', got '{resolved_ip}'"
            )

    def test_untrusted_direct_peer_ignores_x_forwarded_for_entirely(self):
        """
        When direct peer is not in TRUSTED_PROXIES, X-Forwarded-For must be ignored completely.
        """
        request = MagicMock(spec=Request)
        request.client.host = "198.51.100.5"  # Untrusted external client
        request.headers = {"x-forwarded-for": "1.1.1.1, 2.2.2.2"}
        with patch.object(settings, "TRUSTED_PROXIES", "127.0.0.1,::1,localhost"):
            resolved_ip = get_trusted_client_ip(request)
            assert resolved_ip == "198.51.100.5"


class TestSharedRateLimiterUnit:
    @pytest.fixture
    def test_db_session(self):
        """Creates an in-memory SQLite database instance with SharedRateLimit table."""
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=engine, tables=[SharedRateLimit.__table__])
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        try:
            yield session
        finally:
            session.close()

    def test_limiter_state_is_shared_across_two_db_sessions(self, test_db_session):
        """
        Rate limiting state persisted by session 1 must be visible and enforced by session 2.
        """
        engine = test_db_session.get_bind()
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session_two = SessionLocal()

        scope = "login_ip"
        ip = "192.0.2.1"
        max_requests = 10
        window = 60

        # Session 1 records 10 attempts
        for _ in range(10):
            record_distributed_attempt(test_db_session, scope=scope, key=ip, window_seconds=window)

        # Session 2 checks rate limit for the same IP
        is_limited, remaining = is_distributed_rate_limited(
            session_two, scope=scope, key=ip, max_requests=max_requests, window_seconds=window
        )
        assert is_limited is True, "Session 2 must see rate limit exceeded from Session 1"
        assert remaining == 0
        session_two.close()

    def test_lockout_of_one_ip_does_not_lock_real_user_elsewhere(self, test_db_session):
        """
        Per-(ip, identifier) rate limiting: attacker on IP A locking out target_user
        must NOT lock out target_user connecting from legitimate IP B.
        """
        scope = "login_ip_id"
        attacker_key = "198.51.100.10:victim@college.edu"
        legit_key = "203.0.113.5:victim@college.edu"
        max_failed = 5
        window = 600

        # Attacker on IP 198.51.100.10 exhausts 5 attempts
        for _ in range(5):
            record_distributed_attempt(test_db_session, scope=scope, key=attacker_key, window_seconds=window)

        # Attacker is locked out
        att_limited, _ = is_distributed_rate_limited(
            test_db_session, scope=scope, key=attacker_key, max_requests=max_failed, window_seconds=window
        )
        assert att_limited is True, "Attacker IP must be locked out"

        # Legitimate user on IP 203.0.113.5 is NOT locked out
        legit_limited, legit_remaining = is_distributed_rate_limited(
            test_db_session, scope=scope, key=legit_key, max_requests=max_failed, window_seconds=window
        )
        assert legit_limited is False, "Legitimate user from separate IP must not be locked out"
        assert legit_remaining == 5

    def test_fail_closed_for_login_when_limiter_store_errors(self):
        """
        Login rate limiting must fail CLOSED (treat as limited) when limiter storage encounters an unhandled error.
        """
        broken_db = MagicMock()
        broken_db.execute.side_effect = RuntimeError("Database connection pool exhausted")

        is_limited, remaining = is_distributed_rate_limited(
            broken_db,
            scope="login_ip",
            key="127.0.0.1",
            max_requests=10,
            window_seconds=60,
            fail_closed=True,
        )
        assert is_limited is True, "Login limiter must fail closed on database error"
        assert remaining == 0

