import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET as downloadCertificateRoute } from '@/app/api/certificates/[batchId]/download/route';
import { POST as issueCertificateRoute } from '@/app/api/certificates/[batchId]/issue/route';
import { withActionContext, VALID_UUID } from './test-harness';

describe('Step 7 (P2-10): Certificate Issuance (POST) & Download (GET)', () => {
  it('issue route rejects unauthenticated or non-student sessions', async () => {
    await withActionContext({ id: VALID_UUID, role: 'college_admin', collegeId: VALID_UUID }, async () => {
      const req = new NextRequest(`http://localhost:3000/api/certificates/${VALID_UUID}/issue`, { method: 'POST' });
      const res = await issueCertificateRoute(req, { params: Promise.resolve({ batchId: VALID_UUID }) });
      assert.equal(res.status, 401);
    });
  });

  it('issue route enforces must_change_password with 403', async () => {
    await withActionContext({ id: VALID_UUID, role: 'student', mustChangePassword: true }, async () => {
      const req = new NextRequest(`http://localhost:3000/api/certificates/${VALID_UUID}/issue`, { method: 'POST' });
      const res = await issueCertificateRoute(req, { params: Promise.resolve({ batchId: VALID_UUID }) });
      assert.equal(res.status, 403);
    });
  });

  it('download route calls backend POST issue before GET download', async () => {
    await withActionContext({ id: VALID_UUID, role: 'student', mustChangePassword: false }, async (calls) => {
      const req = new NextRequest(`http://localhost:3000/api/certificates/${VALID_UUID}/download`);
      const res = await downloadCertificateRoute(req, { params: Promise.resolve({ batchId: VALID_UUID }) });
      assert.equal(res.status, 200);

      assert.ok(calls.length >= 1, 'Download route must make backend calls');
      assert.equal(calls[0].method, 'POST', 'First call must be POST /issue');
      assert.ok(calls[0].url.includes('/issue'), 'Target must be /issue');
      if (calls.length >= 2) {
        assert.equal(calls[1].method, 'GET', 'Second call must be GET /download');
        assert.ok(calls[1].url.includes('/download'), 'Target must be /download');
      }
    });
  });
});
