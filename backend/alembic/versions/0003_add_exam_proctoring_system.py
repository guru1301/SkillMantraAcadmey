"""Add exam_proctoring_events table for secure online examinations

Revision ID: 0003_add_exam_proctoring_system
Revises: 0002_add_feedback_system
Create Date: 2026-11-05 23:50:00.000000

Architectural Context:
Provisions table for tracking examination integrity, fullscreen compliance,
and network recovery logs.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0003_add_exam_proctoring_system'
down_revision: Union[str, None] = '0002_add_feedback_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'exam_proctoring_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assessments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('sequence_number', sa.Integer(), server_default='1', nullable=False),
        sa.Column('duration_seconds', sa.Numeric(precision=10, scale=2), server_default='0.0', nullable=False),
        sa.Column('event_metadata', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column('acknowledged', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "event_type IN ('TAB_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'PAGE_HIDDEN', 'CONNECTION_LOST', 'CONNECTION_RESTORED', 'EXAM_RESUMED')",
            name='chk_proctoring_event_type',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_exam_proctoring_events')),
    )
    op.create_index('idx_exam_events_assessment_student', 'exam_proctoring_events', ['assessment_id', 'student_id'], unique=False)
    op.create_index('idx_exam_events_type', 'exam_proctoring_events', ['event_type'], unique=False)
    op.create_index('idx_exam_events_created', 'exam_proctoring_events', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_exam_events_created', table_name='exam_proctoring_events')
    op.drop_index('idx_exam_events_type', table_name='exam_proctoring_events')
    op.drop_index('idx_exam_events_assessment_student', table_name='exam_proctoring_events')
    op.drop_table('exam_proctoring_events')

