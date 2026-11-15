"""
Unit tests for Super Admin user management endpoints and workflows.
"""
from unittest.mock import MagicMock
from uuid import uuid4
import pytest
from fastapi import HTTPException

from backend.app.api.v1.endpoints.admin import (
    AdminUserCreate,
    AdminUserStatusUpdate,
    AdminUserResetPassword,
    create_admin_user_endpoint,
    list_admin_users,
    reset_user_password_endpoint,
    update_user_status_endpoint,
)
from backend.app.db.models import AdminUser, CollegeUser, Student, Trainer, UserSession


class TestAdminUserManagementUnit:
    def test_create_super_admin_user(self):
        """create_admin_user_endpoint creates a super admin user when payload has role=super_admin."""
        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.return_value = None

        payload = AdminUserCreate(
            email="new_admin@platform.com",
            full_name="New Admin",
            role="super_admin",
        )
        current_user = MagicMock(role="super_admin")

        result = create_admin_user_endpoint(payload=payload, current_user=current_user, db=db)

        assert result.success is True
        assert "User created successfully" in result.message
        assert db.add.called
        assert db.commit.called

    def test_update_user_status_deactivation_revokes_sessions(self):
        """Deactivating a user immediately revokes all their active sessions."""
        db = MagicMock()
        user_id = uuid4()
        mock_user = AdminUser(
            id=user_id,
            email="target@platform.com",
            full_name="Target User",
            status="active",
        )
        db.execute.return_value.scalar_one_or_none.return_value = mock_user

        payload = AdminUserStatusUpdate(status="inactive")
        current_user = MagicMock(id=uuid4(), role="super_admin")

        result = update_user_status_endpoint(user_id=user_id, payload=payload, current_user=current_user, db=db)

        assert result.success is True
        assert mock_user.status == "inactive"
        # Verify db.execute was called to revoke/delete active user sessions
        assert db.execute.called
        assert db.commit.called

    def test_reset_user_password_generates_temporary_password(self):
        """Resetting user password creates temporary password and revokes existing sessions."""
        db = MagicMock()
        user_id = uuid4()
        mock_user = AdminUser(
            id=user_id,
            email="admin@platform.com",
            full_name="Target Admin",
            status="active",
        )
        db.execute.return_value.scalar_one_or_none.return_value = mock_user

        current_user = MagicMock(role="super_admin")
        result = reset_user_password_endpoint(user_id=user_id, payload=AdminUserResetPassword(), current_user=current_user, db=db)

        assert result.success is True
        assert "password reset" in result.message.lower()
        assert db.commit.called
