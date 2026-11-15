import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.core.config import settings
from backend.app.db.models import Base

# Access Alembic Config safely from context proxy
config = getattr(context, "config", None)

# Interpret the config file for Python logging.
if config is not None and config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the SQLAlchemy target metadata for autogenerate support
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    cfg = getattr(context, "config", None) or config
    url = (cfg.get_main_option("sqlalchemy.url") if cfg else None) or settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Connection Targeting Safety Priority:
    1. Check config.attributes["connection"]. If an explicit connection was passed
       (e.g., from bootstrap_dev_database or test fixtures), USE IT DIRECTLY.
       Never create a new connection or inspect settings.DATABASE_URL.
    2. Check config.get_main_option("sqlalchemy.url"). If explicitly supplied, use it.
    3. Fall back to settings.DATABASE_URL only if neither an explicit connection nor
       a custom URL option was provided.

    Transaction & Error Propagation:
    All migrations run inside an explicit transaction context (context.begin_transaction).
    Genuine database, constraint, or preflight errors are NEVER caught or suppressed;
    they cause immediate transaction rollback and propagate to the caller.
    """
    cfg = getattr(context, "config", None) or config

    # Priority 1: Explicit Connection Object passed in attributes
    explicit_connection = cfg.attributes.get("connection", None) if cfg else None
    if explicit_connection is not None:
        context.configure(
            connection=explicit_connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()
        return

    # Priority 2 & 3: Resolve URL from config, falling back to settings
    url = cfg.get_main_option("sqlalchemy.url") if cfg else None
    if not url:
        url = settings.DATABASE_URL

    configuration = (cfg.get_section(cfg.config_ini_section) if cfg else {}) or {}
    configuration["sqlalchemy.url"] = url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


def is_active_alembic_runner() -> bool:
    """
    Checks if env.py is being executed by Alembic's migration engine (CLI or command API).
    When imported as a module (e.g. in test suites), context raises NameError because
    the EnvironmentContext proxy has not been established.
    """
    try:
        context.is_offline_mode()
        return True
    except NameError:
        return False


# Execute migrations when run by Alembic engine.
# Genuine database or migration errors are NEVER suppressed and propagate immediately.
if is_active_alembic_runner():
    if context.is_offline_mode():
        run_migrations_offline()
    else:
        run_migrations_online()
