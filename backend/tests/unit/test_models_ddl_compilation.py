import pytest
from sqlalchemy.schema import CreateTable, CreateIndex
from sqlalchemy.dialects import postgresql
from backend.app.db.models import Base

class TestPostgreSqlDdlCompilation:
    """
    Unit Tests: Compiles SQLAlchemy 2.0 DDL statements specifically targeting
    the PostgreSQL dialect. Validates that the generated DDL matches the actual
    PostgreSQL schema, constraint names, defaults, and data types without
    executing commands against any database.
    """

    @pytest.fixture(scope="class")
    def pg_dialect(self):
        return postgresql.dialect()

    def test_programs_ddl_compilation(self, pg_dialect):
        table = Base.metadata.tables["programs"]
        ddl = str(CreateTable(table).compile(dialect=pg_dialect))

        assert "id UUID DEFAULT gen_random_uuid() NOT NULL" in ddl
        assert "duration_days INTEGER DEFAULT 0 NOT NULL" in ddl
        # Verified: progress_weights permits NULL
        assert "progress_weights JSONB DEFAULT '{}'::jsonb" in ddl
        assert "progress_weights JSONB DEFAULT '{}'::jsonb NOT NULL" not in ddl
        assert "CONSTRAINT programs_duration_days_check CHECK (duration_days >= 0)" in ddl
        assert "CONSTRAINT chk_program_status CHECK (status IN ('active', 'inactive'))" in ddl

    def test_training_sessions_ddl_has_no_trainer_fk(self, pg_dialect):
        table = Base.metadata.tables["training_sessions"]
        ddl = str(CreateTable(table).compile(dialect=pg_dialect))

        # Verified: trainer_id is just UUID, no FK constraint referencing trainers
        assert "trainer_id UUID" in ddl
        assert "FOREIGN KEY(trainer_id) REFERENCES trainers" not in ddl
        assert "CONSTRAINT chk_session_status CHECK (status IN ('scheduled', 'completed', 'cancelled'))" in ddl

    def test_batches_ddl_compilation(self, pg_dialect):
        table = Base.metadata.tables["batches"]
        ddl = str(CreateTable(table).compile(dialect=pg_dialect))

        assert "CONSTRAINT batches_target_strength_check CHECK (target_strength >= 0)" in ddl
        assert "CONSTRAINT chk_batch_dates CHECK (end_date >= start_date)" in ddl
        assert "FOREIGN KEY(college_id) REFERENCES colleges (id) ON DELETE RESTRICT" in ddl
        assert "FOREIGN KEY(program_id) REFERENCES programs (id) ON DELETE RESTRICT" in ddl
        assert "FOREIGN KEY(created_by) REFERENCES admin_users (id) ON DELETE SET NULL" in ddl

    def test_session_attendance_ddl_compilation(self, pg_dialect):
        table = Base.metadata.tables["session_attendance"]
        ddl = str(CreateTable(table).compile(dialect=pg_dialect))

        assert "CONSTRAINT session_attendance_status_check CHECK (status IN ('present', 'absent', 'late', 'excused'))" in ddl
        assert "CONSTRAINT unq_session_student_attendance UNIQUE (session_id, student_id)" in ddl

    def test_assessments_and_submissions_ddl_compilation(self, pg_dialect):
        assessments_table = Base.metadata.tables["assessments"]
        submissions_table = Base.metadata.tables["assessment_submissions"]

        assessments_ddl = str(CreateTable(assessments_table).compile(dialect=pg_dialect))
        submissions_ddl = str(CreateTable(submissions_table).compile(dialect=pg_dialect))

        assert "CONSTRAINT assessments_type_check CHECK (type IN ('quiz', 'assignment', 'practical_test'))" in assessments_ddl
        assert "CONSTRAINT assessments_status_check CHECK (status IN ('draft', 'published', 'closed'))" in assessments_ddl

        assert "CONSTRAINT assessment_submissions_status_check CHECK (status IN ('not_started', 'in_progress', 'submitted', 'evaluated', 'overdue', 'pending_review'))" in submissions_ddl
        # Verified: answers and violations_count permit NULL
        assert "answers JSONB DEFAULT '{}'::jsonb" in submissions_ddl
        assert "answers JSONB DEFAULT '{}'::jsonb NOT NULL" not in submissions_ddl
        assert "violations_count INTEGER DEFAULT 0" in submissions_ddl
        assert "violations_count INTEGER DEFAULT 0 NOT NULL" not in submissions_ddl

    def test_batch_trainers_lead_partial_unique_index_ddl(self, pg_dialect):
        table = Base.metadata.tables["batch_trainers"]
        lead_index = next(ix for ix in table.indexes if ix.name == "idx_batch_trainers_one_lead_per_batch")
        idx_ddl = str(CreateIndex(lead_index).compile(dialect=pg_dialect))

        assert "CREATE UNIQUE INDEX idx_batch_trainers_one_lead_per_batch ON batch_trainers (batch_id)" in idx_ddl
        assert "WHERE is_lead = true" in idx_ddl

    def test_user_sessions_and_contact_inquiries_ddl_compilation(self, pg_dialect):
        sessions_table = Base.metadata.tables["user_sessions"]
        inquiries_table = Base.metadata.tables["contact_inquiries"]

        sessions_ddl = str(CreateTable(sessions_table).compile(dialect=pg_dialect))
        inquiries_ddl = str(CreateTable(inquiries_table).compile(dialect=pg_dialect))

        # user_sessions DDL verification
        assert "session_token_hash VARCHAR(64) NOT NULL" in sessions_ddl
        assert "user_id UUID NOT NULL" in sessions_ddl
        assert "user_role VARCHAR(50) NOT NULL" in sessions_ddl
        assert "college_id UUID" in sessions_ddl

        # contact_inquiries DDL verification
        assert "requirement_type VARCHAR(100) NOT NULL" in inquiries_ddl
        assert "CONSTRAINT chk_contact_inquiry_status CHECK (status IN ('new', 'contacted', 'resolved', 'archived'))" in inquiries_ddl


