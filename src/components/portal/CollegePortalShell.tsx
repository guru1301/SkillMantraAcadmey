'use client';

import React, { useState, Suspense } from 'react';
import CollegePortalSidebar from './CollegePortalSidebar';
import CollegePortalHeader from './CollegePortalHeader';
import AdminProgressBar from '@/components/admin/AdminProgressBar';

interface CollegePortalShellProps {
  coordinatorName: string;
  coordinatorEmail: string;
  collegeName: string;
  collegeCity?: string | null;
  children: React.ReactNode;
}

export default function CollegePortalShell({
  coordinatorName,
  coordinatorEmail,
  collegeName,
  collegeCity,
  children,
}: CollegePortalShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Suspense fallback={null}>
        <AdminProgressBar />
      </Suspense>

      {/* Sidebar (Desktop Fixed & Mobile Drawer) */}
      <CollegePortalSidebar
        collegeName={collegeName}
        collegeCity={collegeCity}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <CollegePortalHeader
          coordinatorName={coordinatorName}
          coordinatorEmail={coordinatorEmail}
          collegeName={collegeName}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
