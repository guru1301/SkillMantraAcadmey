/**
 * Resources Data Access Layer — Fully migrated to FastAPI Backend.
 */
import { apiGet, apiPost } from '@/lib/api/client';
import { ResourceInput } from '@/lib/validations/resource';
import { assertUuid } from '@/lib/validations/ids';

export interface ResourceRecord {
  id: string;
  batch_id: string;
  name: string;
  type: 'google_drive' | 'document' | 'video' | 'link';
  url: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MasterResourceRecord extends ResourceRecord {
  batch_code: string;
  college_name: string;
  program_name: string;
}

/**
 * Retrieves resources for a batch from FastAPI.
 */
export async function getResourcesByBatchId(batchId: string): Promise<ResourceRecord[]> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  try {
    const data = await apiGet<any[]>('/resources', { batch_id: safeBatchId });
    if (!data) return [];

    return data.map((r) => ({
      id: String(r.id),
      batch_id: String(r.batch_id),
      name: r.name,
      type: r.type,
      url: r.url,
      description: r.description || null,
      created_at: r.created_at || '',
      updated_at: r.updated_at || '',
    }));
  } catch (err) {
    console.error('[getResourcesByBatchId error]:', err);
    return [];
  }
}

/**
 * Retrieves resources across batches from FastAPI.
 */
export async function getAllResources(filters?: {
  search?: string;
  batchId?: string;
  type?: string;
}): Promise<MasterResourceRecord[]> {
  const safeBatchId =
    filters?.batchId && filters.batchId !== 'all'
      ? assertUuid(filters.batchId, 'batchId')
      : undefined;
  try {
    const params: Record<string, string> = {};
    if (safeBatchId) params.batch_id = safeBatchId;

    const data = await apiGet<any[]>('/resources', params);
    if (!data) return [];

    return data.map((r) => ({
      id: String(r.id),
      batch_id: String(r.batch_id),
      name: r.name,
      type: r.type,
      url: r.url,
      description: r.description || null,
      created_at: r.created_at || '',
      updated_at: r.updated_at || '',
      batch_code: r.batch_code || 'Cohort',
      college_name: r.college_name || 'Institution',
      program_name: r.program_name || 'Program',
    }));
  } catch (err) {
    console.error('[getAllResources error]:', err);
    return [];
  }
}

/**
 * Creates a new learning resource via FastAPI.
 */
export async function createResource(data: ResourceInput): Promise<{ id: string }> {
  const safeBatchId = assertUuid(data.batchId, 'batchId');
  const resourceTitle = (data.title || data.name || '').trim();
  const payload = {
    batch_id: safeBatchId,
    title: resourceTitle,
    type: data.type || 'google_drive',
    url: data.url.trim(),
    description: data.description?.trim() || null,
  };

  const res = await apiPost<{ id: string }>('/resources', payload);
  return { id: String(res.id) };
}
