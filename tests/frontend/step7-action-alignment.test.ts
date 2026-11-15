import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withActionContext, MockSessionInput } from './test-harness';
import { recordAttendanceAction } from '@/app/actions/attendance';
import {
  getStudentQuizAction,
  submitStudentQuizAction,
  startStudentExamAction,
  saveStudentExamProgressAction,
  logStudentSecurityEventAction,
} from '@/app/actions/studentQuiz';
import { assignTrainerToBatchAction } from '@/app/actions/trainers';
import { assignTrainerToBatch } from '@/lib/db/trainers';
import { createResourceAction } from '@/app/actions/resources';
import { createResource } from '@/lib/db/resources';
import {
  assignBatchStudentCredentialsAction,
  deleteBatchStudentCredentialsAction,
  assignSingleStudentCredentialAction,
  deleteSingleStudentCredentialAction,
  previewRosterAction,
  uploadStudentsBulkAction,
} from '@/app/actions/students';

const VALID_BATCH_ID = '11111111-1111-4111-8111-111111111111';
const VALID_COLLEGE_ID = '22222222-2222-4222-8222-222222222222';
const FOREIGN_COLLEGE_ID = '33333333-3333-4333-8333-333333333333';
const VALID_STUDENT_ID = '44444444-4444-4444-8444-444444444444';
const VALID_TRAINER_ID = '55555555-5555-4555-8555-555555555555';
const VALID_ASSESSMENT_ID = '66666666-6666-4666-8666-666666666666';

