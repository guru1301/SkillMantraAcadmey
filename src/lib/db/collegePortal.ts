/**
 * College Portal Data Access Layer — Fully migrated to FastAPI Backend.
 * Direct SQL queries have been retired in Stage D.
 */
import { apiGet } from '@/lib/api/client';
import { assertUuid } from '@/lib/validations/ids';

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
 * Retrieves all data scoped strictly to a specific college via FastAPI.
 * Enforces multi-tenant data isolation.
 */
export async function getCollegePortalData(
  collegeId: string
): Promise<CollegePortalOverview | null> {
  const safeCollegeId =
    collegeId !== undefined && collegeId !== ''
      ? assertUuid(collegeId, 'collegeId')
      : '';
  try {
    const endpoint = safeCollegeId
      ? `/colleges/${safeCollegeId}/portal-overview`
      : '/colleges/portal-overview';
    const data = await apiGet<CollegePortalOverview>(endpoint);
    if (!data || !data.college) return null;

    return {
      college: {
        id: String(data.college.id),
        name: data.college.name,
        city: data.college.city ?? null,
        state: data.college.state ?? null,
        contact_name: data.college.contact_name ?? null,
        contact_email: data.college.contact_email ?? null,
        contact_phone: data.college.contact_phone ?? null,
      },
      stats: {
        totalBatches: Number(data.stats?.totalBatches || 0),
        activeBatches: Number(data.stats?.activeBatches || 0),
        totalStudents: Number(data.stats?.totalStudents || 0),
        totalTrainers: Number(data.stats?.totalTrainers || 0),
        totalPrograms: Number(data.stats?.totalPrograms || 0),
      },
      batches: (data.batches || []).map((b) => ({
        id: String(b.id),
        code: b.code,
        program_name: b.program_name,
        start_date: b.start_date,
        end_date: b.end_date,
        target_strength: Number(b.target_strength || 0),
        enrolled_count: Number(b.enrolled_count || 0),
        trainers_count: Number(b.trainers_count || 0),
        status: b.status,
      })),
      trainers: (data.trainers || []).map((t) => ({
        id: String(t.id),
        full_name: t.full_name,
        email: t.email ?? null,
        phone: t.phone ?? null,
        skills: t.skills ?? null,
        batch_code: t.batch_code,
        is_lead: Boolean(t.is_lead),
        role: t.role,
        status: t.status,
      })),
      students: (data.students || []).map((s) => ({
        id: String(s.id),
        roll_number: s.roll_number,
        full_name: s.full_name,
        email: s.email ?? null,
        phone: s.phone ?? null,
        department: s.department ?? null,
        year_or_semester: s.year_or_semester ?? null,
        batch_code: s.batch_code,
        enrolled_at: s.enrolled_at,
      })),
      resources: (data.resources || []).map((r) => ({
        id: String(r.id),
        name: r.name,
        type: r.type,
        url: r.url,
        description: r.description ?? null,
        batch_code: r.batch_code,
      })),
    };
  } catch (error: any) {
    console.error('[getCollegePortalData error]:', error?.message || error);
    return null;
  }
}
