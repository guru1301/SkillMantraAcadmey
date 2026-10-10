import { query } from '@/lib/db';
import { BatchInput } from '@/lib/validations/batch';

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

export async function getBatches(filters?: {
  collegeId?: string;
  programId?: string;
  status?: string;
  search?: string;
}): Promise<BatchWithDetails[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.collegeId) {
    params.push(filters.collegeId);
    whereClauses.push(`b.college_id = $${params.length}`);
  }

  if (filters?.programId) {
    params.push(filters.programId);
    whereClauses.push(`b.program_id = $${params.length}`);
  }

  if (filters?.status && filters.status !== 'all') {
    params.push(filters.status);
    whereClauses.push(`b.status = $${params.length}`);
  }

  if (filters?.search?.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    whereClauses.push(
      `(LOWER(b.code) LIKE $${params.length} OR LOWER(c.name) LIKE $${params.length} OR LOWER(p.name) LIKE $${params.length})`
    );
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sqlQuery = `
    SELECT 
      b.id,
      b.code,
      b.college_id,
      c.name as college_name,
      c.city as college_city,
      b.program_id,
      p.name as program_name,
      b.start_date::text as start_date,
      b.end_date::text as end_date,
      b.target_strength,
      COUNT(DISTINCT bs.id)::int as actual_students_count,
      COUNT(DISTINCT ts.id)::int as sessions_count,
      b.status,
      b.created_at,
      b.updated_at
    FROM batches b
    JOIN colleges c ON c.id = b.college_id
    JOIN programs p ON p.id = b.program_id
    LEFT JOIN batch_students bs ON bs.batch_id = b.id
    LEFT JOIN training_sessions ts ON ts.batch_id = b.id
    ${whereSql}
    GROUP BY b.id, c.name, c.city, p.name
    ORDER BY b.start_date DESC, b.created_at DESC
  `;

  return query<BatchWithDetails>(sqlQuery, params);
}

export async function getBatchById(id: string): Promise<BatchWithDetails | null> {
  const rows = await query<BatchWithDetails>(
    `
    SELECT 
      b.id,
      b.code,
      b.college_id,
      c.name as college_name,
      c.city as college_city,
      b.program_id,
      p.name as program_name,
      b.start_date::text as start_date,
      b.end_date::text as end_date,
      b.target_strength,
      COUNT(DISTINCT bs.id)::int as actual_students_count,
      COUNT(DISTINCT ts.id)::int as sessions_count,
      b.status,
      b.created_at,
      b.updated_at
    FROM batches b
    JOIN colleges c ON c.id = b.college_id
    JOIN programs p ON p.id = b.program_id
    LEFT JOIN batch_students bs ON bs.batch_id = b.id
    LEFT JOIN training_sessions ts ON ts.batch_id = b.id
    WHERE b.id = $1
    GROUP BY b.id, c.name, c.city, p.name
    LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
}

export async function getBatchStats(batchId: string): Promise<BatchStats> {
  const rows = await query<{
    target_strength: number;
    actual_students: number;
    assigned_trainers: number;
    total_sessions: number;
  }>(
    `
    SELECT 
      b.target_strength,
      (SELECT COUNT(*)::int FROM batch_students WHERE batch_id = b.id) as actual_students,
      (SELECT COUNT(*)::int FROM batch_trainers WHERE batch_id = b.id) as assigned_trainers,
      (SELECT COUNT(*)::int FROM training_sessions WHERE batch_id = b.id) as total_sessions
    FROM batches b
    WHERE b.id = $1
    `,
    [batchId]
  );

  const r = rows[0];
  return {
    targetStrength: Number(r?.target_strength ?? 0),
    actualStudents: Number(r?.actual_students ?? 0),
    assignedTrainers: Number(r?.assigned_trainers ?? 0),
    totalSessions: Number(r?.total_sessions ?? 0),
    attendancePercentage: 0,
    assessmentsCount: 0,
  };
}

export async function createBatch(
  data: BatchInput,
  adminId?: string
): Promise<{ id: string }> {
  const rows = await query<{ id: string }>(
    `
    INSERT INTO batches (
      code, college_id, program_id, start_date, end_date, target_strength, status, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [
      data.code.trim().toUpperCase(),
      data.collegeId,
      data.programId,
      data.startDate,
      data.endDate,
      data.targetStrength || 0,
      data.status || 'planned',
      adminId || null,
    ]
  );
  return rows[0];
}
