/**
 * Feedback API Client: Manages post-training feedback lifecycle,
 * batch unlocks, submissions, and summary reporting.
 */
import { apiGet, apiPost } from './client';
import { assertUuid } from '@/lib/validations/ids';

export interface FeedbackUnlockStatus {
  batch_id: string;
  batch_code: string;
  program_name: string;
  college_name: string;
  college_id: string;
  training_completed: boolean;
  status: 'not_available' | 'locked' | 'unlocked' | 'completed' | 'closed';
  is_unlocked: boolean;
  total_students: number;
  submissions_count: number;
  pending_count: number;
  unlocked_by_user_id?: string | null;
  unlocked_by_name?: string | null;
  unlocked_by_role?: string | null;
  unlocked_at?: string | null;
}

export interface StudentFeedbackSubmission {
  id: string;
  batch_id: string;
  student_id: string;
  student_name?: string | null;
  student_roll?: string | null;
  rating: number;
  comments: string;
  submitted_at: string;
}

export interface PendingFeedbackItem {
  batch_id: string;
  batch_code: string;
  program_name: string;
  college_name: string;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  unlocked_at?: string | null;
}

export interface BatchFeedbackSummary {
  batch_id: string;
  batch_code: string;
  program_name: string;
  college_name: string;
  total_eligible: number;
  submitted_count: number;
  pending_count: number;
  submission_percentage: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  submissions: StudentFeedbackSubmission[];
}

export interface SubmitFeedbackPayload {
  rating: number;
  comments: string;
}

/**
 * Retrieves the current feedback unlock status and submission counters for a batch.
 */
export async function getBatchFeedbackStatus(batchId: string): Promise<FeedbackUnlockStatus> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  return apiGet<FeedbackUnlockStatus>(`/batches/${safeBatchId}/feedback/status`);
}

/**
 * Unlocks feedback submission for a completed batch (Super Admin or assigned Trainer).
 */
export async function unlockBatchFeedback(batchId: string): Promise<FeedbackUnlockStatus> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  return apiPost<FeedbackUnlockStatus>(`/batches/${safeBatchId}/feedback/unlock`, {});
}

/**
 * Retrieves aggregated feedback metrics and written submissions for authorized staff.
 */
export async function getBatchFeedbackReport(batchId: string): Promise<BatchFeedbackSummary> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  return apiGet<BatchFeedbackSummary>(`/batches/${safeBatchId}/feedback`);
}

/**
 * Retrieves list of unlocked batches where the logged-in student has pending feedback.
 */
export async function getStudentPendingFeedbacks(): Promise<PendingFeedbackItem[]> {
  return apiGet<PendingFeedbackItem[]>('/student/feedback/pending');
}

/**
 * Submits feedback for an enrolled, unlocked batch.
 */
export async function submitStudentFeedback(
  batchId: string,
  payload: SubmitFeedbackPayload
): Promise<StudentFeedbackSubmission> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  return apiPost<StudentFeedbackSubmission>(`/batches/${safeBatchId}/feedback`, payload);
}

