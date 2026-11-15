import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  meta,
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 ${className}`}>
      <div className="min-w-0">
        {meta && <div className="text-xs text-[#667085] mb-1">{meta}</div>}
        <h1 className="text-2xl font-semibold text-[#062F68] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#667085] mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
