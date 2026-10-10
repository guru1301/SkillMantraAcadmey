-- ==================================================
-- Skill Matra Migration: 008_create_trainers.sql
-- ==================================================

-- 1. Create trainers master table
CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    skills TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trainer_status CHECK (status IN ('active', 'inactive'))
);

-- 2. Case-insensitive unique index on email (when provided and not blank)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trainers_email_lower
ON trainers (LOWER(TRIM(email)))
WHERE (email IS NOT NULL AND TRIM(email) != '');

-- 3. Query indexes for search and filter performance
CREATE INDEX IF NOT EXISTS idx_trainers_status ON trainers (status);
CREATE INDEX IF NOT EXISTS idx_trainers_name_lower ON trainers (LOWER(TRIM(full_name)));

-- 4. Alter batch_trainers table: add is_lead column
ALTER TABLE batch_trainers 
ADD COLUMN IF NOT EXISTS is_lead BOOLEAN NOT NULL DEFAULT false;

-- 5. Foreign key constraint to trainers master table (RESTRICT on delete to preserve historical records)
ALTER TABLE batch_trainers
DROP CONSTRAINT IF EXISTS fk_batch_trainers_trainer;

ALTER TABLE batch_trainers
ADD CONSTRAINT fk_batch_trainers_trainer
FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE RESTRICT;

-- 6. Enforce at most ONE lead trainer per batch at the database constraint level
CREATE UNIQUE INDEX IF NOT EXISTS idx_batch_trainers_one_lead_per_batch
ON batch_trainers (batch_id)
WHERE (is_lead = true);
