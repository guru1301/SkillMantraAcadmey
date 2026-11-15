'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Users,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  ExternalLink,
  LogOut,
  X,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function AdminSidebar({
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      isActive: (p: string) => p === '/admin/dashboard' || p === '/admin',
    },
    {
      name: 'Colleges',
      href: '/admin/colleges',
      icon: Building2,
      isActive: (p: string) => p.startsWith('/admin/colleges'),
    },
    {
      name: 'Batches',
      href: '/admin/batches',
      icon: Layers,
      isActive: (p: string) => p.startsWith('/admin/batches'),
    },
    {
      name: 'Trainers',
      href: '/admin/trainers',
      icon: Users,
      isActive: (p: string) => p.startsWith('/admin/trainers'),
    },
    {
      name: 'Students',
      href: '/admin/students',
      icon: GraduationCap,
      isActive: (p: string) => p.startsWith('/admin/students'),
    },
    {
      name: 'Programs',
      href: '/admin/programs',
      icon: BookOpen,
      isActive: (p: string) => p.startsWith('/admin/programs'),
    },
    {
      name: 'User Accounts',
      href: '/admin/users',
      icon: ShieldCheck,
      isActive: (p: string) => p.startsWith('/admin/users'),
    },
  ];

  const sidebarBody = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. Header: SkillThinker Logo Lockup */}
      <div className="h-18 px-5 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
        <Link href="/admin/dashboard" onClick={onCloseMobile} className="flex items-center gap-3 min-w-0 group">
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors">
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
              Super Admin
            </span>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Core Navigation Items */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Control Center
        </div>

        {navItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
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

        {/* Secondary: Switch to College Partner Portal View */}
        <div className="pt-4 mt-4 border-t border-slate-100">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Portals
          </div>
          <Link
            href="/portal"
            onClick={onCloseMobile}
            className="flex items-center justify-between h-10 px-3.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>College Portal</span>
            </div>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
              View
            </span>
          </Link>
        </div>
      </nav>

      {/* 3. Footer: Dignified Sign Out */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 h-10 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 bg-white transition cursor-pointer disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isPending ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (240px wide, matching Student & Trainer portals) */}
      <aside
        className="hidden md:flex fixed inset-y-0 left-0 w-[240px] bg-white border-r border-slate-200/90 z-40 flex-col"
        aria-label="Super Admin Navigation"
      >
        {sidebarBody}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-[260px] w-full bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarBody}
          </div>
        </div>
      )}
    </>
  );
}
