import React from 'react';

interface StatBlockProps {
  label: string;
  value: string | number;
  subtext?: React.ReactNode;
  valueClassName?: string;
  className?: string;
}

export default function StatBlock({
  label,
  value,
  subtext,
  valueClassName = 'text-[#162033]',
  className = '',
}: StatBlockProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <span className="text-sm font-medium text-[#667085] block">
        {label}
      </span>
      <div className={`text-[32px] font-semibold tracking-tight leading-tight [font-variant-numeric:tabular-nums] ${valueClassName}`}>
        {value}
      </div>
      {subtext && (
        <div className="text-[13px] text-[#667085] pt-0.5">
          {subtext}
        </div>
      )}
    </div>
  );
}
