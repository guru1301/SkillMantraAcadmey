/**
 * Trainers Data Access Layer — Fully migrated to FastAPI Backend.
 */
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api/client';
import { TrainerInput } from '@/lib/validations/trainer';
import { assertUuid } from '@/lib/validations/ids';

export interface TrainerWithCounts {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  skills: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  assigned_batches_count: number;
}

export interface TrainerDetailRecord extends TrainerWithCounts {
  assigned_batches: Array<{
    batch_id: string;
    batch_code: string;
    college_name: string;
    program_name: string;
    start_date: string;
    end_date: string;
    batch_status: string;
    is_lead: boolean;
    role: string;
    assigned_at: string;
  }>;
}

export interface BatchAssignedTrainer {
  assignment_id: string;
  trainer_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  skills: string | null;
  trainer_status: 'active' | 'inactive';
  is_lead: boolean;
  role: string;
  assigned_at: string;
}

export interface CollegeAssignedTrainerRecord {
  trainer_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  skills: string | null;
  trainer_status: 'active' | 'inactive';
  is_lead: boolean;
  role: string;
  batch_code: string;
  batch_id: string;
  program_name: string;
  start_date: string;
  end_date: string;
}

/**
 * Retrieves all trainers from FastAPI.
 */
export async function getTrainers(filters?: {
  search?: string;
  status?: string;
}): Promise<TrainerWithCounts[]> {
  try {
    const params: Record<string, string> = {};
    if (filters?.search?.trim()) params.search = filters.search.trim();
    if (filters?.status && filters.status !== 'all') params.status = filters.status;

    const data = await apiGet<any[]>('/trainers', params);
    if (!data) return [];

    return data.map((t) => ({
      id: String(t.id),
      full_name: t.name || t.full_name || '',
      email: t.email || null,
      phone: t.phone || null,
      skills: Array.isArray(t.expertise) ? t.expertise.join(', ') : t.skills || t.bio || null,
      status: t.status,
      created_at: t.created_at,
      updated_at: t.updated_at,
      assigned_batches_count: Number(t.assigned_batches_count || 0),
    }));
  } catch (err) {
    console.error('[getTrainers error]:', err);
    return [];
  }
}

/**
 * Retrieves a trainer by ID from FastAPI.
 */
export async function getTrainerById(id: string): Promise<TrainerDetailRecord | null> {
  const safeTrainerId = assertUuid(id, 'trainerId');
  try {
    const t = await apiGet<any>(`/trainers/${safeTrainerId}`);
    if (!t) return null;

    return {
      id: String(t.id),
      full_name: t.name || t.full_name || '',
      email: t.email || null,
      phone: t.phone || null,
      skills: Array.isArray(t.expertise) ? t.expertise.join(', ') : t.skills || t.bio || null,
      status: t.status,
      created_at: t.created_at,
      updated_at: t.updated_at,
      assigned_batches_count: Number(t.assigned_batches_count || 0),
      assigned_batches: (t.assigned_batches || []).map((b: any) => ({
        batch_id: String(b.batch_id),
        batch_code: b.batch_code,
        college_name: b.college_name,
        program_name: b.program_name,
        start_date: b.start_date,
        end_date: b.end_date,
        batch_status: b.batch_status,
        is_lead: Boolean(b.is_lead),
        role: b.role,
        assigned_at: b.assigned_at,
      })),
    };
  } catch (err) {
    console.error('[getTrainerById error]:', err);
    return null;
  }
}

/**
 * Inserts a new trainer via FastAPI.
 */
export async function createTrainer(data: TrainerInput): Promise<{ id: string }> {
  const payload = {
    name: data.fullName.trim(),
    email: data.email?.trim().toLowerCase() || null,
    phone: data.phone?.trim() || null,
    expertise: data.skills ? data.skills.split(',').map((s) => s.trim()) : [],
    status: data.status || 'active',
  };

  const res = await apiPost<{ id: string }>('/trainers', payload);
  return { id: String(res.id) };
}

/**
 * Updates an existing trainer's details via FastAPI.
 */
export async function updateTrainer(id: string, data: TrainerInput): Promise<boolean> {
  const safeTrainerId = assertUuid(id, 'trainerId');
  const payload = {
    name: data.fullName.trim(),
    email: data.email?.trim().toLowerCase() || null,
    phone: data.phone?.trim() || null,
    expertise: data.skills ? data.skills.split(',').map((s) => s.trim()) : [],
    status: data.status || 'active',
  };

  await apiPut(`/trainers/${safeTrainerId}`, payload);
  return true;
}

/**
 * Toggles a trainer's active/inactive status via FastAPI.
 */
