import React from 'react';
import type { Metadata } from 'next';
import { getTrainers } from '@/lib/db/trainers';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import PageHeader from '@/components/admin/PageHeader';
import TrainersTable from '@/components/admin/TrainersTable';

export const metadata: Metadata = {
  title: 'Faculty & Trainers Directory | Skill Matra Admin',
  description: 'Manage certified instructors, domain specialists, and academic mentors.',
};

export const dynamic = 'force-dynamic';

export default async function TrainersDirectoryPage() {
  const trainers = await getTrainers();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Trainers Directory' },
        ]}
      />

      <PageHeader
        title="Faculty & Technical Trainers"
        description="Master registry of technical instructors and mentors deployable across institutional training cohorts."
      />

      <TrainersTable initialTrainers={trainers} />
    </div>
  );
}
