-- ==================================================
-- Skill Mantra Migration: 013_create_assessments.sql
-- Adds assessments and student submissions tables
-- for student tests, quizzes, and assignments.
-- ==================================================

CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'quiz' CHECK (type IN ('quiz', 'assignment', 'practical_test')),
    topic VARCHAR(255),
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    total_marks INTEGER NOT NULL DEFAULT 100,
    passing_marks INTEGER NOT NULL DEFAULT 50,
    due_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('not_started', 'in_progress', 'submitted', 'evaluated', 'overdue')),
    score INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unq_student_assessment UNIQUE (assessment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assessments_batch_id ON assessments (batch_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_student ON assessment_submissions (student_id);
