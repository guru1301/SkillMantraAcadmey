"""Add pending_review status to assessment_submissions status check constraint

Revision ID: 0008_add_pending_review_submission_status
Revises: 0007_add_shared_rate_limits_and_audit_immutability
Create Date: 2026-11-10 14:20:00.000000

Architectural Context:
1. Extends assessment_submissions_status_check to permit 'pending_review' for
   attempts automatically flagged by proctoring (>= 3 integrity violations).
2. Does not mutate existing submission rows.
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '0008_add_pending_review_submission_status'
down_revision: Union[str, None] = '0007_add_shared_rate_limits_and_audit_immutability'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE assessment_submissions
        DROP CONSTRAINT IF EXISTS assessment_submissions_status_check;

        ALTER TABLE assessment_submissions
        ADD CONSTRAINT assessment_submissions_status_check
        CHECK (status IN ('not_started', 'in_progress', 'submitted', 'evaluated', 'overdue', 'pending_review'));
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE assessment_submissions
        DROP CONSTRAINT IF EXISTS assessment_submissions_status_check;

        ALTER TABLE assessment_submissions
        ADD CONSTRAINT assessment_submissions_status_check
        CHECK (status IN ('not_started', 'in_progress', 'submitted', 'evaluated', 'overdue'));
    """)

