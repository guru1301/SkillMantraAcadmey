from unittest.mock import patch
from backend.app.db.session import engine, check_db_connectivity, _connect_args
from backend.app.core.config import Settings

class TestDbSessionUnit:
    """
    Unit Tests: Validates database session configuration, dialect assembly,
    and safe exception handling without touching any live database.
    """

    def test_engine_psycopg3_dialect(self):
        assert engine.dialect.name == "postgresql"
        assert engine.dialect.driver == "psycopg"
        assert engine.pool is not None

    def test_neon_pgbouncer_connect_args(self):
        # Verify prepared statements are disabled for transaction-mode pooling stability
        assert _connect_args.get("prepare_threshold") is None
        assert "prepare_threshold" in _connect_args
        assert _connect_args.get("connect_timeout") == 15

    def test_database_url_normalization(self):
        s1 = Settings(DATABASE_URL="postgresql://user:pass@ep-host.neon.tech/db?sslmode=require")
        assert s1.DATABASE_URL.startswith("postgresql+psycopg://")

        s2 = Settings(DATABASE_URL="postgres://user:pass@ep-host.neon.tech/db?sslmode=require")
        assert s2.DATABASE_URL.startswith("postgresql+psycopg://")

        s3 = Settings(DATABASE_URL="postgresql+psycopg://user:pass@ep-host.neon.tech/db?sslmode=require")
        assert s3.DATABASE_URL.startswith("postgresql+psycopg://")

    def test_connectivity_check_handles_exception_safely(self):
        with patch.object(engine, "connect", side_effect=Exception("Database unreachable")):
            healthy = check_db_connectivity()
            assert healthy is False

