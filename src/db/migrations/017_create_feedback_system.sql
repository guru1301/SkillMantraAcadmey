-- ==================================================
-- Skill Mantra Migration: 017_create_feedback_system.sql
-- Post-Training Student Feedback & Unlock Architecture
-- ==================================================

-- 1. Batch Feedback Unlock State & Audit Metadata
CREATE TABLE IF NOT EXISTS batch_feedback_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'unlocked',
    unlocked_by_user_id UUID NOT NULL,
    unlocked_by_role VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_batch_feedback_unlock UNIQUE (batch_id),
    CONSTRAINT chk_feedback_unlock_status CHECK (status IN ('locked', 'unlocked', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_batch_feedback_unlocks_batch_id ON batch_feedback_unlocks (batch_id);

-- 2. Student Feedback Submissions
CREATE TABLE IF NOT EXISTS student_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comments TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_student_feedback_rating CHECK (rating >= 1 AND rating <= 10),
    CONSTRAINT unq_student_batch_feedback UNIQUE (batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_feedbacks_batch_id ON student_feedbacks (batch_id);
CREATE INDEX IF NOT EXISTS idx_student_feedbacks_student_id ON student_feedbacks (student_id);

