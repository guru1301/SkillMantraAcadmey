import os
import uuid
from datetime import date
from urllib.parse import urlparse
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from backend.app.core.config import settings
from backend.app.core.database_safety import validate_isolated_test_database_target

# Integration test suite requires an explicit, isolated development PostgreSQL database.
# Testing against the production database is strictly prohibited by Rule 1, Rule 4, and Rule 6.
TEST_DB_URL = os.environ.get("TEST_DATABASE_URL")
CONFIRM_ISOLATED = os.environ.get("CONFIRM_ISOLATED_TEST_DATABASE")


@pytest.fixture(scope="module")
def isolated_pg_engine():
    """
    Fixture providing an isolated PostgreSQL database engine.
    Fails closed: Skips if TEST_DATABASE_URL is not set or CONFIRM_ISOLATED_TEST_DATABASE != '1'.
    Rejects dangerous/production/cloud URLs fail-closed.
    """
    if not TEST_DB_URL:
        pytest.skip(
            "SKIPPED (Fail-Closed): Live PostgreSQL integration tests require "
            "'TEST_DATABASE_URL' pointing to an isolated local development/test database."
        )
    if CONFIRM_ISOLATED != "1":
        pytest.skip(
            "SKIPPED (Fail-Closed): Live mutating database tests require explicit confirmation: "
            "Set 'CONFIRM_ISOLATED_TEST_DATABASE=1' to confirm the target database is disposable."
        )

    is_safe, reason = validate_isolated_test_database_target(TEST_DB_URL, confirmed=True)
    if not is_safe:
        pytest.fail(f"FAIL-CLOSED SAFETY VIOLATION: {reason}")

    eng = create_engine(TEST_DB_URL, pool_pre_ping=True)
    yield eng
    eng.dispose()


@pytest.fixture(scope="function")
def isolated_pg_session(isolated_pg_engine):
    Session = sessionmaker(bind=isolated_pg_engine)
    session = Session()
    trans = session.begin()
    try:
        yield session
    finally:
        trans.rollback()
        session.close()


