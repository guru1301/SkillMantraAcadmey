import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getTrainerAssignedBatches } from '@/lib/db/trainerPortal';
import EmptyState from '@/components/trainer/EmptyState';

export const metadata: Metadata = {
  title: 'Session Attendance | Trainer Portal',
  description: 'Manage, record, and verify classroom attendance for assigned cohorts.',
};

export default async function TrainerAttendanceRedirectPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const batches = await getTrainerAssignedBatches(session.id);

  if (batches.length > 0) {
    // If a batch is pending attendance today, jump straight to it; else default to the first cohort
    const targetBatch = batches.find((b) => !b.today_marked) || batches[0];
    redirect(`/trainer/attendance/${targetBatch.id}`);
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <EmptyState
        icon={BookOpen}
        title="No Batches Assigned Yet"
        description="Your trainer account does not currently have any assigned cohorts. Please contact your SkillThinker administrator to assign training classes."
        actionText="Back to Cohorts"
        actionHref="/trainer"
      />
    </div>
  );
}
