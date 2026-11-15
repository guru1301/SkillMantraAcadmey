"""
Comprehensive Unit Tests for Post-Training Feedback and Certificate Eligibility Integration.
Verifies RBAC authorization, training completion validation, submission constraints,
rating independence, duplicate prevention, and certificate gating.
"""
from datetime import datetime, timezone
from unittest.mock import MagicMock
import uuid
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from backend.app.api.deps import AuthenticatedUser
from backend.app.db.models import (
    Batch,
    BatchStudent,
    BatchTrainer,
    College,
    Program,
    Student,
    TrainingSession,
    BatchFeedbackUnlock,
    StudentFeedback,
)
from backend.app.schemas.feedback import StudentFeedbackCreate
from backend.app.services.certificate_service import calculate_student_certificate_eligibility
from backend.app.services.feedback_service import (
    verify_batch_feedback_access,
    check_batch_training_completed,
    get_batch_feedback_status,
    unlock_batch_feedback,
    get_batch_feedback_report,
    get_student_pending_feedbacks,
    submit_student_feedback,
)


class TestFeedbackValidationAndConstraints:
    def test_rating_must_be_between_1_and_10(self):
        # Valid ratings
        assert StudentFeedbackCreate(rating=1, comments="A" * 15).rating == 1
        assert StudentFeedbackCreate(rating=10, comments="A" * 15).rating == 10
        assert StudentFeedbackCreate(rating=5, comments="A" * 15).rating == 5

        # Invalid ratings
        with pytest.raises(ValidationError):
            StudentFeedbackCreate(rating=0, comments="A" * 15)

        with pytest.raises(ValidationError):
            StudentFeedbackCreate(rating=11, comments="A" * 15)

        with pytest.raises(ValidationError):
            StudentFeedbackCreate(rating=-5, comments="A" * 15)

    def test_comments_hygiene_min_max_and_whitespace(self):
        # Minimum length: 10 chars
        with pytest.raises(ValidationError):
            StudentFeedbackCreate(rating=5, comments="Too short")

        # Whitespace-only string
        with pytest.raises(ValidationError):
            StudentFeedbackCreate(rating=5, comments="                   ")

        # Whitespace padding trimmed
        valid = StudentFeedbackCreate(rating=5, comments="   This training program was very informative.   ")
        assert valid.comments == "This training program was very informative."
        assert len(valid.comments) >= 10

        # Maximum length: 2000 chars
        with pytest.raises(ValidationError):
            StudentFeedbackCreate(rating=5, comments="A" * 2001)


