"""
Live PostgreSQL Integration Tests for Student Concurrency, Row-Level Locking,
Academic History Safeguards, and Audit Log Immutability.

FAIL-CLOSED SAFETY RULES:
- Never executes against production Neon cloud database.
- Requires explicit local test database URL via TEST_DATABASE_URL.
- Requires CONFIRM_ISOLATED_TEST_DATABASE=1 confirmation flag.
"""
from datetime import datetime, timedelta, timezone
import os
import threading
from uuid import uuid4
import pytest
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker

from backend.app.core.database_safety import validate_isolated_test_database_target
from backend.app.core.security import generate_activation_code, hash_activation_token
from backend.app.db.models import (
    Batch,
    BatchStudent,
    College,
    Program,
    SessionAttendance,
    Student,
    StudentAuditLog,
    TrainingSession,
)
from backend.app.schemas.student import (
    BulkStudentActionPayload,
    StudentActivationRequest,
)
from backend.app.services.student_service import (
    activate_student_account,
    check_student_academic_history,
    delete_or_archive_student,
    execute_bulk_student_action,
)

TEST_DB_URL = os.environ.get("TEST_DATABASE_URL")
CONFIRM_ISOLATED = os.environ.get("CONFIRM_ISOLATED_TEST_DATABASE")


@pytest.fixture(scope="module")
def pg_engine():
    """
    Provides isolated PostgreSQL engine. Fails closed if safe environment is not configured.
    """
    if not TEST_DB_URL:
        pytest.skip(
            "SKIPPED (Fail-Closed): Live PostgreSQL concurrency tests require "
            "'TEST_DATABASE_URL' pointing to an isolated local disposable PostgreSQL instance."
        )
    if CONFIRM_ISOLATED != "1":
        pytest.skip(
            "SKIPPED (Fail-Closed): Live mutating database tests require explicit confirmation: "
            "Set 'CONFIRM_ISOLATED_TEST_DATABASE=1' to confirm the target database is disposable."
        )

    is_safe, reason = validate_isolated_test_database_target(TEST_DB_URL, confirmed=True)
    if not is_safe:
        pytest.fail(f"FAIL-CLOSED SAFETY VIOLATION: {reason}")

    engine = create_engine(TEST_DB_URL, pool_pre_ping=True)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def pg_session(pg_engine):
    Session = sessionmaker(bind=pg_engine)
    session = Session()
    trans = session.begin()
    try:
        yield session
    finally:
        trans.rollback()
        session.close()


class TestPostgreSqlStudentConcurrencyIntegration:
    """
    Tests live PostgreSQL transaction behavior, row-level locking (with_for_update),
    audit immutability triggers, and concurrent execution.
    """

    def test_concurrent_activation_requests_atomic_serialization(self, pg_engine):
        """Two concurrent activation requests using the same token: exactly one succeeds, the other fails."""
        Session = sessionmaker(bind=pg_engine)
        session_setup = Session()

        # Create student in pending_activation
        college = College(name="Test College", code=f"TC_{uuid4().hex[:6]}", status="active")
        session_setup.add(college)
        session_setup.flush()

        activation_code = generate_activation_code()
        student = Student(
            college_id=college.id,
            roll_number=f"ROLL_{uuid4().hex[:6]}",
            full_name="Concurrency Student",
            dob="2003-05-20",
            status="pending_activation",
            must_change_password=True,
            activation_token_hash=hash_activation_token(activation_code),
            activation_token_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        session_setup.add(student)
        session_setup.commit()

        results = []

        def attempt_activation(worker_id):
            s = Session()
            try:
                res = activate_student_account(
                    db=s,
                    request=StudentActivationRequest(
                        roll_number=student.roll_number,
                        dob="2003-05-20",
                        activation_code=activation_code,
                        new_password="NewSecurePassword@2026",
                    ),
                )
                results.append((worker_id, True, res))
            except Exception as ex:
                results.append((worker_id, False, str(ex)))
            finally:
                s.close()

        t1 = threading.Thread(target=attempt_activation, args=(1,))
        t2 = threading.Thread(target=attempt_activation, args=(2,))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        # Exactly 1 worker must succeed, exactly 1 must fail due to row-level serialization
        successes = [r for r in results if r[1] is True]
        failures = [r for r in results if r[1] is False]
        assert len(successes) == 1, f"Expected exactly 1 success, got {len(successes)}"
        assert len(failures) == 1, f"Expected exactly 1 failure, got {len(failures)}"

        # Clean up
        session_cleanup = Session()
        session_cleanup.execute(text("DELETE FROM students WHERE id = :id"), {"id": student.id})
        session_cleanup.execute(text("DELETE FROM colleges WHERE id = :id"), {"id": college.id})
        session_cleanup.commit()
        session_cleanup.close()

    def test_audit_logs_immutable_against_direct_deletion(self, pg_session):
        """Direct DELETE or UPDATE on student_audit_logs must be rejected by the PostgreSQL database trigger."""
        audit_entry = StudentAuditLog(
            student_roll="AUDIT-TEST-001",
            action="test_action",
            actor_role="super_admin",
            details="Original audit detail that must not be changed",
        )
        pg_session.add(audit_entry)
        pg_session.commit()

        # Attempt UPDATE -> trigger must raise exception
        with pytest.raises(Exception) as exc_update:
            pg_session.execute(
                text("UPDATE student_audit_logs SET details = 'Tampered detail' WHERE id = :id"),
                {"id": audit_entry.id},
            )
            pg_session.commit()
        assert "immutable" in str(exc_update.value).lower()
        pg_session.rollback()

        # Attempt DELETE -> trigger must raise exception
        with pytest.raises(Exception) as exc_delete:
            pg_session.execute(
                text("DELETE FROM student_audit_logs WHERE id = :id"),
                {"id": audit_entry.id},
            )
            pg_session.commit()
        assert "immutable" in str(exc_delete.value).lower()
        pg_session.rollback()

