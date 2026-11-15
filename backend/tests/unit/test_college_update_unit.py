"""
Unit Tests for PUT /colleges/{id} and college_service.update_college (B4 / P1-10):
- Reject college_admin with 403 when "status" is sent in PUT /colleges/{id}
- Ensure update_college never writes NULL to colleges.status
"""
from datetime import datetime, timezone
from unittest.mock import MagicMock
import uuid

import pytest
from fastapi import HTTPException

from backend.app.api.deps import AuthenticatedUser
from backend.app.api.v1.endpoints.colleges import update_college_profile
from backend.app.db.models.college import College
from backend.app.schemas.college import CollegeUpdate
from backend.app.services.college_service import update_college


def _make_college(college_id: uuid.UUID, status_value: str = "active") -> College:
    now = datetime.now(timezone.utc)
    return College(
        id=college_id,
        name="Original Institute",
        city="Bengaluru",
        state="Karnataka",
        contact_name="Dean",
        contact_email="dean@institute.edu",
        contact_phone="+91-9000000000",
        logo_url=None,
        status=status_value,
        created_at=now,
        updated_at=now,
    )


def _make_mock_db(college: College) -> MagicMock:
    db = MagicMock()
    exec_result = MagicMock()
    exec_result.scalar_one_or_none.return_value = college
    db.execute.return_value = exec_result

    def _simulate_refresh(obj):
        if not isinstance(obj.updated_at, datetime):
            obj.updated_at = datetime.now(timezone.utc)

    db.refresh.side_effect = _simulate_refresh
    return db


def _make_college_admin(college_id: uuid.UUID) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid.uuid4(),
        role="college_admin",
        email="cadmin@institute.edu",
        full_name="College Admin",
        college_id=college_id,
    )


def _make_super_admin() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=uuid.uuid4(),
        role="super_admin",
        email="super@skillmantra.com",
        full_name="Super Admin",
        college_id=None,
    )


class TestCollegeUpdateStatusProtectionUnit:
    def test_college_admin_sending_status_value_on_put_returns_403(self):
        college_id = uuid.uuid4()
        college = _make_college(college_id, status_value="active")
        db = _make_mock_db(college)
        admin = _make_college_admin(college_id)
        payload = CollegeUpdate(name="Renamed Institute", status="inactive")

        with pytest.raises(HTTPException) as exc_info:
            update_college_profile(
                college_id=college_id,
                payload=payload,
                current_user=admin,
                db=db,
            )

        assert exc_info.value.status_code == 403
        assert college.status == "active"
        db.commit.assert_not_called()

    def test_college_admin_sending_null_status_on_put_returns_403(self):
        college_id = uuid.uuid4()
        college = _make_college(college_id, status_value="active")
        db = _make_mock_db(college)
        admin = _make_college_admin(college_id)
        payload = CollegeUpdate.model_validate({"name": "Renamed Institute", "status": None})

        with pytest.raises(HTTPException) as exc_info:
            update_college_profile(
                college_id=college_id,
                payload=payload,
                current_user=admin,
                db=db,
            )

        assert exc_info.value.status_code == 403
        assert college.status == "active"
        db.commit.assert_not_called()

    def test_college_admin_updating_allowed_metadata_without_status_succeeds(self):
        college_id = uuid.uuid4()
        college = _make_college(college_id, status_value="active")
        db = _make_mock_db(college)
        admin = _make_college_admin(college_id)
        payload = CollegeUpdate(name="Updated Institute", city="Pune")

        res = update_college_profile(
            college_id=college_id,
            payload=payload,
            current_user=admin,
            db=db,
        )

        assert res.name == "Updated Institute"
        assert res.city == "Pune"
        assert res.status == "active"
        db.commit.assert_called_once()

    def test_update_college_service_never_writes_null_status(self):
        college_id = uuid.uuid4()
        college = _make_college(college_id, status_value="active")
        db = _make_mock_db(college)
        payload = CollegeUpdate.model_validate({"name": "Updated Institute", "status": None})

        updated = update_college(db, college_id, payload)

        assert updated is not None
        assert updated.name == "Updated Institute"
        assert updated.status == "active"
        db.commit.assert_called_once()

    def test_super_admin_putting_null_status_does_not_null_out_status(self):
        college_id = uuid.uuid4()
        college = _make_college(college_id, status_value="active")
        db = _make_mock_db(college)
        super_admin = _make_super_admin()
        payload = CollegeUpdate.model_validate({"name": "Super Renamed", "status": None})

        res = update_college_profile(
            college_id=college_id,
            payload=payload,
            current_user=super_admin,
            db=db,
        )

        assert res.name == "Super Renamed"
        assert res.status == "active"
        assert college.status == "active"

    def test_super_admin_putting_valid_status_updates_status(self):
        college_id = uuid.uuid4()
        college = _make_college(college_id, status_value="active")
        db = _make_mock_db(college)
        super_admin = _make_super_admin()
        payload = CollegeUpdate(status="inactive")

        res = update_college_profile(
            college_id=college_id,
            payload=payload,
            current_user=super_admin,
            db=db,
        )

        assert res.status == "inactive"
        assert college.status == "inactive"

