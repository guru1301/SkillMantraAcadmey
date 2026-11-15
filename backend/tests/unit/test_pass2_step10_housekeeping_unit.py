"""
Pass 2 Step 10 Unit Tests: Session Limits, Housekeeping, CSRF Cookie Audit, and Token Hashing Hygiene (P2-14, P2-15).

Requirements:
1. Max concurrent sessions per user:
   - Cap active sessions per user at 5.
   - When a 6th session is created during login, revoke the oldest session(s) so count stays <= 5.
2. Expired session cleanup:
   - cleanup_expired_sessions purges revoked/expired sessions.
   - POST /admin/maintenance/cleanup-sessions provides callable admin maintenance.
3. CSRF cookie audit:
   - csrf_token cookie is httponly=False (readable by frontend client).
   - session_token cookie is httponly=True.
4. hash_activation_token:
   - Uses HMAC-SHA256 with settings.SECRET_KEY.
   - Changing SECRET_KEY changes the hash.
   - verify_activation_token maintains backwards compatibility.
"""
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select, event
from sqlalchemy.orm import sessionmaker

from backend.app.core.config import settings
from backend.app.core.security import (
    hash_activation_token,
    hash_password,
    hash_session_token,
    verify_activation_token,
)
from backend.app.db.base import Base
from backend.app.db.models.admin_user import AdminUser
from backend.app.db.models.college import College
from backend.app.db.models.college_user import CollegeUser
from backend.app.db.models.rate_limit import SharedRateLimit
from backend.app.db.models.student import Student
from backend.app.db.models.trainer import Trainer
from backend.app.db.models.user_session import UserSession
from backend.app.services.auth_service import (
    authenticate_user,
    cleanup_expired_sessions,
)


@pytest.fixture
def step10_db_session():
    """Isolated SQLite session with user and session models."""
    engine = create_engine("sqlite:///:memory:", echo=False)

    @event.listens_for(engine, "connect")
    def register_sqlite_functions(dbapi_connection, connection_record):
        dbapi_connection.create_function("gen_random_uuid", 0, lambda: uuid4().hex)

    Base.metadata.create_all(
        bind=engine,
        tables=[
            College.__table__,
            AdminUser.__table__,
            CollegeUser.__table__,
            Trainer.__table__,
            Student.__table__,
            UserSession.__table__,
            SharedRateLimit.__table__,
        ],
    )
    Session = sessionmaker(bind=engine)
    session = Session()

    yield session
    session.close()


