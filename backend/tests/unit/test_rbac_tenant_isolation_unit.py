"""
Unit Tests for Role-Based Access Control and Multi-Tenant College Isolation.
"""
import uuid
import pytest
from fastapi import HTTPException

from backend.app.api.deps import (
    AuthenticatedUser,
    enforce_tenant_college_id,
    require_roles,
)


class TestRBACTenantIsolationUnit:
    def test_require_roles_allows_matching_role(self):
        user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="admin@test.com",
            full_name="Admin",
        )
        checker = require_roles("super_admin", "college_admin")
        result = checker(user)
        assert result == user

    def test_require_roles_rejects_disallowed_role(self):
        user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@test.com",
            full_name="Student",
        )
        checker = require_roles("super_admin", "college_admin")
        with pytest.raises(HTTPException) as exc_info:
            checker(user)
        assert exc_info.value.status_code == 403
        assert "Access forbidden for role 'student'" in exc_info.value.detail

    def test_college_admin_accessing_own_college_id_succeeds(self):
        my_college_id = uuid.uuid4()
        user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="admin@college.edu",
            full_name="College Admin",
            college_id=my_college_id,
        )
        # Client requests own college ID
        effective = enforce_tenant_college_id(user, requested_college_id=my_college_id)
        assert effective == my_college_id

        # Client omits requested_college_id (inferred from session)
        effective_inferred = enforce_tenant_college_id(user, requested_college_id=None)
        assert effective_inferred == my_college_id

    def test_college_admin_cross_tenant_access_attempt_strictly_raises_403(self):
        my_college_id = uuid.uuid4()
        other_college_id = uuid.uuid4()
        user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="admin@college.edu",
            full_name="College Admin",
            college_id=my_college_id,
        )
        # Attempting to access another institution's ID
        with pytest.raises(HTTPException) as exc_info:
            enforce_tenant_college_id(user, requested_college_id=other_college_id)

        assert exc_info.value.status_code == 403
        assert "Tenant isolation violation" in exc_info.value.detail

    def test_super_admin_can_access_any_specified_college_id(self):
        target_college = uuid.uuid4()
        user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="super@skillmantra.com",
            full_name="Super Admin",
        )
        effective = enforce_tenant_college_id(user, requested_college_id=target_college)
        assert effective == target_college

    def test_super_admin_omitting_required_college_id_raises_400(self):
        user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="super@skillmantra.com",
            full_name="Super Admin",
        )
        with pytest.raises(HTTPException) as exc_info:
            enforce_tenant_college_id(user, requested_college_id=None)
        assert exc_info.value.status_code == 400
        assert "College ID parameter is required" in exc_info.value.detail

    def test_unauthorized_role_enforce_tenant_raises_403(self):
        user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@test.com",
            full_name="Student",
        )
        with pytest.raises(HTTPException) as exc_info:
            enforce_tenant_college_id(user, requested_college_id=uuid.uuid4())
        assert exc_info.value.status_code == 403

