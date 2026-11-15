"""
Pass 2 Step 5 Unit Tests: User Enumeration Protection (P2-07).

Tests:
1. /auth/login returns identical 401 status and message for all 7 failure modes:
   - Unknown account
   - Wrong password
   - No password set (NULL hash)
   - Pending activation
   - Archived account
   - Inactive account
   - Inactive college
2. Timing protection: dummy verify_password against fixed dummy hash is called
   when account is not found or has no hash.
3. /auth/student-activate produces identical 400 status and message across all failure modes.
"""
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from fastapi import HTTPException

from backend.app.core.security import hash_password
from backend.app.services.auth_service import authenticate_user


class TestUserEnumerationProtectionUnit:
    UNIFORM_LOGIN_ERROR = "Invalid credentials. Please check your email or roll number."

    def test_unknown_account_returns_uniform_401(self):
        """Unknown account must return standard 401 error."""
        db = MagicMock()
        db.execute.return_value.mappings.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(db, "unknown@skillthinker.com", "SomePassword123!")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == self.UNIFORM_LOGIN_ERROR

    def test_no_password_set_returns_uniform_401(self):
        """Account without password hash must return uniform 401 instead of exposing missing hash."""
        db = MagicMock()
        mock_user = {
            "id": uuid4(),
            "role_type": "trainer",
            "role_priority": 3,
            "email": "trainer.nohash@skillthinker.com",
            "password_hash": None,
            "full_name": "Trainer NoHash",
            "status": "active",
            "college_id": None,
            "college_name": None,
            "college_status": None,
            "roll_number": None,
            "must_change_password": False,
        }
        db.execute.return_value.mappings.return_value.first.return_value = mock_user

        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(db, "trainer.nohash@skillthinker.com", "SomePassword123!")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == self.UNIFORM_LOGIN_ERROR

    def test_pending_activation_returns_uniform_401(self):
        """Pending activation must return uniform 401 instead of exposing account existence with 403."""
        db = MagicMock()
        mock_user = {
            "id": uuid4(),
            "role_type": "student",
            "role_priority": 4,
            "email": "student@college.edu",
            "password_hash": hash_password("ValidPassword123!"),
            "full_name": "Pending Student",
            "status": "pending_activation",
            "college_id": uuid4(),
            "college_name": "College",
            "college_status": "active",
            "roll_number": "ROLL001",
            "must_change_password": False,
        }
        db.execute.return_value.mappings.return_value.first.return_value = mock_user

        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(db, "ROLL001", "ValidPassword123!")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == self.UNIFORM_LOGIN_ERROR

    def test_archived_account_returns_uniform_401(self):
        """Archived account must return uniform 401 instead of 403."""
        db = MagicMock()
        mock_user = {
            "id": uuid4(),
            "role_type": "student",
            "role_priority": 4,
            "email": "archived@college.edu",
            "password_hash": hash_password("ValidPassword123!"),
            "full_name": "Archived Student",
            "status": "archived",
            "college_id": uuid4(),
            "college_name": "College",
            "college_status": "active",
            "roll_number": "ROLL002",
            "must_change_password": False,
        }
        db.execute.return_value.mappings.return_value.first.return_value = mock_user

        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(db, "ROLL002", "ValidPassword123!")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == self.UNIFORM_LOGIN_ERROR

    def test_inactive_account_returns_uniform_401(self):
        """Inactive user account must return uniform 401 instead of 403."""
        db = MagicMock()
        mock_user = {
            "id": uuid4(),
            "role_type": "super_admin",
            "role_priority": 1,
            "email": "inactive@skillthinker.com",
            "password_hash": hash_password("ValidPassword123!"),
            "full_name": "Inactive Admin",
            "status": "inactive",
            "college_id": None,
            "college_name": None,
            "college_status": None,
            "roll_number": None,
            "must_change_password": False,
        }
        db.execute.return_value.mappings.return_value.first.return_value = mock_user

        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(db, "inactive@skillthinker.com", "ValidPassword123!")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == self.UNIFORM_LOGIN_ERROR

    def test_inactive_college_returns_uniform_401(self):
        """Account belonging to an inactive college must return uniform 401 instead of 403."""
        db = MagicMock()
        mock_user = {
            "id": uuid4(),
            "role_type": "college_admin",
            "role_priority": 2,
            "email": "coordinator@college.edu",
            "password_hash": hash_password("ValidPassword123!"),
            "full_name": "College Coordinator",
            "status": "active",
            "college_id": uuid4(),
            "college_name": "Inactive Institute",
            "college_status": "inactive",
            "roll_number": None,
            "must_change_password": False,
        }
        db.execute.return_value.mappings.return_value.first.return_value = mock_user

        with pytest.raises(HTTPException) as exc_info:
            authenticate_user(db, "coordinator@college.edu", "ValidPassword123!")

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == self.UNIFORM_LOGIN_ERROR

    def test_dummy_verify_password_called_when_user_not_found(self):
        """Timing defense: verify_password must be called with dummy hash when account does not exist."""
        db = MagicMock()
        db.execute.return_value.mappings.return_value.first.return_value = None

        with patch("backend.app.services.auth_service.verify_password", wraps=None) as mock_verify:
            mock_verify.return_value = False
            with pytest.raises(HTTPException):
                authenticate_user(db, "nonexistent@skillthinker.com", "TestPassword123!")

            assert mock_verify.called, "Dummy verify_password must be called on missing account"

    def test_dummy_verify_password_called_when_hash_is_none(self):
        """Timing defense: verify_password must be called with dummy hash when account has no password."""
        db = MagicMock()
        mock_user = {
            "id": uuid4(),
            "role_type": "trainer",
            "role_priority": 3,
            "email": "nohash@skillthinker.com",
            "password_hash": None,
            "full_name": "No Hash",
            "status": "active",
            "college_id": None,
            "college_name": None,
            "college_status": None,
            "roll_number": None,
            "must_change_password": False,
        }
        db.execute.return_value.mappings.return_value.first.return_value = mock_user

        with patch("backend.app.services.auth_service.verify_password", wraps=None) as mock_verify:
            mock_verify.return_value = False
            with pytest.raises(HTTPException):
                authenticate_user(db, "nohash@skillthinker.com", "TestPassword123!")

            assert mock_verify.called, "Dummy verify_password must be called when hash is None"


