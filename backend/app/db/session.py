from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from backend.app.core.config import settings
from backend.app.core.logging import logger

# SQLAlchemy 2.0 Engine using Psycopg 3
# pool_pre_ping=True validates connection health before handing it to a request handler (critical for serverless).
# prepare_threshold=None disables Psycopg 3 server-side prepared statements, ensuring 100% stability
# with Neon PgBouncer (-pooler) transaction pooling under high concurrent load.
_connect_args = {}
if settings.DATABASE_URL.startswith("postgresql"):
    _connect_args = {
        "prepare_threshold": None,
        "connect_timeout": 15,
    }

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    echo=settings.DB_ECHO,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a scoped database session.
    Automatically handles rollback on error and closes the session upon completion.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def check_db_connectivity() -> bool:
    """
    Performs a lightweight connectivity check against the database using 'SELECT 1'.
    Returns True if healthy, False if disconnected or error.
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return result.scalar() == 1
    except Exception as e:
        logger.error(f"Database connectivity check failed: {e}")
        return False

