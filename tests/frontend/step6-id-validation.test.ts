import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

import { withActionContext } from './test-harness';

import {
  createAdminUserAction,
  toggleAdminUserStatusAction,
  resetAdminUserPasswordAction,
} from '@/app/actions/adminUsers';
import { recordAttendanceAction } from '@/app/actions/attendance';
import {
  createBatchAction,
  createBatchFullWorkflowAction,
  updateBatchStatusAction,
} from '@/app/actions/batches';
import {
  updateCollegeAction,
  updateCollegeStatusAction,
} from '@/app/actions/colleges';
import {
  unlockBatchFeedbackAction,
  submitStudentFeedbackAction,
} from '@/app/actions/feedback';
import { deleteProgramAction } from '@/app/actions/programs';
import { createResourceAction } from '@/app/actions/resources';
import {
  getStudentQuizAction,
  submitStudentQuizAction,
  startStudentExamAction,
  saveStudentExamProgressAction,
  logStudentSecurityEventAction,
} from '@/app/actions/studentQuiz';
import {
  uploadStudentsBulkAction,
  addSingleStudentAction,
  removeStudentFromBatchAction,
  assignBatchStudentCredentialsAction,
  deleteBatchStudentCredentialsAction,
  assignSingleStudentCredentialAction,
  deleteSingleStudentCredentialAction,
  previewRosterAction,
  importRosterAndProvisionAction,
  updateStudentStatusAction,
  resetStudentActivationAction,
  revokeStudentSessionsAction,
  deleteStudentAction,
  previewBulkDeleteAction,
  executeBulkStudentAction,
} from '@/app/actions/students';
import {
  saveTrainerLiveAttendanceAction,
  getTrainerBatchRosterForDateAction,
} from '@/app/actions/trainerAttendance';
import {
  createTrainerQuizAction,
  deleteTrainerQuizAction,
  getTrainerAssessmentDetailsAction,
  getExamProctoringLogsAction,
} from '@/app/actions/trainerQuizzes';
import {
  updateTrainerAction,
  toggleTrainerStatusAction,
  assignTrainerToBatchAction,
  setLeadTrainerAction,
  removeTrainerFromBatchAction,
} from '@/app/actions/trainers';

import { GET as downloadCertificateRoute } from '@/app/api/certificates/[batchId]/download/route';

import * as dbAttendance from '@/lib/db/attendance';
import * as dbBatches from '@/lib/db/batches';
import * as dbCollegePortal from '@/lib/db/collegePortal';
import * as dbColleges from '@/lib/db/colleges';
import * as dbPrograms from '@/lib/db/programs';
import * as dbResources from '@/lib/db/resources';
import * as dbStudentPortal from '@/lib/db/studentPortal';
import * as dbStudents from '@/lib/db/students';
import * as dbTrainerAssessments from '@/lib/db/trainerAssessments';
import * as dbTrainerPortal from '@/lib/db/trainerPortal';
import * as dbTrainers from '@/lib/db/trainers';
import * as apiFeedback from '@/lib/api/feedback';
import * as apiProctoring from '@/lib/api/proctoring';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';
const BAD_IDS = ['../', '%2e%2e', `${VALID_UUID}?x=1`, 'not-a-uuid', 'abc/def', `${VALID_UUID}#frag`];

