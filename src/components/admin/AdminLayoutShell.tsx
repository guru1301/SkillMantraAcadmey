'use client';

import React, { useState, Suspense } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminProgressBar from './AdminProgressBar';

interface AdminLayoutShellProps {
  adminName: string;
  adminEmail: string;
  children: React.ReactNode;
}

export default function AdminLayoutShell({
  adminName,
  adminEmail,
  children,
}: AdminLayoutShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Suspense fallback={null}>
        <AdminProgressBar />
      </Suspense>
      {/* Sidebar (Desktop Fixed & Mobile Drawer) */}
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <AdminHeader
          adminName={adminName}
          adminEmail={adminEmail}
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
