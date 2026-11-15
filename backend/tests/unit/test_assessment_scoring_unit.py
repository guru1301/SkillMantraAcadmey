"""
Unit Tests for Assessment Scoring and Question Evaluation Logic.
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import MagicMock
import uuid
import pytest
from fastapi import HTTPException

from backend.app.db.models.assessment import Assessment
from backend.app.db.models.assessment_submission import AssessmentSubmission
from backend.app.services.assessment_service import submit_assessment_attempt


def _setup_scoring_mock_db(mock_assessment: MagicMock, student_id: uuid.UUID) -> MagicMock:
    now = datetime.now(timezone.utc)
    mock_assessment.status = "published"
    mock_assessment.start_time = now - timedelta(minutes=20)
    # 5s past assessment deadline: within 20s latency grace window so /submit runs and releases review keys
    mock_assessment.deadline = now - timedelta(seconds=5)
    mock_assessment.due_date = None
    mock_assessment.duration_minutes = 30

    active_sub = MagicMock(spec=AssessmentSubmission)
    active_sub.id = uuid.uuid4()
    active_sub.status = "in_progress"
    active_sub.started_at = now - timedelta(minutes=10)
    active_sub.student_id = student_id

    mock_db = MagicMock()
    mock_db.execute.return_value.scalar_one_or_none.side_effect = [
        mock_assessment,
        MagicMock(),  # enrollment
        active_sub,
    ]
    mock_db.execute.return_value.scalar.return_value = 0
    mock_db.execute.return_value.first.return_value = (active_sub.id,)
    return mock_db


class TestAssessmentScoringUnit:
    def test_assessment_scoring_all_correct_yields_100_percent_and_passed(self):
        student_id = uuid.uuid4()
        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.total_marks = Decimal("100.00")
        mock_assessment.passing_marks = Decimal("40.00")
        mock_assessment.questions = [
            {"id": "q1", "question": "What is Python?", "options": ["Snake", "Language"], "correctOptionIndex": 1, "points": 1},
            {"id": "q2", "question": "What is 2+2?", "options": ["3", "4"], "correctOptionIndex": 1, "points": 1},
        ]
        mock_db = _setup_scoring_mock_db(mock_assessment, student_id)

        student_answers = {"q1": 1, "q2": 1}
        result = submit_assessment_attempt(
            mock_db,
            assessment_id=uuid.uuid4(),
            student_id=student_id,
            answers=student_answers,
            violations_count=0,
        )

        assert result["success"] is True
        assert result["score"] == 100
        assert result["percentage"] == 100
        assert result["isPassed"] is True
        assert len(result["review"]) == 2
        assert all(r["isCorrect"] for r in result["review"])

    def test_assessment_scoring_partial_correct_calculates_scaled_score(self):
        student_id = uuid.uuid4()
        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.total_marks = Decimal("50.00")
        mock_assessment.passing_marks = Decimal("25.00")
        mock_assessment.questions = [
            {"id": "q1", "question": "Q1", "options": ["A", "B"], "correctOptionIndex": 0, "points": 2},
            {"id": "q2", "question": "Q2", "options": ["A", "B"], "correctOptionIndex": 1, "points": 2},
        ]
        mock_db = _setup_scoring_mock_db(mock_assessment, student_id)

        # 1 correct out of 2 (2 out of 4 points = 50%)
        student_answers = {"q1": 0, "q2": 0}  # q1 correct, q2 wrong
        result = submit_assessment_attempt(
            mock_db,
            assessment_id=uuid.uuid4(),
            student_id=student_id,
            answers=student_answers,
            violations_count=1,
        )

        assert result["percentage"] == 50
        assert result["score"] == 25  # 50% of 50 marks = 25
        assert result["isPassed"] is True  # 25 >= passing_marks 25

    def test_assessment_scoring_failing_score_marked_failed(self):
        student_id = uuid.uuid4()
        mock_assessment = MagicMock(spec=Assessment)
        mock_assessment.total_marks = Decimal("100.00")
        mock_assessment.passing_marks = Decimal("60.00")
        mock_assessment.questions = [
            {"id": "q1", "question": "Q1", "options": ["A", "B"], "correctOptionIndex": 1, "points": 1},
            {"id": "q2", "question": "Q2", "options": ["A", "B"], "correctOptionIndex": 1, "points": 1},
        ]
        mock_db = _setup_scoring_mock_db(mock_assessment, student_id)

        student_answers = {"q1": 0, "q2": 0}  # 0%
        result = submit_assessment_attempt(
            mock_db,
            assessment_id=uuid.uuid4(),
            student_id=student_id,
            answers=student_answers,
        )

        assert result["percentage"] == 0
        assert result["score"] == 0
        assert result["isPassed"] is False

    def test_submit_assessment_raises_404_if_student_not_enrolled(self):
        mock_db = MagicMock()
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            submit_assessment_attempt(
                mock_db,
                assessment_id=uuid.uuid4(),
                student_id=uuid.uuid4(),
                answers={"q1": 0},
            )
        assert exc_info.value.status_code == 404
        assert "not enrolled" in exc_info.value.detail or "not found" in exc_info.value.detail

