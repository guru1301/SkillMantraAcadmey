import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getStudentProfile } from '@/lib/db/studentPortal';
import StudentShell from '@/components/student/StudentShell';

export const metadata: Metadata = {
  title: 'Student Learning Portal | SkillThinker',
  description: 'Your personal learning space for institutional training, sessions, attendance, and study materials.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'student') {
    if (session.role === 'super_admin') {
      redirect('/admin/dashboard');
    }
    if (session.role === 'college_admin') {
      redirect('/portal');
    }
    redirect('/login');
  }

  // Fetch student profile for header and navigation
  const profile = await getStudentProfile(session.id);

  const studentName = profile?.full_name || session.fullName || 'Student';
  const rollNumber = profile?.roll_number || 'STU';
  const collegeName = profile?.college_name || session.collegeName || 'Institution';
  const email = profile?.email || session.email || '';
  const department = profile?.department || '';

  return (
    <StudentShell
      studentName={studentName}
      rollNumber={rollNumber}
      collegeName={collegeName}
      email={email}
      department={department}
    >
      {children}
    </StudentShell>
  );
}
