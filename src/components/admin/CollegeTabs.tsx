'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Layers, GraduationCap, Users, BarChart3 } from 'lucide-react';

interface CollegeTabsProps {
  collegeId: string;
  activeTab?: string;
}

export default function CollegeTabs({ collegeId, activeTab }: CollegeTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      href: `/admin/colleges/${collegeId}`,
      icon: LayoutDashboard,
      active:
        activeTab === 'overview' ||
        pathname === `/admin/colleges/${collegeId}`,
    },
    {
      id: 'programs',
      name: 'Programs',
      href: `/admin/colleges/${collegeId}/programs`,
      icon: BookOpen,
      active:
        activeTab === 'programs' ||
        pathname.startsWith(`/admin/colleges/${collegeId}/programs`),
    },
    {
      id: 'batches',
      name: 'Batches',
      href: `/admin/colleges/${collegeId}/batches`,
      icon: Layers,
      active:
        activeTab === 'batches' ||
        pathname.startsWith(`/admin/colleges/${collegeId}/batches`),
    },
    {
      id: 'students',
      name: 'Students',
      href: `/admin/colleges/${collegeId}/students`,
      icon: GraduationCap,
      active:
        activeTab === 'students' ||
        pathname.startsWith(`/admin/colleges/${collegeId}/students`),
    },
    {
      id: 'trainers',
      name: 'Trainers',
      href: `/admin/colleges/${collegeId}/trainers`,
      icon: Users,
      active:
        activeTab === 'trainers' ||
        pathname.startsWith(`/admin/colleges/${collegeId}/trainers`),
    },
    {
      id: 'reports',
      name: 'Reports',
      href: `/admin/colleges/${collegeId}/reports`,
      icon: BarChart3,
      active:
        activeTab === 'reports' ||
        pathname.startsWith(`/admin/colleges/${collegeId}/reports`),
    },
  ];

  return (
    <div className="border-b border-slate-200 mb-6 overflow-x-auto">
      <nav className="flex space-x-1 sm:space-x-2 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs tracking-tight transition-all ${
                tab.active
                  ? 'border-[#0A3A7A] text-[#0A3A7A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.active ? 'text-[#0A3A7A]' : 'text-slate-400'}`} />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