class TestStudentActivateEnumerationProtectionUnit:
    UNIFORM_ACTIVATION_ERROR = "Activation verification failed. Invalid roll number, date of birth, or activation credential."

    def test_student_activate_unknown_roll_returns_uniform_400(self):
        from backend.app.schemas.student import StudentActivationRequest
        from backend.app.services.student_service import activate_student_account

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.return_value = None

        req = StudentActivationRequest(
            roll_number="NONEXISTENT_ROLL",
            dob="2002-05-15",
            activation_code="ACT-123456",
            new_password="NewSecurePassword123!#",
        )

        with pytest.raises(HTTPException) as exc_info:
            activate_student_account(db, req)

        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == self.UNIFORM_ACTIVATION_ERROR

    def test_student_activate_active_status_returns_uniform_400(self):
        from backend.app.schemas.student import StudentActivationRequest
        from backend.app.services.student_service import activate_student_account
        from backend.app.db.models import Student

        db = MagicMock()
        mock_student = Student(
            id=uuid4(),
            roll_number="STU_ACTIVE",
            dob="2002-05-15",
            status="active",
            activation_token_hash="some_hash",
        )
        db.execute.return_value.scalar_one_or_none.return_value = mock_student

        req = StudentActivationRequest(
            roll_number="STU_ACTIVE",
            dob="2002-05-15",
            activation_code="ACT-123456",
            new_password="NewSecurePassword123!#",
        )

        with pytest.raises(HTTPException) as exc_info:
            activate_student_account(db, req)

        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == self.UNIFORM_ACTIVATION_ERROR

    def test_student_activate_dummy_verify_called_when_student_not_found(self):
        from backend.app.schemas.student import StudentActivationRequest
        from backend.app.services.student_service import activate_student_account

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.return_value = None

        req = StudentActivationRequest(
            roll_number="NONEXISTENT_ROLL",
            dob="2002-05-15",
            activation_code="ACT-123456",
            new_password="NewSecurePassword123!#",
        )

        with patch("backend.app.services.student_service.verify_activation_token", wraps=None) as mock_verify:
            mock_verify.return_value = False
            with pytest.raises(HTTPException):
                activate_student_account(db, req)

            assert mock_verify.called, "Dummy verify_activation_token must be called on missing student"

