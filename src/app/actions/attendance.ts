'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { createTrainingSession, saveSessionAttendance } from '@/lib/db/attendance';
import { assertUuid } from '@/lib/validations/ids';

export async function recordAttendanceAction(
  prevState: any,
  formData: FormData
) {
  const session = await getSession();
  if (!session || !['super_admin', 'college_admin', 'trainer'].includes(session.role)) {
    return { success: false, error: 'Unauthorized: Staff authentication required' };
  }

  const batchId = formData.get('batchId') as string;
  let sessionId = formData.get('sessionId') as string;
  const date = formData.get('date') as string;
  const title = (formData.get('title') as string) || `Session on ${date}`;
  const topic = (formData.get('topic') as string) || '';
  const attendancePayload = formData.get('attendanceData') as string;

  if (!batchId || !date) {
    return { success: false, error: 'Batch ID and Session Date are required' };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    if (sessionId) {
      sessionId = assertUuid(sessionId, 'sessionId');
    }

    // If no existing session ID, create the session first
    if (!sessionId) {
      sessionId = await createTrainingSession({
        batchId: safeBatchId,
        date,
        title,
        topic,
      });
    }

    if (attendancePayload) {
      const records = JSON.parse(attendancePayload) as Array<{
        studentId: string;
        status: 'present' | 'absent' | 'late' | 'excused';
        notes?: string;
      }>;
      const safeRecords = records.map((r) => ({
        ...r,
        studentId: assertUuid(r.studentId, 'studentId'),
      }));
      await saveSessionAttendance(sessionId, safeRecords);
    }

    revalidatePath(`/admin/batches/${safeBatchId}/attendance`);
    revalidatePath(`/admin/batches/${safeBatchId}`);
    revalidatePath(`/admin/attendance`);
    revalidatePath(`/portal/batches/${safeBatchId}`);
    revalidatePath(`/portal`);

    return {
      success: true,
      message: 'Attendance recorded successfully',
      sessionId,
    };
  } catch (error: any) {
    console.error('Failed to save attendance:', error);
    return {
      success: false,
      error: error?.message || 'Failed to record attendance',
    };
  }
}
