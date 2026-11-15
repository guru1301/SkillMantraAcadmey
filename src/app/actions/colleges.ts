'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { collegeSchema } from '@/lib/validations/college';
import { assertUuid } from '@/lib/validations/ids';
import { createCollege, updateCollege } from '@/lib/db/colleges';

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createCollegeAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const raw = {
    name: formData.get('name'),
    city: formData.get('city'),
    state: formData.get('state'),
    contactName: formData.get('contactName'),
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone'),
    logoUrl: formData.get('logoUrl'),
    status: formData.get('status') || 'active',
  };

  const parsed = collegeSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    const result = await createCollege(parsed.data);
    revalidatePath('/admin/colleges');
    revalidatePath('/admin/dashboard');
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[Create College Error]:', err);
    if (err.message?.includes('idx_colleges_name_city_lower')) {
      return { success: false, error: 'A college with this name already exists in this city.' };
    }
    return { success: false, error: 'Failed to create college. Please try again.' };
  }
}

export async function updateCollegeAction(
  collegeId: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const raw = {
    name: formData.get('name'),
    city: formData.get('city'),
    state: formData.get('state'),
    contactName: formData.get('contactName'),
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone'),
    logoUrl: formData.get('logoUrl'),
    status: formData.get('status') || 'active',
  };

  const parsed = collegeSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    const safeCollegeId = assertUuid(collegeId, 'collegeId');
    const updated = await updateCollege(safeCollegeId, parsed.data);
    if (!updated) {
      return { success: false, error: 'College not found or could not be updated.' };
    }
    revalidatePath('/admin/colleges');
    revalidatePath(`/admin/colleges/${safeCollegeId}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Update College Error]:', err);
    if (err.message?.includes('idx_colleges_name_city_lower')) {
      return { success: false, error: 'A college with this name already exists in this city.' };
    }
    if (err.message?.startsWith('Invalid collegeId')) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to update college. Please try again.' };
  }
}

export async function updateCollegeStatusAction(
  collegeId: string,
  status: 'active' | 'inactive'
): Promise<ActionResult<{ id: string; status: string }>> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  try {
    const safeCollegeId = assertUuid(collegeId, 'collegeId');
    const { updateCollegeStatus } = await import('@/lib/db/colleges');
    const updated = await updateCollegeStatus(safeCollegeId, status);
    if (!updated) {
      return { success: false, error: 'College not found.' };
    }
    revalidatePath('/admin/colleges');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/colleges/${safeCollegeId}`);
    return { success: true, data: { id: safeCollegeId, status } };
  } catch (err: any) {
    console.error('[Update College Status Error]:', err);
    return { success: false, error: err.message || 'Failed to update college status.' };
  }
}
