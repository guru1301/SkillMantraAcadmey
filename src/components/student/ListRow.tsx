import React from 'react';
import Link from 'next/link';

interface ListRowProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function ListRow({
  icon,
  title,
  subtitle,
  meta,
  action,
  href,
  onClick,
  className = '',
}: ListRowProps) {
  const content = (
    <div className={`flex items-center justify-between gap-4 py-3 px-1 border-b border-[#E4E8EF] last:border-b-0 hover:bg-slate-50/60 rounded-md transition-colors ${className}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && <div className="shrink-0 text-slate-400">{icon}</div>}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[#162033] truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-[13px] text-[#667085] truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 text-right">
        {meta && (
          <div className="text-[13px] text-[#667085] hidden sm:block">
            {meta}
          </div>
        )}
        {action && <div>{action}</div>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group focus-visible:outline-[#0A3A7A]">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left group focus-visible:outline-[#0A3A7A] cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return content;
}
