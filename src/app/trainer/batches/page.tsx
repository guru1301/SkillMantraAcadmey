import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getTrainerBatchesWithRosters } from '@/lib/db/trainerPortal';
import TrainerBatchesClient from '@/components/trainer/TrainerBatchesClient';

export const metadata: Metadata = {
  title: 'Assigned Batches | SkillThinker Trainer Portal',
  description: 'View assigned training cohorts, academic timelines, and enrolled student rosters.',
};

export default async function TrainerBatchesPage() {
  const session = await getSession();

  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    redirect('/login');
  }

  const batchesWithRosters = await getTrainerBatchesWithRosters(session.id);

  return <TrainerBatchesClient batches={batchesWithRosters} />;
}
