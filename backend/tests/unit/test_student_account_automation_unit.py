"""
Unit tests for Student Account Provisioning, Identity Verification Activation,
and Bulk Account Management Safeguards.
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
import math
import pytest
from fastapi import HTTPException

from backend.app.core.security import (
    generate_activation_code,
    hash_activation_token,
    verify_activation_token,
    normalize_dob,
    verify_password,
)
from backend.app.core.rate_limiter import activation_identifier_rate_limiter, login_ip_rate_limiter
from backend.app.db.models import Batch, Student, UserSession
from backend.app.schemas.student import (
    BulkStudentItem,
    StudentActivationRequest,
    BulkStudentActionPayload,
)
from backend.app.services.student_service import (
    check_student_academic_history,
    normalize_dob,
    preview_roster_import,
    execute_roster_import_and_provision,
    activate_student_account,
    update_student_account_status,
    reset_student_activation_credential,
    revoke_student_active_sessions,
    delete_or_archive_student,
    execute_bulk_student_action,
)


class TestStudentSecurityHelpers:
    def test_normalize_dob_various_formats(self):
        """normalize_dob should standardize YYYY-MM-DD, DD-MM-YYYY, and DD/MM/YYYY into ISO YYYY-MM-DD."""
        assert normalize_dob("2004-05-15") == "2004-05-15"
        assert normalize_dob("15-05-2004") == "2004-05-15"
        assert normalize_dob("15/05/2004") == "2004-05-15"
        assert normalize_dob("2004/05/15") == "2004-05-15"
        assert normalize_dob(None) is None
        assert normalize_dob("   ") is None
        assert normalize_dob("invalid-date") == "invalid-date"

    def test_activation_token_generation_and_entropy(self):
        """Activation tokens must have >= 128 bits of cryptographic entropy."""
        token = generate_activation_code()
        assert token.startswith("ACT-")
        # Strip ACT- prefix and hyphens to get raw secret characters
        raw_secret = token.replace("ACT-", "").replace("-", "")
        # 26 characters from an unambiguous 32-character alphabet
        assert len(raw_secret) >= 26
        # Entropy = 26 * log2(32) = 26 * 5 = 130 bits >= 128 bits
        entropy_bits = len(raw_secret) * math.log2(32)
        assert entropy_bits >= 128.0

        # Verify SHA-256 hash
        token_hash = hash_activation_token(token)
        assert token_hash != token
        assert verify_activation_token(token, token_hash) is True
        # Case and hyphen insensitivity in verification
        assert verify_activation_token(token.lower(), token_hash) is True
        assert verify_activation_token(token.replace("-", ""), token_hash) is True
        assert verify_activation_token("ACT-WRONG-TOKEN-1234567890", token_hash) is False


class TestRosterImportAndProvisioning:
    def test_preview_roster_import_identifies_new_and_duplicates(self):
        """preview_roster_import flags new students, in-file duplicates, and existing DB students."""
        db = MagicMock()
        college_id = uuid4()
        batch_id = uuid4()

        mock_batch = Batch(id=batch_id, college_id=college_id)

        res1 = MagicMock()
        res1.scalar_one_or_none.return_value = mock_batch

        res2 = MagicMock()
        res2.all.return_value = [("roll001",)]

        res3 = MagicMock()
        res3.all.return_value = []

        db.execute.side_effect = [res1, res2, res3]

        items = [
            BulkStudentItem(rollNumber="ROLL001", fullName="Existing Student", dob="2003-01-01"),
            BulkStudentItem(rollNumber="ROLL002", fullName="New Student 1", dob="2004-02-02"),
            BulkStudentItem(rollNumber="ROLL002", fullName="Duplicate Roll In File", dob="2004-02-02"),
        ]

        result = preview_roster_import(
            db=db,
            batch_id=batch_id,
            students=items,
            enforced_college_id=None,
        )

        assert result.totalRows == 3
        assert result.validNewCount == 1
        assert result.existingCount == 1
        assert result.duplicateCount == 1

        rows = result.previewRows
        assert rows[0].status == "existing"
        assert rows[1].status == "new"
        assert rows[2].status == "duplicate_in_file"

    def test_preview_roster_enforces_college_admin_tenant_isolation(self):
        """College admin cannot preview roster for a batch in a different college."""
        db = MagicMock()
        admin_college = uuid4()
        batch_college = uuid4()
        batch_id = uuid4()

        mock_batch = Batch(id=batch_id, college_id=batch_college)
        db.execute.return_value.scalar_one_or_none.return_value = mock_batch

        with pytest.raises(HTTPException) as exc_info:
            preview_roster_import(
                db=db,
                batch_id=batch_id,
                students=[],
                enforced_college_id=admin_college,
            )

        assert exc_info.value.status_code == 403

    def test_execute_roster_import_and_provision_provisions_pending_accounts(self):
        """execute_roster_import_and_provision creates accounts in pending_activation with hashed tokens."""
        db = MagicMock()
        college_id = uuid4()
        batch_id = uuid4()

        mock_batch = Batch(id=batch_id, college_id=college_id)
        db.execute.side_effect = [
            MagicMock(scalar_one_or_none=MagicMock(return_value=mock_batch)),
            MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))),
            MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))),
        ]

        items = [
            BulkStudentItem(
                rollNumber="CS2026-001",
                fullName="Alice Kumar",
                email="alice@college.edu",
                dob="2004-07-21",
                gender="Female",
                department="Computer Science",
            ),
        ]

        result = execute_roster_import_and_provision(
            db=db,
            batch_id=batch_id,
            students=items,
            actor_id=uuid4(),
            actor_role="super_admin",
            actor_email="admin@platform.com",
            enforced_college_id=None,
        )

        assert result.success is True
        assert result.accountsProvisioned == 1
        assert len(result.activationCredentials) == 1

        cred = result.activationCredentials[0]
        assert cred.rollNumber == "CS2026-001"
        assert cred.fullName == "Alice Kumar"
        assert cred.activationCode.startswith("ACT-")

        # Verify Student object added to DB has hashed token, not plaintext
        added_objects = [call[0][0] for call in db.add.call_args_list]
        student_obj = next(obj for obj in added_objects if isinstance(obj, Student))
        assert student_obj.status == "pending_activation"
        assert student_obj.must_change_password is True
        assert student_obj.activation_token_hash is not None
        assert student_obj.activation_token_hash != cred.activationCode
        assert verify_activation_token(cred.activationCode, student_obj.activation_token_hash) is True
        assert student_obj.dob == "2004-07-21"

    def test_preview_roster_gives_no_signal_for_roll_in_another_college(self):
        """Roll number registered in College A must give zero conflict/existence signal to College B."""
        db = MagicMock()
        college_b = uuid4()
        batch_b = uuid4()
        mock_batch = Batch(id=batch_b, college_id=college_b)

        res_batch = MagicMock()
        res_batch.scalar_one_or_none.return_value = mock_batch
        res_own_college = MagicMock()
        res_own_college.all.return_value = []
        # If code queries other colleges, simulate roll existing in College A:
        res_other_college = MagicMock()
        res_other_college.all.return_value = [("21cs001",)]
        db.execute.side_effect = [res_batch, res_own_college, res_other_college]

        result = preview_roster_import(
            db=db,
            batch_id=batch_b,
            students=[BulkStudentItem(rollNumber="21CS001", fullName="Student B", dob="2004-01-01")],
            enforced_college_id=college_b,
        )

        assert result.conflictCount == 0
        assert result.validNewCount == 1
        assert result.previewRows[0].status == "new"
        assert "different college" not in result.previewRows[0].message.lower()
        assert db.execute.call_count == 2

    def test_execute_roster_import_gives_no_signal_for_roll_in_another_college(self):
        """Importing a roll number used in College A succeeds cleanly in College B with no cross-tenant leak."""
        db = MagicMock()
        college_b = uuid4()
        batch_b = uuid4()
        mock_batch = Batch(id=batch_b, college_id=college_b, code="B-2026")

        res_batch = MagicMock()
        res_batch.scalar_one_or_none.return_value = mock_batch
        res_own_students = MagicMock()
        res_own_students.scalars.return_value.all.return_value = []
        # If code queries other colleges, simulate roll existing in College A:
        res_other_college = MagicMock()
        res_other_college.all.return_value = [("21cs001",)]
        db.execute.side_effect = [res_batch, res_own_students, res_other_college]

        result = execute_roster_import_and_provision(
            db=db,
            batch_id=batch_b,
            students=[BulkStudentItem(rollNumber="21CS001", fullName="Student B", dob="2004-01-01")],
            actor_id=uuid4(),
            actor_role="college_admin",
            actor_email="admin@collegeb.edu",
            enforced_college_id=college_b,
        )

        assert result.skippedCount == 0
        assert result.accountsProvisioned == 1
        assert result.errors == []
        assert db.execute.call_count == 2


class TestStudentAccountActivation:
    def test_activate_student_account_success(self):
        """activate_student_account verifies DOB + token, updates password, and sets status active."""
        db = MagicMock()
        student_id = uuid4()
        activation_code = generate_activation_code()
        token_hash = hash_activation_token(activation_code)

        student = Student(
            id=student_id,
            roll_number="ROLL-101",
            full_name="Bob Smith",
            dob="2003-09-15",
            status="pending_activation",
            must_change_password=True,
            activation_token_hash=token_hash,
            activation_token_expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        db.execute.return_value.scalar_one_or_none.return_value = student

        payload = StudentActivationRequest(
            roll_number="ROLL-101",
            dob="15-09-2003",  # Non-ISO format normalized successfully
            activation_code=activation_code,
            new_password="BrandNewStrongPassword@2026",
        )

        result = activate_student_account(db=db, request=payload)

        assert result["success"] is True
        assert result["rollNumber"] == "ROLL-101"
        assert student.status == "active"
        assert student.must_change_password is False
        assert student.activation_token_hash is None
        assert student.activated_at is not None
        assert verify_password("BrandNewStrongPassword@2026", student.password_hash) is True
        assert db.commit.called

    def test_activate_student_account_anti_enumeration_uniform_errors(self):
        """Wrong DOB, wrong token, expired token, and nonexistent student must return the identical error."""
        db = MagicMock()
        student_id = uuid4()
        activation_code = generate_activation_code()
        token_hash = hash_activation_token(activation_code)

        # 1. Nonexistent student
        db.execute.return_value.scalar_one_or_none.return_value = None
        with pytest.raises(HTTPException) as exc1:
            activate_student_account(
                db=db,
                request=StudentActivationRequest(
                    roll_number="NONEXISTENT",
                    dob="2003-09-15",
                    activation_code=activation_code,
                    new_password="StrongPassword123!",
                ),
            )

        # 2. Wrong DOB
        student = Student(
            id=student_id,
            roll_number="ROLL-101",
            dob="2003-09-15",
            status="pending_activation",
            activation_token_hash=token_hash,
            activation_token_expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        db.execute.return_value.scalar_one_or_none.return_value = student
        with pytest.raises(HTTPException) as exc2:
            activate_student_account(
                db=db,
                request=StudentActivationRequest(
                    roll_number="ROLL-101",
                    dob="2003-09-16",  # Incorrect DOB
                    activation_code=activation_code,
                    new_password="StrongPassword123!",
                ),
            )

        # 3. Wrong Token
        with pytest.raises(HTTPException) as exc3:
            activate_student_account(
                db=db,
                request=StudentActivationRequest(
                    roll_number="ROLL-101",
                    dob="2003-09-15",
                    activation_code="ACT-WRONG-CODE-9999999999",
                    new_password="StrongPassword123!",
                ),
            )

        # 4. Expired Token
        expired_student = Student(
            id=student_id,
            roll_number="ROLL-101",
            dob="2003-09-15",
            status="pending_activation",
            activation_token_hash=token_hash,
            activation_token_expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
        db.execute.return_value.scalar_one_or_none.return_value = expired_student
        with pytest.raises(HTTPException) as exc4:
            activate_student_account(
                db=db,
                request=StudentActivationRequest(
                    roll_number="ROLL-101",
                    dob="2003-09-15",
                    activation_code=activation_code,
                    new_password="StrongPassword123!",
                ),
            )

        # Verify all four raise identical HTTP 400 with the exact same error string
        assert exc1.value.status_code == 400
        assert exc2.value.status_code == 400
        assert exc3.value.status_code == 400
        assert exc4.value.status_code == 400
        assert exc1.value.detail == exc2.value.detail == exc3.value.detail == exc4.value.detail
        assert "activation verification failed" in exc1.value.detail.lower()

    def test_activate_student_account_rejects_password_matching_dob(self):
        """activate_student_account forbids setting password containing date of birth."""
        from pydantic import ValidationError
        db = MagicMock()
        activation_code = generate_activation_code()
        student = Student(
            id=uuid4(),
            roll_number="ROLL-101",
            dob="2003-09-15",
            status="pending_activation",
            activation_token_hash=hash_activation_token(activation_code),
            activation_token_expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        db.execute.return_value.scalar_one_or_none.return_value = student

        # 1. Schema rejects password containing DOB
        with pytest.raises(ValidationError):
            StudentActivationRequest(
                roll_number="ROLL-101",
                dob="2003-09-15",
                activation_code=activation_code,
                new_password="StrongSecret#20030915",
            )

        # 2. Service rejects password containing DOB with 422 if constructed directly
        payload = StudentActivationRequest.model_construct(
            roll_number="ROLL-101",
            dob="2003-09-15",
            activation_code=activation_code,
            new_password="StrongSecret#20030915",
        )

        with pytest.raises(HTTPException) as exc_info:
            activate_student_account(db=db, request=payload)

        assert exc_info.value.status_code == 422
        assert "date of birth" in exc_info.value.detail.lower() or "dob" in exc_info.value.detail.lower()

    def test_wrong_activation_code_leaves_null_dob_unchanged(self):
        """Failed activation with wrong code must never mutate student.dob when stored DOB is NULL."""
        db = MagicMock()
        activation_code = generate_activation_code()
        student = Student(
            id=uuid4(),
            roll_number="ROLL-101",
            dob=None,
            status="pending_activation",
            activation_token_hash=hash_activation_token(activation_code),
            activation_token_expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        db.execute.return_value.scalar_one_or_none.return_value = student

        payload = StudentActivationRequest(
            roll_number="ROLL-101",
            dob="2001-01-01",
            activation_code="ACT-WRONG-CODE-9999999999",
            new_password="StrongPassword123!",
        )

        with pytest.raises(HTTPException) as exc_info:
            activate_student_account(db=db, request=payload)

        assert exc_info.value.status_code == 400
        assert student.dob is None

    def test_null_stored_dob_with_valid_code_is_rejected_and_unchanged(self):
        """Activation must not set student.dob from the request when stored DOB is NULL."""
        db = MagicMock()
        activation_code = generate_activation_code()
        student = Student(
            id=uuid4(),
            roll_number="ROLL-101",
            dob=None,
            status="pending_activation",
            activation_token_hash=hash_activation_token(activation_code),
            activation_token_expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        db.execute.return_value.scalar_one_or_none.return_value = student

        payload = StudentActivationRequest(
            roll_number="ROLL-101",
            dob="2001-01-01",
            activation_code=activation_code,
            new_password="StrongPassword123!",
        )

        with pytest.raises(HTTPException) as exc_info:
            activate_student_account(db=db, request=payload)

        assert exc_info.value.status_code == 400
        assert student.dob is None

    def test_student_activate_endpoint_rolls_back_before_recording_rate_limit(self):
        """auth.student_activate_endpoint must call db.rollback() before recording failed attempts."""
        from backend.app.api.v1.endpoints.auth import student_activate_endpoint

        call_order = []
        db = MagicMock()
        db.rollback.side_effect = lambda: call_order.append("rollback")

        mock_req = MagicMock()
        mock_req.client.host = "203.0.113.10"
        mock_req.headers = {}

        payload = StudentActivationRequest(
            roll_number="ROLL-101",
            dob="2001-01-01",
            activation_code="ACT-WRONG-CODE-9999999999",
            new_password="StrongPassword123!",
        )

        with patch("backend.app.api.v1.endpoints.auth.is_distributed_rate_limited", return_value=(False, 5)), \
             patch("backend.app.api.v1.endpoints.auth.activate_student_account", side_effect=HTTPException(status_code=400, detail="bad")), \
             patch(
                 "backend.app.api.v1.endpoints.auth.record_distributed_attempt",
                 side_effect=lambda *a, **kw: call_order.append("record"),
             ):
            with pytest.raises(HTTPException) as exc_info:
                student_activate_endpoint(request=mock_req, payload=payload, db=db)

        assert exc_info.value.status_code == 400
        assert db.rollback.called
        assert call_order and call_order[0] == "rollback"

    def test_activation_rate_limiter_trips_after_five_attempts(self):
        """Activation rate limiter allows 5 attempts per roll number then blocks with 429."""
        roll = "rate-limit-test-roll"
        activation_identifier_rate_limiter.clear_all()

        for _ in range(5):
            allowed, _ = activation_identifier_rate_limiter.is_allowed(roll)
            assert allowed is True
            activation_identifier_rate_limiter.record_attempt(roll)

        # 6th attempt must be rejected
        allowed_sixth, remaining = activation_identifier_rate_limiter.is_allowed(roll)
        assert allowed_sixth is False
        assert remaining == 0

        # Successful activation resets the bucket
        activation_identifier_rate_limiter.reset(roll)
        allowed_after_reset, _ = activation_identifier_rate_limiter.is_allowed(roll)
        assert allowed_after_reset is True


class TestAccountManagementAndSafeguards:
    def test_update_student_status_deactivation_revokes_sessions(self):
        """Deactivating a student account revokes all active sessions."""
        db = MagicMock()
        student_id = uuid4()
        student = Student(id=student_id, status="active", roll_number="ROLL-1", college_id=uuid4(), full_name="Student One")
        db.execute.return_value.scalar_one_or_none.return_value = student

        result = update_student_account_status(
            db=db,
            student_id=student_id,
            new_status="inactive",
            actor_id=uuid4(),
            actor_role="super_admin",
            actor_email="admin@platform.com",
        )

        assert student.status == "inactive"
        assert db.execute.called
        assert db.commit.called

    def test_reset_student_activation_credential_generates_new_code(self):
        """reset_student_activation_credential generates fresh code with >= 128-bit entropy."""
        db = MagicMock()
        student_id = uuid4()
        student = Student(
            id=student_id,
            roll_number="ROLL-102",
            full_name="Carol White",
            status="active",
            college_id=uuid4(),
        )
        db.execute.return_value.scalar_one_or_none.return_value = student

        success, new_code = reset_student_activation_credential(
            db=db,
            student_id=student_id,
            actor_id=uuid4(),
            actor_role="super_admin",
            actor_email="admin@platform.com",
        )

        assert success is True
        assert student.status == "pending_activation"
        assert student.must_change_password is True
        assert new_code.startswith("ACT-")
        assert len(new_code.replace("ACT-", "").replace("-", "")) >= 26
        assert verify_activation_token(new_code, student.activation_token_hash) is True
        assert db.commit.called

    def test_revoke_student_active_sessions_revokes_sessions(self):
        """revoke_student_active_sessions revokes user sessions and records audit log."""
        db = MagicMock()
        student_id = uuid4()
        student = Student(id=student_id, roll_number="ROLL-1", college_id=uuid4(), full_name="Student One")
        db.execute.return_value.scalar_one_or_none.return_value = student
        db.execute.return_value.rowcount = 2

        count = revoke_student_active_sessions(
            db=db,
            student_id=student_id,
            actor_id=uuid4(),
            actor_role="super_admin",
            actor_email="admin@platform.com",
        )

        assert count == 2
        assert db.commit.called

    @patch("backend.app.services.student_service.check_student_academic_history")
    def test_delete_student_with_academic_history_blocked_from_permanent_deletion(self, mock_history):
        """Deleting a student with existing academic records raises 400 when mode='permanent'."""
        db = MagicMock()
        student_id = uuid4()
        student = Student(id=student_id, roll_number="ROLL-1", college_id=uuid4(), full_name="Student")
        db.execute.return_value.scalar_one_or_none.return_value = student

        mock_history.return_value = {
            "has_history": True,
            "attendance_count": 5,
            "submissions_count": 2,
            "proctoring_events_count": 0,
            "feedback_count": 1,
            "certificates_count": 0,
            "total_records": 8,
            "summary": "5 session attendances, 2 exam submissions, 1 feedback entries",
        }

        # Permanent deletion attempted -> should be rejected
        with pytest.raises(HTTPException) as exc_info:
            delete_or_archive_student(
                db=db,
                student_id=student_id,
                mode="permanent",
                actor_id=uuid4(),
                actor_role="super_admin",
                actor_email="admin@platform.com",
            )

        assert exc_info.value.status_code == 400
        assert "cannot permanently delete" in exc_info.value.detail.lower()

        # Archival requested -> should succeed safely without deleting
        result = delete_or_archive_student(
            db=db,
            student_id=student_id,
            mode="archive",
            actor_id=uuid4(),
            actor_role="super_admin",
            actor_email="admin@platform.com",
        )
        assert result["mode"] == "archived"
        assert student.status == "archived"
        assert student.archived_at is not None

    def test_bulk_student_action_deduplicates_ids_and_handles_tenant_isolation(self):
        """execute_bulk_student_action deduplicates input IDs and skips cross-college students."""
        db = MagicMock()
        admin_college = uuid4()
        other_college = uuid4()
        student1_id = uuid4()
        student2_id = uuid4()

        s1 = Student(id=student1_id, roll_number="R1", status="active", college_id=admin_college, full_name="S1")
        s2 = Student(id=student2_id, roll_number="R2", status="active", college_id=other_college, full_name="S2 (Other College)")

        scalar_queue = [s1]
        def mock_execute(stmt, *args, **kwargs):
            mock_res = MagicMock()
            mock_res.scalars.return_value.all.return_value = [s1, s2]
            def pop_scalar():
                return scalar_queue.pop(0) if scalar_queue else None
            mock_res.scalar_one_or_none.side_effect = pop_scalar
            return mock_res

        db.execute.side_effect = mock_execute

        # Pass student1_id twice (duplicate) and student2_id (other college)
        payload = BulkStudentActionPayload(
            student_ids=[student1_id, student1_id, student2_id],
            action="deactivate",
        )

        result = execute_bulk_student_action(
            db=db,
            payload=payload,
            actor_id=uuid4(),
            actor_role="college_admin",
            actor_email="college_admin@college.edu",
            tenant_college_id=admin_college,
        )

        # totalSelected should be deduplicated (2 unique students)
        assert result.totalSelected == 2
        # student 1 processed, student 2 skipped due to tenant restriction
        assert result.processedCount == 1
        assert result.skippedCount == 1
        assert s1.status == "inactive"
        assert s2.status == "active"  # untouched!

    def test_check_student_academic_history_includes_batch_enrollments(self):
        """check_student_academic_history must count batch_students and block permanent deletion."""
        db = MagicMock()
        student_id = uuid4()
        # Mock scalar returns for:
        # 1. attendance count = 0
        # 2. submissions count = 0
        # 3. proctoring events count = 0
        # 4. feedback count = 0
        # 5. certificates count = 0
        # 6. batch_students count = 2
        # 7. audit_logs count = 1
        db.execute.return_value.scalar.side_effect = [0, 0, 0, 0, 0, 2, 1]

        history = check_student_academic_history(db, student_id)

        assert history["has_history"] is True
        assert history["total_records"] == 2
        assert history["enrollments_count"] == 2
        assert "2 batch enrollments" in history["summary"]

    def test_delete_student_with_zero_history_permanent_deletion_succeeds(self):
        """A student with zero academic and zero enrollment records can be permanently deleted."""
        db = MagicMock()
        student_id = uuid4()
        student = Student(id=student_id, roll_number="CLEAN-001", college_id=uuid4(), full_name="Clean Student")
        db.execute.return_value.scalar_one_or_none.return_value = student

        with patch("backend.app.services.student_service.check_student_academic_history") as mock_hist:
            mock_hist.return_value = {
                "has_history": False,
                "total_records": 0,
                "attendance_count": 0,
                "submissions_count": 0,
                "proctoring_events_count": 0,
                "feedback_count": 0,
                "certificates_count": 0,
                "enrollments_count": 0,
                "summary": "No academic or enrollment records",
            }

            result = delete_or_archive_student(
                db=db,
                student_id=student_id,
                mode="permanent",
                actor_id=uuid4(),
                actor_role="super_admin",
                actor_email="admin@platform.com",
            )

            assert result["success"] is True
            assert result["mode"] == "deleted"
            assert db.delete.called
            assert db.commit.called
