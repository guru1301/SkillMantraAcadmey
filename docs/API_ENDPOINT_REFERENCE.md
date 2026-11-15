# College Training Management SaaS — Complete API Endpoint Reference

## 1. Overview & Architecture

All REST API endpoints are hosted under `/api/v1` and served by **FastAPI**. Next.js Server Components and Client Components invoke these endpoints through Server Actions (`src/app/actions/*`) or the centralized API Client (`src/lib/api.ts`).

### Authentication & Tenant Scoping
- **Session Header**: Handled via `Authorization: Bearer <session_token>` or HttpOnly cookie.
- **Tenant Context**: College Admin calls are strictly validated against `user_sessions.college_id`.
- **Distributed Rate Limiting**: Activation and login endpoints enforce PostgreSQL-backed rate limits via `shared_rate_limits`.

---

## 2. API Router Catalog (14 FastAPI Routers + Next.js Route Handler)

### 2.1 Authentication & Session Management (`/api/v1/auth`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | No | **Admin / Trainer Login**: Authenticates via `email` and `password`. Returns session token, role, user details, and expires_at. |
| `POST` | `/api/v1/auth/student-login` | Public | No | **Student Login**: Authenticates via `roll_number`, `dob` (`YYYY-MM-DD`), and optional `password`. Returns student session token. |
| `POST` | `/api/v1/auth/student-activate` | Public | No | **Student Account Activation**: Activates account using `roll_number`, `dob`, and new password, OR `activation_token`. Enforces 128-bit entropy and rate-limiting. |
| `POST` | `/api/v1/auth/logout` | Authenticated | No | **Session Invalidation**: Revokes the active session token in `user_sessions`. |
| `GET` | `/api/v1/auth/me` | Authenticated | Self | **Profile Lookup**: Returns the currently authenticated user's profile and active permissions. |
| `GET` | `/api/v1/auth/session/validate` | Authenticated | Self | **Session Heartbeat**: Validates current session token freshness and expiration timestamp. |
| `POST` | `/api/v1/auth/change-password` | Authenticated | Self | **Self Password Change**: Validates existing password and hashes new password using Argon2id/Bcrypt. |

---

### 2.2 Super Admin Platform Management (`/api/v1/admin`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | `super_admin` | Global | **Dashboard Aggregates**: Returns active colleges, batches, trainers, students, and session metrics. |
| `GET` | `/api/v1/admin/stats/overview` | `super_admin` | Global | **Platform Overview Stats**: Period-over-period growth metrics, attendance averages, and test pass rates. |
| `GET` | `/api/v1/admin/users` | `super_admin` | Global | **List Admin Users**: Lists platform administrators and institutional college admins with role and status filters. |
| `POST` | `/api/v1/admin/users` | `super_admin` | Global | **Create Admin User**: Provisions a new Super Admin or College Admin with initial password hash. |
| `PATCH` | `/api/v1/admin/users/{user_id}/status` | `super_admin` | Global | **Toggle User Status**: Activates or deactivates administrator account. |
| `POST` | `/api/v1/admin/users/{user_id}/reset-password` | `super_admin` | Global | **Reset Admin Password**: Securely overrides an administrator password. |

---

### 2.3 College Management (`/api/v1/colleges`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/colleges/` | `super_admin` | Global | **List Colleges**: Returns all partner institutions with city, contact details, and batch count. |
| `POST` | `/api/v1/colleges/` | `super_admin` | Global | **Create College**: Registers a new college with institution code, address, and primary contact. |
| `GET` | `/api/v1/colleges/{id}` | Admin / College Admin | Yes (`college_id`) | **College Details**: Returns complete institution profile, active batches, and registered students. |
| `PUT` | `/api/v1/colleges/{id}` | Admin / College Admin | Yes (`college_id`) | **Update College**: Updates contact details, city, state, or branding logo. |
| `DELETE` | `/api/v1/colleges/{id}` | `super_admin` | Global | **Delete College**: Blocked via FK `RESTRICT` if associated batches or students exist. |
| `GET` | `/api/v1/colleges/{id}/batches` | Admin / College Admin | Yes (`college_id`) | **College Batches**: Retrieves all training batches hosted by this college. |
| `GET` | `/api/v1/colleges/{id}/trainers` | Admin / College Admin | Yes (`college_id`) | **College Trainers**: Retrieves instructors assigned to batches at this college. |
| `GET` | `/api/v1/colleges/{id}/students` | Admin / College Admin | Yes (`college_id`) | **College Students**: Retrieves enrolled students with departmental breakdowns. |

