'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  HelpCircle,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { StudentAssessmentItem } from '@/lib/db/studentPortal';
import Card from './Card';
import StatusDot from './StatusDot';
import EmptyState from './EmptyState';

interface TestsClientProps {
  assessments: StudentAssessmentItem[];
}

export default function TestsClient({ assessments }: TestsClientProps) {
  const router = useRouter();
  const [loadingTestId, setLoadingTestId] = useState<string | null>(null);
  const [noticeModal, setNoticeModal] = useState<{
    title: string;
    message: string;
    type?: 'warning' | 'info';
  } | null>(null);

  const now = new Date();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Flexible schedule';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleLaunchQuiz = (item: StudentAssessmentItem) => {
    const isCompleted =
      item.student_status === 'evaluated' ||
      item.student_status === 'submitted' ||
      item.student_status === 'pending_review';

    if (!isCompleted) {
      if (item.start_time && new Date(item.start_time) > now) {
        setNoticeModal({
          title: 'Quiz scheduled for later',
          message: `This quiz is scheduled to open on ${formatDate(item.start_time)}. Please return during the exam window to begin.`,
          type: 'info',
        });
        return;
      }

      if (item.deadline && new Date(item.deadline) < now) {
        setNoticeModal({
          title: 'Submission deadline passed',
          message: `The deadline for this test was ${formatDate(item.deadline)}. The submission window is closed.`,
          type: 'warning',
        });
        return;
      }
    }

    if (item.questions_count === 0 && !isCompleted) {
      setNoticeModal({
        title: 'Questions being prepared',
        message: 'Your instructor has created this assessment entry, but questions are currently being loaded. Please check back shortly.',
        type: 'info',
      });
      return;
    }

    setLoadingTestId(item.id);
    router.push(`/student/tests/${item.id}`);
  };

  if (!assessments || assessments.length === 0) {
    return (
      <EmptyState
        variant="inline"
        description="No tests scheduled yet. You’ll see them here when your trainer schedules one."
      />
    );
  }

  return (
    <>
      <Card className="p-0 overflow-hidden bg-white border border-slate-200/90 shadow-[0_12px_40px_-8px_rgba(10,58,122,0.08)]">
        <div className="divide-y divide-slate-100">
          {assessments.map((item) => {
            const isCompleted =
              item.student_status === 'evaluated' ||
              item.student_status === 'submitted' ||
              item.student_status === 'pending_review';
            const isLoading = loadingTestId === item.id;

            let statusNode: React.ReactNode;
            let actionLabel = 'Start test';
            let actionButtonClass = 'bg-[#0A3A7A] text-white hover:bg-[#062F68] shadow-sm';

            if (item.student_status === 'evaluated') {
              actionLabel = 'View results';
              actionButtonClass = 'border border-slate-200/90 text-slate-800 hover:bg-slate-50';
              statusNode = (
                <div className="flex items-center gap-2.5">
                  <StatusDot status="completed" label="Evaluated" size="md" />
                  <span className="text-sm font-bold text-slate-900 [font-variant-numeric:tabular-nums]">
                    {item.score !== null ? `${item.score}/${item.total_marks}` : 'Completed'}
                  </span>
                </div>
              );
            } else if (item.student_status === 'pending_review') {
              actionLabel = 'View status';
              actionButtonClass = 'border border-amber-200 text-amber-900 bg-amber-50/70 hover:bg-amber-100/70';
              statusNode = (
                <StatusDot status="late" label="Pending review" size="md" />
              );
            } else if (item.student_status === 'submitted') {
              actionLabel = 'View submission';
              actionButtonClass = 'border border-slate-200/90 text-slate-800 hover:bg-slate-50';
              statusNode = (
                <StatusDot status="in_progress" label="Submitted" size="md" />
              );
            } else if (item.student_status === 'in_progress') {
              actionLabel = 'Continue test';
              actionButtonClass = 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm';
              statusNode = (
                <StatusDot status="late" label="In progress" size="md" />
              );
            } else {
              actionLabel = 'Start test';
              actionButtonClass = 'bg-[#0A3A7A] text-white hover:bg-[#062F68] shadow-sm';
              statusNode = (
                <StatusDot status="upcoming" label="To do" size="md" />
              );
            }

            return (
              <div
                key={item.id}
                className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:bg-slate-50/70 transition-all"
              >
                {/* Left: Title & Meta */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h3 className="text-lg font-bold text-[#062F68] tracking-tight">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 font-medium">
                    <span>{item.questions_count} questions</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{item.duration_minutes} mins</span>
                    </span>
                    {item.deadline && (
                      <>
                        <span>•</span>
                        <span>Due {formatDate(item.deadline)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Status and Big Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                  <div>{statusNode}</div>
                  <button
                    type="button"
                    onClick={() => handleLaunchQuiz(item)}
                    disabled={isLoading}
                    className={`inline-flex items-center justify-center h-12 px-6 rounded-xl text-sm font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50 active:scale-[0.99] ${actionButtonClass}`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      actionLabel
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal Dialog for info/warnings */}
      {noticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 max-w-md w-full p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                {noticeModal.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-[#0A3A7A]" />
                )}
                <h4 className="text-base font-bold text-slate-900">
                  {noticeModal.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setNoticeModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {noticeModal.message}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setNoticeModal(null)}
                className="h-11 px-6 rounded-xl text-sm font-bold bg-[#0A3A7A] text-white hover:bg-[#062F68] transition-all cursor-pointer active:scale-[0.99]"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
