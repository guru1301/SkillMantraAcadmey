import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getCollegePortalData } from '@/lib/db/collegePortal';
import { query } from '@/lib/db';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import CollegePortalStudentsClient from '@/components/portal/CollegePortalStudentsClient';

export const dynamic = 'force-dynamic';

export default async function CollegePortalStudentsPage() {
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

  const { students, college } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/portal' },
          { label: 'Enrolled Students' },
        ]}
      />

      <PageHeader
        title="Enrolled Student Roster"
        description={`All verified students active across training batches at ${college.name}`}
      />

      <CollegePortalStudentsClient
        students={students}
        collegeName={college.name}
      />
    </div>
  );
}
