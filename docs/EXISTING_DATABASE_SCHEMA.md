# Existing Database Schema Specification
## Project: Skill Mantra Academy / Skill Thinker Platform
**Database Engine**: PostgreSQL 15+ (Neon Serverless)
**Last Updated**: Stage B Technical Review & Corrections

---

## 1. Migration History and Version Baseline

The existing database schema has evolved through 16 incremental SQL migration files located in `src/db/migrations/`:

| Migration File | Description | Core Tables / Modifiers |
|---|---|---|
| `001_create_admin_users.sql` | Super administrator accounts table with pgcrypto extension | `admin_users` |
| `002_create_colleges.sql` | Educational partner institutions table | `colleges` |
| `003_create_programs.sql` | Training programs & course curriculum catalog | `programs` |
| `004_create_batches.sql` | Training cohort batches, student enrollment, trainer assignments | `batches`, `batch_students`, `batch_trainers` |
| `005_create_training_sessions.sql` | Daily classroom training sessions | `training_sessions` |
| `006_create_resources.sql` | Learning materials and study links | `resources` |
| `007_create_students.sql` | Master student directory and college link | `students` |
| `008_create_trainers.sql` | Master faculty/trainer directory and lead trainer assignment constraint | `trainers`, modifies `batch_trainers` |
| `009_performance_indexes.sql` | Performance B-Tree indexes for joins and sorting | Indexes on `batch_trainers`, `batches`, `colleges`, `resources`, `trainers` |
| `010_create_college_users.sql` | Multi-tenant college coordinator user accounts | `college_users` |
| `011_create_attendance.sql` | Individual student session attendance evaluations | `session_attendance` |
| `012_add_student_auth.sql` | Adds credential authentication to students table | Modifies `students` (`password_hash`, `status`) |
| `013_create_assessments.sql` | Assessments, quizzes, and student submissions | `assessments`, `assessment_submissions` |
| `014_add_trainer_auth.sql` | Adds credential authentication to trainers table | Modifies `trainers` (`password_hash`) |
| `015_add_quiz_questions_and_schedule.sql` | Question pool JSONB, start/end schedules, anti-cheat & answers JSONB | Modifies `assessments`, `assessment_submissions` |
| `016_performance_indexes.sql` | Case-insensitive auth lookups & reporting indexes | Functional indexes on `LOWER(email)` and `LOWER(roll_number)` |

---

## 2. Table Specifications & Constraint Naming Reconciliations