class TestSessionLimitsAndCleanup:
    def test_max_concurrent_sessions_capped_at_five(self, step10_db_session):
        """
        Logging in 6 times for the same user must cap active sessions at 5,
        revoking the oldest session(s).
        """
        user_id = uuid4()
        pw = "SuperSecureKey@2026"
        admin = AdminUser(
            id=user_id,
            email="admin.multi@platform.org",
            full_name="Multi Session Admin",
            password_hash=hash_password(pw),
            status="active",
        )
        step10_db_session.add(admin)
        step10_db_session.commit()

        session_tokens = []
        for i in range(6):
            token, _, _ = authenticate_user(
                db=step10_db_session,
                identifier="admin.multi@platform.org",
                password=pw,
            )
            session_tokens.append(token)

        # Query all sessions for this user
        all_sessions = step10_db_session.execute(
            select(UserSession).where(UserSession.user_id == user_id).order_by(UserSession.created_at.asc())
        ).scalars().all()

        assert len(all_sessions) == 6

        # Active sessions (revoked_at is None) must be exactly 5
        active_sessions = [s for s in all_sessions if s.revoked_at is None]
        assert len(active_sessions) == 5

        # The very first session token must be revoked
        first_token_hash = hash_session_token(session_tokens[0])
        first_session = next(s for s in all_sessions if s.session_token_hash == first_token_hash)
        assert first_session.revoked_at is not None

        # The latest session (6th) must be active
        latest_token_hash = hash_session_token(session_tokens[-1])
        latest_session = next(s for s in all_sessions if s.session_token_hash == latest_token_hash)
        assert latest_session.revoked_at is None

    def test_cleanup_expired_sessions_purges_only_stale_sessions(self, step10_db_session):
        """
        cleanup_expired_sessions deletes sessions older than max_age_days
        and preserves active or recently expired sessions.
        """
        now = datetime.now(timezone.utc)
        user_id = uuid4()

        # 1. Very old revoked session (> 35 days ago) -> should be deleted
        old_revoked = UserSession(
            id=uuid4(),
            user_id=user_id,
            user_role="super_admin",
            session_token_hash=hash_session_token("tok-old-revoked"),
            created_at=now - timedelta(days=40),
            expires_at=now - timedelta(days=10),
            revoked_at=now - timedelta(days=35),
        )
        # 2. Old expired session (> 35 days expired) -> should be deleted
        old_expired = UserSession(
            id=uuid4(),
            user_id=user_id,
            user_role="super_admin",
            session_token_hash=hash_session_token("tok-old-expired"),
            created_at=now - timedelta(days=45),
            expires_at=now - timedelta(days=32),
            revoked_at=None,
        )
        # 3. Active valid session -> must be preserved
        active_session = UserSession(
            id=uuid4(),
            user_id=user_id,
            user_role="super_admin",
            session_token_hash=hash_session_token("tok-active"),
            created_at=now,
            expires_at=now + timedelta(days=7),
            revoked_at=None,
        )
        # 4. Recently revoked session (2 days ago) -> must be preserved within audit window
        recent_revoked = UserSession(
            id=uuid4(),
            user_id=user_id,
            user_role="super_admin",
            session_token_hash=hash_session_token("tok-recent-revoked"),
            created_at=now - timedelta(days=5),
            expires_at=now + timedelta(days=2),
            revoked_at=now - timedelta(days=2),
        )

        step10_db_session.add_all([old_revoked, old_expired, active_session, recent_revoked])
        step10_db_session.commit()

        purged_count = cleanup_expired_sessions(step10_db_session, max_age_days=30)
        assert purged_count == 2

        remaining = step10_db_session.execute(select(UserSession)).scalars().all()
        assert len(remaining) == 2
        remaining_hashes = {s.session_token_hash for s in remaining}
        assert hash_session_token("tok-active") in remaining_hashes
        assert hash_session_token("tok-recent-revoked") in remaining_hashes

    def test_cleanup_sessions_admin_endpoint(self, step10_db_session):
        """POST /admin/maintenance/cleanup-sessions purges expired sessions."""
        from backend.app.api.v1.endpoints.admin import cleanup_sessions_endpoint
        from backend.app.api.deps import AuthenticatedUser

        mock_admin = AuthenticatedUser(
            id=uuid4(),
            email="root@platform.org",
            role="super_admin",
            full_name="Super Admin",
        )
        res = cleanup_sessions_endpoint(max_age_days=30, db=step10_db_session, current_user=mock_admin)
        assert res["success"] is True
        assert "purged_sessions" in res

    def test_login_cookie_attributes_both_session_and_csrf_httponly(self, step10_db_session):
        """
        Verify that login sets both session_token and csrf_token cookies with HttpOnly=True
        (since Next.js App Router server actions perform all backend communication server-to-server).
        """
        from fastapi import Response
        from backend.app.api.v1.endpoints.auth import login
        from backend.app.schemas.auth import LoginRequest
        from unittest.mock import MagicMock

        # Mock request with trusted client IP
        mock_request = MagicMock()
        mock_request.client.host = "198.51.100.99"
        mock_request.headers.get.side_effect = lambda h, d=None: "Pytest-Agent" if "agent" in h.lower() else None

        pw = "AdminPassKey#2026"
        admin = AdminUser(
            id=uuid4(),
            email="admin.cookie@platform.org",
            full_name="Cookie Admin",
            password_hash=hash_password(pw),
            status="active",
        )
        step10_db_session.add(admin)
        step10_db_session.commit()

        login_req = LoginRequest(email="admin.cookie@platform.org", password=pw)
        mock_response = Response()

        login_result = login(
            request=mock_request,
            response=mock_response,
            payload=login_req,
            db=step10_db_session,
        )

        assert login_result.success is True

        # Extract set-cookie headers
        set_cookies = mock_response.headers.getlist("set-cookie")
        assert len(set_cookies) >= 2

        session_cookie_header = next(c for c in set_cookies if settings.SESSION_COOKIE_NAME in c)
        csrf_cookie_header = next(c for c in set_cookies if "csrf_token=" in c)

        # Both session_token and csrf_token MUST be HttpOnly (no client-side cookie access in Next.js)
        assert "httponly" in session_cookie_header.lower()
        assert "httponly" in csrf_cookie_header.lower()

    def test_startup_maintenance_idempotent_sqlite(self, step10_db_session):
        """
        run_startup_maintenance should be idempotent and return status='completed' on SQLite.
        """
        from backend.app.services.auth_service import run_startup_maintenance
        res1 = run_startup_maintenance(step10_db_session)
        assert res1["status"] == "completed"
        assert "cleaned_sessions" in res1
        assert "cleaned_rates" in res1

        res2 = run_startup_maintenance(step10_db_session)
        assert res2["status"] == "completed"
        assert res2["cleaned_sessions"] == 0

    def test_startup_maintenance_postgres_advisory_lock_skips_when_locked(self):
        """
        On PostgreSQL, if another worker holds the advisory lock (pg_try_advisory_lock returns False),
        run_startup_maintenance must cleanly skip without raising or executing deletes.
        """
        from unittest.mock import MagicMock
        from backend.app.services.auth_service import run_startup_maintenance

        mock_db = MagicMock()
        mock_db.bind.dialect.name = "postgresql"
        # Simulate pg_try_advisory_lock returning False (lock held by peer worker)
        mock_exec = MagicMock()
        mock_exec.scalar.return_value = False
        mock_db.execute.return_value = mock_exec

        res = run_startup_maintenance(mock_db)
        assert res["status"] == "skipped"
        assert res["reason"] == "advisory_lock_held"
        mock_db.commit.assert_not_called()

    def test_no_dead_password_reset_schemas(self):
        """
        P2-13 is won't-implement: ForgotPasswordRequest and ResetPasswordRequest
        must not exist in backend.app.schemas.auth.
        """
        import backend.app.schemas.auth as auth_schemas
        assert not hasattr(auth_schemas, "ForgotPasswordRequest"), "Dead schema ForgotPasswordRequest must be removed"
        assert not hasattr(auth_schemas, "ResetPasswordRequest"), "Dead schema ResetPasswordRequest must be removed"


