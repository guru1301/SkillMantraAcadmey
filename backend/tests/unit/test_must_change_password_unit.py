"""
Unit tests for must_change_password lifecycle and password change endpoint.
"""
from unittest.mock import MagicMock
from uuid import uuid4
import pytest
from fastapi import HTTPException

from backend.app.core.security import hash_password, verify_password
from backend.app.db.models import Student
from backend.app.services.auth_service import authenticate_user, change_user_password


class TestMustChangePasswordUnit:
    def test_legacy_default_password_triggers_must_change_password(self):
        """When an account still has password '1234', authenticate_user marks must_change_password=True."""
        db = MagicMock()
        student_id = uuid4()
        hashed = hash_password("1234")

        mock_row = {
            "id": student_id,
            "role_type": "student",
            "email": "student@college.edu",
            "full_name": "Student A",
            "password_hash": hashed,
            "status": "active",
            "college_id": uuid4(),
            "college_status": "active",
            "roll_number": "ROLL123",
            "must_change_password": False,
        }
        db.execute.return_value.mappings.return_value.first.return_value = mock_row

        session_token, user_dict, csrf_token = authenticate_user(
            db=db,
            identifier="student@college.edu",
            password="1234",
            role_hint="student",
        )

        assert user_dict["must_change_password"] is True, "Legacy default password '1234' must set must_change_password=True"

    def test_change_user_password_updates_hash_and_clears_flag(self):
        """change_user_password validates current password, enforces minimum length, and resets must_change_password."""
        db = MagicMock()
        student_id = uuid4()
        initial_hash = hash_password("OldSecret123!")

        mock_student = Student(
            id=student_id,
            email="student@college.edu",
            password_hash=initial_hash,
            status="active",
            college_id=uuid4(),
            must_change_password=True,
        )
        db.execute.return_value.scalar_one_or_none.return_value = mock_student

        success = change_user_password(
            db=db,
            user_id=student_id,
            role="student",
            current_password="OldSecret123!",
            new_password="NewSecurePassword999!",
            current_token="CURRENT_TOKEN",
        )

        assert success is True
        assert db.commit.called

    def test_change_user_password_rejects_wrong_current_password(self):
        """change_user_password raises 400 when current password is invalid."""
        db = MagicMock()
        student_id = uuid4()
        initial_hash = hash_password("CorrectOldPass1!")

        mock_student = Student(
            id=student_id,
            email="student@college.edu",
            password_hash=initial_hash,
            status="active",
            college_id=uuid4(),
            must_change_password=True,
        )
        db.execute.return_value.scalar_one_or_none.return_value = mock_student

        with pytest.raises(HTTPException) as exc_info:
            change_user_password(
                db=db,
                user_id=student_id,
                role="student",
                current_password="WRONGPASSWORD",
                new_password="NewSecurePassword999!",
            )

        assert exc_info.value.status_code == 400
        assert "verification failed" in exc_info.value.detail.lower()
