import React from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  Database,
  Activity,
  Building2,
  BookOpen,
  Layers,
  GraduationCap,
  FileCheck2,
  HardDrive,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getAdminStats, getPlatformOverviewStats } from '@/lib/db';
import StatCard from '@/components/admin/StatCard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();
  const [stats, platformStats] = await Promise.all([
    getAdminStats(),
    getPlatformOverviewStats(),
  ]);

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* 1. Welcome Card */}
      <div className="bg-gradient-to-r from-[#062F68] via-[#0A3A7A] to-[#0B4EA2] rounded-2xl text-white p-6 sm:p-8 shadow-md border border-blue-900 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-48 h-48 bg-[#FCAF0A]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-[#FCAF0A] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
            <span>Admin Management Workspace</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Skill Matra Administration
          </h2>
          <p className="text-sm sm:text-base text-blue-100 font-medium mt-1">
            Institutional Partner &amp; Cohort Management Platform
          </p>

          <p className="text-xs sm:text-sm text-blue-200/90 mt-3 max-w-2xl leading-relaxed">
            Live administrative workspace connected to <strong className="text-white">Neon PostgreSQL</strong>.
            Manage institutions, curriculum programs, cohort batches, and training delivery assets.
          </p>
        </div>
      </div>

      {/* 2. Platform Core Management Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Management Modules
          </h3>
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                stats.dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {stats.dbConnected ? 'Neon Production DB' : 'Database Offline'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Partner Colleges */}
          <StatCard
            title="Partner Colleges"
            value={platformStats.totalColleges}
            subtitle="Registered institutions"
            icon={<Building2 className="w-5 h-5 text-blue-600" />}
          />

          {/* Curriculum Programs */}
          <StatCard
            title="Curriculum Programs"
            value={platformStats.totalPrograms}
            subtitle="Reusable offerings"
            icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
          />

          {/* Active Batches */}
          <StatCard
            title="Training Batches"
            value={platformStats.totalBatches}
            subtitle="Academic cohorts"
            icon={<Layers className="w-5 h-5 text-amber-600" />}
          />

          {/* Faculty Trainers */}
          <StatCard
            title="Faculty Trainers"
            value={platformStats.totalTrainers}
            subtitle="Certified instructors"
            icon={<Users className="w-5 h-5 text-teal-600" />}
          />

          {/* Batch Resources */}
          <StatCard
            title="Drive Resources"
            value={platformStats.totalResources}
            subtitle="Shared cloud links"
            icon={<HardDrive className="w-5 h-5 text-emerald-600" />}
          />
        </div>
      </div>

      {/* 3. Operational Quick Actions */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Institutional Workspaces
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct access to production college and batch workspace workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Colleges Action Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Module
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Colleges &amp; Institutions</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Add partner colleges, view individual college workspaces, configure key coordinators, and launch cohorts.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/admin/colleges/new"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add College</span>
              </Link>
              <Link
                href="/admin/colleges"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                <span>Manage ({platformStats.totalColleges})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Programs Action Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Module
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Curriculum Offerings</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Author reusable programs (Data Analytics, Full Stack, Aptitude, Python) deployable across colleges.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {platformStats.totalPrograms} in catalog
              </span>
              <Link
                href="/admin/programs"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                <span>Curriculum Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Batches Action Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Module
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Batch Workspaces</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage cohort timelines, compare target capacity vs enrollment, attach Google Drive resource repositories.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {platformStats.totalBatches} active batches
              </span>
              <Link
                href="/admin/batches"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900"
              >
                <span>Explore Batches</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Trainers Action Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Module
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Faculty &amp; Trainers</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Register technical instructors, manage domain expertise, and allocate Lead and Assistant Trainers to cohorts.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {platformStats.totalTrainers} instructors
              </span>
              <Link
                href="/admin/trainers"
                className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
              >
                <span>Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Upcoming Phase Modules */}
      <div className="pt-2">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Upcoming Modules Pipeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Underlying database relationships established. These modules will plug directly into the workspace in Phase 2 &amp; 3.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Students */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs opacity-80">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Phase 2 • Active
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Students Roster</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              CSV roster upload, capacity tracking, and student directories per cohort.
            </p>
          </div>

          {/* Daily Lecture & Session Logs */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs opacity-80">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                Phase 2
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Session Scheduling &amp; Attendance</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Daily lecture calendar, topic completion, and student attendance logs.
            </p>
          </div>

          {/* Question Bank & Assessments */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs opacity-80">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                Phase 3
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Assessments Engine</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Question bank, proctored coding exams, and placement scorecards.
            </p>
          </div>

          {/* Audit Logs */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs opacity-80">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                Phase 3
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Audit Logs &amp; Reports</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Comprehensive event logging, PDF summaries, and accreditation reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
