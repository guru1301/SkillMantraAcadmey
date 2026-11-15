# Existing Authorization Matrix
## Project: Skill Mantra Academy / Skill Thinker Platform

---

## 1. Role Definitions

| Role Identifier | Role Name | Tenancy Scope | Description |
|---|---|---|---|
| `super_admin` | Super Administrator | Global / Platform-wide | Unrestricted administrative control across all institutions, programs, batches, faculty, and students. |
| `college_admin` | College Coordinator | Single College Tenant (`college_id`) | Institutional coordinator restricted strictly to batches, students, trainers, and resources belonging to their assigned college. |
| `trainer` | Faculty Trainer | Assigned Cohort Batches (`trainer_id`) | Faculty member restricted strictly to cohorts where they have an active assignment in `batch_trainers`. |
| `student` | Enrolled Student | Personal Records (`student_id`) | Individual learner restricted strictly to their enrolled cohorts (`batch_students`), own attendance logs, assigned tests, and own certificate. |
| `anonymous` | Public Visitor | Public Marketing Site | Unauthenticated visitor accessing public program marketing, contact forms, and helpdesk chat. |

---

## 2. Resource-Level Access Control Matrix

Legend:
- **ALL**: Permitted without restriction
- **OWN_COLLEGE**: Permitted only if the resource's `college_id` matches the user's verified token `college_id`
- **ASSIGNED_BATCH**: Permitted only if user is actively assigned to the target `batch_id`
- **OWN_RECORD**: Permitted only if target record's `student_id` or `trainer_id` matches the user's `user_id`
- **DENY**: Forbidden (403 Forbidden)

