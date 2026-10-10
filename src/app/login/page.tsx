import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Admin Login | Skill Matra',
  description: 'Admin authentication portal for Skill Matra Training Management Platform.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    if (session.role === 'super_admin') {
      redirect('/admin/dashboard');
    }
    if (session.role === 'college_admin') {
      redirect('/portal');
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <LoginForm />
    </div>
  );
}
