/**
 * Students Data Access Layer — Fully migrated to FastAPI Backend.
 */
import { apiGet, apiPost, apiDelete } from '@/lib/api/client';
import { StudentRowInput } from '@/lib/validations/student';
import { assertUuid } from '@/lib/validations/ids';

export interface EnrolledStudentItem {
  id: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  year_or_semester: string | null;
  enrollment_status: string;
  enrolled_at: string;
  has_credentials?: boolean;
  student_status?: string;
}

export interface CollegeStudentItem {
  id: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  year_or_semester: string | null;
  batches_count: number;
  batch_codes: string | null;
  created_at: string;
}

export interface MasterStudentItem {
  id: string;
  college_id: string;
  college_name: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  year_or_semester: string | null;
  dob?: string | null;
  gender?: string | null;
  status: string;
  must_change_password?: boolean;
  has_credentials?: boolean;
  activated_at?: string | null;
  archived_at?: string | null;
  batches_count: number;
  batch_codes: string | null;
  created_at: string;
}

/**
 * Retrieves all students actively enrolled in a specific batch from FastAPI.
 */
export async function getStudentsByBatchId(batchId: string): Promise<EnrolledStudentItem[]> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  try {
    const data = await apiGet<any[]>('/students', { batch_id: safeBatchId });
    if (!data) return [];

    return data.map((s) => ({
      id: String(s.id),
      roll_number: s.roll_number,
      full_name: s.full_name || s.name || '',
      email: s.email || null,
      phone: s.phone || null,
      department: s.department || null,
      year_or_semester: s.year_or_semester || s.yearOrSemester || null,
      enrollment_status: s.enrollment_status || 'enrolled',
      enrolled_at: s.enrolled_at || s.created_at || '',
      has_credentials: Boolean(s.has_credentials),
      student_status: s.student_status || s.status || 'active',
    }));
  } catch (err) {
    console.error('[getStudentsByBatchId error]:', err);
    return [];
  }
}

/**
 * Bulk enrolls an array of students into a college and batch via FastAPI.
 */
export async function enrollStudentsBulk(
  batchId: string,
  collegeId: string,
  students: StudentRowInput[]
): Promise<{ totalProcessed: number; newlyEnrolled: number }> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  if (collegeId) {
    assertUuid(collegeId, 'collegeId');
  }
  const payload = {
    batch_id: safeBatchId,
    students: students.map((s) => ({
      rollNumber: s.rollNumber.trim().toUpperCase(),
      fullName: s.fullName.trim(),
      email: s.email?.trim().toLowerCase() || null,
      phone: s.phone?.trim() || null,
      department: s.department?.trim().toUpperCase() || null,
      yearOrSemester: s.yearOrSemester?.trim() || null,
    })),
  };

  const res = await apiPost<{ totalProcessed: number; newlyEnrolled: number }>('/students/bulk-enroll', payload);
  return {
    totalProcessed: Number(res.totalProcessed || students.length),
    newlyEnrolled: Number(res.newlyEnrolled || 0),
  };
}

/**
 * Removes a student from a batch via FastAPI.
 */
export async function removeStudentFromBatch(batchId: string, studentId: string): Promise<boolean> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  const safeStudentId = assertUuid(studentId, 'studentId');
  await apiDelete(`/batches/${safeBatchId}/students/${safeStudentId}`);
  return true;
}

/**
 * Retrieves all students registered at a college from FastAPI.
 */
export async function getStudentsByCollegeId(collegeId: string): Promise<CollegeStudentItem[]> {
  const safeCollegeId = assertUuid(collegeId, 'collegeId');
  try {
    const data = await apiGet<any[]>('/students', { college_id: safeCollegeId });
    if (!data) return [];

    return data.map((s) => ({
      id: String(s.id),
      roll_number: s.roll_number,
      full_name: s.full_name || s.name || '',
      email: s.email || null,
      phone: s.phone || null,
      department: s.department || null,
      year_or_semester: s.year_or_semester || null,
      batches_count: 1,
      batch_codes: null,
      created_at: s.created_at || '',
    }));
  } catch (err) {
    console.error('[getStudentsByCollegeId error]:', err);
    return [];
  }
}

