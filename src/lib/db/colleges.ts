import { query } from '@/lib/db';
import { CollegeInput } from '@/lib/validations/college';

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

export async function getColleges(filters?: {
  search?: string;
  status?: string;
  city?: string;
}): Promise<CollegeWithCounts[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters?.search?.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    whereClauses.push(
      `(LOWER(c.name) LIKE $${params.length} OR LOWER(COALESCE(c.city, '')) LIKE $${params.length})`
    );
  }

  if (filters?.status && filters.status !== 'all') {
    params.push(filters.status);
    whereClauses.push(`c.status = $${params.length}`);
  }

  if (filters?.city && filters.city !== 'all') {
    params.push(filters.city.toLowerCase());
    whereClauses.push(`LOWER(COALESCE(c.city, '')) = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sqlQuery = `
    SELECT 
      c.id, 
      c.name, 
      c.city, 
      c.state, 
      c.contact_name, 
      c.contact_email, 
      c.contact_phone, 
      c.logo_url, 
      c.status, 
      c.created_at, 
      c.updated_at,
      COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END)::int as active_batches_count,
      COUNT(DISTINCT bs.id)::int as enrolled_students_count
    FROM colleges c
    LEFT JOIN batches b ON b.college_id = c.id
    LEFT JOIN batch_students bs ON bs.batch_id = b.id
    ${whereSql}
    GROUP BY c.id
    ORDER BY c.created_at DESC, c.name ASC
  `;

  return query<CollegeWithCounts>(sqlQuery, params);
}

export async function getDistinctCities(): Promise<string[]> {
  const rows = await query<{ city: string }>(
    `SELECT DISTINCT city FROM colleges WHERE city IS NOT NULL AND TRIM(city) != '' ORDER BY city ASC`
  );
  return rows.map((r) => r.city);
}

export async function getCollegeById(id: string): Promise<CollegeWithCounts | null> {
  const rows = await query<CollegeWithCounts>(
    `
    SELECT 
      c.id, 
      c.name, 
      c.city, 
      c.state, 
      c.contact_name, 
      c.contact_email, 
      c.contact_phone, 
      c.logo_url, 
      c.status, 
      c.created_at, 
      c.updated_at,
      COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END)::int as active_batches_count,
      COUNT(DISTINCT bs.id)::int as enrolled_students_count
    FROM colleges c
    LEFT JOIN batches b ON b.college_id = c.id
    LEFT JOIN batch_students bs ON bs.batch_id = b.id
    WHERE c.id = $1
    GROUP BY c.id
    LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
}

export async function getCollegeStats(collegeId: string): Promise<CollegeStats> {
  const rows = await query<{
    programs_count: number;
    total_batches: number;
    active_batches: number;
    enrolled_students: number;
    assigned_trainers: number;
  }>(
    `
    SELECT 
      COUNT(DISTINCT b.program_id)::int as programs_count,
      COUNT(DISTINCT b.id)::int as total_batches,
      COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END)::int as active_batches,
      (
        SELECT COUNT(DISTINCT bs.id)::int 
        FROM batch_students bs 
        JOIN batches b2 ON b2.id = bs.batch_id 
        WHERE b2.college_id = $1
      ) as enrolled_students,
      (
        SELECT COUNT(DISTINCT bt.trainer_id)::int 
        FROM batch_trainers bt 
        JOIN batches b3 ON b3.id = bt.batch_id 
        WHERE b3.college_id = $1
      ) as assigned_trainers
    FROM batches b
    WHERE b.college_id = $1
    `,
    [collegeId]
  );

  const r = rows[0];
  return {
    programsCount: Number(r?.programs_count ?? 0),
    activeBatchesCount: Number(r?.active_batches ?? 0),
    totalBatchesCount: Number(r?.total_batches ?? 0),
    enrolledStudentsCount: Number(r?.enrolled_students ?? 0),
    assignedTrainersCount: Number(r?.assigned_trainers ?? 0),
  };
}

export async function createCollege(data: CollegeInput): Promise<{ id: string }> {
  const rows = await query<{ id: string }>(
    `
    INSERT INTO colleges (name, city, state, contact_name, contact_email, contact_phone, logo_url, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [
      data.name.trim(),
      data.city?.trim() || null,
      data.state?.trim() || null,
      data.contactName?.trim() || null,
      data.contactEmail?.trim().toLowerCase() || null,
      data.contactPhone?.trim() || null,
      data.logoUrl?.trim() || null,
      data.status || 'active',
    ]
  );
  return rows[0];
}

export async function updateCollege(
  id: string,
  data: CollegeInput
): Promise<boolean> {
  const rows = await query(
    `
    UPDATE colleges
    SET 
      name = $1,
      city = $2,
      state = $3,
      contact_name = $4,
      contact_email = $5,
      contact_phone = $6,
      logo_url = $7,
      status = $8,
      updated_at = NOW()
    WHERE id = $9
    RETURNING id
    `,
    [
      data.name.trim(),
      data.city?.trim() || null,
      data.state?.trim() || null,
      data.contactName?.trim() || null,
      data.contactEmail?.trim().toLowerCase() || null,
      data.contactPhone?.trim() || null,
      data.logoUrl?.trim() || null,
      data.status || 'active',
      id,
    ]
  );
  return rows.length > 0;
}
