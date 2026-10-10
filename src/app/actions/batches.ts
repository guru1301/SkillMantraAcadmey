'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { batchSchema } from '@/lib/validations/batch';
import { createBatch } from '@/lib/db/batches';
import { ActionResult } from './colleges';

export async function createBatchAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
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