### 2.1 Table: `admin_users` (Migration 001, 016)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `email`: `VARCHAR(255)` NOT NULL UNIQUE (Constraint: `admin_users_email_key`)
  - `password_hash`: `VARCHAR(255)` NOT NULL
  - `full_name`: `VARCHAR(255)` NOT NULL
  - `role`: `VARCHAR(50)` NOT NULL DEFAULT `'super_admin'`
  - `status`: `VARCHAR(50)` NOT NULL DEFAULT `'active'`
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `updated_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `last_login_at`: `TIMESTAMPTZ` (nullable)
- **Indexes**:
  - `idx_admin_users_email_lower` (UNIQUE on `LOWER(email)`)
  - `idx_admin_users_role_status` (`role`, `status`)
  - `idx_admin_users_lower_email` (Redundant non-unique index from 016 on `LOWER(email)`)

### 2.2 Table: `colleges` (Migration 002, 009)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `name`: `TEXT` NOT NULL
  - `city`: `TEXT` (nullable)
  - `state`: `TEXT` (nullable)
  - `contact_name`: `TEXT` (nullable)
  - `contact_email`: `TEXT` (nullable)
  - `contact_phone`: `TEXT` (nullable)
  - `logo_url`: `TEXT` (nullable)
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'active'`
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `updated_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
- **Constraints**:
  - `chk_college_status`: Explicit `CHECK (status IN ('active', 'inactive'))`
- **Indexes**:
  - `idx_colleges_name_city_lower`: UNIQUE on `(LOWER(TRIM(name)), LOWER(TRIM(COALESCE(city, ''))))`
  - `idx_colleges_status`: on `(status)`
  - `idx_colleges_city`: on `(LOWER(city))`
  - `idx_colleges_created_at`: on `(created_at DESC)` (from 009)

### 2.3 Table: `programs` (Migration 003)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `name`: `TEXT` NOT NULL
  - `description`: `TEXT` (nullable)
  - `duration_days`: `INTEGER` NOT NULL DEFAULT 0
  - `progress_weights`: `JSONB` DEFAULT `'{}'::jsonb` (**NULLABLE** — migration 003 does not specify NOT NULL)
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'active'`
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `updated_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
- **Constraints**:
  - `programs_duration_days_check`: Inline unnamed `CHECK (duration_days >= 0)`
  - `chk_program_status`: Explicit `CHECK (status IN ('active', 'inactive'))`
- **Indexes**:
  - `idx_programs_name_lower`: UNIQUE on `(LOWER(TRIM(name)))`
  - `idx_programs_status`: on `(status)`

### 2.4 Table: `batches` (Migration 004, 009)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `code`: `VARCHAR(100)` NOT NULL UNIQUE (`batches_code_key`)
  - `college_id`: `UUID` NOT NULL REFERENCES `colleges(id)` ON DELETE RESTRICT
  - `program_id`: `UUID` NOT NULL REFERENCES `programs(id)` ON DELETE RESTRICT
  - `start_date`: `DATE` NOT NULL
  - `end_date`: `DATE` NOT NULL
  - `target_strength`: `INTEGER` NOT NULL DEFAULT 0
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'planned'`
  - `created_by`: `UUID` REFERENCES `admin_users(id)` ON DELETE SET NULL
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `updated_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
- **Constraints**:
  - `chk_batch_status`: Explicit `CHECK (status IN ('planned', 'active', 'completed', 'cancelled'))`
  - `chk_batch_dates`: Explicit `CHECK (end_date >= start_date)`
  - `batches_target_strength_check`: Inline unnamed `CHECK (target_strength >= 0)`
- **Indexes**:
  - `idx_batches_college_id`: on `(college_id)`
  - `idx_batches_program_id`: on `(program_id)`
  - `idx_batches_status`: on `(status)`
  - `idx_batches_start_date`: on `(start_date DESC)`
  - `idx_batches_college_status`: on `(college_id, status)` (from 009)
  - `idx_batches_created_at`: on `(created_at DESC)` (from 009)

### 2.5 Table: `batch_students` (Migration 004, 007, 016)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `batch_id`: `UUID` NOT NULL REFERENCES `batches(id)` ON DELETE CASCADE
  - `student_id`: `UUID` NOT NULL REFERENCES `students(id)` ON DELETE CASCADE (`fk_batch_students_student`)
  - `enrolled_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'enrolled'`
- **Constraints**:
  - `unq_batch_student`: Explicit UNIQUE `(batch_id, student_id)`
- **Indexes**:
  - `idx_batch_students_batch_id`: on `(batch_id)` (from 004 and duplicate in 016)
  - `idx_batch_students_student_id`: on `(student_id)` (from 016)

### 2.6 Table: `batch_trainers` (Migration 004, 008, 009, 016)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `batch_id`: `UUID` NOT NULL REFERENCES `batches(id)` ON DELETE CASCADE
  - `trainer_id`: `UUID` NOT NULL REFERENCES `trainers(id)` ON DELETE RESTRICT (`fk_batch_trainers_trainer`)
  - `assigned_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `role`: `VARCHAR(50)` NOT NULL DEFAULT `'lead_trainer'`
  - `is_lead`: `BOOLEAN` NOT NULL DEFAULT false (added in 008)
- **Constraints & Indexes**:
  - `unq_batch_trainer`: Explicit UNIQUE `(batch_id, trainer_id)`
  - `idx_batch_trainers_one_lead_per_batch`: **Partial unique index** on `(batch_id)` WHERE (`is_lead = true`)
  - `idx_batch_trainers_batch_id`: on `(batch_id)`
  - `idx_batch_trainers_trainer_id`: on `(trainer_id)` (from 009)
  - `idx_batch_trainers_batch_trainer`: on `(batch_id, trainer_id)` (from 009, redundant with unique constraint)
  - `idx_batch_trainers_is_lead`: on `(batch_id, is_lead)` (from 009)
  - `idx_batch_trainers_batch_trainer_lead`: on `(trainer_id, is_lead)` (from 016)

