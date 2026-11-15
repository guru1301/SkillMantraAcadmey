/**
 * Student Portal Data Access Layer — Fully migrated to FastAPI Backend.
 * Direct SQL queries have been retired in Stage D.
 */
import { cache } from 'react';
import { apiGet, apiPost } from '@/lib/api/client';
import { assertUuid } from '@/lib/validations/ids';

export interface StudentProfileData {
  id: string;
  roll_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  year_or_semester: string | null;
  college_id: string;
  college_name: string;
  college_city: string | null;
  college_state: string | null;
}

export interface StudentBatchItem {
  id: string;
  code: string;
  program_name: string;
  program_description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  college_name: string;
  enrolled_at: string;
  lead_trainer_name: string | null;
  lead_trainer_email: string | null;
  duration_days: number | null;
  total_sessions: number;
  completed_sessions: number;
}

export interface StudentSessionItem {
  id: string;
  batch_id: string;
  batch_code: string;
  program_name: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  topic: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  trainer_name: string | null;
  attendance_status: 'present' | 'absent' | 'late' | 'excused' | 'unmarked';
  attendance_notes: string | null;
}

export interface StudentAttendanceSummary {
  totalRecordedSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  unmarkedCompletedSessions: number;
  percentage: number;
  history: StudentSessionItem[];
}

export interface StudentResourceItem {
  id: string;
  batch_id: string;
  batch_code: string;
  program_name: string;
  name: string;
  type: 'google_drive' | 'document' | 'video' | 'link';
  url: string;
  description: string | null;
  created_at: string;
}

export interface StudentAssessmentItem {
  id: string;
  batch_id: string;
  batch_code: string;
  program_name: string;
  title: string;
  type: 'quiz' | 'assignment' | 'practical_test';
  topic: string | null;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  start_time: string | null;
  deadline: string | null;
  due_date: string | null;
  shuffle_questions: boolean;
  anti_cheat_enabled: boolean;
  questions_count: number;
  status: 'draft' | 'published' | 'closed';
  student_status: 'not_started' | 'in_progress' | 'submitted' | 'evaluated' | 'overdue' | 'pending_review';
  score: number | null;
  feedback: string | null;
  submitted_at: string | null;
}

export interface StudentQuizClientQuestion {
  id: string;
  question: string;
  options: string[];
  points: number;
}

export interface StudentQuizData {
  assessment: {
    id: string;
    title: string;
    topic: string | null;
    description: string | null;
    durationMinutes: number;
    totalMarks: number;
    passingMarks: number;
    startTime: string | null;
    deadline: string | null;
    shuffleQuestions: boolean;
    antiCheatEnabled: boolean;
    batchCode: string;
    programName: string;
    questionsCount?: number;
  };
  questions: StudentQuizClientQuestion[];
  isUpcoming: boolean;
  isActive: boolean;
  isExpired: boolean;
  submission: {
    status: string;
    score: number | null;
    submittedAt: string | null;
    answers?: Record<string, number>;
    version?: number;
  } | null;
}

/**
 * Retrieves the authenticated student's profile details via FastAPI (cached per request).
 */
export const getStudentProfile = cache(async function (
  _studentId: string
): Promise<StudentProfileData | null> {
  try {
    const s = await apiGet<any>('/students/me/profile');
    if (!s) return null;

    return {
      id: String(s.id),
      roll_number: s.roll_number,
      full_name: s.full_name || '',
      email: s.email ?? null,
      phone: s.phone ?? null,
      department: s.department ?? null,
      year_or_semester: s.year_or_semester ?? null,
      college_id: String(s.college_id),
      college_name: s.college_name || 'Institution',
      college_city: s.college_city ?? null,
      college_state: s.college_state ?? null,
    };
  } catch (err: any) {
    console.warn('[getStudentProfile fallback]:', String(err?.message || 'Connection unavailable'));
    return null;
  }
});

/**
 * Retrieves all batches the student is enrolled in via FastAPI (cached per request).
 */
