-- ==================================================
-- Skill Matra Migration: 005_create_training_sessions.sql
-- ==================================================

CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    topic TEXT,
    title TEXT NOT NULL,
    trainer_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_session_status CHECK (status IN ('scheduled', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_batch_id ON training_sessions (batch_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON training_sessions (date);
