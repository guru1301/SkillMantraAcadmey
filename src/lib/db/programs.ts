import { query } from '@/lib/db';
import { ProgramInput } from '@/lib/validations/program';

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

export async function getPrograms(filters?: { status?: string }): Promise<ProgramRecord[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.status && filters.status !== 'all') {
    params.push(filters.status);
    whereClauses.push(`p.status = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sqlQuery = `
    SELECT 
      p.id, 
      p.name, 
      p.description, 
      p.duration_days, 
      p.status, 
      p.created_at, 
      p.updated_at,
      COUNT(b.id)::int as batches_count
    FROM programs p
    LEFT JOIN batches b ON b.program_id = p.id
    ${whereSql}
    GROUP BY p.id
    ORDER BY p.name ASC
  `;

  return query<ProgramRecord>(sqlQuery, params);
}

export async function getProgramById(id: string): Promise<ProgramRecord | null> {
  const rows = await query<ProgramRecord>(
    `
    SELECT 
      p.id, 
      p.name, 
      p.description, 
      p.duration_days, 
      p.status, 
      p.created_at, 
      p.updated_at,
      COUNT(b.id)::int as batches_count
    FROM programs p
    LEFT JOIN batches b ON b.program_id = p.id
    WHERE p.id = $1
    GROUP BY p.id
    LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
}

export async function getProgramsByCollegeId(collegeId: string): Promise<ProgramRecord[]> {
  return query<ProgramRecord>(
    `
    SELECT DISTINCT
      p.id, 
      p.name, 
      p.description, 
      p.duration_days, 
      p.status, 
      p.created_at, 
      p.updated_at,
      COUNT(b.id)::int as batches_count
    FROM programs p
    JOIN batches b ON b.program_id = p.id
    WHERE b.college_id = $1
    GROUP BY p.id
    ORDER BY p.name ASC
    `,
    [collegeId]
  );
}

export async function createProgram(data: ProgramInput): Promise<{ id: string }> {
  const rows = await query<{ id: string }>(
    `
    INSERT INTO programs (name, description, duration_days, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
    [
      data.name.trim(),
      data.description?.trim() || null,
      data.durationDays || 30,
      data.status || 'active',
    ]
  );
  return rows[0];
}
