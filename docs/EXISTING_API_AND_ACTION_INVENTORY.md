# Existing API and Action Inventory
## Project: Skill Mantra Academy / Skill Thinker Platform

---

## 1. Server Actions Inventory (`src/app/actions/*.ts`)

All existing server actions must be retired and replaced with typed HTTP API calls to the FastAPI backend.

| Server Action File | Exported Action Function | Input Parameters | Existing DB Operations | Replaced By Target FastAPI Endpoint |
|---|---|---|---|---|
| `auth.ts` | `loginAction` | `formData: FormData` (`email`, `password`) | Single `UNION ALL` query against `admin_users`, `college_users`, `trainers`, `students`; updates `last_login_at`; sets cookie | `POST /api/v1/auth/login` |
| `auth.ts` | `logoutAction` | None | Destroys JWT session cookie | `POST /api/v1/auth/logout` |
| `colleges.ts` | `createCollegeAction` | `formData: FormData` | Validates with `collegeSchema`; executes `createCollege()` INSERT | `POST /api/v1/colleges` |
| `colleges.ts` | `updateCollegeAction` | `collegeId: string, formData: FormData` | Validates with `collegeSchema`; executes `updateCollege()` UPDATE | `PUT /api/v1/colleges/{college_id}` |
| `colleges.ts` | `updateCollegeStatusAction` | `collegeId: string, status: 'active' \| 'inactive'` | Executes `updateCollegeStatus()` UPDATE | `PATCH /api/v1/colleges/{college_id}/status` |
| `programs.ts` | `createProgramAction` | `formData: FormData` | Validates with `programSchema`; executes `createProgram()` INSERT | `POST /api/v1/programs` |
| `programs.ts` | `deleteProgramAction` | `programId: string` | Checks batch count; executes `deleteProgram()` DELETE | `DELETE /api/v1/programs/{program_id}` |
| `batches.ts` | `createBatchAction` | `formData: FormData` | Validates with `batchSchema`; executes `createBatch()` INSERT | `POST /api/v1/batches` |
| `batches.ts` | `createBatchFullWorkflowAction` | `payload: GuidedBatchPayload` | Creates batch, calls `assignTrainerToBatch` (lead and assistant), calls `enrollStudentsBulk` | `POST /api/v1/batches/guided-create` |
| `batches.ts` | `updateBatchStatusAction` | `batchId: string, status: string` | Executes `updateBatchStatus()` UPDATE | `PATCH /api/v1/batches/{batch_id}/status` |
| `students.ts` | `uploadStudentsBulkAction` | `batchId, collegeId, students: StudentRowInput[]` | Validates with `bulkStudentUploadSchema`; calls `enrollStudentsBulk()` | `POST /api/v1/batches/{batch_id}/students/bulk` |
| `students.ts` | `addSingleStudentAction` | `batchId, collegeId, student: StudentRowInput` | Calls `enrollStudentsBulk()` with 1 record | `POST /api/v1/batches/{batch_id}/students` |
| `students.ts` | `removeStudentFromBatchAction` | `batchId, studentId, collegeId` | Calls `removeStudentFromBatch()` DELETE | `DELETE /api/v1/batches/{batch_id}/students/{student_id}` |
| `students.ts` | `assignBatchStudentCredentialsAction` | `batchId, customPassword?` | Hashes password (`1234` default); executes `assignCredentialsToBatchStudents()` | `POST /api/v1/batches/{batch_id}/credentials` |
| `students.ts` | `deleteBatchStudentCredentialsAction` | `batchId` | Executes `deleteCredentialsFromBatchStudents()` (sets password_hash = NULL) | `DELETE /api/v1/batches/{batch_id}/credentials` |
| `students.ts` | `assignSingleStudentCredentialAction` | `studentId, customPassword?` | Hashes password; executes `assignCredentialsToSingleStudent()` | `POST /api/v1/students/{student_id}/credentials` |
| `students.ts` | `deleteSingleStudentCredentialAction` | `studentId` | Executes `deleteCredentialsFromSingleStudent()` (sets password_hash = NULL) | `DELETE /api/v1/students/{student_id}/credentials` |
| `trainers.ts` | `createTrainerAction` | `formData: FormData` | Validates with `trainerSchema`; executes `createTrainer()` INSERT | `POST /api/v1/trainers` |
| `trainers.ts` | `updateTrainerAction` | `trainerId: string, formData: FormData` | Validates with `trainerSchema`; executes `updateTrainer()` UPDATE | `PUT /api/v1/trainers/{trainer_id}` |
| `trainers.ts` | `toggleTrainerStatusAction` | `trainerId: string, status: 'active' \| 'inactive'` | Executes `setTrainerStatus()` UPDATE | `PATCH /api/v1/trainers/{trainer_id}/status` |
| `trainers.ts` | `assignTrainerToBatchAction` | `formData: FormData` | Validates assignment; executes `assignTrainerToBatch()` INSERT | `POST /api/v1/batches/{batch_id}/trainers` |
| `trainers.ts` | `setLeadTrainerAction` | `batchId: string, trainerId: string` | Demotes current lead; promotes target trainer to lead | `PUT /api/v1/batches/{batch_id}/trainers/lead` |
| `trainers.ts` | `removeTrainerFromBatchAction` | `batchId: string, trainerId: string` | Executes `removeTrainerFromBatch()` DELETE | `DELETE /api/v1/batches/{batch_id}/trainers/{trainer_id}` |
| `attendance.ts` | `recordAttendanceAction` | `prevState, formData: FormData` | Creates or finds session; upserts records to `session_attendance` | `POST /api/v1/attendance/records` |
| `resources.ts` | `createResourceAction` | `formData: FormData` | Validates with `resourceSchema`; executes `createResource()` INSERT | `POST /api/v1/resources` |
| `trainerAttendance.ts` | `saveTrainerLiveAttendanceAction` | `payload: SaveAttendancePayload` | Validates date <= today; executes `saveLiveBatchAttendance()` in `training_sessions` and `session_attendance` | `POST /api/v1/trainer/attendance/{batch_id}` |
| `trainerAttendance.ts` | `getTrainerBatchRosterForDateAction` | `batchId: string, dateStr: string` | Fetches enrolled students and matching attendance state for date | `GET /api/v1/trainer/attendance/{batch_id}/roster?date=...` |
| `trainerQuizzes.ts` | `createTrainerQuizAction` | `payload: CreateQuizPayload` | Validates start/deadline and question pool; executes `createTrainerAssessment()` | `POST /api/v1/trainer/assessments` |
| `trainerQuizzes.ts` | `deleteTrainerQuizAction` | `assessmentId: string` | Verifies trainer authorization; executes `deleteTrainerAssessment()` | `DELETE /api/v1/trainer/assessments/{assessment_id}` |
| `studentQuiz.ts` | `getStudentQuizAction` | `assessmentId: string` | Verifies student enrollment; strips answers; returns questions | `GET /api/v1/student/exams/{assessment_id}` |
| `studentQuiz.ts` | `submitStudentQuizAction` | `payload: { assessmentId, answers, violationsCount }` | Evaluates answers against answer key; saves submission and score | `POST /api/v1/student/exams/{assessment_id}/submit` |

