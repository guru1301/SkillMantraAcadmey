"""
Stage C Security Hardening Unit Tests:
- Login Rate Limiting
- Inactive Account Session Revocation (Super Admin, College Admin, Trainer, Student)
- Certificate Attendance Denominator Reconciliation (Unmarked completed sessions)
- Object-Level Authorization Helpers (Batches, Students, Sessions, Assessments)
- CSRF Double-Submit Protection Logic
"""
import concurrent.futures
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import MagicMock, patch
import uuid
import pytest
from fastapi import HTTPException

from backend.app.api.deps import (
    AuthenticatedUser,
    get_current_user,
    verify_batch_access,
    verify_csrf_protection,
    verify_student_access,
    verify_session_access,
    verify_assessment_access,
)
from backend.app.core.rate_limiter import SlidingWindowRateLimiter
from backend.app.core.security import (
    generate_session_token,
    generate_session_csrf_token,
    verify_session_csrf_token,
    verify_csrf_token,
)
from backend.app.db.models import (
    AdminUser,
    CollegeUser,
    Trainer,
    Student,
    College,
    Batch,
    TrainingSession,
    Assessment,
    UserSession,
)
from backend.app.services.certificate_service import calculate_student_certificate_eligibility
from backend.app.services.session_attendance_service import (
    record_bulk_attendance,
    get_student_attendance_summary,
)
from backend.app.schemas.attendance import AttendanceMarkItem


class TestRateLimiterUnit:
    def test_sliding_window_rate_limiter_allows_under_limit(self):
        limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=60)
        key = "192.168.1.100"

        allowed, rem = limiter.is_allowed(key)
        assert allowed is True
        assert rem == 3
        limiter.record_attempt(key)

        allowed, rem = limiter.is_allowed(key)
        assert allowed is True
        assert rem == 2
        limiter.record_attempt(key)

        allowed, rem = limiter.is_allowed(key)
        assert allowed is True
        assert rem == 1
        limiter.record_attempt(key)

        # 4th request exceeds max_requests=3
        allowed, rem = limiter.is_allowed(key)
        assert allowed is False
        assert rem == 0

    def test_sliding_window_rate_limiter_resets_on_success(self):
        limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=60)
        key = "test@example.com"
        limiter.record_attempt(key)
        limiter.record_attempt(key)

        allowed, _ = limiter.is_allowed(key)
        assert allowed is False

        limiter.reset(key)
        allowed, rem = limiter.is_allowed(key)
        assert allowed is True
        assert rem == 2

    def test_sliding_window_rate_limiter_concurrency(self):
        """
        Tests thread-safety under concurrent load using ThreadPoolExecutor.
        Verifies that multiple concurrent threads recording attempts do not cause race conditions.
        """
        limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)
        key = "concurrent_client_ip"

        def attempt_worker():
            limiter.record_attempt(key)

        # Fire 20 concurrent threads
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(attempt_worker) for _ in range(20)]
            concurrent.futures.wait(futures)

        allowed, rem = limiter.is_allowed(key)
        assert allowed is False
        assert rem == 0
        assert len(limiter._history[key]) == 20

    def test_sliding_window_rate_limiter_restart_simulation(self):
        """
        Tests application restart behavior: in-memory state is wiped upon process re-initialization.
        """
        limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
        key = "test_user_ip"
        for _ in range(5):
            limiter.record_attempt(key)
        assert limiter.is_allowed(key)[0] is False

        # Simulate process restart
        limiter.clear_all()
        assert limiter.is_allowed(key)[0] is True
        assert limiter.is_allowed(key)[1] == 5


class TestSessionBoundCSRFUnit:
    def test_generate_and_verify_session_bound_csrf_token(self):
        session_token = generate_session_token()
        csrf_token = generate_session_csrf_token(session_token)

        assert "." in csrf_token
        parts = csrf_token.split(".")
        assert len(parts) == 2
        nonce, sig = parts
        assert len(nonce) == 32  # 16 bytes hex
        assert len(sig) == 64  # SHA256 hex

        # Valid verification
        assert verify_session_csrf_token(csrf_token, csrf_token, session_token) is True
        assert verify_csrf_token(csrf_token, csrf_token, session_token) is True

    def test_session_bound_csrf_rejects_mismatched_session(self):
        session_a = generate_session_token()
        session_b = generate_session_token()

        csrf_token_a = generate_session_csrf_token(session_a)

        # Attempt to use session A's CSRF token with session B (subdomain attack / cookie injection)
        assert verify_session_csrf_token(csrf_token_a, csrf_token_a, session_b) is False
        assert verify_csrf_token(csrf_token_a, csrf_token_a, session_b) is False

    def test_session_bound_csrf_rejects_tampered_signature(self):
        session = generate_session_token()
        csrf_token = generate_session_csrf_token(session)
        nonce, sig = csrf_token.split(".")

        tampered_token = f"{nonce}.{'a' * 64}"
        assert verify_session_csrf_token(tampered_token, tampered_token, session) is False

    def test_session_bound_csrf_rejects_malformed_tokens(self):
        session = generate_session_token()
        assert verify_session_csrf_token("invalid_token_no_dot", "invalid_token_no_dot", session) is False
        assert verify_session_csrf_token(".missing_nonce", ".missing_nonce", session) is False
        assert verify_session_csrf_token("missing_sig.", "missing_sig.", session) is False
        assert verify_session_csrf_token("", "", session) is False
        assert verify_session_csrf_token(None, None, session) is False
        assert verify_session_csrf_token("a.b", "a.b", None) is False

    def test_session_bound_csrf_rejects_mismatched_header_and_cookie(self):
        session = generate_session_token()
        csrf_token_1 = generate_session_csrf_token(session)
        csrf_token_2 = generate_session_csrf_token(session)

        # Header != Cookie
        assert verify_session_csrf_token(csrf_token_1, csrf_token_2, session) is False



