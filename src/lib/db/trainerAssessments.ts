/**
 * Trainer Assessments Data Access Layer — Fully migrated to FastAPI Backend.
 * Direct SQL queries have been retired in Stage D.
 */
import { apiGet, apiPost, apiDelete } from '@/lib/api/client';
import { ParsedQuizQuestion } from '@/lib/quizParser';
import { assertUuid } from '@/lib/validations/ids';

export interface TrainerAssessmentItem {
  id: string;
  batch_id: string;
  batch_code: string;
  college_name: string;
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
  shuffle_questions: boolean;
  anti_cheat_enabled: boolean;
  status: 'draft' | 'published' | 'closed';
  questions_count: number;
  total_submissions: number;
  evaluated_submissions: number;
  average_score: number | null;
  created_at: string;
}

export interface TrainerAssessmentDetail {
  assessment: TrainerAssessmentItem;
  questions: ParsedQuizQuestion[];
  submissions: Array<{
    student_id: string;
    roll_number: string;
    full_name: string;
    department: string | null;
    status: string;
    score: number | null;
    submitted_at: string | null;
    violations_count: number;
  }>;
}

/**
 * Retrieves all assessments created or assigned to this trainer across their batches.
 */
export async function getTrainerAssessments(
  _trainerId: string,
  options?: { batchId?: string }
): Promise<TrainerAssessmentItem[]> {
  const safeBatchId =
    options?.batchId && options.batchId !== 'all'
      ? assertUuid(options.batchId, 'batchId')
      : undefined;
  try {
    const params: Record<string, string> = {};
    if (safeBatchId) {
      params.batch_id = safeBatchId;
    }

    const items = await apiGet<any[]>('/assessments/trainer/all', params);
    if (!items) return [];

    return items.map((a) => ({
      id: String(a.id),
      batch_id: String(a.batch_id),
      batch_code: a.batch_code,
      college_name: a.college_name,
      program_name: a.program_name,
      title: a.title,
      type: a.type,
      topic: a.topic ?? null,
      description: a.description ?? null,
      duration_minutes: Number(a.duration_minutes || 30),
      total_marks: Number(a.total_marks || 100),
      passing_marks: Number(a.passing_marks || 40),
      start_time: a.start_time ?? null,
      deadline: a.deadline ?? null,
      shuffle_questions: Boolean(a.shuffle_questions),
      anti_cheat_enabled: Boolean(a.anti_cheat_enabled),
      status: a.status,
      questions_count: Number(a.questions_count || 0),
      total_submissions: Number(a.total_submissions || 0),
      evaluated_submissions: Number(a.evaluated_submissions || 0),
      average_score: a.average_score !== null && a.average_score !== undefined ? Number(a.average_score) : null,
      created_at: a.created_at || '',
    }));
  } catch (err) {
    console.error('[getTrainerAssessments error]:', err);
    return [];
  }
}

/**
 * Retrieves full details of a specific quiz, including questions and student submissions.
 */
export async function getTrainerAssessmentDetails(
  assessmentId: string,
  _trainerId: string
): Promise<TrainerAssessmentDetail | null> {
  const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
  try {
    const data = await apiGet<any>(`/assessments/${safeAssessmentId}/trainer-details`);
    if (!data || !data.assessment) return null;

    const a = data.assessment;
    const questions: ParsedQuizQuestion[] = Array.isArray(data.questions) ? data.questions : [];
    const submissions = (data.submissions || []).map((s: any) => ({
      student_id: String(s.student_id),
      roll_number: s.roll_number,
      full_name: s.full_name,
      department: s.department ?? null,
      status: s.status || 'not_started',
      score: s.score !== null && s.score !== undefined ? Number(s.score) : null,
      submitted_at: s.submitted_at ?? null,
      violations_count: Number(s.violations_count || 0),
    }));

    return {
      assessment: {
        id: String(a.id),
        batch_id: String(a.batch_id),
        batch_code: a.batch_code,
        college_name: a.college_name,
        program_name: a.program_name,
        title: a.title,
        type: a.type,
        topic: a.topic ?? null,
        description: a.description ?? null,
        duration_minutes: Number(a.duration_minutes || 30),
        total_marks: Number(a.total_marks || 100),
        passing_marks: Number(a.passing_marks || 40),
        start_time: a.start_time ?? null,
        deadline: a.deadline ?? null,
        shuffle_questions: Boolean(a.shuffle_questions),
        anti_cheat_enabled: Boolean(a.anti_cheat_enabled),
        status: a.status,
        questions_count: questions.length,
        total_submissions: Number(a.total_submissions || 0),
        evaluated_submissions: Number(a.evaluated_submissions || 0),
        average_score: a.average_score !== null && a.average_score !== undefined ? Number(a.average_score) : null,
        created_at: a.created_at || '',
      },
      questions,
      submissions,
    };
  } catch (err) {
    console.error('[getTrainerAssessmentDetails error]:', err);
    return null;
  }
}

/**
 * Creates and publishes a new quiz/assessment for a batch via FastAPI.
 */
export async function createTrainerAssessment(params: {
  trainerId: string;
  batchId: string;
  title: string;
  topic?: string;
  description?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startTime: string; // ISO string
  deadline: string; // ISO string
  shuffleQuestions: boolean;
  antiCheatEnabled: boolean;
  questions: ParsedQuizQuestion[];
}): Promise<{ id: string }> {
  const safeBatchId = assertUuid(params.batchId, 'batchId');
  const result = await apiPost<any>('/assessments', {
    batch_id: safeBatchId,
    title: params.title.trim(),
    topic: params.topic?.trim() || null,
    description: params.description?.trim() || null,
    type: 'quiz',
    duration_minutes: params.durationMinutes,
    total_marks: params.totalMarks,
    passing_marks: params.passingMarks,
    start_time: params.startTime,
    deadline: params.deadline,
    due_date: params.deadline,
    shuffle_questions: params.shuffleQuestions,
    anti_cheat_enabled: params.antiCheatEnabled,
    questions: params.questions,
    status: 'published',
    is_published: true,
  });

  return { id: String(result.id) };
}

/**
 * Deletes a quiz created by the trainer via FastAPI.
 */
export async function deleteTrainerAssessment(
  assessmentId: string,
  _trainerId: string
): Promise<boolean> {
  const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
  try {
    await apiDelete(`/assessments/${safeAssessmentId}`);
    return true;
  } catch (err) {
    console.error('[deleteTrainerAssessment error]:', err);
    return false;
  }
}
