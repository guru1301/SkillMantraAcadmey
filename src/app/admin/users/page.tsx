import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getAdminUsersAction } from '@/app/actions/adminUsers';
import { getColleges } from '@/lib/db/colleges';
import PageHeader from '@/components/admin/PageHeader';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import AdminUsersClient from '@/components/admin/AdminUsersClient';

export const metadata: Metadata = {
  title: 'Administrative Users | SkillThinker Admin',
  description: 'Manage platform administrators, college portal admins, credentials, and access statuses.',
};

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    redirect('/login');
  }

  const [users, colleges] = await Promise.all([
    getAdminUsersAction(),
    getColleges({ status: 'active' }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'User Accounts' },
        ]}
      />

      <PageHeader
        title="Administrative & Institutional Users"
        description="Provision and manage platform Super Administrators and College Portal Administrators across partner institutions."
      />

      <AdminUsersClient
        initialUsers={users}
        colleges={colleges.map((c) => ({ id: c.id, name: c.name }))}
        currentUserId={session.id}
      />
    </div>
  );
}
