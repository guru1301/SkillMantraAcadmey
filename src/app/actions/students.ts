'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import {
  bulkStudentUploadSchema,
  studentRowSchema,
  StudentRowInput,
} from '@/lib/validations/student';
import { assertUuid, deleteStudentModeSchema } from '@/lib/validations/ids';
import {
  enrollStudentsBulk,
  removeStudentFromBatch,
  assignCredentialsToBatchStudents,
  deleteCredentialsFromBatchStudents,
  assignCredentialsToSingleStudent,
  deleteCredentialsFromSingleStudent,
} from '@/lib/db/students';
import { getBatchById } from '@/lib/db/batches';
import { hashPassword } from '@/lib/auth/password';

export interface StudentActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Validates and bulk enrolls a parsed student roster into a batch.
 */
export async function uploadStudentsBulkAction(
  batchId: string,
  collegeId: string,
  students: StudentRowInput[]
): Promise<StudentActionResult<{ totalProcessed: number; newlyEnrolled: number }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    if (collegeId) {
      assertUuid(collegeId, 'collegeId');
    }
    const batch = await getBatchById(safeBatchId);
    if (!batch) {
      return { success: false, error: 'Batch not found.' };
    }
    const derivedCollegeId = batch.college_id;
    if (session.role === 'college_admin' && session.collegeId && derivedCollegeId !== session.collegeId) {
      return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
    }

    const parsed = bulkStudentUploadSchema.safeParse({
      batchId: safeBatchId,
      collegeId: derivedCollegeId,
      students,
    });

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: errorMsg };
    }

    const result = await enrollStudentsBulk(
      parsed.data.batchId,
      parsed.data.collegeId,
      parsed.data.students
    );

    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath(`/admin/batches/${safeBatchId}/students`);
    revalidatePath(`/admin/colleges/${derivedCollegeId}`);
    revalidatePath('/admin/batches');
    revalidatePath('/admin/dashboard');
    revalidatePath('/portal/students');
    revalidatePath('/portal/batches');
    revalidatePath('/portal');

    return { success: true, data: result };
  } catch (err: any) {
    console.error('[Upload Students Error]:', err);
    if (err.message?.startsWith('Invalid ')) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: 'Failed to enroll students. Please verify your roster and try again.',
    };
  }
}

/**
 * Server Action: Enrolls a single student into a batch.
 */
export async function addSingleStudentAction(
  batchId: string,
  collegeId: string,
  student: StudentRowInput
): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    if (collegeId) {
      assertUuid(collegeId, 'collegeId');
    }
    const batch = await getBatchById(safeBatchId);
    if (!batch) {
      return { success: false, error: 'Batch not found.' };
    }
    const derivedCollegeId = batch.college_id;
    if (session.role === 'college_admin' && session.collegeId && derivedCollegeId !== session.collegeId) {
      return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
    }

    const parsed = studentRowSchema.safeParse(student);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: errorMsg };
    }

    await enrollStudentsBulk(safeBatchId, derivedCollegeId, [parsed.data]);

    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath(`/admin/batches/${safeBatchId}/students`);
    revalidatePath(`/admin/colleges/${derivedCollegeId}`);
    revalidatePath('/admin/dashboard');
    revalidatePath('/portal/students');
    revalidatePath('/portal/batches');
    revalidatePath('/portal');

    return { success: true };
  } catch (err: any) {
    console.error('[Add Single Student Error]:', err);
    if (err.message?.startsWith('Invalid ')) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to add student. Please check input values.' };
  }
}

/**
 * Server Action: Removes an enrolled student from a batch.
 */
