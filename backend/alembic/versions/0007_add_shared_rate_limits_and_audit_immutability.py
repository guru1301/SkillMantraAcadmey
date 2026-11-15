"""Add shared rate limits table and audit log database-level immutability triggers

Revision ID: 0007_add_shared_rate_limits_and_audit_immutability
Revises: 0006_add_student_activation_and_audit_logging
Create Date: 2026-11-07 14:00:00.000000

Architectural Context:
1. Provisions shared_rate_limits table for multi-worker distributed rate limiting across FastAPI instances.
2. Creates PostgreSQL database trigger enforcing strict immutability on student_audit_logs:
   - Prohibits all DELETE operations on audit logs.
   - Prohibits UPDATE on audit details, actions, and actors.
   - Permits foreign-key ON DELETE SET NULL on student_id when eligible student records are removed.
3. Completely non-destructive: uses IF NOT EXISTS and idempotency guards.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0007_add_shared_rate_limits_and_audit_immutability'
down_revision: Union[str, None] = '0006_add_student_activation_and_audit_logging'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create shared_rate_limits table for distributed FastAPI workers
    op.execute("""
        CREATE TABLE IF NOT EXISTS shared_rate_limits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            scope VARCHAR(50) NOT NULL,
            key VARCHAR(255) NOT NULL,
            attempt_count INT NOT NULL DEFAULT 1,
            window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_shared_rate_limits_scope_key UNIQUE (scope, key)
        );
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_shared_rate_limits_scope_key ON shared_rate_limits(scope, key);
        CREATE INDEX IF NOT EXISTS idx_shared_rate_limits_window ON shared_rate_limits(window_start);
    """)

    # 2. Create PostgreSQL database trigger to enforce strict audit log immutability
    op.execute("""
        CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
        RETURNS TRIGGER AS $$
        BEGIN
            IF TG_OP = 'DELETE' THEN
                RAISE EXCEPTION 'Audit logs are strictly immutable: DELETE operations are prohibited.';
            ELSIF TG_OP = 'UPDATE' THEN
                -- Permit foreign-key ON DELETE SET NULL on student_id, but prohibit modifying any other column
                IF (OLD.student_roll = NEW.student_roll AND
                    OLD.action = NEW.action AND
                    OLD.actor_id IS NOT DISTINCT FROM NEW.actor_id AND
                    OLD.actor_role = NEW.actor_role AND
                    OLD.details IS NOT DISTINCT FROM NEW.details AND
                    OLD.created_at = NEW.created_at AND
                    NEW.student_id IS NULL) THEN
                    RETURN NEW;
                ELSE
                    RAISE EXCEPTION 'Audit logs are strictly immutable: UPDATE operations are prohibited.';
                END IF;
            END IF;
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        DROP TRIGGER IF EXISTS trg_immutable_student_audit_logs ON student_audit_logs;
        CREATE TRIGGER trg_immutable_student_audit_logs
        BEFORE UPDATE OR DELETE ON student_audit_logs
        FOR EACH ROW
        EXECUTE FUNCTION prevent_audit_log_modification();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_immutable_student_audit_logs ON student_audit_logs;")
    op.execute("DROP FUNCTION IF EXISTS prevent_audit_log_modification();")
    op.execute("DROP TABLE IF EXISTS shared_rate_limits CASCADE;")

