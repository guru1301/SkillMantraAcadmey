import { query } from '@/lib/db';
import { TrainerInput } from '@/lib/validations/trainer';

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

/**
 * Retrieves all trainers with optional search and status filtering.
 */
export async function getTrainers(filters?: {
  search?: string;
  status?: string;
}): Promise<TrainerWithCounts[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.search?.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    whereClauses.push(
      `(LOWER(t.full_name) LIKE $${params.length} OR LOWER(COALESCE(t.email, '')) LIKE $${params.length} OR LOWER(COALESCE(t.skills, '')) LIKE $${params.length})`
    );
  }

  if (filters?.status && filters.status !== 'all') {
    params.push(filters.status);
    whereClauses.push(`t.status = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sqlQuery = `
    SELECT 
      t.id,
      t.full_name,
      t.email,
      t.phone,
      t.skills,
      t.status,
      t.created_at::text as created_at,
      t.updated_at::text as updated_at,
      COUNT(DISTINCT bt.batch_id)::int as assigned_batches_count
    FROM trainers t
    LEFT JOIN batch_trainers bt ON bt.trainer_id = t.id
    ${whereSql}
    GROUP BY t.id
    ORDER BY t.created_at DESC, t.full_name ASC
  `;

  return query<TrainerWithCounts>(sqlQuery, params);
}

/**
 * Retrieves a trainer by ID along with their historical and active batch assignments.
 */
export async function getTrainerById(id: string): Promise<TrainerDetailRecord | null> {
  const trainerRows = await query<TrainerWithCounts>(
    `
    SELECT 
      t.id,
      t.full_name,
      t.email,
      t.phone,
      t.skills,
      t.status,
      t.created_at::text as created_at,
      t.updated_at::text as updated_at,
      COUNT(DISTINCT bt.batch_id)::int as assigned_batches_count
    FROM trainers t
    LEFT JOIN batch_trainers bt ON bt.trainer_id = t.id
    WHERE t.id = $1
    GROUP BY t.id
    LIMIT 1
    `,
    [id]
  );

  if (trainerRows.length === 0) return null;

  const batchRows = await query<{
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
  }>(
    `
    SELECT 
      b.id as batch_id,
      b.code as batch_code,
      c.name as college_name,
      p.name as program_name,
      b.start_date::text as start_date,
      b.end_date::text as end_date,
      b.status as batch_status,
      bt.is_lead,
      bt.role,
      bt.assigned_at::text as assigned_at
    FROM batch_trainers bt
    JOIN batches b ON b.id = bt.batch_id
    JOIN colleges c ON c.id = b.college_id
    JOIN programs p ON p.id = b.program_id
    WHERE bt.trainer_id = $1
    ORDER BY b.start_date DESC
    `,
    [id]
  );

  return {
    ...trainerRows[0],
    assigned_batches: batchRows,
  };
}

/**
 * Inserts a new trainer into the master trainers table.
 */
export async function createTrainer(data: TrainerInput): Promise<{ id: string }> {
  const rows = await query<{ id: string }>(
    `
    INSERT INTO trainers (full_name, email, phone, skills, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [
      data.fullName.trim(),
      data.email?.trim().toLowerCase() || null,
      data.phone?.trim() || null,
      data.skills?.trim() || null,
      data.status || 'active',
    ]
  );
  return rows[0];
}

/**
 * Updates an existing trainer's details.
 */
export async function updateTrainer(id: string, data: TrainerInput): Promise<boolean> {
  const rows = await query(
    `
    UPDATE trainers
    SET 
      full_name = $1,
      email = $2,
      phone = $3,
      skills = $4,
      status = $5,
      updated_at = NOW()
    WHERE id = $6
    RETURNING id
    `,
    [
      data.fullName.trim(),
      data.email?.trim().toLowerCase() || null,
      data.phone?.trim() || null,
      data.skills?.trim() || null,
      data.status || 'active',
      id,
    ]
  );
  return rows.length > 0;
}

/**
 * Toggles a trainer's active/inactive status.
 */
export async function setTrainerStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<boolean> {
  const rows = await query(
    `UPDATE trainers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
    [status, id]
  );
  return rows.length > 0;
}

/**
 * Retrieves all trainers assigned to a specific batch.
 */
export async function getTrainersByBatchId(batchId: string): Promise<BatchAssignedTrainer[]> {
  const sql = `
    SELECT 
      bt.id as assignment_id,
      t.id as trainer_id,
      t.full_name,
      t.email,
      t.phone,
      t.skills,
      t.status as trainer_status,
      bt.is_lead,
      bt.role,
      bt.assigned_at::text as assigned_at
    FROM batch_trainers bt
    JOIN trainers t ON t.id = bt.trainer_id
    WHERE bt.batch_id = $1
    ORDER BY bt.is_lead DESC, bt.assigned_at ASC, t.full_name ASC
  `;
  return query<BatchAssignedTrainer>(sql, [batchId]);
}

/**
 * Retrieves active trainers who are NOT currently assigned to the given batch.
 */
export async function getAvailableTrainersForBatch(
  batchId: string
): Promise<Array<{ id: string; full_name: string; email: string | null; skills: string | null }>> {
  const sql = `
    SELECT id, full_name, email, skills
    FROM trainers
    WHERE status = 'active'
      AND id NOT IN (
        SELECT trainer_id FROM batch_trainers WHERE batch_id = $1
      )
    ORDER BY full_name ASC
  `;
  return query(sql, [batchId]);
}

/**
 * Assigns an existing active trainer to a batch.
 * Enforces business logic:
 * - Trainer must be active.
 * - If isLead is true, checks that batch does not already have a lead trainer.
 */
export async function assignTrainerToBatch(data: {
  batchId: string;
  trainerId: string;
  isLead: boolean;
  role?: string;
}): Promise<{ id: string }> {
  // 1. Verify trainer exists and is active
  const trainerCheck = await query<{ status: string }>(
    `SELECT status FROM trainers WHERE id = $1`,
    [data.trainerId]
  );

  if (trainerCheck.length === 0) {
    throw new Error('Trainer not found.');
  }

  if (trainerCheck[0].status !== 'active') {
    throw new Error('Cannot assign an inactive trainer. Please activate the trainer profile first.');
  }

  // 2. If assigning as lead, ensure no existing lead trainer in batch
  if (data.isLead) {
    const leadCheck = await query<{ id: string }>(
      `SELECT id FROM batch_trainers WHERE batch_id = $1 AND is_lead = true`,
      [data.batchId]
    );

    if (leadCheck.length > 0) {
      throw new Error(
        'This batch already has a designated lead trainer. To change the lead trainer, use the Change Lead action.'
      );
    }
  }

  const role = data.isLead ? 'Lead Trainer' : data.role?.trim() || 'Assistant Trainer';

  const rows = await query<{ id: string }>(
    `
    INSERT INTO batch_trainers (batch_id, trainer_id, is_lead, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
    [data.batchId, data.trainerId, data.isLead, role]
  );

  return rows[0];
}

/**
 * Changes the lead trainer for a batch atomically.
 * Resets all assignments in the batch to is_lead = false, then sets the selected trainer to is_lead = true.
 */
export async function setLeadTrainer(batchId: string, trainerId: string): Promise<boolean> {
  // 1. Ensure trainer is assigned to this batch
  const existing = await query<{ id: string }>(
    `SELECT id FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2`,
    [batchId, trainerId]
  );

  if (existing.length === 0) {
    throw new Error('Trainer is not currently assigned to this batch.');
  }

  // 2. Demote existing lead trainer(s)
  await query(
    `UPDATE batch_trainers SET is_lead = false, role = 'Assistant Trainer' WHERE batch_id = $1 AND is_lead = true`,
    [batchId]
  );

  // 3. Promote target trainer
  const promoted = await query(
    `UPDATE batch_trainers SET is_lead = true, role = 'Lead Trainer' WHERE batch_id = $1 AND trainer_id = $2 RETURNING id`,
    [batchId, trainerId]
  );

  return promoted.length > 0;
}

/**
 * Removes a trainer assignment from a batch without deleting the master trainer record.
 */
export async function removeTrainerFromBatch(
  batchId: string,
  trainerId: string
): Promise<boolean> {
  const rows = await query(
    `DELETE FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2 RETURNING id`,
    [batchId, trainerId]
  );
  return rows.length > 0;
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
 * Retrieves all trainers assigned to cohorts at a specific college.
 */
export async function getTrainersByCollegeId(
  collegeId: string
): Promise<CollegeAssignedTrainerRecord[]> {
  const sql = `
    SELECT 
      t.id as trainer_id,
      t.full_name,
      t.email,
      t.phone,
      t.skills,
      t.status as trainer_status,
      bt.is_lead,
      bt.role,
      b.code as batch_code,
      b.id as batch_id,
      p.name as program_name,
      b.start_date::text as start_date,
      b.end_date::text as end_date
    FROM batch_trainers bt
    JOIN trainers t ON t.id = bt.trainer_id
    JOIN batches b ON b.id = bt.batch_id
    JOIN programs p ON p.id = b.program_id
    WHERE b.college_id = $1
    ORDER BY b.start_date DESC, bt.is_lead DESC
  `;
  return query<CollegeAssignedTrainerRecord>(sql, [collegeId]);
}

