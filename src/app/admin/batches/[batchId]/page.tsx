import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBatchById, getBatchStats } from '@/lib/db/batches';
import { getResourcesByBatchId } from '@/lib/db/resources';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
import OptimisticBatchStatusBadge, { BatchStatusType } from '@/components/admin/OptimisticBatchStatusBadge';
import BatchTabs from '@/components/admin/BatchTabs';
import StatCard from '@/components/admin/StatCard';
import BatchResourcesSection from '@/components/admin/BatchResourcesSection';
import {
  Layers,
  Building2,
  Calendar,
  Users,
  GraduationCap,
  Clock,
  CheckCircle2,
  FileCheck2,
  BookOpen,
  ArrowLeft,
  CalendarCheck,
} from 'lucide-react';

interface BatchWorkspacePageProps {
  params: Promise<{ batchId: string }>;
}

export default async function BatchWorkspacePage({
  params,
}: BatchWorkspacePageProps) {
  const { batchId } = await params;

  const [batch, stats, resources] = await Promise.all([
    getBatchById(batchId),
    getBatchStats(batchId),
    getResourcesByBatchId(batchId),
  ]);

  if (!batch) {
    notFound();
  }

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges', href: '/admin/colleges' },
          { label: batch.college_name, href: `/admin/colleges/${batch.college_id}` },
          { label: 'Batches', href: `/admin/colleges/${batch.college_id}/batches` },
          { label: batch.code },
        ]}
      />

      {/* Batch Workspace Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <Link
              href={`/admin/colleges/${batch.college_id}/batches`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 mb-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {batch.college_name} Batches</span>
            </Link>

            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs sm:text-sm font-bold bg-[#0A3A7A] text-[#FCAF0A] px-2.5 py-0.5 rounded-lg">
                {batch.code}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {batch.program_name}
              </h1>
              <OptimisticBatchStatusBadge
                batchId={batch.id}
                initialStatus={batch.status as BatchStatusType}
                batchCode={batch.code}
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
              <Link
                href={`/admin/colleges/${batch.college_id}`}
                className="flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-700 transition"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{batch.college_name}</span>
                {batch.college_city && (
                  <span className="text-slate-400">({batch.college_city})</span>
                )}
              </Link>

              <div className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {batch.start_date} → {batch.end_date}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/80">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Seats
                </div>
                <div className="text-sm sm:text-base font-black text-slate-900">
                  {stats.targetStrength}
                </div>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Enrolled
                </div>
                <div className="text-sm sm:text-base font-black text-emerald-700">
                  {stats.actualStudents}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/batches/${batch.id}/attendance`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-[#FCAF0A]" />
                <span>Mark Attendance</span>
              </Link>
              <Link
                href={`/admin/batches/${batch.id}/students`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold transition"
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                <span>Roster ({stats.actualStudents})</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Navigation Tabs */}
      <BatchTabs batchId={batch.id} activeTab="overview" />

      {/* Real Aggregate Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Target Strength"
          value={stats.targetStrength}
          subtitle="Planned capacity"
          icon={<Users className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          title="Actual Students"
          value={stats.actualStudents}
          subtitle="Dynamic enrollment"
          icon={<GraduationCap className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          title="Assigned Trainers"
          value={stats.assignedTrainers}
          subtitle="Faculty & mentors"
          icon={<Users className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions}
          subtitle="Curriculum days"
          icon={<Clock className="w-4 h-4 text-indigo-600" />}
        />
        <StatCard
          title="Attendance"
          value={`${stats.attendancePercentage}%`}
          subtitle="Daily check-ins"
          icon={<CalendarCheck className="w-4 h-4 text-teal-600" />}
        />
        <StatCard
          title="Assessments"
          value={stats.assessmentsCount}
          subtitle="Tests & evaluations"
          icon={<FileCheck2 className="w-4 h-4 text-rose-600" />}
        />
      </div>

      {/* Resources & Drive Folders Module */}
      <BatchResourcesSection batchId={batch.id} initialResources={resources} />
    </div>
  );
}
