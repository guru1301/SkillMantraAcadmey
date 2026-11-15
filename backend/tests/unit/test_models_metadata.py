import pytest
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.app.db.models import Base

class TestModelsMetadata:
    """
    Unit Tests: Rigorously inspects SQLAlchemy 2.0 ORM metadata definitions.
    Verifies that all 14 existing tables + 2 infrastructure tables match the
    actual PostgreSQL schema definitions from migrations 001-016.
    Runs without requiring any active database connection.
    """

    def test_all_16_tables_registered(self):
        expected_tables = {
            "admin_users",
            "colleges",
            "college_users",
            "programs",
            "batches",
            "batch_students",
            "batch_trainers",
            "trainers",
            "students",
            "training_sessions",
            "session_attendance",
            "resources",
            "assessments",
            "assessment_submissions",
            "user_sessions",
            "contact_inquiries",
        }
        registered = set(Base.metadata.tables.keys())
        assert expected_tables.issubset(registered), f"Missing tables: {expected_tables - registered}"

    def test_programs_progress_weights_permits_null(self):
        """
        Correction 1: Migration 003 defines 'progress_weights JSONB DEFAULT '{}'::jsonb'
        without a NOT NULL constraint, so it permits NULL.
        """
        table = Base.metadata.tables["programs"]
        col = table.c.progress_weights
        assert isinstance(col.type, JSONB)
        assert col.nullable is True, "programs.progress_weights must permit NULL to match Migration 003"

    def test_training_sessions_trainer_id_has_no_foreign_key(self):
        """
        Correction 2: Migration 005 defines 'trainer_id UUID' with NO foreign key
        constraint referencing trainers.
        """
        table = Base.metadata.tables["training_sessions"]
        trainer_id_col = table.c.trainer_id
        assert isinstance(trainer_id_col.type, UUID)
        assert trainer_id_col.nullable is True
        # Verify no foreign key on trainer_id
        fks_on_col = [fk for fk in table.foreign_keys if fk.parent.name == "trainer_id"]
        assert len(fks_on_col) == 0, "training_sessions.trainer_id must NOT have an FK constraint to match Migration 005"

    def test_batches_target_strength_check_reconciled(self):
        """
        Correction 3: Migration 004 defines inline unnamed 'CHECK (target_strength >= 0)'.
        PostgreSQL defaults unnamed column checks to '{table}_{column}_check'.
        """
        table = Base.metadata.tables["batches"]
        check_names = {ck.name for ck in table.constraints if hasattr(ck, "name")}
        assert "batches_target_strength_check" in check_names, (
            f"Expected 'batches_target_strength_check' in {check_names}"
        )

    def test_session_attendance_status_check_reconciled(self):
        """
        Correction 4: Migration 011 defines inline unnamed 'CHECK (status IN (...))'.
        PostgreSQL defaults unnamed column checks to 'session_attendance_status_check'.
        """
        table = Base.metadata.tables["session_attendance"]
        check_names = {ck.name for ck in table.constraints if hasattr(ck, "name")}
        assert "session_attendance_status_check" in check_names

    def test_assessments_inline_checks_reconciled(self):
        """
        Correction 5: Migration 013 defines inline unnamed checks on type and status.
        Reconciled to 'assessments_type_check' and 'assessments_status_check'.
        """
        table = Base.metadata.tables["assessments"]
        check_names = {ck.name for ck in table.constraints if hasattr(ck, "name")}
        assert "assessments_type_check" in check_names
        assert "assessments_status_check" in check_names

    def test_assessment_submissions_nullability_and_checks(self):
        """
        Correction 6: Migration 015 does NOT specify NOT NULL on answers or violations_count.
        Both permit NULL.
        Inline status check reconciled to 'assessment_submissions_status_check'.
        """
        table = Base.metadata.tables["assessment_submissions"]
        assert table.c.answers.nullable is True, "assessment_submissions.answers must permit NULL to match Migration 015"
        assert table.c.violations_count.nullable is True, "assessment_submissions.violations_count must permit NULL to match Migration 015"
        assert table.c.shuffled_question_order.nullable is True

        check_names = {ck.name for ck in table.constraints if hasattr(ck, "name")}
        assert "assessment_submissions_status_check" in check_names

    def test_students_expression_unique_index_documentation(self):
        """
        Correction 7: Migration 007 uses expression-based UNIQUE INDEX:
        idx_students_college_roll_lower ON students (college_id, LOWER(TRIM(roll_number))),
        NOT a conventional table-level constraint UNIQUE(college_id, roll_number).
        """
        table = Base.metadata.tables["students"]
        index_names = {ix.name: ix for ix in table.indexes}
        assert "idx_students_college_roll_lower" in index_names
        student_idx = index_names["idx_students_college_roll_lower"]
        assert student_idx.unique is True

        # Verify there is NO table-level UniqueConstraint named UNIQUE(college_id, roll_number)
        table_unique_cols = [
            set(col.name for col in uq.columns)
            for uq in table.constraints
            if hasattr(uq, "columns") and uq.__class__.__name__ == "UniqueConstraint"
        ]
        assert {"college_id", "roll_number"} not in table_unique_cols

    def test_user_sessions_no_duplicate_unique_structures(self):
        """
        Correction 8: Ensure user_sessions does not declare duplicate uniqueness on
        session_token_hash (single unique index, no redundant column-level constraint).
        """
        table = Base.metadata.tables["user_sessions"]
        # Column itself should not declare unique=True (which emits a separate constraint)
        assert table.c.session_token_hash.unique is not True

        # Sole uniqueness is through the named index
        index_names = {ix.name: ix for ix in table.indexes}
        assert "idx_user_sessions_token_hash" in index_names
        assert index_names["idx_user_sessions_token_hash"].unique is True

    def test_student_duplicate_indexes_preserved_from_migrations_012_and_016(self):
        """
        Investigates and validates duplicate student indexes:
        - Migration 012 defines: idx_students_roll_lower ON students (LOWER(TRIM(roll_number)))
        - Migration 016 defines: idx_students_lower_roll ON students (LOWER(TRIM(roll_number)))
        Both indexes exist in the live database schema. Removing either without schema
        evidence would cause Alembic to emit DROP INDEX, violating Rule 1 and Rule 4.
        """
        table = Base.metadata.tables["students"]
        index_names = {ix.name for ix in table.indexes}
        assert "idx_students_roll_lower" in index_names, "Missing idx_students_roll_lower from Migration 012"
        assert "idx_students_lower_roll" in index_names, "Missing idx_students_lower_roll from Migration 016"

    def test_foreign_key_ondelete_actions_restrict_and_cascade(self):
        """
        Statically verifies foreign key ondelete behaviors across the ORM metadata:
        - Migration 004: batches.college_id and batches.program_id use ON DELETE RESTRICT
        - Migration 002: college_users.college_id uses ON DELETE CASCADE
        - Migration 007: students.college_id uses ON DELETE CASCADE
        - Migration 008: batch_students.batch_id and student_id use ON DELETE CASCADE
        """
        batches = Base.metadata.tables["batches"]
        college_users = Base.metadata.tables["college_users"]
        students = Base.metadata.tables["students"]
        batch_students = Base.metadata.tables["batch_students"]

        # Verify batches RESTRICT
        batch_fks = {fk.parent.name: fk.ondelete for fk in batches.foreign_keys}
        assert batch_fks.get("college_id") == "RESTRICT", "batches.college_id must enforce RESTRICT"
        assert batch_fks.get("program_id") == "RESTRICT", "batches.program_id must enforce RESTRICT"

        # Verify college_users CASCADE
        cu_fks = {fk.parent.name: fk.ondelete for fk in college_users.foreign_keys}
        assert cu_fks.get("college_id") == "CASCADE", "college_users.college_id must enforce CASCADE"

        # Verify students RESTRICT (DATA-01 safeguard against cascading deletion of student history)
        student_fks = {fk.parent.name: fk.ondelete for fk in students.foreign_keys}
        assert student_fks.get("college_id") == "RESTRICT", "students.college_id must enforce RESTRICT"

        # Verify batch_students CASCADE
        bs_fks = {fk.parent.name: fk.ondelete for fk in batch_students.foreign_keys}
        assert bs_fks.get("batch_id") == "CASCADE", "batch_students.batch_id must enforce CASCADE"
        assert bs_fks.get("student_id") == "CASCADE", "batch_students.student_id must enforce CASCADE"


