'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { collegeSchema } from '@/lib/validations/college';
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
    const updated = await updateCollege(collegeId, parsed.data);
    if (!updated) {
      return { success: false, error: 'College not found or could not be updated.' };
    }
    revalidatePath('/admin/colleges');
    revalidatePath(`/admin/colleges/${collegeId}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Update College Error]:', err);
    if (err.message?.includes('idx_colleges_name_city_lower')) {
      return { success: false, error: 'A college with this name already exists in this city.' };
    }
    return { success: false, error: 'Failed to update college. Please try again.' };
  }
}
