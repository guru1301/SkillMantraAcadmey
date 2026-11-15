import React from 'react';
import Link from 'next/link';
import { getBatches } from '@/lib/db/batches';
import { getColleges } from '@/lib/db/colleges';
import { getPlatformOverviewStats } from '@/lib/db';
import { getPlatformAttendanceStats } from '@/lib/db/attendance';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
import {
  BarChart3,
  Building2,
  Layers,
  GraduationCap,
  CalendarCheck,
  CheckCircle2,
  Download,
  Users,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [platformStats, attendanceStats, batches, colleges] = await Promise.all([
    getPlatformOverviewStats(),
    getPlatformAttendanceStats(),
    getBatches(),
    getColleges(),
  ]);

  // Real calculated totals
  const totalTargetCapacity = batches.reduce((acc, b) => acc + (b.target_strength || 0), 0);
  const totalEnrolled = platformStats.totalStudents;
  const overallUtilization = totalTargetCapacity > 0 ? Math.round((totalEnrolled / totalTargetCapacity) * 100) : 0;

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-7xl mx-auto">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Reports & Analytics' },
        ]}
      />

      {/* 2. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Operational Reports &amp; Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Practical reporting answering core institutional questions: enrollment capacity, cohort activity, and attendance rates.
          </p>
        </div>
      </div>

      {/* 3. Operational Performance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Enrolled vs Capacity */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Overall Enrollment</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalEnrolled}</span>
            <span className="text-xs text-slate-500">/ {totalTargetCapacity} seats</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-blue-700">
            {overallUtilization}% capacity utilization
          </div>
        </div>

        {/* Active Batches */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Active Cohorts</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{platformStats.activeBatches}</span>
            <span className="text-xs text-slate-500">of {platformStats.totalBatches} total</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-emerald-700">
            Currently in training delivery
          </div>
        </div>

        {/* Partner Colleges Engaged */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Institutions Engaged</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{platformStats.totalColleges}</span>
            <span className="text-xs text-slate-500">colleges</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-indigo-700">
            Across registered campuses
          </div>
        </div>

        {/* Attendance Percentage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Average Attendance</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{attendanceStats.overallAttendanceRate}%</span>
            <span className="text-xs text-slate-500">{attendanceStats.totalSessions} sessions</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-amber-700">
            {attendanceStats.totalRecordsMarked} check-ins recorded
          </div>
        </div>
      </div>

      {/* 4. Report Table 1: Batch Capacity & Enrollment Report */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Batch Enrollment &amp; Capacity Utilization
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of actual student enrollments against target seat quotas.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4 text-center">Enrolled / Target</th>
                <th className="py-3 px-4 text-center">Utilization</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {batches.map((b) => {
                const utilPct = b.target_strength > 0
                  ? Math.round((b.actual_students_count / b.target_strength) * 100)
                  : 0;

                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                      <Link href={`/admin/batches/${b.id}`} className="hover:underline">
                        {b.code}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {b.college_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      {b.program_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {b.start_date} to {b.end_date}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">
                      <span className="font-semibold text-slate-900">{b.actual_students_count}</span>
                      <span className="text-slate-400">/{b.target_strength}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          utilPct >= 80
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : utilPct >= 50
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {utilPct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Report Table 2: Partner Institutions Coverage */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Partner College Training Summary
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active cohorts and total student reach by campus partner.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">College Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Active Batches</th>
                <th className="py-3 px-4 text-center">Enrolled Students</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {colleges.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {c.city ? `${c.city}, ${c.state || ''}` : 'Location unconfigured'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                    {c.active_batches_count}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#0A3A7A]">
                    {c.enrolled_students_count}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/admin/colleges/${c.id}`}
                      className="font-bold text-[#0A3A7A] hover:underline"
                    >
                      View Campus →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
