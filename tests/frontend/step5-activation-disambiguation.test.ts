import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Step 5 Check: LoginForm.tsx exposes college_code / email for activation (P2-12)', () => {
  it('LoginForm.tsx must include input fields for college_code and email disambiguation', () => {
    const loginFormPath = path.resolve(process.cwd(), 'src/app/login/LoginForm.tsx');
    const content = fs.readFileSync(loginFormPath, 'utf-8');

    // Must have college_code / email state or inputs
    const hasCollegeCodeOrEmailField =
      (content.includes('college_code') || content.includes('collegeCode') || content.includes('activateCollege')) &&
      (content.includes('email') || content.includes('activateEmail') || content.includes('activateCollegeOrEmail'));

    assert.ok(
      hasCollegeCodeOrEmailField,
      'LoginForm.tsx must expose college_code / email disambiguation fields for student activation'
    );
  });

  it('activateStudentAccountAction must accept college_code and email in payload', () => {
    const actionPath = path.resolve(process.cwd(), 'src/app/actions/students.ts');
    const content = fs.readFileSync(actionPath, 'utf-8');

    assert.ok(
      content.includes('college_code?: string') || content.includes('college_code?:'),
      'activateStudentAccountAction must support optional college_code in payload'
    );
    assert.ok(
      content.includes('email?: string') || content.includes('email?:'),
      'activateStudentAccountAction must support optional email in payload'
    );
  });
});