describe('Step 6 (P1-12 & P3-05): UUID & Path Segment Validation in Next.js', () => {
  it('src/lib/validations/ids.ts provides uuidSchema and assertUuid rejecting traversal and non-UUID inputs', async () => {
    const idsMod = await import('@/lib/validations/ids');
    assert.equal(idsMod.assertUuid(VALID_UUID, 'batchId'), VALID_UUID);

    for (const bad of BAD_IDS) {
      assert.equal(idsMod.uuidSchema.safeParse(bad).success, false);
      assert.throws(
        () => idsMod.assertUuid(bad, 'batchId'),
        (err: Error) => {
          assert.match(err.message, /Invalid batchId/i);
          assert.equal(err.message.includes('?x=1'), false);
          assert.equal(err.message.includes('%2e%2e'), false);
          return true;
        }
      );
    }
  });

  it('client.ts encodes remaining path segments and rejects /, .., %2e%2e, ?, and #', async () => {
    const client = await import('@/lib/api/client');
    assert.equal(typeof client.safePathSegment, 'function');
    assert.equal(client.safePathSegment('cohort alpha'), 'cohort%20alpha');

    for (const unsafe of ['../admin', '%2e%2e', 'a/b', 'id?x=1', 'id#frag']) {
      assert.throws(() => client.safePathSegment(unsafe, 'segment'));
    }

    await withActionContext({ id: VALID_UUID, role: 'super_admin' }, async (calls) => {
      for (const badPath of ['/batches/../admin', '/batches/%2e%2e/users', '/batches/abc?x=1', '/batches/abc#frag']) {
        await assert.rejects(() => client.apiGet(badPath));
      }
      assert.equal(calls.length, 0);
    });
  });

  it('certificate download route returns 400 and never builds backend URL for malicious batchId', async () => {
    for (const bad of BAD_IDS) {
      await withActionContext({ id: VALID_UUID, role: 'student', collegeId: VALID_UUID }, async (calls) => {
        const req = new NextRequest(`http://localhost:3000/api/certificates/test/download`);
        const res = await downloadCertificateRoute(req, { params: Promise.resolve({ batchId: bad }) });
        assert.equal(res.status, 400);
        assert.equal(calls.length, 0);
      });
    }
  });

  it('deleteStudentAction validates mode enum strictly and rejects invalid modes', async () => {
    await withActionContext({ id: VALID_UUID, role: 'super_admin' }, async (calls) => {
      const res = await deleteStudentAction(
        VALID_UUID,
        'drop_table' as unknown as 'archive' | 'permanent'
      );
      assert.equal(res.success, false);
      assert.equal(calls.length, 0);
    });
  });

  it('every server action rejects ../, %2e%2e, ?x=1, #frag, and non-UUID values with zero backend calls', async () => {
    const adminSession = { id: VALID_UUID, role: 'super_admin' as const };
    const trainerSession = { id: VALID_UUID, role: 'trainer' as const };
    const studentSession = { id: VALID_UUID, role: 'student' as const, collegeId: VALID_UUID };

    for (const bad of BAD_IDS) {
      await withActionContext(adminSession, async (calls) => {
        assert.equal((await createAdminUserAction({ email: 'a@b.c', full_name: 'Ab', role: 'college_admin', college_id: bad })).success, false);
        assert.equal((await toggleAdminUserStatusAction(bad, 'active')).success, false);
        assert.equal((await resetAdminUserPasswordAction(bad)).success, false);

        const attForm = new FormData();
        attForm.set('batchId', bad);
        attForm.set('date', '2026-10-01');
        assert.equal((await recordAttendanceAction(null, attForm)).success, false);

        const batchForm = new FormData();
        batchForm.set('code', 'B1');
        batchForm.set('collegeId', bad);
        batchForm.set('programId', VALID_UUID);
        batchForm.set('startDate', '2026-01-01');
        batchForm.set('endDate', '2026-02-01');
        assert.equal((await createBatchAction(batchForm)).success, false);
        assert.equal((await createBatchFullWorkflowAction({
          code: 'B1',
          collegeId: VALID_UUID,
          programId: bad,
          startDate: '2026-01-01',
          endDate: '2026-02-01',
          targetStrength: 30,
          status: 'planned',
        })).success, false);
        assert.equal((await createBatchFullWorkflowAction({
          code: 'B1',
          collegeId: VALID_UUID,
          programId: VALID_UUID,
          startDate: '2026-01-01',
          endDate: '2026-02-01',
          targetStrength: 30,
          status: 'planned',
          leadTrainerId: bad,
        })).success, false);
        assert.equal((await updateBatchStatusAction(bad, 'active')).success, false);

        const colForm = new FormData();
        colForm.set('name', 'Test College');
        colForm.set('status', 'active');
        assert.equal((await updateCollegeAction(bad, colForm)).success, false);
        assert.equal((await updateCollegeStatusAction(bad, 'active')).success, false);
        assert.equal((await unlockBatchFeedbackAction(bad)).success, false);
        assert.equal((await deleteProgramAction(bad)).success, false);

        const resForm = new FormData();
        resForm.set('batchId', bad);
        resForm.set('name', 'Notes');
        resForm.set('type', 'link');
        resForm.set('url', 'https://example.com/x');
        resForm.set('description', '');
        assert.equal((await createResourceAction(resForm)).success, false);

        const studentRow = { rollNumber: 'R1', fullName: 'Student One' };
        assert.equal((await uploadStudentsBulkAction(bad, VALID_UUID, [studentRow])).success, false);
        assert.equal((await addSingleStudentAction(VALID_UUID, bad, studentRow)).success, false);
        assert.equal((await removeStudentFromBatchAction(VALID_UUID, bad, VALID_UUID)).success, false);
        assert.equal((await assignBatchStudentCredentialsAction(bad)).success, false);
        assert.equal((await deleteBatchStudentCredentialsAction(bad)).success, false);
        assert.equal((await assignSingleStudentCredentialAction(bad, VALID_UUID)).success, false);
        assert.equal((await assignSingleStudentCredentialAction(VALID_UUID, bad)).success, false);
        assert.equal((await deleteSingleStudentCredentialAction(bad, VALID_UUID)).success, false);
        assert.equal((await deleteSingleStudentCredentialAction(VALID_UUID, bad)).success, false);
        assert.equal((await previewRosterAction(bad, VALID_UUID, [])).success, false);
        assert.equal((await importRosterAndProvisionAction(VALID_UUID, bad, [])).success, false);
        assert.equal((await updateStudentStatusAction(bad, 'active')).success, false);
        assert.equal((await resetStudentActivationAction(bad)).success, false);
        assert.equal((await revokeStudentSessionsAction(bad)).success, false);
        assert.equal((await deleteStudentAction(bad, 'archive')).success, false);
        assert.equal((await previewBulkDeleteAction([bad])).success, false);
        assert.equal((await executeBulkStudentAction([bad], 'deactivate')).success, false);

        const trForm = new FormData();
        trForm.set('fullName', 'Trainer Name');
        trForm.set('status', 'active');
        assert.equal((await updateTrainerAction(bad, trForm)).success, false);
        assert.equal((await toggleTrainerStatusAction(bad, 'active')).success, false);
        const assignForm = new FormData();
        assignForm.set('batchId', bad);
        assignForm.set('trainerId', VALID_UUID);
        assert.equal((await assignTrainerToBatchAction(assignForm)).success, false);
        assert.equal((await setLeadTrainerAction(bad, VALID_UUID)).success, false);
        assert.equal((await setLeadTrainerAction(VALID_UUID, bad)).success, false);
        assert.equal((await removeTrainerFromBatchAction(VALID_UUID, bad)).success, false);

        assert.equal(calls.length, 0);
      });

      await withActionContext(trainerSession, async (calls) => {
        assert.equal((await saveTrainerLiveAttendanceAction({
          batchId: bad,
          date: '2026-10-01',
          title: 'Class',
          records: [{ studentId: VALID_UUID, status: 'present' }],
        })).success, false);
        assert.equal((await saveTrainerLiveAttendanceAction({
          batchId: VALID_UUID,
          date: '2026-10-01',
          title: 'Class',
          records: [{ studentId: bad, status: 'present' }],
        })).success, false);
        assert.equal((await getTrainerBatchRosterForDateAction(bad, '2026-10-01')).success, false);
        assert.equal((await createTrainerQuizAction({
          batchId: bad,
          title: 'Quiz',
          durationMinutes: 30,
          totalMarks: 10,
          passingMarks: 5,
          startTime: '2026-12-01T00:00:00Z',
          deadline: '2026-12-02T00:00:00Z',
          shuffleQuestions: false,
          antiCheatEnabled: true,
          questions: [{ id: 'q1', question: 'Q', options: ['a', 'b'], correctOptionIndex: 0, points: 10 }],
        })).success, false);
        assert.equal((await deleteTrainerQuizAction(bad)).success, false);
        assert.equal((await getTrainerAssessmentDetailsAction(bad)).success, false);
        assert.equal((await getExamProctoringLogsAction(bad)).success, false);
        assert.equal((await getExamProctoringLogsAction(VALID_UUID, bad)).success, false);

        assert.equal(calls.length, 0);
      });

      await withActionContext(studentSession, async (calls) => {
        assert.equal((await submitStudentFeedbackAction(bad, { rating: 9, comments: 'Very helpful training batch.' })).success, false);
        assert.equal((await getStudentQuizAction(bad)).success, false);
        assert.equal((await submitStudentQuizAction({ assessmentId: bad, answers: {} })).success, false);
        assert.equal((await startStudentExamAction(bad)).success, false);
        assert.equal((await saveStudentExamProgressAction({ assessmentId: bad, answers: {} })).success, false);
        assert.equal((await logStudentSecurityEventAction({
          assessmentId: bad,
          eventType: 'TAB_HIDDEN',
          sequenceNumber: 1,
        })).success, false);

        assert.equal(calls.length, 0);
      });
    }
  });

  it('all src/lib/db and src/lib/api helpers reject invalid UUIDs before building backend URLs', async () => {
    const bad = '%2e%2e';
    await withActionContext({ id: VALID_UUID, role: 'super_admin' }, async (calls) => {
      await assert.rejects(() => dbAttendance.getBatchSessions(bad));
      await assert.rejects(() => dbAttendance.getSessionAttendanceRoster(bad, VALID_UUID));
      await assert.rejects(() => dbAttendance.createTrainingSession({ batchId: bad, date: '2026-10-01', title: 'S1' }));
      await assert.rejects(() => dbAttendance.saveSessionAttendance(bad, [{ studentId: VALID_UUID, status: 'present' }]));

      await assert.rejects(() => dbBatches.getBatches({ collegeId: bad }));
      await assert.rejects(() => dbBatches.getBatchById(bad));
      await assert.rejects(() => dbBatches.getBatchStats(bad));
      await assert.rejects(() => dbBatches.updateBatchStatus(bad, 'active'));

      await assert.rejects(() => dbCollegePortal.getCollegePortalData(bad));

      await assert.rejects(() => dbColleges.getCollegeById(bad));
      await assert.rejects(() => dbColleges.getCollegeStats(bad));
      await assert.rejects(() => dbColleges.updateCollege(bad, { name: 'Col', status: 'active' } as Parameters<typeof dbColleges.updateCollege>[1]));
      await assert.rejects(() => dbColleges.updateCollegeStatus(bad, 'active'));

      await assert.rejects(() => dbPrograms.getProgramById(bad));
      await assert.rejects(() => dbPrograms.getProgramsByCollegeId(bad));
      await assert.rejects(() => dbPrograms.deleteProgram(bad));

      await assert.rejects(() => dbResources.getResourcesByBatchId(bad));
      await assert.rejects(() => dbResources.getAllResources({ batchId: bad }));

      await assert.rejects(() => dbStudentPortal.getStudentBatchDetails(VALID_UUID, bad));
      await assert.rejects(() => dbStudentPortal.getStudentQuizData(bad, VALID_UUID));
      await assert.rejects(() => dbStudentPortal.submitStudentQuizAnswers({ assessmentId: bad, studentId: VALID_UUID, answers: {} }));

      await assert.rejects(() => dbStudents.getStudentsByBatchId(bad));
      await assert.rejects(() => dbStudents.removeStudentFromBatch(bad, VALID_UUID));
      await assert.rejects(() => dbStudents.removeStudentFromBatch(VALID_UUID, bad));
      await assert.rejects(() => dbStudents.getStudentsByCollegeId(bad));
      await assert.rejects(() => dbStudents.getAllStudents({ collegeId: bad }));
      await assert.rejects(() => dbStudents.assignCredentialsToBatchStudents(bad));
      await assert.rejects(() => dbStudents.deleteCredentialsFromBatchStudents(bad));
      await assert.rejects(() => dbStudents.assignCredentialsToSingleStudent(bad));
      await assert.rejects(() => dbStudents.deleteCredentialsFromSingleStudent(bad));

      await assert.rejects(() => dbTrainerAssessments.getTrainerAssessments(VALID_UUID, { batchId: bad }));
      await assert.rejects(() => dbTrainerAssessments.getTrainerAssessmentDetails(bad, VALID_UUID));
      await assert.rejects(() => dbTrainerAssessments.deleteTrainerAssessment(bad, VALID_UUID));

      await assert.rejects(() => dbTrainerPortal.getTrainerProfile(bad));
      await assert.rejects(() => dbTrainerPortal.getTrainerBatchLiveRoster(VALID_UUID, bad, '2026-10-01'));
      await assert.rejects(() => dbTrainerPortal.getTrainerBatchCalendarSessions(bad));

      await assert.rejects(() => dbTrainers.getTrainerById(bad));
      await assert.rejects(() => dbTrainers.updateTrainer(bad, { fullName: 'X', email: null, phone: null, skills: null, status: 'active' }));
      await assert.rejects(() => dbTrainers.setTrainerStatus(bad, 'active'));
      await assert.rejects(() => dbTrainers.getTrainersByBatchId(bad));
      await assert.rejects(() => dbTrainers.getAvailableTrainersForBatch(bad));
      await assert.rejects(() => dbTrainers.setLeadTrainer(bad, VALID_UUID));
      await assert.rejects(() => dbTrainers.removeTrainerFromBatch(VALID_UUID, bad));
      await assert.rejects(() => dbTrainers.getTrainersByCollegeId(bad));

      await assert.rejects(() => apiFeedback.getBatchFeedbackStatus(bad));
      await assert.rejects(() => apiFeedback.unlockBatchFeedback(bad));
      await assert.rejects(() => apiFeedback.getBatchFeedbackReport(bad));
      await assert.rejects(() => apiFeedback.submitStudentFeedback(bad, { rating: 8, comments: 'Good cohort.' }));

      await assert.rejects(() => apiProctoring.startExamAttempt(bad));
      await assert.rejects(() => apiProctoring.saveExamProgress(bad, {}, 0, 1));
      await assert.rejects(() => apiProctoring.logExamSecurityEvent(bad, { event_type: 'TAB_HIDDEN', sequence_number: 1 }));
      await assert.rejects(() => apiProctoring.getExamProctoringLogs(bad));
      await assert.rejects(() => apiProctoring.getExamProctoringLogs(VALID_UUID, bad));

      assert.equal(calls.length, 0);
    });
  });
});
