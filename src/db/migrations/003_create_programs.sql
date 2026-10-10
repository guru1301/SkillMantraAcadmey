-- ==================================================
-- Skill Matra Migration: 003_create_programs.sql
-- ==================================================

CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL DEFAULT 0 CHECK (duration_days >= 0),
    progress_weights JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_program_status CHECK (status IN ('active', 'inactive'))
);

-- Case-insensitive uniqueness for Program Name
CREATE UNIQUE INDEX IF NOT EXISTS idx_programs_name_lower 
ON programs (LOWER(TRIM(name)));

CREATE INDEX IF NOT EXISTS idx_programs_status ON programs (status);