export const getStudentBatches = cache(async function (
  _studentId: string
): Promise<StudentBatchItem[]> {
  try {
    const batches = await apiGet<any[]>('/students/me/batches');
    if (!batches) return [];

    return batches.map((b) => ({
      id: String(b.id),
      code: b.code || b.batch_code || '',
      program_name: b.program_name || '',
      program_description: b.program_description ?? null,
      start_date: b.start_date || '',
      end_date: b.end_date || '',
      status: b.status || 'active',
      college_name: b.college_name || '',
      enrolled_at: b.enrolled_at || '',
      lead_trainer_name: b.lead_trainer_name ?? null,
      lead_trainer_email: b.lead_trainer_email ?? null,
      duration_days: b.duration_days !== null && b.duration_days !== undefined ? Number(b.duration_days) : null,
      total_sessions: Number(b.total_sessions || 0),
      completed_sessions: Number(b.completed_sessions || 0),
    }));
  } catch (err: any) {
    console.warn('[getStudentBatches fallback]:', String(err?.message || 'Connection unavailable'));
    return [];
  }
});

/**
 * Retrieves details for a specific batch for the student via FastAPI.
 */
export async function getStudentBatchDetails(
  _studentId: string,
  batchId: string
): Promise<{
  batch: StudentBatchItem;
  trainers: Array<{ id: string; full_name: string; email: string | null; role: string; is_lead: boolean }>;
  sessions: StudentSessionItem[];
  resources: StudentResourceItem[];
  attendance: {
    totalSessions: number;
    presentSessions: number;
    absentSessions: number;
    rate: number;
  };
} | null> {
  const safeBatchId = assertUuid(batchId, 'batchId');
  try {
    const data = await apiGet<any>(`/students/me/batches/${safeBatchId}/details`);
    if (!data || !data.batch) return null;

    const b = data.batch;
    const batch: StudentBatchItem = {
      id: String(b.id),
      code: b.code || b.batch_code || '',
      program_name: b.program_name || '',
      program_description: b.program_description ?? null,
      start_date: b.start_date || '',
      end_date: b.end_date || '',
      status: b.status || 'active',
      college_name: b.college_name || '',
      enrolled_at: b.enrolled_at || '',
      lead_trainer_name: b.lead_trainer_name ?? null,
      lead_trainer_email: b.lead_trainer_email ?? null,
      duration_days: b.duration_days !== null && b.duration_days !== undefined ? Number(b.duration_days) : null,
      total_sessions: Number(b.total_sessions || 0),
      completed_sessions: Number(b.completed_sessions || 0),
    };

    const trainers = (data.trainers || []).map((t: any) => ({
      id: String(t.id),
      full_name: t.full_name || '',
      email: t.email ?? null,
      role: t.role || 'faculty',
      is_lead: Boolean(t.is_lead),
    }));

    const sessions: StudentSessionItem[] = (data.sessions || []).map((s: any) => ({
      id: String(s.id),
      batch_id: String(s.batch_id),
      batch_code: s.batch_code || '',
      program_name: s.program_name || '',
      date: s.date,
      start_time: s.start_time ?? null,
      end_time: s.end_time ?? null,
      title: s.title,
      topic: s.topic ?? null,
      status: s.status,
      trainer_name: s.trainer_name ?? null,
      attendance_status: s.attendance_status || 'unmarked',
      attendance_notes: s.attendance_notes ?? null,
    }));

    const resources: StudentResourceItem[] = (data.resources || []).map((r: any) => ({
      id: String(r.id),
      batch_id: String(r.batch_id),
      batch_code: r.batch_code || '',
      program_name: r.program_name || '',
      name: r.name || r.title || '',
      type: r.type,
      url: r.url,
      description: r.description ?? null,
      created_at: r.created_at || '',
    }));

    const attendance = {
      totalSessions: Number(data.attendance?.totalSessions || 0),
      presentSessions: Number(data.attendance?.presentSessions || 0),
      absentSessions: Number(data.attendance?.absentSessions || 0),
      rate: Number(data.attendance?.rate || 0),
    };

    return { batch, trainers, sessions, resources, attendance };
  } catch (err: any) {
    console.warn('[getStudentBatchDetails fallback]:', String(err?.message || 'Connection unavailable'));
    return null;
  }
}

