'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { assertUuid } from '@/lib/validations/ids';
import {
  StudentQuizData,
  getStudentQuizData,
  submitStudentQuizAnswers,
} from '@/lib/db/studentPortal';
import {
  startExamAttempt,
  saveExamProgress,
  logExamSecurityEvent,
  SecurityEventType,
  ExamStartResponse,
  ExamSaveProgressResponse,
  ExamSecurityEventResponse,
} from '@/lib/api/proctoring';

export type GetQuizActionResult =
  | { success: true; data: StudentQuizData }
  | { success: false; error: string };

export async function getStudentQuizAction(assessmentId: string): Promise<GetQuizActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return { success: false, error: 'Unauthorized: Student login required.' };
  }

  try {
    const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
    const data = await getStudentQuizData(safeAssessmentId, session.id);
    if (!data) {
      return { success: false, error: 'Quiz not found or you are not enrolled in this batch.' };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to load quiz.' };
  }
}

export type SubmitQuizActionResult =
  | {
      success: true;
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
    }
  | {
      success: false;
      error: string;
    };

export async function submitStudentQuizAction(payload: {
  assessmentId: string;
  answers: Record<string, number>;
  violationsCount?: number;
}): Promise<SubmitQuizActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return { success: false, error: 'Unauthorized: Student login required.' };
  }

  try {
    const safeAssessmentId = assertUuid(payload.assessmentId, 'assessmentId');
    const result = await submitStudentQuizAnswers({
      assessmentId: safeAssessmentId,
      studentId: session.id,
      answers: payload.answers,
      violationsCount: payload.violationsCount || 0,
    });

    revalidatePath('/student/tests');
    revalidatePath(`/student/tests/${safeAssessmentId}`);
    revalidatePath('/student');

    return {
      success: true,
      status: result.status,
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      isPassed: result.isPassed,
      violationsCount: result.violationsCount,
      answersReleased: result.answersReleased,
      review: result.review,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit quiz.' };
  }
}

export async function startStudentExamAction(assessmentId: string): Promise<
  | { success: true; data: ExamStartResponse }
  | { success: false; error: string }
> {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return { success: false, error: 'Unauthorized: Student login required.' };
  }

  try {
    const safeAssessmentId = assertUuid(assessmentId, 'assessmentId');
    const data = await startExamAttempt(safeAssessmentId);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to initialize exam terminal.' };
  }
}

export async function saveStudentExamProgressAction(payload: {
  assessmentId: string;
  answers: Record<string, number>;
  violationsCount?: number;
  expectedVersion?: number;
}): Promise<
  | { success: true; data: ExamSaveProgressResponse }
  | { success: false; error: string }
> {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return { success: false, error: 'Unauthorized: Student login required.' };
  }

  try {
    const safeAssessmentId = assertUuid(payload.assessmentId, 'assessmentId');
    const data = await saveExamProgress(
      safeAssessmentId,
      payload.answers,
      payload.violationsCount,
      payload.expectedVersion ?? 1
    );
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to auto-save exam answers.' };
  }
}

export async function logStudentSecurityEventAction(payload: {
  assessmentId: string;
  eventType: SecurityEventType;
  sequenceNumber: number;
  durationSeconds?: number;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}): Promise<
  | { success: true; data: ExamSecurityEventResponse }
  | { success: false; error: string }
> {
  const session = await getSession();
  if (!session || session.role !== 'student') {
    return { success: false, error: 'Unauthorized: Student login required.' };
  }

  try {
    const safeAssessmentId = assertUuid(payload.assessmentId, 'assessmentId');
    const data = await logExamSecurityEvent(safeAssessmentId, {
      event_type: payload.eventType,
      sequence_number: payload.sequenceNumber,
      duration_seconds: payload.durationSeconds,
      event_metadata: payload.metadata,
      idempotency_key: payload.idempotencyKey,
    });
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to log integrity event.' };
  }
}

