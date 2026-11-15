'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  Building2, 
  ShieldCheck
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

interface UserAvatarDropdownProps {
  studentName: string;
  rollNumber: string;
  collegeName?: string;
  email?: string;
  department?: string;
  className?: string;
}

export default function UserAvatarDropdown({
  studentName,
  rollNumber,
  collegeName,
  email,
  department,
  className = '',
}: UserAvatarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ST';
  };

  const initials = getInitials(studentName);

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

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* High-End Executive Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className="flex items-center gap-3 h-12 px-2.5 sm:px-3 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs hover:shadow-sm focus-visible:outline-[#0A3A7A] cursor-pointer group"
      >
        {/* Avatar with deep gradient, gold monogram, and verified status indicator */}
        <div className="relative">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#062F68] via-[#0A3A7A] to-[#0B4EA2] text-[#FCAF0A] font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white">
            {initials}
          </div>
          <span 
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" 
            title="Active verified student"
            aria-hidden="true" 
          />
        </div>

        {/* Name & Academic info (hidden on small mobile, visible from sm) */}
        <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-slate-900 max-w-[150px] truncate tracking-tight group-hover:text-[#0A3A7A] transition-colors">
              {studentName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500">
            <span className="font-mono font-semibold text-slate-600 bg-slate-100 px-1 rounded">
              {rollNumber}
            </span>
            {department && (
              <>
                <span className="text-slate-300">•</span>
                <span className="truncate max-w-[80px]">{department}</span>
              </>
            )}
          </div>
        </div>

        {/* Animated Chevron indicator */}
        <div className="w-6 h-6 rounded-lg bg-slate-50 group-hover:bg-slate-100/90 text-slate-400 group-hover:text-slate-600 flex items-center justify-center transition-colors">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0A3A7A]' : ''}`} />
        </div>
      </button>

      {/* Solid Opaque Popover Dropdown */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-1.5rem))] sm:w-92 rounded-2xl bg-white border border-slate-200 shadow-[0_25px_60px_-15px_rgba(10,58,122,0.22),0_10px_25px_-5px_rgba(0,0,0,0.08)] p-3 z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Executive Student ID Credential Card */}
          <div className="rounded-xl p-4 bg-gradient-to-br from-[#062F68] via-[#0A3A7A] to-[#0B4EA2] text-white shadow-sm relative overflow-hidden mb-2">
            {/* Shield Watermark Icon in background */}
            <ShieldCheck 
              className="absolute -bottom-3 -right-3 w-24 h-24 text-white/10 pointer-events-none" 
              aria-hidden="true" 
            />

            <div className="flex items-start gap-3 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-[#FCAF0A] font-black text-base flex items-center justify-center shrink-0 shadow-inner ring-2 ring-white/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white truncate tracking-tight">
                    {studentName}
                  </h3>
                  <span title="Verified Credential" className="shrink-0 inline-flex">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </span>
                </div>
                
                {email && (
                  <p className="text-[11px] text-blue-100/80 truncate mt-0.5 font-medium" title={email}>
                    {email}
                  </p>
                )}

                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-sm border border-white/20 text-[10px] font-mono font-bold text-white shadow-2xs">
                    {rollNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#FCAF0A] text-[#062F68] text-[10px] font-black uppercase tracking-wider shadow-2xs">
                    Student
                  </span>
                  {department && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/90 text-[10px] font-semibold">
                      {department}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {collegeName && (
              <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center gap-2 text-[11px] text-blue-100/90 font-medium truncate relative z-10">
                <Building2 className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                <span className="truncate" title={collegeName}>{collegeName}</span>
              </div>
            )}
          </div>

          {/* Profile Action Link */}
          <div className="py-1">
            <Link
              href="/student/profile"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#0A3A7A] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <span className="block text-slate-900 font-bold group-hover:text-[#0A3A7A] transition-colors leading-tight">
                    View Complete Profile
                  </span>
                  <span className="block text-[11px] text-slate-500 font-normal mt-0.5 truncate">
                    Contact details & academic records
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="border-t border-slate-100 pt-2 mt-1">
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span>Sign Out of Account</span>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-rose-400 font-mono">Esc</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