/**
 * Retrieves all sessions for all batches the student is enrolled in via FastAPI.
 */
export async function getStudentSessions(
  _studentId: string,
  options?: { batchId?: string; filter?: 'all' | 'upcoming' | 'past' }
): Promise<StudentSessionItem[]> {
  try {
    const params: Record<string, string> = {};
    if (options?.batchId && options.batchId !== 'all') {
      params.batch_id = options.batchId;
    }
    if (options?.filter && options.filter !== 'all') {
      params.filter = options.filter;
    }

    const sessions = await apiGet<any[]>('/students/me/sessions', params);
    if (!sessions) return [];

    return sessions.map((s) => ({
      id: String(s.id),
      batch_id: String(s.batch_id),
      batch_code: s.batch_code || '',
      program_name: s.program_name || '',
      date: s.date,
      start_time: s.start_time ?? null,
      end_time: s.end_time ?? null,
      title: s.title,
      topic: s.topic ?? null,
      status: s.status,
      trainer_name: s.trainer_name ?? null,
      attendance_status: s.attendance_status || 'unmarked',
      attendance_notes: s.attendance_notes ?? null,
    }));
  } catch (err: any) {
    console.warn('[getStudentSessions fallback]:', String(err?.message || 'Connection unavailable'));
    return [];
  }
}

/**
 * Retrieves the comprehensive attendance summary and history for a student via FastAPI.
 */
export async function getStudentAttendanceSummary(
  _studentId: string
): Promise<StudentAttendanceSummary> {
  try {
    const data = await apiGet<any>('/attendance/me/summary');
    if (!data) {
      return {
        totalRecordedSessions: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        unmarkedCompletedSessions: 0,
        percentage: 0,
        history: [],
      };
    }

    const history: StudentSessionItem[] = (data.history || []).map((s: any) => ({
      id: String(s.sessionId || s.session_id || s.id),
      batch_id: String(s.batchId || s.batch_id),
      batch_code: s.batchCode || s.batch_code || '',
      program_name: s.programName || s.program_name || '',
      date: s.date,
      start_time: s.start_time ?? null,
      end_time: s.end_time ?? null,
      title: s.title,
      topic: s.topic ?? null,
      status: s.status === 'completed' || s.status === 'scheduled' ? s.status : 'completed',
      trainer_name: s.trainer_name ?? null,
      attendance_status: s.status || s.attendance_status || 'unmarked',
      attendance_notes: (s.remarks || s.notes || s.attendance_notes) ?? null,
    }));

    return {
      totalRecordedSessions: Number(data.totalRecordedSessions || data.totalSessions || 0),
      presentCount: Number(data.presentCount || 0),
      absentCount: Number(data.absentCount || 0),
      lateCount: Number(data.lateCount || 0),
      excusedCount: Number(data.excusedCount || 0),
      unmarkedCompletedSessions: Number(data.unmarkedCompletedSessions || 0),
      percentage: Number(data.percentage || data.attendancePercentage || 0),
      history,
    };
  } catch (err: any) {
    console.warn('[getStudentAttendanceSummary fallback]:', String(err?.message || 'Connection unavailable'));
    return {
      totalRecordedSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      unmarkedCompletedSessions: 0,
      percentage: 0,
      history: [],
    };
  }
}

/**
 * Retrieves all learning resources available to the student across enrolled batches via FastAPI.
 */
