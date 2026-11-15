-- Migration 016: High-Performance Database Indexes for Authentication and Portal Queries
-- Drastically speeds up logins, dashboard aggregations, and student assessment queries.

-- 1. Fast functional indexes for case-insensitive authentication lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_lower_email ON admin_users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_college_users_lower_email ON college_users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_trainers_lower_email ON trainers (LOWER(TRIM(email)));
CREATE INDEX IF NOT EXISTS idx_students_lower_roll ON students (LOWER(TRIM(roll_number)));
CREATE INDEX IF NOT EXISTS idx_students_lower_email ON students (LOWER(TRIM(email))) WHERE email IS NOT NULL;

-- 2. Foreign key and cohort join indexes
CREATE INDEX IF NOT EXISTS idx_students_college_id ON students (college_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_student_id ON batch_students (student_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_batch_id ON batch_students (batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_trainers_batch_trainer_lead ON batch_trainers (trainer_id, is_lead);

-- 3. Training sessions and attendance fast lookups
CREATE INDEX IF NOT EXISTS idx_training_sessions_batch_date ON training_sessions (batch_id, date);
CREATE INDEX IF NOT EXISTS idx_session_attendance_student_session ON session_attendance (student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_session_status ON session_attendance (session_id, status);

-- 4. Assessments and submissions query acceleration
CREATE INDEX IF NOT EXISTS idx_assessments_batch_status ON assessments (batch_id, status);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_lookup ON assessment_submissions (assessment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_student ON assessment_submissions (student_id);
