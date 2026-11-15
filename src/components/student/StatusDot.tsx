import React from 'react';

export type StatusType =
  | 'present'
  | 'absent'
  | 'late'
  | 'excused'
  | 'unmarked'
  | 'completed'
  | 'in_progress'
  | 'upcoming'
  | 'scheduled'
  | 'done'
  | 'next';

interface StatusDotProps {
  status: StatusType | string;
  label?: string;
  size?: 'sm' | 'md';
  variant?: 'pill' | 'dot';
  className?: string;
}

export default function StatusDot({
  status,
  label,
  size = 'md',
  variant = 'pill',
  className = '',
}: StatusDotProps) {
  const normalized = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  let dotColor = 'bg-slate-400';
  let pillClass = 'bg-slate-50 text-slate-700 border-slate-200/70';
  let defaultLabel = status;

  switch (normalized) {
    case 'present':
    case 'completed':
    case 'done':
      dotColor = 'bg-emerald-500';
      pillClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/70';
      defaultLabel = normalized === 'present' ? 'Present' : 'Completed';
      break;

    case 'late':
      dotColor = 'bg-amber-500';
      pillClass = 'bg-amber-50 text-amber-800 border-amber-200/70';
      defaultLabel = 'Late';
      break;

    case 'absent':
      dotColor = 'bg-rose-500';
      pillClass = 'bg-rose-50 text-rose-800 border-rose-200/70';
      defaultLabel = 'Absent';
      break;

    case 'excused':
      dotColor = 'bg-blue-500';
      pillClass = 'bg-blue-50 text-blue-800 border-blue-200/70';
      defaultLabel = 'Excused';
      break;

    case 'next':
    case 'in_progress':
      dotColor = 'bg-amber-500';
      pillClass = 'bg-amber-50 text-amber-800 border-amber-200/70';
      defaultLabel = normalized === 'next' ? 'Up Next' : 'In Progress';
      break;

    case 'scheduled':
    case 'upcoming':
    case 'unmarked':
    default:
      dotColor = 'bg-slate-400';
      pillClass = 'bg-slate-50 text-slate-600 border-slate-200/70';
      defaultLabel = normalized === 'unmarked' ? 'Unmarked' : 'Upcoming';
      break;
  }

  const displayText = label || defaultLabel;
  const textSize = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1.5 ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium ${className}`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <span>{displayText}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-2xs ${textSize} ${pillClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{displayText}</span>
    </span>
  );
}
