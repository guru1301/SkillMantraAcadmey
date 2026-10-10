-- ==================================================
-- Skill Matra Migration: 004_create_batches.sql
-- ==================================================

CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_strength INTEGER NOT NULL DEFAULT 0 CHECK (target_strength >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'planned',
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_batch_status CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    CONSTRAINT chk_batch_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_batches_college_id ON batches (college_id);
CREATE INDEX IF NOT EXISTS idx_batches_program_id ON batches (program_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches (status);
CREATE INDEX IF NOT EXISTS idx_batches_start_date ON batches (start_date);

-- Normalized enrollment table for actual student counts
CREATE TABLE IF NOT EXISTS batch_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'enrolled',
    CONSTRAINT unq_batch_student UNIQUE (batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_students_batch_id ON batch_students (batch_id);

-- Normalized trainer assignments table for actual assigned trainer counts
CREATE TABLE IF NOT EXISTS batch_trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    role VARCHAR(50) NOT NULL DEFAULT 'lead_trainer',
    CONSTRAINT unq_batch_trainer UNIQUE (batch_id, trainer_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_trainers_batch_id ON batch_trainers (batch_id);
