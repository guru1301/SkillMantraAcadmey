/**
 * College Data Access Layer — Fully migrated to FastAPI Backend.
 */
import { apiGet, apiPost, apiPut, apiPatch } from '@/lib/api/client';
import { CollegeInput } from '@/lib/validations/college';
import { assertUuid } from '@/lib/validations/ids';

export interface CollegeWithCounts {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  active_batches_count: number;
  enrolled_students_count: number;
}

export interface CollegeStats {
  programsCount: number;
  activeBatchesCount: number;
  totalBatchesCount: number;
  enrolledStudentsCount: number;
  assignedTrainersCount: number;
}

/**
 * Retrieves colleges matching optional filters from FastAPI.
 */
export async function getColleges(filters?: {
  search?: string;
  status?: string;
  city?: string;
}): Promise<CollegeWithCounts[]> {
  try {
    const params: Record<string, string> = {};
    if (filters?.search?.trim()) params.search = filters.search.trim();
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.city && filters.city !== 'all') params.city = filters.city;

    const colleges = await apiGet<CollegeWithCounts[]>('/colleges', params);
    return colleges || [];
  } catch (err) {
    console.error('[getColleges error]:', err);
    return [];
  }
}

/**
 * Retrieves sorted list of unique cities from FastAPI.
 */
export async function getDistinctCities(): Promise<string[]> {
  try {
    const cities = await apiGet<string[]>('/colleges/cities');
    return cities || [];
  } catch (err) {
    console.error('[getDistinctCities error]:', err);
    return [];
  }
}

/**
 * Retrieves a single college by ID with batch counts from FastAPI.
 */
export async function getCollegeById(id: string): Promise<CollegeWithCounts | null> {
  const safeCollegeId = assertUuid(id, 'collegeId');
  try {
    return await apiGet<CollegeWithCounts>(`/colleges/${safeCollegeId}`);
  } catch (err) {
    console.error('[getCollegeById error]:', err);
    return null;
  }
}

/**
 * Retrieves operational statistics for a college from FastAPI.
 */
export async function getCollegeStats(collegeId: string): Promise<CollegeStats> {
  const safeCollegeId = assertUuid(collegeId, 'collegeId');
  try {
    const stats = await apiGet<CollegeStats>(`/colleges/${safeCollegeId}/stats`);
    return (
      stats || {
        programsCount: 0,
        activeBatchesCount: 0,
        totalBatchesCount: 0,
        enrolledStudentsCount: 0,
        assignedTrainersCount: 0,
      }
    );
  } catch (err) {
    console.error('[getCollegeStats error]:', err);
    return {
      programsCount: 0,
      activeBatchesCount: 0,
      totalBatchesCount: 0,
      enrolledStudentsCount: 0,
      assignedTrainersCount: 0,
    };
  }
}

/**
 * Onboards a new college via FastAPI.
 */
export async function createCollege(data: CollegeInput): Promise<{ id: string }> {
  const payload = {
    name: data.name.trim(),
    city: data.city?.trim() || null,
    state: data.state?.trim() || null,
    contact_name: data.contactName?.trim() || null,
    contact_email: data.contactEmail?.trim().toLowerCase() || null,
    contact_phone: data.contactPhone?.trim() || null,
    logo_url: data.logoUrl?.trim() || null,
    status: data.status || 'active',
  };

  const res = await apiPost<{ id: string }>('/colleges', payload);
  return { id: String(res.id) };
}

/**
 * Updates college metadata via FastAPI.
 */
export async function updateCollege(id: string, data: CollegeInput): Promise<boolean> {
  const safeCollegeId = assertUuid(id, 'collegeId');
  const payload = {
    name: data.name.trim(),
    city: data.city?.trim() || null,
    state: data.state?.trim() || null,
    contact_name: data.contactName?.trim() || null,
    contact_email: data.contactEmail?.trim().toLowerCase() || null,
    contact_phone: data.contactPhone?.trim() || null,
    logo_url: data.logoUrl?.trim() || null,
    status: data.status || 'active',
  };

  await apiPut(`/colleges/${safeCollegeId}`, payload);
  return true;
}

/**
 * Toggles a college's active/inactive status via FastAPI.
 */
export async function updateCollegeStatus(id: string, status: 'active' | 'inactive'): Promise<boolean> {
  const safeCollegeId = assertUuid(id, 'collegeId');
  await apiPatch(`/colleges/${safeCollegeId}/status`, { status });
  return true;
}
