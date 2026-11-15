import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getBatchById } from '@/lib/db/batches';
import { getBatchFeedbackStatus, getBatchFeedbackReport } from '@/lib/api/feedback';
import BatchFeedbackManager from '@/components/admin/BatchFeedbackManager';
import { ArrowLeft, MessageSquareHeart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TrainerBatchFeedbackPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== 'trainer' && session.role !== 'super_admin')) {
    redirect('/login');
  }

  const { batchId } = await params;
  const batch = await getBatchById(batchId);
  if (!batch) notFound();

  let statusData: any = null;
  let summaryData: any = null;

  try {
    statusData = await getBatchFeedbackStatus(batchId);
  } catch {
    statusData = {
      batch_id: batch.id,
      batch_code: batch.code,
      program_name: batch.program_name || 'Training Program',
      college_name: batch.college_name || 'Institution',
      college_id: batch.college_id,
      training_completed: batch.status === 'completed',
      status: batch.status === 'completed' ? 'locked' : 'not_available',
      is_unlocked: false,
      total_students: batch.actual_students_count || 0,
      submissions_count: 0,
      pending_count: batch.actual_students_count || 0,
      unlocked_by_user_id: null,
      unlocked_by_name: null,
      unlocked_by_role: null,
      unlocked_at: null,
    };
  }

  if (statusData?.is_unlocked || statusData?.submissions_count > 0) {
    try {
      summaryData = await getBatchFeedbackReport(batchId);
    } catch {
      summaryData = null;
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/trainer/batches"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assigned Batches</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Post-Training Student Feedback
            </h1>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
              {batch.code}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {batch.program_name} • {batch.college_name}
          </p>
        </div>
      </div>

      {/* Reusable Feedback Manager */}
      <BatchFeedbackManager
        batchId={batch.id}
        initialStatus={statusData}
        initialSummary={summaryData}
        userRole="trainer"
        canUnlock={true}
      />
    </div>
  );
}
