import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBatchById } from '@/lib/db/batches';
import { getStudentsByBatchId } from '@/lib/db/students';
import { getBatchSessions } from '@/lib/db/attendance';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
import BatchTabs from '@/components/admin/BatchTabs';
import { ArrowLeft, CheckCircle2, Users, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BatchReportsPage({
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

  const totalMarked = sessions.reduce((acc, s) => acc + (s.marked_count || 0), 0);
  const totalPresent = sessions.reduce((acc, s) => acc + (s.present_count || 0), 0);
  const batchAttendanceRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;
  const seatUtilization = batch.target_strength > 0 ? Math.round((students.length / batch.target_strength) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Batches', href: '/admin/batches' },
          { label: batch.code, href: `/admin/batches/${batch.id}` },
          { label: 'Reports' },
        ]}
      />

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
                {batch.program_name} Batch Report
              </h1>
              <p className="text-xs text-slate-500">
                {batch.college_name} • {batch.start_date} to {batch.end_date}
              </p>
            </div>
          </div>
          <StatusBadge status={batch.status} />
        </div>
      </div>

      <BatchTabs batchId={batch.id} activeTab="overview" />

      {/* Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Enrolled Students</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{students.length}</span>
          <span className="text-[11px] text-slate-400">{seatUtilization}% of {batch.target_strength} target seats</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Sessions Conducted</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{sessions.length}</span>
          <span className="text-[11px] text-slate-400">Recorded lecture check-ins</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Cohort Attendance Rate</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{batchAttendanceRate}%</span>
          <span className="text-[11px] text-slate-400">{totalPresent} present check-ins</span>
        </div>
      </div>

      {/* Sessions Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Conducted Training Sessions</h2>
          <span className="text-xs text-slate-500">{sessions.length} session(s)</span>
        </div>

        {sessions.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400">No sessions recorded yet for this batch.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Session Title</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {s.title}
                      {s.topic && <span className="block text-[11px] text-slate-500 font-normal">{s.topic}</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{s.trainer_name || 'Assigned Trainer'}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">
                      {s.present_count || 0} / {s.marked_count || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
