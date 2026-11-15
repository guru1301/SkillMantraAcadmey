import importlib
from unittest.mock import MagicMock, patch
import pytest

migration_module = importlib.import_module(
    "backend.alembic.versions.0001_add_user_sessions_and_contact_inquiries"
)
assert_legacy_baseline_exists = migration_module.assert_legacy_baseline_exists
REQUIRED_LEGACY_TABLES = migration_module.REQUIRED_LEGACY_TABLES
from backend.tests.unit.test_schema_validator_unit import build_mock_valid_inspector


class TestAlembicBaselinePreflight:
    """
    Unit Tests: Validates the Alembic baseline preflight guard.
    Ensures that an empty or incomplete database cannot silently apply
    the incremental migration and reach head with missing legacy tables or columns.
    """

    @patch.object(migration_module.op, "get_context")
    @patch.object(migration_module.op, "get_bind")
    @patch.object(migration_module.sa, "inspect")
    def test_preflight_passes_when_all_14_legacy_tables_and_columns_exist(self, mock_inspect, mock_get_bind, mock_get_context):
        """When all 14 legacy tables and critical columns exist, preflight passes cleanly."""
        mock_context = MagicMock()
        mock_context.opts = {}
        mock_get_context.return_value = mock_context

        mock_bind = MagicMock()
        mock_bind.__class__.__name__ = "Connection"
        mock_get_bind.return_value = mock_bind

        mock_inspector = build_mock_valid_inspector()
        mock_inspect.return_value = mock_inspector

        # Should execute without exception
        assert_legacy_baseline_exists()

    @patch.object(migration_module.op, "get_context")
    @patch.object(migration_module.op, "get_bind")
    @patch.object(migration_module.sa, "inspect")
    def test_preflight_fails_closed_on_empty_database(self, mock_inspect, mock_get_bind, mock_get_context):
        """When the database is empty, preflight raises RuntimeError and lists missing tables."""
        mock_context = MagicMock()
        mock_context.opts = {}
        mock_get_context.return_value = mock_context

        mock_bind = MagicMock()
        mock_bind.__class__.__name__ = "Connection"
        mock_get_bind.return_value = mock_bind

        mock_inspector = MagicMock()
        mock_inspector.get_table_names.return_value = []  # Empty DB
        mock_inspect.return_value = mock_inspector

        with pytest.raises(RuntimeError, match="Missing required legacy table"):
            assert_legacy_baseline_exists()

    @patch.object(migration_module.op, "get_context")
    @patch.object(migration_module.op, "get_bind")
    @patch.object(migration_module.sa, "inspect")
    def test_preflight_fails_closed_on_partial_database(self, mock_inspect, mock_get_bind, mock_get_context):
        """When only some legacy tables exist, preflight fails and names the missing ones."""
        mock_context = MagicMock()
        mock_context.opts = {}
        mock_get_context.return_value = mock_context

        mock_bind = MagicMock()
        mock_bind.__class__.__name__ = "Connection"
        mock_get_bind.return_value = mock_bind

        mock_inspector = MagicMock()
        partial_tables = ["colleges", "programs", "batches", "students"]
        mock_inspector.get_table_names.return_value = partial_tables
        mock_inspect.return_value = mock_inspector

        with pytest.raises(RuntimeError, match="Missing required legacy table"):
            assert_legacy_baseline_exists()

    @patch.object(migration_module.op, "get_context")
    @patch.object(migration_module.op, "get_bind")
    @patch.object(migration_module.sa, "inspect")
    def test_preflight_fails_closed_when_critical_column_missing(self, mock_inspect, mock_get_bind, mock_get_context):
        """When all tables exist but a critical column (e.g. progress_weights) is missing, preflight aborts."""
        mock_context = MagicMock()
        mock_context.opts = {}
        mock_get_context.return_value = mock_context

        mock_bind = MagicMock()
        mock_bind.__class__.__name__ = "Connection"
        mock_get_bind.return_value = mock_bind

        mock_inspector = build_mock_valid_inspector()
        # Omit 'progress_weights' from programs
        original_cols = mock_inspector.get_columns("programs")
        mock_inspector.get_columns.side_effect = lambda t: [c for c in original_cols if c["name"] != "progress_weights"] if t == "programs" else build_mock_valid_inspector().get_columns(t)
        mock_inspect.return_value = mock_inspector

        with pytest.raises(RuntimeError, match="missing critical column 'progress_weights'"):
            assert_legacy_baseline_exists()

    @patch.object(migration_module.op, "get_context")
    def test_preflight_skips_inspection_in_offline_sql_mode(self, mock_get_context):
        """When running in offline SQL generation mode (as_sql=True), preflight does not inspect DB."""
        mock_context = MagicMock()
        mock_context.opts = {"as_sql": True}
        mock_get_context.return_value = mock_context

        # Must not raise even without binding or mock
        assert_legacy_baseline_exists()
