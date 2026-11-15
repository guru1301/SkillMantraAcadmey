import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { withActionContext } from './test-harness';
import { updateBatchStatusAction } from '@/app/actions/batches';
import {
  assignTrainerToBatchAction,
  setLeadTrainerAction,
  removeTrainerFromBatchAction,
} from '@/app/actions/trainers';
import {
  createTrainerQuizAction,
  deleteTrainerQuizAction,
} from '@/app/actions/trainerQuizzes';
import { createResourceAction } from '@/app/actions/resources';

const BATCH_ID = '11111111-1111-4111-8111-111111111111';
const TRAINER_ID = '22222222-2222-4222-8222-222222222222';
const COLLEGE_ID = '33333333-3333-4333-8333-333333333333';
const ASSESSMENT_ID = '44444444-4444-4444-8444-444444444444';

describe('Step 5 Next.js Server Action Role Policy Alignment', () => {
  it('updateBatchStatusAction allows super_admin all statuses and college_admin active only', async () => {
    const resCollegeActive = await withActionContext(
      { id: 'u1', role: 'college_admin', collegeId: COLLEGE_ID },
      async () => updateBatchStatusAction(BATCH_ID, 'active')
    );
    assert.equal(resCollegeActive.success, true);

    for (const restricted of ['completed', 'cancelled', 'planned'] as const) {
      const resCollegeDenied = await withActionContext(
        { id: 'u1', role: 'college_admin', collegeId: COLLEGE_ID },
        async () => updateBatchStatusAction(BATCH_ID, restricted)
      );
      assert.equal(resCollegeDenied.success, false);
    }

    const resTrainerDenied = await withActionContext(
      { id: TRAINER_ID, role: 'trainer' },
      async () => updateBatchStatusAction(BATCH_ID, 'active')
    );
    assert.equal(resTrainerDenied.success, false);

    const resSuperCompleted = await withActionContext(
      { id: 'u0', role: 'super_admin' },
      async () => updateBatchStatusAction(BATCH_ID, 'completed')
    );
    assert.equal(resSuperCompleted.success, true);
  });

  it('setLeadTrainerAction and removeTrainerFromBatchAction stay super_admin only', async () => {
    for (const nonSuper of [
      { id: 'u1', role: 'college_admin', collegeId: COLLEGE_ID },
      { id: TRAINER_ID, role: 'trainer' },
      { id: 's1', role: 'student', collegeId: COLLEGE_ID },
    ]) {
      const leadRes = await withActionContext(nonSuper, async () =>
        setLeadTrainerAction(BATCH_ID, TRAINER_ID)
      );
      assert.equal(leadRes.success, false);

      const remRes = await withActionContext(nonSuper, async () =>
        removeTrainerFromBatchAction(BATCH_ID, TRAINER_ID)
      );
      assert.equal(remRes.success, false);
    }

    const okLead = await withActionContext({ id: 'u0', role: 'super_admin' }, async () =>
      setLeadTrainerAction(BATCH_ID, TRAINER_ID)
    );
    assert.equal(okLead.success, true);

    const okRem = await withActionContext({ id: 'u0', role: 'super_admin' }, async () =>
      removeTrainerFromBatchAction(BATCH_ID, TRAINER_ID)
    );
    assert.equal(okRem.success, true);
  });

  it('assignTrainerToBatchAction allows super_admin and college_admin and denies trainer/student', async () => {
    const buildForm = () => {
      const fd = new FormData();
      fd.set('batchId', BATCH_ID);
      fd.set('trainerId', TRAINER_ID);
      fd.set('isLead', 'false');
      fd.set('role', 'Trainer');
      return fd;
    };

    const resCollege = await withActionContext(
      { id: 'u1', role: 'college_admin', collegeId: COLLEGE_ID },
      async () => assignTrainerToBatchAction(buildForm())
    );
    assert.equal(resCollege.success, true);

    const resTrainer = await withActionContext({ id: TRAINER_ID, role: 'trainer' }, async () =>
      assignTrainerToBatchAction(buildForm())
    );
    assert.equal(resTrainer.success, false);

    const resSuper = await withActionContext({ id: 'u0', role: 'super_admin' }, async () =>
      assignTrainerToBatchAction(buildForm())
    );
    assert.equal(resSuper.success, true);
  });

  it('assessment actions allow trainer and super_admin only (deny college_admin and student)', async () => {
    const quizPayload = {
      batchId: BATCH_ID,
      title: 'Quiz 1',
      durationMinutes: 30,
      totalMarks: 10,
      passingMarks: 5,
      startTime: '2026-12-01T10:00:00Z',
      deadline: '2026-12-02T10:00:00Z',
      shuffleQuestions: false,
      antiCheatEnabled: true,
      questions: [{ id: 'q1', question: 'Q?', options: ['A', 'B'], correctOptionIndex: 0, points: 10 }],
    };

    for (const denied of [
      { id: 'u1', role: 'college_admin', collegeId: COLLEGE_ID },
      { id: 's1', role: 'student', collegeId: COLLEGE_ID },
    ]) {
      const cRes = await withActionContext(denied, async () => createTrainerQuizAction(quizPayload));
      assert.equal(cRes.success, false);
      const dRes = await withActionContext(denied, async () => deleteTrainerQuizAction(ASSESSMENT_ID));
      assert.equal(dRes.success, false);
    }

    const okTrainer = await withActionContext({ id: TRAINER_ID, role: 'trainer' }, async () =>
      createTrainerQuizAction(quizPayload)
    );
    assert.equal(okTrainer.success, true);
  });

  it('createResourceAction allows super_admin, college_admin, and trainer (denies student)', async () => {
    const buildForm = () => {
      const fd = new FormData();
      fd.set('batchId', BATCH_ID);
      fd.set('name', 'Module 1 Slides');
      fd.set('type', 'link');
      fd.set('url', 'https://example.com/slides');
      fd.set('description', '');
      return fd;
    };

    for (const allowed of [
      { id: 'u0', role: 'super_admin' },
      { id: 'u1', role: 'college_admin', collegeId: COLLEGE_ID },
      { id: TRAINER_ID, role: 'trainer' },
    ]) {
      const res = await withActionContext(allowed, async () => createResourceAction(buildForm()));
      assert.equal(res.success, true);
    }

    const denied = await withActionContext(
      { id: 's1', role: 'student', collegeId: COLLEGE_ID },
      async () => createResourceAction(buildForm())
    );
    assert.equal(denied.success, false);
  });
});
