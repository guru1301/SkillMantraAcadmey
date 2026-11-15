import React from 'react';
import { notFound } from 'next/navigation';
import { getCollegeById, getColleges } from '@/lib/db/colleges';
import { getPrograms } from '@/lib/db/programs';
import { getTrainers } from '@/lib/db/trainers';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import GuidedBatchCreationWizard from '@/components/admin/GuidedBatchCreationWizard';

export const dynamic = 'force-dynamic';

interface CollegeNewBatchPageProps {
  params: Promise<{ collegeId: string }>;
}

export default async function CollegeNewBatchPage({ params }: CollegeNewBatchPageProps) {
  const { collegeId } = await params;

  const [college, allColleges, programs, trainers] = await Promise.all([
    getCollegeById(collegeId),
    getColleges(),
    getPrograms({ status: 'active' }),
    getTrainers({ status: 'active' }),
  ]);

  if (!college) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges', href: '/admin/colleges' },
          { label: college.name, href: `/admin/colleges/${college.id}` },
          { label: 'Batches', href: `/admin/colleges/${college.id}/batches` },
          { label: 'Create Batch' },
        ]}
      />

      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Create Training Batch for {college.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Guided 4-step workflow to configure curriculum, assign instructors, and enroll students.
        </p>
      </div>

      <GuidedBatchCreationWizard
        colleges={allColleges}
        programs={programs}
        trainers={trainers}
        initialCollegeId={college.id}
      />
    </div>
  );
}