class TestPostgreSqlLiveIntegration:
    """
    PostgreSQL Integration Tests:
    Executed strictly against an isolated development PostgreSQL database when
    TEST_DATABASE_URL and CONFIRM_ISOLATED_TEST_DATABASE=1 are both provided.
    Direct SQL DELETE operations are used to exercise actual PostgreSQL engine
    ON DELETE CASCADE and RESTRICT triggers, bypassing SQLAlchemy ORM cascades.
    """

    def test_programs_null_progress_weights_accepted(self, isolated_pg_session):
        from backend.app.db.models import Program
        p = Program(
            name=f"Test Program {uuid.uuid4()}",
            description="Testing null progress_weights",
            duration_days=10,
            progress_weights=None,  # Verified: must allow NULL
            status="active",
        )
        isolated_pg_session.add(p)
        isolated_pg_session.flush()
        assert p.id is not None
        assert p.progress_weights is None

    def test_training_session_trainer_id_has_no_foreign_key_constraint(self, isolated_pg_session):
        from backend.app.db.models import College, Program, Batch, TrainingSession
        c = College(name=f"College {uuid.uuid4()}", status="active")
        p = Program(name=f"Prog {uuid.uuid4()}", duration_days=30)
        isolated_pg_session.add_all([c, p])
        isolated_pg_session.flush()

        b = Batch(
            code=f"B-{uuid.uuid4().hex[:6]}",
            college_id=c.id,
            program_id=p.id,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 2, 1),
        )
        isolated_pg_session.add(b)
        isolated_pg_session.flush()

        # Insert training session with a random non-existent trainer UUID
        # Because migration 005 defines 'trainer_id UUID' with NO FK, this must succeed!
        random_trainer_uuid = uuid.uuid4()
        ts = TrainingSession(
            batch_id=b.id,
            date=date(2026, 1, 15),
            title="Class 1",
            trainer_id=random_trainer_uuid,
            status="scheduled",
        )
        isolated_pg_session.add(ts)
        isolated_pg_session.flush()
        assert ts.id is not None
        assert ts.trainer_id == random_trainer_uuid

    def test_batch_trainers_lead_trainer_partial_unique_index_rejection(self, isolated_pg_session):
        from backend.app.db.models import College, Program, Batch, Trainer, BatchTrainer
        c = College(name=f"College {uuid.uuid4()}", status="active")
        p = Program(name=f"Prog {uuid.uuid4()}", duration_days=30)
        t1 = Trainer(full_name="Trainer A", status="active")
        t2 = Trainer(full_name="Trainer B", status="active")
        isolated_pg_session.add_all([c, p, t1, t2])
        isolated_pg_session.flush()

        b = Batch(
            code=f"B-{uuid.uuid4().hex[:6]}",
            college_id=c.id,
            program_id=p.id,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 2, 1),
        )
        isolated_pg_session.add(b)
        isolated_pg_session.flush()

        # Assign Lead Trainer 1
        bt1 = BatchTrainer(batch_id=b.id, trainer_id=t1.id, is_lead=True, role="Lead")
        isolated_pg_session.add(bt1)
        isolated_pg_session.flush()

        # Attempt Assign Lead Trainer 2 to same batch -> must violate idx_batch_trainers_one_lead_per_batch
        bt2 = BatchTrainer(batch_id=b.id, trainer_id=t2.id, is_lead=True, role="Lead")
        isolated_pg_session.add(bt2)
        with pytest.raises(IntegrityError):
            isolated_pg_session.flush()

    def test_foreign_key_cascade_college_to_college_users(self, isolated_pg_session):
        """
        Tests database-level ON DELETE CASCADE using direct SQL DELETE:
        Bypasses SQLAlchemy ORM relationship delete-orphan tracking.
        Exercises PostgreSQL engine trigger directly.
        """
        from backend.app.db.models import College, CollegeUser
        c = College(name=f"College Cascade {uuid.uuid4()}", status="active")
        isolated_pg_session.add(c)
        isolated_pg_session.flush()

        cu = CollegeUser(
            college_id=c.id,
            email=f"cu-{uuid.uuid4().hex[:8]}@example.com",
            password_hash="mock_hash",
            role="college_admin",
            status="active",
        )
        isolated_pg_session.add(cu)
        isolated_pg_session.flush()

        cu_id = cu.id
        college_id = c.id

        # Direct SQL DELETE bypassing SQLAlchemy ORM cascade handling
        isolated_pg_session.execute(
            text("DELETE FROM colleges WHERE id = :cid"),
            {"cid": college_id},
        )
        isolated_pg_session.flush()

        # Query database directly using raw SQL to verify engine cascaded child row
        count = isolated_pg_session.execute(
            text("SELECT COUNT(*) FROM college_users WHERE id = :cuid"),
            {"cuid": cu_id},
        ).scalar()
        assert count == 0, "PostgreSQL database-level ON DELETE CASCADE failed to delete college_users row"

    def test_foreign_key_restrict_batches_prevent_college_deletion(self, isolated_pg_session):
        """
        Tests database-level ON DELETE RESTRICT using direct SQL DELETE:
        Migration 004 enforces that a College cannot be deleted while active batches reference it.
        """
        from backend.app.db.models import College, Program, Batch
        c = College(name=f"College Restrict {uuid.uuid4()}", status="active")
        p = Program(name=f"Prog Restrict {uuid.uuid4()}", duration_days=30)
        isolated_pg_session.add_all([c, p])
        isolated_pg_session.flush()

        b = Batch(
            code=f"B-RESTRICT-{uuid.uuid4().hex[:6]}",
            college_id=c.id,
            program_id=p.id,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 2, 1),
        )
        isolated_pg_session.add(b)
        isolated_pg_session.flush()

        # Direct SQL DELETE on colleges table while batch exists -> must violate foreign key RESTRICT
        with pytest.raises(IntegrityError):
            isolated_pg_session.execute(
                text("DELETE FROM colleges WHERE id = :cid"),
                {"cid": c.id},
            )
            isolated_pg_session.flush()

    def test_foreign_key_restrict_batches_prevent_program_deletion(self, isolated_pg_session):
        """
        Tests database-level ON DELETE RESTRICT using direct SQL DELETE:
        Migration 004 enforces that a Program cannot be deleted while active batches reference it.
        """
        from backend.app.db.models import College, Program, Batch
        c = College(name=f"College Restrict 2 {uuid.uuid4()}", status="active")
        p = Program(name=f"Prog Restrict 2 {uuid.uuid4()}", duration_days=30)
        isolated_pg_session.add_all([c, p])
        isolated_pg_session.flush()

        b = Batch(
            code=f"B-RESTRICT2-{uuid.uuid4().hex[:6]}",
            college_id=c.id,
            program_id=p.id,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 2, 1),
        )
        isolated_pg_session.add(b)
        isolated_pg_session.flush()

        # Direct SQL DELETE on programs table while batch exists -> must violate foreign key RESTRICT
        with pytest.raises(IntegrityError):
            isolated_pg_session.execute(
                text("DELETE FROM programs WHERE id = :pid"),
                {"pid": p.id},
            )
            isolated_pg_session.flush()

    def test_foreign_key_cascade_batch_to_batch_students(self, isolated_pg_session):
        """
        Tests database-level ON DELETE CASCADE using direct SQL DELETE:
        Migration 008 enforces that deleting a Batch automatically cascades
        to remove its batch_students enrollment records.
        """
        from backend.app.db.models import College, Program, Batch, Student, BatchStudent
        c = College(name=f"College Cascade B {uuid.uuid4()}", status="active")
        p = Program(name=f"Prog Cascade B {uuid.uuid4()}", duration_days=30)
        s = Student(
            college_id=c.id,
            roll_number=f"ROLL-{uuid.uuid4().hex[:6]}",
            full_name="Test Student",
            status="active",
        )
        isolated_pg_session.add_all([c, p, s])
        isolated_pg_session.flush()

        b = Batch(
            code=f"B-CAS-{uuid.uuid4().hex[:6]}",
            college_id=c.id,
            program_id=p.id,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 2, 1),
        )
        isolated_pg_session.add(b)
        isolated_pg_session.flush()

        bs = BatchStudent(batch_id=b.id, student_id=s.id, status="enrolled")
        isolated_pg_session.add(bs)
        isolated_pg_session.flush()

        batch_id = b.id
        student_id = s.id

        # Direct SQL DELETE on batches table bypassing ORM cascade
        isolated_pg_session.execute(
            text("DELETE FROM batches WHERE id = :bid"),
            {"bid": batch_id},
        )
        isolated_pg_session.flush()

        # Query database directly using raw SQL to verify engine cascaded child row
        count = isolated_pg_session.execute(
            text("SELECT COUNT(*) FROM batch_students WHERE batch_id = :bid AND student_id = :sid"),
            {"bid": batch_id, "sid": student_id},
        ).scalar()
        assert count == 0, "PostgreSQL database-level ON DELETE CASCADE failed to delete batch_students row"

    def test_transaction_explicit_rollback_cleans_up_all_changes(self, isolated_pg_engine):
        """
        Proves that an explicit transaction rollback discards all uncommitted database modifications.
        Opens a connection, starts a transaction, inserts a test record, rolls back,
        and then queries through a completely separate connection to verify the row is absent.
        """
        test_id = str(uuid.uuid4())
        college_name = f"Rollback Verification College {test_id[:8]}"

        # Connection 1: Begin transaction, insert record, verify visible within transaction, then rollback
        with isolated_pg_engine.connect() as conn1:
            trans1 = conn1.begin()
            conn1.execute(
                text("INSERT INTO colleges (id, name, status) VALUES (:id, :name, 'active')"),
                {"id": test_id, "name": college_name},
            )
            # Record must be visible within the active uncommitted transaction
            row_visible = conn1.execute(
                text("SELECT id FROM colleges WHERE id = :id"),
                {"id": test_id},
            ).scalar()
            assert str(row_visible) == test_id, "Inserted record not visible within transaction prior to rollback"

            trans1.rollback()

        # Connection 2: Separate fresh connection verifying that uncommitted change is completely absent
        with isolated_pg_engine.connect() as conn2:
            persisted_count = conn2.execute(
                text("SELECT COUNT(*) FROM colleges WHERE id = :id"),
                {"id": test_id},
            ).scalar()
            assert persisted_count == 0, (
                "PostgreSQL transaction rollback failed: uncommitted record persisted into persistent database state."
            )

    def test_transaction_failure_triggers_automatic_engine_rollback(self, isolated_pg_engine):
        """
        Proves that a controlled failure during transaction execution triggers automatic rollback,
        preventing partial or corrupt data persistence across separate connections.
        """
        test_id = str(uuid.uuid4())
        college_name = f"Auto-Rollback Failure College {test_id[:8]}"

        # Connection 1: Begin transaction block via engine.begin() which auto-rolls back on exception
        with pytest.raises(RuntimeError, match="Simulated controlled failure"):
            with isolated_pg_engine.begin() as conn_fail:
                conn_fail.execute(
                    text("INSERT INTO colleges (id, name, status) VALUES (:id, :name, 'active')"),
                    {"id": test_id, "name": college_name},
                )
                row_visible = conn_fail.execute(
                    text("SELECT id FROM colleges WHERE id = :id"),
                    {"id": test_id},
                ).scalar()
                assert str(row_visible) == test_id

                # Trigger controlled failure
                raise RuntimeError("Simulated controlled failure to exercise engine rollback")

        # Connection 2: Verify via fresh connection that no partial changes persisted
        with isolated_pg_engine.connect() as conn_verify:
            persisted_count = conn_verify.execute(
                text("SELECT COUNT(*) FROM colleges WHERE id = :id"),
                {"id": test_id},
            ).scalar()
            assert persisted_count == 0, (
                "PostgreSQL auto-rollback failed: failed transaction leaked changes into database."
            )

    def test_transaction_db_constraint_violation_rolls_back_atomic_unit_of_work(self, isolated_pg_engine):
        """
        Proves that when a database check-constraint or foreign key violation aborts a transaction,
        preceding valid operations within that same unit of work are rolled back completely.
        """
        valid_college_id = str(uuid.uuid4())
        college_name = f"Atomic Work College {valid_college_id[:8]}"

        with isolated_pg_engine.connect() as conn:
            trans = conn.begin()
            try:
                # 1. Valid operation within unit of work
                conn.execute(
                    text("INSERT INTO colleges (id, name, status) VALUES (:id, :name, 'active')"),
                    {"id": valid_college_id, "name": college_name},
                )
                # 2. Invalid operation: violates chk_college_status check constraint
                conn.execute(
                    text("INSERT INTO colleges (id, name, status) VALUES (:id, 'Invalid Status College', 'illegal_status')"),
                    {"id": str(uuid.uuid4())},
                )
                trans.commit()
            except IntegrityError:
                trans.rollback()

        # Connection 2: Verify that even the preceding valid insert was cleanly rolled back
        with isolated_pg_engine.connect() as conn_verify:
            count = conn_verify.execute(
                text("SELECT COUNT(*) FROM colleges WHERE id = :id"),
                {"id": valid_college_id},
            ).scalar()
            assert count == 0, (
                "Atomic unit-of-work rollback failed: preceding valid operation persisted after subsequent constraint failure."
            )

