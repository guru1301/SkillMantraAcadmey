import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  variant?: 'inline' | 'card';
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  variant = 'card',
  className = '',
}: EmptyStateProps) {
  if (variant === 'inline') {
    return (
      <div className={`py-4 text-sm text-[#667085] ${className}`}>
        {description || title}
        {actionText && actionHref && (
          <Link
            href={actionHref}
            className="ml-2 font-medium text-[#0A3A7A] hover:underline"
          >
            {actionText} →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 text-center flex flex-col items-center justify-center shadow-2xs ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3 border border-slate-200/60">
          <Icon className="w-6 h-6 text-slate-400" />
        </div>
      )}
      {title && (
        <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-1">
          {title}
        </h3>
      )}
      <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
        {description}
      </p>
      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-[#0A3A7A] text-white hover:bg-[#062F68] transition-colors shadow-2xs"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
