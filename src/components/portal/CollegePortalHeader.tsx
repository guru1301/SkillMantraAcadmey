'use client';

import React, { useTransition } from 'react';
import { Menu, LogOut, Building2, ShieldCheck } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

interface CollegePortalHeaderProps {
  coordinatorName: string;
  coordinatorEmail: string;
  collegeName: string;
  onOpenMobileMenu: () => void;
}

export default function CollegePortalHeader({
  coordinatorName,
  coordinatorEmail,
  collegeName,
  onOpenMobileMenu,
}: CollegePortalHeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const initials = coordinatorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'CP';

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Institutional Portal
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 truncate max-w-sm">
            Partner: <span className="font-semibold text-slate-700">{collegeName}</span>
          </p>
        </div>
      </div>

      {/* Right: User Profile & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Card */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#0A3A7A] text-[#FCAF0A] font-extrabold text-xs flex items-center justify-center shadow-xs border border-blue-600/30">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-bold text-slate-900 leading-tight truncate max-w-[160px]">
              {coordinatorName}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
              College Partner
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          title="Sign out of portal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
