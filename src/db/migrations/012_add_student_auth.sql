-- ==================================================
-- Skill Mantra Migration: 012_add_student_auth.sql
-- Adds password hashing and active status to students
-- for dedicated student portal authentication.
-- ==================================================

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_students_status ON students (status);
CREATE INDEX IF NOT EXISTS idx_students_roll_lower ON students (LOWER(TRIM(roll_number)));
