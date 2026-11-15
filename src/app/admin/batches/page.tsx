import React from 'react';
import Link from 'next/link';
import { getBatches } from '@/lib/db/batches';
import { getColleges } from '@/lib/db/colleges';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import BatchesDirectoryClient from '@/components/admin/BatchesDirectoryClient';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const [batches, colleges] = await Promise.all([
    getBatches(),
    getColleges(),
  ]);

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-7xl mx-auto">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Batches' },
        ]}
      />

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Batches &amp; Cohorts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage training programs currently planned or delivered across partner colleges.
          </p>
        </div>

        <Link
          href="/admin/batches/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-[#FCAF0A]" />
          <span>Create Batch</span>
        </Link>
      </div>

      {/* 3. Interactive Batches Directory with 0ms Optimistic Controls */}
      <BatchesDirectoryClient initialBatches={batches} colleges={colleges} />
    </div>
  );
}
