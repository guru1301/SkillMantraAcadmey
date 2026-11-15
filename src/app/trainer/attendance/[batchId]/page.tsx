import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import {
  getTrainerAssignedBatches,
  getTrainerBatchLiveRoster,
  getTrainerBatchCalendarSessions,
} from '@/lib/db/trainerPortal';
import LiveAttendanceClient from '@/components/trainer/LiveAttendanceClient';

export const metadata: Metadata = {
  title: 'Attendance Management | Trainer Portal',
  description: 'Mark live attendance for today or inspect and manage past session records.',
};

export default async function TrainerLiveBatchAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const batchId = resolvedParams.batchId;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Future dates are blocked: cap to todayStr
  let targetDate = resolvedSearchParams.date || todayStr;
  if (targetDate > todayStr) {
    targetDate = todayStr;
  }

  const batches = await getTrainerAssignedBatches(session.id);
  const currentBatch = batches.find((b) => b.id === batchId);

  if (!currentBatch && session.role !== 'super_admin') {
    notFound();
  }

  const [liveRosterData, calendarSessions] = await Promise.all([
    getTrainerBatchLiveRoster(session.id, batchId, targetDate),
    getTrainerBatchCalendarSessions(batchId),
  ]);

  return (
    <LiveAttendanceClient
      batches={batches}
      initialBatchId={batchId}
      initialDate={targetDate}
      todayDate={todayStr}
      initialSession={liveRosterData.existingSession}
      initialRoster={liveRosterData.roster}
      calendarSessions={calendarSessions}
    />
  );
}

