import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollegeById, getCollegeStats } from '@/lib/db/colleges';
import { getBatches } from '@/lib/db/batches';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
import CollegeTabs from '@/components/admin/CollegeTabs';
import StatCard from '@/components/admin/StatCard';
import {
  Building2,
  Edit,
  Layers,
  BookOpen,
  GraduationCap,
  Users,
  ArrowRight,
  Plus,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface CollegeWorkspacePageProps {
  params: Promise<{ collegeId: string }>;
}

export default async function CollegeWorkspacePage({
  params,
}: CollegeWorkspacePageProps) {
  const { collegeId } = await params;

  const [college, stats, batches] = await Promise.all([
    getCollegeById(collegeId),
    getCollegeStats(collegeId),
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
          { label: college.name },
        ]}
      />

      {/* College Workspace Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0A3A7A] text-[#FCAF0A] flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {college.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {college.name}
                </h1>
                <StatusBadge status={college.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {[college.city, college.state].filter(Boolean).join(', ') ||
                      'Location unassigned'}
                  </span>
                </div>
                {college.contact_name && (
                  <div className="flex items-center gap-1 text-slate-600">
                    <span className="text-slate-400">• Contact:</span>
                    <span className="font-semibold">{college.contact_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={`/admin/colleges/${college.id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit College</span>
            </Link>
            <Link
              href={`/admin/colleges/${college.id}/batches/new`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-semibold text-xs shadow-sm hover:shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Batch</span>
            </Link>
          </div>
        </div>
      </div>

      {/* College Hierarchical Navigation Tabs */}
      <CollegeTabs collegeId={college.id} activeTab="overview" />

      {/* Overview Real Aggregate Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Programs"
          value={stats.programsCount}
          subtitle="Curriculums deployed"
          icon={<BookOpen className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title="Active Batches"
          value={stats.activeBatchesCount}
          subtitle={`${stats.totalBatchesCount} total batches`}
          icon={<Layers className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Enrolled Students"
          value={stats.enrolledStudentsCount}
          subtitle="Dynamic enrollment records"
          icon={<GraduationCap className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Trainers Assigned"
          value={stats.assignedTrainersCount}
          subtitle="Faculty & mentors assigned"
          icon={<Users className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Workspace Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batches Overview List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Institutional Batches
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active & planned cohorts at {college.name}
              </p>
            </div>
            <Link
              href={`/admin/colleges/${college.id}/batches`}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>View all ({batches.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {batches.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                No training batches initialized yet
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                Launch the first cohort with curriculum roadmap and target capacity.
              </p>
              <Link
                href={`/admin/colleges/${college.id}/batches/new`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0A3A7A] text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Batch</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {batches.slice(0, 4).map((batch) => (
                <div
                  key={batch.id}
                  className="py-3.5 flex items-center justify-between gap-4 group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {batch.code}
                      </span>
                      <span className="font-semibold text-xs text-slate-800">
                        {batch.program_name}
                      </span>
                      <StatusBadge status={batch.status} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                      <span>
                        {batch.start_date} → {batch.end_date}
                      </span>
                      <span>• Target: {batch.target_strength}</span>
                      <span>• Enrolled: {batch.actual_students_count}</span>
                    </div>
                  </div>

                  <Link
                    href={`/admin/batches/${batch.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 transition"
                  >
                    <span>Open Batch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Institutional Contact & Metadata Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Institution Details
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Coordinator
              </span>
              <span className="font-bold text-slate-800 text-sm">
                {college.contact_name || 'Not designated'}
              </span>
            </div>

            {college.contact_email && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Contact Email
                </span>
                <a
                  href={`mailto:${college.contact_email}`}
                  className="font-medium text-blue-700 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Mail className="w-3 h-3" />
                  <span>{college.contact_email}</span>
                </a>
              </div>
            )}

            {college.contact_phone && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Phone Number
                </span>
                <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{college.contact_phone}</span>
                </span>
              </div>
            )}

            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Registration Date
              </span>
              <span className="font-medium text-slate-600 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{new Date(college.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link
              href={`/admin/colleges/${college.id}/edit`}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Update Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
