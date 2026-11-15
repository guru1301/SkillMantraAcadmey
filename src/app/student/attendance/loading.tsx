import React from 'react';
import Skeleton from '@/components/student/Skeleton';

export default function AttendanceLoading() {
  return (
    <div className="space-y-6 max-w-[1100px] mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton variant="text" className="h-6 w-36" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>

      {/* Stat Block Card */}
      <div className="border border-[#E4E8EF] rounded-[10px] bg-white p-6 space-y-3">
        <Skeleton variant="text" className="h-4 w-28" />
        <Skeleton variant="text" className="h-8 w-20" />
        <Skeleton variant="text" className="h-4 w-44" />
      </div>

      {/* Attendance History List */}
      <div className="border border-[#E4E8EF] rounded-[10px] bg-white p-6 space-y-3">
        <Skeleton variant="text" className="h-4 w-32" />
        <div className="space-y-2 pt-2">
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
          <Skeleton variant="text" className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
