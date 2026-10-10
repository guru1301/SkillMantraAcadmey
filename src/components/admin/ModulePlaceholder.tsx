import React from 'react';
import Link from 'next/link';
import { Clock, ShieldAlert, ArrowLeft } from 'lucide-react';

interface ModulePlaceholderProps {
  moduleName: string;
  phase: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}

export default function ModulePlaceholder({
  moduleName,
  phase,
  description,
  backHref,
  backLabel = 'Go Back',
}: ModulePlaceholderProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto shadow-sm space-y-4 my-6">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
        <Clock className="w-7 h-7" />
      </div>
      <div>
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 mb-2">
          {phase}
        </span>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {moduleName} Module
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {backHref && (
        <div className="pt-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
