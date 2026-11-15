/**
 * Examination Proctoring & Real-Time Integrity API Client
 */
import { apiGet, apiPost } from './client';
import { assertUuid } from '@/lib/validations/ids';

export type SecurityEventType =
  | 'TAB_HIDDEN'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'PAGE_HIDDEN'
  | 'CONNECTION_LOST'
  | 'CONNECTION_RESTORED'
  | 'EXAM_RESUMED';

export interface ExamStartResponse {
  success: boolean;
  status: string;
  started_at: string;
  server_timestamp: string;
  restored_answers: Record<string, number>;
  violations_count: number;
  anti_cheat_enabled: boolean;
  duration_minutes: number;
  version: number;
  effective_deadline?: string | null;
  seconds_remaining?: number | null;
  questions?: Array<{
    id: string;
    question: string;
    options: string[];
    points: number;
  }>;
  questions_count?: number;
}

export interface ExamSaveProgressResponse {
  success: boolean;
  saved_answers_count: number;
  server_timestamp: string;
  status: string;
  version: number;
  conflict: boolean;
  answers?: Record<string, any>;
  effective_deadline?: string | null;
  seconds_remaining?: number | null;
}

export interface ExamSecurityEventResponse {
  id: string;
  assessment_id: string;
  student_id: string;
  event_type: SecurityEventType;
  sequence_number: number;
  duration_seconds: number;
  violations_count: number;
  security_level: 'normal' | 'warning_1' | 'warning_2' | 'flagged';
  policy_warning: string | null;
  created_at: string;
  idempotency_key?: string | null;
  is_duplicate?: boolean;
}

export interface ExamProctoringLogItem {
  id: string;
  student_id: string;
  student_name: string | null;
  roll_number: string | null;
  event_type: SecurityEventType;
  sequence_number: number;
  duration_seconds: number;
  event_metadata: Record<string, any>;
  created_at: string;
}

export interface ExamProctoringSummaryResponse {
  assessment_id: string;
  total_events: number;
  violations_count: number;
  security_status: 'clean' | 'warning' | 'flagged_for_review';
  logs: ExamProctoringLogItem[];
}

/**
 * Initializes or resumes an exam attempt on the backend.
 */
export async function startExamAttempt(assessmentId: string): Promise<ExamStartResponse> {
  const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
  return apiPost<ExamStartResponse>(`/assessments/${safeAssessmentId}/start`, {});
}

/**
 * Auto-saves in-progress answers to the backend to prevent data loss.
 * Carries expectedVersion for optimistic concurrency control.
 */
export async function saveExamProgress(
  assessmentId: string,
  answers: Record<string, any>,
  violationsCount?: number,
  expectedVersion: number = 1
): Promise<ExamSaveProgressResponse> {
  const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
  return apiPost<ExamSaveProgressResponse>(`/assessments/${safeAssessmentId}/save-progress`, {
    assessment_id: safeAssessmentId,
    answers,
    violations_count: violationsCount || 0,
    expected_version: expectedVersion,
  });
}

/**
 * Logs a standardized proctoring integrity event and calculates policy warning tier.
 * Supports idempotency_key for retry safety and deduplication.
 */
export async function logExamSecurityEvent(
  assessmentId: string,
  payload: {
    event_type: SecurityEventType;
    sequence_number: number;
    duration_seconds?: number;
    event_metadata?: Record<string, any>;
    acknowledged?: boolean;
    idempotency_key?: string;
  }
): Promise<ExamSecurityEventResponse> {
  const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
  return apiPost<ExamSecurityEventResponse>(`/assessments/${safeAssessmentId}/security-event`, {
    assessment_id: safeAssessmentId,
    event_type: payload.event_type,
    sequence_number: payload.sequence_number,
    duration_seconds: payload.duration_seconds || 0.0,
    event_metadata: payload.event_metadata || {},
    acknowledged: payload.acknowledged ?? true,
    idempotency_key: payload.idempotency_key,
  });
}

/**
 * Fetches proctoring audit log for trainers and administrators.
 */
export async function getExamProctoringLogs(
  assessmentId: string,
  studentId?: string
): Promise<ExamProctoringSummaryResponse> {
  const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
  const params: Record<string, string> = {};
  if (studentId) params.student_id = assertUuid(studentId, 'studentId');
  return apiGet<ExamProctoringSummaryResponse>(`/assessments/${safeAssessmentId}/proctoring-logs`, params);
}

