'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import {
  trainerSchema,
  batchTrainerAssignmentSchema,
} from '@/lib/validations/trainer';
import {
  createTrainer,
  updateTrainer,
  setTrainerStatus,
  assignTrainerToBatch,
  setLeadTrainer,
  removeTrainerFromBatch,
} from '@/lib/db/trainers';

export interface TrainerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Creates a new trainer in the master directory.
 */
export async function createTrainerAction(
  formData: FormData
): Promise<TrainerActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const raw = {
    fullName: formData.get('fullName'),
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    skills: formData.get('skills') || '',
    status: formData.get('status') || 'active',
  };

  const parsed = trainerSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    const result = await createTrainer(parsed.data);
    revalidatePath('/admin/trainers');
    revalidatePath('/admin/dashboard');
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[Create Trainer Error]:', err);
    if (
      err.message?.includes('idx_trainers_email_lower') ||
      err.message?.includes('duplicate key')
    ) {
      return {
        success: false,
        error: 'A trainer with this email address already exists. Please use a unique email.',
      };
    }
    return { success: false, error: 'Failed to create trainer. Please try again.' };
  }
}

/**
 * Server Action: Updates an existing trainer's profile.
 */
export async function updateTrainerAction(
  trainerId: string,
  formData: FormData
): Promise<TrainerActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const raw = {
    fullName: formData.get('fullName'),
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    skills: formData.get('skills') || '',
    status: formData.get('status') || 'active',
  };

  const parsed = trainerSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    const updated = await updateTrainer(trainerId, parsed.data);
    if (!updated) {
      return { success: false, error: 'Trainer not found or could not be updated.' };
    }
    revalidatePath('/admin/trainers');
    revalidatePath(`/admin/trainers/${trainerId}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Update Trainer Error]:', err);
    if (
      err.message?.includes('idx_trainers_email_lower') ||
      err.message?.includes('duplicate key')
    ) {
      return {
        success: false,
        error: 'A trainer with this email address already exists. Please use a unique email.',
      };
    }
    return { success: false, error: 'Failed to update trainer. Please try again.' };
  }
}

/**
 * Server Action: Toggles a trainer's active/inactive status.
 */
export async function toggleTrainerStatusAction(
  trainerId: string,
  status: 'active' | 'inactive'
): Promise<TrainerActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  try {
    const updated = await setTrainerStatus(trainerId, status);
    if (!updated) {
      return { success: false, error: 'Trainer not found.' };
    }
    revalidatePath('/admin/trainers');
    revalidatePath(`/admin/trainers/${trainerId}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Toggle Trainer Status Error]:', err);
    return { success: false, error: 'Failed to update trainer status.' };
  }
}

/**
 * Server Action: Assigns an existing active trainer to a batch.
 */
export async function assignTrainerToBatchAction(
  formData: FormData
): Promise<TrainerActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const raw = {
    batchId: formData.get('batchId'),
    trainerId: formData.get('trainerId'),
    isLead: formData.get('isLead') === 'true',
    role: formData.get('role') || undefined,
  };

  const parsed = batchTrainerAssignmentSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    const result = await assignTrainerToBatch(parsed.data);
    revalidatePath(`/admin/batches/${parsed.data.batchId}`);
    revalidatePath(`/admin/batches/${parsed.data.batchId}/trainers`);
    revalidatePath('/admin/batches');
    revalidatePath('/admin/dashboard');
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[Assign Trainer Error]:', err);
    if (
      err.message?.includes('unq_batch_trainer') ||
      err.message?.includes('duplicate key')
    ) {
      return {
        success: false,
        error: 'This trainer is already assigned to this batch. Duplicate assignments are not permitted.',
      };
    }
    if (
      err.message?.includes('idx_batch_trainers_one_lead_per_batch') ||
      err.message?.includes('designated lead trainer')
    ) {
      return {
        success: false,
        error: 'This batch already has a designated lead trainer. Please assign as an assistant or change the existing lead.',
      };
    }
    return {
      success: false,
      error: err.message || 'Failed to assign trainer to batch. Please try again.',
    };
  }
}

/**
 * Server Action: Promotes an assigned trainer to Lead Trainer and demotes previous leads.
 */
export async function setLeadTrainerAction(
  batchId: string,
  trainerId: string
): Promise<TrainerActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  try {
    const updated = await setLeadTrainer(batchId, trainerId);
    if (!updated) {
      return { success: false, error: 'Failed to update lead trainer.' };
    }
    revalidatePath(`/admin/batches/${batchId}`);
    revalidatePath(`/admin/batches/${batchId}/trainers`);
    return { success: true };
  } catch (err: any) {
    console.error('[Set Lead Trainer Error]:', err);
    return {
      success: false,
      error: err.message || 'Failed to change lead trainer. Please try again.',
    };
  }
}

/**
 * Server Action: Removes a trainer assignment from a batch.
 */
export async function removeTrainerFromBatchAction(
  batchId: string,
  trainerId: string
): Promise<TrainerActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  try {
    const removed = await removeTrainerFromBatch(batchId, trainerId);
    if (!removed) {
      return { success: false, error: 'Assignment record not found.' };
    }
    revalidatePath(`/admin/batches/${batchId}`);
    revalidatePath(`/admin/batches/${batchId}/trainers`);
    revalidatePath('/admin/batches');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('[Remove Trainer From Batch Error]:', err);
    return { success: false, error: 'Failed to remove trainer from batch.' };
  }
}
