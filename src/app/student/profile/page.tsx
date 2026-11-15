import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ShieldCheck, User, Building2 } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getStudentProfile, getStudentBatches } from '@/lib/db/studentPortal';
import Card from '@/components/student/Card';
import EmptyState from '@/components/student/EmptyState';

export const metadata: Metadata = {
  title: 'Profile | SkillThinker',
  description: 'Your verified student account and institutional details.',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'ST';
}

export default async function StudentProfilePage() {
  const session = await getSession();

  if (!session || session.role !== 'student') {
    redirect('/login');
  }

  const [profile, batches] = await Promise.all([
    getStudentProfile(session.id),
    getStudentBatches(session.id),
  ]);

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <EmptyState
          variant="inline"
          description="Could not load your student identity."
        />
      </div>
    );
  }

  const primaryBatch = batches[0] || null;

  const fields = [
    { label: 'Name', value: profile.full_name },
    { label: 'Roll number', value: profile.roll_number },
    { label: 'Department', value: profile.department || 'Not specified' },
    { label: 'Year', value: profile.year_or_semester || 'Not specified' },
    { label: 'Email', value: profile.email || 'Not provided' },
    { label: 'Phone', value: profile.phone || 'Not provided' },
    { label: 'College', value: profile.college_name },
    { 
      label: 'Enrolled course', 
      value: primaryBatch ? `${primaryBatch.program_name} (${primaryBatch.code})` : 'Not enrolled' 
    },
  ];

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#062F68] tracking-tight">
          Profile
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
          Your verified institutional student credentials and registration details.
        </p>
      </div>

      {/* Identity Card */}
      <Card className="relative overflow-hidden p-8 sm:p-10 bg-white border border-slate-200/90 shadow-[0_12px_40px_-8px_rgba(10,58,122,0.08)]">
        {/* Decorative Top Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0A3A7A] via-[#0B4EA2] to-[#FCAF0A]" />

        {/* User Identity Header */}
        <div className="flex items-center gap-5 pb-8 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#062F68] to-[#0A3A7A] text-[#FCAF0A] font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-white">
            {getInitials(profile.full_name)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {profile.full_name}
              </h2>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-blue-50 text-[#0A3A7A] border border-blue-200/70">
                {profile.roll_number}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {profile.college_name}
            </p>
          </div>
        </div>

        {/* Two-Column Details Grid with Large Tiles */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-8">
          {fields.map((field) => (
            <div key={field.label} className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/70 shadow-2xs">
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{field.label}</dt>
              <dd className="text-base font-bold text-slate-900 mt-1.5">{field.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
