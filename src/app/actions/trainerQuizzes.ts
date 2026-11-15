'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { assertUuid } from '@/lib/validations/ids';
import {
  createTrainerAssessment,
  deleteTrainerAssessment,
  getTrainerAssessmentDetails,
} from '@/lib/db/trainerAssessments';
import { getExamProctoringLogs } from '@/lib/api/proctoring';
import { ParsedQuizQuestion } from '@/lib/quizParser';

export interface CreateQuizPayload {
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
}

export async function createTrainerQuizAction(payload: CreateQuizPayload): Promise<{
  success: boolean;
  error?: string;
  quizId?: string;
}> {
  const session = await getSession();
  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    return { success: false, error: 'Unauthorized: Only trainers can schedule assessments.' };
  }

  if (!payload.batchId || !payload.title.trim()) {
    return { success: false, error: 'Batch and quiz title are required.' };
  }

  if (!payload.questions || payload.questions.length === 0) {
    return { success: false, error: 'At least one valid question is required.' };
  }

  if (!payload.startTime || !payload.deadline) {
    return { success: false, error: 'Both start time and deadline are required.' };
  }

  if (new Date(payload.deadline) <= new Date(payload.startTime)) {
    return { success: false, error: 'The deadline must be later than the start time.' };
  }

  try {
    const safeBatchId = assertUuid(payload.batchId, 'batchId');
    const result = await createTrainerAssessment({
      trainerId: session.id,
      batchId: safeBatchId,
      title: payload.title,
      topic: payload.topic,
      description: payload.description,
      durationMinutes: payload.durationMinutes || 30,
      totalMarks: payload.totalMarks || payload.questions.length,
      passingMarks: payload.passingMarks || Math.round(payload.totalMarks * 0.5),
      startTime: payload.startTime,
      deadline: payload.deadline,
      shuffleQuestions: payload.shuffleQuestions,
      antiCheatEnabled: payload.antiCheatEnabled,
      questions: payload.questions,
    });

    revalidatePath('/trainer/tests');
    revalidatePath(`/trainer/batches/${safeBatchId}`);
    revalidatePath('/student/tests');

    return { success: true, quizId: result.id };
  } catch (err: any) {
    console.error('[Create Quiz Action Error]:', err);
    return { success: false, error: err.message || 'Failed to create assessment.' };
  }
}

export async function deleteTrainerQuizAction(assessmentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await getSession();
  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
    const deleted = await deleteTrainerAssessment(safeAssessmentId, session.id);
    if (!deleted) {
      return { success: false, error: 'Assessment not found or unauthorized.' };
    }

    revalidatePath('/trainer/tests');
    revalidatePath('/student/tests');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete assessment.' };
  }
}

export async function getTrainerAssessmentDetailsAction(assessmentId: string) {
  const session = await getSession();
  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
    const details = await getTrainerAssessmentDetails(safeAssessmentId, session.id);
    return { success: true, details };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch assessment details.' };
  }
}

export async function getExamProctoringLogsAction(assessmentId: string, studentId?: string) {
  const session = await getSession();
  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
    const safeStudentId = studentId ? assertUuid(studentId, 'studentId') : undefined;
    const summary = await getExamProctoringLogs(safeAssessmentId, safeStudentId);
    return { success: true, summary };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch proctoring logs.' };
  }
}
