import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ShieldCheck, User, LogOut, Sparkles, Building2 } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getTrainerProfile, getTrainerAssignedBatches } from '@/lib/db/trainerPortal';
import { logoutAction } from '@/app/actions/auth';
import Card from '@/components/trainer/Card';
import EmptyState from '@/components/trainer/EmptyState';

export const metadata: Metadata = {
  title: 'Faculty Profile | SkillThinker Trainer Portal',
  description: 'Your verified faculty credentials, domain competencies, and institutional assignments.',
};

function getInitials(name: string) {
  return name
    .replace(/^Dr\.\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'TR';
}

export default async function TrainerProfilePage() {
  const session = await getSession();

  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    redirect('/login');
  }

  const [profile, batches] = await Promise.all([
    getTrainerProfile(session.id),
    getTrainerAssignedBatches(session.id),
  ]);

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          title="Profile Not Found"
          description="Could not load your faculty profile record."
          actionText="Back to Cohorts"
          actionHref="/trainer"
        />
      </div>
    );
  }

  const trainerName = profile.full_name || session.fullName || 'Trainer';
  const email = profile.email || session.email;
  const phone = profile.phone || 'Not provided';
  const skills = profile.skills ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const fields = [
    { label: 'Faculty Name', value: trainerName },
    { label: 'Email Address', value: email },
    { label: 'Phone Contact', value: phone },
    { label: 'Assigned Cohorts', value: `${batches.length} active college ${batches.length === 1 ? 'batch' : 'batches'}` },
    { label: 'Account Standing', value: 'Active & Verified Faculty' },
    { label: 'Faculty Designation', value: 'Corporate & Institutional Instructor' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Faculty Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
          Your verified SkillThinker instructional credentials and assigned domain competencies.
        </p>
      </div>

      {/* Identity Card */}
      <Card className="relative overflow-hidden p-6 sm:p-8 bg-white border border-slate-200/90 shadow-[0_12px_40px_-8px_rgba(10,58,122,0.06)]">
        {/* Decorative Top Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0A3A7A] via-[#0B4EA2] to-[#FCAF0A]" />

        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#062F68] to-[#0A3A7A] text-[#FCAF0A] font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-white">
              {getInitials(trainerName)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Certified Faculty</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {session.id.slice(0, 8)}...</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {trainerName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                SkillThinker Corporate &amp; Institutional Training Division
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Details Grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
          {fields.map((field) => (
            <div key={field.label} className="p-4 sm:p-5 rounded-xl bg-slate-50/80 border border-slate-200/70">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{field.label}</dt>
              <dd className="text-sm sm:text-base font-semibold text-slate-900 mt-1">{field.value}</dd>
            </div>
          ))}
        </dl>

        {/* Skills & Instruction Domains */}
        {skills.length > 0 && (
          <div className="pt-6 mt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Domain Competencies &amp; Instructional Specializations
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/60 text-[#0A3A7A] text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sign Out Action */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            End active session on this device
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
