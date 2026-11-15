-- ==================================================
-- Skill Mantra Migration: 015_add_quiz_questions_and_schedule.sql
-- Adds questions JSONB, start_time, deadline, shuffle,
-- anti-cheat flags to assessments, and student submission answers.
-- ==================================================

-- 1. Enhance assessments table
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS anti_cheat_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Enhance assessment_submissions table
ALTER TABLE assessment_submissions
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS violations_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shuffled_question_order JSONB;

-- 3. Create indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_assessments_trainer_id ON assessments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_assessments_schedule ON assessments(batch_id, start_time, deadline);
