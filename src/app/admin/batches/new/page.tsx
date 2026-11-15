import React from 'react';
import Link from 'next/link';
import { getColleges } from '@/lib/db/colleges';
import { getPrograms } from '@/lib/db/programs';
import { getTrainers } from '@/lib/db/trainers';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import GuidedBatchCreationWizard from '@/components/admin/GuidedBatchCreationWizard';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface NewBatchPageProps {
  searchParams: Promise<{
    collegeId?: string;
  }>;
}

export default async function NewBatchPage({ searchParams }: NewBatchPageProps) {
  const { collegeId } = await searchParams;

  const [colleges, programs, trainers] = await Promise.all([
    getColleges(),
    getPrograms(),
    getTrainers(),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Batches', href: '/admin/batches' },
          { label: 'New Training Batch' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Create Training Batch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Guided 4-step workflow to configure training details, assign instructors, and enroll students.
          </p>
        </div>

        <Link
          href="/admin/batches"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Batches</span>
        </Link>
      </div>

      {/* Interactive Wizard */}
      <GuidedBatchCreationWizard
        colleges={colleges}
        programs={programs}
        trainers={trainers}
        initialCollegeId={collegeId}
      />
    </div>
  );
}
