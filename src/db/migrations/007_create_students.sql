-- ==================================================
-- Skill Matra Migration: 007_create_students.sql
-- ==================================================

-- 1. Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    roll_number VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(100),
    year_or_semester VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Case-insensitive unique constraint on roll number per college
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_college_roll_lower
ON students (college_id, LOWER(TRIM(roll_number)));

-- 3. Query indexes
CREATE INDEX IF NOT EXISTS idx_students_college_id ON students (college_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_students_department ON students (department);

-- 4. Foreign key constraint on batch_students to students
ALTER TABLE batch_students 
DROP CONSTRAINT IF EXISTS fk_batch_students_student;

ALTER TABLE batch_students
ADD CONSTRAINT fk_batch_students_student
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
