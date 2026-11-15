"""Add marked_by_id, marked_by_role, and updated_at audit columns to session_attendance

Revision ID: 0009_add_session_attendance_audit_columns
Revises: 0008_add_pending_review_submission_status
Create Date: 2026-11-10 19:45:00.000000

Architectural Context:
1. Adds marked_by_id (UUID, nullable), marked_by_role (VARCHAR(50), nullable),
   and updated_at (TIMESTAMPTZ NOT NULL DEFAULT NOW()) to session_attendance.
2. Indexes marked_by_id for attendance audit lookups.
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '0009_add_session_attendance_audit_columns'
down_revision: Union[str, None] = '0008_add_pending_review_submission_status'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE session_attendance
          ADD COLUMN IF NOT EXISTS marked_by_id UUID,
          ADD COLUMN IF NOT EXISTS marked_by_role VARCHAR(50),
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

        CREATE INDEX IF NOT EXISTS idx_session_attendance_marked_by_id
          ON session_attendance (marked_by_id);
    """)


def downgrade() -> None:
    op.execute("""
        DROP INDEX IF EXISTS idx_session_attendance_marked_by_id;

        ALTER TABLE session_attendance
          DROP COLUMN IF EXISTS updated_at,
          DROP COLUMN IF EXISTS marked_by_role,
          DROP COLUMN IF EXISTS marked_by_id;
    """)