### 2.7 Table: `trainers` (Migration 008, 009, 014, 016)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `full_name`: `VARCHAR(255)` NOT NULL
  - `email`: `VARCHAR(255)` (nullable)
  - `phone`: `VARCHAR(50)` (nullable)
  - `skills`: `TEXT` (nullable)
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'active'`
  - `password_hash`: `VARCHAR(255)` (nullable, added in 014)
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `updated_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
- **Constraints**:
  - `chk_trainer_status`: Explicit `CHECK (status IN ('active', 'inactive'))`
- **Indexes**:
  - `idx_trainers_email_lower`: **Partial unique index** on `(LOWER(TRIM(email)))` WHERE (`email IS NOT NULL AND TRIM(email) != ''`)
  - `idx_trainers_status`: on `(status)`
  - `idx_trainers_name_lower`: on `(LOWER(TRIM(full_name)))`
  - `idx_trainers_created_at`: on `(created_at DESC)` (from 009)
  - `idx_trainers_email_active`: on `(LOWER(TRIM(email)))` WHERE (`email IS NOT NULL AND status = 'active'`) (from 014)
  - `idx_trainers_lower_email`: on `(LOWER(TRIM(email)))` (from 016)

### 2.8 Table: `students` (Migration 007, 012, 016)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `college_id`: `UUID` REFERENCES `colleges(id)` ON DELETE CASCADE (nullable)
  - `roll_number`: `VARCHAR(100)` NOT NULL
  - `full_name`: `VARCHAR(255)` NOT NULL
  - `email`: `VARCHAR(255)` (nullable)
  - `phone`: `VARCHAR(50)` (nullable)
  - `department`: `VARCHAR(100)` (nullable)
  - `year_or_semester`: `VARCHAR(50)` (nullable)
  - `password_hash`: `VARCHAR(255)` (nullable, added in 012)
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'active'` (added in 012)
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `updated_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
- **Constraints & Indexes**:
  - `idx_students_college_roll_lower`: **Expression-based UNIQUE index** on `(college_id, LOWER(TRIM(roll_number)))`.
    *(Note: There is NO conventional table constraint `UNIQUE(college_id, roll_number)`; uniqueness is strictly enforced via this expression index).*
  - `idx_students_college_id`: on `(college_id)` (from 007, duplicate in 016)
  - `idx_students_email`: on `(LOWER(email))`
  - `idx_students_department`: on `(department)`
  - `idx_students_status`: on `(status)` (from 012)
  - `idx_students_roll_lower`: on `(LOWER(TRIM(roll_number)))` (from 012)
  - `idx_students_lower_roll`: on `(LOWER(TRIM(roll_number)))` (from 016, duplicate of above)
  - `idx_students_lower_email`: on `(LOWER(TRIM(email)))` WHERE `email IS NOT NULL` (from 016)

### 2.9 Table: `college_users` (Migration 010, 016)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `college_id`: `UUID` NOT NULL REFERENCES `colleges(id)` ON DELETE CASCADE
  - `email`: `VARCHAR(255)` NOT NULL UNIQUE (`college_users_email_key`)
  - `password_hash`: `VARCHAR(255)` NOT NULL
  - `full_name`: `VARCHAR(255)` NOT NULL
  - `role`: `VARCHAR(50)` NOT NULL DEFAULT `'college_admin'`
  - `phone`: `VARCHAR(50)` (nullable)
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'active'`
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `updated_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `last_login_at`: `TIMESTAMPTZ` (nullable)
- **Constraints**:
  - `chk_college_user_status`: Explicit `CHECK (status IN ('active', 'inactive'))`
- **Indexes**:
  - `idx_college_users_email_lower`: UNIQUE on `(LOWER(TRIM(email)))`
  - `idx_college_users_college_id`: on `(college_id)`
  - `idx_college_users_status`: on `(status)`
  - `idx_college_users_lower_email`: on `(LOWER(email))` (from 016)

