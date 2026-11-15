import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  height?: number; // in pixels
  colorClass?: string;
  className?: string;
  label?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  height = 8,
  colorClass = 'bg-[#0A3A7A]',
  className = '',
  label,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${percentage}% progress`}
      className={`w-full bg-[#E4E8EF] rounded-full overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${colorClass}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
