import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  GraduationCap, 
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { 
  getStudentAttendanceSummary, 
  getStudentBatches, 
  getStudentProfile,
  getStudentPendingFeedbackList,
} from '@/lib/db/studentPortal';
import StudentFeedbackBanner from '@/components/student/StudentFeedbackBanner';
import { calculateAttendanceStatus } from '@/lib/student/attendance';
import Card from '@/components/student/Card';
import StatusDot from '@/components/student/StatusDot';
import EmptyState from '@/components/student/EmptyState';

export const metadata: Metadata = {
  title: 'Dashboard | SkillThinker',
  description: 'Enrolled course timeline, verified attendance records, and session history.',
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
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default async function StudentAttendanceLandingPage() {
  const session = await getSession();

  if (!session || session.role !== 'student') {
    redirect('/login');
  }

  // Single source of truth query for attendance and enrolled batches
  const [attendanceData, batches, profile, pendingFeedbacks] = await Promise.all([
    getStudentAttendanceSummary(session.id),
    getStudentBatches(session.id),
    getStudentProfile(session.id),
    getStudentPendingFeedbackList(),
  ]);

  const primaryBatch = batches[0] || null;
  const firstName = profile?.full_name?.trim().split(' ')[0] || session.fullName?.split(' ')[0] || 'Student';
  const greeting = getTimeGreeting();

  // Course progress calculation
  const totalCourseDays = primaryBatch?.duration_days || 45;
  const completedDays = attendanceData.totalRecordedSessions;
  const courseProgressPercent = Math.min(100, Math.round((completedDays / totalCourseDays) * 100));
  const remainingDays = Math.max(0, totalCourseDays - completedDays);

  // Attended = present + late as per institutional standard
  const attendedCount = attendanceData.presentCount + attendanceData.lateCount;
  const totalCount = attendanceData.totalRecordedSessions;

  const attendance = calculateAttendanceStatus(attendedCount, totalCount, 80);

  // Evaluated history (exclude unrecorded future sessions)
  const evaluatedHistory = (attendanceData.history || []).filter(
    (s) => s.attendance_status !== 'unmarked'
  );

  return (
    <div className="space-y-6 w-full">
      {/* 1. Page Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-1">
            Institutional learning workspace and cohort progress.
          </p>
        </div>

        {primaryBatch && (
          <div className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-700">
            <GraduationCap className="w-4 h-4 text-[#0A3A7A] shrink-0" />
            <span className="font-semibold text-slate-900">{primaryBatch.program_name}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-500">{primaryBatch.code}</span>
          </div>
        )}
      </div>

      {/* Post-Training Feedback Banner (When Unlocked) */}
      <StudentFeedbackBanner pendingFeedbacks={pendingFeedbacks} />

      {/* 2. Enrolled Course Overview Card (PLACED AT TOP) */}
      {primaryBatch && (
        <Card id="course" className="p-6 sm:p-7 bg-white border border-slate-200 scroll-mt-24">
          <div className="space-y-4">
            {/* Top row: Program Title & Badge */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Enrolled Program
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-medium text-[#0A3A7A] bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
                  Active Cohort
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {primaryBatch.program_name}
              </h2>
            </div>

            {primaryBatch.program_description && (
              <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
                {primaryBatch.program_description}
              </p>
            )}

            {/* Course Timeline Progress Bar (Days Completed & Percentage) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    Day {completedDays} of {totalCourseDays} Completed
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-medium">
                    {remainingDays} days remaining
                  </span>
                </div>
                <span className="font-bold text-[#0A3A7A] [font-variant-numeric:tabular-nums]">
                  {courseProgressPercent}% Timeline Completed
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0A3A7A] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(courseProgressPercent, 3)}%` }}
                />
              </div>
            </div>

            {/* Clean Key-Value Metadata Strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Batch Code:</span>{' '}
                <span className="font-mono font-semibold text-slate-800">{primaryBatch.code}</span>
              </div>
              <div>
                <span className="text-slate-400">Total Program:</span>{' '}
                <span className="font-semibold text-slate-800">{totalCourseDays} Days</span>
              </div>
              <div>
                <span className="text-slate-400">Lead Faculty:</span>{' '}
                <span className="font-semibold text-slate-800">{primaryBatch.lead_trainer_name || 'Assigned faculty'}</span>
              </div>
              <div>
                <span className="text-slate-400">Campus:</span>{' '}
                <span className="font-semibold text-slate-800">{primaryBatch.college_name || 'Institution'}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Attendance Overview Card (PLACED DOWN UNDER COURSE) */}
      <Card id="attendance" className="p-6 sm:p-8 bg-white border border-slate-200 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Percentage & Criteria */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Attendance Standing
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  attendance.isEligible
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    attendance.isEligible ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span>{attendance.isEligible ? 'Requirement met (≥80%)' : 'Below 80% criteria'}</span>
              </span>
            </div>

            <div>
              <div className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight [font-variant-numeric:tabular-nums]">
                {attendance.percentage}%
              </div>
              <p className="text-sm font-medium text-slate-600 mt-1">
                {attendance.attended} of {attendance.total} classes attended
              </p>
            </div>

            <p className="text-sm text-slate-600 leading-normal pt-1">
              {attendance.statusSentence}
            </p>
          </div>

          {/* Clean Metric Columns */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-6 pt-6 lg:pt-0 lg:border-l lg:border-slate-100 lg:pl-8">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Attended
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1 block [font-variant-numeric:tabular-nums]">
                {attendance.attended}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 block">
                Sessions verified
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Missed
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1 block [font-variant-numeric:tabular-nums]">
                {attendanceData.absentCount}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 block">
                Absences logged
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Total Classes
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 block [font-variant-numeric:tabular-nums]">
                {attendance.total}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 block">
                Conducted to date
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Class History Ledger Table */}
      <Card className="p-6 sm:p-7 bg-white border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Class History
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Official chronological log of verified sessions recorded by faculty.
            </p>
          </div>

          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-mono">
            {evaluatedHistory.length} sessions verified
          </span>
        </div>

        {evaluatedHistory.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {evaluatedHistory.map((sessionItem, index) => (
              <div
                key={sessionItem.id}
                className="py-3.5 px-2 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 tracking-tight">
                      {formatDate(sessionItem.date)}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Session #{evaluatedHistory.length - index}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <StatusDot
                    status={sessionItem.attendance_status}
                    size="md"
                    variant="pill"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8">
            <EmptyState
              variant="inline"
              description="No classes recorded yet."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
