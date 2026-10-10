import React from 'react';

export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'planned'
  | 'completed'
  | 'cancelled'
  | 'scheduled'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase();

  const config: Record<string, { label: string; styles: string; dot: string }> = {
    active: {
      label: 'Active',
      styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    inactive: {
      label: 'Inactive',
      styles: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    planned: {
      label: 'Planned',
      styles: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    scheduled: {
      label: 'Scheduled',
      styles: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
    },
    completed: {
      label: 'Completed',
      styles: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-500',
    },
    cancelled: {
      label: 'Cancelled',
      styles: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
  };

  const item = config[normalized] || {
    label: status,
    styles: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      <span>{item.label}</span>
    </span>
  );
}