export async function removeStudentFromBatchAction(
  batchId: string,
  studentId: string,
  collegeId: string
): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    const safeStudentId = assertUuid(studentId, 'studentId');
    if (collegeId) {
      assertUuid(collegeId, 'collegeId');
    }
    const batch = await getBatchById(safeBatchId);
    if (!batch) {
      return { success: false, error: 'Batch not found.' };
    }
    const derivedCollegeId = batch.college_id;
    if (session.role === 'college_admin' && session.collegeId && derivedCollegeId !== session.collegeId) {
      return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
    }
    const removed = await removeStudentFromBatch(safeBatchId, safeStudentId);
    if (!removed) {
      return { success: false, error: 'Student enrollment record not found.' };
    }

    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath(`/admin/batches/${safeBatchId}/students`);
    revalidatePath(`/admin/colleges/${derivedCollegeId}`);
    revalidatePath('/admin/dashboard');
    revalidatePath('/portal/students');
    revalidatePath('/portal/batches');
    revalidatePath('/portal');

    return { success: true };
  } catch (err: any) {
    console.error('[Remove Student Error]:', err);
    return { success: false, error: err?.message || 'Failed to remove student from batch.' };
  }
}

/**
 * Server Action: Generates unique login credentials for all students in a batch.
 */
export async function assignBatchStudentCredentialsAction(
  batchId: string
): Promise<StudentActionResult<{ count: number; credentials?: any[] }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    if (session.role === 'college_admin') {
      const batch = await getBatchById(safeBatchId);
      if (!batch || (session.collegeId && batch.college_id !== session.collegeId)) {
        return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
      }
    }
    const result = await assignCredentialsToBatchStudents(safeBatchId);

    revalidatePath(`/admin/batches/${safeBatchId}/students`);
    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath('/admin/students');
    revalidatePath('/portal/students');
    revalidatePath('/portal/batches');

    return {
      success: true,
      data: {
        count: result.count,
        credentials: result.credentials,
      },
    };
  } catch (err: any) {
    console.error('[Assign Batch Credentials Error]:', err);
    return { success: false, error: err?.message || 'Failed to assign student credentials.' };
  }
}

/**
 * Server Action: Deletes / revokes login credentials for all students in a batch.
 */
export async function deleteBatchStudentCredentialsAction(
  batchId: string
): Promise<StudentActionResult<{ count: number }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    if (session.role === 'college_admin') {
      const batch = await getBatchById(safeBatchId);
      if (!batch || (session.collegeId && batch.college_id !== session.collegeId)) {
        return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
      }
    }
    const result = await deleteCredentialsFromBatchStudents(safeBatchId);

    revalidatePath(`/admin/batches/${safeBatchId}/students`);
    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath('/admin/students');
    revalidatePath('/portal/students');
    revalidatePath('/portal/batches');

    return {
      success: true,
      data: {
        count: result.count,
      },
    };
  } catch (err: any) {
    console.error('[Delete Batch Credentials Error]:', err);
    return { success: false, error: err?.message || 'Failed to delete student credentials.' };
  }
}

/**
 * Server Action: Assigns unique credentials to an individual student.
 */
export async function assignSingleStudentCredentialAction(
  studentId: string,
  batchId: string
): Promise<StudentActionResult<{ temporary_password?: string; roll_number?: string }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeStudentId = assertUuid(studentId, 'studentId');
    const safeBatchId = assertUuid(batchId, 'batchId');
    if (session.role === 'college_admin') {
      const batch = await getBatchById(safeBatchId);
      if (!batch || (session.collegeId && batch.college_id !== session.collegeId)) {
        return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
      }
    }
    const updated = await assignCredentialsToSingleStudent(safeStudentId);
    if (!updated || !updated.success) {
      return { success: false, error: 'Student record not found.' };
    }

    revalidatePath(`/admin/batches/${safeBatchId}/students`);
    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath('/portal/students');
    revalidatePath('/portal/batches');

    return {
      success: true,
      data: {
        temporary_password: updated.temporary_password,
        roll_number: updated.roll_number,
      },
    };
  } catch (err: any) {
    console.error('[Assign Single Student Credential Error]:', err);
    return { success: false, error: err?.message || 'Failed to assign credentials to student.' };
  }
}

/**
 * Server Action: Deletes credentials from an individual student.
 */
