'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { programSchema } from '@/lib/validations/program';
import { assertUuid } from '@/lib/validations/ids';
import { createProgram, deleteProgram } from '@/lib/db/programs';
import { ActionResult } from './colleges';

export async function createProgramAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
    durationDays: formData.get('durationDays') || 30,
    status: formData.get('status') || 'active',
  };

  const parsed = programSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    const result = await createProgram(parsed.data);
    revalidatePath('/admin/programs');
    revalidatePath('/admin/dashboard');
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[Create Program Error]:', err);
    if (err.message?.includes('idx_programs_name_lower')) {
      return { success: false, error: 'A program with this name already exists.' };
    }
    return { success: false, error: 'Failed to create program. Please try again.' };
  }
}

export async function deleteProgramAction(
  programId: string
): Promise<ActionResult<{ success: boolean }>> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  try {
    const safeProgramId = assertUuid(programId, 'programId');
    const res = await deleteProgram(safeProgramId);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to delete program.' };
    }
    revalidatePath('/admin/programs');
    revalidatePath('/admin/dashboard');
    return { success: true, data: { success: true } };
  } catch (err: any) {
    console.error('[Delete Program Error]:', err);
    return { success: false, error: 'Failed to delete program.' };
  }
}
