"""
Unit Tests for Authentication Service, Password Hashing, and Session Token Security.
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
import uuid
import pytest
from fastapi import HTTPException

from backend.app.core.security import (
    generate_csrf_token,
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_csrf_token,
    verify_password,
)
from backend.app.services.auth_service import authenticate_user, revoke_session


class TestAuthSecurityUnit:
    def test_bcrypt_password_hashing_and_verification(self):
        pw = "SuperSecurePassword123!"
        hashed = hash_password(pw)
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
        assert verify_password(pw, hashed) is True
        assert verify_password("WrongPassword!", hashed) is False
        assert verify_password("", hashed) is False
        assert verify_password(pw, "") is False

    def test_empty_password_hashing_raises_value_error(self):
        with pytest.raises(ValueError, match="Password cannot be empty"):
            hash_password("")

    def test_argon2_password_verification_compatibility(self):
        from argon2 import PasswordHasher
        ph = PasswordHasher()
        argon_hash = ph.hash("ArgonTestPassword@123")
        assert verify_password("ArgonTestPassword@123", argon_hash) is True
        assert verify_password("WrongPassword", argon_hash) is False

    def test_session_token_entropy_and_sha256_hashing(self):
        token1 = generate_session_token()
        token2 = generate_session_token()
        assert len(token1) == 64  # 32 bytes hex encoded = 64 hex chars
        assert token1 != token2

        hash1 = hash_session_token(token1)
        hash2 = hash_session_token(token2)
        assert len(hash1) == 64
        assert hash1 != hash2
        assert hash1 == hash_session_token(token1)  # deterministic hash

    def test_empty_session_token_hash_raises_value_error(self):
        with pytest.raises(ValueError, match="Session token cannot be empty"):
            hash_session_token("")

    def test_csrf_token_generation_and_verification(self):
        csrf = generate_csrf_token()
        assert len(csrf) >= 32
        assert verify_csrf_token(csrf, csrf) is True
        assert verify_csrf_token(csrf, "tampered_token") is False
        assert verify_csrf_token(None, csrf) is False
        assert verify_csrf_token(csrf, None) is False

    def test_authenticate_user_rejects_nonexistent_user(self):
        mock_db = MagicMock()
        mock_result = MagicMock()
        mock_result.mappings.return_value.first.return_value = None
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(mock_db, "nonexistent@test.com", "Password123")
        assert exc_info.value.status_code == 401
        assert "Invalid credentials" in exc_info.value.detail

    def test_authenticate_user_rejects_inactive_user(self):
        mock_db = MagicMock()
        user_row = {
            "id": uuid.uuid4(),
            "role_type": "super_admin",
            "email": "inactive@test.com",
            "password_hash": hash_password("Password123"),
            "full_name": "Inactive Admin",
            "status": "inactive",
            "college_id": None,
            "college_name": None,
            "college_status": None,
        }
        mock_result = MagicMock()
        mock_result.mappings.return_value.first.return_value = user_row
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(mock_db, "inactive@test.com", "Password123")
        assert exc_info.value.status_code == 401
        assert "Invalid credentials" in exc_info.value.detail

    def test_authenticate_user_rejects_inactive_college_for_college_admin(self):
        mock_db = MagicMock()
        user_row = {
            "id": uuid.uuid4(),
            "role_type": "college_admin",
            "email": "college@test.com",
            "password_hash": hash_password("Password123"),
            "full_name": "College Admin",
            "status": "active",
            "college_id": uuid.uuid4(),
            "college_name": "Test College",
            "college_status": "inactive",
        }
        mock_result = MagicMock()
        mock_result.mappings.return_value.first.return_value = user_row
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(mock_db, "college@test.com", "Password123")
        assert exc_info.value.status_code == 401
        assert "Invalid credentials" in exc_info.value.detail

    def test_authenticate_user_success_creates_session_and_returns_token(self):
        mock_db = MagicMock()
        pw = "CorrectPassword123!"
        user_id = uuid.uuid4()
        user_row = {
            "id": user_id,
            "role_type": "super_admin",
            "email": "admin@test.com",
            "password_hash": hash_password(pw),
            "full_name": "Super Admin",
            "status": "active",
            "college_id": None,
            "college_name": None,
            "college_status": None,
        }
        mock_result = MagicMock()
        mock_result.mappings.return_value.first.return_value = user_row
        mock_db.execute.return_value = mock_result

        token, user_dict, csrf_token = authenticate_user(
            mock_db, "admin@test.com", pw, ip_address="127.0.0.1", user_agent="Pytest"
        )
        assert len(token) == 64
        assert user_dict["id"] == user_id
        assert user_dict["redirect_to"] == "/admin/dashboard"
        assert len(csrf_token) >= 32
        assert mock_db.add.called
        assert mock_db.commit.called

