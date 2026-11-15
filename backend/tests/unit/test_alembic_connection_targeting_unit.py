from unittest.mock import MagicMock, patch
import pytest
from sqlalchemy.engine import Connection
import backend.alembic.env as alembic_env


class TestAlembicConnectionTargeting:
    """
    Regression Tests: Validates that Alembic respects explicit connection targeting.
    Guarantees that when an explicit Connection is supplied in config.attributes["connection"]
    (e.g., by bootstrap_dev_database or test fixtures), Alembic strictly uses it
    and NEVER touches settings.DATABASE_URL (preventing accidental production targeting).
    """

    @patch("backend.alembic.env.context")
    @patch("backend.alembic.env.engine_from_config")
    @patch("backend.alembic.env.settings")
    def test_alembic_uses_supplied_connection_and_ignores_settings_database_url(
        self, mock_settings, mock_engine_from_config, mock_context
    ):
        """
        Regression Test: When settings.DATABASE_URL points to a production database,
        supplying an explicit test connection MUST bypass settings.DATABASE_URL completely.
        """
        # Simulate dangerous production setting
        mock_settings.DATABASE_URL = "postgresql+psycopg://user:pass@ep-production.neon.tech/main"

        # Create mock explicit connection
        mock_conn = MagicMock(spec=Connection)
        mock_config = MagicMock()
        mock_config.attributes = {"connection": mock_conn}
        mock_context.config = mock_config

        alembic_env.run_migrations_online()

        # 1. Assert context.configure received the explicit connection
        mock_context.configure.assert_called_once()
        _, kwargs = mock_context.configure.call_args
        assert kwargs.get("connection") is mock_conn, "Alembic must bind to the explicit connection"

        # 2. Assert engine_from_config was NEVER called
        mock_engine_from_config.assert_not_called()

        # 3. Assert migrations were executed inside transaction
        mock_context.run_migrations.assert_called_once()

    @patch("backend.alembic.env.context")
    @patch("backend.alembic.env.engine_from_config")
    @patch("backend.alembic.env.settings")
    def test_alembic_uses_custom_url_option_over_settings_url(
        self, mock_settings, mock_engine_from_config, mock_context
    ):
        """
        Verifies that when no connection object is passed, but config.set_main_option('sqlalchemy.url', ...)
        is supplied, Alembic uses the custom option and does not overwrite it with settings.DATABASE_URL.
        """
        mock_settings.DATABASE_URL = "postgresql+psycopg://user:pass@ep-production.neon.tech/main"

        custom_test_url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test"
        mock_config = MagicMock()
        mock_config.attributes = {}
        mock_config.get_main_option.return_value = custom_test_url
        mock_config.get_section.return_value = {}
        mock_context.config = mock_config

        # Mock engine connect
        mock_engine = MagicMock()
        mock_conn = MagicMock()
        mock_engine.connect.return_value.__enter__.return_value = mock_conn
        mock_engine_from_config.return_value = mock_engine

        alembic_env.run_migrations_online()

        # Assert engine_from_config received configuration with custom_test_url
        mock_engine_from_config.assert_called_once()
        args, _ = mock_engine_from_config.call_args
        called_config = args[0]
        assert called_config.get("sqlalchemy.url") == custom_test_url
        assert called_config.get("sqlalchemy.url") != mock_settings.DATABASE_URL
