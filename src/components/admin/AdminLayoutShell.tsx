'use client';

import React, { useState, useEffect, Suspense } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminProgressBar from './AdminProgressBar';
import AdminCommandPalette from './AdminCommandPalette';
import { AdminToastProvider } from './AdminToast';

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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcut for Command Palette (⌘K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-slate-900 selection:bg-[#0A3A7A]/15 selection:text-[#0A3A7A]">
        <Suspense fallback={null}>
          <AdminProgressBar />
        </Suspense>

        {/* Global Command Palette (⌘K) */}
        <AdminCommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />

        {/* Sidebar (Desktop 240px Fixed & Mobile Drawer) */}
        <AdminSidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="md:pl-[240px] flex-1 flex flex-col min-w-0">
          {/* Top Header matching Student and Trainer standard */}
          <AdminHeader
            adminName={adminName}
            adminEmail={adminEmail}
            onOpenMobileMenu={() => setMobileSidebarOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          />

          {/* Page Content Body */}
          <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </AdminToastProvider>
  );
}
