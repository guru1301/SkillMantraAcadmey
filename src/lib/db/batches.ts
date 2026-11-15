/**
 * Batches Data Access Layer — Fully migrated to FastAPI Backend.
 */
import { apiGet, apiPost, apiPatch } from '@/lib/api/client';
import { BatchInput } from '@/lib/validations/batch';
import { assertUuid } from '@/lib/validations/ids';

export interface BatchWithDetails {
  id: string;
  code: string;
  college_id: string;
  college_name: string;
  college_city: string | null;
  program_id: string;
  program_name: string;
  start_date: string;
  end_date: string;
  target_strength: number;
  actual_students_count: number;
  trainers_count: number;
  assigned_trainers: string | null;
  sessions_count: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface BatchStats {
  targetStrength: number;
  actualStudents: number;
  assignedTrainers: number;
  totalSessions: number;
  attendancePercentage: number;
  assessmentsCount: number;
}

/**
 * Retrieves batches matching optional filters from FastAPI.
 */
export async function getBatches(filters?: {
  collegeId?: string;
  programId?: string;
  status?: string;
  search?: string;
}): Promise<BatchWithDetails[]> {
  const safeCollegeId =
    filters?.collegeId && filters.collegeId !== 'all'
      ? assertUuid(filters.collegeId, 'collegeId')
      : undefined;
  const safeProgramId =
    filters?.programId && filters.programId !== 'all'
      ? assertUuid(filters.programId, 'programId')
      : undefined;

  try {
    const params: Record<string, string> = {};
    if (safeCollegeId) params.college_id = safeCollegeId;
    if (safeProgramId) params.program_id = safeProgramId;
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.search?.trim()) params.search = filters.search.trim();

    const batches = await apiGet<BatchWithDetails[]>('/batches', params);
    return batches || [];
  } catch (err) {
    console.error('[getBatches error]:', err);
    return [];
  }
}

/**
 * Retrieves a single batch by ID from FastAPI.
 */
export async function getBatchById(id: string): Promise<BatchWithDetails | null> {
  const safeBatchId = assertUuid(id, 'batchId');
  try {
    return await apiGet<BatchWithDetails>(`/batches/${safeBatchId}`);
  } catch (err) {
    console.error('[getBatchById error]:', err);
    return null;
  }
}

/**
 * Retrieves operational metrics for a batch from FastAPI.
 */
export async function getBatchStats(batchId: string): Promise<BatchStats> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  try {
    const stats = await apiGet<any>(`/batches/${safeBatchId}/stats`);
    if (!stats) {
      return {
        targetStrength: 0,
        actualStudents: 0,
        assignedTrainers: 0,
        totalSessions: 0,
        attendancePercentage: 0,
        assessmentsCount: 0,
      };
    }
    return {
      targetStrength: Number(stats.targetStrength || stats.target_strength || 0),
      actualStudents: Number(stats.actualStudents || stats.actual_students || stats.enrolledStudents || 0),
      assignedTrainers: Number(stats.assignedTrainers || stats.assigned_trainers || 0),
      totalSessions: Number(stats.totalSessions || stats.total_sessions || 0),
      attendancePercentage: Number(stats.attendancePercentage || stats.attendance_rate || 0),
      assessmentsCount: Number(stats.assessmentsCount || 0),
    };
  } catch (err) {
    console.error('[getBatchStats error]:', err);
    return {
      targetStrength: 0,
      actualStudents: 0,
      assignedTrainers: 0,
      totalSessions: 0,
      attendancePercentage: 0,
      assessmentsCount: 0,
    };
  }
}

/**
 * Provisions a new cohort batch via FastAPI.
 */
export async function createBatch(data: BatchInput, _adminId?: string): Promise<{ id: string }> {
  const safeCollegeId = assertUuid(data.collegeId, 'collegeId');
  const safeProgramId = assertUuid(data.programId, 'programId');
  const payload = {
    code: data.code.trim().toUpperCase(),
    college_id: safeCollegeId,
    program_id: safeProgramId,
    start_date: data.startDate,
    end_date: data.endDate,
    target_strength: data.targetStrength || 0,
    status: data.status || 'planned',
  };

  const res = await apiPost<{ id: string }>('/batches', payload);
  return { id: String(res.id) };
}

/**
 * Updates batch progression status via FastAPI.
 */
export async function updateBatchStatus(
  batchId: string,
  status: 'planned' | 'active' | 'completed' | 'cancelled'
): Promise<boolean> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  await apiPatch(`/batches/${safeBatchId}/status`, { status });
  return true;
}
