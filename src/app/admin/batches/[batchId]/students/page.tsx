import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBatchById } from '@/lib/db/batches';
import { getStudentsByBatchId } from '@/lib/db/students';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
import BatchTabs from '@/components/admin/BatchTabs';
import StudentRosterManager from '@/components/admin/StudentRosterManager';
import { ArrowLeft, Building2, Calendar } from 'lucide-react';

export default async function BatchStudentsPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  const [batch, students] = await Promise.all([
    getBatchById(batchId),
    getStudentsByBatchId(batchId),
  ]);

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
          { label: 'Students Roster' },
        ]}
      />

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <Link
          href={`/admin/batches/${batch.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 mb-2 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Batch Overview</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold bg-[#0A3A7A] text-[#FCAF0A] px-2.5 py-1 rounded-lg">
              {batch.code}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {batch.program_name} Students Roster
            </h1>
            <StatusBadge status={batch.status} />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">{batch.college_name}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {batch.start_date} → {batch.end_date}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <BatchTabs batchId={batch.id} activeTab="students" />

      {/* Interactive Roster Manager with CSV Upload & Search */}
      <StudentRosterManager
        batchId={batch.id}
        collegeId={batch.college_id}
        collegeName={batch.college_name}
        batchCode={batch.code}
        targetStrength={batch.target_strength}
        initialStudents={students}
      />
    </div>
  );
}
