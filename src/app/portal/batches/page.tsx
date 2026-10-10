import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Layers, Calendar, Users, GraduationCap, ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getCollegePortalData } from '@/lib/db/collegePortal';
import { query } from '@/lib/db';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default async function CollegePortalBatchesPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  let targetCollegeId = session.collegeId;
  if (!targetCollegeId && session.role === 'super_admin') {
    const cols = await query<{ id: string }>(
      `SELECT id FROM colleges WHERE status = 'active' ORDER BY created_at ASC LIMIT 1`
    );
    if (cols.length > 0) targetCollegeId = cols[0].id;
  }

  if (!targetCollegeId) redirect('/portal');
  const data = await getCollegePortalData(targetCollegeId);
  if (!data) redirect('/portal');

  const { batches, college } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/portal' },
          { label: 'Campus Batches' },
        ]}
      />

      <PageHeader
        title="Campus Cohort Batches"
        description={`Active and scheduled training batches for ${college.name}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {batches.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs hover:border-blue-300 transition-all space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                {b.code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                {b.status}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">{b.program_name}</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{b.start_date} to {b.end_date}</span>
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Roster Capacity</span>
                <span>{b.enrolled_count} / {b.target_strength} Enrolled</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((b.enrolled_count / (b.target_strength || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{b.trainers_count} Assigned Trainer(s)</span>
              <Link
                href="/portal/students"
                className="text-blue-700 font-bold hover:underline"
              >
                View Roster →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
