'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Layers,
  GraduationCap,
  Users,
  HelpCircle,
  FileCheck2,
  BarChart3,
  ScrollText,
  Settings,
  X,
  ShieldCheck,
} from 'lucide-react';

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, active: true },
  { name: 'Colleges', href: '/admin/colleges', icon: Building2, active: true },
  { name: 'Programs', href: '/admin/programs', icon: BookOpen, active: true },
  { name: 'Batches', href: '/admin/batches', icon: Layers, active: true },
  { name: 'Trainers', href: '/admin/trainers', icon: Users, active: true },
  { name: 'Students', href: '#', icon: GraduationCap, active: false, badge: 'Soon' },
  { name: 'Question Bank', href: '#', icon: HelpCircle, active: false, badge: 'Soon' },
  { name: 'Assessments', href: '#', icon: FileCheck2, active: false, badge: 'Soon' },
  { name: 'Reports', href: '#', icon: BarChart3, active: false, badge: 'Soon' },
  { name: 'Audit Logs', href: '#', icon: ScrollText, active: false, badge: 'Soon' },
  { name: 'Settings', href: '#', icon: Settings, active: false, badge: 'Soon' },
];

export default function AdminSidebar({
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#061E42] text-white select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-blue-900/60 bg-[#041633]">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0A3A7A] border border-blue-600/50 flex items-center justify-center font-black text-sm text-[#FCAF0A] shadow-inner">
            SM
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider text-white block leading-tight">
              SKILL MATRA
            </span>
            <span className="text-[10px] text-blue-300/80 font-medium tracking-wide block">
              Admin Portal
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

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-blue-400/80">
          Main Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isCurrent =
            item.active &&
            (pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)));

          if (item.active) {
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
                <div className="w-1.5 h-1.5 rounded-full bg-[#FCAF0A]" />
              </Link>
            );
          }

          // Disabled / Coming Soon Links
          return (
            <div
              key={item.name}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400/70 cursor-not-allowed opacity-75"
              title={`${item.name} module is coming soon`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-slate-500" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-blue-900/60 bg-[#041633]/80">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#FCAF0A] shrink-0" />
          <span className="font-semibold text-[11px] text-slate-200 truncate">
            Super Admin Access
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Neon DB v1.0 • Vertical Slice
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 h-screen fixed inset-y-0 left-0 z-30 shadow-lg border-r border-blue-950">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80%] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