export async function deleteSingleStudentCredentialAction(
  studentId: string,
  batchId: string
): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeStudentId = assertUuid(studentId, 'studentId');
    const safeBatchId = assertUuid(batchId, 'batchId');
    if (session.role === 'college_admin') {
      const batch = await getBatchById(safeBatchId);
      if (!batch || (session.collegeId && batch.college_id !== session.collegeId)) {
        return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
      }
    }
    const updated = await deleteCredentialsFromSingleStudent(safeStudentId);
    if (!updated) {
      return { success: false, error: 'Student record not found.' };
    }

    revalidatePath(`/admin/batches/${safeBatchId}/students`);
    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath('/portal/students');
    revalidatePath('/portal/batches');

    return { success: true };
  } catch (err: any) {
    console.error('[Delete Single Student Credential Error]:', err);
    return { success: false, error: err?.message || 'Failed to delete student credentials.' };
  }
}

/**
 * Server Action: Validates and previews a student roster before provisioning.
 */
export async function previewRosterAction(
  batchId: string,
  collegeId: string,
  students: any[]
): Promise<StudentActionResult<any>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    if (collegeId) {
      assertUuid(collegeId, 'collegeId');
    }
    const batch = await getBatchById(safeBatchId);
    if (!batch) {
      return { success: false, error: 'Batch not found.' };
    }
    const derivedCollegeId = batch.college_id;
    if (session.role === 'college_admin' && session.collegeId && derivedCollegeId !== session.collegeId) {
      return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
    }

    const { apiPost } = await import('@/lib/api/client');
    const result = await apiPost('/students/roster-preview', {
      batch_id: safeBatchId,
      college_id: derivedCollegeId,
      students,
    });
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[previewRosterAction error]:', err?.message);
    return { success: false, error: err?.message || 'Failed to preview roster.' };
  }
}

/**
 * Server Action: Provisions student profiles and accounts with secure activation credentials.
 */
export async function importRosterAndProvisionAction(
  batchId: string,
  collegeId: string,
  students: any[]
): Promise<StudentActionResult<any>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    if (collegeId) {
      assertUuid(collegeId, 'collegeId');
    }
    const batch = await getBatchById(safeBatchId);
    if (!batch) {
      return { success: false, error: 'Batch not found.' };
    }
    const derivedCollegeId = batch.college_id;
    if (session.role === 'college_admin' && session.collegeId && derivedCollegeId !== session.collegeId) {
      return { success: false, error: 'Unauthorized: Access restricted to your own institution.' };
    }

    const { apiPost } = await import('@/lib/api/client');
    const result = await apiPost('/students/roster-import', {
      batch_id: safeBatchId,
      college_id: derivedCollegeId,
      students,
    });

    revalidatePath('/admin/students');
    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath(`/admin/batches/${safeBatchId}/students`);
    revalidatePath('/portal/students');
    revalidatePath('/portal/batches');
    revalidatePath('/admin/dashboard');

    return { success: true, data: result };
  } catch (err: any) {
    console.error('[importRosterAndProvisionAction error]:', err?.message);
    return { success: false, error: err?.message || 'Failed to import roster and provision accounts.' };
  }
}

/**
 * Server Action: Updates student status (active, inactive, archived) and revokes sessions on deactivation.
 */
export async function updateStudentStatusAction(
  studentId: string,
  newStatus: string,
  reason?: string
): Promise<StudentActionResult> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeStudentId = assertUuid(studentId, 'studentId');
    const { apiPatch } = await import('@/lib/api/client');
    const result = await apiPatch(`/students/${safeStudentId}/status`, {
      status: newStatus,
      reason,
    });

    revalidatePath('/admin/students');
    revalidatePath('/portal/students');
    revalidatePath('/admin/dashboard');

    return { success: true, data: result };
  } catch (err: any) {
    console.error('[updateStudentStatusAction error]:', err?.message);
    return { success: false, error: err?.message || 'Failed to update student status.' };
  }
}

/**
 * Server Action: Re-issues a single-use activation credential for a student.
 */
export async function resetStudentActivationAction(
  studentId: string
): Promise<StudentActionResult<{ message: string }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeStudentId = assertUuid(studentId, 'studentId');
    const { apiPost } = await import('@/lib/api/client');
    const result = await apiPost<{ success: boolean; message: string }>(`/students/${safeStudentId}/reset-activation`);

    revalidatePath('/admin/students');
    revalidatePath('/portal/students');

    return { success: true, data: result };
  } catch (err: any) {
    console.error('[resetStudentActivationAction error]:', err?.message);
    return { success: false, error: err?.message || 'Failed to reset activation credential.' };
  }
}

