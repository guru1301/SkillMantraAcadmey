import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getTrainerAssignedBatches } from '@/lib/db/trainerPortal';
import { getTrainerAssessments } from '@/lib/db/trainerAssessments';
import TrainerTestsClient from '@/components/trainer/TrainerTestsClient';

export const metadata: Metadata = {
  title: 'Tests & Quizzes | Trainer Portal',
  description: 'Upload question papers in CSV/Excel, randomize for students, and schedule batch exams with anti-cheat lockdown.',
};

export default async function TrainerTestsPage() {
  const session = await getSession();
  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    redirect('/login');
  }

  const [batches, assessments] = await Promise.all([
    getTrainerAssignedBatches(session.id),
    getTrainerAssessments(session.id),
  ]);

  return (
    <TrainerTestsClient
      batches={batches}
      assessments={assessments}
    />
  );
}
