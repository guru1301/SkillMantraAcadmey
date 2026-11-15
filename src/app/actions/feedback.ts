'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { unlockBatchFeedback, submitStudentFeedback } from '@/lib/api/feedback';
import { assertUuid } from '@/lib/validations/ids';

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Unlocks student feedback for a completed training batch.
 * Enforces role authorization via FastAPI (Super Admin or assigned Trainer).
 */
export async function unlockBatchFeedbackAction(batchId: string): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Authentication required. Please log in.' };
  }

  if (session.role !== 'super_admin' && session.role !== 'trainer') {
    return {
      success: false,
      error: 'Unauthorized: Only Super Administrators and assigned Trainers can unlock student feedback.',
    };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    const result = await unlockBatchFeedback(safeBatchId);
    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath(`/admin/batches/${safeBatchId}/feedback`);
    revalidatePath(`/trainer/batches/${safeBatchId}`);
    revalidatePath(`/portal/batches/${safeBatchId}`);
    revalidatePath('/student');
    return { success: true, data: result };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to unlock student feedback. Ensure the batch is completed.',
    };
  }
}

/**
 * Server Action: Submits student rating (1-10) and written comments.
 * Mandatory precondition for certificate eligibility.
 */
export async function submitStudentFeedbackAction(
  batchId: string,
  payload: { rating: number; comments: string }
): Promise<ActionResponse> {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return { success: false, error: 'Student authentication required.' };
  }

  const trimmedComments = (payload.comments || '').trim();
  if (trimmedComments.length < 10) {
    return { success: false, error: 'Feedback comments must be at least 10 characters.' };
  }
  if (trimmedComments.length > 2000) {
    return { success: false, error: 'Feedback comments cannot exceed 2000 characters.' };
  }
  if (payload.rating < 1 || payload.rating > 10) {
    return { success: false, error: 'Rating must be an integer between 1 and 10.' };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    const result = await submitStudentFeedback(safeBatchId, {
      rating: payload.rating,
      comments: trimmedComments,
    });
    revalidatePath('/student');
    revalidatePath('/student/certificates');
    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath(`/trainer/batches/${safeBatchId}`);
    return { success: true, data: result };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to submit feedback. You may have already submitted for this batch.',
    };
  }
}

