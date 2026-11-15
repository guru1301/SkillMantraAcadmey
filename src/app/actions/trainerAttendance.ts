'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { saveLiveBatchAttendance } from '@/lib/db/trainerPortal';
import { assertUuid } from '@/lib/validations/ids';

export interface SaveAttendancePayload {
  batchId: string;
  date: string;
  title: string;
  topic?: string;
  records: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }>;
}

export interface SaveAttendanceResponse {
  success: boolean;
  error?: string;
  savedCount?: number;
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  excusedCount?: number;
  sessionId?: string;
}

export async function saveTrainerLiveAttendanceAction(
  payload: SaveAttendancePayload
): Promise<SaveAttendanceResponse> {
  const session = await getSession();

  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    return {
      success: false,
      error: 'Unauthorized: Only authorized faculty members or administrators can record attendance.',
    };
  }

  if (!payload.batchId || !payload.date || !payload.records || payload.records.length === 0) {
    return {
      success: false,
      error: 'Missing batch identification or attendance records for submission.',
    };
  }

  // Strict constraint: Reject tomorrow and any future dates
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (payload.date > todayStr) {
    return {
      success: false,
      error: 'Future dates are locked. Attendance cannot be recorded or modified for future dates.',
    };
  }

  try {
    const safeBatchId = assertUuid(payload.batchId, 'batchId');
    const safeRecords = payload.records.map((r) => ({
      ...r,
      studentId: assertUuid(r.studentId, 'studentId'),
    }));

    const result = await saveLiveBatchAttendance({
      trainerId: session.id,
      batchId: safeBatchId,
      date: payload.date,
      title: payload.title.trim() || `Class Session - ${payload.date}`,
      topic: payload.topic?.trim() || undefined,
      isSuperAdmin: session.role === 'super_admin',
      records: safeRecords,
    });

    // Revalidate affected portals
    revalidatePath(`/trainer/attendance/${safeBatchId}`);
    revalidatePath('/trainer');
    revalidatePath(`/admin/batches/${safeBatchId}/attendance`);
    revalidatePath('/student/attendance');
    revalidatePath(`/student/learning/${safeBatchId}`);

    return {
      success: true,
      savedCount: result.savedCount,
      presentCount: result.presentCount,
      absentCount: result.absentCount,
      lateCount: result.lateCount,
      excusedCount: result.excusedCount,
      sessionId: result.sessionId,
    };
  } catch (error: any) {
    console.error('[Attendance Action Error]:', error);
    return {
      success: false,
      error: error?.message || 'Failed to save attendance records. Please try again.',
    };
  }
}

export interface GetDateRosterResponse {
  success: boolean;
  error?: string;
  existingSession?: {
    id: string;
    title: string;
    topic: string | null;
    status: string;
  } | null;
  roster?: Array<{
    student_id: string;
    roll_number: string;
    full_name: string;
    email: string | null;
    department: string | null;
    phone: string | null;
    status: 'present' | 'absent' | 'late' | 'excused' | 'unmarked';
    notes: string | null;
  }>;
}

export async function getTrainerBatchRosterForDateAction(
  batchId: string,
  dateStr: string
): Promise<GetDateRosterResponse> {
  const session = await getSession();
  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const safeBatchId = assertUuid(batchId, 'batchId');
    const { getTrainerBatchLiveRoster } = await import('@/lib/db/trainerPortal');
    const { existingSession, roster } = await getTrainerBatchLiveRoster(
      session.id,
      safeBatchId,
      dateStr
    );
    return { success: true, existingSession, roster };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch roster' };
  }
}