export async function setTrainerStatus(id: string, status: 'active' | 'inactive'): Promise<boolean> {
  const safeTrainerId = assertUuid(id, 'trainerId');
  await apiPut(`/trainers/${safeTrainerId}`, { status });
  return true;
}

/**
 * Retrieves all trainers assigned to a specific batch from FastAPI.
 */
export async function getTrainersByBatchId(batchId: string): Promise<BatchAssignedTrainer[]> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  try {
    const data = await apiGet<any[]>(`/batches/${safeBatchId}/trainers`);
    if (!data) return [];

    return data.map((t) => ({
      assignment_id: String(t.assignment_id),
      trainer_id: String(t.trainer_id),
      full_name: t.name || t.full_name || '',
      email: t.email || null,
      phone: t.phone || null,
      skills: Array.isArray(t.expertise) ? t.expertise.join(', ') : t.skills || null,
      trainer_status: t.trainer_status || 'active',
      is_lead: Boolean(t.is_lead),
      role: t.role,
      assigned_at: t.assigned_at,
    }));
  } catch (err) {
    console.error('[getTrainersByBatchId error]:', err);
    return [];
  }
}

/**
 * Retrieves active trainers who are NOT currently assigned to the given batch.
 */
export async function getAvailableTrainersForBatch(
  batchId: string
): Promise<Array<{ id: string; full_name: string; email: string | null; skills: string | null }>> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  try {
    const data = await apiGet<any[]>('/trainers/available', { batch_id: safeBatchId });
    if (!data) return [];

    return data.map((t) => ({
      id: String(t.id),
      full_name: t.name || t.full_name || '',
      email: t.email || null,
      skills: Array.isArray(t.expertise) ? t.expertise.join(', ') : t.skills || null,
    }));
  } catch (err) {
    console.error('[getAvailableTrainersForBatch error]:', err);
    return [];
  }
}

/**
 * Assigns an existing active trainer to a batch via FastAPI.
 */
export async function assignTrainerToBatch(data: {
  batchId: string;
  trainerId: string;
  isLead: boolean;
  role?: string;
}): Promise<{ id: string }> {
  const safeBatchId = assertUuid(data.batchId, 'batchId');
  const safeTrainerId = assertUuid(data.trainerId, 'trainerId');
  const payload = {
    trainer_id: safeTrainerId,
    is_lead: data.isLead,
    role: data.isLead ? 'Lead Trainer' : data.role?.trim() || 'Assistant Trainer',
  };

  const res = await apiPost<{ assignment_id?: string; id?: string }>(
    '/trainers/assign-batch',
    payload,
    { params: { batch_id: safeBatchId } }
  );
  return { id: String(res.assignment_id || res.id || '') };
}

/**
 * Changes the lead trainer for a batch atomically via FastAPI.
 */
export async function setLeadTrainer(batchId: string, trainerId: string): Promise<boolean> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  const safeTrainerId = assertUuid(trainerId, 'trainerId');
  await apiPatch(`/batches/${safeBatchId}/trainers/${safeTrainerId}/lead`, {});
  return true;
}

/**
 * Removes a trainer assignment from a batch via FastAPI.
 */
export async function removeTrainerFromBatch(batchId: string, trainerId: string): Promise<boolean> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  const safeTrainerId = assertUuid(trainerId, 'trainerId');
  await apiDelete(`/batches/${safeBatchId}/trainers/${safeTrainerId}`);
  return true;
}

/**
 * Retrieves all trainers assigned to cohorts at a specific college.
 */
export async function getTrainersByCollegeId(collegeId: string): Promise<CollegeAssignedTrainerRecord[]> {
  const safeCollegeId = assertUuid(collegeId, 'collegeId');
  try {
    const batches = await apiGet<any[]>('/batches', { college_id: safeCollegeId });
    if (!batches || batches.length === 0) return [];

    const results: CollegeAssignedTrainerRecord[] = [];
    for (const b of batches) {
      const safeRowBatchId = assertUuid(b.id, 'batchId');
      const trainers = await apiGet<any[]>(`/batches/${safeRowBatchId}/trainers`);
      if (trainers) {
        for (const t of trainers) {
          results.push({
            trainer_id: String(t.trainer_id),
            full_name: t.name || t.full_name || '',
            email: t.email || null,
            phone: t.phone || null,
            skills: Array.isArray(t.expertise) ? t.expertise.join(', ') : t.skills || null,
            trainer_status: t.trainer_status || 'active',
            is_lead: Boolean(t.is_lead),
            role: t.role,
            batch_code: b.code,
            batch_id: String(b.id),
            program_name: b.program_name,
            start_date: b.start_date,
            end_date: b.end_date,
          });
        }
      }
    }
    return results;
  } catch (err) {
    console.error('[getTrainersByCollegeId error]:', err);
    return [];
  }
}
