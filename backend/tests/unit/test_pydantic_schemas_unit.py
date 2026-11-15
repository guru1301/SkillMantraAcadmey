"""
Unit Tests for Pydantic v2 Request & Response Schema Validation.
"""
from datetime import date
import uuid
import pytest
from pydantic import ValidationError

from backend.app.schemas.batch import BatchCreate, BatchUpdate
from backend.app.schemas.college import CollegeCreate, CollegeStatusUpdate
from backend.app.schemas.inquiry import ContactInquiryCreate


class TestPydanticSchemasUnit:
    def test_batch_create_accepts_valid_date_range(self):
        bc = BatchCreate(
            name="Valid Batch",
            batch_code="B26-TEST-01",
            program_id=uuid.uuid4(),
            start_date=date(2026, 1, 1),
            end_date=date(2026, 3, 1),
            target_strength=50,
            status="active",
        )
        assert bc.start_date < bc.end_date

    def test_batch_create_rejects_reversed_date_range(self):
        with pytest.raises(ValidationError) as exc_info:
            BatchCreate(
                name="Invalid Batch",
                program_id=uuid.uuid4(),
                start_date=date(2026, 5, 1),
                end_date=date(2026, 4, 1),  # end_date before start_date
            )
        assert "end_date must be greater than or equal to start_date" in str(exc_info.value)

    def test_batch_update_rejects_reversed_date_range(self):
        with pytest.raises(ValidationError) as exc_info:
            BatchUpdate(
                start_date=date(2026, 6, 1),
                end_date=date(2026, 5, 1),
            )
        assert "end_date must be greater than or equal to start_date" in str(exc_info.value)

    def test_college_status_update_enforces_pattern(self):
        valid = CollegeStatusUpdate(status="active")
        assert valid.status == "active"

        with pytest.raises(ValidationError):
            CollegeStatusUpdate(status="archived")  # only active or inactive permitted

    def test_contact_inquiry_requires_valid_email(self):
        valid = ContactInquiryCreate(
            name="Dean Smith",
            organization="City University",
            email="dean@cityuniv.edu",
            phone="9876543210",
            requirement_type="Campus Recruitment Training",
        )
        assert valid.email == "dean@cityuniv.edu"

        with pytest.raises(ValidationError):
            ContactInquiryCreate(
                name="Dean Smith",
                organization="City University",
                email="not-an-email",
                phone="9876543210",
                requirement_type="Training",
            )

