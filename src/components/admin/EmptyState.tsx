import React from 'react';
import Link from 'next/link';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  action,
}: EmptyStateProps) {
  const isComponentIcon = typeof icon === 'function';

  const finalActionLabel = action?.label || actionLabel;
  const finalActionHref = action?.href || actionHref;
  const finalActionClick = action?.onClick || onAction;

  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 sm:p-14 text-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-[#0A3A7A] flex items-center justify-center mx-auto mb-4">
        {isComponentIcon
          ? React.createElement(icon as LucideIcon, { className: 'w-6 h-6' })
          : (icon as React.ReactNode)}
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed mb-6 max-w-sm mx-auto">
        {description}
      </p>

      {finalActionLabel && (
        finalActionHref ? (
          <Link
            href={finalActionHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{finalActionLabel}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={finalActionClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{finalActionLabel}</span>
          </button>
        )
      )}
    </div>
  );
}
