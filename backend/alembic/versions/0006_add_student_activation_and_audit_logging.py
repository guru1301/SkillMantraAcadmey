"""Add student activation, demographic fields, and account audit logging

Revision ID: 0006_add_student_activation_and_audit_logging
Revises: 0005_add_certificates_and_security_improvements
Create Date: 2026-11-07 13:00:00.000000

Architectural Context:
1. Adds dob, gender, activation_token_hash, and lifecycle timestamps to students.
2. Provisions student_audit_logs table to audit account creation, activation, deactivation, and bulk actions.
3. Completely non-destructive: uses IF NOT EXISTS and NULLABLE columns.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0006_add_student_activation_and_audit_logging'
down_revision: Union[str, None] = '0005_add_certificates_and_security_improvements'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add demographic and activation lifecycle columns to students
    op.execute("""
        ALTER TABLE students
        ADD COLUMN IF NOT EXISTS dob VARCHAR(20),
        ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
        ADD COLUMN IF NOT EXISTS activation_token_hash VARCHAR(255),
        ADD COLUMN IF NOT EXISTS activation_token_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    """)

    # 2. Create student_audit_logs table
    op.execute("""
        CREATE TABLE IF NOT EXISTS student_audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID REFERENCES students(id) ON DELETE SET NULL,
            student_roll VARCHAR(100) NOT NULL,
            student_name VARCHAR(255),
            college_id UUID,
            action VARCHAR(50) NOT NULL,
            actor_id UUID,
            actor_role VARCHAR(50) NOT NULL DEFAULT 'system',
            actor_email VARCHAR(255),
            operation_id VARCHAR(100),
            details TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    # 3. Create performance indexes for audit log queries
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_student_audit_logs_student_id ON student_audit_logs(student_id);
        CREATE INDEX IF NOT EXISTS idx_student_audit_logs_student_roll ON student_audit_logs(student_roll);
        CREATE INDEX IF NOT EXISTS idx_student_audit_logs_action ON student_audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_student_audit_logs_college_id ON student_audit_logs(college_id);
        CREATE INDEX IF NOT EXISTS idx_student_audit_logs_created_at ON student_audit_logs(created_at);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS student_audit_logs CASCADE;")
    op.execute("""
        ALTER TABLE students
        DROP COLUMN IF EXISTS dob,
        DROP COLUMN IF EXISTS gender,
        DROP COLUMN IF EXISTS activation_token_hash,
        DROP COLUMN IF EXISTS activation_token_expires_at,
        DROP COLUMN IF EXISTS activated_at,
        DROP COLUMN IF EXISTS archived_at;
    """)

