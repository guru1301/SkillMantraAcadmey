'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, LayoutDashboard } from 'lucide-react';

export default function TrainerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Trainer Portal Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center mb-4 shadow-2xs">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
        Unable to Load Trainer Records
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed mb-6">
        We encountered a temporary connection issue while retrieving your assigned batches and attendance data.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#0A3A7A] text-white hover:bg-[#062F68] transition-colors shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>

        <Link
          href="/trainer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Trainer Hub</span>
        </Link>
      </div>
    </div>
  );
}
