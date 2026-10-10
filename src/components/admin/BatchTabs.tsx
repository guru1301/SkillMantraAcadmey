'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  CheckSquare,
  FileCheck2,
  TrendingUp,
  FolderOpen,
  BarChart3,
} from 'lucide-react';

interface BatchTabsProps {
  batchId: string;
  activeTab?: string;
}

export default function BatchTabs({ batchId, activeTab }: BatchTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      href: `/admin/batches/${batchId}`,
      icon: LayoutDashboard,
      active: activeTab === 'overview' || pathname === `/admin/batches/${batchId}`,
    },
    {
      id: 'students',
      name: 'Students',
      href: `/admin/batches/${batchId}/students`,
      icon: GraduationCap,
      active: activeTab === 'students' || pathname.startsWith(`/admin/batches/${batchId}/students`),
    },
    {
      id: 'trainers',
      name: 'Trainers',
      href: `/admin/batches/${batchId}/trainers`,
      icon: Users,
      active: activeTab === 'trainers' || pathname.startsWith(`/admin/batches/${batchId}/trainers`),
    },
    {
      id: 'sessions',
      name: 'Sessions',
      href: `/admin/batches/${batchId}/sessions`,
      icon: Calendar,
      active: activeTab === 'sessions' || pathname.startsWith(`/admin/batches/${batchId}/sessions`),
    },
    {
      id: 'attendance',
      name: 'Attendance',
      href: `/admin/batches/${batchId}/attendance`,
      icon: CheckSquare,
      active: activeTab === 'attendance' || pathname.startsWith(`/admin/batches/${batchId}/attendance`),
    },
    {
      id: 'assessments',
      name: 'Assessments',
      href: `/admin/batches/${batchId}/assessments`,
      icon: FileCheck2,
      active: activeTab === 'assessments' || pathname.startsWith(`/admin/batches/${batchId}/assessments`),
    },
    {
      id: 'progress',
      name: 'Progress',
      href: `/admin/batches/${batchId}/progress`,
      icon: TrendingUp,
      active: activeTab === 'progress' || pathname.startsWith(`/admin/batches/${batchId}/progress`),
    },
    {
      id: 'resources',
      name: 'Resources',
      href: `/admin/batches/${batchId}/resources`,
      icon: FolderOpen,
      active: activeTab === 'resources' || pathname.startsWith(`/admin/batches/${batchId}/resources`),
    },
    {
      id: 'reports',
      name: 'Reports',
      href: `/admin/batches/${batchId}/reports`,
      icon: BarChart3,
      active: activeTab === 'reports' || pathname.startsWith(`/admin/batches/${batchId}/reports`),
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
