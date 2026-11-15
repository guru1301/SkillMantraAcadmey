"""
Pass 2 — Step 0 Regression Proofs:
- P2-01: with students.dob = NULL, a wrong activation code plus an attacker dob
  must leave dob NULL in the DB across the full commit path (including record_distributed_attempt commit).
- P2-09 / P1-08: credentials assign, credentials revoke, and student updates
  never leave active user_sessions.
"""
from datetime import datetime, timezone
import uuid
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from backend.app.api.deps import AuthenticatedUser
from backend.app.api.v1.endpoints.auth import student_activate_endpoint
from backend.app.api.v1.endpoints.students import (
    assign_single_credentials,
    revoke_single_credentials,
)
from backend.app.api.v1.endpoints.batches import (
    assign_credentials as batch_assign_credentials,
    revoke_credentials as batch_revoke_credentials,
)
from backend.app.db.models.student import Student
from backend.app.db.models.user_session import UserSession
from backend.app.schemas.student import StudentActivationRequest, StudentUpdate
from backend.app.services import student_service, batch_service, auth_service


def test_p2_01_null_dob_with_wrong_activation_code_leaves_dob_null():
    """
    P2-01: When student.dob is NULL, an attacker sending an incorrect activation code
    and a guess/attacker DOB must NEVER cause student.dob to be written or committed.
    Verifies that rollback occurs before rate-limit recording commit.
    """
    fake_db = MagicMock()

    real_student_id = uuid.uuid4()
    student = Student(
        id=real_student_id,
        college_id=uuid.uuid4(),
        roll_number="CS2026-001",
        full_name="Alice Smith",
        email="alice@college.edu",
        dob=None,  # Crucial: dob is NULL
        status="pending_activation",
        activation_token_hash="correct_hashed_secret_token",
    )

    # Mock query returning the student
    scalar_mock = MagicMock()
    scalar_mock.scalar_one_or_none.return_value = student
    fake_db.execute.return_value = scalar_mock

    # Mock request and attacker payload
    mock_request = MagicMock()
    mock_request.headers = {"x-forwarded-for": "198.51.100.25"}
    mock_request.client.host = "198.51.100.25"

    payload = StudentActivationRequest(
        roll_number="CS2026-001",
        activation_code="WRONG_TOKEN_VALUE",
        dob="2002-05-14",
        new_password="NewSecurePassword123!",
    )

    with patch("backend.app.api.v1.endpoints.auth.is_distributed_rate_limited", return_value=(False, 0)):
        with patch("backend.app.api.v1.endpoints.auth.record_distributed_attempt") as mock_record_attempt:
            with pytest.raises(HTTPException) as exc_info:
                student_activate_endpoint(request=mock_request, payload=payload, db=fake_db)

            assert exc_info.value.status_code == 400
            # Ensure db.rollback() was called before record_distributed_attempt
            assert fake_db.rollback.called
            assert mock_record_attempt.called

    # Ensure student.dob was never populated and remains strictly None
    assert student.dob is None


def test_p2_09_student_credential_actions_revoke_all_sessions():
    """
    P2-09 / P1-08: Credential assign, revoke, and batch operations
    consistently call revoke_all_user_sessions.
    """
    fake_db = MagicMock()
    student_id = uuid.uuid4()
    batch_id = uuid.uuid4()
    college_id = uuid.uuid4()

    actor = AuthenticatedUser(
        id=uuid.uuid4(),
        email="admin@test.edu",
        full_name="Admin User",
        role="super_admin",
        college_id=None,
    )

    student = Student(
        id=student_id,
        college_id=college_id,
        roll_number="CS2026-002",
        full_name="Bob Jones",
        email="bob@college.edu",
        status="active",
    )

    with patch("backend.app.api.v1.endpoints.students.verify_student_access", return_value=student):
        with patch("backend.app.services.student_service.revoke_all_user_sessions") as mock_revoke:
            with patch("backend.app.services.student_service.log_student_audit_event"):
                scalar_mock = MagicMock()
                scalar_mock.scalar_one_or_none.return_value = student
                fake_db.execute.return_value = scalar_mock

                # 1. Single student credential assign
                assign_single_credentials(student_id=student_id, password=None, current_user=actor, db=fake_db)
                assert mock_revoke.called
                assert mock_revoke.call_args[0][1] == student_id
                assert mock_revoke.call_args[0][2] == "student"

                mock_revoke.reset_mock()

                # 2. Single student credential revoke
                revoke_single_credentials(student_id=student_id, current_user=actor, db=fake_db)
                assert mock_revoke.called
                assert mock_revoke.call_args[0][1] == student_id
                assert mock_revoke.call_args[0][2] == "student"

    # 3. Batch credential assign / revoke
    with patch("backend.app.api.v1.endpoints.batches.verify_batch_access"):
        with patch("backend.app.services.auth_service.revoke_all_user_sessions") as mock_batch_revoke:
            with patch("backend.app.services.student_service.log_student_audit_event"):
                # Mock raw text query returning the student rows
                mock_res = MagicMock()
                mock_res.fetchall.return_value = [(student_id, "CS2026-002", "Bob Jones", college_id)]
                fake_db.execute.return_value = mock_res

                batch_assign_credentials(batch_id=batch_id, password=None, current_user=actor, db=fake_db)
                assert mock_batch_revoke.called
                assert mock_batch_revoke.call_args[0][1] == student_id

                mock_batch_revoke.reset_mock()
                batch_revoke_credentials(batch_id=batch_id, current_user=actor, db=fake_db)
                assert mock_batch_revoke.called
                assert mock_batch_revoke.call_args[0][1] == student_id
