import { query } from '@/lib/db';
import { ResourceInput } from '@/lib/validations/resource';

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

export async function getResourcesByBatchId(batchId: string): Promise<ResourceRecord[]> {
  return query<ResourceRecord>(
    `
    SELECT id, batch_id, name, type, url, description, created_at, updated_at
    FROM resources
    WHERE batch_id = $1
    ORDER BY created_at DESC
    `,
    [batchId]
  );
}

export async function createResource(data: ResourceInput): Promise<{ id: string }> {
  const rows = await query<{ id: string }>(
    `
    INSERT INTO resources (batch_id, name, type, url, description)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [
      data.batchId,
      data.name.trim(),
      data.type || 'google_drive',
      data.url.trim(),
      data.description?.trim() || null,
    ]
  );
  return rows[0];
}
