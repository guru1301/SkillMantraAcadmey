'use client';

import React, { useState, useTransition } from 'react';
import { 
  Star, 
  X, 
  MessageSquareHeart, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Award
} from 'lucide-react';
import { submitStudentFeedbackAction } from '@/app/actions/feedback';

interface StudentFeedbackModalProps {
  batchId: string;
  batchCode: string;
  programName: string;
  collegeName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: '1/10 - Unsatisfactory',
  2: '2/10 - Needs Improvement',
  3: '3/10 - Below Average',
  4: '4/10 - Fair',
  5: '5/10 - Average',
  6: '6/10 - Satisfactory',
  7: '7/10 - Good',
  8: '8/10 - Very Good',
  9: '9/10 - Excellent',
  10: '10/10 - Outstanding',
};

export default function StudentFeedbackModal({
  batchId,
  batchCode,
  programName,
  collegeName,
  isOpen,
  onClose,
  onSuccess,
}: StudentFeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comments, setComments] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const trimmedComments = comments.trim();
  const isValidLength = trimmedComments.length >= 10 && trimmedComments.length <= 2000;
  const isFormValid = rating >= 1 && rating <= 10 && isValidLength;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating < 1 || rating > 10) {
      setError('Please select an overall rating from 1 to 10 stars.');
      return;
    }

    if (trimmedComments.length < 10) {
      setError('Feedback comments must be at least 10 non-whitespace characters.');
      return;
    }

    if (trimmedComments.length > 2000) {
      setError('Feedback comments cannot exceed 2000 characters.');
      return;
    }

    startTransition(async () => {
      const res = await submitStudentFeedbackAction(batchId, {
        rating,
        comments: trimmedComments,
      });

      if (res.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Failed to submit feedback. Please try again.');
      }
    });
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0A3A7A] via-[#0B4EA2] to-[#FCAF0A]" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center ring-8 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                Thank You for Your Feedback!
              </h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your review has been securely recorded. Post-training feedback requirement is now satisfied on your certificate checklist.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-sm transition-colors cursor-pointer shadow-sm"
              >
                Close & View Certificate Checklist
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Certificate Requirement</span>
              </div>
              <h2 className="text-2xl font-bold text-[#062F68] tracking-tight">
                Share Your Training Experience
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Your feedback helps us improve future training programs.
              </p>
              <div className="mt-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {programName} • <span className="font-mono text-slate-700">{batchCode}</span> • {collegeName}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Question 1: Rating (1-10 Stars) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Overall Training Rating <span className="text-rose-500">*</span>
                </label>
                {activeRating > 0 && (
                  <span className="text-xs font-bold text-[#0A3A7A] transition-all">
                    {RATING_DESCRIPTIONS[activeRating]}
                  </span>
                )}
              </div>

              {/* 10 Star Buttons */}
              <div className="flex items-center justify-between py-2 px-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starVal) => {
                  const isFilled = starVal <= activeRating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                      className="p-1 rounded-md transition-transform hover:scale-125 focus:outline-hidden cursor-pointer"
                      title={RATING_DESCRIPTIONS[starVal]}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-slate-200 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400">
                Select a rating between 1 (Unsatisfactory) and 10 (Outstanding).
              </p>
            </div>

            {/* Question 2: Written Comments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Written Comments <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-xs font-semibold ${
                    trimmedComments.length > 2000
                      ? 'text-rose-600'
                      : trimmedComments.length >= 10
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                >
                  {trimmedComments.length} / 2,000 (min 10)
                </span>
              </div>

              <textarea
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your thoughts on the trainer, curriculum content, practical exercises, and overall learning experience..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0A3A7A] focus:border-transparent transition-all resize-none"
              />

              <p className="text-[11px] text-slate-400 leading-normal">
                Your feedback will be shared with the academic program committee and training staff to elevate educational quality.
              </p>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isFormValid || isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs tracking-tight transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Post-Training Feedback</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

