import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getStudentAssessments } from '@/lib/db/studentPortal';
import TestsClient from '@/components/student/TestsClient';

export const metadata: Metadata = {
  title: 'Tests | SkillThinker',
  description: 'Scheduled assessments, quizzes, and test scores.',
};

export default async function StudentTestsPage() {
  const session = await getSession();

  if (!session || session.role !== 'student') {
    redirect('/login');
  }

  const assessments = await getStudentAssessments(session.id);

  return (
    <div className="space-y-6 w-full">
      {/* Clean sentence-case header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#062F68] tracking-tight">
          Tests
        </h1>
        <p className="text-sm text-[#667085] mt-1">
          Scheduled assessments and your test scores.
        </p>
      </div>

      {/* Tests Client */}
      <TestsClient assessments={assessments} />
    </div>
  );
}
