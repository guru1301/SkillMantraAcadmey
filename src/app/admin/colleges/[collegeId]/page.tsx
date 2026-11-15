import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollegeById, getCollegeStats } from '@/lib/db/colleges';
import { getBatches } from '@/lib/db/batches';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatusBadge from '@/components/admin/StatusBadge';
import OptimisticCollegeStatusBadge, { CollegeStatusType } from '@/components/admin/OptimisticCollegeStatusBadge';
import {
  Building2,
  Edit,
  Layers,
  GraduationCap,
  Users,
  ArrowRight,
  Plus,
  Mail,
  Phone,
  Calendar,
  MapPin,
} from 'lucide-react';

interface CollegeDetailPageProps {
  params: Promise<{ collegeId: string }>;
}

export default async function CollegeDetailPage({
  params,
}: CollegeDetailPageProps) {
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
    <div className="space-y-4 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Colleges', href: '/admin/colleges' },
          { label: college.name },
        ]}
      />

      {/* College Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0A3A7A] text-[#FCAF0A] flex items-center justify-center font-black text-lg sm:text-xl shadow-2xs shrink-0">
              {college.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {college.name}
                </h1>
                <OptimisticCollegeStatusBadge
                  collegeId={college.id}
                  initialStatus={college.status as CollegeStatusType}
                  collegeName={college.name}
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {[college.city, college.state].filter(Boolean).join(', ') || 'Location unassigned'}
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

          {/* Large Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              href={`/admin/colleges/${college.id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit College</span>
            </Link>
            <Link
              href={`/admin/batches/new?collegeId=${college.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition"
            >
              <Plus className="w-4 h-4 text-[#FCAF0A]" />
              <span>+ Schedule Batch</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Active Batches</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stats.activeBatchesCount}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({stats.totalBatchesCount} total)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A3A7A] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Enrolled Students</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stats.enrolledStudentsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Assigned Faculty</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stats.assignedTrainersCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2-Column Content: College Batches (Left) & Institution Contact (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Batches Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Training Batches ({batches.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cohorts scheduled and delivered at {college.name}
              </p>
            </div>
            <Link
              href={`/admin/batches/new?collegeId=${college.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-semibold shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>+ New Batch</span>
            </Link>
          </div>

          {batches.length === 0 ? (
            <div className="py-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                No training batches scheduled yet
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                Create the first batch for this college to start training.
              </p>
              <Link
                href={`/admin/batches/new?collegeId=${college.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] text-white text-xs font-bold shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#FCAF0A]" />
                <span>Create Batch</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Batch Code</th>
                    <th className="py-2.5 px-3">Curriculum</th>
                    <th className="py-2.5 px-3">Dates</th>
                    <th className="py-2.5 px-3 text-center">Students</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-[#0A3A7A]">
                        {batch.code}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {batch.program_name}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                        {batch.start_date} → {batch.end_date}
                      </td>
                      <td className="py-3 px-3 text-center font-medium">
                        <span className="font-bold text-slate-900">{batch.actual_students_count}</span>
                        <span className="text-slate-400">/{batch.target_strength}</span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={batch.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/batches/${batch.id}`}
                          className="font-bold text-[#0A3A7A] hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Institution Details (Right col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Institution Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">Contact and coordinator information</p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Coordinator / SPOC
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {college.contact_name || 'Not assigned'}
              </span>
            </div>

            {college.contact_email && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Email
                </span>
                <a
                  href={`mailto:${college.contact_email}`}
                  className="font-medium text-[#0A3A7A] hover:underline flex items-center gap-1.5 mt-0.5"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{college.contact_email}</span>
                </a>
              </div>
            )}

            {college.contact_phone && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Phone
                </span>
                <span className="font-medium text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{college.contact_phone}</span>
                </span>
              </div>
            )}

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Location
              </span>
              <span className="font-medium text-slate-700 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{[college.city, college.state].filter(Boolean).join(', ') || 'Not specified'}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Registered On
              </span>
              <span className="font-medium text-slate-600 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(college.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link
              href={`/admin/colleges/${college.id}/edit`}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Institution Details</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
