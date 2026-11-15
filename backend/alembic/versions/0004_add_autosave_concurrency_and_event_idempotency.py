"""Add optimistic concurrency versioning to assessment_submissions and idempotency_key to exam_proctoring_events

Revision ID: 0004_add_autosave_concurrency_and_event_idempotency
Revises: 0003_add_exam_proctoring_system
Create Date: 2026-11-06 14:45:00.000000

Architectural Context:
1. Implements optimistic locking on assessment_submissions to prevent out-of-order
   network requests from clobbering newer answers.
2. Enforces idempotent delivery on exam_proctoring_events via partial unique index.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0004_add_autosave_concurrency_and_event_idempotency'
down_revision: Union[str, None] = '0003_add_exam_proctoring_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add version column to assessment_submissions
    op.add_column(
        'assessment_submissions',
        sa.Column('version', sa.Integer(), server_default='1', nullable=False),
    )

    # 2. Add idempotency_key to exam_proctoring_events
    op.add_column(
        'exam_proctoring_events',
        sa.Column('idempotency_key', sa.String(length=128), nullable=True),
    )

    # 3. Create unique index for proctoring event idempotency
    op.create_index(
        'idx_exam_events_idempotency',
        'exam_proctoring_events',
        ['assessment_id', 'student_id', 'idempotency_key'],
        unique=True,
        postgresql_where=sa.text('idempotency_key IS NOT NULL'),
    )

    # 4. Create sequence index for ordering per attempt
    op.create_index(
        'idx_exam_events_seq',
        'exam_proctoring_events',
        ['assessment_id', 'student_id', 'sequence_number'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index('idx_exam_events_seq', table_name='exam_proctoring_events')
    op.drop_index('idx_exam_events_idempotency', table_name='exam_proctoring_events')
    op.drop_column('exam_proctoring_events', 'idempotency_key')
    op.drop_column('assessment_submissions', 'version')

