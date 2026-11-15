import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollegeById } from '@/lib/db/colleges';
import { getBatches } from '@/lib/db/batches';
import { getStudentsByCollegeId } from '@/lib/db/students';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import CollegeTabs from '@/components/admin/CollegeTabs';
import StatusBadge from '@/components/admin/StatusBadge';
import { MapPin, Users, Layers, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CollegeReportsPageProps {
  params: Promise<{ collegeId: string }>;
}

export default async function CollegeReportsPage({
  params,
}: CollegeReportsPageProps) {
  const { collegeId } = await params;
  const [college, batches, students] = await Promise.all([
    getCollegeById(collegeId),
    getBatches({ collegeId }),
    getStudentsByCollegeId(collegeId),
  ]);

  if (!college) {
    notFound();
  }

  const activeBatchesCount = batches.filter((b) => b.status === 'active').length;
  const totalCapacity = batches.reduce((acc, b) => acc + (b.target_strength || 0), 0);
  const utilization = totalCapacity > 0 ? Math.round((students.length / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges', href: '/admin/colleges' },
          { label: college.name, href: `/admin/colleges/${college.id}` },
          { label: 'Reports' },
        ]}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0A3A7A] text-[#FCAF0A] flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
            {college.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {college.name}
              </h1>
              <StatusBadge status={college.status} />
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {[college.city, college.state].filter(Boolean).join(', ') || 'Location unassigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CollegeTabs collegeId={college.id} activeTab="reports" />

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Total Enrolled Students</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{students.length}</span>
          <span className="text-[11px] text-slate-400">{utilization}% of target seats</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Active Training Cohorts</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{activeBatchesCount}</span>
          <span className="text-[11px] text-slate-400">of {batches.length} total batches</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 block">Total Training Capacity</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalCapacity}</span>
          <span className="text-[11px] text-slate-400">cumulative planned seats</span>
        </div>
      </div>

      {/* Cohorts Capacity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Campus Cohort Capacity Report</h2>
          <p className="text-xs text-slate-500 mt-0.5">Breakdown of student enrollments vs target capacity across all batches at {college.name}.</p>
        </div>

        {batches.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400">No batches created for this college yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-center">Enrolled / Target</th>
                  <th className="py-3 px-4 text-center">Utilization</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {batches.map((b) => {
                  const pct = b.target_strength > 0 ? Math.round((b.actual_students_count / b.target_strength) * 100) : 0;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{b.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{b.program_name}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{b.start_date} to {b.end_date}</td>
                      <td className="py-3 px-4 text-center font-bold">{b.actual_students_count} / {b.target_strength}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">{pct}%</td>
                      <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
