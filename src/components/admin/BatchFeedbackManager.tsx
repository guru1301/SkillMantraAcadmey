'use client';

import React, { useState, useTransition } from 'react';
import { 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  Users, 
  MessageSquareHeart, 
  Star, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  FeedbackUnlockStatus, 
  BatchFeedbackSummary 
} from '@/lib/api/feedback';
import { unlockBatchFeedbackAction } from '@/app/actions/feedback';

interface BatchFeedbackManagerProps {
  batchId: string;
  initialStatus: FeedbackUnlockStatus;
  initialSummary: BatchFeedbackSummary | null;
  userRole: 'super_admin' | 'trainer' | 'college_admin';
  canUnlock: boolean;
}

export default function BatchFeedbackManager({
  batchId,
  initialStatus,
  initialSummary,
  userRole,
  canUnlock,
}: BatchFeedbackManagerProps) {
  const [status, setStatus] = useState<FeedbackUnlockStatus>(initialStatus);
  const [summary, setSummary] = useState<BatchFeedbackSummary | null>(initialSummary);
  const [isPending, startTransition] = useTransition();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'submissions'>('overview');

  const handleUnlockFeedback = () => {
    setFeedbackError(null);
    startTransition(async () => {
      const res = await unlockBatchFeedbackAction(batchId);
      if (res.success && res.data) {
        setStatus(res.data);
        setShowConfirmModal(false);
      } else {
        setFeedbackError(res.error || 'Failed to unlock feedback.');
        setShowConfirmModal(false);
      }
    });
  };

  const getStatusBadge = () => {
    switch (status.status) {
      case 'unlocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Unlock className="w-3.5 h-3.5" />
            Feedback Open
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Lock className="w-3.5 h-3.5" />
            Feedback Locked
          </span>
        );
      case 'not_available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            Training In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status.status.replace('_', ' ').toUpperCase()}
          </span>
        );
    }
  };

  const submissionPercentage = status.total_students > 0
    ? Math.round((status.submissions_count / status.total_students) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Feedback Error Notice */}
      {feedbackError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800">
            <p className="font-semibold">Feedback Action Notice</p>
            <p className="mt-0.5">{feedbackError}</p>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Post-Training Feedback Management
              </h2>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Feedback collection is required for student certificate issuance. Ratings do not impact eligibility.
            </p>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center gap-3">
            {canUnlock && status.status === 'locked' && (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-xs tracking-tight transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4 text-[#FCAF0A]" />
                )}
                <span>Unlock Student Feedback</span>
              </button>
            )}

            {status.status === 'unlocked' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Live for Enrolled Students</span>
              </div>
            )}

            {status.status === 'not_available' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Available after cohort completion</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Enrolled Students
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {status.total_students}
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Submissions Received
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">
                {status.submissions_count}
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                ({submissionPercentage}%)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Pending Feedback
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">
                {status.pending_count}
              </span>
              <span className="text-xs text-slate-400">students</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Average Rating
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0A3A7A]">
                {summary ? summary.average_rating.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-slate-500">/ 10</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 ml-auto" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Cohort Submission Progress</span>
            <span>{status.submissions_count} of {status.total_students} completed</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${submissionPercentage}%` }}
            />
          </div>
        </div>

        {/* Audit Attribution */}
        {status.unlocked_at && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              <strong>Unlocked by:</strong> {status.unlocked_by_name || 'Staff'}{' '}
              <span className="text-slate-400">({status.unlocked_by_role || 'administrator'})</span>
            </span>
            <span>•</span>
            <span>
              <strong>Unlocked on:</strong>{' '}
              {new Date(status.unlocked_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Analytics & Submissions Section */}
      {summary && summary.submitted_count > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView('overview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'overview'
                    ? 'bg-[#0A3A7A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Score Distribution
              </button>
              <button
                type="button"
                onClick={() => setActiveView('submissions')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'submissions'
                    ? 'bg-[#0A3A7A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Written Reviews ({summary.submissions.length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Feedback Mandatory for Certificates</span>
            </div>
          </div>

          {/* View 1: Score Distribution */}
          {activeView === 'overview' && (
            <div className="p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0A3A7A]" />
                Rating Distribution (1 to 10 Stars)
              </h3>

              <div className="space-y-2">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((ratingVal) => {
                  const count = summary.rating_distribution[ratingVal] || 0;
                  const pct = summary.submitted_count > 0
                    ? Math.round((count / summary.submitted_count) * 100)
                    : 0;

                  return (
                    <div key={ratingVal} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                        {ratingVal} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </span>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-medium text-slate-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View 2: Student Reviews List */}
          {activeView === 'submissions' && (
            <div className="divide-y divide-slate-100">
              {summary.submissions.map((sub) => (
                <div key={sub.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {sub.student_name || 'Enrolled Student'}
                        </span>
                        {sub.student_roll && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-mono font-medium">
                            {sub.student_roll}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        Submitted on{' '}
                        {new Date(sub.submitted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Star Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{sub.rating} / 10</span>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 mt-3 whitespace-pre-wrap">
                    {sub.comments}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Unlock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Unlock Student Feedback?
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                You are about to unlock post-training feedback for <strong>{status.batch_code}</strong> ({status.program_name}).
              </p>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-800 mt-3 space-y-1">
                <p>• Eligible enrolled students will gain immediate access to submit ratings & comments.</p>
                <p>• Feedback submission is mandatory for students to unlock their completion certificates.</p>
                <p>• Ratings are qualitative and do not affect certificate eligibility.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlockFeedback}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Unlocking...</span>
                  </>
                ) : (
                  <span>Confirm & Unlock Feedback</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