| Domain Resource / Operation | Super Admin | College Coordinator | Trainer | Student | Public / Anon |
|---|:---:|:---:|:---:|:---:|:---:|
| **Authentication & Sessions** | | | | | |
| `POST /auth/login` | ALL | ALL | ALL | ALL | ALL |
| `POST /auth/logout` | ALL | ALL | ALL | ALL | DENY |
| `GET /auth/me` | ALL | ALL | ALL | ALL | DENY |
| **Colleges & Institutions** | | | | | |
| `GET /colleges` (List all) | ALL | DENY | DENY | DENY | DENY |
| `POST /colleges` (Create) | ALL | DENY | DENY | DENY | DENY |
| `GET /colleges/{id}` (View) | ALL | OWN_COLLEGE | DENY | DENY | DENY |
| `PUT /colleges/{id}` (Update) | ALL | DENY | DENY | DENY | DENY |
| `PATCH /colleges/{id}/status` | ALL | DENY | DENY | DENY | DENY |
| **Programs (Curriculum Catalog)** | | | | | |
| `GET /programs` (List all) | ALL | ALL (Read-only) | ALL (Read-only) | ALL (Read-only) | ALL |
| `POST /programs` (Create) | ALL | DENY | DENY | DENY | DENY |
| `DELETE /programs/{id}` | ALL | DENY | DENY | DENY | DENY |
| **Batches (Cohorts)** | | | | | |
| `GET /batches` (All cohorts) | ALL | OWN_COLLEGE | ASSIGNED_BATCH | DENY | DENY |
| `GET /batches/{id}` | ALL | OWN_COLLEGE | ASSIGNED_BATCH | OWN_RECORD (Enrolled) | DENY |
| `POST /batches` (Create) | ALL | DENY | DENY | DENY | DENY |
| `POST /batches/guided-create` | ALL | DENY | DENY | DENY | DENY |
| `PATCH /batches/{id}/status` | ALL | DENY | DENY | DENY | DENY |
| **Student Roster & Management** | | | | | |
| `GET /students` (Master list) | ALL | OWN_COLLEGE | DENY | DENY | DENY |
| `GET /batches/{id}/students` | ALL | OWN_COLLEGE | ASSIGNED_BATCH | DENY | DENY |
| `POST /batches/{id}/students/bulk` | ALL | DENY | DENY | DENY | DENY |
| `POST /batches/{id}/students` | ALL | DENY | DENY | DENY | DENY |
| `DELETE /batches/{id}/students/{sid}` | ALL | DENY | DENY | DENY | DENY |
| `POST /batches/{id}/credentials` | ALL | DENY | DENY | DENY | DENY |
| **Trainer Registry & Assignments** | | | | | |
| `GET /trainers` (Master list) | ALL | OWN_COLLEGE (Assigned only) | DENY | DENY | DENY |
| `POST /trainers` (Create) | ALL | DENY | DENY | DENY | DENY |
| `PUT /trainers/{id}` (Update) | ALL | DENY | OWN_RECORD | DENY | DENY |
| `POST /batches/{id}/trainers` | ALL | DENY | DENY | DENY | DENY |
| `PUT /batches/{id}/trainers/lead` | ALL | DENY | DENY | DENY | DENY |
| `DELETE /batches/{id}/trainers/{tid}` | ALL | DENY | DENY | DENY | DENY |
| **Attendance Management** | | | | | |
| `GET /batches/{id}/attendance` | ALL | OWN_COLLEGE | ASSIGNED_BATCH | OWN_RECORD | DENY |
| `POST /batches/{id}/attendance` (Mark) | ALL | DENY | ASSIGNED_BATCH | DENY | DENY |
| `GET /trainer/attendance/{id}/roster` | ALL | DENY | ASSIGNED_BATCH | DENY | DENY |
| `POST /trainer/attendance/{id}` | ALL | DENY | ASSIGNED_BATCH | DENY | DENY |
| **Assessments & Exams** | | | | | |
| `GET /trainer/assessments` | ALL | OWN_COLLEGE (Read-only) | ASSIGNED_BATCH | DENY | DENY |
| `POST /trainer/assessments` (Create) | ALL | DENY | ASSIGNED_BATCH | DENY | DENY |
| `DELETE /trainer/assessments/{id}` | ALL | DENY | ASSIGNED_BATCH (Owner) | DENY | DENY |
| `GET /student/exams` (List available) | ALL | DENY | DENY | OWN_RECORD (Enrolled batches) | DENY |
| `GET /student/exams/{id}` (Room) | ALL | DENY | DENY | OWN_RECORD (Answers stripped!) | DENY |
| `POST /student/exams/{id}/submit` | ALL | DENY | DENY | OWN_RECORD (Only enrolled student) | DENY |
| **Certificates & Verification** | | | | | |
| `GET /student/certificates/eligibility` | ALL | OWN_COLLEGE | DENY | OWN_RECORD | DENY |
| `GET /student/certificates/{id}/download` | ALL | OWN_COLLEGE | DENY | OWN_RECORD | DENY |
| `GET /certificates/verify/{cert_no}` | ALL | ALL | ALL | ALL | ALL (Public verification) |
| **Inquiries & Leads** | | | | | |
| `POST /contact/inquiries` | ALL (Read-only) | DENY | DENY | DENY | ALL (Submit) |
| `POST /contact/quick-enquiry` | ALL (Read-only) | DENY | DENY | DENY | ALL (Submit) |

---

## 3. Multi-Tenant Enforcement Rules

1. **Never Trust Client-Supplied Identifiers**: A client request containing `collegeId`, `batchId`, `studentId`, or `trainerId` in query params or JSON bodies must NEVER be trusted on its own.
2. **Context Resolution**:
   - For `college_admin`: Injected database queries must automatically append `WHERE college_id = :authenticated_college_id`.
   - For `trainer`: Injected database queries must automatically join `batch_trainers bt WHERE bt.trainer_id = :authenticated_trainer_id`.
   - For `student`: Injected database queries must verify `student_id = :authenticated_student_id` and check active enrollment in `batch_students`.
3. **Negative Authorization Testing**: Every API test suite must include cross-tenant probe tests:
   - College A administrator querying College B's batch ID $\rightarrow$ `404 Not Found` or `403 Forbidden`.
   - Trainer X attempting to submit attendance for Batch Y where they are not assigned $\rightarrow$ `403 Forbidden`.
   - Student A attempting to load quiz questions or submit answers for Batch Z where they are not enrolled $\rightarrow$ `403 Forbidden`.

