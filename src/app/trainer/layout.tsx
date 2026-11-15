import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getTrainerProfile, getTrainerAssignedBatches } from '@/lib/db/trainerPortal';
import TrainerShell from '@/components/trainer/TrainerShell';

export const metadata: Metadata = {
  title: 'Trainer Portal | SkillThinker',
  description: 'Instructor space for conducting live classroom attendance, managing assigned batches, and tracking cohort progress.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'trainer' && session.role !== 'super_admin') {
    if (session.role === 'college_admin') {
      redirect('/portal');
    }
    if (session.role === 'student') {
      redirect('/student');
    }
    redirect('/login');
  }

  // Fetch trainer profile and batches count concurrently
  const [profile, batches] = await Promise.all([
    getTrainerProfile(session.id),
    getTrainerAssignedBatches(session.id),
  ]);

  const trainerName = profile?.full_name || session.fullName || 'Trainer';
  const email = profile?.email || session.email;

  return (
    <TrainerShell
      trainerName={trainerName}
      email={email}
      assignedBatchesCount={batches.length}
      phone={profile?.phone || null}
    >
      {children}
    </TrainerShell>
  );
}
