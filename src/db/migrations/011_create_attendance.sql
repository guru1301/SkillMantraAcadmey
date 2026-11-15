-- ==================================================
-- Skill Matra Migration: 011_create_attendance.sql
-- ==================================================

-- 1. Create session attendance table
CREATE TABLE IF NOT EXISTS session_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_session_student_attendance UNIQUE (session_id, student_id)
);

-- 2. Indexes for instant lookup by session and student
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON session_attendance (session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON session_attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON session_attendance (status);
