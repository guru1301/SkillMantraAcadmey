import React from 'react';
import Link from 'next/link';
import Breadcrumbs, { BreadcrumbItem } from './Breadcrumbs';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  action?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  };
  statusBadge?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  description,
  breadcrumbs,
  actions,
  action,
  statusBadge,
}: PageHeaderProps) {
  const displaySubtitle = subtitle || description;

  return (
    <div className="mb-6">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            {statusBadge}
          </div>
          {displaySubtitle && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
              {displaySubtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {actions}
          {action && (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white text-xs font-semibold shadow-sm hover:shadow transition"
            >
              {action.icon}
              <span>{action.label}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
