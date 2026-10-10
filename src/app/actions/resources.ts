'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { resourceSchema } from '@/lib/validations/resource';
import { createResource } from '@/lib/db/resources';
import { ActionResult } from './colleges';

export async function createResourceAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const raw = {
    batchId: formData.get('batchId'),
    name: formData.get('name'),
    type: formData.get('type') || 'google_drive',
    url: formData.get('url'),
    description: formData.get('description'),
  };

  const parsed = resourceSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    const result = await createResource(parsed.data);
    revalidatePath(`/admin/batches/${parsed.data.batchId}`);
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[Create Resource Error]:', err);
    return { success: false, error: 'Failed to add resource. Please verify URL and try again.' };
  }
}
