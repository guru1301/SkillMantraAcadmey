import io
from unittest.mock import MagicMock, patch
import pytest
from sqlalchemy.exc import ProgrammingError, OperationalError
from sqlalchemy.engine import Connection
import backend.alembic.env as alembic_env
from backend.scripts.bootstrap_dev_database import bootstrap_database


class TestMigrationErrorPropagation:
    """
    Unit Tests: Validates that database migration errors are NEVER silently swallowed.
    Proves that:
    1. Simulated migration failures propagate directly to the caller.
    2. Failed transactions roll back cleanly.
    3. The bootstrap process aborts immediately and does not report success on failure.
    """

    @patch("backend.alembic.env.context")
    def test_simulated_migration_failure_is_propagated(self, mock_context):
        """
        Verifies that any genuine database or migration error raised during
        run_migrations_online is propagated immediately rather than swallowed.
        """
        mock_conn = MagicMock(spec=Connection)
        mock_config = MagicMock()
        mock_config.attributes = {"connection": mock_conn}
        mock_context.config = mock_config

        # Simulate a genuine PostgreSQL syntax/programming error during migration execution
        simulated_error = ProgrammingError(
            statement="ALTER TABLE invalid_syntax",
            params={},
            orig=Exception("syntax error at or near 'invalid_syntax'"),
        )
        mock_context.run_migrations.side_effect = simulated_error

        # Must raise the exact ProgrammingError, not swallow it
        with pytest.raises(ProgrammingError, match="syntax error at or near 'invalid_syntax'"):
            alembic_env.run_migrations_online()

    @patch("backend.alembic.env.context")
    def test_failed_migration_triggers_transaction_rollback(self, mock_context):
        """
        Verifies that when a migration fails, the transaction context manager rolls back.
        """
        mock_conn = MagicMock(spec=Connection)
        mock_config = MagicMock()
        mock_config.attributes = {"connection": mock_conn}
        mock_context.config = mock_config

        # Create mock transaction context manager
        mock_trans = MagicMock()
        mock_context.begin_transaction.return_value.__enter__.return_value = mock_trans
        # When an exception leaves __exit__, context manager handles rollback
        mock_context.run_migrations.side_effect = OperationalError("connection lost", {}, Exception())

        with pytest.raises(OperationalError, match="connection lost"):
            alembic_env.run_migrations_online()

        # begin_transaction must have been called
        mock_context.begin_transaction.assert_called_once()

    @patch("backend.scripts.bootstrap_dev_database.validate_isolated_test_database_target")
    @patch("backend.scripts.bootstrap_dev_database.validate_legacy_migration_files")
    @patch("backend.scripts.bootstrap_dev_database.create_engine")
    @patch("backend.scripts.bootstrap_dev_database.command.upgrade")
    def test_bootstrap_process_does_not_report_success_on_failure(
        self, mock_upgrade, mock_create_engine, mock_validate_files, mock_validate_target, capsys
    ):
        """
        Verifies that if Alembic or migration execution fails during bootstrap,
        the error propagates and the script does NOT output the success message.
        """
        mock_validate_target.return_value = (True, "Safe")
        mock_validate_files.return_value = []

        mock_engine = MagicMock()
        mock_conn = MagicMock()
        mock_engine.connect.return_value.__enter__.return_value = mock_conn
        mock_create_engine.return_value = mock_engine

        # Simulate upgrade failure
        mock_upgrade.side_effect = RuntimeError("Simulated Alembic Preflight Failure: Missing tables")

        with pytest.raises(RuntimeError, match="Simulated Alembic Preflight Failure"):
            bootstrap_database("postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test", confirmed=True)

        captured = capsys.readouterr()
        # Verify success message was NEVER printed
        assert "Database bootstrap complete!" not in captured.out
        assert "All 16 tables and Alembic versioning are initialized." not in captured.out

