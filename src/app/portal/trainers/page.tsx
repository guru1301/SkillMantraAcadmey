import React from 'react';
import { redirect } from 'next/navigation';
import { Users, Crown, Mail, Phone, Calendar } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getCollegePortalData } from '@/lib/db/collegePortal';
import { query } from '@/lib/db';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default async function CollegePortalTrainersPage() {
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

  const { trainers, college } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/portal' },
          { label: 'Campus Trainers' },
        ]}
      />

      <PageHeader
        title="Deployed Campus Trainers"
        description={`Certified faculty and lab mentors assigned to conduct cohorts at ${college.name}`}
      />

      {trainers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No faculty trainers currently deployed.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trainers.map((t) => (
            <div
              key={t.id + t.batch_code}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs hover:border-blue-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0A3A7A] font-black text-sm flex items-center justify-center border border-blue-200">
                    {t.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{t.full_name}</h3>
                    <p className="text-xs text-slate-500">{t.role || 'Faculty Trainer'}</p>
                  </div>
                </div>

                {t.is_lead && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>Lead</span>
                  </span>
                )}
              </div>

              {t.skills && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {t.skills.split(',').map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]"
                    >
                      {sk.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                {t.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`mailto:${t.email}`} className="text-blue-700 hover:underline">
                      {t.email}
                    </a>
                  </div>
                )}
                {t.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                )}
                <div className="text-[11px] text-blue-900 font-bold bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60 mt-1">
                  Active Cohort: {t.batch_code}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