class TestFeedbackUnlockAuthorizationUnit:
    def test_super_admin_can_unlock_completed_batch(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="super@skillmantra.edu",
            full_name="Super Admin",
        )

        mock_batch = Batch(id=batch_id, college_id=uuid.uuid4(), program_id=uuid.uuid4(), status="completed")
        # 1. verify_batch_feedback_access -> returns batch
        # 2. check_batch_training_completed -> returns batch
        # 3. existing unlock check -> None
        db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_batch,  # verify_batch_feedback_access
            mock_batch,  # check_batch_training_completed
            None,        # existing_unlock check
            mock_batch,  # in get_batch_feedback_status: verify
            mock_batch,  # in get_batch_feedback_status: check_batch_training_completed
            None,        # in get_batch_feedback_status: college
            None,        # in get_batch_feedback_status: program
            None,        # in get_batch_feedback_status: unlock_record
        ]
        db.execute.return_value.scalar.side_effect = [30, 0]  # total_students, submissions_count

        res = unlock_batch_feedback(db, batch_id, super_admin)
        assert res["batch_id"] == batch_id
        assert db.add.called
        assert db.commit.called

    def test_assigned_trainer_can_unlock_completed_batch(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        trainer_id = uuid.uuid4()
        trainer_user = AuthenticatedUser(
            id=trainer_id,
            role="trainer",
            email="trainer@corp.edu",
            full_name="Lead Trainer",
        )

        mock_batch = Batch(id=batch_id, college_id=uuid.uuid4(), program_id=uuid.uuid4(), status="completed")
        # verify_batch_feedback_access: batch exists, trainer assigned
        db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_batch,      # batch query
            uuid.uuid4(),    # is_assigned check -> yes
            mock_batch,      # check_batch_training_completed
            None,            # existing unlock check
            mock_batch,      # get_batch_feedback_status: batch
            uuid.uuid4(),    # get_batch_feedback_status: is_assigned
            None,            # college
            None,            # program
            mock_batch,      # check_batch_training_completed
            None,            # unlock_record
        ]
        db.execute.return_value.scalar.side_effect = [25, 0]

        res = unlock_batch_feedback(db, batch_id, trainer_user)
        assert res["batch_id"] == batch_id
        assert db.add.called
        assert db.commit.called

    def test_unassigned_trainer_cannot_unlock_batch(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        trainer_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="trainer",
            email="unassigned@corp.edu",
            full_name="Unassigned Trainer",
        )
        mock_batch = Batch(id=batch_id, college_id=uuid.uuid4(), status="completed")
        db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_batch,  # batch exists
            None,        # trainer is NOT assigned
        ]

        with pytest.raises(HTTPException) as exc_info:
            unlock_batch_feedback(db, batch_id, trainer_user)

        assert exc_info.value.status_code == 403
        assert "Trainer is not assigned to this batch" in exc_info.value.detail

    def test_college_admin_cannot_unlock_feedback(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        college_id = uuid.uuid4()
        college_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="college_admin",
            email="admin@univ.edu",
            full_name="College Admin",
            college_id=college_id,
        )

        with pytest.raises(HTTPException) as exc_info:
            unlock_batch_feedback(db, batch_id, college_admin)

        assert exc_info.value.status_code == 403
        assert "not authorized to unlock student feedback" in exc_info.value.detail

    def test_student_cannot_unlock_feedback(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        student_user = AuthenticatedUser(
            id=uuid.uuid4(),
            role="student",
            email="student@univ.edu",
            full_name="Alice Student",
        )

        with pytest.raises(HTTPException) as exc_info:
            unlock_batch_feedback(db, batch_id, student_user)

        assert exc_info.value.status_code == 403
        assert "not authorized to unlock student feedback" in exc_info.value.detail

    def test_unlock_rejected_if_batch_not_completed(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="admin@corp.edu",
            full_name="Super Admin",
        )
        # Batch status is 'active', and sessions have incomplete items
        mock_batch = Batch(id=batch_id, college_id=uuid.uuid4(), status="active")
        db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_batch,  # verify_batch
            mock_batch,  # check_batch_training_completed
        ]
        # Sessions statuses have 'scheduled'
        db.execute.return_value.scalars.return_value.all.return_value = ["completed", "scheduled"]

        with pytest.raises(HTTPException) as exc_info:
            unlock_batch_feedback(db, batch_id, super_admin)

        assert exc_info.value.status_code == 400
        assert "Training is not yet completed" in exc_info.value.detail

    def test_repeated_unlock_is_idempotent_and_creates_no_duplicates(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        super_admin = AuthenticatedUser(
            id=uuid.uuid4(),
            role="super_admin",
            email="admin@corp.edu",
            full_name="Super Admin",
        )
        mock_batch = Batch(id=batch_id, college_id=uuid.uuid4(), status="completed")
        mock_unlock = BatchFeedbackUnlock(
            batch_id=batch_id,
            status="unlocked",
            unlocked_by_user_id=super_admin.id,
            unlocked_by_role="super_admin",
        )
        db.execute.return_value.scalar_one_or_none.side_effect = [
            mock_batch,    # verify_batch
            mock_batch,    # check_batch_training_completed
            mock_unlock,   # existing_unlock found with status 'unlocked'
            mock_batch,    # get_batch_feedback_status
            None,          # college
            None,          # program
            mock_batch,    # check_batch_training_completed
            mock_unlock,   # unlock_record
            None,          # unlocked_by user
        ]
        db.execute.return_value.scalar.side_effect = [20, 5]

        res = unlock_batch_feedback(db, batch_id, super_admin)
        assert res["status"] == "unlocked"
        # db.add must NOT be called again
        assert not db.add.called


class TestStudentFeedbackSubmissionUnit:
    def test_unenrolled_student_cannot_submit_feedback(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        student_id = uuid.uuid4()
        payload = StudentFeedbackCreate(rating=9, comments="Outstanding comprehensive training.")

        # Enrollment query returns None
        db.execute.return_value.scalar_one_or_none.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            submit_student_feedback(db, batch_id, student_id, payload)

        assert exc_info.value.status_code == 403
        assert "not enrolled in this batch" in exc_info.value.detail

    def test_student_cannot_submit_when_feedback_is_locked(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        student_id = uuid.uuid4()
        payload = StudentFeedbackCreate(rating=8, comments="Very thorough explanations.")

        # 1. Enrollment exists
        # 2. Unlock record is None (locked)
        db.execute.return_value.scalar_one_or_none.side_effect = [
            uuid.uuid4(),  # enrollment
            None,          # unlock record
        ]

        with pytest.raises(HTTPException) as exc_info:
            submit_student_feedback(db, batch_id, student_id, payload)

        assert exc_info.value.status_code == 400
        assert "locked or not available" in exc_info.value.detail

    def test_duplicate_submission_is_prevented(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        student_id = uuid.uuid4()
        payload = StudentFeedbackCreate(rating=10, comments="Top-tier curriculum and mentors.")

        mock_unlock = BatchFeedbackUnlock(batch_id=batch_id, status="unlocked")
        # 1. Enrollment exists
        # 2. Unlock record exists and is unlocked
        # 3. Existing feedback exists
        db.execute.return_value.scalar_one_or_none.side_effect = [
            uuid.uuid4(),  # enrollment
            mock_unlock,   # unlock record
            uuid.uuid4(),  # existing feedback submission!
        ]

        with pytest.raises(HTTPException) as exc_info:
            submit_student_feedback(db, batch_id, student_id, payload)

        assert exc_info.value.status_code == 409
        assert "already submitted post-training feedback" in exc_info.value.detail

    def test_successful_student_submission(self):
        db = MagicMock()
        batch_id = uuid.uuid4()
        student_id = uuid.uuid4()
        payload = StudentFeedbackCreate(rating=9, comments="Insightful lectures and hands-on labs.")

        mock_unlock = BatchFeedbackUnlock(batch_id=batch_id, status="unlocked")
        mock_student = Student(id=student_id, full_name="Bob Smith", roll_number="STU-001")
        # 1. Enrollment exists
        # 2. Unlock record exists and is unlocked
        # 3. Existing feedback is None
        # 4. Student profile lookup
        db.execute.return_value.scalar_one_or_none.side_effect = [
            uuid.uuid4(),  # enrollment
            mock_unlock,   # unlock
            None,          # no existing feedback
            mock_student,  # student
        ]

        res = submit_student_feedback(db, batch_id, student_id, payload)
        assert res["rating"] == 9
        assert res["comments"] == "Insightful lectures and hands-on labs."
        assert res["student_name"] == "Bob Smith"
        assert db.add.called
        assert db.commit.called


class TestCertificateEligibilityFeedbackGatingUnit:
    def test_certificate_locked_when_feedback_not_submitted(self):
        mock_db = MagicMock()
        batch_id = uuid.uuid4()
        student_id = uuid.uuid4()

        # Student attended 10/10 sessions, but feedback_submitted is False
        mock_db.execute.return_value.mappings.return_value.all.return_value = [
            {
                "batch_id": batch_id,
                "batch_code": "BATCH-PRO",
                "program_name": "Full Stack",
                "college_name": "Tech College",
                "total_sessions": 10,
                "completed_sessions": 10,
                "recorded_sessions": 10,
                "attended_sessions": 10,  # 100% attendance
                "feedback_submitted": False,  # Missing feedback!
            }
        ]

        certs = calculate_student_certificate_eligibility(mock_db, student_id)
        assert len(certs) == 1
        c = certs[0]
        assert c["attendanceMet"] is True
        assert c["allSessionsFinished"] is True
        assert c["feedbackSubmitted"] is False
        assert c["isEligible"] is False  # Blocked because feedback missing!
        assert c["pendingRequirement"] == "Please submit your post-training feedback to unlock your certificate."

    def test_certificate_unlocked_when_feedback_submitted(self):
        mock_db = MagicMock()
        batch_id = uuid.uuid4()
        student_id = uuid.uuid4()

        mock_db.execute.return_value.mappings.return_value.all.return_value = [
            {
                "batch_id": batch_id,
                "batch_code": "BATCH-PRO",
                "program_name": "Full Stack",
                "college_name": "Tech College",
                "total_sessions": 10,
                "completed_sessions": 10,
                "recorded_sessions": 10,
                "attended_sessions": 9,  # 90% attendance >= 80%
                "feedback_submitted": True,  # Feedback submitted!
            }
        ]

        certs = calculate_student_certificate_eligibility(mock_db, student_id)
        assert len(certs) == 1
        c = certs[0]
        assert c["attendanceMet"] is True
        assert c["allSessionsFinished"] is True
        assert c["feedbackSubmitted"] is True
        assert c["isEligible"] is True  # Fully eligible!
        assert c["pendingRequirement"] is None

    def test_rating_value_never_influences_certificate_eligibility(self):
        """
        A student giving 1/10 rating has the exact same certificate eligibility
        as a student giving 10/10 rating, as long as feedback is submitted.
        """
        mock_db = MagicMock()
        student_1 = uuid.uuid4()
        student_2 = uuid.uuid4()
        batch_id = uuid.uuid4()

        # Both students have 90% attendance and submitted feedback
        rows = [
            {
                "batch_id": batch_id,
                "batch_code": "BATCH-PRO",
                "program_name": "Full Stack",
                "college_name": "Tech College",
                "total_sessions": 10,
                "completed_sessions": 10,
                "recorded_sessions": 10,
                "attended_sessions": 9,
                "feedback_submitted": True,
            }
        ]
        mock_db.execute.return_value.mappings.return_value.all.return_value = rows

        res_1 = calculate_student_certificate_eligibility(mock_db, student_1)[0]
        res_2 = calculate_student_certificate_eligibility(mock_db, student_2)[0]

        assert res_1["isEligible"] == res_2["isEligible"] == True
        assert res_1["pendingRequirement"] == res_2["pendingRequirement"] == None

    def test_certificate_locked_when_attendance_below_threshold_even_if_feedback_submitted(self):
        mock_db = MagicMock()
        batch_id = uuid.uuid4()
        student_id = uuid.uuid4()

        # Attendance 60% (< 80%), feedback submitted
        mock_db.execute.return_value.mappings.return_value.all.return_value = [
            {
                "batch_id": batch_id,
                "batch_code": "BATCH-LOW",
                "program_name": "Cloud Computing",
                "college_name": "State Poly",
                "total_sessions": 10,
                "completed_sessions": 10,
                "recorded_sessions": 10,
                "attended_sessions": 6,  # 60%
                "feedback_submitted": True,
            }
        ]

        certs = calculate_student_certificate_eligibility(mock_db, student_id)
        c = certs[0]
        assert c["attendanceMet"] is False
        assert c["feedbackSubmitted"] is True
        assert c["isEligible"] is False
        assert "Minimum 80% attendance required" in c["pendingRequirement"]

