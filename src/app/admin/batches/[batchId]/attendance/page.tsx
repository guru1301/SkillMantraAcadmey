import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBatchById } from '@/lib/db/batches';
import { getStudentsByBatchId } from '@/lib/db/students';
import { getBatchSessions } from '@/lib/db/attendance';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
import BatchTabs from '@/components/admin/BatchTabs';
import BatchAttendanceManager from '@/components/admin/BatchAttendanceManager';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BatchAttendancePage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const [batch, students, sessions] = await Promise.all([
    getBatchById(batchId),
    getStudentsByBatchId(batchId),
    getBatchSessions(batchId),
  ]);

  if (!batch) notFound();

  const formattedStudents = students.map((s) => ({
    student_id: s.id,
    roll_number: s.roll_number,
    full_name: s.full_name,
    department: s.department,
    status: 'unmarked' as const,
    notes: null,
  }));

  const formattedSessions = sessions.map((s) => ({
    id: s.id,
    date: s.date,
    title: s.title,
    topic: s.topic,
    status: s.status,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Batches', href: '/admin/batches' },
          { label: batch.code, href: `/admin/batches/${batch.id}` },
          { label: 'Attendance' },
        ]}
      />

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <Link
          href={`/admin/batches/${batch.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A3A7A] hover:underline mb-2 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Batch Workspace</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold bg-[#0A3A7A] text-[#FCAF0A] px-2.5 py-1 rounded-lg">
              {batch.code}
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {batch.program_name} Attendance
              </h1>
              <p className="text-xs text-slate-500">
                {batch.college_name} • {batch.actual_students_count} Students Enrolled
              </p>
            </div>
          </div>
          <StatusBadge status={batch.status} />
        </div>
      </div>

      {/* Tabs */}
      <BatchTabs batchId={batch.id} activeTab="attendance" />

      {/* Functional Attendance Manager */}
      <BatchAttendanceManager
        batchId={batch.id}
        batchCode={batch.code}
        initialStudents={formattedStudents}
        existingSessions={formattedSessions}
      />
    </div>
  );
}
