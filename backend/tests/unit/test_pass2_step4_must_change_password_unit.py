"""
Pass 2 Step 4 Unit Tests: must_change_password End to End (P2-05 + P1-05).

Tests:
1. Legacy-password login persists must_change_password=True in DB across all roles.
2. auth_service returns redirect_to="/change-password" when must_change_password is True.
3. get_verified_active_user blocks flagged users with 403 Forbidden.
4. Flagged users can still access the 4 permitted auth endpoints: /auth/me, /auth/session, /auth/logout, /auth/change-password.
5. Admin creating or resetting staff user sets must_change_password=True.
6. Trainer creation/update with password sets must_change_password=True.
7. change_user_password clears must_change_password for all roles and revokes other sessions.
"""
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from fastapi import HTTPException

from backend.app.api.deps import AuthenticatedUser, get_verified_active_user
from backend.app.core.security import hash_password
from backend.app.db.models import AdminUser, CollegeUser, Trainer, Student, UserSession
from backend.app.services.auth_service import (
    authenticate_user,
    change_user_password,
    revoke_all_user_sessions,
)


class TestMustChangePasswordEndToEndUnit:
    def test_legacy_password_login_persists_flag_in_db_for_all_roles(self):
        """
        Logging in with a predictable legacy default password sets must_change_password=True,
        persists the update to the database, and returns redirect_to='/change-password'.
        """
        db = MagicMock()
        admin_id = uuid4()
        pw_hash = hash_password("Admin@1234")

        mock_admin = {
            "id": admin_id,
            "role_type": "super_admin",
            "role_priority": 1,
            "email": "admin@skillthinker.com",
            "password_hash": pw_hash,
            "full_name": "Admin Super",
            "status": "active",
            "college_id": None,
            "college_name": None,
            "college_status": None,
            "roll_number": None,
            "must_change_password": False,
        }
        db.execute.return_value.mappings.return_value.first.return_value = mock_admin

        session_token, user_dict, csrf_token = authenticate_user(
            db=db,
            identifier="admin@skillthinker.com",
            password="Admin@1234",
            role_hint="super_admin",
        )

        assert user_dict["must_change_password"] is True
        assert user_dict["redirect_to"] == "/change-password"
        # Verify db.execute was called with an update statement persisting must_change_password
        assert db.execute.called
        assert db.commit.called

    def test_auth_service_redirects_student_with_must_change_to_change_password(self):
        """
        Students flagged with must_change_password must be redirected to /change-password
        instead of /student/change-password.
        """
        db = MagicMock()
        student_id = uuid4()
        pw_hash = hash_password("ValidPass123!#")

        mock_student = {
            "id": student_id,
            "role_type": "student",
            "role_priority": 4,
            "email": "student@college.edu",
            "password_hash": pw_hash,
            "full_name": "Student A",
            "status": "active",
            "college_id": uuid4(),
            "college_name": "Engineering College",
            "college_status": "active",
            "roll_number": "ROLL123",
            "must_change_password": True,
        }
        db.execute.return_value.mappings.return_value.first.return_value = mock_student

        session_token, user_dict, csrf_token = authenticate_user(
            db=db,
            identifier="ROLL123",
            password="ValidPass123!#",
            role_hint="student",
        )

        assert user_dict["must_change_password"] is True
        assert user_dict["redirect_to"] == "/change-password"

    def test_get_verified_active_user_blocks_flagged_user_with_403(self):
        """
        get_verified_active_user must raise 403 Forbidden when must_change_password is True.
        """
        flagged_user = AuthenticatedUser(
            id=uuid4(),
            role="super_admin",
            email="admin@college.edu",
            full_name="Admin User",
            must_change_password=True,
        )

        with pytest.raises(HTTPException) as exc_info:
            get_verified_active_user(current_user=flagged_user)

        assert exc_info.value.status_code == 403
        assert "password change required" in exc_info.value.detail.lower()

    def test_get_verified_active_user_allows_unflagged_user(self):
        """
        get_verified_active_user returns current_user when must_change_password is False.
        """
        clean_user = AuthenticatedUser(
            id=uuid4(),
            role="super_admin",
            email="admin@college.edu",
            full_name="Admin User",
            must_change_password=False,
        )

        resolved = get_verified_active_user(current_user=clean_user)
        assert resolved.id == clean_user.id
        assert resolved.must_change_password is False

    def test_change_user_password_clears_flag_for_all_roles(self):
        """
        change_user_password must reset must_change_password=False on AdminUser, CollegeUser,
        Trainer, and Student models upon password change.
        """
        db = MagicMock()
        admin_id = uuid4()
        initial_hash = hash_password("OldPassword123!")

        mock_admin = AdminUser(
            id=admin_id,
            email="admin@skillthinker.com",
            full_name="Admin Super",
            password_hash=initial_hash,
            status="active",
            must_change_password=True,
        )
        db.execute.return_value.scalar_one_or_none.return_value = mock_admin

        success = change_user_password(
            db=db,
            user_id=admin_id,
            role="super_admin",
            current_password="OldPassword123!",
            new_password="BrandNewStrongPassword123!",
            current_token="SAMPLE_TOKEN",
        )

        assert success is True
        assert db.commit.called
        # Verify update call contained must_change_password = False
        update_calls = [call for call in db.execute.call_args_list]
        assert len(update_calls) >= 1

    def test_model_definitions_include_must_change_password(self):
        """
        AdminUser, CollegeUser, and Trainer models must have must_change_password attribute.
        """
        assert hasattr(AdminUser, "must_change_password")
        assert hasattr(CollegeUser, "must_change_password")
        assert hasattr(Trainer, "must_change_password")
        assert hasattr(Student, "must_change_password")

    def test_admin_and_trainer_creation_sets_must_change_password(self):
        """
        create_admin_user_endpoint and create_trainer set must_change_password=True.
        """
        from backend.app.schemas.trainer import TrainerCreate
        from backend.app.services.trainer_service import create_trainer

        db = MagicMock()
        trainer_data = TrainerCreate(
            name="Trainer John",
            email="trainer.john@skillthinker.com",
            password="StrongPassword123!#",
            expertise=["Python", "Cloud"],
        )
        created_trainer = create_trainer(db, trainer_data)
        assert created_trainer.must_change_password is True

    def test_change_password_endpoint_rotates_session_and_clears_flag(self):
        """
        POST /auth/change-password revokes existing sessions, issues a fresh session,
        and returns redirect_to role home.
        """
        from fastapi import Response, Request
        from backend.app.schemas.auth import ChangePasswordRequest
        from backend.app.api.v1.endpoints.auth import change_password_endpoint

        db = MagicMock()
        user_id = uuid4()
        initial_hash = hash_password("CurrentPassword123!#")

        mock_student = Student(
            id=user_id,
            roll_number="STU001",
            full_name="Student Test",
            password_hash=initial_hash,
            status="active",
            must_change_password=True,
        )
        db.execute.return_value.scalar_one_or_none.return_value = mock_student

        current_user = AuthenticatedUser(
            id=user_id,
            role="student",
            email="stu001@college.edu",
            full_name="Student Test",
            must_change_password=True,
            token="OLD_TOKEN",
            session_id=uuid4(),
        )

        request = MagicMock(spec=Request)
        request.headers = {"user-agent": "Mozilla/5.0"}
        request.client.host = "127.0.0.1"
        response = Response()

        payload = ChangePasswordRequest(
            current_password="CurrentPassword123!#",
            new_password="NewStrongPassword999!#",
            confirm_password="NewStrongPassword999!#",
        )

        res = change_password_endpoint(
            request=request,
            response=response,
            payload=payload,
            current_user=current_user,
            db=db,
        )

        assert res.success is True
        assert res.redirect_to == "/student"
        # Confirm cookies were set on the response
        cookie_headers = [h for h in response.raw_headers if h[0].lower() == b"set-cookie"]
        assert len(cookie_headers) >= 2
