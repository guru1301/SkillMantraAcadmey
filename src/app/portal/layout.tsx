import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { query } from '@/lib/db';
import CollegePortalShell from '@/components/portal/CollegePortalShell';

export const metadata: Metadata = {
  title: 'Institutional College Portal | Skill Matra',
  description: 'Skill Matra Partner College Coordinator Portal',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CollegePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // If user is neither college_admin nor super_admin, block access
  if (session.role !== 'college_admin' && session.role !== 'super_admin') {
    redirect('/login');
  }

  let collegeName = session.collegeName || 'Institutional Partner';
  let collegeCity: string | null = null;

  if (session.collegeId) {
    const colRows = await query<{ name: string; city: string | null }>(
      `SELECT name, city FROM colleges WHERE id = $1 LIMIT 1`,
      [session.collegeId]
    );
    if (colRows.length > 0) {
      collegeName = colRows[0].name;
      collegeCity = colRows[0].city;
    }
  } else if (session.role === 'super_admin') {
    const defaultCols = await query<{ name: string; city: string | null }>(
      `SELECT name, city FROM colleges WHERE status = 'active' ORDER BY created_at ASC LIMIT 1`
    );
    if (defaultCols.length > 0) {
      collegeName = defaultCols[0].name;
      collegeCity = defaultCols[0].city;
    }
  }

  return (
    <CollegePortalShell
      coordinatorName={session.fullName}
      coordinatorEmail={session.email}
      collegeName={collegeName}
      collegeCity={collegeCity}
    >
      {children}
    </CollegePortalShell>
  );
}
