'use client';

import React, { useState } from 'react';
import { MessageSquareHeart, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import StudentFeedbackModal from './StudentFeedbackModal';

export interface PendingFeedbackItemProps {
  batch_id: string;
  batch_code: string;
  program_name: string;
  college_name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  unlocked_at: string | null;
}

interface StudentFeedbackBannerProps {
  pendingFeedbacks: PendingFeedbackItemProps[];
}

export default function StudentFeedbackBanner({ pendingFeedbacks }: StudentFeedbackBannerProps) {
  const [activeItem, setActiveItem] = useState<PendingFeedbackItemProps | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !pendingFeedbacks || pendingFeedbacks.length === 0) {
    return null;
  }

  const primaryItem = pendingFeedbacks[0];

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-orange-400/10 border border-amber-300/80 p-5 sm:p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquareHeart className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Certificate Action Required
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {primaryItem.batch_code}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Share Your Training Experience for {primaryItem.program_name}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Post-training feedback is unlocked. Submitting feedback is mandatory to access your verified course certificate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveItem(primaryItem)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs tracking-tight transition-all shadow-xs cursor-pointer"
            >
              <span>Give Feedback</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {activeItem && (
        <StudentFeedbackModal
          batchId={activeItem.batch_id}
          batchCode={activeItem.batch_code}
          programName={activeItem.program_name}
          collegeName={activeItem.college_name}
          isOpen={true}
          onClose={() => setActiveItem(null)}
          onSuccess={() => {
            setDismissed(true);
            setActiveItem(null);
          }}
        />
      )}
    </>
  );
}