### 2.10 Table: `training_sessions` (Migration 005, 016)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `batch_id`: `UUID` NOT NULL REFERENCES `batches(id)` ON DELETE CASCADE
  - `date`: `DATE` NOT NULL
  - `start_time`: `TIME` (nullable)
  - `end_time`: `TIME` (nullable)
  - `topic`: `TEXT` (nullable)
  - `title`: `TEXT` NOT NULL
  - `trainer_id`: `UUID` (**NO FOREIGN KEY** — migration 005 defines `trainer_id UUID` with no `REFERENCES trainers(id)`)
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'scheduled'`
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `updated_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
- **Constraints**:
  - `chk_session_status`: Explicit `CHECK (status IN ('scheduled', 'completed', 'cancelled'))`
- **Indexes**:
  - `idx_sessions_batch_id`: on `(batch_id)`
  - `idx_sessions_date`: on `(date)`
  - `idx_training_sessions_batch_date`: on `(batch_id, date)` (from 016)

### 2.11 Table: `session_attendance` (Migration 011, 016)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `session_id`: `UUID` NOT NULL REFERENCES `training_sessions(id)` ON DELETE CASCADE
  - `student_id`: `UUID` NOT NULL REFERENCES `students(id)` ON DELETE CASCADE
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'present'`
  - `notes`: `TEXT` (nullable)
  - `marked_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
- **Constraints**:
  - `unq_session_student_attendance`: Explicit UNIQUE `(session_id, student_id)`
  - `session_attendance_status_check`: Inline unnamed `CHECK (status IN ('present', 'absent', 'late', 'excused'))`
- **Indexes**:
  - `idx_attendance_session_id`: on `(session_id)`
  - `idx_attendance_student_id`: on `(student_id)`
  - `idx_attendance_status`: on `(status)`
  - `idx_session_attendance_student_session`: on `(student_id, session_id)` (from 016)
  - `idx_session_attendance_session_status`: on `(session_id, status)` (from 016)

