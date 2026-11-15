"""
Pass 2 Step 7 Unit Tests: GET Must Not Change State (P2-10 & P4-08).

Requirements:
- GET /certificates/batch/{id}/download only returns an already-issued certificate PDF (404 if none).
- Issuance strictly via POST .../issue with INSERT ... ON CONFLICT DO NOTHING plus re-fetch.
- GET never inserts a row in the database.
- Two concurrent issues yield exactly one row and no 500 error.
"""
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from fastapi import HTTPException, status
from sqlalchemy import create_engine, select, func
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import sessionmaker

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"

from backend.app.api.deps import AuthenticatedUser
from backend.app.api.v1.endpoints.certificates import download_my_batch_certificate_pdf
from backend.app.db.base import Base
from backend.app.db.models.batch import Batch
from backend.app.db.models.certificate import Certificate
from backend.app.db.models.college import College
from backend.app.db.models.program import Program
from backend.app.db.models.student import Student
from backend.app.services.certificate_service import issue_or_get_certificate


@pytest.fixture
def cert_db_session():
    """Isolated in-memory SQLite session with certificate schema."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    if 'progress_weights' in Program.__table__.columns:
        Program.__table__.columns['progress_weights'].server_default = None
    Base.metadata.create_all(
        bind=engine,
        tables=[
            College.__table__,
            Program.__table__,
            Batch.__table__,
            Student.__table__,
            Certificate.__table__,
        ],
    )
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed required entities
    college = College(
        id=uuid4(),
        name="Apex Institute of Technology",
        status="active",
    )
    program = Program(
        id=uuid4(),
        name="Full Stack Web Development",
        duration_days=90,
        status="active",
    )
    batch = Batch(
        id=uuid4(),
        name="FSWD 2026 Batch Alpha",
        college_id=college.id,
        program_id=program.id,
        status="completed",
        start_date=datetime(2026, 1, 1).date(),
        end_date=datetime(2026, 3, 1).date(),
    )
    student = Student(
        id=uuid4(),
        college_id=college.id,
        full_name="Aarav Sharma",
        email="aarav.sharma@apex.edu",
        roll_number="APEX-2026-001",
        status="active",
    )
    session.add_all([college, program, batch, student])
    session.commit()

    yield session, student, batch
    session.close()


class TestCertificateStateSafetyUnit:
    def test_get_certificate_download_never_inserts_row_and_returns_404_if_unissued(self, cert_db_session):
        """
        GET /certificates/batch/{id}/download must be read-only.
        If the student has not issued their certificate via POST, GET must return 404,
        and MUST NOT insert any row into certificates table.
        """
        session, student, batch = cert_db_session

        student_user = AuthenticatedUser(
            id=student.id,
            role="student",
            email=student.email,
            full_name=student.full_name,
            college_id=student.college_id,
        )

        # Mock eligibility to return True so that old code would have issued the certificate
        mock_eligibility = [{
            "batchId": batch.id,
            "batchCode": batch.code,
            "programName": "Full Stack Web Development",
            "collegeName": "Apex Institute of Technology",
            "attendanceRate": 92.0,
            "attendanceRequired": 80.0,
            "attendanceMet": True,
            "sessionsCompleted": 10,
            "totalSessions": 10,
            "allSessionsFinished": True,
            "feedbackSubmitted": True,
            "feedbackRequired": True,
            "pendingRequirement": None,
            "isEligible": True,
            "issued": False,
            "certificateId": None,
            "certificateNumber": None,
            "verificationCode": None,
        }]

        initial_count = session.execute(select(func.count(Certificate.id))).scalar()
        assert initial_count == 0, "No certificates must exist initially"

        # Calling GET endpoint before POST /issue
        with patch("backend.app.services.certificate_service.calculate_student_certificate_eligibility", return_value=mock_eligibility):
            with pytest.raises(HTTPException) as exc_info:
                download_my_batch_certificate_pdf(
                    batch_id=batch.id,
                    current_user=student_user,
                    db=session,
                )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND, (
            f"Expected 404 NOT FOUND for unissued certificate, got {exc_info.value.status_code}"
        )

        after_count = session.execute(select(func.count(Certificate.id))).scalar()
        assert after_count == 0, "GET must never insert a certificate row in the database"

    def test_two_concurrent_issues_produce_exactly_one_row_without_500(self, cert_db_session):
        """
        Simulating two concurrent issue requests for the same student and batch.
        INSERT ... ON CONFLICT DO NOTHING plus re-fetch must yield exactly 1 certificate row
        and neither request must fail with 500 or conflict exception.
        """
        session, student, batch = cert_db_session

        # Mock calculate_student_certificate_eligibility to return eligible
        mock_eligibility = [{
            "batchId": batch.id,
            "batchCode": batch.code,
            "programName": "Full Stack Web Development",
            "collegeName": "Apex Institute of Technology",
            "attendanceRate": 92.0,
            "attendanceRequired": 80.0,
            "attendanceMet": True,
            "sessionsCompleted": 10,
            "totalSessions": 10,
            "allSessionsFinished": True,
            "feedbackSubmitted": True,
            "feedbackRequired": True,
            "pendingRequirement": None,
            "isEligible": True,
            "issued": False,
            "certificateId": None,
            "certificateNumber": None,
            "verificationCode": None,
        }]

        from unittest.mock import patch
        with patch("backend.app.services.certificate_service.calculate_student_certificate_eligibility", return_value=mock_eligibility):
            # Issue call 1
            cert1 = issue_or_get_certificate(session, student_id=student.id, batch_id=batch.id)
            # Issue call 2
            cert2 = issue_or_get_certificate(session, student_id=student.id, batch_id=batch.id)

        assert cert1.id == cert2.id, "Both issue calls must return the same certificate record"
        total_certs = session.execute(
            select(func.count(Certificate.id)).where(
                Certificate.student_id == student.id,
                Certificate.batch_id == batch.id,
            )
        ).scalar()
        assert total_certs == 1, "Database must contain exactly 1 certificate row"