/**
 * Retrieves platform-wide students with optional search and filters from FastAPI.
 */
export async function getAllStudents(filters?: {
  search?: string;
  collegeId?: string;
  batchId?: string;
  department?: string;
  limit?: number;
  offset?: number;
}): Promise<{ students: MasterStudentItem[]; total: number }> {
  const safeCollegeId =
    filters?.collegeId && filters.collegeId !== 'all'
      ? assertUuid(filters.collegeId, 'collegeId')
      : undefined;
  const safeBatchId =
    filters?.batchId && filters.batchId !== 'all'
      ? assertUuid(filters.batchId, 'batchId')
      : undefined;
  try {
    const params: Record<string, any> = {};
    if (filters?.search?.trim()) params.search = filters.search.trim();
    if (safeCollegeId) params.college_id = safeCollegeId;
    if (safeBatchId) params.batch_id = safeBatchId;

    const data = await apiGet<any[]>('/students', params);
    if (!data) return { students: [], total: 0 };

    const students: MasterStudentItem[] = data.map((s) => ({
      id: String(s.id),
      college_id: String(s.college_id || filters?.collegeId || ''),
      college_name: s.college_name || 'Institution',
      roll_number: s.roll_number,
      full_name: s.full_name || s.name || '',
      email: s.email || null,
      phone: s.phone || null,
      department: s.department || null,
      year_or_semester: s.year_or_semester || null,
      dob: s.dob || null,
      gender: s.gender || null,
      status: s.status || s.student_status || 'active',
      must_change_password: Boolean(s.must_change_password),
      has_credentials: Boolean(s.has_credentials),
      activated_at: s.activated_at || null,
      archived_at: s.archived_at || null,
      batches_count: s.batch_codes ? s.batch_codes.split(',').length : 0,
      batch_codes: s.batch_codes || null,
      created_at: s.created_at || '',
    }));

    return {
      students,
      total: students.length,
    };
  } catch (err) {
    console.error('[getAllStudents error]:', err);
    return { students: [], total: 0 };
  }
}

/**
 * Assigns / generates unique temporary login credentials for all students in a batch via FastAPI.
 * Securely triggers unique temporary credential generation per student.
 */
export async function assignCredentialsToBatchStudents(
  batchId: string
): Promise<{ count: number; credentials?: Array<{ student_id: string; roll_number: string; full_name: string; temporary_password: string }>; message?: string }> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  const res = await apiPost<{ count: number; credentials: Array<{ student_id: string; roll_number: string; full_name: string; temporary_password: string }>; message?: string }>(
    `/batches/${safeBatchId}/credentials`,
    {}
  );
  return { count: res?.count ?? 0, credentials: res?.credentials ?? [], message: res?.message };
}

/**
 * Deletes / revokes login credentials for all students in a batch via FastAPI.
 */
export async function deleteCredentialsFromBatchStudents(batchId: string): Promise<{ count: number }> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  await apiDelete(`/batches/${safeBatchId}/credentials`);
  return { count: 1 };
}

/**
 * Assigns credentials for a single student via FastAPI, returning generated temporary password in body.
 */
export async function assignCredentialsToSingleStudent(
  studentId: string
): Promise<{ success: boolean; student_id?: string; roll_number?: string; temporary_password?: string; message?: string }> {
  const safeStudentId = assertUuid(studentId, 'studentId');
  const res = await apiPost<{ success: boolean; student_id: string; roll_number: string; temporary_password: string; message?: string }>(
    `/students/${safeStudentId}/credentials`,
    {}
  );
  return {
    success: true,
    student_id: res?.student_id,
    roll_number: res?.roll_number,
    temporary_password: res?.temporary_password,
    message: res?.message,
  };
}

/**
 * Deletes credentials for a single student via FastAPI.
 */
export async function deleteCredentialsFromSingleStudent(studentId: string): Promise<boolean> {
  const safeStudentId = assertUuid(studentId, 'studentId');
  await apiDelete(`/students/${safeStudentId}/credentials`);
  return true;
}