---

### 2.4 Program & Curriculum Management (`/api/v1/programs`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/programs/` | All Roles | No | **List Programs**: Returns active training curriculums (Python, Cloud, Web Dev, Soft Skills). |
| `POST` | `/api/v1/programs/` | `super_admin` | Global | **Create Program**: Creates curriculum with name, duration_days, and module progress weights. |
| `GET` | `/api/v1/programs/{id}` | All Roles | No | **Program Details**: Returns curriculum structure, syllabus description, and active batches. |
| `PUT` | `/api/v1/programs/{id}` | `super_admin` | Global | **Update Program**: Modifies curriculum details or duration days. |
| `DELETE` | `/api/v1/programs/{id}` | `super_admin` | Global | **Delete Program**: Blocked via FK `RESTRICT` if referenced by existing batches. |

---

### 2.5 Batch Operations (`/api/v1/batches`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/batches/` | Admin / College Admin | Yes | **List Batches**: Returns cohorts filtered by college_id, program_id, or status (`planned`, `active`, `completed`). |
| `POST` | `/api/v1/batches/` | Admin / College Admin | Yes | **Create Batch**: Schedules a cohort with code, dates, target_strength, and college binding. |
| `GET` | `/api/v1/batches/{id}` | Authenticated | Yes | **Batch Details**: Returns complete batch metadata, assigned trainers, session count, and student roster. |
| `PUT` | `/api/v1/batches/{id}` | Admin / College Admin | Yes | **Update Batch**: Modifies start/end dates, target strength, or code. |
| `PATCH` | `/api/v1/batches/{id}/status` | Admin / College Admin | Yes | **Lifecycle Status**: Transitions batch state (`planned` -> `active` -> `completed` -> `cancelled`). |
| `GET` | `/api/v1/batches/{id}/stats` | Admin / College Admin / Trainer | Yes | **Batch Progress**: Returns completion percentage, attendance averages, and test averages. |
| `POST` | `/api/v1/batches/{id}/students` | Admin / College Admin | Yes | **Batch Enrollment**: Enrolls a list of student IDs into `batch_students`. |
| `POST` | `/api/v1/batches/{id}/trainers` | Admin / College Admin | Yes | **Trainer Assignment**: Assigns instructors with lead trainer designation. |

---

### 2.6 Trainer Management & Faculty Portals (`/api/v1/trainers`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/trainers/` | Admin / College Admin | No | **List Trainers**: Returns master instructor directory with expertise tags and active status. |
| `POST` | `/api/v1/trainers/` | `super_admin` | Global | **Create Trainer**: Provisions a new trainer with name, email, phone, and skills. |
| `GET` | `/api/v1/trainers/{id}` | Authenticated | No | **Trainer Details**: Returns instructor bio, assigned batches, and upcoming session timetable. |
| `PUT` | `/api/v1/trainers/{id}` | `super_admin` / Trainer | Self | **Update Trainer**: Updates profile, skills, and contact information. |
| `POST` | `/api/v1/trainers/{id}/assign` | Admin / College Admin | Yes | **Assign to Batch**: Binds trainer to batch in `batch_trainers`. |
| `GET` | `/api/v1/trainers/me/batches` | `trainer` | Self | **My Batches**: Returns batches assigned to the authenticated trainer. |
| `GET` | `/api/v1/trainers/me/sessions` | `trainer` | Self | **My Sessions**: Returns scheduled teaching sessions for the trainer. |

---

