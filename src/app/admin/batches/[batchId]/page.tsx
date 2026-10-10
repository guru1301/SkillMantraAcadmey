import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBatchById, getBatchStats } from '@/lib/db/batches';
import { getResourcesByBatchId } from '@/lib/db/resources';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
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
    <div className="space-y-6">
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href={`/admin/colleges/${batch.college_id}/batches`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {batch.college_name} Batches</span>
            </Link>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-bold bg-[#0A3A7A] text-[#FCAF0A] px-2.5 py-1 rounded-lg">
                {batch.code}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {batch.program_name}
              </h1>
              <StatusBadge status={batch.status} />
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
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

          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 shrink-0">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Target Strength
              </div>
              <div className="text-base font-black text-slate-900">
                {stats.targetStrength}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Actual Students
              </div>
              <div className="text-base font-black text-emerald-700">
                {stats.actualStudents}
              </div>
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
