'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  GraduationCap,
  Users,
  FolderDown,
  Building2,
  X,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface CollegePortalSidebarProps {
  collegeName: string;
  collegeCity?: string | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PORTAL_NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/portal', icon: LayoutDashboard },
  { name: 'Batches', href: '/portal/batches', icon: Layers },
  { name: 'Students', href: '/portal/students', icon: GraduationCap },
  { name: 'Trainers', href: '/portal/trainers', icon: Users },
  { name: 'Resources', href: '/portal/resources', icon: FolderDown },
];

export default function CollegePortalSidebar({
  collegeName,
  collegeCity,
  mobileOpen,
  onCloseMobile,
}: CollegePortalSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#061E42] text-white select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-blue-900/60 bg-[#041633]">
        <Link href="/portal" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0A3A7A] border border-blue-600/50 flex items-center justify-center font-black text-sm text-[#FCAF0A] shadow-inner">
            SM
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider text-white block leading-tight">
              SKILL MATRA
            </span>
            <span className="text-[10px] text-[#FCAF0A] font-bold tracking-wide block">
              College Portal
            </span>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* College Identity Box */}
      <div className="px-4 py-3.5 bg-blue-950/60 border-b border-blue-900/40">
        <div className="flex items-center gap-2 text-[#FCAF0A] text-[10px] font-bold uppercase tracking-wider mb-1">
          <Building2 className="w-3.5 h-3.5" />
          <span>Partner Institution</span>
        </div>
        <div className="font-bold text-xs text-white leading-tight truncate" title={collegeName}>
          {collegeName}
        </div>
        {collegeCity && (
          <div className="text-[11px] text-blue-300/80 mt-0.5">
            📍 {collegeCity}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-blue-400/80">
          Institution Navigation
        </div>

        {PORTAL_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isCurrent =
            pathname === item.href ||
            (item.href !== '/portal' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isCurrent
                  ? 'bg-[#0A3A7A] text-[#FCAF0A] shadow-inner'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-[#FCAF0A]' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#FCAF0A]" />}
            </Link>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-blue-900/60 bg-[#041633]/80">
        <div className="flex items-center gap-2 text-[11px] text-blue-300/90 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">Verified College Partner</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          Skill Matra Enterprise Network
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        />
      )}

      {/* Mobile Sliding Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-200 ease-in-out shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