### 2.7 Student Lifecycle & Bulk Account Operations (`/api/v1/students`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/students/` | Admin / College Admin | Yes | **Student Directory**: Paginated student list with department, activation status, and search filters. |
| `POST` | `/api/v1/students/` | Admin / College Admin | Yes | **Single Student Registration**: Manually registers a student and auto-generates credentials. |
| `POST` | `/api/v1/students/roster-preview` | Admin / College Admin | Yes | **Roster Upload Preview**: Validates uploaded CSV/Excel roster; returns new vs existing counts and error reports. |
| `POST` | `/api/v1/students/roster-import` | Admin / College Admin | Yes | **Execute Roster Ingestion**: Automatically provisions student accounts, generates 256-bit activation tokens, and enrolls into batch. |
| `GET` | `/api/v1/students/me` | `student` | Self | **Student Profile**: Returns student details, enrolled batch, and department. |
| `GET` | `/api/v1/students/me/dashboard` | `student` | Self | **Student Dashboard**: Timetable, upcoming sessions, pending quizzes, and certificate eligibility. |
| `GET` | `/api/v1/students/{id}` | Admin / College Admin | Yes | **Student Details**: Complete student record with attendance summary and quiz submissions. |
| `PUT` | `/api/v1/students/{id}` | Admin / College Admin | Yes | **Update Student**: Modifies student contact, department, semester, or DOB. |
| `POST` | `/api/v1/students/{id}/assign-credentials` | Admin / College Admin | Yes | **Provision Credentials**: Generates initial activation credentials for an inactive student. |
| `POST` | `/api/v1/students/{id}/reset-activation` | Admin / College Admin | Yes | **Reset Activation**: Generates fresh 256-bit activation token and logs immutable audit event. |
| `PATCH` | `/api/v1/students/{id}/status` | Admin / College Admin | Yes | **Deactivate / Reactivate**: Toggles student account status (`active` <-> `inactive`). |
| `POST` | `/api/v1/students/{id}/revoke-sessions` | Admin / College Admin | Yes | **Revoke Sessions**: Terminates all active sessions in `user_sessions` for the student. |
| `DELETE` | `/api/v1/students/{id}` | `super_admin` | Global | **Permanent Deletion**: Strictly protected by 7-table academic history guard (fails if attendance/exams exist). |
| `POST` | `/api/v1/students/bulk-delete-preview` | `super_admin` | Global | **Bulk Deletion Preview**: Verifies which selected student IDs are eligible for permanent deletion vs blocked by academic history. |
| `POST` | `/api/v1/students/bulk-action` | Admin / College Admin | Yes | **Bulk Operations**: Executes atomic bulk operations (`deactivate`, `reactivate`, `revoke_sessions`, `reset_activation`, `archive`, `permanent_delete`). |

---

### 2.8 Training Sessions & Timetable (`/api/v1/sessions`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/sessions/` | Authenticated | Yes | **List Sessions**: Returns training sessions filtered by batch_id or date range. |
| `POST` | `/api/v1/sessions/` | Admin / Trainer | Yes | **Schedule Session**: Creates session with date, start_time, end_time, topic, and title. |
| `PUT` | `/api/v1/sessions/{id}` | Admin / Trainer | Yes | **Update Session**: Modifies session agenda, time, or assigned trainer. |
| `GET` | `/api/v1/sessions/calendar` | Authenticated | Yes | **Calendar Feed**: Returns monthly session schedule formatted for calendar UI. |

---

### 2.9 Attendance Tracking (`/api/v1/attendance`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/attendance/batch/{batch_id}` | Admin / Trainer | Yes | **Live Roster**: Returns student attendance roster for active marking during class. |
| `POST` | `/api/v1/attendance/batch/{batch_id}` | Admin / Trainer | Yes | **Save Live Attendance**: Bulk upserts student marks (`present`, `absent`, `late`, `excused`). |
| `POST` | `/api/v1/attendance/session/{session_id}` | Admin / Trainer | Yes | **Mark Session Attendance**: Upserts attendance records for a single session. |
| `GET` | `/api/v1/attendance/student/{student_id}` | Authenticated | Self / Tenant | **Student Attendance**: Returns individual attendance records and overall percentage. |
| `GET` | `/api/v1/attendance/stats` | Admin | Global | **Platform Attendance**: Aggregated attendance rates across colleges and programs. |

---