export async function getStudentResources(
  _studentId: string,
  options?: { batchId?: string; search?: string; type?: string }
): Promise<StudentResourceItem[]> {
  try {
    const resources = await apiGet<any[]>('/resources/me');
    if (!resources) return [];

    let filtered = resources.map((r) => ({
      id: String(r.id),
      batch_id: String(r.batch_id),
      batch_code: r.batch_code || '',
      program_name: r.program_name || '',
      name: r.name || r.title || '',
      type: r.type,
      url: r.url,
      description: r.description ?? null,
      created_at: r.created_at || '',
    }));

    if (options?.batchId && options.batchId !== 'all') {
      filtered = filtered.filter((r) => r.batch_id === options.batchId);
    }
    if (options?.type && options.type !== 'all') {
      filtered = filtered.filter((r) => r.type === options.type);
    }
    if (options?.search?.trim()) {
      const q = options.search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.batch_code.toLowerCase().includes(q)
      );
    }

    return filtered;
  } catch (err: any) {
    console.warn('[getStudentResources fallback]:', String(err?.message || 'Connection unavailable'));
    return [];
  }
}

/**
 * High-performance composite query for the Student Home Dashboard via FastAPI.
 */
export async function getStudentDashboardData(
  studentId: string
): Promise<{
  profile: StudentProfileData;
  batches: StudentBatchItem[];
  todaySession: StudentSessionItem | null;
  upcomingSession: StudentSessionItem | null;
  upcomingAssessment: StudentAssessmentItem | null;
  trainingProgressPct: number;
  totalBatchSessions: number;
  completedBatchSessions: number;
  attendanceSummary: {
    totalRecorded: number;
    presentCount: number;
    absentCount: number;
    percentage: number;
  };
  recentResources: StudentResourceItem[];
} | null> {
  try {
    const data = await apiGet<any>('/students/me/dashboard');
    if (!data || !data.profile) return null;

    const profile: StudentProfileData = {
      id: String(data.profile.id),
      roll_number: data.profile.roll_number,
      full_name: data.profile.full_name || '',
      email: data.profile.email ?? null,
      phone: data.profile.phone ?? null,
      department: data.profile.department ?? null,
      year_or_semester: data.profile.year_or_semester ?? null,
      college_id: String(data.profile.college_id),
      college_name: data.profile.college_name || 'Institution',
      college_city: data.profile.college_city ?? null,
      college_state: data.profile.college_state ?? null,
    };

    const batches: StudentBatchItem[] = (data.batches || []).map((b: any) => ({
      id: String(b.id),
      code: b.code || b.batch_code || '',
      program_name: b.program_name || '',
      program_description: b.program_description ?? null,
      start_date: b.start_date || '',
      end_date: b.end_date || '',
      status: b.status || 'active',
      college_name: b.college_name || '',
      enrolled_at: b.enrolled_at || '',
      lead_trainer_name: b.lead_trainer_name ?? null,
      lead_trainer_email: b.lead_trainer_email ?? null,
      duration_days: b.duration_days !== null && b.duration_days !== undefined ? Number(b.duration_days) : null,
      total_sessions: Number(b.total_sessions || 0),
      completed_sessions: Number(b.completed_sessions || 0),
    }));

    const todaySession: StudentSessionItem | null = data.todaySession
      ? {
          id: String(data.todaySession.id),
          batch_id: String(data.todaySession.batch_id),
          batch_code: data.todaySession.batch_code || '',
          program_name: data.todaySession.program_name || '',
          date: data.todaySession.date,
          start_time: data.todaySession.start_time ?? null,
          end_time: data.todaySession.end_time ?? null,
          title: data.todaySession.title,
          topic: data.todaySession.topic ?? null,
          status: data.todaySession.status,
          trainer_name: data.todaySession.trainer_name ?? null,
          attendance_status: data.todaySession.attendance_status || 'unmarked',
          attendance_notes: data.todaySession.attendance_notes ?? null,
        }
      : null;

    const upcomingSession: StudentSessionItem | null = data.upcomingSession
      ? {
          id: String(data.upcomingSession.id),
          batch_id: String(data.upcomingSession.batch_id),
          batch_code: data.upcomingSession.batch_code || '',
          program_name: data.upcomingSession.program_name || '',
          date: data.upcomingSession.date,
          start_time: data.upcomingSession.start_time ?? null,
          end_time: data.upcomingSession.end_time ?? null,
          title: data.upcomingSession.title,
          topic: data.upcomingSession.topic ?? null,
          status: data.upcomingSession.status,
          trainer_name: data.upcomingSession.trainer_name ?? null,
          attendance_status: data.upcomingSession.attendance_status || 'unmarked',
          attendance_notes: data.upcomingSession.attendance_notes ?? null,
        }
      : null;

    const upcomingAssessment: StudentAssessmentItem | null = data.upcomingAssessment
      ? {
          id: String(data.upcomingAssessment.id),
          batch_id: String(data.upcomingAssessment.batch_id),
          batch_code: data.upcomingAssessment.batch_code || '',
          program_name: data.upcomingAssessment.program_name || '',
          title: data.upcomingAssessment.title,
          type: data.upcomingAssessment.type || 'quiz',
          topic: data.upcomingAssessment.topic ?? null,
          description: data.upcomingAssessment.description ?? null,
          duration_minutes: Number(data.upcomingAssessment.duration_minutes || 30),
          total_marks: Number(data.upcomingAssessment.total_marks || 100),
          passing_marks: Number(data.upcomingAssessment.passing_marks || 40),
          start_time: data.upcomingAssessment.start_time ?? null,
          deadline: data.upcomingAssessment.deadline ?? data.upcomingAssessment.end_time ?? null,
          due_date: data.upcomingAssessment.due_date ?? null,
          shuffle_questions: Boolean(data.upcomingAssessment.shuffle_questions),
          anti_cheat_enabled: Boolean(data.upcomingAssessment.anti_cheat_enabled),
          questions_count: Number(data.upcomingAssessment.questions_count || 0),
          status: data.upcomingAssessment.status || 'published',
          student_status: data.upcomingAssessment.submission_status || 'not_started',
          score: data.upcomingAssessment.score !== null && data.upcomingAssessment.score !== undefined ? Number(data.upcomingAssessment.score) : null,
          feedback: data.upcomingAssessment.feedback ?? null,
          submitted_at: data.upcomingAssessment.submitted_at ?? null,
        }
      : null;

    const recentResources: StudentResourceItem[] = (data.recentResources || []).map((r: any) => ({
      id: String(r.id),
      batch_id: String(r.batch_id),
      batch_code: r.batch_code || '',
      program_name: r.program_name || '',
      name: r.name || r.title || '',
      type: r.type,
      url: r.url,
      description: r.description ?? null,
      created_at: r.created_at || '',
    }));

    return {
      profile,
      batches,
      todaySession,
      upcomingSession,
      upcomingAssessment,
      trainingProgressPct: Number(data.trainingProgressPct || 0),
      totalBatchSessions: Number(data.totalBatchSessions || 0),
      completedBatchSessions: Number(data.completedBatchSessions || 0),
      attendanceSummary: {
        totalRecorded: Number(data.attendanceSummary?.totalRecorded || 0),
        presentCount: Number(data.attendanceSummary?.presentCount || 0),
        absentCount: Number(data.attendanceSummary?.absentCount || 0),
        percentage: Number(data.attendanceSummary?.percentage || 0),
      },
      recentResources,
    };
  } catch (err: any) {
    console.warn('[getStudentDashboardData fallback]:', String(err?.message || 'Connection unavailable'));
    return null;
  }
}

