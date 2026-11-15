'use client';

import React, { useState } from 'react';
import { MessageSquareHeart, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import StudentFeedbackModal from './StudentFeedbackModal';

interface CertificateFeedbackTriggerProps {
  batchId: string;
  batchCode: string;
  programName: string;
  collegeName: string;
  feedbackSubmitted: boolean;
  isUnlocked: boolean;
}

export default function CertificateFeedbackTrigger({
  batchId,
  batchCode,
  programName,
  collegeName,
  feedbackSubmitted,
  isUnlocked,
}: CertificateFeedbackTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(feedbackSubmitted);

  return (
    <>
      <div className="flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-sm shadow-2xs">
        <div className="flex items-center gap-4">
          {submitted ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <Circle className="w-6 h-6 text-slate-300 shrink-0" />
          )}
          <div>
            <span className="text-base font-bold text-slate-900 block">
              Post-training feedback
            </span>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">
              Mandatory course feedback submission required for verified credential generation.
            </span>
          </div>
        </div>

        <div className="text-right shrink-0 ml-4">
          {submitted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          ) : isUnlocked ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              <MessageSquareHeart className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Submit Feedback</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-xs font-semibold text-slate-400">
              Awaiting Instructor Unlock
            </span>
          )}
        </div>
      </div>

      <StudentFeedbackModal
        batchId={batchId}
        batchCode={batchCode}
        programName={programName}
        collegeName={collegeName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setSubmitted(true);
          setIsModalOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
}

