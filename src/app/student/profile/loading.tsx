import React from 'react';
import Skeleton from '@/components/student/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="space-y-6 max-w-[1100px] mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton variant="text" className="h-6 w-32" />
        <Skeleton variant="text" className="h-4 w-60" />
      </div>

      {/* Two-column Key/Value List Card */}
      <div className="border border-[#E4E8EF] rounded-[10px] bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