/**
 * Retrieves all assessments published for the student's enrolled cohorts via FastAPI.
 */
export async function getStudentAssessments(
  _studentId: string,
  options?: { batchId?: string }
): Promise<StudentAssessmentItem[]> {
  try {
    const list = await apiGet<any[]>('/assessments/student/available');
    if (!list) return [];

    let filtered = list.map((a) => ({
      id: String(a.id),
      batch_id: String(a.batch_id),
      batch_code: a.batch_code || '',
      program_name: a.program_name || '',
      title: a.title,
      type: a.type || 'quiz',
      topic: a.topic ?? null,
      description: a.description ?? null,
      duration_minutes: Number(a.duration_minutes || 30),
      total_marks: Number(a.total_marks || 100),
      passing_marks: Number(a.passing_marks || 40),
      start_time: a.start_time ?? null,
      deadline: a.deadline ?? a.end_time ?? null,
      due_date: a.due_date ?? null,
      shuffle_questions: Boolean(a.shuffle_questions ?? true),
      anti_cheat_enabled: Boolean(a.anti_cheat_enabled ?? true),
      questions_count: Number(a.questions_count || 0),
      status: a.status || 'published',
      student_status: (a.submission_status || (a.submitted ? 'submitted' : 'not_started')) as any,
      score: a.score !== null && a.score !== undefined ? Number(a.score) : null,
      feedback: a.feedback ?? null,
      submitted_at: a.submitted_at ?? null,
    }));

    if (options?.batchId && options.batchId !== 'all') {
      filtered = filtered.filter((a) => a.batch_id === options.batchId);
    }

    return filtered;
  } catch (err: any) {
    console.warn('[getStudentAssessments fallback]:', String(err?.message || 'Connection unavailable'));
    return [];
  }
}

