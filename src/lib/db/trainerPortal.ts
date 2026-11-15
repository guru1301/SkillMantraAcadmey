/**
 * Trainer Portal Data Access Layer — Fully migrated to FastAPI Backend.
 * Direct SQL queries have been retired in Stage D.
 */
import { cache } from 'react';
import { apiGet, apiPost } from '@/lib/api/client';
import { assertUuid } from '@/lib/validations/ids';

export interface TrainerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  skills: string | null;
  status: string;
}

export interface TrainerBatchItem {
  id: string;
  code: string;
  college_id: string;
  college_name: string;
  college_city: string | null;
  program_id: string;
  program_name: string;
  start_date: string;
  end_date: string;
  target_strength: number;
  enrolled_count: number;
  status: string;
  role: string;
  is_lead: boolean;
  today_marked: boolean;
  today_session_id?: string | null;
  today_present_count?: number;
}

export interface TrainerStudentRosterItem {
  student_id: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  department: string | null;
  phone: string | null;
  status: 'present' | 'absent' | 'late' | 'excused' | 'unmarked';
  notes: string | null;
}

export interface SessionHistoryItem {
  session_id: string;
  batch_id: string;
  batch_code: string;
  college_name: string;
  program_name: string;
  date: string;
  title: string;
  topic: string | null;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_rate: number;
  updated_at: string;
}

export interface TrainerBatchStudent {
  student_id: string;
  batch_id: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  department: string | null;
  phone: string | null;
}

export interface TrainerBatchWithRoster extends TrainerBatchItem {
  students: TrainerBatchStudent[];
}

export interface TrainerCalendarSession {
  id: string;
  date: string;
  title: string;
  topic: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  totalMarked: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

/**
 * Retrieves the trainer's profile by ID via FastAPI (cached per request).
 */
export const getTrainerProfile = cache(async function (
  trainerId: string
): Promise<TrainerProfile | null> {
  const safeTrainerId = assertUuid(trainerId, 'trainerId');
  try {
    const data = await apiGet<any>(`/trainers/${safeTrainerId}`);
    if (!data) return null;

    return {
      id: String(data.id),
      full_name: data.full_name || data.name || '',
      email: data.email || '',
      phone: data.phone ?? null,
      skills: Array.isArray(data.expertise) ? data.expertise.join(', ') : (data.skills ?? null),
      status: data.status || 'active',
    };
  } catch (err) {
    console.error('[getTrainerProfile error]:', err);
    return null;
  }
});

/**
 * Retrieves all batches assigned to this trainer via FastAPI (cached per request).
 */
export const getTrainerAssignedBatches = cache(async function (
  _trainerId: string
): Promise<TrainerBatchItem[]> {
  try {
    const batches = await apiGet<any[]>('/trainers/me/batches');
    if (!batches) return [];

    return batches.map((b) => ({
      id: String(b.id || b.batch_id),
      code: b.code || b.batch_code || '',
      college_id: String(b.college_id || ''),
      college_name: b.college_name || '',
      college_city: b.college_city ?? null,
      program_id: String(b.program_id || ''),
      program_name: b.program_name || '',
      start_date: b.start_date || '',
      end_date: b.end_date || '',
      target_strength: Number(b.target_strength || 0),
      enrolled_count: Number(b.enrolled_count ?? b.students_count ?? 0),
      status: b.status || b.batch_status || 'active',
      role: b.role || 'faculty',
      is_lead: Boolean(b.is_lead),
      today_marked: Boolean(b.today_marked),
      today_session_id: b.today_session_id ? String(b.today_session_id) : null,
      today_present_count: Number(b.today_present_count || 0),
    }));
  } catch (err) {
    console.error('[getTrainerAssignedBatches error]:', err);
    return [];
  }
});

/**
 * Retrieves all batches assigned to this trainer along with enrolled students roster via FastAPI.
 */
export async function getTrainerBatchesWithRosters(
  _trainerId: string
): Promise<TrainerBatchWithRoster[]> {
  try {
    const batches = await apiGet<any[]>('/trainers/me/batches-with-roster');
    if (!batches) return [];

    return batches.map((b) => ({
      id: String(b.id || b.batch_id),
      code: b.code || b.batch_code || '',
      college_id: String(b.college_id || ''),
      college_name: b.college_name || '',
      college_city: b.college_city ?? null,
      program_id: String(b.program_id || ''),
      program_name: b.program_name || '',
      start_date: b.start_date || '',
      end_date: b.end_date || '',
      target_strength: Number(b.target_strength || 0),
      enrolled_count: Number(b.enrolled_count ?? b.students_count ?? 0),
      status: b.status || b.batch_status || 'active',
      role: b.role || 'faculty',
      is_lead: Boolean(b.is_lead),
      today_marked: Boolean(b.today_marked),
      today_session_id: b.today_session_id ? String(b.today_session_id) : null,
      today_present_count: Number(b.today_present_count || 0),
      students: (b.students || []).map((s: any) => ({
        student_id: String(s.student_id || s.id),
        batch_id: String(s.batch_id || b.id),
        roll_number: s.roll_number,
        full_name: s.full_name || s.name || '',
        email: s.email ?? null,
        department: s.department ?? null,
        phone: s.phone ?? null,
      })),
    }));
  } catch (err) {
    console.error('[getTrainerBatchesWithRosters error]:', err);
    return [];
  }
}

/**
 * Retrieves live attendance roster for a specific batch and date via FastAPI.
 */
export async function getTrainerBatchLiveRoster(
  _trainerId: string,
  batchId: string,
  dateStr: string
): Promise<{
  batch: TrainerBatchItem | null;
  existingSession: {
    id: string;
    title: string;
    topic: string | null;
    status: string;
  } | null;
  roster: TrainerStudentRosterItem[];
}> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  try {
    const data = await apiGet<any>('/attendance/live-roster', {
      batch_id: safeBatchId,
      date: dateStr,
    });

    if (!data || !data.batch) {
      return { batch: null, existingSession: null, roster: [] };
    }

    const b = data.batch;
    const batch: TrainerBatchItem = {
      id: String(b.id),
      code: b.code || b.batch_code || '',
      college_id: String(b.college_id || ''),
      college_name: b.college_name || '',
      college_city: b.college_city ?? null,
      program_id: String(b.program_id || ''),
      program_name: b.program_name || '',
      start_date: b.start_date || '',
      end_date: b.end_date || '',
      target_strength: Number(b.target_strength || 0),
      enrolled_count: Number(b.enrolled_count || 0),
      status: b.status || 'active',
      role: b.role || 'faculty',
      is_lead: Boolean(b.is_lead),
      today_marked: Boolean(b.today_marked),
      today_session_id: b.today_session_id ? String(b.today_session_id) : null,
      today_present_count: Number(b.today_present_count || 0),
    };

    const existingSession = data.existingSession
      ? {
          id: String(data.existingSession.id),
          title: data.existingSession.title,
          topic: data.existingSession.topic ?? null,
          status: data.existingSession.status,
        }
      : null;

    const roster: TrainerStudentRosterItem[] = (data.roster || []).map((r: any) => ({
      student_id: String(r.student_id || r.id),
      roll_number: r.roll_number,
      full_name: r.full_name || '',
      email: r.email ?? null,
      department: r.department ?? null,
      phone: r.phone ?? null,
      status: r.status || 'unmarked',
      notes: r.notes ?? null,
    }));

    return { batch, existingSession, roster };
  } catch (err) {
    console.error('[getTrainerBatchLiveRoster error]:', err);
    return { batch: null, existingSession: null, roster: [] };
  }
}

