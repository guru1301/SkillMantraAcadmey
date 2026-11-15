"""
Step 0 Regression Suite (branch fix/pass1-access-control):
Proves already-fixed Pass 1 items (P1-01, P1-02, P1-04, P1-10) remain intact
against endpoints and services using mocked DB sessions.
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
import uuid

from fastapi import HTTPException
import pytest

from backend.app.api.deps import AuthenticatedUser
from backend.app.api.v1.endpoints.assessments import (
    get_assessment,
    list_assessments,
    save_progress,
    start_exam,
    submit_assessment,
)
from backend.app.api.v1.endpoints.certificates import download_certificate_pdf
from backend.app.api.v1.endpoints.colleges import update_college_profile
from backend.app.db.models.assessment import Assessment
from backend.app.db.models.assessment_submission import AssessmentSubmission
from backend.app.db.models.batch import Batch, BatchStudent
from backend.app.db.models.certificate import Certificate
from backend.app.db.models.college import College
from backend.app.schemas.assessment import AssessmentSubmissionRequest
from backend.app.schemas.college import CollegeUpdate
from backend.app.schemas.proctoring import ExamSaveProgressRequest
from backend.app.schemas.student import BulkStudentItem
from backend.app.services.college_service import update_college
from backend.app.services.student_service import (
    execute_roster_import_and_provision,
    preview_roster_import,
)


class TestPass1RegressionStep0Unit:
    # ------------------------------------------------------------------
    # P1-01: Trainer outside batch/college gets 403 on GET /certificates/{id}/pdf
    # ------------------------------------------------------------------
    def test_p1_01_trainer_outside_batch_or_college_gets_403_on_certificate_pdf(self):
        college_a = uuid.uuid4()
        college_b = uuid.uuid4()
        batch_b = Batch(
            id=uuid.uuid4(),
            college_id=college_b,
            program_id=uuid.uuid4(),
            code="BATCH-B-01",
            start_date=datetime.now(timezone.utc).date(),
            end_date=datetime.now(timezone.utc).date() + timedelta(days=30),
            target_strength=30,
            status="active",
        )
        cert = Certificate(
            id=uuid.uuid4(),
            certificate_number="CERT-001",
            student_id=uuid.uuid4(),
            batch_id=batch_b.id,
            program_id=batch_b.program_id,
            college_id=college_b,
            student_name="Alice",
            student_roll="21CS001",
            college_name="College B",
            program_name="Cloud",
            attendance_rate=95.0,
            verification_code="VER-001",
            status="active",
            issued_at=datetime.now(timezone.utc),
        )
        outsider_trainer = AuthenticatedUser(
            id=uuid.uuid4(),
            role="trainer",
            email="trainer@collegea.edu",
            full_name="Trainer A",
            college_id=college_a,
        )

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.side_effect = [cert, batch_b]
        db.execute.return_value.scalar.return_value = None  # not in batch_trainers

        with pytest.raises(HTTPException) as exc:
            download_certificate_pdf(
                certificate_id=cert.id,
                current_user=outsider_trainer,
                db=db,
            )
        assert exc.value.status_code == 403

    # ------------------------------------------------------------------
    # P1-02: Draft / pre-start assessments blocked & list published-only
    # ------------------------------------------------------------------
    def test_p1_02_student_blocked_on_draft_and_prestart_and_list_published_only(self):
        now = datetime.now(timezone.utc)
        batch_id = uuid.uuid4()
        college_id = uuid.uuid4()
        student = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="s@college.edu",
            full_name="Student",
            college_id=college_id,
        )
        batch = Batch(id=batch_id, college_id=college_id, program_id=uuid.uuid4(), code="B1")
        enrollment = BatchStudent(batch_id=batch_id, student_id=student.id)

        # 1. GET /assessments list as student filters a.status = 'published'
        db_list = MagicMock()
        db_list.execute.return_value.scalar_one_or_none.return_value = batch
        db_list.execute.return_value.scalar.return_value = 1
        db_list.execute.return_value.mappings.return_value.all.return_value = []
        list_assessments(batch_id=batch_id, current_user=student, db=db_list)
        list_sql = str(db_list.execute.call_args_list[-1].args[0])
        assert "a.status = 'published'" in list_sql

        # 2. Draft assessment -> 403 on GET /assessments/{id}, /start, /save-progress, /submit
        draft_assessment = Assessment(
            id=uuid.uuid4(),
            batch_id=batch_id,
            title="Draft Exam",
            type="quiz",
            duration_minutes=30,
            total_marks=100,
            passing_marks=40,
            status="draft",
            questions=[{"id": "q1", "question": "Q?", "options": ["A", "B"], "correctOptionIndex": 0}],
        )
        sub = AssessmentSubmission(
            id=uuid.uuid4(),
            assessment_id=draft_assessment.id,
            student_id=student.id,
            status="in_progress",
            version=1,
            started_at=now,
        )

        db_get_draft = MagicMock()
        db_get_draft.execute.return_value.scalar_one_or_none.side_effect = [draft_assessment, batch, draft_assessment]
        db_get_draft.execute.return_value.scalar.return_value = 1
        with pytest.raises(HTTPException) as exc_draft_get:
            get_assessment(assessment_id=draft_assessment.id, current_user=student, db=db_get_draft)
        assert exc_draft_get.value.status_code == 403

        for endpoint_fn, args in [
            (start_exam, {"assessment_id": draft_assessment.id, "current_user": student}),
            (
                save_progress,
                {
                    "assessment_id": draft_assessment.id,
                    "payload": ExamSaveProgressRequest(
                        assessment_id=draft_assessment.id, answers={"q1": 0}, expected_version=1
                    ),
                    "current_user": student,
                },
            ),
            (
                submit_assessment,
                {
                    "payload": AssessmentSubmissionRequest(assessment_id=draft_assessment.id, answers={"q1": 0}),
                    "current_user": student,
                },
            ),
        ]:
            db_ep = MagicMock()
            if endpoint_fn is start_exam:
                db_ep.execute.return_value.scalar_one_or_none.side_effect = [draft_assessment, enrollment]
            else:
                db_ep.execute.return_value.scalar_one_or_none.side_effect = [draft_assessment, enrollment, sub]
            with pytest.raises(HTTPException) as exc_ep:
                endpoint_fn(**args, db=db_ep)
            assert exc_ep.value.status_code == 403

        # 3. Pre-start published assessment -> 403 on /start, /save-progress, /submit; [] questions on GET
        prestart = Assessment(
            id=uuid.uuid4(),
            batch_id=batch_id,
            title="Future Exam",
            type="quiz",
            duration_minutes=30,
            total_marks=100,
            passing_marks=40,
            status="published",
            start_time=now + timedelta(hours=1),
            deadline=now + timedelta(hours=2),
            questions=[{"id": "q1", "question": "Secret Q?", "options": ["A", "B"], "correctOptionIndex": 0}],
        )
        sub_pre = AssessmentSubmission(
            id=uuid.uuid4(),
            assessment_id=prestart.id,
            student_id=student.id,
            status="in_progress",
            version=1,
            started_at=now,
        )
        db_get_pre = MagicMock()
        db_get_pre.execute.return_value.scalar_one_or_none.side_effect = [prestart, batch, prestart, sub_pre]
        db_get_pre.execute.return_value.scalar.return_value = 1
        pre_res = get_assessment(assessment_id=prestart.id, current_user=student, db=db_get_pre)
        assert pre_res["questions"] == []

        for endpoint_fn, args in [
            (start_exam, {"assessment_id": prestart.id, "current_user": student}),
            (
                save_progress,
                {
                    "assessment_id": prestart.id,
                    "payload": ExamSaveProgressRequest(
                        assessment_id=prestart.id, answers={"q1": 0}, expected_version=1
                    ),
                    "current_user": student,
                },
            ),
            (
                submit_assessment,
                {
                    "payload": AssessmentSubmissionRequest(assessment_id=prestart.id, answers={"q1": 0}),
                    "current_user": student,
                },
            ),
        ]:
            db_pre = MagicMock()
            if endpoint_fn is start_exam:
                db_pre.execute.return_value.scalar_one_or_none.side_effect = [prestart, enrollment]
            else:
                db_pre.execute.return_value.scalar_one_or_none.side_effect = [prestart, enrollment, sub_pre]
            with pytest.raises(HTTPException) as exc_pre:
                endpoint_fn(**args, db=db_pre)
            assert exc_pre.value.status_code == 403

    # ------------------------------------------------------------------
    # P1-04: Roster preview & import give zero cross-college signal
    # ------------------------------------------------------------------
    def test_p1_04_roster_preview_and_import_no_cross_college_signal(self):
        college_b = uuid.uuid4()
        batch_b = Batch(id=uuid.uuid4(), college_id=college_b, code="B-COL-B")
        item = BulkStudentItem(
            rollNumber="21CS001",
            fullName="Student In College B",
            dob="2002-05-10",
            email="stu@collegeb.edu",
        )

        # Preview in College B sees only College B students (not College A's 21CS001)
        db_prev = MagicMock()
        db_prev.execute.return_value.scalar_one_or_none.return_value = batch_b
        db_prev.execute.return_value.all.return_value = []
        preview_res = preview_roster_import(db_prev, batch_b.id, [item], enforced_college_id=college_b)
        assert preview_res.conflictCount == 0
        assert preview_res.validNewCount == 1
        assert preview_res.previewRows[0].status == "new"
        assert "another institution" not in (preview_res.previewRows[0].message or "").lower()
        student_query_sql = str(db_prev.execute.call_args_list[1].args[0])
        assert "students.college_id =" in student_query_sql
        assert "!=" not in student_query_sql

        # Import in College B provisions cleanly with zero cross-college conflict signal
        db_imp = MagicMock()
        db_imp.execute.return_value.scalar_one_or_none.return_value = batch_b
        db_imp.execute.return_value.scalars.return_value.all.return_value = []
        imp_res = execute_roster_import_and_provision(
            db=db_imp,
            batch_id=batch_b.id,
            students=[item],
            actor_id=uuid.uuid4(),
            actor_role="college_admin",
            actor_email="admin@collegeb.edu",
            enforced_college_id=college_b,
        )
        assert imp_res.accountsProvisioned == 1
        assert imp_res.failedCount == 0
        assert not any("another institution" in err.lower() for err in imp_res.errors)
        imp_query_sql = str(db_imp.execute.call_args_list[1].args[0])
        assert "students.college_id =" in imp_query_sql
        assert "!=" not in imp_query_sql

    # ------------------------------------------------------------------
    # P1-10: college_admin sending status gets 403; NULL never written
    # ------------------------------------------------------------------
    def test_p1_10_college_admin_status_rejected_403_and_null_never_written(self):
        now = datetime.now(timezone.utc)
        college_id = uuid.uuid4()
        college = College(id=college_id, name="Test College", status="active", created_at=now, updated_at=now)
        cadmin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="admin@college.edu",
            full_name="College Admin",
            college_id=college_id,
        )

        for payload in [
            CollegeUpdate(name="New Name", status="inactive"),
            CollegeUpdate.model_validate({"name": "New Name", "status": None}),
        ]:
            db = MagicMock()
            with pytest.raises(HTTPException) as exc:
                update_college_profile(college_id=college_id, payload=payload, current_user=cadmin, db=db)
            assert exc.value.status_code == 403
            db.commit.assert_not_called()

        # Even direct service call with status=None in model_fields_set never writes NULL
        db_svc = MagicMock()
        db_svc.execute.return_value.scalar_one_or_none.return_value = college
        updated = update_college(db_svc, college_id, CollegeUpdate.model_validate({"name": "Renamed", "status": None}))
        assert updated is not None
        assert updated.status == "active"