/**
 * Retrieves interactive quiz player data for a student via FastAPI.
 */
export async function getStudentQuizData(
  assessmentId: string,
  _studentId: string
): Promise<StudentQuizData | null> {
  const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
  try {
    const a = await apiGet<any>(`/assessments/${safeAssessmentId}`);
    if (!a) return null;

    const now = new Date();
    const startTimeObj = a.start_time ? new Date(a.start_time) : null;
    const deadlineObj = a.deadline || a.end_time ? new Date(a.deadline || a.end_time) : null;

    const isUpcoming = startTimeObj ? startTimeObj > now : false;
    const isExpired = deadlineObj ? deadlineObj < now : false;
    const isActive = !isUpcoming && !isExpired;

    const rawQuestions: any[] = Array.isArray(a.questions) ? a.questions : [];
    const clientQuestions: StudentQuizClientQuestion[] = rawQuestions.map((q) => ({
      id: String(q.id),
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
      points: Number(q.points || 1),
    }));

    const submission = a.submission_status || a.submitted
      ? {
          status: a.submission_status || (a.submitted ? 'submitted' : 'not_started'),
          score: a.score !== null && a.score !== undefined ? Number(a.score) : null,
          submittedAt: a.submitted_at ?? null,
          answers: a.answers || {},
          version: Number(a.version || 1),
        }
      : null;

    return {
      assessment: {
        id: String(a.id),
        title: a.title,
        topic: a.topic ?? null,
        description: a.description ?? null,
        durationMinutes: Number(a.duration_minutes || 30),
        totalMarks: Number(a.total_marks || 100),
        passingMarks: Number(a.passing_marks || 40),
        startTime: a.start_time ?? null,
        deadline: a.deadline ?? a.end_time ?? null,
        shuffleQuestions: Boolean(a.shuffle_questions ?? true),
        antiCheatEnabled: Boolean(a.anti_cheat_enabled ?? true),
        batchCode: a.batch_code || '',
        programName: a.program_name || '',
        questionsCount: Number(a.questions_count ?? clientQuestions.length),
      },
      questions: clientQuestions,
      isUpcoming,
      isActive,
      isExpired,
      submission,
    };
  } catch (err: any) {
    console.warn('[getStudentQuizData fallback]:', String(err?.message || 'Connection unavailable'));
    return null;
  }
}

/**
 * Evaluates student answers, calculates score, and saves submission via FastAPI.
 */
