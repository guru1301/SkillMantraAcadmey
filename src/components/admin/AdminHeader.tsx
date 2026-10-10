'use client';

import React, { useTransition } from 'react';
import { Menu, LogOut, Shield } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

interface AdminHeaderProps {
  adminName: string;
  adminEmail: string;
  onOpenMobileMenu: () => void;
}

export default function AdminHeader({
  adminName,
  adminEmail,
  onOpenMobileMenu,
}: AdminHeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Dashboard
          </h1>
          <p className="hidden sm:block text-xs text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{adminName}</span>
          </p>
        </div>
      </div>

      {/* Right: User Profile & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Card */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#0A3A7A] text-[#FCAF0A] font-bold text-xs flex items-center justify-center shadow-xs">
            SM
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-bold text-slate-900 leading-tight">
              {adminName}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
              <Shield className="w-3 h-3 text-emerald-600" />
              Super Admin
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          title="Sign out of admin session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isPending ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
}
