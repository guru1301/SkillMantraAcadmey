"""Add batch_feedback_unlocks and student_feedbacks tables

Revision ID: 0002_add_feedback_system
Revises: 0001_sessions_and_inquiries
Create Date: 2026-11-05 22:45:00.000000

Architectural Context:
Provisions normalized tables for the post-training student feedback system:
1. 'batch_feedback_unlocks': Tracks feedback unlock state, audit timestamp, and unlocking user.
2. 'student_feedbacks': Student rating (1-10) and written comments with unique submission constraint per batch.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0002_add_feedback_system'
down_revision: Union[str, None] = '0001_sessions_and_inquiries'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create batch_feedback_unlocks table
    op.create_table(
        'batch_feedback_unlocks',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('batch_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('batches.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='unlocked', nullable=False),
        sa.Column('unlocked_by_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('unlocked_by_role', sa.String(length=50), nullable=False),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('locked', 'unlocked', 'closed')", name='chk_feedback_unlock_status'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_batch_feedback_unlocks')),
        sa.UniqueConstraint('batch_id', name='unq_batch_feedback_unlock'),
    )
    op.create_index('idx_batch_feedback_unlocks_batch_id', 'batch_feedback_unlocks', ['batch_id'], unique=False)

    # 2. Create student_feedbacks table
    op.create_table(
        'student_feedbacks',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('batch_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('batches.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comments', sa.Text(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('rating >= 1 AND rating <= 10', name='chk_student_feedback_rating'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_student_feedbacks')),
        sa.UniqueConstraint('batch_id', 'student_id', name='unq_student_batch_feedback'),
    )
    op.create_index('idx_student_feedbacks_batch_id', 'student_feedbacks', ['batch_id'], unique=False)
    op.create_index('idx_student_feedbacks_student_id', 'student_feedbacks', ['student_id'], unique=False)


def downgrade() -> None:
    # 1. Drop student_feedbacks
    op.drop_index('idx_student_feedbacks_student_id', table_name='student_feedbacks')
    op.drop_index('idx_student_feedbacks_batch_id', table_name='student_feedbacks')
    op.drop_table('student_feedbacks')

    # 2. Drop batch_feedback_unlocks
    op.drop_index('idx_batch_feedback_unlocks_batch_id', table_name='batch_feedback_unlocks')
    op.drop_table('batch_feedback_unlocks')

