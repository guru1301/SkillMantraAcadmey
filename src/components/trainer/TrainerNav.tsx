'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

interface TrainerNavProps {
  assignedBatchesCount?: number;
}

export default function TrainerNav({ assignedBatchesCount = 0 }: TrainerNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/trainer',
      icon: LayoutDashboard,
      isActive: (p: string) => p === '/trainer',
    },
    {
      name: 'Batches',
      href: '/trainer/batches',
      icon: Layers,
      isActive: (p: string) => p.startsWith('/trainer/batches'),
    },
    {
      name: 'Attendance',
      href: '/trainer/attendance',
      icon: CheckCircle2,
      isActive: (p: string) => p.startsWith('/trainer/attendance'),
    },
    {
      name: 'Tests & Quizzes',
      href: '/trainer/tests',
      icon: FileCheck,
      isActive: (p: string) => p.startsWith('/trainer/tests'),
    },
  ];

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DESKTOP SIDEBAR (240px wide)                           */}
      {/* ========================================================= */}
      <aside 
        className="hidden md:flex fixed inset-y-0 left-0 w-[240px] bg-white border-r border-slate-200/90 z-40 flex-col"
        aria-label="Trainer Navigation"
      >
        {/* Clean Sidebar Header */}
        <div className="h-18 px-5 flex items-center border-b border-slate-100 bg-white">
          <Link href="/trainer" className="flex items-center gap-3 min-w-0 group">
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
            <div className="min-w-0">
              <span className="block font-bold text-sm text-slate-900 tracking-tight leading-tight">
                SkillThinker
              </span>
              <span className="block text-xs text-slate-500 font-medium leading-tight mt-0.5">
                Trainer Portal
              </span>
            </div>
          </Link>
        </div>

        {/* 4 Core Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Instruction Hub
          </div>
          {navItems.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 h-11 px-3.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#0A3A7A] text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-[#FCAF0A]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Faculty Status Tag at Sidebar Base */}
        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
            <div className="font-semibold text-slate-800 truncate">
              {assignedBatchesCount} Assigned {assignedBatchesCount === 1 ? 'Cohort' : 'Cohorts'}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Certified Faculty</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MOBILE FIXED BOTTOM TAB BAR (< md) - 4 Clean Tabs      */}
      {/* ========================================================= */}
      <nav 
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.4rem)]"
        aria-label="Mobile Trainer Navigation"
      >
        <div className="grid grid-cols-4 items-center justify-around">
          {navItems.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-h-[52px] ${
                  active
                    ? 'text-[#0A3A7A] font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110 text-[#0A3A7A]' : 'text-slate-400'}`} />
                <span className={`text-[11px] mt-1 tracking-tight ${active ? 'font-bold text-[#0A3A7A]' : 'font-medium text-slate-500'}`}>
                  {item.name}
                </span>
                {active && (
                  <span className="w-4 h-0.5 rounded-full bg-[#0A3A7A] mt-1" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