/**
 * Saves live attendance marks for a session via FastAPI.
 */
export async function saveLiveBatchAttendance(params: {
  trainerId: string;
  batchId: string;
  date: string;
  title: string;
  topic?: string;
  isSuperAdmin?: boolean;
  records: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }>;
}): Promise<{
  sessionId: string;
  savedCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
}> {
  const safeBatchId = assertUuid(params.batchId, 'batchId');
  const safeRecords = params.records.map((r) => ({
    ...r,
    studentId: assertUuid(r.studentId, 'studentId'),
  }));
  const result = await apiPost<any>('/attendance/live-save', {
    batchId: safeBatchId,
    date: params.date,
    title: params.title,
    topic: params.topic,
    records: safeRecords,
  });

  return {
    sessionId: String(result.sessionId),
    savedCount: Number(result.savedCount || 0),
    presentCount: Number(result.presentCount || 0),
    absentCount: Number(result.absentCount || 0),
    lateCount: Number(result.lateCount || 0),
    excusedCount: Number(result.excusedCount || 0),
  };
}

/**
 * Retrieves recent attendance records saved across this trainer's assigned cohorts via FastAPI.
 */
export const getTrainerRecentSessions = cache(async function (
  _trainerId: string,
  limit: number = 10
): Promise<SessionHistoryItem[]> {
  try {
    const sessions = await apiGet<any[]>('/trainers/me/recent-sessions', {
      limit: String(limit),
    });
    if (!sessions) return [];

    return sessions.map((s) => ({
      session_id: String(s.session_id || s.id),
      batch_id: String(s.batch_id),
      batch_code: s.batch_code || '',
      college_name: s.college_name || '',
      program_name: s.program_name || '',
      date: s.date,
      title: s.title,
      topic: s.topic ?? null,
      total_students: Number(s.total_students || 0),
      present_count: Number(s.present_count || 0),
      absent_count: Number(s.absent_count || 0),
      late_count: Number(s.late_count || 0),
      attendance_rate: Number(s.attendance_rate || 0),
      updated_at: s.updated_at || '',
    }));
  } catch (err) {
    console.error('[getTrainerRecentSessions error]:', err);
    return [];
  }
});

/**
 * Retrieves all calendar sessions recorded or scheduled for this batch via FastAPI.
 */
export async function getTrainerBatchCalendarSessions(
  batchId: string
): Promise<TrainerCalendarSession[]> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  try {
    const sessions = await apiGet<any[]>(`/sessions/batch/${safeBatchId}/calendar`);
    if (!sessions) return [];

    return sessions.map((r) => ({
      id: String(r.id),
      date: r.date,
      title: r.title,
      topic: r.topic ?? null,
      status: r.status,
      totalMarked: Number(r.totalMarked || 0),
      presentCount: Number(r.presentCount || 0),
      absentCount: Number(r.absentCount || 0),
      lateCount: Number(r.lateCount || 0),
      excusedCount: Number(r.excusedCount || 0),
      attendanceRate: Number(r.attendanceRate || 0),
    }));
  } catch (err) {
    console.error('[getTrainerBatchCalendarSessions error]:', err);
    return [];
  }
}