class TestInactiveAccountSessionUnit:
    def test_inactive_super_admin_session_is_rejected_with_403(self):
        db = MagicMock()
        admin_id = uuid.uuid4()
        session_id = uuid.uuid4()

        # Mock UserSession
        mock_session = UserSession(
            id=session_id,
            user_id=admin_id,
            user_role="super_admin",
            session_token_hash="dummy_hash",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            revoked_at=None,
        )

        # Mock Inactive AdminUser
        mock_admin = AdminUser(
            id=admin_id,
            email="admin@platform.com",
            full_name="Deactivated Admin",
            password_hash="hash",
            status="inactive",  # DEACTIVATED
        )

        db.execute.return_value.scalar_one_or_none.side_effect = [mock_session, mock_admin]

        with patch("backend.app.api.deps.hash_session_token", return_value="dummy_hash"):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(token="valid_token_string", db=db)
            assert exc_info.value.status_code == 403
            assert "Super administrator account is inactive" in exc_info.value.detail

    def test_inactive_college_admin_session_is_rejected_with_403(self):
        db = MagicMock()
        cu_id = uuid.uuid4()
        college_id = uuid.uuid4()

        mock_session = UserSession(
            id=uuid.uuid4(),
            user_id=cu_id,
            user_role="college_admin",
            session_token_hash="dummy_hash",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            revoked_at=None,
        )

        mock_cu = CollegeUser(
            id=cu_id,
            college_id=college_id,
            email="cu@college.edu",
            full_name="Deactivated Coordinator",
            password_hash="hash",
            status="inactive",
        )

        db.execute.return_value.scalar_one_or_none.side_effect = [mock_session, mock_cu]

        with patch("backend.app.api.deps.hash_session_token", return_value="dummy_hash"):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(token="valid_token_string", db=db)
            assert exc_info.value.status_code == 403
            assert "College administrator account is inactive" in exc_info.value.detail

    def test_inactive_trainer_session_is_rejected_with_403(self):
        db = MagicMock()
        tr_id = uuid.uuid4()

        mock_session = UserSession(
            id=uuid.uuid4(),
            user_id=tr_id,
            user_role="trainer",
            session_token_hash="dummy_hash",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            revoked_at=None,
        )

        mock_tr = Trainer(
            id=tr_id,
            email="tr@academy.edu",
            full_name="Deactivated Trainer",
            password_hash="hash",
            status="inactive",
        )

        db.execute.return_value.scalar_one_or_none.side_effect = [mock_session, mock_tr]

        with patch("backend.app.api.deps.hash_session_token", return_value="dummy_hash"):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(token="valid_token_string", db=db)
            assert exc_info.value.status_code == 403
            assert "Trainer account is inactive" in exc_info.value.detail

    def test_inactive_student_session_is_rejected_with_403(self):
        db = MagicMock()
        st_id = uuid.uuid4()

        mock_session = UserSession(
            id=uuid.uuid4(),
            user_id=st_id,
            user_role="student",
            session_token_hash="dummy_hash",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            revoked_at=None,
        )

        mock_st = Student(
            id=st_id,
            roll_number="ST-001",
            full_name="Deactivated Student",
            password_hash="hash",
            status="inactive",
        )

        db.execute.return_value.scalar_one_or_none.side_effect = [mock_session, mock_st]

        with patch("backend.app.api.deps.hash_session_token", return_value="dummy_hash"):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(token="valid_token_string", db=db)
            assert exc_info.value.status_code == 403
            assert "Student account is inactive" in exc_info.value.detail


