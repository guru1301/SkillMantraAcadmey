'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Building2, ShieldCheck, GraduationCap } from 'lucide-react';
import StudentNav from './StudentNav';
import UserAvatarDropdown from './UserAvatarDropdown';

interface StudentShellProps {
  studentName: string;
  rollNumber: string;
  collegeName: string;
  email?: string;
  department?: string;
  children: React.ReactNode;
}

export default function StudentShell({
  studentName,
  rollNumber,
  collegeName,
  email,
  department,
  children,
}: StudentShellProps) {
  const pathname = usePathname();
  const isFullScreenExam = Boolean(pathname?.startsWith('/student/tests/') && pathname !== '/student/tests');

  if (isFullScreenExam) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-slate-900 selection:bg-[#0A3A7A]/15 selection:text-[#0A3A7A]">
      {/* 240px Desktop Sidebar + Mobile Bottom Bar */}
      <StudentNav collegeName={collegeName} />

      {/* Main Content Area */}
      <div className="md:pl-[240px] flex-1 flex flex-col min-w-0">
        {/* Top Header Bar: Dignified Co-Branding Lockup */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-18 px-5 sm:px-8 flex items-center justify-between">
          {/* Left: SkillThinker & College Partner Lockup */}
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* SkillThinker Brand */}
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
                  Student Portal
                </span>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" aria-hidden="true" />

            {/* College Partner */}
            <div className="hidden sm:flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0A3A7A] shrink-0">
                <Building2 className="w-4 h-4 text-[#0A3A7A]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-900 truncate max-w-xs md:max-w-md lg:max-w-lg leading-tight" title={collegeName}>
                  {collegeName}
                </span>
                <span className="text-[11px] text-emerald-700 font-medium leading-tight flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Accredited Campus Partner
                </span>
              </div>
            </div>
          </div>

          {/* Right: Clean User Profile Button */}
          <div className="flex items-center gap-3 shrink-0">
            <UserAvatarDropdown
              studentName={studentName}
              rollNumber={rollNumber}
              collegeName={collegeName}
              email={email}
              department={department}
            />
          </div>
        </header>

        {/* Content Body: Full Breadth with Natural Padding */}
        <main className="flex-1 w-full px-5 sm:px-8 lg:px-10 py-6 sm:py-8 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-14">
          {children}
        </main>
      </div>
    </div>
  );
}
