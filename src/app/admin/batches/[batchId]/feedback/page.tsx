import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getBatchById } from '@/lib/db/batches';
import { getBatchFeedbackStatus, getBatchFeedbackReport } from '@/lib/api/feedback';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import BatchTabs from '@/components/admin/BatchTabs';
import BatchFeedbackManager from '@/components/admin/BatchFeedbackManager';

export const dynamic = 'force-dynamic';

export default async function BatchFeedbackPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== 'super_admin' && session.role !== 'college_admin')) {
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
    // Fallback if backend route not reached or newly provisioned
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

  const canUnlock = session.role === 'super_admin';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Batches', href: '/admin/batches' },
          { label: batch.code, href: `/admin/batches/${batch.id}` },
          { label: 'Feedback' },
        ]}
      />

      {/* Tabs */}
      <BatchTabs batchId={batch.id} activeTab="feedback" />

      {/* Feedback Manager Component */}
      <BatchFeedbackManager
        batchId={batch.id}
        initialStatus={statusData}
        initialSummary={summaryData}
        userRole={session.role as any}
        canUnlock={canUnlock}
      />
    </div>
  );
}
