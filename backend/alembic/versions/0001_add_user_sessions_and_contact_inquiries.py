"""Add user_sessions and contact_inquiries tables

Revision ID: 0001_sessions_and_inquiries
Revises: 
Create Date: 2026-11-02 21:50:00.000000

Architectural Context:
The target PostgreSQL database has already applied legacy migrations 001 through 016,
containing all 14 institutional entities (colleges, programs, batches, students, etc.).
This revision provisions the two new architecture-level tables required by the FastAPI backend:
1. 'user_sessions': Stateful server-side session management supporting polymorphic multi-role users.
2. 'contact_inquiries': Persistent lead capture replacing mock client-side setTimeout in frontend.

Baseline Safety Guard:
Includes an active preflight check that validates table presence, critical columns,
and constraint integrity before applying changes.
An empty or uninitialized database will fail-closed rather than silently reaching head with an incomplete schema.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from backend.app.db.schema_validator import assert_full_baseline_integrity, REQUIRED_LEGACY_TABLES

# revision identifiers, used by Alembic.
revision: str = '0001_sessions_and_inquiries'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def assert_legacy_baseline_exists() -> None:
    """
    Preflight check: Inspects the connected database to verify that all 14
    legacy tables from SQL migrations 001 through 016 and their critical columns
    are present.
    In offline SQL generation mode (alembic upgrade --sql), inspection is skipped.
    """
    context = op.get_context()
    if context.opts.get("as_sql"):
        return

    bind = op.get_bind()
    if bind is None or bind.__class__.__name__ == "MockConnection":
        return

    inspector = sa.inspect(bind)
    assert_full_baseline_integrity(inspector)


def upgrade() -> None:
    # 0. Execute Baseline Safety Preflight Check
    assert_legacy_baseline_exists()

    # 1. Create user_sessions table
    op.create_table(
        'user_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('session_token_hash', sa.String(length=64), nullable=False, comment='SHA-256 hash of the cryptographically random 32-byte session secret'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, comment='Foreign identity matching id in admin_users, college_users, trainers, or students'),
        sa.Column('user_role', sa.String(length=50), nullable=False, comment='Role type: super_admin | college_admin | trainer | student'),
        sa.Column('college_id', postgresql.UUID(as_uuid=True), nullable=True, comment='Cached tenant college_id for routing optimization; verified against primary tables during sensitive operations'),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_user_sessions')),
    )
    op.create_index('idx_user_sessions_token_hash', 'user_sessions', ['session_token_hash'], unique=True)
    op.create_index('idx_user_sessions_user_lookup', 'user_sessions', ['user_id', 'user_role'], unique=False)
    op.create_index('idx_user_sessions_expires_at', 'user_sessions', ['expires_at'], unique=False)

    # 2. Create contact_inquiries table
    op.create_table(
        'contact_inquiries',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('designation', sa.String(length=255), nullable=True),
        sa.Column('organization', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('requirement_type', sa.String(length=100), nullable=False),
        sa.Column('area_of_interest', sa.String(length=100), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='new', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('new', 'contacted', 'resolved', 'archived')", name='chk_contact_inquiry_status'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_contact_inquiries')),
    )
    op.create_index('idx_contact_inquiries_status', 'contact_inquiries', ['status'], unique=False)
    op.create_index('idx_contact_inquiries_created_at', 'contact_inquiries', [sa.text('created_at DESC')], unique=False)


def downgrade() -> None:
    # 1. Drop contact_inquiries
    op.drop_index('idx_contact_inquiries_created_at', table_name='contact_inquiries')
    op.drop_index('idx_contact_inquiries_status', table_name='contact_inquiries')
    op.drop_table('contact_inquiries')

    # 2. Drop user_sessions
    op.drop_index('idx_user_sessions_expires_at', table_name='user_sessions')
    op.drop_index('idx_user_sessions_user_lookup', table_name='user_sessions')
    op.drop_index('idx_user_sessions_token_hash', table_name='user_sessions')
    op.drop_table('user_sessions')
