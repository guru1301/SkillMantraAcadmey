import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getCollegePortalData } from '@/lib/db/collegePortal';
import { getColleges } from '@/lib/db/colleges';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import CollegePortalStudentsClient from '@/components/portal/CollegePortalStudentsClient';

export const dynamic = 'force-dynamic';

export default async function CollegePortalStudentsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  let targetCollegeId = session.collegeId;
  if (!targetCollegeId && session.role === 'super_admin') {
    const cols = await getColleges({ status: 'active' });
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
        collegeId={college.id}
        batches={(data.batches || []).map((b: any) => ({
          id: b.id,
          code: b.code,
          program_name: b.program_name,
        }))}
      />
    </div>
  );
}
