'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, Building2, Search } from 'lucide-react';
import AdminAvatarDropdown from './AdminAvatarDropdown';

interface AdminHeaderProps {
  adminName: string;
  adminEmail: string;
  onOpenMobileMenu: () => void;
  onOpenCommandPalette?: () => void;
}

export default function AdminHeader({
  adminName,
  adminEmail,
  onOpenMobileMenu,
  onOpenCommandPalette,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-18 px-5 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Brand Lockup */}
      <div className="flex items-center gap-4 sm:gap-5 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* SkillThinker Brand Lockup */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
            <Image
              src="/images/brand/logo.png"
              alt="SkillThinker"
              width={30}
              height={30}
              priority
              className="object-contain w-full h-full"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
              SkillThinker
            </span>
            <span className="text-[11px] text-slate-500 font-medium leading-tight">
              Super Admin Control
            </span>
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" aria-hidden="true" />

        {/* Central Oversight Badge */}
        <div className="hidden sm:flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A3A7A] shrink-0">
            <Building2 className="w-4 h-4 text-[#0A3A7A]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-900 truncate leading-tight">
              Central Academic Oversight
            </span>
            <span className="text-[11px] text-emerald-700 font-medium leading-tight flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Institutional Administration Active
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick Search Button & Executive Avatar Dropdown */}
      <div className="flex items-center gap-3 shrink-0">
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300 text-slate-500 text-xs transition cursor-pointer shadow-2xs group"
            title="Search batches, colleges, trainers (⌘K or Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            <span className="hidden lg:inline text-slate-500">Quick search...</span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              <span>⌘</span>K
            </kbd>
          </button>
        )}

        {/* User Profile Executive Dropdown */}
        <AdminAvatarDropdown adminName={adminName} email={adminEmail} />
      </div>
    </header>
  );
}
