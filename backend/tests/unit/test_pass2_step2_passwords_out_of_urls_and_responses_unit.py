"""
Pass 2 — Step 2: Passwords Out of URLs and Responses Unit Tests (P2-04 + P5-01)
"""
import logging
from unittest.mock import MagicMock
from uuid import uuid4
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from backend.app.core.config import Settings
from backend.app.core.logging import setup_logging, SensitiveDataRedactionFilter
from backend.app.api.v1.endpoints.batches import assign_credentials
from backend.app.api.v1.endpoints.students import assign_single_credentials
from backend.app.api.v1.endpoints.admin import (
    AdminUserCreate,
    AdminUserResetPassword,
    create_admin_user_endpoint,
    reset_user_password_endpoint,
)
from backend.app.db.models import AdminUser, CollegeUser, Student, UserSession


def test_db_echo_forced_off_in_production():
    """DB_ECHO must be forced to False whenever ENVIRONMENT is production."""
    s = Settings(
        ENVIRONMENT="production",
        DB_ECHO=True,
        SECRET_KEY="production_super_secret_key_minimum_64_characters_long_for_entropy_12345",
        CORS_ORIGINS="https://app.skillmantra.edu.in",
    )
    assert s.DB_ECHO is False


def test_logging_filter_redacts_sensitive_values():
    """Logging filter must redact passwords, tokens, codes, Authorization headers, and query strings."""
    filter_obj = SensitiveDataRedactionFilter()
    secret_pass = "MySuperSecretPassword123!"
    secret_token = "tok_abc123xyz789"
    secret_code = "ACT-9999-8888"

    logger = logging.getLogger("test_redaction")
    logger.handlers.clear()
    logger.addFilter(filter_obj)

    records = [
        logging.LogRecord("test", logging.INFO, "path", 10, f"User password={secret_pass} login", (), None),
        logging.LogRecord("test", logging.INFO, "path", 10, f"Token: token={secret_token} granted", (), None),
        logging.LogRecord("test", logging.INFO, "path", 10, f"Activation activation_code={secret_code}", (), None),
        logging.LogRecord("test", logging.INFO, "path", 10, f"Header Authorization: Bearer {secret_token}", (), None),
        logging.LogRecord("test", logging.INFO, "path", 10, f"GET /api/v1/batches/123/credentials?password={secret_pass}&other=1", (), None),
    ]

    for rec in records:
        filter_obj.filter(rec)
        msg = rec.getMessage()
        assert secret_pass not in msg, f"Plaintext password leaked in log: {msg}"
        assert secret_token not in msg, f"Plaintext token leaked in log: {msg}"
        assert secret_code not in msg, f"Plaintext code leaked in log: {msg}"
        assert "[REDACTED]" in msg


def test_admin_create_and_reset_passwords_out_of_message():
    """Admin user create and reset endpoints must return temp password in JSON body only, never in message string."""
    db = MagicMock()
    db.execute.return_value.scalar_one_or_none.return_value = None
    current_user = MagicMock(id=uuid4(), role="super_admin")

    # 1. Create User
    create_payload = AdminUserCreate(
        email="new_super@example.com",
        full_name="New Super",
        role="super_admin",
    )
    create_res = create_admin_user_endpoint(payload=create_payload, current_user=current_user, db=db)
    assert hasattr(create_res, "temporary_password"), "Response missing dedicated temporary_password field"
    assert create_res.temporary_password is not None
    assert create_res.temporary_password not in create_res.message, "Temporary password must not appear in message string"

    # 2. Reset User Password
    mock_admin = AdminUser(id=uuid4(), email="target@example.com", full_name="Target", status="active")
    db.execute.return_value.scalar_one_or_none.return_value = mock_admin
    reset_payload = AdminUserResetPassword()
    reset_res = reset_user_password_endpoint(user_id=mock_admin.id, payload=reset_payload, current_user=current_user, db=db)
    assert hasattr(reset_res, "temporary_password"), "Response missing dedicated temporary_password field"
    assert reset_res.temporary_password is not None
    assert reset_res.temporary_password not in reset_res.message, "Temporary password must not appear in message string"


def test_batch_credentials_unique_per_student_and_body_only(monkeypatch):
    """
    POST /batches/{id}/credentials:
    1. Returns unique temporary passwords per student in JSON body only.
    2. Never puts password in message string.
    3. Rejects or ignores ?password= query param (no shared batch password).
    """
    db = MagicMock()
    batch_id = uuid4()
    current_user = MagicMock(id=uuid4(), role="super_admin")

    # Mock batch access
    from backend.app.api.v1.endpoints import batches as batches_ep
    monkeypatch.setattr(batches_ep, "verify_batch_access", lambda db, b_id, u: True)

    # Mock students in batch
    st1 = (uuid4(), "CS-001", "Alice Student", uuid4())
    st2 = (uuid4(), "CS-002", "Bob Student", uuid4())
    mock_res = MagicMock()
    mock_res.fetchall.return_value = [st1, st2]
    db.execute.return_value = mock_res

    res = assign_credentials(batch_id=batch_id, current_user=current_user, db=db)

    # Must return count and credentials list
    assert hasattr(res, "credentials")
    assert len(res.credentials) == 2
    # Unique passwords per student
    pw1 = res.credentials[0].temporary_password
    pw2 = res.credentials[1].temporary_password
    assert pw1 != pw2, "Batch credentials must be unique per student (no shared batch password)"
    assert pw1 not in res.message
    assert pw2 not in res.message

    # When password="malicious" query param is supplied, it is ignored
    res_ignored = assign_credentials(batch_id=batch_id, current_user=current_user, db=db, password="malicious")
    for cred in res_ignored.credentials:
        assert cred.temporary_password != "malicious"
        assert len(cred.temporary_password) >= 14


def test_single_student_credentials_body_only(monkeypatch):
    """
    POST /students/{id}/credentials:
    Returns temporary_password in JSON body only, never in message string.
    """
    db = MagicMock()
    student_id = uuid4()
    current_user = MagicMock(id=uuid4(), role="super_admin")

    from backend.app.api.v1.endpoints import students as students_ep
    monkeypatch.setattr(students_ep, "verify_student_access", lambda db, s_id, u: True)

    mock_row = (student_id, "ROLL-001", "Charlie Student", uuid4())
    mock_res = MagicMock()
    mock_res.first.return_value = mock_row
    db.execute.return_value = mock_res

    res = assign_single_credentials(student_id=student_id, current_user=current_user, db=db)

    assert hasattr(res, "temporary_password")
    assert res.temporary_password is not None
    assert res.temporary_password not in res.message, "Temporary password must not appear in message string"

    # When password="malicious" is supplied, it is ignored
    res_ignored = assign_single_credentials(student_id=student_id, current_user=current_user, db=db, password="malicious")
    assert res_ignored.temporary_password != "malicious"
    assert len(res_ignored.temporary_password) >= 14


def test_no_password_query_parameters_in_api_endpoints():
    """
    P2-04: No API endpoint may declare a 'password' Query parameter.
    """
    import inspect
    from fastapi.params import Query as FastApiQuery
    from backend.app.api.v1.endpoints.batches import assign_credentials
    from backend.app.api.v1.endpoints.students import assign_single_credentials

    for fn in (assign_credentials, assign_single_credentials):
        sig = inspect.signature(fn)
        for param_name, param in sig.parameters.items():
            assert not (param_name == "password" and isinstance(param.default, FastApiQuery)), (
                f"Endpoint '{fn.__name__}' must not declare a 'password' Query parameter."
            )
