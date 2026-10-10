'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Loader2, CheckCircle2 } from 'lucide-react';

export interface SecureDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  impactDetails?: string[];
  requiredText?: string;
  confirmButtonText?: string;
}

export default function SecureDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  impactDetails = [],
  requiredText = 'DELETE',
  confirmButtonText = 'Permanently Delete',
}: SecureDeleteModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationInput('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = confirmationInput.trim() === requiredText.trim();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatched || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-rose-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="secure-delete-title"
      >
        {/* Header Banner */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="secure-delete-title"
              className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
            >
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-5 sm:p-6 space-y-4">
          {/* Warning Impact Box */}
          {impactDetails.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900">
              <span className="font-semibold block mb-1.5 text-amber-950">
                ⚠️ Consequences of this action:
              </span>
              <ul className="list-disc list-inside space-y-1 text-amber-800">
                {impactDetails.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Type-to-Confirm Challenge Box */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-700">
              To prevent accidental deletion, please type{' '}
              <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 select-all">
                {requiredText}
              </span>{' '}
              to confirm:
            </label>

            <div className="relative">
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Type "${requiredText}"`}
                disabled={isSubmitting}
                autoFocus
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium font-mono tracking-wide transition-all outline-hidden ${
                  isMatched
                    ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900 focus:ring-2 focus:ring-emerald-200'
                    : 'border-slate-300 bg-white text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                }`}
              />
              {isMatched && (
                <div className="absolute right-3 top-2.5 text-emerald-600 flex items-center gap-1 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Matched</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatched || isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>{confirmButtonText}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
