/**
 * Programs Data Access Layer — Fully migrated to FastAPI Backend.
 */
import { apiGet, apiPost, apiDelete } from '@/lib/api/client';
import { ProgramInput } from '@/lib/validations/program';
import { assertUuid } from '@/lib/validations/ids';
import { ApiError } from '@/lib/api/errors';

export interface ProgramRecord {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  batches_count?: number;
}

/**
 * Retrieves programs from FastAPI.
 */
export async function getPrograms(filters?: { status?: string }): Promise<ProgramRecord[]> {
  try {
    const params: Record<string, string> = {};
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    const programs = await apiGet<ProgramRecord[]>('/programs', params);
    return programs || [];
  } catch (err) {
    console.error('[getPrograms error]:', err);
    return [];
  }
}

/**
 * Retrieves a single program by ID with batch counts from FastAPI.
 */
export async function getProgramById(id: string): Promise<ProgramRecord | null> {
  const safeProgramId = assertUuid(id, 'programId');
  try {
    return await apiGet<ProgramRecord>(`/programs/${safeProgramId}`);
  } catch (err) {
    console.error('[getProgramById error]:', err);
    return null;
  }
}

/**
 * Retrieves programs associated with a college from FastAPI.
 */
export async function getProgramsByCollegeId(collegeId: string): Promise<ProgramRecord[]> {
  const safeCollegeId = assertUuid(collegeId, 'collegeId');
  try {
    const programs = await apiGet<ProgramRecord[]>('/programs', { college_id: safeCollegeId });
    return programs || [];
  } catch (err) {
    console.error('[getProgramsByCollegeId error]:', err);
    return [];
  }
}

/**
 * Creates a new program curriculum via FastAPI.
 */
export async function createProgram(data: ProgramInput): Promise<{ id: string }> {
  const payload = {
    name: data.name.trim(),
    description: data.description?.trim() || null,
    duration_days: data.durationDays || 30,
    status: data.status || 'active',
  };

  const res = await apiPost<{ id: string }>('/programs', payload);
  return { id: String(res.id) };
}

/**
 * Deletes a program curriculum via FastAPI.
 */
export async function deleteProgram(id: string): Promise<{ success: boolean; error?: string }> {
  const safeProgramId = assertUuid(id, 'programId');
  try {
    await apiDelete(`/programs/${safeProgramId}`);
    return { success: true };
  } catch (err: any) {
    if (err instanceof ApiError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to delete program.' };
  }
}
