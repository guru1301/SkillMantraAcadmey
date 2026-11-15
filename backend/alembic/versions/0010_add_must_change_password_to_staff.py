"""Add must_change_password to admin_users, college_users, and trainers

Revision ID: 0010_add_must_change_password_to_staff
Revises: 0009_add_session_attendance_audit_columns
Create Date: 2026-11-13 15:45:00.000000

Architectural Context:
1. Adds must_change_password BOOLEAN NOT NULL DEFAULT false to:
   - admin_users
   - college_users
   - trainers
2. Complements students.must_change_password, enabling platform-wide
   credential reset and first-login password rotation enforcement.
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '0010_add_must_change_password_to_staff'
down_revision: Union[str, None] = '0009_add_session_attendance_audit_columns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE admin_users
          ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

        ALTER TABLE college_users
          ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

        ALTER TABLE trainers
          ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE trainers DROP COLUMN IF EXISTS must_change_password;
        ALTER TABLE college_users DROP COLUMN IF EXISTS must_change_password;
        ALTER TABLE admin_users DROP COLUMN IF EXISTS must_change_password;
    """)

