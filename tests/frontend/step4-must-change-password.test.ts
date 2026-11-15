import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Step 4 (P2-05 + P1-05): must_change_password End to End Frontend', () => {
  it('src/app/change-password/page.tsx must exist with password inputs', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/change-password/page.tsx');
    assert.ok(fs.existsSync(pagePath), 'change-password/page.tsx must exist');
    const content = fs.readFileSync(pagePath, 'utf-8');
    assert.ok(content.includes('currentPassword'), 'Must include currentPassword field');
    assert.ok(content.includes('newPassword'), 'Must include newPassword field');
    assert.ok(content.includes('confirmPassword'), 'Must include confirmPassword field');
    assert.ok(content.includes('changePasswordAction'), 'Must wire changePasswordAction');
  });

  it('src/app/actions/auth.ts must export changePasswordAction', () => {
    const actionPath = path.resolve(process.cwd(), 'src/app/actions/auth.ts');
    const content = fs.readFileSync(actionPath, 'utf-8');
    assert.ok(content.includes('export async function changePasswordAction'), 'Must export changePasswordAction');
    assert.ok(content.includes('/auth/change-password'), 'Must call /auth/change-password');
  });

  it('src/middleware.ts must enforce must_change_password redirection', () => {
    const middlewarePath = path.resolve(process.cwd(), 'src/middleware.ts');
    const content = fs.readFileSync(middlewarePath, 'utf-8');
    assert.ok(content.includes('mustChangePassword'), 'Must extract mustChangePassword');
    assert.ok(content.includes("redirect(new URL('/change-password'"), 'Must redirect flagged users to /change-password');
    assert.ok(content.includes('/api/certificates'), 'Must check /api/certificates route');
    assert.ok(content.includes("'/change-password'"), 'Matcher must include /change-password');
  });

  it('src/app/api/certificates/[batchId]/download/route.ts must check mustChangePassword', () => {
    const routePath = path.resolve(process.cwd(), 'src/app/api/certificates/[batchId]/download/route.ts');
    const content = fs.readFileSync(routePath, 'utf-8');
    assert.ok(content.includes('session.mustChangePassword'), 'Must check session.mustChangePassword');
    assert.ok(content.includes('403'), 'Must return 403 status when flagged');
  });
});

