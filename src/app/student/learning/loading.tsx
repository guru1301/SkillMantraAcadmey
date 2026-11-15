import React from 'react';
import Skeleton from '@/components/student/Skeleton';

export default function LearningLoading() {
  return (
    <div className="space-y-6 max-w-[1100px] mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-1.5 pb-2">
        <Skeleton variant="text" className="h-6 w-36" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E4E8EF] pb-2 flex gap-4">
        <Skeleton variant="text" className="h-8 w-24" />
        <Skeleton variant="text" className="h-8 w-24" />
        <Skeleton variant="text" className="h-8 w-24" />
      </div>

      {/* Main Content Area */}
      <div className="border border-[#E4E8EF] rounded-[10px] bg-white p-6 space-y-4">
        <Skeleton variant="text" className="h-5 w-48" />
        <div className="space-y-3 pt-2">
          <Skeleton variant="text" className="h-12 w-full" />
          <Skeleton variant="text" className="h-12 w-full" />
          <Skeleton variant="text" className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
