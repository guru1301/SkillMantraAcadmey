import React from 'react';
import { getPlatformOverviewStats } from '@/lib/db';
import { getBatches } from '@/lib/db/batches';
import { getColleges } from '@/lib/db/colleges';
import { getPrograms } from '@/lib/db/programs';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [platformStats, allBatches, colleges, programs] = await Promise.all([
    getPlatformOverviewStats(),
    getBatches(),
    getColleges(),
    getPrograms(),
  ]);

  return (
    <AdminDashboardClient
      stats={platformStats}
      batches={allBatches}
      colleges={colleges}
      programs={programs}
    />
  );
}
