import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon | React.ReactNode;
  statusBadge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'neutral';
  };
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  statusBadge,
}: StatCardProps) {
  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const isComponentIcon = typeof icon === 'function';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-[#0A3A7A]">
          {isComponentIcon
            ? React.createElement(icon as LucideIcon, { className: 'w-3.5 h-3.5' })
            : (icon as React.ReactNode)}
        </div>
      </div>

      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
        {statusBadge && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
              badgeStyles[statusBadge.variant]
            }`}
          >
            {statusBadge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
