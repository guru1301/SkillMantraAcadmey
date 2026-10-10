import React from 'react';
import Link from 'next/link';
import { getBatches } from '@/lib/db/batches';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
import EmptyState from '@/components/admin/EmptyState';
import {
  Layers,
  Building2,
  Calendar,
  Users,
  GraduationCap,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface BatchesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

export default async function BatchesPage({ searchParams }: BatchesPageProps) {
  const { search, status } = await searchParams;

  const batches = await getBatches({ search, status });

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Batches' },
        ]}
      />

      <PageHeader
        title="Training Batches"
        description="Monitor all academic cohorts, scheduled timelines, and student capacities across partner colleges"
      />

      {batches.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-8 h-8 text-slate-400" />}
          title="No batches found"
          description="Training batches are created inside a College Workspace. Select a college to initialize a new training cohort."
          actionLabel="View Colleges"
          actionHref="/admin/colleges"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Batch Code & Program</th>
                  <th className="py-3.5 px-4">College Institution</th>
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
                      <Link
                        href={`/admin/colleges/${batch.college_id}`}
                        className="font-semibold text-slate-900 hover:text-blue-700 transition flex items-center gap-1"
                      >
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{batch.college_name}</span>
                      </Link>
                      {batch.college_city && (
                        <div className="text-[11px] text-slate-500">
                          {batch.college_city}
                        </div>
                      )}
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
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-100">
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
              Total {batches.length} {batches.length === 1 ? 'batch' : 'batches'} registered
            </span>
            <span className="text-slate-400">
              Aggregated across all partner campuses
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