export async function submitStudentQuizAnswers(params: {
  assessmentId: string;
  studentId: string;
  answers: Record<string, number>;
  violationsCount?: number;
}): Promise<{
  success: boolean;
  status: string;
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  violationsCount: number;
  answersReleased: boolean;
  review: Array<{
    id: string;
    question: string;
    options: string[];
    selectedOptionIndex: number | null;
    correctOptionIndex: number | null;
    isCorrect: boolean | null;
    points: number;
    explanation?: string;
  }>;
}> {
  const safeAssessmentId = assertUuid(params.assessmentId, 'assessmentId');
  const result = await apiPost<any>('/assessments/submit', {
    assessment_id: safeAssessmentId,
    answers: params.answers,
  });

  return {
    success: true,
    status: String(result.status || 'evaluated'),
    score: Number(result.score || 0),
    totalMarks: Number(result.totalMarks || result.total_marks || 100),
    percentage: Number(result.percentage || 0),
    isPassed: Boolean(result.isPassed ?? result.is_passed),
    violationsCount: Number(result.violations_count || 0),
    answersReleased: Boolean(result.answers_released),
    review: (result.review || []).map((r: any) => ({
      id: String(r.id),
      question: r.question,
      options: r.options || [],
      selectedOptionIndex: r.selectedOptionIndex !== null && r.selectedOptionIndex !== undefined ? Number(r.selectedOptionIndex) : null,
      correctOptionIndex: r.correctOptionIndex !== null && r.correctOptionIndex !== undefined ? Number(r.correctOptionIndex) : null,
      isCorrect: r.isCorrect !== null && r.isCorrect !== undefined ? Boolean(r.isCorrect) : (r.is_correct !== null && r.is_correct !== undefined ? Boolean(r.is_correct) : null),
      points: Number(r.points || 1),
      explanation: r.explanation ?? undefined,
    })),
  };
}

export interface StudentCertificateEligibilityItem {
  batchId: string;
  batchCode: string;
  programName: string;
  collegeName: string;
  attendanceRate: number;
  attendanceRequired: number;
  attendanceMet: boolean;
  sessionsCompleted: number;
  totalSessions: number;
  allSessionsFinished: boolean;
  feedbackSubmitted: boolean;
  feedbackRequired: boolean;
  pendingRequirement: string | null;
  isEligible: boolean;
  issued: boolean;
  certificateNumber: string | null;
}

/**
 * Evaluates certificate eligibility for student batches via FastAPI.
 */
export async function getStudentCertificates(
  _studentId: string
): Promise<Array<StudentCertificateEligibilityItem>> {
  try {
    const resp = await apiGet<any>('/certificates/me/eligibility');
    if (!resp || !resp.certificates) return [];

    return resp.certificates.map((c: any) => ({
      batchId: String(c.batchId),
      batchCode: c.batchCode,
      programName: c.programName,
      collegeName: c.collegeName,
      attendanceRate: Number(c.attendanceRate || 0),
      attendanceRequired: Number(c.attendanceRequired || 80),
      attendanceMet: Boolean(c.attendanceMet),
      sessionsCompleted: Number(c.sessionsCompleted || 0),
      totalSessions: Number(c.totalSessions || 0),
      allSessionsFinished: Boolean(c.allSessionsFinished),
      feedbackSubmitted: Boolean(c.feedbackSubmitted),
      feedbackRequired: Boolean(c.feedbackRequired ?? true),
      pendingRequirement: c.pendingRequirement ?? null,
      isEligible: Boolean(c.isEligible),
      issued: Boolean(c.issued),
      certificateNumber: c.certificateNumber ?? null,
    }));
  } catch (err: any) {
    console.warn('[getStudentCertificates fallback]:', String(err?.message || 'Connection unavailable'));
    return [];
  }
}

/**
 * Retrieves pending post-training feedback requests for the authenticated student.
 */
export async function getStudentPendingFeedbackList(): Promise<Array<{
  batch_id: string;
  batch_code: string;
  program_name: string;
  college_name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  unlocked_at: string | null;
}>> {
  try {
    const resp = await apiGet<any[]>('/student/feedback/pending');
    if (!resp || !Array.isArray(resp)) return [];
    return resp.map((item) => ({
      batch_id: String(item.batch_id),
      batch_code: item.batch_code || '',
      program_name: item.program_name || '',
      college_name: item.college_name || '',
      start_date: item.start_date ?? null,
      end_date: item.end_date ?? null,
      status: item.status || 'completed',
      unlocked_at: item.unlocked_at ?? null,
    }));
  } catch (err: any) {
    console.warn('[getStudentPendingFeedbackList fallback]:', String(err?.message || 'Connection unavailable'));
    return [];
  }
}
