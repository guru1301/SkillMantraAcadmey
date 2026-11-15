"""Add certificates table and student password lifecycle flags

Revision ID: 0005_add_certificates_and_security_improvements
Revises: 0004_add_autosave_concurrency_and_event_idempotency
Create Date: 2026-11-07 10:45:00.000000

Architectural Context:
1. Provisions official certificates registry table with cryptographic verification codes.
2. Adds must_change_password state to students for predictable password elimination.
3. Enforces safe foreign key relations and indexes.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0005_add_certificates_and_security_improvements'
down_revision: Union[str, None] = '0004_add_autosave_concurrency_and_event_idempotency'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create certificates registry table
    op.execute("""
        CREATE TABLE IF NOT EXISTS certificates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            certificate_number VARCHAR(64) UNIQUE NOT NULL,
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
            program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
            college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
            student_name VARCHAR(255) NOT NULL,
            student_roll VARCHAR(100) NOT NULL,
            college_name VARCHAR(255) NOT NULL,
            program_name VARCHAR(255) NOT NULL,
            attendance_rate FLOAT NOT NULL DEFAULT 0.0,
            verification_code VARCHAR(64) UNIQUE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT unq_certificate_student_batch UNIQUE (student_id, batch_id)
        );
        CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
        CREATE INDEX IF NOT EXISTS idx_certificates_batch_id ON certificates(batch_id);
        CREATE INDEX IF NOT EXISTS idx_certificates_college_id ON certificates(college_id);
        CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code);
    """)

    # 2. Add must_change_password to students
    op.execute("""
        ALTER TABLE students ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS certificates CASCADE;
        ALTER TABLE students DROP COLUMN IF EXISTS must_change_password;
    """)

