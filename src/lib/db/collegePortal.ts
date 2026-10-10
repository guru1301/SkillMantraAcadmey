import { query } from '@/lib/db';

export interface CollegePortalOverview {
  college: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  };
  stats: {
    totalBatches: number;
    activeBatches: number;
    totalStudents: number;
    totalTrainers: number;
    totalPrograms: number;
  };
  batches: Array<{
    id: string;
    code: string;
    program_name: string;
    start_date: string;
    end_date: string;
    target_strength: number;
    enrolled_count: number;
    trainers_count: number;
    status: string;
  }>;
  trainers: Array<{
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    skills: string | null;
    batch_code: string;
    is_lead: boolean;
    role: string;
    status: string;
  }>;
  students: Array<{
    id: string;
    roll_number: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    department: string | null;
    year_or_semester: string | null;
    batch_code: string;
    enrolled_at: string;
  }>;
  resources: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    description: string | null;
    batch_code: string;
  }>;
}

/**
 * Retrieves all data scoped strictly to a specific college.
 * Enforces multi-tenant data isolation.
 */
export async function getCollegePortalData(
  collegeId: string
): Promise<CollegePortalOverview | null> {
  // 1. Fetch college details and all related cohort data in parallel to eliminate network waterfalls
  const [collegeRows, batchRows, trainerRows, studentRows, resourceRows] =
    await Promise.all([
      query<any>(
        `SELECT id, name, city, state, contact_name, contact_email, contact_phone 
         FROM colleges 
         WHERE id = $1 AND status = 'active' 
         LIMIT 1`,
        [collegeId]
      ),
      query<any>(
        `SELECT 
           b.id,
           b.code,
           p.name as program_name,
           b.start_date::text as start_date,
           b.end_date::text as end_date,
           b.target_strength,
           b.status,
           COUNT(DISTINCT bs.id)::int as enrolled_count,
           COUNT(DISTINCT bt.id)::int as trainers_count
         FROM batches b
         JOIN programs p ON p.id = b.program_id
         LEFT JOIN batch_students bs ON bs.batch_id = b.id
         LEFT JOIN batch_trainers bt ON bt.batch_id = b.id
         WHERE b.college_id = $1
         GROUP BY b.id, p.name
         ORDER BY b.start_date DESC, b.created_at DESC`,
        [collegeId]
      ),
      query<any>(
        `SELECT DISTINCT
           t.id,
           t.full_name,
           t.email,
           t.phone,
           t.skills,
           t.status,
           b.code as batch_code,
           bt.is_lead,
           bt.role
         FROM batch_trainers bt
         JOIN batches b ON b.id = bt.batch_id
         JOIN trainers t ON t.id = bt.trainer_id
         WHERE b.college_id = $1
         ORDER BY bt.is_lead DESC, t.full_name ASC`,
        [collegeId]
      ),
      query<any>(
        `SELECT 
           s.id,
           s.roll_number,
           s.full_name,
           s.email,
           s.phone,
           s.department,
           s.year_or_semester,
           b.code as batch_code,
           bs.enrolled_at::text as enrolled_at
         FROM batch_students bs
         JOIN batches b ON b.id = bs.batch_id
         JOIN students s ON s.id = bs.student_id
         WHERE b.college_id = $1
         ORDER BY b.code ASC, s.roll_number ASC`,
        [collegeId]
      ),
      query<any>(
        `SELECT 
           r.id,
           r.name,
           r.type,
           r.url,
           r.description,
           b.code as batch_code
         FROM resources r
         JOIN batches b ON b.id = r.batch_id
         WHERE b.college_id = $1
         ORDER BY r.created_at DESC`,
        [collegeId]
      ),
    ]);

  if (!collegeRows || collegeRows.length === 0) {
    return null;
  }

  const college = collegeRows[0];

  // Calculate aggregated metrics
  const totalBatches = batchRows.length;
  const activeBatches = batchRows.filter((b) => b.status === 'active').length;
  const totalStudents = studentRows.length;
  const distinctTrainerIds = new Set(trainerRows.map((t) => t.id));
  const distinctProgramNames = new Set(batchRows.map((b) => b.program_name));

  return {
    college,
    stats: {
      totalBatches,
      activeBatches,
      totalStudents,
      totalTrainers: distinctTrainerIds.size,
      totalPrograms: distinctProgramNames.size,
    },
    batches: batchRows,
    trainers: trainerRows,
    students: studentRows,
    resources: resourceRows,
  };
}
