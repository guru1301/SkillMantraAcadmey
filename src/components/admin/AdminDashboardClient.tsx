'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Building2,
  Users,
  Plus,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { BatchWithDetails } from '@/lib/db/batches';
import DashboardBatchesClient from './DashboardBatchesClient';
import QuickCreateBatchModal from './QuickCreateBatchModal';
import ProgramModal from './ProgramModal';
import { useRouter } from 'next/navigation';

interface AdminDashboardClientProps {
  stats: {
    totalBatches: number;
    activeBatches: number;
    totalColleges: number;
    totalTrainers: number;
    totalStudents: number;
  };
  batches: BatchWithDetails[];
  colleges: Array<{ id: string; name: string; city: string | null }>;
  programs: Array<{ id: string; name: string; duration_days?: number }>;
}

export default function AdminDashboardClient({
  stats,
  batches,
  colleges,
  programs,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [createBatchOpen, setCreateBatchOpen] = useState(false);
  const [createProgramOpen, setCreateProgramOpen] = useState(false);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Header with VERY LARGE Primary & Secondary Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Current training batches, partner institutions, and faculty trainers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* PRIMARY BUTTON: Create Batch */}
          <button
            type="button"
            onClick={() => setCreateBatchOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FCAF0A]" />
            <span>Create Batch</span>
          </button>

          {/* SECONDARY BUTTON: Add College */}
          <Link
            href="/admin/colleges/new"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-blue-700" />
            <span>Add College</span>
          </Link>

          {/* SECONDARY BUTTON: Add Program */}
          <button
            type="button"
            onClick={() => setCreateProgramOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-indigo-700" />
            <span>Add Program</span>
          </button>
        </div>
      </div>

      {/* 2. Four Metric Cards: Colleges, Batches, Trainers, Students */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Partner Colleges */}
        <Link
          href="/admin/colleges"
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-900 transition">
              Colleges
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A3A7A] flex items-center justify-center shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats.totalColleges}
            </span>
            <span className="text-xs text-slate-500 font-medium">institutions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Partner colleges and academic campuses
          </p>
        </Link>

        {/* Card 2: Currently Active Batches */}
        <Link
          href="/admin/batches"
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-900 transition">
              Active Batches
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats.activeBatches}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              of {stats.totalBatches} total
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Currently running training cohorts
          </p>
        </Link>

        {/* Card 3: Trainers */}
        <Link
          href="/admin/trainers"
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-900 transition">
              Trainers
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats.totalTrainers}
            </span>
            <span className="text-xs text-slate-500 font-medium">instructors</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Certified technical faculty & mentors
          </p>
        </Link>

        {/* Card 4: Enrolled Students */}
        <Link
          href="/admin/students"
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-900 transition">
              Students
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-2xs">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">
              {stats.totalStudents}
            </span>
            <span className="text-xs text-slate-500 font-medium">learners</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Enrolled across all active cohorts
          </p>
        </Link>
      </div>

      {/* 3. Currently Opening & Active Batches Table */}
      <DashboardBatchesClient
        batches={batches}
        totalBatchesCount={stats.totalBatches}
      />

      {/* Modal 1: Quick Create Batch with dropdowns for Programs and Colleges */}
      <QuickCreateBatchModal
        isOpen={createBatchOpen}
        onClose={() => setCreateBatchOpen(false)}
        colleges={colleges}
        programs={programs}
      />

      {/* Modal 2: Create Program Modal */}
      <ProgramModal
        isOpen={createProgramOpen}
        onClose={() => setCreateProgramOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