### 2.12 Table: `resources` (Migration 006, 009)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `batch_id`: `UUID` NOT NULL REFERENCES `batches(id)` ON DELETE CASCADE
  - `name`: `TEXT` NOT NULL
  - `type`: `VARCHAR(50)` NOT NULL DEFAULT `'google_drive'`
  - `url`: `TEXT` NOT NULL
  - `description`: `TEXT` (nullable)
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `updated_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
- **Constraints**:
  - `chk_resource_type`: Explicit `CHECK (type IN ('google_drive', 'document', 'video', 'link'))`
- **Indexes**:
  - `idx_resources_batch_id`: on `(batch_id)` (declared in 006 and duplicate in 009)

### 2.13 Table: `assessments` (Migration 013, 015, 016)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `batch_id`: `UUID` NOT NULL REFERENCES `batches(id)` ON DELETE CASCADE
  - `title`: `VARCHAR(255)` NOT NULL
  - `type`: `VARCHAR(50)` NOT NULL DEFAULT `'quiz'`
  - `topic`: `VARCHAR(255)` (nullable)
  - `description`: `TEXT` (nullable)
  - `duration_minutes`: `INTEGER` NOT NULL DEFAULT 30
  - `total_marks`: `INTEGER` NOT NULL DEFAULT 100
  - `passing_marks`: `INTEGER` NOT NULL DEFAULT 50
  - `due_date`: `TIMESTAMPTZ` (nullable)
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'published'`
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `updated_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `trainer_id`: `UUID` REFERENCES `trainers(id)` ON DELETE SET NULL (added in 015)
  - `start_time`: `TIMESTAMPTZ` (nullable, added in 015)
  - `deadline`: `TIMESTAMPTZ` (nullable, added in 015)
  - `shuffle_questions`: `BOOLEAN` NOT NULL DEFAULT true (added in 015)
  - `anti_cheat_enabled`: `BOOLEAN` NOT NULL DEFAULT true (added in 015)
  - `questions`: `JSONB` NOT NULL DEFAULT `'[]'::jsonb` (added in 015)
- **Constraints**:
  - `assessments_type_check`: Inline unnamed `CHECK (type IN ('quiz', 'assignment', 'practical_test'))`
  - `assessments_status_check`: Inline unnamed `CHECK (status IN ('draft', 'published', 'closed'))`
- **Indexes**:
  - `idx_assessments_batch_id`: on `(batch_id)`
  - `idx_assessments_trainer_id`: on `(trainer_id)` (from 015)
  - `idx_assessments_schedule`: on `(batch_id, start_time, deadline)` (from 015)
  - `idx_assessments_batch_status`: on `(batch_id, status)` (from 016)

### 2.14 Table: `assessment_submissions` (Migration 013, 015, 016)
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `assessment_id`: `UUID` NOT NULL REFERENCES `assessments(id)` ON DELETE CASCADE
  - `student_id`: `UUID` NOT NULL REFERENCES `students(id)` ON DELETE CASCADE
  - `status`: `VARCHAR(30)` NOT NULL DEFAULT `'submitted'`
  - `score`: `INTEGER` (nullable)
  - `feedback`: `TEXT` (nullable)
  - `submitted_at`: `TIMESTAMPTZ` DEFAULT `NOW()`
  - `started_at`: `TIMESTAMPTZ` DEFAULT `NOW()` (added in 015)
  - `answers`: `JSONB` DEFAULT `'{}'::jsonb` (**NULLABLE** — migration 015 does not specify NOT NULL)
  - `violations_count`: `INTEGER` DEFAULT 0 (**NULLABLE** — migration 015 does not specify NOT NULL)
  - `shuffled_question_order`: `JSONB` (nullable, added in 015)
- **Constraints**:
  - `unq_student_assessment`: Explicit UNIQUE `(assessment_id, student_id)`
  - `assessment_submissions_status_check`: Inline unnamed `CHECK (status IN ('not_started', 'in_progress', 'submitted', 'evaluated', 'overdue'))`
- **Indexes**:
  - `idx_assessment_submissions_student`: on `(student_id)` (from 013 and duplicate in 016)
  - `idx_assessment_submissions_lookup`: on `(assessment_id, student_id)` (from 016)

---

## 3. Infrastructure Tables Added for Target Architecture

### 3.1 Table: `user_sessions`
- **Purpose**: Server-side opaque session token store supporting users partitioned across four tables (`admin_users`, `college_users`, `trainers`, `students`).
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `session_token_hash`: `VARCHAR(64)` NOT NULL
  - `user_id`: `UUID` NOT NULL
  - `user_role`: `VARCHAR(50)` NOT NULL
  - `college_id`: `UUID` (nullable, cached tenant hint)
  - `ip_address`: `VARCHAR(45)` (nullable)
  - `user_agent`: `TEXT` (nullable)
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
  - `expires_at`: `TIMESTAMPTZ` NOT NULL
  - `revoked_at`: `TIMESTAMPTZ` (nullable)
- **Indexes**:
  - `idx_user_sessions_token_hash`: UNIQUE on `(session_token_hash)` (Sole uniqueness mechanism)
  - `idx_user_sessions_user_lookup`: on `(user_id, user_role)`
  - `idx_user_sessions_expires_at`: on `(expires_at)`
- **Security Clarifications**:
  - SHA-256 token hashing provides protection against credential exposure in read-only database breaches (prevention of offline session hijacking). It does not guarantee tamper-proofing against actors with direct write privileges to the database.
  - The cached `college_id` is a routing optimization; security authorization dependencies must always verify primary entity tables (`college_users`, `students`) for sensitive operations.

### 3.2 Table: `contact_inquiries`
- **Purpose**: Persistent storage for institutional training enquiries and contact requests, replacing the previously mocked `setTimeout` client logic.
- **Columns**:
  - `id`: `UUID` PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `name`: `VARCHAR(255)` NOT NULL
  - `designation`: `VARCHAR(255)` (nullable)
  - `organization`: `VARCHAR(255)` NOT NULL
  - `email`: `VARCHAR(255)` NOT NULL
  - `phone`: `VARCHAR(50)` NOT NULL
  - `requirement_type`: `VARCHAR(100)` NOT NULL
  - `area_of_interest`: `VARCHAR(100)` (nullable)
  - `message`: `TEXT` (nullable)
  - `status`: `VARCHAR(20)` NOT NULL DEFAULT `'new'`
  - `created_at`: `TIMESTAMPTZ` NOT NULL DEFAULT `NOW()`
- **Constraints**:
  - `chk_contact_inquiry_status`: CHECK (`status IN ('new', 'contacted', 'resolved', 'archived')`)
- **Indexes**:
  - `idx_contact_inquiries_status`: on `(status)`
  - `idx_contact_inquiries_created_at`: on `(created_at DESC)`
