"""
TDD Unit Tests for Server-Authoritative Exam State Machine (Rules 1-9).
Tests cover:
1. Shared eligibility rule: published status, start_time <= now <= effective_deadline, active in_progress /start row
2. GET /assessments list filters status='published' for students
3. POST /submit rejects missing /start row, expired attempt (started_at + duration + grace), and double submit
4. Row locking (SELECT ... FOR UPDATE), guarded upsert in /submit, non-null expected_version + WHERE version=:expected in /save-progress
5. Server-only violations_count from VIOLATION_EVENT_TYPES (ignores client value; Wi-Fi drops & resume not violations)
6. Hiding correctOptionIndex / explanation in /submit until after assessment deadline
7. violations >= 3 -> status='pending_review' and isPassed=False (+ schema/DDL support)
8. Guarding int(selected_val) so bad answers return 422, not 500
9. FullScreenExamRoom.tsx aborts opening exam when POST /start fails
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock
import uuid

from fastapi import HTTPException
from pydantic import ValidationError
import pytest
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

from backend.app.api.deps import AuthenticatedUser
from backend.app.api.v1.endpoints.assessments import list_assessments
from backend.app.db.base import Base
from backend.app.db.models.assessment import Assessment
from backend.app.db.models.assessment_submission import AssessmentSubmission
from backend.app.db.models.batch import BatchStudent
from backend.app.schemas.assessment import AssessmentSubmissionRequest, AssessmentSubmissionResponse
from backend.app.schemas.proctoring import ExamSaveProgressRequest, ExamSecurityEventCreate
from backend.app.services.assessment_service import (
    get_assessment_by_id,
    get_assessments_for_batch,
    submit_assessment_attempt,
)
from backend.app.services.proctoring_service import (
    record_security_event,
    save_exam_progress,
    start_exam_session,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


def _make_assessment(
    *,
    status_val: str = "published",
    start_time: datetime | None = None,
    deadline: datetime | None = None,
    duration_minutes: int = 30,
) -> Assessment:
    now = datetime.now(timezone.utc)
    return Assessment(
        id=uuid.uuid4(),
        batch_id=uuid.uuid4(),
        title="Midterm Systems Exam",
        type="quiz",
        duration_minutes=duration_minutes,
        total_marks=100,
        passing_marks=40,
        start_time=start_time if start_time is not None else now - timedelta(minutes=10),
        deadline=deadline if deadline is not None else now + timedelta(minutes=50),
        due_date=deadline if deadline is not None else now + timedelta(minutes=50),
        status=status_val,
        anti_cheat_enabled=True,
        shuffle_questions=False,
        questions=[
            {
                "id": "q1",
                "question": "What does ACID stand for?",
                "options": ["A", "B", "C", "D"],
                "correctOptionIndex": 1,
                "points": 1,
                "explanation": "Atomicity, Consistency, Isolation, Durability.",
            }
        ],
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(days=1),
    )


def _make_submission(
    *,
    assessment_id: uuid.UUID,
    student_id: uuid.UUID,
    status_val: str = "in_progress",
    started_at: datetime | None = None,
    version: int = 1,
    score: int | None = None,
    answers: dict | None = None,
    violations_count: int = 0,
) -> AssessmentSubmission:
    now = datetime.now(timezone.utc)
    return AssessmentSubmission(
        id=uuid.uuid4(),
        assessment_id=assessment_id,
        student_id=student_id,
        status=status_val,
        score=score,
        started_at=started_at if started_at is not None else now - timedelta(minutes=2),
        submitted_at=now if status_val in ("submitted", "evaluated", "pending_review") else None,
        answers=answers if answers is not None else {},
        violations_count=violations_count,
        version=version,
    )


def _compile_pg(stmt) -> str:
    return str(stmt.compile(dialect=postgresql.dialect()))


class TestExamStateMachineRulesUnit:
    # ------------------------------------------------------------------
    # Rule 1: Published + Window + in_progress /start row required
    # ------------------------------------------------------------------
    def test_rule1_draft_exam_blocks_student_read_start_save_and_submit(self):
        student_id = uuid.uuid4()
        assessment = _make_assessment(status_val="draft")
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(assessment_id=assessment.id, student_id=student_id)

        # GET /assessments/{id} for student on draft exam -> 403
        db_get = MagicMock()
        db_get.execute.return_value.scalar_one_or_none.side_effect = [assessment, sub]
        with pytest.raises(HTTPException) as exc:
            get_assessment_by_id(db_get, assessment.id, mask_correct_answers=True, student_id=student_id)
        assert exc.value.status_code == 403

        # POST /start on draft exam -> 403
        db_start = MagicMock()
        db_start.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment]
        with pytest.raises(HTTPException) as exc:
            start_exam_session(db_start, student_id, assessment.id)
        assert exc.value.status_code == 403

        # POST /save-progress on draft exam -> 403
        db_save = MagicMock()
        db_save.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        req = ExamSaveProgressRequest(
            assessment_id=assessment.id,
            answers={"q1": 1},
            expected_version=1,
        )
        with pytest.raises(HTTPException) as exc:
            save_exam_progress(db_save, student_id, req)
        assert exc.value.status_code == 403

        # POST /submit on draft exam -> 403
        db_submit = MagicMock()
        db_submit.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        with pytest.raises(HTTPException) as exc:
            submit_assessment_attempt(db_submit, assessment.id, student_id, answers={"q1": 1})
        assert exc.value.status_code == 403

    def test_rule1_pre_start_hides_questions_and_blocks_start_save_submit(self):
        now = datetime.now(timezone.utc)
        student_id = uuid.uuid4()
        assessment = _make_assessment(
            status_val="published",
            start_time=now + timedelta(minutes=30),
            deadline=now + timedelta(hours=2),
        )
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(assessment_id=assessment.id, student_id=student_id)

        # GET returns no questions before start_time
        db_get = MagicMock()
        db_get.execute.return_value.scalar_one_or_none.side_effect = [assessment, sub]
        res = get_assessment_by_id(db_get, assessment.id, mask_correct_answers=True, student_id=student_id)
        assert res is not None
        assert res["questions"] == []
        assert res["questions_count"] == 1

        # POST /start before start_time -> rejected (>=400)
        db_start = MagicMock()
        db_start.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment]
        with pytest.raises(HTTPException) as exc:
            start_exam_session(db_start, student_id, assessment.id)
        assert exc.value.status_code in (400, 403)

        # POST /save-progress before start_time -> 403
        db_save = MagicMock()
        db_save.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        req = ExamSaveProgressRequest(assessment_id=assessment.id, answers={"q1": 1}, expected_version=1)
        with pytest.raises(HTTPException) as exc:
            save_exam_progress(db_save, student_id, req)
        assert exc.value.status_code == 403

        # POST /submit before start_time -> 403
        db_submit = MagicMock()
        db_submit.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        with pytest.raises(HTTPException) as exc:
            submit_assessment_attempt(db_submit, assessment.id, student_id, answers={"q1": 1})
        assert exc.value.status_code == 403

    def test_rule1_skip_start_hides_questions_and_rejects_save_progress(self):
        student_id = uuid.uuid4()
        assessment = _make_assessment(status_val="published")
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)

        # GET /assessments/{id} with no /start row returns empty questions (but counts metadata)
        db_get = MagicMock()
        db_get.execute.return_value.scalar_one_or_none.side_effect = [assessment, None]
        res = get_assessment_by_id(db_get, assessment.id, mask_correct_answers=True, student_id=student_id)
        assert res is not None
        assert res["questions"] == []
        assert res["questions_count"] == 1

        # POST /save-progress without /start row -> 403, must not create submission row
        db_save = MagicMock()
        db_save.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, None]
        req = ExamSaveProgressRequest(assessment_id=assessment.id, answers={"q1": 1}, expected_version=1)
        with pytest.raises(HTTPException) as exc:
            save_exam_progress(db_save, student_id, req)
        assert exc.value.status_code == 403
        db_save.add.assert_not_called()
        db_save.commit.assert_not_called()

    def test_rule1_active_in_progress_session_returns_sanitized_questions_on_start_and_get(self):
        student_id = uuid.uuid4()
        assessment = _make_assessment(status_val="published")
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(assessment_id=assessment.id, student_id=student_id, status_val="in_progress")

        # POST /start returns sanitized questions (no key leak)
        db_start = MagicMock()
        db_start.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        start_res = start_exam_session(db_start, student_id, assessment.id)
        assert start_res["status"] == "in_progress"
        assert len(start_res["questions"]) == 1
        assert "correctOptionIndex" not in start_res["questions"][0]
        assert "explanation" not in start_res["questions"][0]

        # GET /assessments/{id} with active in_progress row unlocks sanitized questions
        db_get = MagicMock()
        db_get.execute.return_value.scalar_one_or_none.side_effect = [assessment, sub]
        get_res = get_assessment_by_id(db_get, assessment.id, mask_correct_answers=True, student_id=student_id)
        assert len(get_res["questions"]) == 1
        assert "correctOptionIndex" not in get_res["questions"][0]
        assert "explanation" not in get_res["questions"][0]

    def test_rule1_expired_exam_hides_questions_and_blocks_start_save_submit(self):
        now = datetime.now(timezone.utc)
        student_id = uuid.uuid4()
        assessment = _make_assessment(
            status_val="published",
            start_time=now - timedelta(hours=2),
            deadline=now - timedelta(minutes=5),
        )
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(
            assessment_id=assessment.id,
            student_id=student_id,
            status_val="in_progress",
            started_at=now - timedelta(minutes=20),
        )

        # GET /assessments/{id} after effective deadline returns questions=[]
        db_get = MagicMock()
        db_get.execute.return_value.scalar_one_or_none.side_effect = [assessment, sub]
        get_res = get_assessment_by_id(db_get, assessment.id, mask_correct_answers=True, student_id=student_id)
        assert get_res is not None
        assert get_res["questions"] == []
        assert get_res["questions_count"] == 1

        # /start, /save-progress, /submit reject after deadline + grace
        db_start = MagicMock()
        db_start.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        with pytest.raises(HTTPException) as exc:
            start_exam_session(db_start, student_id, assessment.id)
        assert exc.value.status_code == 400

        db_save = MagicMock()
        db_save.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        with pytest.raises(HTTPException) as exc:
            save_exam_progress(
                db_save,
                student_id,
                ExamSaveProgressRequest(assessment_id=assessment.id, answers={"q1": 1}, expected_version=1),
            )
        assert exc.value.status_code == 400

        db_submit = MagicMock()
        db_submit.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        with pytest.raises(HTTPException) as exc:
            submit_assessment_attempt(db_submit, assessment.id, student_id, answers={"q1": 1})
        assert exc.value.status_code == 400

    # ------------------------------------------------------------------
    # Rule 2: GET /assessments list filters status='published' for students
    # ------------------------------------------------------------------
    def test_rule2_get_assessments_list_filters_published_for_students(self):
        batch_id = uuid.uuid4()
        student_id = uuid.uuid4()

        db_student = MagicMock()
        db_student.execute.return_value.mappings.return_value.all.return_value = []
        get_assessments_for_batch(db_student, batch_id, student_id=student_id)
        student_sql = str(db_student.execute.call_args.args[0])
        assert "a.status = 'published'" in student_sql
        assert "sub.id IS NOT NULL" not in student_sql  # in_progress row must not count as submitted

        # Trainer list must NOT filter out drafts
        db_trainer = MagicMock()
        db_trainer.execute.return_value.mappings.return_value.all.return_value = []
        get_assessments_for_batch(db_trainer, batch_id, student_id=None)
        trainer_sql = str(db_trainer.execute.call_args.args[0])
        assert "a.status = 'published'" not in trainer_sql.split("WHERE")[1]

        # Endpoint verification: student role passes student_id
        db_ep = MagicMock()
        db_ep.execute.return_value.scalar_one_or_none.return_value = MagicMock()
        db_ep.execute.return_value.scalar.return_value = 1
        db_ep.execute.return_value.mappings.return_value.all.return_value = []
        student_user = AuthenticatedUser(
            id=student_id,
            role="student",
            email="stu@test.edu",
            full_name="Student",
            college_id=uuid.uuid4(),
        )
        list_assessments(batch_id=batch_id, current_user=student_user, db=db_ep)
        executed_queries = [str(call.args[0]) for call in db_ep.execute.call_args_list]
        assert any("a.status = 'published'" in q for q in executed_queries)

    # ------------------------------------------------------------------
    # Rule 3: /submit rejects missing /start, expired duration, or double submit
    # ------------------------------------------------------------------
    def test_rule3_submit_without_start_row_rejected_403(self):
        student_id = uuid.uuid4()
        assessment = _make_assessment(status_val="published")
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, None]

        with pytest.raises(HTTPException) as exc:
            submit_assessment_attempt(db, assessment.id, student_id, answers={"q1": 1})
        assert exc.value.status_code == 403
        db.commit.assert_not_called()

    def test_rule3_late_submit_past_started_at_plus_duration_plus_grace_rejected_400(self):
        now = datetime.now(timezone.utc)
        student_id = uuid.uuid4()
        # Window deadline still open (+3 hours), but attempt duration (30m) expired 2m ago
        assessment = _make_assessment(
            status_val="published",
            start_time=now - timedelta(hours=1),
            deadline=now + timedelta(hours=3),
            duration_minutes=30,
        )
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(
            assessment_id=assessment.id,
            student_id=student_id,
            status_val="in_progress",
            started_at=now - timedelta(minutes=32),
        )

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]

        with pytest.raises(HTTPException) as exc:
            submit_assessment_attempt(db, assessment.id, student_id, answers={"q1": 1})
        assert exc.value.status_code == 400
        db.commit.assert_not_called()

    @pytest.mark.parametrize("terminal_status", ["submitted", "evaluated", "pending_review"])
    def test_rule3_double_submit_rejected_409(self, terminal_status):
        student_id = uuid.uuid4()
        assessment = _make_assessment(status_val="published")
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(
            assessment_id=assessment.id,
            student_id=student_id,
            status_val=terminal_status,
            score=100,
            answers={"q1": 1},
        )

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]

        with pytest.raises(HTTPException) as exc:
            submit_assessment_attempt(db, assessment.id, student_id, answers={"q1": 0})
        assert exc.value.status_code == 409
        db.commit.assert_not_called()

    # ------------------------------------------------------------------
    # Rule 4: FOR UPDATE + non-overwriting upsert + save-progress OCC
    # ------------------------------------------------------------------
    def test_rule4_submit_uses_for_update_and_guarded_upsert_cannot_overwrite_evaluated(self):
        student_id = uuid.uuid4()
        assessment = _make_assessment(status_val="published")
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(assessment_id=assessment.id, student_id=student_id, status_val="in_progress")

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        db.execute.return_value.scalar.return_value = 0
        # Simulate upsert returning 0 rows because concurrent tx evaluated the row first
        db.execute.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc:
            submit_assessment_attempt(db, assessment.id, student_id, answers={"q1": 1})
        assert exc.value.status_code == 409
        db.rollback.assert_called()
        db.commit.assert_not_called()

        # Verify submission SELECT used FOR UPDATE and upsert guarded status
        executed_stmts = [call.args[0] for call in db.execute.call_args_list]
        assert any("FOR UPDATE" in _compile_pg(s).upper() for s in executed_stmts)
        upsert_sql = str(executed_stmts[-1])
        assert "WHERE assessment_submissions.status = 'in_progress'" in upsert_sql

    def test_rule4_save_progress_requires_non_null_expected_version_and_checks_where_version(self):
        student_id = uuid.uuid4()
        assessment = _make_assessment(status_val="published")
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(
            assessment_id=assessment.id,
            student_id=student_id,
            status_val="in_progress",
            version=2,
            answers={"q1": 0},
        )

        # Schema rejects null/missing expected_version (FastAPI 422)
        with pytest.raises(ValidationError):
            ExamSaveProgressRequest(assessment_id=assessment.id, answers={"q1": 1})
        with pytest.raises(ValidationError):
            ExamSaveProgressRequest(assessment_id=assessment.id, answers={"q1": 1}, expected_version=None)

        # Service rejects model_construct expected_version=None -> 422
        bad_req = ExamSaveProgressRequest.model_construct(
            assessment_id=assessment.id,
            answers={"q1": 1},
            violations_count=0,
            expected_version=None,
        )
        with pytest.raises(HTTPException) as exc:
            save_exam_progress(MagicMock(), student_id, bad_req)
        assert exc.value.status_code == 422

        # Concurrent conflict: SQL UPDATE ... WHERE version = :expected matches 0 rows (rowcount=0)
        db = MagicMock()
        refreshed = _make_submission(
            assessment_id=assessment.id,
            student_id=student_id,
            status_val="in_progress",
            version=3,
            answers={"q1": 2},
        )
        db.execute.return_value.scalar_one_or_none.side_effect = [
            assessment,
            enrollment,
            sub,
            refreshed,
        ]
        db.execute.return_value.rowcount = 0

        req = ExamSaveProgressRequest(
            assessment_id=assessment.id,
            answers={"q1": 1},
            expected_version=2,
        )
        res = save_exam_progress(db, student_id, req)
        assert res["success"] is False
        assert res["conflict"] is True
        assert res["version"] == 3
        assert res["answers"] == {"q1": 2}
        db.commit.assert_not_called()

        # Verify UPDATE statement included version = :version_1 in WHERE clause
        update_stmt = db.execute.call_args_list[3].args[0]
        compiled_update = _compile_pg(update_stmt)
        assert "UPDATE assessment_submissions" in compiled_update
        assert "assessment_submissions.version =" in compiled_update.split("WHERE")[1]

    # ------------------------------------------------------------------
    # Rule 5: Server-only violations_count; Wi-Fi drop & RESUMED not violations
    # ------------------------------------------------------------------
    @pytest.mark.parametrize("non_violation", ["CONNECTION_LOST", "CONNECTION_RESTORED", "EXAM_RESUMED"])
    def test_rule5_wifi_drop_and_resumed_events_are_not_violations(self, non_violation):
        student_id = uuid.uuid4()
        assessment = _make_assessment(status_val="published")
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(assessment_id=assessment.id, student_id=student_id, violations_count=0)

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        event = ExamSecurityEventCreate(
            assessment_id=assessment.id,
            event_type=non_violation,
            sequence_number=1,
            duration_seconds=3.0,
        )
        res = record_security_event(db, student_id, event)
        assert res["violations_count"] == 0
        assert res["security_level"] == "normal"
        assert sub.violations_count == 0

    def test_rule5_submit_and_save_ignore_client_violations_count_and_count_only_violation_types(self):
        now = datetime.now(timezone.utc)
        student_id = uuid.uuid4()
        assessment = _make_assessment(
            status_val="published",
            deadline=now + timedelta(minutes=30),
        )
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(
            assessment_id=assessment.id,
            student_id=student_id,
            status_val="in_progress",
            version=1,
            violations_count=0,
        )

        # /save-progress ignores client violations_count=5
        db_save = MagicMock()
        db_save.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        db_save.execute.return_value.rowcount = 1
        save_exam_progress(
            db_save,
            student_id,
            ExamSaveProgressRequest(
                assessment_id=assessment.id,
                answers={"q1": 1},
                violations_count=5,
                expected_version=1,
            ),
        )
        assert sub.violations_count == 0

        # /submit ignores client violations_count=99 and uses server VIOLATION_EVENT_TYPES count (1)
        db_sub = MagicMock()
        db_sub.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        db_sub.execute.return_value.scalar.return_value = 1
        db_sub.execute.return_value.first.return_value = (sub.id,)

        res = submit_assessment_attempt(
            db_sub,
            assessment.id,
            student_id,
            answers={"q1": 1},
            violations_count=99,  # spoofed client count must be ignored
        )
        assert res["status"] == "evaluated"
        assert res["violations_count"] == 1
        assert res["isPassed"] is True

        # Count query must filter by event_type IN (...)
        count_stmt = db_sub.execute.call_args_list[3].args[0]
        compiled_count = _compile_pg(count_stmt)
        assert "exam_proctoring_events.event_type IN" in compiled_count
        # Upsert must persist 1, never 99
        upsert_params = db_sub.execute.call_args_list[4].args[1]
        assert upsert_params["violations_count"] == 1

    # ------------------------------------------------------------------
    # Rule 6: correctOptionIndex and explanation NOT returned before deadline
    # ------------------------------------------------------------------
    @pytest.mark.parametrize("has_future_deadline", [True, False])
    def test_rule6_submit_hides_correct_option_and_explanation_before_deadline(self, has_future_deadline):
        now = datetime.now(timezone.utc)
        student_id = uuid.uuid4()
        assessment = _make_assessment(
            status_val="published",
            start_time=now - timedelta(minutes=10),
            deadline=(now + timedelta(minutes=30)) if has_future_deadline else None,
        )
        if not has_future_deadline:
            assessment.deadline = None
            assessment.due_date = None

        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(assessment_id=assessment.id, student_id=student_id, status_val="in_progress")

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        db.execute.return_value.scalar.return_value = 0
        db.execute.return_value.first.return_value = (sub.id,)

        res = submit_assessment_attempt(db, assessment.id, student_id, answers={"q1": 0})
        assert res["answers_released"] is False
        item = res["review"][0]
        assert "correctOptionIndex" not in item
        assert "explanation" not in item
        assert "isCorrect" not in item

        # Pydantic response serialization must also work without leaking nulls/keys
        serialized = AssessmentSubmissionResponse(**res).model_dump(exclude_none=True)
        assert "correctOptionIndex" not in serialized["review"][0]
        assert "explanation" not in serialized["review"][0]

    def test_rule6_submit_returns_keys_after_assessment_deadline(self):
        now = datetime.now(timezone.utc)
        student_id = uuid.uuid4()
        # Deadline passed 5s ago -> within 20s latency grace, but past assessment.deadline
        assessment = _make_assessment(
            status_val="published",
            start_time=now - timedelta(minutes=25),
            deadline=now - timedelta(seconds=5),
            duration_minutes=30,
        )
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(
            assessment_id=assessment.id,
            student_id=student_id,
            status_val="in_progress",
            started_at=now - timedelta(minutes=20),
        )

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        db.execute.return_value.scalar.return_value = 0
        db.execute.return_value.first.return_value = (sub.id,)

        res = submit_assessment_attempt(db, assessment.id, student_id, answers={"q1": 1})
        assert res["answers_released"] is True
        item = res["review"][0]
        assert item["correctOptionIndex"] == 1
        assert item["explanation"] == "Atomicity, Consistency, Isolation, Durability."
        assert item["isCorrect"] is True

    # ------------------------------------------------------------------
    # Rule 7: violations >= 3 -> pending_review and NOT auto-passed
    # ------------------------------------------------------------------
    def test_rule7_violations_gte_3_sets_pending_review_and_not_passed(self):
        student_id = uuid.uuid4()
        assessment = _make_assessment(status_val="published")
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(assessment_id=assessment.id, student_id=student_id, status_val="in_progress")

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]
        db.execute.return_value.scalar.return_value = 3  # 3 server violations
        db.execute.return_value.first.return_value = (sub.id,)

        res = submit_assessment_attempt(
            db,
            assessment.id,
            student_id,
            answers={"q1": 1},  # 100% score, yet violations == 3
            violations_count=0,
        )
        assert res["score"] == 100
        assert res["status"] == "pending_review"
        assert res["isPassed"] is False
        upsert_params = db.execute.call_args_list[4].args[1]
        assert upsert_params["status"] == "pending_review"
        assert upsert_params["violations_count"] == 3

        # Schema DDL & migration must support 'pending_review'
        submissions_ddl = str(CreateTable(Base.metadata.tables["assessment_submissions"]).compile(dialect=postgresql.dialect()))
        assert "'pending_review'" in submissions_ddl
        assert (REPO_ROOT / "backend/alembic/versions/0008_add_pending_review_submission_status.py").exists()

    # ------------------------------------------------------------------
    # Rule 8: Guard int(selected_val) -> 422 instead of 500
    # ------------------------------------------------------------------
    @pytest.mark.parametrize("bad_val", ["abc", "", True, False, [1], {"a": 1}, 1.5, -1])
    def test_rule8_bad_answer_values_return_422_not_500(self, bad_val):
        student_id = uuid.uuid4()
        assessment = _make_assessment(status_val="published")

        # Schema validator rejects invalid answers with 422 ValidationError
        with pytest.raises(ValidationError):
            AssessmentSubmissionRequest(
                assessment_id=assessment.id,
                answers={"q1": bad_val},
            )

        # Direct service call also raises 422 HTTPException instead of 500 ValueError/TypeError
        enrollment = BatchStudent(batch_id=assessment.batch_id, student_id=student_id)
        sub = _make_submission(assessment_id=assessment.id, student_id=student_id, status_val="in_progress")
        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [assessment, enrollment, sub]

        with pytest.raises(HTTPException) as exc:
            submit_assessment_attempt(db, assessment.id, student_id, answers={"q1": bad_val})
        assert exc.value.status_code == 422
        db.commit.assert_not_called()

    # ------------------------------------------------------------------
    # Rule 9: FullScreenExamRoom.tsx aborts opening exam when POST /start fails
    # ------------------------------------------------------------------
    def test_rule9_fullscreen_exam_room_blocks_entry_when_post_start_fails(self):
        tsx_path = REPO_ROOT / "src/components/student/FullScreenExamRoom.tsx"
        content = tsx_path.read_text(encoding="utf-8")

        assert "Allow student to proceed locally" not in content
        start_idx = content.index("const handleBeginExam")
        end_idx = content.index("// 1. UNIFIED PROCTORING", start_idx)
        handler_body = content[start_idx:end_idx]

        # Must handle failure and return before setExamStarted(true)
        assert "!startRes.success" in handler_body
        assert "setStartError(" in handler_body
        assert "exitFullScreen()" in handler_body
        assert handler_body.index("if (!startRes.success)") < handler_body.index("setExamStarted(true)")
