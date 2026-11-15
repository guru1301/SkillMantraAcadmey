'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  User,
  LogOut,
  ChevronDown,
  Building2,
  Layers,
  GraduationCap,
  ShieldCheck,
  LayoutDashboard,
  ExternalLink,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

interface AdminAvatarDropdownProps {
  adminName: string;
  email: string;
  className?: string;
}

export default function AdminAvatarDropdown({
  adminName,
  email,
  className = '',
}: AdminAvatarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'SA'
    );
  };

  const initials = getInitials(adminName);

  // Close on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* High-End Executive Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Admin account menu"
        className="flex items-center gap-3 h-12 px-2.5 sm:px-3 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs focus-visible:outline-[#0A3A7A] cursor-pointer group"
      >
        {/* Monogram with deep navy gradient, gold text, and verified status indicator */}
        <div className="relative">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#062F68] via-[#0A3A7A] to-[#0B4EA2] text-[#FCAF0A] font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-white">
            {initials}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs"
            title="Super Administrator (Active)"
            aria-hidden="true"
          />
        </div>

        {/* Name & Role info (hidden on small mobile, visible from sm) */}
        <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-slate-900 max-w-[150px] truncate tracking-tight group-hover:text-[#0A3A7A] transition-colors">
              {adminName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-[#0A3A7A] border border-blue-200/60">
              Super Admin
            </span>
          </div>
        </div>

        {/* Subtle Chevron with rotation on open */}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0A3A7A]' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Flyout Menu Container */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right focus:outline-none"
        >
          {/* Header Card inside Dropdown */}
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#062F68] via-[#0A3A7A] to-[#0B4EA2] text-[#FCAF0A] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-900 truncate tracking-tight">
                    {adminName}
                  </p>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Super Administrator
                </span>
              </div>
            </div>
          </div>

          {/* Quick Jump Links */}
          <div className="py-2 border-b border-slate-100">
            <div className="px-4 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Control Center
            </div>
            <Link
              href="/admin/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:text-[#0A3A7A] hover:bg-slate-50 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Platform Dashboard</span>
            </Link>
            <Link
              href="/admin/colleges"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:text-[#0A3A7A] hover:bg-slate-50 transition-colors"
            >
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Partner Colleges</span>
            </Link>
            <Link
              href="/admin/batches"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-700 hover:text-[#0A3A7A] hover:bg-slate-50 transition-colors"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Training Batches</span>
            </Link>
            <Link
              href="/portal"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-700 hover:text-[#0A3A7A] hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span>College Portal View</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                Switch
              </span>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="p-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isPending ? 'Signing out...' : 'Sign Out of Control Center'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

