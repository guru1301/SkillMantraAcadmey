import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBatchById } from '@/lib/db/batches';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
import BatchTabs from '@/components/admin/BatchTabs';
import ModulePlaceholder from '@/components/admin/ModulePlaceholder';
import { ArrowLeft } from 'lucide-react';

export default async function BatchAssessmentsPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const batch = await getBatchById(batchId);
  if (!batch) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges', href: '/admin/colleges' },
          { label: batch.college_name, href: `/admin/colleges/${batch.college_id}` },
          { label: 'Batches', href: `/admin/colleges/${batch.college_id}/batches` },
          { label: batch.code, href: `/admin/batches/${batch.id}` },
          { label: 'Assessments' },
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <Link
          href={`/admin/batches/${batch.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 mb-2 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Batch Overview</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold bg-[#0A3A7A] text-[#FCAF0A] px-2.5 py-1 rounded-lg">
            {batch.code}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {batch.program_name} Assessments
          </h1>
          <StatusBadge status={batch.status} />
        </div>
      </div>

      <BatchTabs batchId={batch.id} activeTab="assessments" />

      <ModulePlaceholder
        moduleName="Cohort Assessments & Tests"
        phase="Phase 3 • Assessment Engine"
        description="MCQ quizzes, coding challenges, proctored examinations, and scorecards linked to the Question Bank will be introduced in Phase 3."
        backHref={`/admin/batches/${batch.id}`}
        backLabel="Return to Batch Overview"
      />
    </div>
  );
}
