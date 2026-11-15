from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData

# Explicit naming conventions for constraints matching the existing Neon database conventions
POSTGRES_NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

class Base(DeclarativeBase):
    """
    SQLAlchemy 2.0 Base class with custom metadata.
    All application ORM models inherit from this Base.
    """
    metadata = MetaData(naming_convention=POSTGRES_NAMING_CONVENTION)
