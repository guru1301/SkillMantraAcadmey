import React from 'react';
import Skeleton from '@/components/student/Skeleton';

export default function CertificatesLoading() {
  return (
    <div className="space-y-6 max-w-[1100px] mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton variant="text" className="h-6 w-44" />
        <Skeleton variant="text" className="h-4 w-72" />
      </div>

      {/* Checklist Card */}
      <div className="border border-[#E4E8EF] rounded-[10px] bg-white p-6 space-y-4">
        <Skeleton variant="text" className="h-4 w-32" />
        <div className="space-y-3 pt-2">
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
        </div>
        <div className="pt-4">
          <Skeleton variant="button" className="w-48" />
        </div>
      </div>
    </div>
  );
}
