import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Layers,
  GraduationCap,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Crown,
  Mail,
  Phone,
  Building2,
} from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getCollegePortalData } from '@/lib/db/collegePortal';
import { query } from '@/lib/db';
import StatCard from '@/components/admin/StatCard';

export const dynamic = 'force-dynamic';

export default async function CollegePortalDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  let targetCollegeId = session.collegeId;

  if (!targetCollegeId && session.role === 'super_admin') {
    const defaultColleges = await query<{ id: string }>(
      `SELECT id FROM colleges WHERE status = 'active' ORDER BY created_at ASC LIMIT 1`
    );
    if (defaultColleges.length > 0) {
      targetCollegeId = defaultColleges[0].id;
    }
  }

  if (!targetCollegeId) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Institution Not Linked</h2>
        <p className="text-xs text-slate-500">
          Your account is not assigned to an active college.
        </p>
      </div>
    );
  }

  const portalData = await getCollegePortalData(targetCollegeId);

  if (!portalData) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Institution Inactive or Not Found</h2>
      </div>
    );
  }

  const { college, stats, batches, trainers, students } = portalData;

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* 1. Welcome Card (Matching Super Admin) */}
      <div className="bg-gradient-to-r from-[#062F68] via-[#0A3A7A] to-[#0B4EA2] rounded-2xl text-white p-6 sm:p-8 shadow-md border border-blue-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-48 h-48 bg-[#FCAF0A]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-[#FCAF0A] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Institutional Partner Workspace</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {college.name}
            </h2>
            <p className="text-sm text-blue-100 font-medium mt-1">
              Campus Skilling &amp; Cohort Management Portal
            </p>

            <p className="text-xs sm:text-sm text-blue-200/90 mt-2.5 max-w-2xl leading-relaxed">
              Logged in as <strong className="text-white">{session.fullName}</strong>.
              Monitor campus cohorts, track student rosters, and view certified trainers deployed to your institution.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/portal/students"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition backdrop-blur-xs"
            >
              <GraduationCap className="w-4 h-4 text-[#FCAF0A]" />
              <span>View Student Roster</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Institutional KPI Stat Cards (Matching Super Admin) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Institutional Training Metrics
          </h3>
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Institutional Link
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Campus Cohorts"
            value={stats.totalBatches}
            subtitle="Training cohorts"
            icon={<Layers className="w-5 h-5 text-blue-600" />}
          />
          <StatCard
            title="Enrolled Students"
            value={stats.totalStudents}
            subtitle="Students in training"
            icon={<GraduationCap className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            title="Campus Trainers"
            value={stats.totalTrainers}
            subtitle="Faculty & mentors"
            icon={<Users className="w-5 h-5 text-amber-600" />}
          />
          <StatCard
            title="Curriculums"
            value={stats.totalPrograms}
            subtitle="Skill tracks active"
            icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
          />
        </div>
      </div>

      {/* 3. Main Split Section: Batches & Trainers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Running Cohorts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Active Cohort Batches
            </h3>
            <Link
              href="/portal/batches"
              className="text-xs font-bold text-[#0A3A7A] hover:underline flex items-center gap-1"
            >
              <span>View all batches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {batches.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                No cohort batches scheduled yet.
              </div>
            ) : (
              batches.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        {b.code}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{b.program_name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {b.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.start_date} to {b.end_date}</span>
                      </span>
                      <span>•</span>
                      <span>{b.enrolled_count} / {b.target_strength} Enrolled</span>
                    </div>

                    {/* Progress */}
                    <div className="w-full sm:max-w-xs pt-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((b.enrolled_count / (b.target_strength || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      {b.trainers_count} Trainer(s)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Campus Faculty & Trainers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Campus Trainers
            </h3>
            <Link
              href="/portal/trainers"
              className="text-xs font-bold text-[#0A3A7A] hover:underline flex items-center gap-1"
            >
              <span>View team</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 divide-y divide-slate-100 shadow-2xs">
            {trainers.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No trainers currently assigned.
              </div>
            ) : (
              trainers.map((t) => (
                <div key={t.id + t.batch_code} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A3A7A] font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                    {t.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 truncate">{t.full_name}</span>
                      {t.is_lead && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-300">
                          <Crown className="w-2.5 h-2.5 text-amber-600" />
                          <span>Lead</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{t.role || 'Faculty Trainer'}</p>
                    <p className="text-[10px] text-blue-700 font-semibold font-mono truncate">
                      Cohort: {t.batch_code}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
