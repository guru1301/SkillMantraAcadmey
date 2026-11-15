import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Layers,
  GraduationCap,
  Users,
  FolderOpen,
  ArrowRight,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getCollegePortalData } from '@/lib/db/collegePortal';
import { getColleges } from '@/lib/db/colleges';
import StatusBadge from '@/components/admin/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function CollegePortalDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  let targetCollegeId = session.collegeId;

  if (!targetCollegeId && session.role === 'super_admin') {
    const defaultColleges = await getColleges({ status: 'active' });
    if (defaultColleges.length > 0) {
      targetCollegeId = defaultColleges[0].id;
    }
  }

  if (!targetCollegeId) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
        <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Institution Not Linked</h2>
        <p className="text-xs text-slate-500">
          Your account is not assigned to an active partner college.
        </p>
      </div>
    );
  }

  const portalData = await getCollegePortalData(targetCollegeId);

  if (!portalData) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-900">Institution Inactive or Not Found</h2>
      </div>
    );
  }

  const { college, stats, batches, trainers, students, resources } = portalData;

  const activeBatchesList = batches.filter((b) => b.status === 'active');
  const displayBatches = activeBatchesList.length > 0 ? activeBatchesList : batches.slice(0, 5);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Header with Institution Name & Coordinator Info */}
      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
              Partner College Portal
            </span>
            {college.city && (
              <span className="text-xs text-slate-500">• {college.city}</span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {college.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinator: <strong>{session.fullName}</strong>. Real-time campus training status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/portal/students"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition"
          >
            <GraduationCap className="w-4 h-4 text-slate-500" />
            <span>Students Roster</span>
          </Link>
          <Link
            href="/portal/resources"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs sm:text-sm font-bold shadow-2xs transition"
          >
            <FolderOpen className="w-4 h-4 text-[#FCAF0A]" />
            <span>Training Materials</span>
          </Link>
        </div>
      </div>

      {/* 2. Three Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Active Batches */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Batches</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A3A7A] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.activeBatches}</span>
            <span className="text-xs text-slate-500 font-medium">of {stats.totalBatches} total</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Training batches conducted on campus
          </p>
        </div>

        {/* Enrolled Students */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enrolled Students</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.totalStudents}</span>
            <span className="text-xs text-slate-500 font-medium">students</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Registered participants across cohorts
          </p>
        </div>

        {/* Assigned Trainers */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Trainers</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.totalTrainers}</span>
            <span className="text-xs text-slate-500 font-medium">instructors</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Certified technical faculty deployed
          </p>
        </div>
      </div>

      {/* 3. Campus Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Campus Training Batches
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Current and scheduled batches at {college.name}.
            </p>
          </div>
          <Link
            href="/portal/batches"
            className="text-xs font-bold text-[#0A3A7A] hover:underline inline-flex items-center gap-1"
          >
            <span>View all ({batches.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {displayBatches.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No training batches currently scheduled for your institution.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Batch Code</th>
                  <th className="py-3 px-4">Program Curriculum</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4 text-center">Enrolled</th>
                  <th className="py-3 px-4 text-center">Faculty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#0A3A7A]">
                      {b.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {b.program_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {b.start_date} to {b.end_date}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      <span className="font-semibold text-slate-900">{b.enrolled_count}</span>
                      <span className="text-slate-400">/{b.target_strength}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {b.trainers_count} instructor(s)
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/portal/batches/${b.id}`}
                        className="font-bold text-[#0A3A7A] hover:underline"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Training Materials Quick List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Training Materials</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Curriculum slide decks, lab manuals, and resource drives.
            </p>
          </div>
          <Link
            href="/portal/resources"
            className="text-xs font-bold text-[#0A3A7A] hover:underline"
          >
            View all ({resources.length})
          </Link>
        </div>

        {resources.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">
            No training materials currently uploaded.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resources.slice(0, 4).map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 transition flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block truncate">{r.name}</span>
                  <span className="text-[11px] font-mono text-blue-900 mt-0.5 block">
                    Cohort: {r.batch_code}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
