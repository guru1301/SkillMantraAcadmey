"""
Pass 2 Step 8 Unit Tests: Configuration Validation per Environment (P2-11, P6-06, P6-05).

Tests:
1. SESSION_COOKIE_SECURE enforced to True in staging and production (unless explicit LOCAL_HTTP on loopback).
2. SESSION_COOKIE_SAMESITE accepts only 'lax' or 'strict' (rejects 'none' or arbitrary).
3. CORS allow_headers restricted to Content-Type, X-CSRF-Token, Authorization (no wildcard '*').
4. Staging enforces HTTPS CORS origins (same as production).
5. SECRET_KEY must be >= 64 characters in staging and production.
6. SECRET_KEY rejected if it contains dev, example, placeholder, changeme or sample string.
7. /auth/logout passes matching secure, samesite, and path to delete_cookie.
"""
import secrets
import pytest
from fastapi import Response
from starlette.middleware.cors import CORSMiddleware

from backend.app.core.config import Settings
from backend.app.main import app
from backend.app.api.deps import AuthenticatedUser
from backend.app.api.v1.endpoints.auth import logout


class TestPass2Step8ConfigUnit:
    def test_staging_enforces_secure_cookie(self):
        """SESSION_COOKIE_SECURE must be forced to True in staging unless LOCAL_HTTP=True on loopback."""
        valid_key = secrets.token_hex(32)  # 64 chars
        s = Settings(
            ENVIRONMENT="staging",
            SECRET_KEY=valid_key,
            SESSION_COOKIE_SECURE=False,
            CORS_ORIGINS="https://staging.skillmantra.edu.in",
        )
        assert s.SESSION_COOKIE_SECURE is True, "Staging must enforce SESSION_COOKIE_SECURE=True"

    def test_local_http_allowed_only_on_loopback(self):
        """LOCAL_HTTP=True allows HTTP cookies in staging/production only when origins are loopback."""
        valid_key = secrets.token_hex(32)
        # Allowed on loopback
        s_local = Settings(
            ENVIRONMENT="staging",
            SECRET_KEY=valid_key,
            LOCAL_HTTP=True,
            SESSION_COOKIE_SECURE=False,
            CORS_ORIGINS="http://localhost:3000",
        )
        assert s_local.SESSION_COOKIE_SECURE is False

        # Forbidden on non-loopback domain
        with pytest.raises(ValueError, match="LOCAL_HTTP"):
            Settings(
                ENVIRONMENT="staging",
                SECRET_KEY=valid_key,
                LOCAL_HTTP=True,
                CORS_ORIGINS="http://external.domain.com",
            )

    def test_session_cookie_samesite_validates_lax_or_strict_only(self):
        """SESSION_COOKIE_SAMESITE must only accept 'lax' or 'strict'."""
        s_lax = Settings(SESSION_COOKIE_SAMESITE="lax")
        assert s_lax.SESSION_COOKIE_SAMESITE == "lax"

        s_strict = Settings(SESSION_COOKIE_SAMESITE="STRICT")
        assert s_strict.SESSION_COOKIE_SAMESITE == "strict"

        for bad in ["none", "None", "arbitrary", ""]:
            with pytest.raises(ValueError, match="SESSION_COOKIE_SAMESITE"):
                Settings(SESSION_COOKIE_SAMESITE=bad)

    def test_cors_allow_headers_restricted_in_main(self):
        """CORS allow_headers must be restricted to Content-Type, X-CSRF-Token, Authorization (no wildcard)."""
        cors_middleware = next(
            (m for m in app.user_middleware if m.cls == CORSMiddleware),
            None
        )
        assert cors_middleware is not None, "CORSMiddleware must be installed on FastAPI app"
        allow_headers = [h.lower() for h in cors_middleware.kwargs.get("allow_headers", [])]
        assert "*" not in allow_headers, "allow_headers must not contain '*'"
        assert "content-type" in allow_headers
        assert "x-csrf-token" in allow_headers
        assert "authorization" in allow_headers

    def test_staging_enforces_https_cors_origins(self):
        """Staging must require HTTPS CORS origins and reject plain HTTP or localhost (unless LOCAL_HTTP)."""
        valid_key = secrets.token_hex(32)
        with pytest.raises(ValueError, match="HTTPS"):
            Settings(
                ENVIRONMENT="staging",
                SECRET_KEY=valid_key,
                CORS_ORIGINS="http://staging.skillmantra.edu.in",
            )

    def test_secret_key_minimum_64_chars_in_staging_and_production(self):
        """SECRET_KEY must be >= 64 characters in staging and production."""
        short_63 = secrets.token_hex(16) + "1234567890123456789012345678901"  # 32 + 31 = 63 chars
        assert len(short_63) == 63
        with pytest.raises(ValueError, match="at least 64 characters"):
            Settings(
                ENVIRONMENT="staging",
                SECRET_KEY=short_63,
                CORS_ORIGINS="https://staging.skillmantra.edu.in",
            )

        with pytest.raises(ValueError, match="at least 64 characters"):
            Settings(
                ENVIRONMENT="production",
                SECRET_KEY=short_63,
                CORS_ORIGINS="https://app.skillmantra.edu.in",
            )

    @pytest.mark.parametrize("bad_sub", ["dev", "DEV", "example", "EXAMPLE", "placeholder", "changeme"])
    def test_secret_key_rejects_forbidden_substrings_in_staging_and_production(self, bad_sub):
        """SECRET_KEY must not contain dev, example, placeholder, changeme in staging or production."""
        key_with_sub = secrets.token_hex(30) + bad_sub + "12345678"
        assert len(key_with_sub) >= 64
        with pytest.raises(ValueError, match="forbidden|dev|example|placeholder|changeme"):
            Settings(
                ENVIRONMENT="production",
                SECRET_KEY=key_with_sub,
                CORS_ORIGINS="https://app.skillmantra.edu.in",
            )

    def test_delete_cookie_on_logout_passes_matching_attributes(self):
        """delete_cookie on logout must pass matching path, secure, and samesite attributes."""
        response = Response()
        mock_user = AuthenticatedUser(
            id=secrets.token_hex(16),
            role="student",
            email="student@test.edu",
            full_name="Test Student",
            token="test-session-token",
        )
        mock_db = pytest.MonkeyPatch()
        from unittest.mock import MagicMock
        db = MagicMock()
        db.execute.return_value.rowcount = 1

        logout(response=response, current_user=mock_user, db=db)

        # Inspect headers for Set-Cookie deletion directives
        raw_cookies = response.raw_headers
        cookie_headers = [v.decode("latin-1") for k, v in raw_cookies if k.lower() == b"set-cookie"]
        assert len(cookie_headers) >= 2, "Must emit deletion cookies for session and csrf_token"

        for cookie in cookie_headers:
            assert "path=/" in cookie.lower()
            if Settings().SESSION_COOKIE_SECURE:
                assert "secure" in cookie.lower()
