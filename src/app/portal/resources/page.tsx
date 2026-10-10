import React from 'react';
import { redirect } from 'next/navigation';
import { FolderDown, ExternalLink, BookOpen } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getCollegePortalData } from '@/lib/db/collegePortal';
import { query } from '@/lib/db';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default async function CollegePortalResourcesPage() {
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

  const { resources, college } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/portal' },
          { label: 'Curriculum Resources' },
        ]}
      />

      <PageHeader
        title="Curriculum &amp; Training Materials"
        description={`Shared lecture decks, datasets, and syllabus materials for batches at ${college.name}`}
      />

      {resources.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No training resources uploaded yet for your batches.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {resources.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs hover:border-blue-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">{r.name}</h3>
                  <span className="inline-block mt-1 text-[11px] font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Cohort: {r.batch_code}
                  </span>
                </div>

                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-bold transition shadow-xs"
                >
                  <span>Open Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {r.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {r.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