---

## 2. Server Component Data-Fetching Inventory (`src/lib/db/*.ts`)

The following server-side query functions are directly invoked in Server Components across the app:

| Query Module | Exported Query Functions | Invoking Next.js Server Components | Target FastAPI Endpoint |
|---|---|---|---|
| `db.ts` | `testDbConnection()`, `getAdminStats()`, `getPlatformOverviewStats()` | `src/app/admin/dashboard/page.tsx` | `GET /api/v1/reports/dashboard`<br>`GET /health/ready` |
| `colleges.ts` | `getColleges()`, `getDistinctCities()`, `getCollegeById()`, `getCollegeStats()`, `createCollege()`, `updateCollege()` | `src/app/admin/colleges/page.tsx`<br>`src/app/admin/colleges/[collegeId]/page.tsx`<br>`src/app/admin/colleges/[collegeId]/edit/page.tsx` | `GET /api/v1/colleges`<br>`GET /api/v1/colleges/{id}`<br>`GET /api/v1/colleges/{id}/stats` |
| `programs.ts` | `getPrograms()`, `getProgramById()`, `getProgramsByCollegeId()` | `src/app/admin/programs/page.tsx`<br>`src/app/admin/colleges/[collegeId]/programs/page.tsx`<br>`src/app/admin/batches/new/page.tsx` | `GET /api/v1/programs`<br>`GET /api/v1/programs/{id}` |
| `batches.ts` | `getBatches()`, `getBatchById()`, `getBatchStats()` | `src/app/admin/batches/page.tsx`<br>`src/app/admin/batches/[batchId]/page.tsx`<br>`src/app/admin/colleges/[collegeId]/batches/page.tsx`<br>`src/app/portal/batches/page.tsx` | `GET /api/v1/batches`<br>`GET /api/v1/batches/{id}`<br>`GET /api/v1/batches/{id}/stats` |
| `students.ts` | `getStudentsByBatchId()`, `getStudentsByCollegeId()`, `getAllStudents()`, `enrollStudentsBulk()`, `removeStudentFromBatch()` | `src/app/admin/batches/[batchId]/students/page.tsx`<br>`src/app/admin/colleges/[collegeId]/students/page.tsx`<br>`src/app/admin/students/page.tsx`<br>`src/app/portal/students/page.tsx` | `GET /api/v1/batches/{batch_id}/students`<br>`GET /api/v1/colleges/{college_id}/students`<br>`GET /api/v1/students` |
| `trainers.ts` | `getTrainers()`, `getTrainerById()`, `getTrainersByBatchId()`, `getAvailableTrainersForBatch()`, `getTrainersByCollegeId()` | `src/app/admin/trainers/page.tsx`<br>`src/app/admin/trainers/[trainerId]/page.tsx`<br>`src/app/admin/batches/[batchId]/trainers/page.tsx`<br>`src/app/admin/colleges/[collegeId]/trainers/page.tsx`<br>`src/app/portal/trainers/page.tsx` | `GET /api/v1/trainers`<br>`GET /api/v1/trainers/{id}`<br>`GET /api/v1/batches/{batch_id}/trainers` |
| `attendance.ts` | `getBatchSessions()`, `getSessionAttendanceRoster()`, `getPlatformAttendanceStats()`, `createTrainingSession()` | `src/app/admin/attendance/page.tsx`<br>`src/app/admin/batches/[batchId]/attendance/page.tsx` | `GET /api/v1/batches/{batch_id}/attendance`<br>`GET /api/v1/attendance/sessions/{session_id}/roster` |
| `resources.ts` | `getResourcesByBatchId()`, `getAllResources()` | `src/app/admin/resources/page.tsx`<br>`src/app/admin/batches/[batchId]/resources/page.tsx`<br>`src/app/portal/resources/page.tsx` | `GET /api/v1/batches/{batch_id}/resources`<br>`GET /api/v1/resources` |
| `collegePortal.ts` | `getCollegePortalData(collegeId)` | `src/app/portal/page.tsx`<br>`src/app/portal/layout.tsx` | `GET /api/v1/portal/overview` |
| `trainerPortal.ts` | `getTrainerProfile()`, `getTrainerAssignedBatches()`, `getTrainerBatchesWithRosters()`, `getTrainerBatchLiveRoster()` | `src/app/trainer/page.tsx`<br>`src/app/trainer/batches/page.tsx`<br>`src/app/trainer/attendance/page.tsx`<br>`src/app/trainer/attendance/[batchId]/page.tsx` | `GET /api/v1/trainer/profile`<br>`GET /api/v1/trainer/batches`<br>`GET /api/v1/trainer/attendance/{batch_id}/roster` |
| `trainerAssessments.ts` | `getTrainerAssessments()`, `getTrainerAssessmentDetails()`, `createTrainerAssessment()`, `deleteTrainerAssessment()` | `src/app/trainer/tests/page.tsx`<br>`src/app/admin/batches/[batchId]/assessments/page.tsx` | `GET /api/v1/trainer/assessments`<br>`GET /api/v1/trainer/assessments/{id}` |
| `studentPortal.ts` | `getStudentProfile()`, `getStudentBatches()`, `getStudentBatchDetails()`, `getStudentDashboardData()`, `getStudentAssessments()`, `getStudentQuizData()`, `getStudentAttendanceSummary()`, `getStudentCertificates()` | `src/app/student/page.tsx`<br>`src/app/student/course/page.tsx`<br>`src/app/student/profile/page.tsx`<br>`src/app/student/tests/page.tsx`<br>`src/app/student/tests/[assessmentId]/page.tsx`<br>`src/app/student/certificates/page.tsx` | `GET /api/v1/student/profile`<br>`GET /api/v1/student/dashboard`<br>`GET /api/v1/student/batches`<br>`GET /api/v1/student/batches/{id}`<br>`GET /api/v1/student/exams`<br>`GET /api/v1/student/exams/{id}`<br>`GET /api/v1/student/attendance`<br>`GET /api/v1/student/certificates/eligibility` |

