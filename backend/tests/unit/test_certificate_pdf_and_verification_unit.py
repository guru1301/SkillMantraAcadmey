"""
Unit tests for real PDF certificate generation and verification.
"""
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from fastapi import HTTPException

from backend.app.api.deps import AuthenticatedUser, get_current_user
from backend.app.api.v1.endpoints.certificates import (
    download_certificate_pdf,
    router as certificates_router,
    verify_certificate_public,
)
from backend.app.db.models import Batch, Certificate, College, Program, Student
from backend.app.services.certificate_service import (
    generate_certificate_pdf,
    issue_or_get_certificate,
    get_certificate_by_verification_code,
)


class TestCertificatePdfAndVerificationUnit:
    def test_generate_certificate_pdf_returns_valid_pdf_stream(self):
        """Verify ReportLab produces valid binary PDF data starting with %PDF-."""
        pdf_bytes = generate_certificate_pdf(
            student_name="Rohan Sharma",
            student_roll="2022CS101",
            college_name="National Institute of Engineering",
            program_name="Full Stack Cloud & AI Architecture",
            certificate_number="GT-2026-CERT-ABC12345",
            verification_code="VCODE12345678",
            issued_date_str="March 15, 2026",
            attendance_rate=92.5,
        )

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 1000
        assert pdf_bytes.startswith(b"%PDF-"), "Generated certificate must be a valid PDF"

    def test_verify_certificate_public_success(self):
        """Verifying an existing certificate code returns expected verification details."""
        db = MagicMock()
        cert_id = uuid4()
        student_id = uuid4()
        batch_id = uuid4()

        mock_cert = Certificate(
            id=cert_id,
            student_id=student_id,
            batch_id=batch_id,
            student_name="Priya Patel",
            student_roll="2022EC204",
            college_name="Apex Engineering College",
            program_name="Artificial Intelligence Masterclass",
            certificate_number="GT-2026-0001",
            verification_code="VALIDCODE999",
            issued_at=datetime.now(timezone.utc),
            attendance_rate=88.0,
            status="active",
        )

        db.execute.return_value.scalar_one_or_none.return_value = mock_cert

        result = verify_certificate_public("VALIDCODE999", db=db)

        assert result.valid is True
        assert result.certificateNumber == "GT-2026-0001"
        assert result.studentName == "Priya Patel"
        assert result.collegeName == "Apex Engineering College"
        assert result.programName == "Artificial Intelligence Masterclass"

    def test_verify_certificate_public_not_found(self):
        """Non-existent or revoked verification code returns valid=False."""
        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.return_value = None

        result = verify_certificate_public("NONEXISTENT", db=db)

        assert result.valid is False
        assert result.status == "invalid_or_revoked"

    def test_issue_or_get_certificate_idempotent(self):
        """When a certificate already exists, return existing certificate without duplication."""
        db = MagicMock()
        student_id = uuid4()
        batch_id = uuid4()

        existing_cert = Certificate(
            id=uuid4(),
            student_id=student_id,
            batch_id=batch_id,
            certificate_number="GT-EXISTING-123",
            verification_code="EXISTINGCODE",
            attendance_rate=85.0,
            status="active",
        )
        db.execute.return_value.scalar_one_or_none.return_value = existing_cert

        result = issue_or_get_certificate(db, student_id, batch_id)

        assert result.certificate_number == "GT-EXISTING-123"
        assert result.verification_code == "EXISTINGCODE"
        # Verify db.add was not called since certificate already existed
        assert not db.add.called


class TestCertificatePdfAuthorizationUnit:
    def _sample_cert(self):
        return Certificate(
            id=uuid4(),
            student_id=uuid4(),
            batch_id=uuid4(),
            program_id=uuid4(),
            college_id=uuid4(),
            student_name="Ananya Iyer",
            student_roll="22CS105",
            college_name="College A",
            program_name="Cloud Security",
            certificate_number="ST-2026-0009",
            verification_code="VERIF999999",
            issued_at=datetime.now(timezone.utc),
            attendance_rate=91.0,
            status="active",
        )

    def test_trainer_from_another_batch_or_college_gets_403_on_certificate_pdf(self):
        cert = self._sample_cert()
        other_trainer = AuthenticatedUser(
            id=uuid4(),
            role="trainer",
            email="trainer.b@othercollege.edu",
            full_name="Unassigned Trainer",
            must_change_password=False,
        )

        db = MagicMock()
        # verify_batch_access fetches Batch first, then checks batch_trainers membership
        db.execute.return_value.scalar_one_or_none.return_value = Batch(
            id=cert.batch_id,
            college_id=cert.college_id,
        )
        db.execute.return_value.scalar.return_value = None

        with patch(
            "backend.app.api.v1.endpoints.certificates.get_certificate_by_id",
            return_value=cert,
        ):
            with pytest.raises(HTTPException) as exc_info:
                download_certificate_pdf(
                    certificate_id=cert.id,
                    current_user=other_trainer,
                    db=db,
                )

        assert exc_info.value.status_code == 403

    def test_assigned_trainer_can_download_batch_certificate_pdf(self):
        cert = self._sample_cert()
        assigned_trainer = AuthenticatedUser(
            id=uuid4(),
            role="trainer",
            email="trainer.a@college.edu",
            full_name="Assigned Trainer",
            must_change_password=False,
        )

        db = MagicMock()
        db.execute.return_value.scalar_one_or_none.return_value = Batch(
            id=cert.batch_id,
            college_id=cert.college_id,
        )
        db.execute.return_value.scalar.return_value = 1

        with patch(
            "backend.app.api.v1.endpoints.certificates.get_certificate_by_id",
            return_value=cert,
        ):
            response = download_certificate_pdf(
                certificate_id=cert.id,
                current_user=assigned_trainer,
                db=db,
            )

        assert response.status_code == 200
        assert response.body.startswith(b"%PDF-")

    def test_certificate_pdf_route_enforces_must_change_password(self):
        pdf_route = next(
            r for r in certificates_router.routes if getattr(r, "path", "") == "/certificates/{certificate_id}/pdf"
        )
        current_user_dep = next(
            d for d in pdf_route.dependant.dependencies if d.name == "current_user"
        )
        assert current_user_dep.call is not get_current_user, (
            "PDF route must use require_roles(...) rather than raw get_current_user"
        )

        flagged_trainer = AuthenticatedUser(
            id=uuid4(),
            role="trainer",
            email="trainer@college.edu",
            full_name="Flagged Trainer",
            must_change_password=True,
        )
        with pytest.raises(HTTPException) as exc_info:
            current_user_dep.call(flagged_trainer)

        assert exc_info.value.status_code == 403
        assert "password change required" in exc_info.value.detail.lower()
