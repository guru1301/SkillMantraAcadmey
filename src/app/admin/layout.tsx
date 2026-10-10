import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import AdminLayoutShell from '@/components/admin/AdminLayoutShell';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Skill Matra',
  description: 'Skill Matra Training Management Platform - Administrator Portal',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session verification (defense-in-depth)
  const session = await getSession();

  if (!session || session.role !== 'super_admin') {
    redirect('/login');
  }

  return (
    <AdminLayoutShell
      adminName={session.fullName || 'Skill Matra Admin'}
      adminEmail={session.email}
    >
      {children}
    </AdminLayoutShell>
  );
}