describe('Step 7 (P1-13 & P1-14): Action Role & Payload Alignment', () => {
  it('recordAttendanceAction requires super_admin, college_admin, or trainer; denies student', async () => {
    const studentSession: MockSessionInput = {
      id: VALID_STUDENT_ID,
      role: 'student',
      collegeId: VALID_COLLEGE_ID,
    };

    const formData = new FormData();
    formData.append('batchId', VALID_BATCH_ID);
    formData.append('date', '2026-11-15');
    formData.append('title', 'React Architecture');
    formData.append('attendanceData', JSON.stringify([{ studentId: VALID_STUDENT_ID, status: 'present' }]));

    await withActionContext(studentSession, async (calls) => {
      const res = await recordAttendanceAction(null, formData);
      assert.equal(res.success, false);
      assert.match(res.error || '', /Unauthorized/i);
      assert.equal(calls.length, 0);
    });

    const trainerSession: MockSessionInput = {
      id: VALID_TRAINER_ID,
      role: 'trainer',
    };
    await withActionContext(trainerSession, async () => {
      const res = await recordAttendanceAction(null, formData);
      assert.equal(res.success, true);
    });
  });

  it('studentQuiz.ts actions are student only (reject super_admin, college_admin, trainer)', async () => {
    const superAdminSession: MockSessionInput = {
      id: VALID_TRAINER_ID,
      role: 'super_admin',
    };

    await withActionContext(superAdminSession, async (calls) => {
      const resGet = await getStudentQuizAction(VALID_ASSESSMENT_ID);
      assert.equal(resGet.success, false);
      assert.match(resGet.error || '', /Student login required/i);

      const resSubmit = await submitStudentQuizAction({ assessmentId: VALID_ASSESSMENT_ID, answers: {} });
      assert.equal(resSubmit.success, false);
      assert.match(resSubmit.error || '', /Student login required/i);

      const resStart = await startStudentExamAction(VALID_ASSESSMENT_ID);
      assert.equal(resStart.success, false);
      assert.match(resStart.error || '', /Student login required/i);

      const resSave = await saveStudentExamProgressAction({ assessmentId: VALID_ASSESSMENT_ID, answers: {} });
      assert.equal(resSave.success, false);
      assert.match(resSave.error || '', /Student login required/i);

      const resSec = await logStudentSecurityEventAction({
        assessmentId: VALID_ASSESSMENT_ID,
        eventType: 'TAB_HIDDEN',
        sequenceNumber: 1,
      });
      assert.equal(resSec.success, false);
      assert.match(resSec.error || '', /Student login required/i);

      assert.equal(calls.length, 0);
    });
  });

  it('assignTrainerToBatch and action send batch_id exactly as backend expects in query param and payload', async () => {
    const adminSession: MockSessionInput = {
      id: VALID_TRAINER_ID,
      role: 'super_admin',
    };

    await withActionContext(adminSession, async (calls) => {
      const form = new FormData();
      form.append('batchId', VALID_BATCH_ID);
      form.append('trainerId', VALID_TRAINER_ID);
      form.append('isLead', 'false');
      form.append('role', 'Assistant Trainer');
      const actionRes = await assignTrainerToBatchAction(form);
      assert.equal(actionRes.success, true);

      assert.equal(calls.length, 1);
      const call = calls[0];
      assert.equal(call.method, 'POST');
      const url = new URL(call.url, 'http://localhost');
      assert.equal(url.pathname, '/api/v1/trainers/assign-batch');
      assert.equal(url.searchParams.get('batch_id'), VALID_BATCH_ID);
      const body = call.body as Record<string, unknown>;
      assert.equal(body.trainer_id, VALID_TRAINER_ID);
      assert.equal(body.is_lead, false);
      assert.equal(body.role, 'Assistant Trainer');
      assert.equal('batch_id' in body, false);
    });

    await withActionContext(adminSession, async (calls) => {
      await assignTrainerToBatch({
        batchId: VALID_BATCH_ID,
        trainerId: VALID_TRAINER_ID,
        isLead: false,
        role: 'Assistant Trainer',
      });

      assert.equal(calls.length, 1);
      const call = calls[0];
      const url = new URL(call.url, 'http://localhost');
      assert.equal(url.searchParams.get('batch_id'), VALID_BATCH_ID);
      const body = call.body as Record<string, unknown>;
      assert.equal(body.trainer_id, VALID_TRAINER_ID);
      assert.equal('batch_id' in body, false);
    });
  });

  it('createResourceAction and createResource send title (not name)', async () => {
    const adminSession: MockSessionInput = {
      id: VALID_TRAINER_ID,
      role: 'super_admin',
    };

    await withActionContext(adminSession, async (calls) => {
      const form = new FormData();
      form.append('batchId', VALID_BATCH_ID);
      form.append('name', 'TypeScript Handbook');
      form.append('type', 'google_drive');
      form.append('url', 'https://drive.google.com/test-handbook');
      form.append('description', 'Reference guide');
      const actionRes = await createResourceAction(form);
      assert.equal(actionRes.success, true);

      assert.equal(calls.length, 1);
      const call = calls[0];
      assert.equal(call.method, 'POST');
      const body = call.body as Record<string, unknown>;
      assert.equal(body.title, 'TypeScript Handbook');
      assert.equal('name' in body, false);
    });

    await withActionContext(adminSession, async (calls) => {
      await createResource({
        batchId: VALID_BATCH_ID,
        name: 'TypeScript Handbook',
        type: 'google_drive',
        url: 'https://drive.google.com/test-handbook',
        description: 'Reference guide',
      });

      assert.equal(calls.length, 1);
      const call = calls[0];
      assert.equal(call.method, 'POST');
      const body = call.body as Record<string, unknown>;
      assert.equal(body.title, 'TypeScript Handbook');
      assert.equal('name' in body, false);
    });
  });

  it('credential and student actions derive college on the server and reject cross-college batch access', async () => {
    const collegeAdminSession: MockSessionInput = {
      id: '77777777-7777-4777-8777-777777777777',
      role: 'college_admin',
      collegeId: VALID_COLLEGE_ID,
    };

    // Responder mocks getBatchById returning a batch that belongs to FOREIGN_COLLEGE_ID
    const foreignBatchResponder = (url: string) => {
      if (url.includes(`/api/v1/batches/${VALID_BATCH_ID}`)) {
        return {
          status: 200,
          json: {
            id: VALID_BATCH_ID,
            college_id: FOREIGN_COLLEGE_ID,
            name: 'Foreign Batch',
          },
        };
      }
      return null;
    };

    await withActionContext(
      collegeAdminSession,
      async (calls) => {
        const resAssign = await assignBatchStudentCredentialsAction(VALID_BATCH_ID);
        assert.equal(resAssign.success, false);
        assert.match(resAssign.error || '', /restricted to your own institution/i);

        const resDelete = await deleteBatchStudentCredentialsAction(VALID_BATCH_ID);
        assert.equal(resDelete.success, false);
        assert.match(resDelete.error || '', /restricted to your own institution/i);

        const resSingleAssign = await assignSingleStudentCredentialAction(VALID_STUDENT_ID, VALID_BATCH_ID);
        assert.equal(resSingleAssign.success, false);
        assert.match(resSingleAssign.error || '', /restricted to your own institution/i);

        const resSingleDelete = await deleteSingleStudentCredentialAction(VALID_STUDENT_ID, VALID_BATCH_ID);
        assert.equal(resSingleDelete.success, false);
        assert.match(resSingleDelete.error || '', /restricted to your own institution/i);

        // Caller attempts to supply their own VALID_COLLEGE_ID, but batch belongs to FOREIGN_COLLEGE_ID
        const resPreview = await previewRosterAction(VALID_BATCH_ID, VALID_COLLEGE_ID, []);
        assert.equal(resPreview.success, false);
        assert.match(resPreview.error || '', /restricted to your own institution/i);

        const resUpload = await uploadStudentsBulkAction(VALID_BATCH_ID, VALID_COLLEGE_ID, [
          {
            rollNumber: 'CS101',
            fullName: 'Jane Doe',
          },
        ]);
        assert.equal(resUpload.success, false);
        assert.match(resUpload.error || '', /restricted to your own institution/i);

        // Check that none of the mutating actions reached their target endpoint
        const mutatingCalls = calls.filter((c) => c.method !== 'GET');
        assert.equal(mutatingCalls.length, 0);
      },
      foreignBatchResponder
    );
  });
});

