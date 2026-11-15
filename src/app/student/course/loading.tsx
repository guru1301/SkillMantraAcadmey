import React from 'react';
import Skeleton from '@/components/student/Skeleton';

export default function CourseLoading() {
  return (
    <div className="space-y-6 max-w-[1100px] mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton variant="text" className="h-6 w-36" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>

      {/* Course Card Skeleton */}
      <div className="border border-[#E4E8EF] rounded-[10px] bg-white p-6 sm:p-7 space-y-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-3 w-28" />
          <Skeleton variant="text" className="h-6 w-56" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E4E8EF]">
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