class TestCSRFCookieAndTokenHashing:
    def test_hash_activation_token_keyed_with_secret_key(self, monkeypatch):
        """
        hash_activation_token computes an HMAC-SHA256 keyed with settings.SECRET_KEY.
        Changing settings.SECRET_KEY produces a different digest.
        """
        code = "ACT-TEST-KEY-4321"

        monkeypatch.setattr(settings, "SECRET_KEY", "secret-key-alpha-version-1-at-least-64-characters-long-for-testing-purposes-only!")
        hash_alpha = hash_activation_token(code)

        monkeypatch.setattr(settings, "SECRET_KEY", "secret-key-beta-version-2-at-least-64-characters-long-for-testing-purposes-only!")
        hash_beta = hash_activation_token(code)

        assert hash_alpha != hash_beta
        assert len(hash_alpha) == 64
        assert len(hash_beta) == 64

        # Verification with current key succeeds
        assert verify_activation_token(code, hash_beta) is True
        # Verification with mismatched key fails
        assert verify_activation_token(code, hash_alpha) is False

    def test_verify_activation_token_backward_compatible_with_legacy_sha256(self):
        """
        verify_activation_token still verifies existing unkeyed SHA-256 tokens.
        """
        import hashlib
        code = "LEGACY-ACT-9999"
        normalized = "LEGACYACT9999"
        legacy_hash = hashlib.sha256(normalized.encode("utf-8")).hexdigest()

        assert verify_activation_token(code, legacy_hash) is True
        assert verify_activation_token("WRONG-CODE", legacy_hash) is False
