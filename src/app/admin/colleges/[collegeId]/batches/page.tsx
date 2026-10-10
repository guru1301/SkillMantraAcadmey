import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollegeById } from '@/lib/db/colleges';
import { getBatches } from '@/lib/db/batches';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import CollegeTabs from '@/components/admin/CollegeTabs';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import {
  Layers,
  Plus,
  ArrowRight,
  Calendar,
  Users,
  MapPin,
  GraduationCap,
} from 'lucide-react';

interface CollegeBatchesPageProps {
  params: Promise<{ collegeId: string }>;
}

export default async function CollegeBatchesPage({
  params,
}: CollegeBatchesPageProps) {
  const { collegeId } = await params;

  const [college, batches] = await Promise.all([
    getCollegeById(collegeId),
    getBatches({ collegeId }),
  ]);

  if (!college) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges', href: '/admin/colleges' },
          { label: college.name, href: `/admin/colleges/${college.id}` },
          { label: 'Batches' },
        ]}
      />

      {/* College Workspace Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0A3A7A] text-[#FCAF0A] flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              {college.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {college.name}
                </h1>
                <StatusBadge status={college.status} />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {[college.city, college.state].filter(Boolean).join(', ') ||
                    'Location unassigned'}
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/admin/colleges/${college.id}/batches/new`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-semibold text-xs shadow-sm hover:shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Batch</span>
          </Link>
        </div>
      </div>

      <CollegeTabs collegeId={college.id} activeTab="batches" />

      {/* Batches Table or Empty State */}
      {batches.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-8 h-8 text-slate-400" />}
          title="No batches found for this college"
          description="Create your first training batch cohort to assign programs, schedule sessions, and track enrolled students."
          actionLabel="Create First Batch"
          actionHref={`/admin/colleges/${college.id}/batches/new`}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Batch Code & Curriculum</th>
                  <th className="py-3.5 px-4">Timeline</th>
                  <th className="py-3.5 px-4 text-center">Target Strength</th>
                  <th className="py-3.5 px-4 text-center">Actual Students</th>
                  <th className="py-3.5 px-4 text-center">Sessions</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <Link
                            href={`/admin/batches/${batch.id}`}
                            className="font-mono font-bold text-slate-900 group-hover:text-blue-700 transition block text-xs"
                          >
                            {batch.code}
                          </Link>
                          <span className="font-semibold text-slate-600 block text-xs">
                            {batch.program_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {batch.start_date} → {batch.end_date}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-800 text-xs px-2 py-0.5 rounded bg-slate-100">
                        {batch.target_strength}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-100">
                        <GraduationCap className="w-3 h-3 text-emerald-600" />
                        <span>{batch.actual_students_count}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-medium text-slate-600">
                        {batch.sessions_count}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={batch.status} />
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/admin/batches/${batch.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A3A7A] hover:bg-[#082e61] text-white font-semibold text-xs shadow-xs transition"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Total {batches.length} {batches.length === 1 ? 'batch' : 'batches'} for {college.name}
            </span>
            <span className="text-slate-400">
              Normalized real-time query counts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
