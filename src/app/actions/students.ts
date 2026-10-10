'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import {
  bulkStudentUploadSchema,
  studentRowSchema,
  StudentRowInput,
} from '@/lib/validations/student';
import {
  enrollStudentsBulk,
  removeStudentFromBatch,
} from '@/lib/db/students';

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
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const parsed = bulkStudentUploadSchema.safeParse({
    batchId,
    collegeId,
    students,
  });

  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    const result = await enrollStudentsBulk(
      parsed.data.batchId,
      parsed.data.collegeId,
      parsed.data.students
    );

    revalidatePath(`/admin/batches/${batchId}`);
    revalidatePath(`/admin/batches/${batchId}/students`);
    revalidatePath(`/admin/colleges/${collegeId}`);
    revalidatePath('/admin/batches');
    revalidatePath('/admin/dashboard');

    return { success: true, data: result };
  } catch (err: any) {
    console.error('[Upload Students Error]:', err);
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
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const parsed = studentRowSchema.safeParse(student);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: errorMsg };
  }

  try {
    await enrollStudentsBulk(batchId, collegeId, [parsed.data]);

    revalidatePath(`/admin/batches/${batchId}`);
    revalidatePath(`/admin/batches/${batchId}/students`);
    revalidatePath(`/admin/colleges/${collegeId}`);
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (err: any) {
    console.error('[Add Single Student Error]:', err);
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
  if (!session || session.role !== 'super_admin') {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  try {
    const removed = await removeStudentFromBatch(batchId, studentId);
    if (!removed) {
      return { success: false, error: 'Student enrollment record not found.' };
    }

    revalidatePath(`/admin/batches/${batchId}`);
    revalidatePath(`/admin/batches/${batchId}/students`);
    revalidatePath(`/admin/colleges/${collegeId}`);
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (err: any) {
    console.error('[Remove Student Error]:', err);
    return { success: false, error: 'Failed to remove student from batch.' };
  }
}