class TestCertificateDenominatorReconciliationUnit:
    def test_unmarked_completed_sessions_included_in_denominator_prevent_inflation(self):
        """
        Verify that 1 attended session out of 10 completed sessions (where 9 were unmarked)
        yields an attendance rate of 10%, NOT 100%, and marks the student as ineligible.
        """
        db = MagicMock()
        student_id = uuid.uuid4()
        batch_id = uuid.uuid4()

        # Database returns 10 total sessions, 10 completed sessions, 1 recorded session, 1 attended session
        db.execute.return_value.mappings.return_value.all.return_value = [
            {
                "batch_id": batch_id,
                "batch_code": "CSE-2026-01",
                "program_name": "Full Stack Engineering",
                "college_name": "Tech Institute",
                "total_sessions": 10,
                "completed_sessions": 10,
                "recorded_sessions": 1,   # Only 1 session had an attendance entry
                "attended_sessions": 1,   # Student was present in that 1 session
            }
        ]

        result = calculate_student_certificate_eligibility(db, student_id)
        assert len(result) == 1
        record = result[0]

        # Rate must be 1/10 = 10.0%, NOT 1/1 = 100.0%
        assert record["attendanceRate"] == 10.0
        assert record["attendanceMet"] is False
        assert record["isEligible"] is False


class TestAttendanceIntegrityUnit:
    def test_record_bulk_attendance_rejects_student_not_enrolled_in_batch(self):
        db = MagicMock()
        session_id = uuid.uuid4()
        batch_id = uuid.uuid4()
        valid_student_id = uuid.uuid4()
        un_enrolled_student_id = uuid.uuid4()

        mock_session = TrainingSession(id=session_id, batch_id=batch_id, status="scheduled")
        db.execute.return_value.scalar_one_or_none.return_value = mock_session

        # Only valid_student_id is enrolled in batch_students
        db.execute.return_value.scalars.return_value.all.return_value = [valid_student_id]

        records = [
            AttendanceMarkItem(student_id=valid_student_id, status="present"),
            AttendanceMarkItem(student_id=un_enrolled_student_id, status="present"),
        ]

        with pytest.raises(HTTPException) as exc_info:
            record_bulk_attendance(db, session_id, records, marker_id=uuid.uuid4())

        assert exc_info.value.status_code == 400
        assert "is not enrolled in cohort batch" in exc_info.value.detail


class TestObjectLevelAuthorizationHelpersUnit:
    def test_verify_batch_access_cross_college_admin_raises_403(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        college_a = uuid.uuid4()
        college_b = uuid.uuid4()

        mock_batch = Batch(id=batch_id, college_id=college_b)
        db.execute.return_value.scalar_one_or_none.return_value = mock_batch

        college_admin_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="admin@collegea.edu",
            full_name="College A Admin",
            college_id=college_a,  # College A
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_batch_access(db, batch_id, college_admin_user)

        assert exc_info.value.status_code == 403
        assert "Tenant isolation violation" in exc_info.value.detail

    def test_verify_batch_access_unassigned_trainer_raises_403(self):
        db = MagicMock()
        batch_id = uuid.uuid4()

        mock_batch = Batch(id=batch_id, college_id=uuid.uuid4())
        db.execute.return_value.scalar_one_or_none.return_value = mock_batch
        # Trainer not assigned
        db.execute.return_value.scalar.return_value = None

        trainer_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="trainer",
            email="trainer@corp.edu",
            full_name="Bob Trainer",
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_batch_access(db, batch_id, trainer_user)

        assert exc_info.value.status_code == 403
        assert "Trainer is not assigned to this batch" in exc_info.value.detail

    def test_verify_batch_access_unenrolled_student_raises_403(self):
        db = MagicMock()
        batch_id = uuid.uuid4()

        mock_batch = Batch(id=batch_id, college_id=uuid.uuid4())
        db.execute.return_value.scalar_one_or_none.return_value = mock_batch
        # Student not enrolled
        db.execute.return_value.scalar.return_value = None

        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@univ.edu",
            full_name="Charlie Student",
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_batch_access(db, batch_id, student_user)

        assert exc_info.value.status_code == 403
        assert "Student is not enrolled in this batch" in exc_info.value.detail

    def test_verify_student_access_student_accessing_other_student_raises_403(self):
        db = MagicMock()
        student_a_id = uuid.uuid4()
        student_b_id = uuid.uuid4()

        mock_student_b = Student(id=student_b_id, roll_number="ST-002", full_name="Student B")
        db.execute.return_value.scalar_one_or_none.return_value = mock_student_b

        student_a_user = AuthenticatedUser(
            id=student_a_id,
            role="student",
            email="studenta@univ.edu",
            full_name="Student A",
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_student_access(db, student_b_id, student_a_user)

        assert exc_info.value.status_code == 403
        assert "Students may only access their own student records" in exc_info.value.detail
