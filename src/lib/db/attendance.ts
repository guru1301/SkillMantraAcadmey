/**
 * Attendance & Sessions Data Access Layer — Fully migrated to FastAPI Backend.
 */
import { apiGet, apiPost } from '@/lib/api/client';
import { assertUuid } from '@/lib/validations/ids';

export interface TrainingSessionRecord {
  id: string;
  batch_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  topic: string | null;
  trainer_id: string | null;
  trainer_name?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  marked_count?: number;
  present_count?: number;
}

export interface StudentAttendanceItem {
  student_id: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  department: string | null;
  status: 'present' | 'absent' | 'late' | 'excused' | 'unmarked';
  notes: string | null;
  marked_at: string | null;
}

/**
 * Retrieves all sessions for a specific training batch from FastAPI.
 */
export async function getBatchSessions(batchId: string): Promise<TrainingSessionRecord[]> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  try {
    const sessions = await apiGet<any[]>('/sessions', { batch_id: safeBatchId });
    if (!sessions) return [];

    return sessions.map((s) => ({
      id: String(s.id),
      batch_id: String(s.batch_id),
      date: s.date,
      start_time: s.start_time || null,
      end_time: s.end_time || null,
      title: s.title,
      topic: s.topic || null,
      trainer_id: s.trainer_id ? String(s.trainer_id) : null,
      trainer_name: s.trainer_name || null,
      status: s.status,
      created_at: s.created_at || '',
      marked_count: Number(s.marked_count || 0),
      present_count: Number(s.present_count || 0),
    }));
  } catch (err) {
    console.error('[getBatchSessions error]:', err);
    return [];
  }
}

/**
 * Retrieves enrolled students for a batch with their attendance status for a given session.
 */
export async function getSessionAttendanceRoster(
  sessionId: string,
  batchId: string
): Promise<StudentAttendanceItem[]> {
  const safeSessionId = assertUuid(sessionId, 'sessionId');
  assertUuid(batchId, 'batchId');
  try {
    const roster = await apiGet<any[]>(`/attendance/sessions/${safeSessionId}/roster`);
    if (!roster) return [];

    return roster.map((r) => ({
      student_id: String(r.student_id),
      roll_number: r.roll_number,
      full_name: r.full_name || '',
      email: r.email || null,
      department: r.department || null,
      status: r.status || 'unmarked',
      notes: r.notes || null,
      marked_at: r.marked_at || null,
    }));
  } catch (err) {
    console.error('[getSessionAttendanceRoster error]:', err);
    return [];
  }
}

/**
 * Creates or updates training session via FastAPI.
 */
export async function createTrainingSession(data: {
  batchId: string;
  date: string;
  title: string;
  topic?: string;
  startTime?: string;
  endTime?: string;
  trainerId?: string;
}): Promise<string> {
  const safeBatchId = assertUuid(data.batchId, 'batchId');
  const safeTrainerId = data.trainerId ? assertUuid(data.trainerId, 'trainerId') : null;
  const payload = {
    batch_id: safeBatchId,
    date: data.date,
    title: data.title,
    topic: data.topic || null,
    start_time: data.startTime || null,
    end_time: data.endTime || null,
    trainer_id: safeTrainerId,
    status: 'completed',
  };

  const res = await apiPost<{ id: string }>('/sessions', payload);
  return String(res.id);
}

/**
 * Saves attendance records for students in a session via FastAPI.
 */
export async function saveSessionAttendance(
  sessionId: string,
  records: Array<{ studentId: string; status: 'present' | 'absent' | 'late' | 'excused'; notes?: string }>
): Promise<void> {
  const safeSessionId = assertUuid(sessionId, 'sessionId');
  if (records.length === 0) return;

  const payload = {
    session_id: safeSessionId,
    records: records.map((r) => ({
      student_id: assertUuid(r.studentId, 'studentId'),
      status: r.status,
      remarks: r.notes || null,
    })),
  };

  await apiPost('/attendance/mark', payload);
}

/**
 * Returns platform attendance statistics from FastAPI.
 */
export async function getPlatformAttendanceStats(): Promise<{
  totalSessions: number;
  totalRecordsMarked: number;
  overallAttendanceRate: number;
}> {
  try {
    const stats = await apiGet<any>('/attendance/stats');
    if (!stats) {
      return { totalSessions: 0, totalRecordsMarked: 0, overallAttendanceRate: 0 };
    }
    return {
      totalSessions: Number(stats.totalSessions || 0),
      totalRecordsMarked: Number(stats.totalRecordsMarked || 0),
      overallAttendanceRate: Number(stats.overallAttendanceRate || 0),
    };
  } catch (err) {
    console.error('[getPlatformAttendanceStats error]:', err);
    return { totalSessions: 0, totalRecordsMarked: 0, overallAttendanceRate: 0 };
  }
}