### 2.10 Assessment & Exam Proctoring (`/api/v1/assessments`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/assessments/` | Authenticated | Yes | **List Assessments**: Returns quizzes and tests for a batch. |
| `GET` | `/api/v1/assessments/student/available` | `student` | Self | **Available Tests**: Returns pending and published tests for the enrolled student. |
| `POST` | `/api/v1/assessments/` | Admin / Trainer | Yes | **Create Assessment**: Provisions a quiz with questions, duration, shuffle, and anti-cheat settings. |
| `GET` | `/api/v1/assessments/{id}` | Authenticated | Yes | **Get Assessment**: Returns quiz metadata (sanitizes correct answers for student during test). |
| `PUT` | `/api/v1/assessments/{id}` | Admin / Trainer | Yes | **Update Assessment**: Modifies quiz questions, deadline, or duration. |
| `DELETE` | `/api/v1/assessments/{id}` | Admin / Trainer | Yes | **Delete Assessment**: Removes assessment and cascading submissions. |
| `POST` | `/api/v1/assessments/{id}/start` | `student` | Self | **Start Exam**: Initializes student attempt, shuffles questions, and records `started_at`. |
| `POST` | `/api/v1/assessments/{id}/autosave` | `student` | Self | **Autosave Progress**: Saves question responses with optimistic locking (`version`). |
| `POST` | `/api/v1/assessments/{id}/submit` | `student` | Self | **Submit Exam**: Evaluates answers against key, calculates final score, and sets `submitted`. |
| `POST` | `/api/v1/assessments/{id}/proctoring-event` | `student` | Self | **Log Proctoring Telemetry**: Logs anti-cheat events (tab switch, window blur, fullscreen exit) with idempotency key. |
| `GET` | `/api/v1/assessments/{id}/proctoring-logs` | Admin / Trainer | Yes | **Proctoring Audit**: Reviews anti-cheat event timeline and violation counts per student. |

---

### 2.11 Feedback & Ratings (`/api/v1/feedback`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/feedback/batch/{batch_id}/status` | Authenticated | Yes | **Feedback Lock Status**: Returns whether feedback submission is currently unlocked for the batch. |
| `POST` | `/api/v1/feedback/batch/{batch_id}/unlock` | Admin / Trainer | Yes | **Unlock Feedback**: Opens the feedback submission window for batch students. |
| `POST` | `/api/v1/feedback/batch/{batch_id}/submit` | `student` | Self | **Submit Feedback**: Records student rating (1–10) and comments (one review per student/batch). |
| `GET` | `/api/v1/feedback/batch/{batch_id}/reviews` | Admin / Trainer | Yes | **Review Aggregates**: Returns feedback reviews, average ratings, and comment sentiment. |

---

### 2.12 Certification & Verification (`/api/v1/certificates`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/certificates/batch/{batch_id}/eligibility` | Admin / College Admin | Yes | **Eligibility Roster**: Evaluates student attendance rates against graduation threshold. |
| `POST` | `/api/v1/certificates/batch/{batch_id}/issue` | Admin / College Admin | Yes | **Issue Certificates**: Generates verifiable certificate numbers and SHA-256 verification codes. |
| `GET` | `/api/v1/certificates/verify/{code}` | Public | No | **Public Verification**: Verifies credential authenticity, student name, college, and issue date. |
| `GET` | `/api/v1/certificates/download/{certificate_id}` | Authenticated | Self / Tenant | **Download PDF**: Generates and streams ReportLab vector PDF certificate. |

---

### 2.13 Learning Resources (`/api/v1/resources`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/resources/batch/{batch_id}` | Authenticated | Yes | **Batch Resources**: Returns study materials, Google Drive links, and documents. |
| `POST` | `/api/v1/resources/batch/{batch_id}` | Admin / Trainer | Yes | **Add Resource**: Attaches external material link or document to batch. |
| `PUT` | `/api/v1/resources/{id}` | Admin / Trainer | Yes | **Update Resource**: Modifies resource title, URL, or type. |
| `DELETE` | `/api/v1/resources/{id}` | Admin / Trainer | Yes | **Delete Resource**: Removes resource link. |

---

### 2.14 Contact Inquiries (`/api/v1/inquiries`)

| Method | Path | Required Role | Tenant Scoped | Description & Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/inquiries/` | Public | No | **Submit Inquiry**: Ingests institutional or corporate lead from landing pages. |
| `GET` | `/api/v1/inquiries/` | `super_admin` | Global | **List Inquiries**: Admin view of inbound leads with organization and status. |
| `PATCH` | `/api/v1/inquiries/{id}/status` | `super_admin` | Global | **Update Inquiry Status**: Transitions status (`new` -> `contacted` -> `resolved` -> `archived`). |

---

### 2.15 Next.js API Route Handlers

| Method | Path | Required Role | Scoped | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/certificates/[batchId]/download` | `student` | Self | **Direct Stream Route**: Streams PDF binary certificate to student browser session. |

