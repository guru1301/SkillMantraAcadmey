"""
Unit tests for Stage F safeguards:
- Optimistic locking / concurrency control on autosaves
- Proctoring event idempotency with deduplication
- Server-authoritative deadline calculations and enforcement on write operations
- Idempotent final exam submission
- Multi-tenant role-based access control verification
"""

import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException

from backend.app.api.deps import verify_assessment_access, AuthenticatedUser
from backend.app.db.models.assessment import Assessment
from backend.app.db.models.assessment_submission import AssessmentSubmission
from backend.app.db.models.batch import Batch
from backend.app.db.models.exam_proctoring_event import ExamProctoringEvent
from backend.app.schemas.proctoring import (
    ExamSaveProgressRequest,
    ExamSecurityEventCreate,
)
from backend.app.services.proctoring_service import (
    get_attempt_timing,
    start_exam_session,
    save_exam_progress,
    record_security_event,
)
from backend.app.services.assessment_service import submit_assessment_attempt


class TestStageFConcurrencyAndSafeguardsUnit:
    """Verifies autosave optimistic concurrency, deadline enforcement, and proctoring idempotency."""

    def test_autosave_concurrency_conflict_detected_when_stale_version_sent(self):
        """When a background autosave arrives with expected_version < current_version,

        it must return a conflict and the latest server answers without overwriting.
        """
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        assessment_id = uuid.uuid4()

        # Mock assessment
        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.status = "published"
        mock_assessment.start_time = None
        mock_assessment.deadline = None
        mock_assessment.due_date = None
        mock_assessment.duration_minutes = 60

        # Existing submission has version 3 with newer answers
        existing_sub = MagicMock(spec=AssessmentSubmission)
        existing_sub.id = uuid.uuid4()
        existing_sub.student_id = student_id
        existing_sub.assessment_id = assessment_id
        existing_sub.status = "in_progress"
        existing_sub.version = 3
        existing_sub.answers = {"q1": 2, "q2": 1}
        existing_sub.started_at = datetime.now(timezone.utc) - timedelta(minutes=5)
        existing_sub.violations_count = 0

        # Query returns:
        # 1. Assessment lookup in _verify_student_enrolled_in_assessment
        # 2. BatchStudent enrollment lookup
        # 3. AssessmentSubmission lookup
        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            MagicMock(),  # enrollment
            existing_sub,
        ]

        # Stale client request with expected_version = 2
        stale_request = ExamSaveProgressRequest(
            assessment_id=assessment_id,
            answers={"q1": 1},
            violations_count=0,
            expected_version=2,
        )
        result = save_exam_progress(
            db=mock_db,
            student_id=student_id,
            data=stale_request,
        )

        assert result["success"] is False
        assert result["conflict"] is True
        assert result["version"] == 3
        assert result["answers"] == {"q1": 2, "q2": 1}
        # Answers must not be overwritten
        assert existing_sub.answers == {"q1": 2, "q2": 1}

    def test_autosave_success_increments_version_atomically(self):
        """Valid autosave updates answers and increments version monotonically."""
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        assessment_id = uuid.uuid4()

        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.status = "published"
        mock_assessment.start_time = None
        mock_assessment.deadline = None
        mock_assessment.due_date = None
        mock_assessment.duration_minutes = 60

        existing_sub = MagicMock(spec=AssessmentSubmission)
        existing_sub.id = uuid.uuid4()
        existing_sub.student_id = student_id
        existing_sub.assessment_id = assessment_id
        existing_sub.status = "in_progress"
        existing_sub.version = 2
        existing_sub.answers = {"q1": 0}
        existing_sub.started_at = datetime.now(timezone.utc) - timedelta(minutes=10)
        existing_sub.violations_count = 0

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            MagicMock(),  # enrollment
            existing_sub,
        ]
        mock_db.execute.return_value.rowcount = 1

        new_answers = {"q1": 0, "q2": 3}
        req = ExamSaveProgressRequest(
            assessment_id=assessment_id,
            answers=new_answers,
            violations_count=1,
            expected_version=2,
        )
        result = save_exam_progress(
            db=mock_db,
            student_id=student_id,
            data=req,
        )

        assert result["success"] is True
        assert result["conflict"] is False
        assert result["version"] == 3
        assert existing_sub.version == 3
        assert existing_sub.answers == new_answers
        mock_db.commit.assert_called_once()

    def test_autosave_rejected_if_attempt_already_evaluated(self):
        """Autosave on an already completed/evaluated submission must return conflict and final status."""
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        assessment_id = uuid.uuid4()

        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.status = "published"
        mock_assessment.start_time = None
        mock_assessment.deadline = None
        mock_assessment.due_date = None
        mock_assessment.duration_minutes = 30

        existing_sub = MagicMock(spec=AssessmentSubmission)
        existing_sub.status = "evaluated"
        existing_sub.version = 5
        existing_sub.answers = {"q1": 1, "q2": 2}

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            MagicMock(),  # enrollment
            existing_sub,
        ]

        req = ExamSaveProgressRequest(
            assessment_id=assessment_id,
            answers={"q1": 0},
            expected_version=1,
        )
        result = save_exam_progress(
            db=mock_db,
            student_id=student_id,
            data=req,
        )
        assert result["success"] is False
        assert result["conflict"] is True
        assert result["status"] == "evaluated"
        assert result["version"] == 5
        assert result["answers"] == {"q1": 1, "q2": 2}

    def test_autosave_rejected_when_deadline_exceeded(self):
        """Autosave after effective server deadline has passed must raise 400."""
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        assessment_id = uuid.uuid4()

        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.status = "published"
        mock_assessment.start_time = None
        mock_assessment.deadline = None
        mock_assessment.due_date = None
        mock_assessment.duration_minutes = 30

        # Started 45 minutes ago for a 30-minute exam
        existing_sub = MagicMock(spec=AssessmentSubmission)
        existing_sub.status = "in_progress"
        existing_sub.version = 1
        existing_sub.started_at = datetime.now(timezone.utc) - timedelta(minutes=45)

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            MagicMock(),  # enrollment
            existing_sub,
        ]

        req = ExamSaveProgressRequest(
            assessment_id=assessment_id,
            answers={"q1": 1},
            expected_version=1,
        )
        with pytest.raises(HTTPException) as exc_info:
            save_exam_progress(
                db=mock_db,
                student_id=student_id,
                data=req,
            )
        assert exc_info.value.status_code == 400
        assert "deadline has expired" in exc_info.value.detail.lower()

    def test_proctoring_event_idempotency_prevents_duplicate_violations(self):
        """Repeated transmission with identical idempotency_key returns existing event
        and does not increment violations_count twice.
        """
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        assessment_id = uuid.uuid4()
        idempotency_key = f"{assessment_id}-1-TAB_HIDDEN-12345678"

        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.start_time = None
        mock_assessment.deadline = None
        mock_assessment.due_date = None
        mock_assessment.duration_minutes = 60

        # Existing event already logged with this idempotency key
        existing_event = MagicMock(spec=ExamProctoringEvent)
        existing_event.id = uuid.uuid4()
        existing_event.assessment_id = assessment_id
        existing_event.student_id = student_id
        existing_event.event_type = "TAB_HIDDEN"
        existing_event.idempotency_key = idempotency_key
        existing_event.created_at = datetime.now(timezone.utc)
        existing_event.sequence_number = 1
        existing_event.duration_seconds = Decimal("2.5")

        existing_sub = MagicMock(spec=AssessmentSubmission)
        existing_sub.violations_count = 1

        # Query returns:
        # 1. Assessment lookup
        # 2. BatchStudent enrollment lookup
        # 3. Existing ExamProctoringEvent lookup (by idempotency_key)
        # 4. AssessmentSubmission lookup
        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            MagicMock(),  # enrollment
            existing_event,
            existing_sub,
        ]

        req = ExamSecurityEventCreate(
            assessment_id=assessment_id,
            event_type="TAB_HIDDEN",
            sequence_number=1,
            duration_seconds=2.5,
            event_metadata={"source": "test"},
            idempotency_key=idempotency_key,
        )
        result = record_security_event(
            db=mock_db,
            student_id=student_id,
            data=req,
        )

        assert result["is_duplicate"] is True
        assert result["idempotency_key"] == idempotency_key
        # Violations count must remain 1, not incremented to 2
        assert existing_sub.violations_count == 1
        assert result["violations_count"] == 1

    def test_first_time_proctoring_event_records_and_increments_violations(self):
        """A new proctoring event with new idempotency_key persists and increments violation count."""
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        assessment_id = uuid.uuid4()
        idempotency_key = f"{assessment_id}-1-TAB_HIDDEN-newkey"

        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.anti_cheat_enabled = True
        mock_assessment.start_time = None
        mock_assessment.deadline = None
        mock_assessment.due_date = None
        mock_assessment.duration_minutes = 60

        existing_sub = MagicMock(spec=AssessmentSubmission)
        existing_sub.violations_count = 0

        # Query returns:
        # 1. Assessment lookup
        # 2. BatchStudent enrollment lookup
        # 3. Existing ExamProctoringEvent lookup (returns None for new event)
        # 4. AssessmentSubmission lookup
        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            MagicMock(),  # enrollment
            None,
            existing_sub,
        ]

        req = ExamSecurityEventCreate(
            assessment_id=assessment_id,
            event_type="TAB_HIDDEN",
            sequence_number=1,
            duration_seconds=3.0,
            event_metadata={},
            idempotency_key=idempotency_key,
        )
        result = record_security_event(
            db=mock_db,
            student_id=student_id,
            data=req,
        )

        assert result["is_duplicate"] is False
        assert result["idempotency_key"] == idempotency_key
        assert existing_sub.violations_count == 1
        assert result["violations_count"] == 1
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_submit_assessment_rejected_when_deadline_exceeded(self):
        """Final submission after effective server deadline has passed raises 400."""
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        assessment_id = uuid.uuid4()

        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.status = "published"
        mock_assessment.total_marks = Decimal("100.00")
        mock_assessment.passing_marks = Decimal("50.00")
        mock_assessment.questions = [{"id": "q1", "question": "Q1", "options": ["A", "B"], "correctOptionIndex": 0, "points": 1}]
        mock_assessment.start_time = None
        mock_assessment.deadline = None
        mock_assessment.due_date = None
        mock_assessment.duration_minutes = 30

        existing_sub = MagicMock(spec=AssessmentSubmission)
        existing_sub.status = "in_progress"
        existing_sub.started_at = datetime.now(timezone.utc) - timedelta(minutes=50)

        # enrollment check returns enrolled student
        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            MagicMock(),  # enrollment
            existing_sub,
        ]

        with pytest.raises(HTTPException) as exc_info:
            submit_assessment_attempt(
                db=mock_db,
                assessment_id=assessment_id,
                student_id=student_id,
                answers={"q1": 0},
            )
        assert exc_info.value.status_code == 400
        assert "deadline has expired" in exc_info.value.detail.lower()

    def test_submit_assessment_rejects_already_evaluated_attempt_with_409(self):
        """Repeated final submission for an already evaluated attempt must reject with 409 Conflict."""
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        assessment_id = uuid.uuid4()

        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.status = "published"
        mock_assessment.start_time = None
        mock_assessment.deadline = None
        mock_assessment.due_date = None
        mock_assessment.total_marks = Decimal("100.00")
        mock_assessment.passing_marks = Decimal("50.00")
        mock_assessment.questions = [{"id": "q1", "question": "Q1", "options": ["A", "B"], "correctOptionIndex": 0, "points": 1}]

        existing_sub = MagicMock(spec=AssessmentSubmission)
        existing_sub.status = "evaluated"
        existing_sub.score = Decimal("85.00")
        existing_sub.answers = {"q1": 0}

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            MagicMock(),  # enrollment
            existing_sub,
        ]

        with pytest.raises(HTTPException) as exc_info:
            submit_assessment_attempt(
                db=mock_db,
                assessment_id=assessment_id,
                student_id=student_id,
                answers={"q1": 0},
            )

        assert exc_info.value.status_code == 409
        mock_db.commit.assert_not_called()

    def test_get_attempt_timing_picks_earliest_candidate(self):
        """Effective deadline must be the earlier of window deadline and attempt duration."""
        now = datetime.now(timezone.utc)

        # Case 1: Window deadline is sooner than timed attempt limit
        mock_assessment1 = MagicMock(spec=Assessment)
        mock_assessment1.deadline = now + timedelta(minutes=15)
        mock_assessment1.due_date = None
        mock_assessment1.duration_minutes = 60

        sub1 = MagicMock(spec=AssessmentSubmission)
        sub1.started_at = now - timedelta(minutes=10)  # attempt expires in 50 min, window expires in 15 min

        is_exp1, eff_dl1, secs1 = get_attempt_timing(mock_assessment1, sub1)
        assert is_exp1 is False
        assert eff_dl1 == mock_assessment1.deadline
        assert 800 <= secs1 <= 900  # ~15 minutes

        # Case 2: Attempt duration limit is sooner than window deadline
        mock_assessment2 = MagicMock(spec=Assessment)
        mock_assessment2.deadline = now + timedelta(hours=5)
        mock_assessment2.due_date = None
        mock_assessment2.duration_minutes = 30

        sub2 = MagicMock(spec=AssessmentSubmission)
        sub2.started_at = now - timedelta(minutes=25)  # attempt expires in 5 min, window expires in 5 hours

        is_exp2, eff_dl2, secs2 = get_attempt_timing(mock_assessment2, sub2)
        assert is_exp2 is False
        expected_dl = sub2.started_at + timedelta(minutes=30)
        assert eff_dl2 == expected_dl
        assert 250 <= secs2 <= 300  # ~5 minutes

    def test_get_attempt_timing_grace_period(self):
        """Allows a 20-second grace window to absorb realistic network latency."""
        now = datetime.now(timezone.utc)

        mock_assessment = MagicMock(spec=Assessment)
        # Window ended 10 seconds ago -> within 20s grace period -> is_expired should be False
        mock_assessment.deadline = now - timedelta(seconds=10)
        mock_assessment.due_date = None
        mock_assessment.duration_minutes = None

        is_exp_grace, _, secs_grace = get_attempt_timing(mock_assessment, None)
        assert is_exp_grace is False
        assert secs_grace == 0

        # Window ended 25 seconds ago -> beyond 20s grace period -> is_expired should be True
        mock_assessment.deadline = now - timedelta(seconds=25)
        is_exp_past, _, secs_past = get_attempt_timing(mock_assessment, None)
        assert is_exp_past is True
        assert secs_past == 0

    def test_verify_assessment_access_cross_college_admin_raises_403(self):
        """College admin cannot access assessment belonging to another college."""
        mock_db = MagicMock()
        assessment_id = uuid.uuid4()
        batch_id = uuid.uuid4()
        user_college_id = uuid.uuid4()
        other_college_id = uuid.uuid4()

        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.batch_id = batch_id

        mock_batch = MagicMock(spec=Batch)
        mock_batch.id = batch_id
        mock_batch.college_id = other_college_id

        # Query returns assessment, then batch
        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            mock_batch,
        ]

        current_user = AuthenticatedUser(
            id=uuid.uuid4(),
            email="admin@college.edu",
            full_name="College Admin",
            role="college_admin",
            college_id=user_college_id,
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_assessment_access(mock_db, assessment_id, current_user)
        assert exc_info.value.status_code == 403
        assert "Tenant isolation violation" in exc_info.value.detail

    def test_verify_assessment_access_unassigned_trainer_raises_403(self):
        """Trainer not assigned to batch cannot access assessment."""
        mock_db = MagicMock()
        assessment_id = uuid.uuid4()
        batch_id = uuid.uuid4()
        trainer_id = uuid.uuid4()

        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.batch_id = batch_id

        mock_batch = MagicMock(spec=Batch)
        mock_batch.id = batch_id

        # Query returns:
        # 1. Assessment lookup (scalar_one_or_none)
        # 2. Batch lookup (scalar_one_or_none)
        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            mock_batch,
        ]
        # 3. Batch assignment check (scalar -> None)
        mock_db.execute.return_value.scalar.return_value = None

        current_user = AuthenticatedUser(
            id=trainer_id,
            email="trainer@test.com",
            full_name="Trainer Test",
            role="trainer",
            college_id=None,
        )

        with pytest.raises(HTTPException) as exc_info:
            verify_assessment_access(mock_db, assessment_id, current_user)
        assert exc_info.value.status_code == 403
        assert "not assigned to this batch" in exc_info.value.detail

    def test_verify_assessment_access_super_admin_allowed_platform_wide(self):
        """Super Admin has platform-wide access to any assessment."""
        mock_db = MagicMock()
        assessment_id = uuid.uuid4()
        batch_id = uuid.uuid4()

        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.id = assessment_id
        mock_assessment.batch_id = batch_id

        mock_batch = MagicMock(spec=Batch)
        mock_batch.id = batch_id

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_assessment,
            mock_batch,
        ]

        current_user = AuthenticatedUser(
            id=uuid.uuid4(),
            email="superadmin@platform.com",
            full_name="Super Admin",
            role="super_admin",
            college_id=None,
        )

        ret_assessment, ret_batch = verify_assessment_access(mock_db, assessment_id, current_user)
        assert ret_assessment == mock_assessment
        assert ret_batch == mock_batch
