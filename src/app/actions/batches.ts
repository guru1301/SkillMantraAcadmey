'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { batchSchema } from '@/lib/validations/batch';
import { assertUuid } from '@/lib/validations/ids';
import { createBatch } from '@/lib/db/batches';
import { ActionResult } from './colleges';

export async function createBatchAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  const requestedCollegeId = (formData.get('collegeId') as string) || (session.role === 'college_admin' ? session.collegeId : '');
  if (session.role === 'college_admin' && session.collegeId && requestedCollegeId !== session.collegeId) {
    return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
  }

  const raw = {
    code: formData.get('code'),
    collegeId: formData.get('collegeId'),
    programId: formData.get('programId'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    targetStrength: formData.get('targetStrength') || 60,
    status: formData.get('status') || 'planned',
  };

  const parsed = batchSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    const result = await createBatch(parsed.data, session.id);
    revalidatePath(`/admin/colleges/${parsed.data.collegeId}`);
    revalidatePath(`/admin/colleges/${parsed.data.collegeId}/batches`);
    revalidatePath('/admin/batches');
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[Create Batch Error]:', err);
    if (err.message?.includes('batches_code_key')) {
      return { success: false, error: 'A batch with this code already exists. Please choose a unique batch code.' };
    }
    if (err.message?.includes('chk_batch_dates')) {
      return { success: false, error: 'End date must be on or after start date.' };
    }
    return { success: false, error: 'Failed to create batch. Please try again.' };
  }
}

export interface GuidedBatchPayload {
  code: string;
  collegeId: string;
  programId: string;
  startDate: string;
  endDate: string;
  targetStrength: number;
  status: 'planned' | 'active' | 'completed';
  leadTrainerId?: string;
  assistantTrainerIds?: string[];
  studentsCsvRows?: Array<{
    rollNumber: string;
    fullName: string;
    email?: string;
    phone?: string;
    department?: string;
    yearOrSemester?: string;
  }>;
}

export async function createBatchFullWorkflowAction(
  payload: GuidedBatchPayload
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }
  if (session.role === 'college_admin' && session.collegeId && payload.collegeId !== session.collegeId) {
    return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
  }

  const { enrollStudentsBulk } = await import('@/lib/db/students');
  const { assignTrainerToBatch } = await import('@/lib/db/trainers');

  const batchData = {
    code: payload.code.trim().toUpperCase(),
    collegeId: payload.collegeId,
    programId: payload.programId,
    startDate: payload.startDate,
    endDate: payload.endDate,
    targetStrength: payload.targetStrength || 60,
    status: payload.status || 'planned',
  };

  const parsed = batchSchema.safeParse(batchData);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    // Validate IDs upfront before calling backend helpers
    const safeCollegeId = assertUuid(payload.collegeId, 'collegeId');
    assertUuid(payload.programId, 'programId');
    const safeLeadTrainerId = payload.leadTrainerId
      ? assertUuid(payload.leadTrainerId, 'leadTrainerId')
      : undefined;
    const safeAssistantIds = (payload.assistantTrainerIds || []).map((tId) =>
      assertUuid(tId, 'trainerId')
    );

    // 1. Create the Batch record
    const batchResult = await createBatch(parsed.data, session.id);
    const newBatchId = batchResult.id;

    // 2. Assign Lead Trainer if specified
    if (safeLeadTrainerId) {
      await assignTrainerToBatch({
        batchId: newBatchId,
        trainerId: safeLeadTrainerId,
        isLead: true,
        role: 'Lead Trainer',
      });
    }

    // 3. Assign Assistant Trainers if specified
    if (safeAssistantIds.length > 0) {
      for (const tId of safeAssistantIds) {
        if (tId !== safeLeadTrainerId) {
          await assignTrainerToBatch({
            batchId: newBatchId,
            trainerId: tId,
            isLead: false,
            role: 'Assistant Trainer',
          });
        }
      }
    }

    // 4. Enroll Students if provided
    if (payload.studentsCsvRows && payload.studentsCsvRows.length > 0) {
      await enrollStudentsBulk(newBatchId, safeCollegeId, payload.studentsCsvRows);
    }

    revalidatePath(`/admin/colleges/${safeCollegeId}`);
    revalidatePath(`/admin/colleges/${safeCollegeId}/batches`);
    revalidatePath('/admin/batches');
    revalidatePath(`/admin/batches/${newBatchId}`);
    revalidatePath('/admin/dashboard');

    return { success: true, data: { id: newBatchId } };
  } catch (err: any) {
    console.error('[Create Batch Guided Workflow Error]:', err);
    if (err.message?.includes('batches_code_key')) {
      return { success: false, error: 'A batch with this code already exists. Please choose a unique batch code.' };
    }
    if (err.message?.includes('chk_batch_dates')) {
      return { success: false, error: 'End date must be on or after start date.' };
    }
    return { success: false, error: err.message || 'Failed to create training batch.' };
  }
}

export async function updateBatchStatusAction(
  batchId: string,
  status: 'planned' | 'active' | 'completed' | 'cancelled'
): Promise<ActionResult<{ id: string; status: string }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }
  if (session.role === 'college_admin' && status !== 'active') {
    return {
      success: false,
      error: "Unauthorized: Only Super Administrators can set batch status to 'completed', 'cancelled', or 'planned'.",
    };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    const { updateBatchStatus } = await import('@/lib/db/batches');
    const updated = await updateBatchStatus(safeBatchId, status);
    if (!updated) {
      return { success: false, error: 'Batch not found.' };
    }
    revalidatePath('/admin/batches');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/batches/${safeBatchId}`);
    return { success: true, data: { id: safeBatchId, status } };
  } catch (err: any) {
    console.error('[Update Batch Status Error]:', err);
    return { success: false, error: err.message || 'Failed to update batch status.' };
  }
}

