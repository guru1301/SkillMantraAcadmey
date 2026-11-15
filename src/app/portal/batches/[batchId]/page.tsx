import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getBatchById } from '@/lib/db/batches';
import { getStudentsByBatchId } from '@/lib/db/students';
import { getTrainersByBatchId } from '@/lib/db/trainers';
import { getResourcesByBatchId } from '@/lib/db/resources';
import { getBatchSessions } from '@/lib/db/attendance';
import StatusBadge from '@/components/admin/StatusBadge';
import {
  Calendar,
  Users,
  GraduationCap,
  FolderOpen,
  ArrowLeft,
  ExternalLink,
  Crown,
  CheckCircle2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PortalBatchDetailPageProps {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function PortalBatchDetailPage({
  params,
  searchParams,
}: PortalBatchDetailPageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { batchId } = await params;
  const { tab } = await searchParams;
  const currentTab = tab || 'overview';

  const batch = await getBatchById(batchId);
  if (!batch) notFound();

  // Strict Tenant Isolation: Ensure college coordinator can ONLY access their own institution's batches
  if (session.role !== 'super_admin' && session.collegeId && batch.college_id !== session.collegeId) {
    notFound();
  }

  const [students, trainers, resources, sessions] = await Promise.all([
    getStudentsByBatchId(batchId),
    getTrainersByBatchId(batchId),
    getResourcesByBatchId(batchId),
    getBatchSessions(batchId),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <Link
          href="/portal/batches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A3A7A] hover:underline mb-2 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Campus Batches</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold bg-[#0A3A7A] text-[#FCAF0A] px-2.5 py-1 rounded-lg">
              {batch.code}
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {batch.program_name}
              </h1>
              <p className="text-xs text-slate-500">
                {batch.start_date} to {batch.end_date} • {students.length} Students Enrolled
              </p>
            </div>
          </div>
          <StatusBadge status={batch.status} />
        </div>
      </div>

      {/* 2. Navigation Tabs (Overview, Students, Attendance, Materials) */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-1 sm:space-x-2 min-w-max">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'students', name: `Students (${students.length})` },
            { id: 'trainers', name: `Instructors (${trainers.length})` },
            { id: 'attendance', name: `Attendance (${sessions.length} Sessions)` },
            { id: 'resources', name: `Materials (${resources.length})` },
          ].map((t) => {
            const isActive = currentTab === t.id;
            return (
              <Link
                key={t.id}
                href={`/portal/batches/${batch.id}?tab=${t.id}`}
                className={`py-2.5 px-3.5 border-b-2 font-bold text-xs tracking-tight transition ${
                  isActive
                    ? 'border-[#0A3A7A] text-[#0A3A7A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. Tab Content */}
      {/* Overview Tab */}
      {currentTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Training Schedule &amp; Capacity
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Start Date</span>
                <span className="font-semibold text-slate-900">{batch.start_date}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">End Date</span>
                <span className="font-semibold text-slate-900">{batch.end_date}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Target Seats</span>
                <span className="font-semibold text-slate-900">{batch.target_strength} seats</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Enrolled Count</span>
                <span className="font-bold text-[#0A3A7A]">{students.length} students</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assigned Faculty Instructors
            </h3>
            {trainers.length === 0 ? (
              <p className="text-xs text-slate-400">No instructors assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {trainers.map((t) => (
                  <div key={t.assignment_id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{t.full_name}</span>
                      <span className="text-[11px] text-slate-500">{t.role || 'Faculty Trainer'}</span>
                    </div>
                    {t.is_lead && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        <Crown className="w-2.5 h-2.5 text-amber-600" />
                        Lead
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Students Tab */}
      {currentTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Enrolled Student Roster</h3>
            <span className="text-xs text-slate-500">{students.length} verified students</span>
          </div>
          {students.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No students enrolled in this batch yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">{st.roll_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{st.full_name}</td>
                      <td className="py-3 px-4 text-slate-500">{st.department || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {st.enrollment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Trainers Tab */}
      {currentTab === 'trainers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {trainers.map((t) => (
            <div key={t.assignment_id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{t.full_name}</span>
                {t.is_lead ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    Lead Trainer
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                    Assistant Trainer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Skills: {t.skills || 'Technical Instructor'}</p>
              {t.email && <p className="text-[11px] text-slate-400">Email: {t.email}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Attendance Tab (Read-Only for Coordinator per Section 8.3) */}
      {currentTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lecture Session Logs &amp; Attendance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Read-only session check-in logs for campus monitoring.</p>
            </div>
            <span className="text-xs font-semibold text-slate-600">{sessions.length} Sessions Logged</span>
          </div>

          {sessions.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No session attendance logged yet for this cohort.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Session Title</th>
                    <th className="py-3 px-4">Instructor</th>
                    <th className="py-3 px-4 text-center">Students Present</th>
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
                      <td className="py-3 px-4 text-slate-700">{s.trainer_name || 'Assigned Instructor'}</td>
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
      )}

      {/* Materials Tab */}
      {currentTab === 'resources' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Cohort Learning Materials</h3>
          {resources.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No materials uploaded for this batch yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{r.name}</span>
                    {r.description && <span className="text-[11px] text-slate-500 mt-0.5 block">{r.description}</span>}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
