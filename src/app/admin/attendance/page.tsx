import React from 'react';
import Link from 'next/link';
import { getBatches, getBatchById } from '@/lib/db/batches';
import { getStudentsByBatchId } from '@/lib/db/students';
import { getBatchSessions, getPlatformAttendanceStats } from '@/lib/db/attendance';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import BatchAttendanceManager from '@/components/admin/BatchAttendanceManager';
import EmptyState from '@/components/admin/EmptyState';
import { CalendarCheck, Layers, Users, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AttendancePageProps {
  searchParams: Promise<{
    batchId?: string;
  }>;
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const { batchId } = await searchParams;

  const [allBatches, stats] = await Promise.all([
    getBatches(),
    getPlatformAttendanceStats(),
  ]);

  const activeBatches = allBatches.filter((b) => b.status === 'active' || b.status === 'planned');
  const targetBatchId = batchId || activeBatches[0]?.id;

  const [currentBatch, students, sessions] = targetBatchId
    ? await Promise.all([
        getBatchById(targetBatchId),
        getStudentsByBatchId(targetBatchId),
        getBatchSessions(targetBatchId),
      ])
    : [null, [], []];

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-7xl mx-auto">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Attendance' },
        ]}
      />

      {/* 2. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Attendance Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record and monitor daily student lecture attendance across active training cohorts.
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{stats.overallAttendanceRate}% Overall Attendance</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
            <span>{stats.totalSessions} Sessions Conducted</span>
          </div>
        </div>
      </div>

      {/* 3. Batch Selector Toolbar */}
      {allBatches.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-8 h-8 text-slate-400" />}
          title="No batches available"
          description="Create a training batch and enroll students to start recording attendance."
          actionLabel="Create Training Batch"
          actionHref="/admin/batches/new"
        />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Active Cohort:</span>
              <form method="GET" className="inline-block">
                <select
                  name="batchId"
                  defaultValue={targetBatchId}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#0A3A7A] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20"
                >
                  {allBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.program_name} ({b.college_name})
                    </option>
                  ))}
                </select>
                <noscript>
                  <button type="submit" className="ml-2 text-xs font-bold text-[#0A3A7A]">
                    Select
                  </button>
                </noscript>
              </form>
            </div>

            {currentBatch && (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Institution: <strong>{currentBatch.college_name}</strong></span>
                <span>•</span>
                <span>Capacity: <strong>{currentBatch.actual_students_count} / {currentBatch.target_strength}</strong></span>
              </div>
            )}
          </div>

          {/* 4. Active Attendance Workspace */}
          {currentBatch ? (
            <BatchAttendanceManager
              batchId={currentBatch.id}
              batchCode={currentBatch.code}
              initialStudents={students.map((s) => ({
                student_id: s.id,
                roll_number: s.roll_number,
                full_name: s.full_name,
                department: s.department,
                status: 'unmarked',
                notes: null,
              }))}
              existingSessions={sessions.map((s) => ({
                id: s.id,
                date: s.date,
                title: s.title,
                topic: s.topic,
                status: s.status,
              }))}
            />
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              Select a batch from the dropdown above to view its attendance roster.
            </div>
          )}
        </>
      )}
    </div>
  );
}
