import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getStudentQuizData } from '@/lib/db/studentPortal';
import FullScreenExamRoom from '@/components/student/FullScreenExamRoom';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Proctored Examination Terminal | SkillThinker',
  description: 'Online timed anti-cheat evaluation and quiz assessment.',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{
    assessmentId: string;
  }>;
}

export default async function StudentExamRoomPage({ params }: PageProps) {
  const session = await getSession();

  if (!session || (session.role !== 'student' && session.role !== 'super_admin')) {
    redirect('/login');
  }

  const { assessmentId } = await params;
  const quizData = await getStudentQuizData(assessmentId, session.id);

  if (!quizData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Assessment Not Accessible</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This assessment could not be found, or you are not enrolled in the cohort assigned to this examination.
            </p>
          </div>
          <Link
            href="/student/tests"
            className="w-full py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Tests & Assignments</span>
          </Link>
        </div>
      </div>
    );
  }

  return <FullScreenExamRoom quizData={quizData} />;
}
