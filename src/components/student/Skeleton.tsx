import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'button' | 'circle' | 'stat';
}

export default function Skeleton({
  className = '',
  variant = 'card',
}: SkeletonProps) {
  const base = 'animate-pulse bg-slate-100/90';

  if (variant === 'text') {
    return <div className={`${base} h-4 rounded-md ${className}`} />;
  }

  if (variant === 'button') {
    return <div className={`${base} h-10 rounded-lg ${className}`} />;
  }

  if (variant === 'circle') {
    return <div className={`${base} rounded-full shrink-0 ${className}`} />;
  }

  if (variant === 'stat') {
    return (
      <div className={`border border-[#E4E8EF] rounded-[10px] bg-white p-5 space-y-2 ${className}`}>
        <div className={`${base} h-3.5 w-24 rounded`} />
        <div className={`${base} h-8 w-16 rounded`} />
        <div className={`${base} h-3 w-32 rounded`} />
      </div>
    );
  }

  return (
    <div className={`border border-[#E4E8EF] rounded-[10px] bg-white p-6 ${base} ${className}`} />
  );
}
