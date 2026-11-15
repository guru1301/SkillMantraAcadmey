"""
Pass 2 — Step 1: Central Password Policy Unit Tests (P2-08)
"""
import pytest
from backend.app.core.password_policy import (
    validate_password,
    generate_temp_password,
    PasswordPolicyViolation,
    COMMON_PASSWORDS,
)


def test_common_passwords_list_size_and_membership():
    assert len(COMMON_PASSWORDS) >= 1000
    for req in ("1234", "12345678", "qwerty12", "skillthinker", "skillmantra"):
        assert req.lower() in COMMON_PASSWORDS


def test_password_length_rejection():
    # Length < 10 must fail
    with pytest.raises(PasswordPolicyViolation) as exc:
        validate_password("Abc!12345")
    assert "at least 10 characters" in str(exc.value).lower()


def test_common_and_breached_password_rejection():
    for weak in ("1234567890", "skillthinker", "skillmantra", "skillthinker123", "skillmantra123", "password123!"):
        with pytest.raises(PasswordPolicyViolation) as exc:
            validate_password(weak)
        msg = str(exc.value).lower()
        assert "common" in msg or "breached" in msg or "predictable" in msg


def test_user_context_rejections():
    ctx = {
        "email": "johndoe@university.edu",
        "roll_number": "CS2026-888",
        "name": "John Doe",
    }
    # Email local part
    with pytest.raises(PasswordPolicyViolation) as exc:
        validate_password("Secret#johndoe99", context=ctx)
    assert "email" in str(exc.value).lower()

    # Roll number
    with pytest.raises(PasswordPolicyViolation) as exc:
        validate_password("Secret#CS2026-888", context=ctx)
    assert "roll" in str(exc.value).lower()

    # User name
    with pytest.raises(PasswordPolicyViolation) as exc:
        validate_password("SuperSecretJohn!99", context=ctx)
    assert "name" in str(exc.value).lower()


def test_all_same_characters_rejection():
    with pytest.raises(PasswordPolicyViolation) as exc:
        validate_password("AAAAAAAAAAAAA")
    assert "repeated" in str(exc.value).lower() or "identical" in str(exc.value).lower() or "same" in str(exc.value).lower()


def test_sequential_characters_rejection():
    with pytest.raises(PasswordPolicyViolation) as exc:
        validate_password("Abcdefghijk!9")
    assert "sequential" in str(exc.value).lower()

    with pytest.raises(PasswordPolicyViolation) as exc:
        validate_password("Secure012345!A")
    assert "sequential" in str(exc.value).lower()


def test_generated_temp_passwords_always_pass():
    for _ in range(50):
        pw = generate_temp_password(16)
        assert len(pw) >= 14
        # Must pass without raising
        validate_password(pw)


def test_schemas_reject_weak_passwords():
    from pydantic import ValidationError
    from backend.app.schemas.auth import ChangePasswordRequest
    from backend.app.schemas.student import StudentActivationRequest, StudentCreate
    from backend.app.schemas.trainer import TrainerCreate, TrainerAdminUpdate
    from backend.app.api.v1.endpoints.admin import AdminUserCreate, AdminUserResetPassword

    weak_passwords = [
        "short",             # < 10 chars
        "1234567890",        # common / sequence
        "skillthinker",      # common
        "AAAAAAAAAAAAA",     # repeated
        "Abcdefghijk!9",     # alphabetical sequence
    ]

    for weak in weak_passwords:
        # ChangePasswordRequest
        with pytest.raises(ValidationError):
            ChangePasswordRequest(current_password="old-strong-password-1", new_password=weak)

        # StudentCreate
        with pytest.raises(ValidationError):
            StudentCreate(name="Alice", roll_number="CS-101", password=weak)

        # TrainerCreate
        with pytest.raises(ValidationError):
            TrainerCreate(name="Bob Trainer", email="bob@example.com", password=weak)

        # TrainerAdminUpdate
        with pytest.raises(ValidationError):
            TrainerAdminUpdate(password=weak)

        # AdminUserCreate
        with pytest.raises(ValidationError):
            AdminUserCreate(email="admin@example.com", full_name="Super Admin", role="super_admin", password=weak)

        # AdminUserResetPassword
        with pytest.raises(ValidationError):
            AdminUserResetPassword(password=weak)


def test_student_activation_schema_context_rejection():
    from pydantic import ValidationError
    from backend.app.schemas.student import StudentActivationRequest

    # Weak password rejected
    with pytest.raises(ValidationError):
        StudentActivationRequest(
            roll_number="CS2026-999",
            dob="2000-01-01",
            activation_code="ACT-1234-5678-ABCD",
            new_password="short",
        )

    # Password containing roll number rejected
    with pytest.raises(ValidationError):
        StudentActivationRequest(
            roll_number="CS2026-999",
            dob="2000-01-01",
            activation_code="ACT-1234-5678-ABCD",
            new_password="StrongSecret#CS2026-999",
        )

    # Password containing DOB rejected
    with pytest.raises(ValidationError):
        StudentActivationRequest(
            roll_number="CS2026-999",
            dob="2000-01-01",
            activation_code="ACT-1234-5678-ABCD",
            new_password="StrongSecret#20000101",
        )

    # Strong generated password passes
    strong_pw = generate_temp_password(16)
    req = StudentActivationRequest(
        roll_number="CS2026-999",
        dob="2000-01-01",
        activation_code="ACT-1234-5678-ABCD",
        new_password=strong_pw,
    )
    assert req.new_password == strong_pw


def test_services_raise_422_on_policy_violation(monkeypatch):
    from unittest.mock import MagicMock
    from fastapi import HTTPException
    from backend.app.services.auth_service import change_user_password
    from backend.app.services.trainer_service import create_trainer, update_trainer
    from backend.app.schemas.trainer import TrainerCreate, TrainerAdminUpdate
    from backend.app.db.models import AdminUser, Trainer

    db = MagicMock()

    # 1. change_user_password with weak password -> 422
    mock_user = AdminUser(email="super@domain.com", full_name="Super Admin", password_hash="dummy")
    db.execute.return_value.scalar_one_or_none.return_value = mock_user

    # Mock verify_password in backend.app.core.security to succeed on current password check
    import backend.app.core.security as core_sec
    monkeypatch.setattr(core_sec, "verify_password", lambda cur, stored: True)

    with pytest.raises(HTTPException) as exc:
        change_user_password(
            db=db,
            user_id="00000000-0000-0000-0000-000000000001",
            role="super_admin",
            current_password="old-strong-password-1",
            new_password="short",
        )
    assert exc.value.status_code == 422

    # 2. create_trainer with weak password in service -> 422
    # Even if pydantic was bypassed or constructed with model_construct
    weak_payload = TrainerCreate.model_construct(
        name="Bob Trainer",
        email="bob@example.com",
        password="short",
        status="active",
        phone=None,
        expertise=None,
        bio=None,
    )
    with pytest.raises(HTTPException) as exc:
        create_trainer(db=db, data=weak_payload)
    assert exc.value.status_code == 422

    # 3. update_trainer with weak password in service -> 422
    mock_trainer = Trainer(
        id="00000000-0000-0000-0000-000000000002",
        email="trainer@example.com",
        full_name="Trainer Name",
        status="active",
    )
    db.execute.return_value.scalar_one_or_none.return_value = mock_trainer
    weak_update = TrainerAdminUpdate.model_construct(password="1234567890")
    with pytest.raises(HTTPException) as exc:
        update_trainer(db=db, trainer_id=mock_trainer.id, data=weak_update)
    assert exc.value.status_code == 422