/**
 * Server Action: Revokes all active session tokens for a student.
 */
export async function revokeStudentSessionsAction(
  studentId: string
): Promise<StudentActionResult<{ message: string }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeStudentId = assertUuid(studentId, 'studentId');
    const { apiPost } = await import('@/lib/api/client');
    const result = await apiPost<{ success: boolean; message: string }>(`/students/${safeStudentId}/revoke-sessions`);

    revalidatePath('/admin/students');
    revalidatePath('/portal/students');

    return { success: true, data: result };
  } catch (err: any) {
    console.error('[revokeStudentSessionsAction error]:', err?.message);
    return { success: false, error: err?.message || 'Failed to revoke sessions.' };
  }
}

/**
 * Server Action: Safeguarded deletion or archival of student record.
 */
export async function deleteStudentAction(
  studentId: string,
  mode: 'archive' | 'permanent' = 'archive'
): Promise<StudentActionResult<{ message: string }>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeStudentId = assertUuid(studentId, 'studentId');
    const parsedMode = deleteStudentModeSchema.safeParse(mode);
    if (!parsedMode.success) {
      return { success: false, error: 'Invalid mode: must be archive or permanent.' };
    }
    const { apiFetch } = await import('@/lib/api/client');
    const result = await apiFetch<{ success: boolean; message: string }>(`/students/${safeStudentId}`, {
      method: 'DELETE',
      params: { mode: parsedMode.data },
    });

    revalidatePath('/admin/students');
    revalidatePath('/portal/students');
    revalidatePath('/admin/dashboard');

    return { success: true, data: result };
  } catch (err: any) {
    console.error('[deleteStudentAction error]:', err?.message);
    return { success: false, error: err?.message || 'Failed to delete student record.' };
  }
}

/**
 * Server Action: Previews academic history impact for bulk student deletion.
 */
export async function previewBulkDeleteAction(
  studentIds: string[]
): Promise<StudentActionResult<any>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeStudentIds = studentIds.map((id) => assertUuid(id, 'studentId'));
    const { apiPost } = await import('@/lib/api/client');
    const result = await apiPost('/students/bulk-deletion-preview', safeStudentIds);
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[previewBulkDeleteAction error]:', err?.message);
    return { success: false, error: err?.message || 'Failed to preview bulk deletion.' };
  }
}

/**
 * Server Action: Executes collective bulk action across selected students.
 */
export async function executeBulkStudentAction(
  studentIds: string[],
  action: string,
  mode: 'archive' | 'permanent' = 'archive',
  reason?: string
): Promise<StudentActionResult<any>> {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Administrative authentication required.' };
  }

  try {
    const safeStudentIds = studentIds.map((id) => assertUuid(id, 'studentId'));
    const parsedMode = deleteStudentModeSchema.safeParse(mode);
    if (!parsedMode.success) {
      return { success: false, error: 'Invalid mode: must be archive or permanent.' };
    }
    const { apiPost } = await import('@/lib/api/client');
    const result = await apiPost('/students/bulk-action', {
      student_ids: safeStudentIds,
      action,
      mode: parsedMode.data,
      reason,
    });

    revalidatePath('/admin/students');
    revalidatePath('/portal/students');
    revalidatePath('/admin/dashboard');

    return { success: true, data: result };
  } catch (err: any) {
    console.error('[executeBulkStudentAction error]:', err?.message);
    return { success: false, error: err?.message || 'Failed to execute bulk student action.' };
  }
}

/**
 * Server Action: Public student first-time activation with roll number and DOB.
 */
export async function activateStudentAccountAction(payload: {
  roll_number: string;
  dob: string;
  activation_code: string;
  new_password: string;
  college_code?: string;
  email?: string;
}): Promise<StudentActionResult<any>> {
  try {
    const { apiPost } = await import('@/lib/api/client');
    const result = await apiPost('/auth/student-activate', payload);
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[activateStudentAccountAction error]:', err?.message);
    return { success: false, error: err?.message || 'Activation failed. Please verify credentials.' };
  }
}

