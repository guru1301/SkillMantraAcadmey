"""
Unit Tests for Certificate Eligibility Computation.
"""
from unittest.mock import MagicMock
import uuid
import pytest

from backend.app.services.certificate_service import calculate_student_certificate_eligibility


class TestCertificateServiceUnit:
    def test_student_eligible_when_attendance_gte_80_and_sessions_completed(self):
        mock_db = MagicMock()
        batch_id = uuid.uuid4()
        rows = [
            {
                "batch_id": batch_id,
                "batch_code": "BATCH-01",
                "program_name": "Full Stack Web Development",
                "college_name": "Apex Engineering College",
                "total_sessions": 10,
                "completed_sessions": 10,
                "recorded_sessions": 10,
                "attended_sessions": 9,  # 90% attendance
                "feedback_submitted": True,
            }
        ]
        mock_db.execute.return_value.mappings.return_value.all.return_value = rows

        certs = calculate_student_certificate_eligibility(mock_db, student_id=uuid.uuid4())
        assert len(certs) == 1
        c = certs[0]
        assert c["batchCode"] == "BATCH-01"
        assert c["attendanceRate"] == 90.0
        assert c["attendanceMet"] is True
        assert c["allSessionsFinished"] is True
        assert c["feedbackSubmitted"] is True
        assert c["isEligible"] is True
        assert c["issued"] is False
        assert c["certificateNumber"] is None

    def test_student_ineligible_when_attendance_below_80(self):
        mock_db = MagicMock()
        rows = [
            {
                "batch_id": uuid.uuid4(),
                "batch_code": "BATCH-02",
                "program_name": "Data Analytics",
                "college_name": "Metro Tech",
                "total_sessions": 10,
                "completed_sessions": 10,
                "recorded_sessions": 10,
                "attended_sessions": 7,  # 70% attendance (< 80%)
                "feedback_submitted": True,
            }
        ]
        mock_db.execute.return_value.mappings.return_value.all.return_value = rows

        certs = calculate_student_certificate_eligibility(mock_db, student_id=uuid.uuid4())
        assert len(certs) == 1
        c = certs[0]
        assert c["attendanceRate"] == 70.0
        assert c["attendanceMet"] is False
        assert c["isEligible"] is False

    def test_student_ineligible_when_cohort_sessions_not_finished(self):
        mock_db = MagicMock()
        rows = [
            {
                "batch_id": uuid.uuid4(),
                "batch_code": "BATCH-03",
                "program_name": "AI/ML",
                "college_name": "Apex",
                "total_sessions": 20,
                "completed_sessions": 15,  # Only 15 out of 20 completed
                "recorded_sessions": 15,
                "attended_sessions": 15,  # 100% of recorded, but ongoing
                "feedback_submitted": True,
            }
        ]
        mock_db.execute.return_value.mappings.return_value.all.return_value = rows

        certs = calculate_student_certificate_eligibility(mock_db, student_id=uuid.uuid4())
        assert len(certs) == 1
        c = certs[0]
        assert c["attendanceMet"] is True
        assert c["allSessionsFinished"] is False
        assert c["isEligible"] is False

    def test_student_strictly_ineligible_when_feedback_not_submitted(self):
        mock_db = MagicMock()
        batch_id = uuid.uuid4()
        rows = [
            {
                "batch_id": batch_id,
                "batch_code": "BATCH-04",
                "program_name": "Cloud DevOps",
                "college_name": "State Tech",
                "total_sessions": 10,
                "completed_sessions": 10,
                "recorded_sessions": 10,
                "attended_sessions": 10,  # 100% attendance
                "feedback_submitted": False,  # No feedback submitted
            }
        ]
        mock_db.execute.return_value.mappings.return_value.all.return_value = rows

        certs = calculate_student_certificate_eligibility(mock_db, student_id=uuid.uuid4())
        assert len(certs) == 1
        c = certs[0]
        assert c["attendanceMet"] is True
        assert c["allSessionsFinished"] is True
        assert c["feedbackSubmitted"] is False
        assert c["isEligible"] is False
        assert c["pendingRequirement"] == "Please submit your post-training feedback to unlock your certificate."

