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
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-[#0A3A7A]">
          {isComponentIcon
            ? React.createElement(icon as LucideIcon, { className: 'w-4 h-4' })
            : (icon as React.ReactNode)}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
        {statusBadge && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              badgeStyles[statusBadge.variant]
            }`}
          >
            {statusBadge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
