import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  Mail,
  GraduationCap
} from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getStudentBatches, getStudentAttendanceSummary } from '@/lib/db/studentPortal';
import Card from '@/components/student/Card';
import EmptyState from '@/components/student/EmptyState';

export const metadata: Metadata = {
  title: 'Course Details | SkillThinker',
  description: 'Your enrolled course specifications and cohort timeline.',
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default async function StudentCoursePage() {
  const session = await getSession();

  if (!session || session.role !== 'student') {
    redirect('/login');
  }

  const [batches, attendanceData] = await Promise.all([
    getStudentBatches(session.id),
    getStudentAttendanceSummary(session.id),
  ]);

  const batch = batches[0] || null;

  if (!batch) {
    return (
      <div className="w-full py-12">
        <EmptyState
          variant="inline"
          description="You are not enrolled in any course batches at this time."
        />
      </div>
    );
  }

  const totalCourseDays = batch.duration_days || 45;
  const completedDays = attendanceData.totalRecordedSessions;
  const courseProgressPercent = Math.min(100, Math.round((completedDays / totalCourseDays) * 100));
  const remainingDays = Math.max(0, totalCourseDays - completedDays);
  const instructorName = batch.lead_trainer_name || 'Assigned faculty';
  const instructorEmail = batch.lead_trainer_email || null;

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Course Details
        </h1>
        <p className="text-sm text-slate-500 font-normal mt-1">
          Academic program specifications and cohort timeline.
        </p>
      </div>

      {/* Program Overview Card with Timeline Progress */}
      <Card className="p-6 sm:p-8 bg-white border border-slate-200">
        <div className="space-y-5">
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
              {batch.program_name}
            </h2>
          </div>

          {batch.program_description && (
            <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
              {batch.program_description}
            </p>
          )}

          {/* Course Timeline Progress Bar */}
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

            <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0A3A7A] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(courseProgressPercent, 3)}%` }}
              />
            </div>
          </div>

          {/* Key Program Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-xs font-medium text-slate-500">Institution</div>
              <div className="text-sm font-semibold text-slate-900 mt-1 truncate" title={batch.college_name}>
                {batch.college_name}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-xs font-medium text-slate-500">Schedule</div>
              <div className="text-sm font-semibold text-slate-900 mt-1 truncate">
                {formatDate(batch.start_date)} – {formatDate(batch.end_date)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-xs font-medium text-slate-500">Duration</div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                {totalCourseDays} Days
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-xs font-medium text-slate-500">Lead Faculty</div>
              <div className="text-sm font-semibold text-slate-900 mt-1 truncate" title={instructorName}>
                {instructorName}
              </div>
              {instructorEmail && (
                <a
                  href={`mailto:${instructorEmail}`}
                  className="text-xs text-[#0A3A7A] hover:underline flex items-center gap-1 mt-1 truncate font-medium"
                >
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{instructorEmail}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
