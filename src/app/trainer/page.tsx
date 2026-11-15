import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building2,
  BookOpen,
  Award,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import {
  getTrainerProfile,
  getTrainerAssignedBatches,
  getTrainerRecentSessions,
} from '@/lib/db/trainerPortal';
import Card from '@/components/trainer/Card';
import EmptyState from '@/components/trainer/EmptyState';

export const metadata: Metadata = {
  title: 'Faculty Workspace | SkillThinker Trainer Portal',
  description: 'Instructor dashboard for managing assigned cohorts and recording verified session attendance.',
};

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default async function TrainerDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    redirect('/login');
  }

  const [profile, batches, recentSessions] = await Promise.all([
    getTrainerProfile(session.id),
    getTrainerAssignedBatches(session.id),
    getTrainerRecentSessions(session.id, 6),
  ]);

  const trainerName = profile?.full_name?.trim() || session.fullName || 'Trainer';
  const firstName = trainerName.replace(/^Dr\.\s*/i, '').split(' ')[0] || trainerName;
  const greeting = getTimeGreeting();

  const totalStudents = batches.reduce((acc, b) => acc + (b.enrolled_count || 0), 0);
  const todayMarkedCount = batches.filter((b) => b.today_marked).length;
  const pendingBatch = batches.find((b) => !b.today_marked);

  const todayDateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 w-full">
      {/* 1. Page Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Institutional instruction workspace and assigned training cohorts.
          </p>
        </div>

        <div className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-700">
          <GraduationCap className="w-4 h-4 text-[#0A3A7A] shrink-0" />
          <span className="font-semibold text-slate-900">{todayDateFormatted}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 font-medium">
            {batches.length} {batches.length === 1 ? 'Cohort' : 'Cohorts'} Assigned
          </span>
        </div>
      </div>

      {/* 2. Today's Attendance Prompt Hero Banner */}
      {batches.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#062F68] via-[#0A3A7A] to-[#041E42] p-5 sm:p-6 text-white shadow-sm border border-white/10">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-[#FCAF0A] text-xs font-semibold border border-white/15">
                <span className={`w-2 h-2 rounded-full ${pendingBatch ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span>Today&apos;s Attendance Schedule</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {pendingBatch
                  ? `Attendance pending for ${pendingBatch.code} (${pendingBatch.college_name})`
                  : `All ${batches.length} cohorts recorded for today`}
              </h2>
              <p className="text-xs text-blue-100/80 max-w-xl font-normal leading-relaxed">
                {pendingBatch
                  ? `Record today's live lecture attendance for verified institutional auditing.`
                  : `Turnout records verified. You can inspect logs or review submissions below.`}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              {pendingBatch ? (
                <Link
                  href={`/trainer/attendance/${pendingBatch.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wide shadow-sm transition-colors border border-emerald-500/40 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FCAF0A]" />
                  <span>Mark Today&apos;s Attendance</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href={`/trainer/attendance/${batches[0]?.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs tracking-wide border border-white/20 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Review Today&apos;s Records</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Cohorts */}
        <Card padding="sm" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Assigned Cohorts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A3A7A] border border-blue-100 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight [font-variant-numeric:tabular-nums]">
            {batches.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Active college cohorts
          </div>
        </Card>

        {/* Total Students */}
        <Card padding="sm" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Enrolled Students</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight [font-variant-numeric:tabular-nums]">
            {totalStudents}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Students in your roster
          </div>
        </Card>

        {/* Today's Status */}
        <Card padding="sm" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Today&apos;s Attendance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight [font-variant-numeric:tabular-nums]">
            {todayMarkedCount} <span className="text-base text-slate-400 font-normal">/ {batches.length}</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {todayMarkedCount === batches.length && batches.length > 0 
              ? 'All marked for today' 
              : `${batches.length - todayMarkedCount} pending today`}
          </div>
        </Card>

        {/* Recorded Sessions */}
        <Card padding="sm" className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Recorded Classes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight [font-variant-numeric:tabular-nums]">
            {recentSessions.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Logged lectures on file
          </div>
        </Card>
      </div>

      {/* 4. Assigned Cohorts Roster */}
      <Card id="cohorts" className="p-6 sm:p-7 bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Your Assigned Cohorts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review enrolled student rosters and record verified classroom sessions.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            <Link
              href="/trainer/batches"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <span>Batch Details &amp; Rosters</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/trainer/attendance"
              className="text-xs font-semibold text-[#0A3A7A] hover:text-[#062F68] flex items-center gap-1 transition-colors"
            >
              <span>Attendance Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="py-10">
            <EmptyState
              icon={BookOpen}
              title="No Batches Assigned"
              description="Your instructor account does not currently have any assigned cohorts. Contact your SkillThinker administrator to link training cohorts."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/80 p-5 transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#0A3A7A] bg-blue-100/70 border border-blue-200/50 px-2.5 py-0.5 rounded-md">
                        {batch.code}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {batch.is_lead ? 'Lead Instructor' : 'Mentor / Assistant'}
                      </span>
                    </div>

                    {batch.today_marked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Today Recorded</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-200/60">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Pending Today</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2 leading-snug">
                    {batch.program_name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700">{batch.college_name}</span>
                    {batch.college_city && (
                      <span className="text-slate-400">• {batch.college_city}</span>
                    )}
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-900 font-bold">{batch.enrolled_count}</strong>
                      <span className="text-slate-500">enrolled</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <div>
                      <span className="text-slate-400">Starts:</span>{' '}
                      <span className="font-medium text-slate-700">{batch.start_date}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 font-medium">
                    {batch.today_marked
                      ? `Marked for today (${batch.today_present_count || 0} present)`
                      : 'Attendance not taken today'}
                  </div>
                  <Link
                    href={`/trainer/attendance/${batch.id}`}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      batch.today_marked
                        ? 'bg-slate-200/80 text-slate-700 hover:bg-slate-300/80'
                        : 'bg-[#0A3A7A] hover:bg-[#062F68] text-white shadow-2xs'
                    }`}
                  >
                    <span>{batch.today_marked ? 'Review Attendance' : 'Record Attendance'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 5. Recent Attendance Sessions Ledger */}
      {recentSessions.length > 0 && (
        <Card className="p-6 sm:p-7 bg-white border border-slate-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Recent Attendance Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Past recorded lectures and student turnout across your cohorts.
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-mono">
              {recentSessions.length} logged sessions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Batch</th>
                  <th className="pb-3 pr-4">Campus</th>
                  <th className="pb-3 pr-4">Session Title</th>
                  <th className="pb-3 pr-4 text-center">Present / Total</th>
                  <th className="pb-3 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentSessions.map((session) => (
                  <tr key={session.session_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-medium text-slate-900">
                      {formatDate(session.date)}
                    </td>
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#0A3A7A]">
                      {session.batch_code}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600 truncate max-w-[150px]">
                      {session.college_name}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-800 font-medium truncate max-w-[200px]">
                      {session.title}
                    </td>
                    <td className="py-3.5 pr-4 text-center font-medium">
                      <span className="text-emerald-700 font-bold">{session.present_count}</span>
                      <span className="text-slate-400 font-normal"> / {session.total_students}</span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60 [font-variant-numeric:tabular-nums]">
                        {session.attendance_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
