import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CheckCircle2, Circle, Award, ShieldCheck } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { 
  getStudentAttendanceSummary, 
  getStudentBatches, 
  getStudentAssessments,
  getStudentCertificates,
  getStudentPendingFeedbackList,
} from '@/lib/db/studentPortal';
import { calculateAttendanceStatus } from '@/lib/student/attendance';
import Card from '@/components/student/Card';
import CertificateDownloadButton from '@/components/student/CertificateDownloadButton';
import CertificateFeedbackTrigger from '@/components/student/CertificateFeedbackTrigger';

export const metadata: Metadata = {
  title: 'Certificate | SkillThinker',
  description: 'Your verified certificate eligibility checklist and official course credential download.',
};

export default async function StudentCertificatesPage() {
  const session = await getSession();

  if (!session || session.role !== 'student') {
    redirect('/login');
  }

  // Single source of truth query for attendance, cohorts, tests, and certificates
  const [attendanceData, batches, assessments, certs, pendingFeedbacks] = await Promise.all([
    getStudentAttendanceSummary(session.id),
    getStudentBatches(session.id),
    getStudentAssessments(session.id),
    getStudentCertificates(session.id),
    getStudentPendingFeedbackList(),
  ]);

  const primaryBatch = batches[0] || null;
  const primaryCert = certs.find((c) => c.batchId === primaryBatch?.id) || certs[0] || null;

  // Standard attendance metric: present + late
  const attendedCount = attendanceData.presentCount + attendanceData.lateCount;
  const totalCount = attendanceData.totalRecordedSessions;
  const attendance = calculateAttendanceStatus(attendedCount, totalCount, 80);

  // Attendance requirement: >= 80%
  const attendanceMet = attendance.isEligible;

  // Test requirement (only if tests exist for the cohort)
  const hasTests = assessments.length > 0;
  const testsAttempted = assessments.filter(
    (a) => a.student_status === 'submitted' || a.student_status === 'evaluated'
  );
  const testRequirementMet = hasTests ? testsAttempted.length > 0 : true;

  // Post-Training Feedback Requirement:
  // Must be strictly submitted by the student before certificate unlock
  const isFeedbackPendingForBatch = pendingFeedbacks.some((p) => p.batch_id === primaryBatch?.id);
  const feedbackSubmitted = Boolean(primaryCert?.feedbackSubmitted);
  const isFeedbackUnlocked = isFeedbackPendingForBatch || feedbackSubmitted;

  // Overall eligibility: Attendance met + tests met + feedback strictly submitted
  const isEligible = Boolean(attendanceMet && testRequirementMet && feedbackSubmitted);

  // Specific guidance message when requirements are pending
  let pendingRequirement: string | null = primaryCert?.pendingRequirement || null;
  if (!isEligible && !pendingRequirement) {
    if (!attendanceMet) {
      pendingRequirement = `Minimum 80% attendance required (current attendance: ${attendance.percentage}%).`;
    } else if (!testRequirementMet) {
      pendingRequirement = 'Completion of scheduled assessments is required.';
    } else if (!feedbackSubmitted) {
      pendingRequirement = 'Please submit your post-training feedback to unlock your certificate.';
    }
  }

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#062F68] tracking-tight">
          Your certificate
        </h1>
        {primaryBatch && (
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
            {primaryBatch.program_name} · <span className="font-mono text-slate-700">{primaryBatch.code}</span>
          </p>
        )}
      </div>

      {/* Main Certificate Card with Checklist */}
      <Card className="relative overflow-hidden p-8 sm:p-10 bg-white border border-slate-200/90 shadow-[0_12px_40px_-8px_rgba(10,58,122,0.08)] space-y-8">
        {/* Decorative Top Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0A3A7A] via-[#0B4EA2] to-[#FCAF0A]" />

        {/* Certificate Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#FCAF0A] border border-amber-200/80 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-amber-500/10">
              <Award className="w-8 h-8 text-[#FCAF0A]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#062F68] tracking-tight">
                Official course completion certificate
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Verified institutional credential issued upon meeting program attendance standards.
              </p>
            </div>
          </div>

          <span
            className={`self-start sm:self-auto text-xs sm:text-sm font-bold px-4 py-2 rounded-full border shadow-2xs ${
              isEligible
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-4 ring-emerald-500/10'
                : 'bg-slate-100 text-slate-700 border-slate-200/80'
            }`}
          >
            {isEligible ? 'Certificate Ready' : 'Requirements Pending'}
          </span>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Eligibility criteria
          </h3>

          <div className="space-y-4">
            {/* 1. Attendance Requirement */}
            <div className="flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-sm shadow-2xs">
              <div className="flex items-center gap-4">
                {attendanceMet ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300 shrink-0" />
                )}
                <div>
                  <span className="text-base font-bold text-slate-900 block">Classroom attendance</span>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">
                    Minimum 80% presence required in scheduled institutional classes.
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 ml-4">
                <span className={`text-xl sm:text-2xl font-black [font-variant-numeric:tabular-nums] ${attendanceMet ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {attendance.percentage}%
                </span>
                <span className="text-xs font-bold text-slate-400 block mt-0.5">Target: 80%</span>
              </div>
            </div>

            {/* 2. Test Requirement (if tests exist) */}
            {hasTests && (
              <div className="flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-sm shadow-2xs">
                <div className="flex items-center gap-4">
                  {testRequirementMet ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300 shrink-0" />
                  )}
                  <div>
                    <span className="text-base font-bold text-slate-900 block">Assessment evaluations</span>
                    <span className="text-xs sm:text-sm text-slate-500 font-medium">
                      Completion of scheduled institutional tests.
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-4">
                  <span className={`text-sm font-bold ${testRequirementMet ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {testRequirementMet
                      ? `${testsAttempted.length} of ${assessments.length} submitted`
                      : 'Pending'}
                  </span>
                </div>
              </div>
            )}
            {/* 3. Post-Training Feedback Requirement */}
            {primaryBatch && (
              <CertificateFeedbackTrigger
                batchId={primaryBatch.id}
                batchCode={primaryBatch.code}
                programName={primaryBatch.program_name}
                collegeName={primaryBatch.college_name || 'Institution'}
                feedbackSubmitted={feedbackSubmitted}
                isUnlocked={isFeedbackUnlocked}
              />
            )}
          </div>
        </div>

        {/* Download Button Section */}
        <div className="pt-4">
          <CertificateDownloadButton
            eligible={isEligible}
            pendingRequirement={pendingRequirement}
            batchId={primaryBatch?.id || ''}
          />
        </div>
      </Card>
    </div>
  );
}
