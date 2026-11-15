'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { resourceSchema } from '@/lib/validations/resource';
import { assertUuid } from '@/lib/validations/ids';
import { createResource } from '@/lib/db/resources';
import { ActionResult } from './colleges';

export async function createResourceAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin', 'trainer'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Staff authentication required.' };
  }

  const raw = {
    batchId: formData.get('batchId'),
    title: formData.get('title') || formData.get('name'),
    name: formData.get('name') || formData.get('title'),
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
    const safeBatchId = assertUuid(parsed.data.batchId, 'batchId');
    const result = await createResource({ ...parsed.data, batchId: safeBatchId });
    revalidatePath(`/admin/batches/${safeBatchId}`);
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[Create Resource Error]:', err);
    return { success: false, error: 'Failed to add resource. Please verify URL and try again.' };
  }
}
