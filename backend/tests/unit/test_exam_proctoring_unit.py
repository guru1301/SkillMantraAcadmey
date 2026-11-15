"""
Unit tests for Secure Examination Proctoring & Recovery Service.
"""
from datetime import datetime, timezone
from unittest.mock import MagicMock
import uuid
import pytest
from fastapi import HTTPException

from backend.app.db.models.assessment import Assessment
from backend.app.db.models.assessment_submission import AssessmentSubmission
from backend.app.db.models.batch import BatchStudent
from backend.app.schemas.proctoring import (
    ExamSaveProgressRequest,
    ExamSecurityEventCreate,
)
from backend.app.services.proctoring_service import (
    get_exam_proctoring_logs,
    record_security_event,
    save_exam_progress,
    start_exam_session,
)


class TestExamProctoringUnit:
    def _create_mock_assessment(self, batch_id: uuid.UUID) -> Assessment:
        return Assessment(
            id=uuid.uuid4(),
            batch_id=batch_id,
            title="Full Stack Midterm Examination",
            duration_minutes=30,
            total_marks=100,
            passing_marks=50,
            status="published",
            anti_cheat_enabled=True,
            questions=[
                {"id": "q1", "question": "What is React?", "options": ["A", "B"], "points": 1, "correctOptionIndex": 0}
            ],
        )

    def test_record_security_event_first_incident_yields_warning_1(self):
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        batch_id = uuid.uuid4()
        assessment = self._create_mock_assessment(batch_id)

        # Mock enrollment and existing submission
        mock_enrollment = BatchStudent(batch_id=batch_id, student_id=student_id)
        mock_submission = AssessmentSubmission(
            assessment_id=assessment.id,
            student_id=student_id,
            status="in_progress",
            violations_count=0,
        )

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            assessment,        # _verify_student_enrolled_in_assessment: assessment query
            mock_enrollment,   # _verify_student_enrolled_in_assessment: enrollment query
            mock_submission,   # record_security_event: submission query
        ]

        payload = ExamSecurityEventCreate(
            assessment_id=assessment.id,
            event_type="TAB_HIDDEN",
            sequence_number=1,
            duration_seconds=2.45,
            event_metadata={"question_index": 0},
            acknowledged=True,
        )

        res = record_security_event(mock_db, student_id, payload)
        assert res["violations_count"] == 1
        assert res["security_level"] == "warning_1"
        assert "Leaving the examination screen" in res["policy_warning"]
        assert mock_submission.violations_count == 1
        assert mock_db.commit.called

    def test_record_security_event_second_incident_yields_warning_2(self):
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        batch_id = uuid.uuid4()
        assessment = self._create_mock_assessment(batch_id)

        mock_enrollment = BatchStudent(batch_id=batch_id, student_id=student_id)
        mock_submission = AssessmentSubmission(
            assessment_id=assessment.id,
            student_id=student_id,
            status="in_progress",
            violations_count=1,  # Already 1 violation
        )

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            assessment,
            mock_enrollment,
            mock_submission,
        ]

        payload = ExamSecurityEventCreate(
            assessment_id=assessment.id,
            event_type="FULLSCREEN_EXIT",
            sequence_number=2,
            duration_seconds=5.0,
            event_metadata={"reason": "escape_pressed"},
        )

        res = record_security_event(mock_db, student_id, payload)
        assert res["violations_count"] == 2
        assert res["security_level"] == "warning_2"
        assert "Second incident recorded" in res["policy_warning"]
        assert mock_submission.violations_count == 2

    def test_record_security_event_repeated_incidents_flagged_for_review(self):
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        batch_id = uuid.uuid4()
        assessment = self._create_mock_assessment(batch_id)

        mock_enrollment = BatchStudent(batch_id=batch_id, student_id=student_id)
        mock_submission = AssessmentSubmission(
            assessment_id=assessment.id,
            student_id=student_id,
            status="in_progress",
            violations_count=2,  # Already 2 violations -> this becomes 3rd
        )

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            assessment,
            mock_enrollment,
            mock_submission,
        ]

        payload = ExamSecurityEventCreate(
            assessment_id=assessment.id,
            event_type="WINDOW_BLUR",
            sequence_number=3,
            duration_seconds=12.2,
        )

        res = record_security_event(mock_db, student_id, payload)
        assert res["violations_count"] == 3
        assert res["security_level"] == "flagged"
        assert "Maximum warnings reached" in res["policy_warning"]

    def test_non_violation_event_does_not_increment_violations_counter(self):
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        batch_id = uuid.uuid4()
        assessment = self._create_mock_assessment(batch_id)

        mock_enrollment = BatchStudent(batch_id=batch_id, student_id=student_id)
        mock_submission = AssessmentSubmission(
            assessment_id=assessment.id,
            student_id=student_id,
            status="in_progress",
            violations_count=1,
        )

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            assessment,
            mock_enrollment,
            mock_submission,
        ]

        payload = ExamSecurityEventCreate(
            assessment_id=assessment.id,
            event_type="CONNECTION_RESTORED",
            sequence_number=4,
            duration_seconds=0.0,
        )

        res = record_security_event(mock_db, student_id, payload)
        assert res["violations_count"] == 1
        assert res["security_level"] == "warning_1"
        assert mock_submission.violations_count == 1  # Unchanged

    def test_start_exam_session_resumes_existing_answers(self):
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        batch_id = uuid.uuid4()
        assessment = self._create_mock_assessment(batch_id)

        mock_enrollment = BatchStudent(batch_id=batch_id, student_id=student_id)
        mock_submission = AssessmentSubmission(
            assessment_id=assessment.id,
            student_id=student_id,
            status="in_progress",
            answers={"q1": 0},
            violations_count=1,
        )

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            assessment,
            mock_enrollment,
            mock_submission,
        ]

        res = start_exam_session(mock_db, student_id, assessment.id)
        assert res["success"] is True
        assert res["status"] == "in_progress"
        assert res["restored_answers"] == {"q1": 0}
        assert res["violations_count"] == 1

    def test_save_exam_progress_persists_in_progress_state(self):
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        batch_id = uuid.uuid4()
        assessment = self._create_mock_assessment(batch_id)

        mock_enrollment = BatchStudent(batch_id=batch_id, student_id=student_id)
        mock_submission = AssessmentSubmission(
            assessment_id=assessment.id,
            student_id=student_id,
            status="in_progress",
            answers={},
            violations_count=0,
        )

        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            assessment,
            mock_enrollment,
            mock_submission,
        ]

        req = ExamSaveProgressRequest(
            assessment_id=assessment.id,
            answers={"q1": 1, "q2": 3},
            violations_count=0,
            expected_version=1,
        )

        res = save_exam_progress(mock_db, student_id, req)
        assert res["success"] is True
        assert res["saved_answers_count"] == 2
        assert mock_submission.answers == {"q1": 1, "q2": 3}
        assert mock_db.commit.called

    def test_unenrolled_student_access_rejected_with_403(self):
        mock_db = MagicMock()
        student_id = uuid.uuid4()
        batch_id = uuid.uuid4()
        assessment = self._create_mock_assessment(batch_id)

        # Assessment exists, but enrollment query returns None
        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            assessment,
            None,
        ]

        payload = ExamSecurityEventCreate(
            assessment_id=assessment.id,
            event_type="TAB_HIDDEN",
        )

        with pytest.raises(HTTPException) as exc_info:
            record_security_event(mock_db, student_id, payload)
        assert exc_info.value.status_code == 403

