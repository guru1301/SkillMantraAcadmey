import React from 'react';
import Skeleton from '@/components/student/Skeleton';

export default function StudentLoading() {
  return (
    <div className="space-y-6 max-w-[1100px] mx-auto animate-pulse">
      {/* 1. Greeting line */}
      <div className="space-y-1.5 pb-2">
        <Skeleton variant="text" className="h-6 w-56" />
        <Skeleton variant="text" className="h-4 w-72" />
      </div>

      {/* 2. Attendance Card Skeleton */}
      <div className="border border-[#E4E8EF] rounded-[10px] bg-white p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E8EF]">
          <div className="space-y-2">
            <Skeleton variant="text" className="h-4 w-28" />
            <Skeleton variant="text" className="h-12 w-32" />
            <Skeleton variant="text" className="h-4 w-44" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" className="h-4 w-32" />
            <Skeleton variant="text" className="h-4 w-48" />
          </div>
        </div>

        {/* 3. Class History Table Skeleton */}
        <div className="space-y-3 pt-2">
          <Skeleton variant="text" className="h-5 w-32" />
          <div className="space-y-2 pt-2">
            <Skeleton variant="text" className="h-8 w-full" />
            <Skeleton variant="text" className="h-8 w-full" />
            <Skeleton variant="text" className="h-8 w-full" />
            <Skeleton variant="text" className="h-8 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
