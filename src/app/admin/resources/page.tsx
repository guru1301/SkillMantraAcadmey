import React from 'react';
import Link from 'next/link';
import { getAllResources } from '@/lib/db/resources';
import { getBatches } from '@/lib/db/batches';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import EmptyState from '@/components/admin/EmptyState';
import { FolderOpen, ExternalLink, Search, Plus, HardDrive } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ResourcesPageProps {
  searchParams: Promise<{
    search?: string;
    batchId?: string;
  }>;
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const { search, batchId } = await searchParams;

  const [resources, batches] = await Promise.all([
    getAllResources({ search, batchId }),
    getBatches(),
  ]);

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-7xl mx-auto">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Learning Materials' },
        ]}
      />

      {/* 2. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Learning Materials
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of shared lecture decks, laboratory exercises, and curriculum links.
          </p>
        </div>

        {batches.length > 0 && (
          <Link
            href={`/admin/batches/${batches[0].id}/resources`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5 text-[#FCAF0A]" />
            <span>Attach Material</span>
          </Link>
        )}
      </div>

      {/* 3. Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
        <form method="GET" className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Search by material title, batch code, or college..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              name="batchId"
              defaultValue={batchId || 'all'}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20"
            >
              <option value="all">All Cohort Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} ({b.college_name})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Filter
          </button>
        </form>
      </div>

      {/* 4. Materials Table */}
      {resources.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-8 h-8 text-slate-400" />}
          title="No learning materials found"
          description="Learning materials and Drive folders attached to training batches will be organized here."
          actionLabel="View Batches"
          actionHref="/admin/batches"
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Material Name</th>
                  <th className="py-3 px-4">Associated Batch</th>
                  <th className="py-3 px-4">College &amp; Program</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Attached Date</th>
                  <th className="py-3 px-4 text-right">Resource Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {r.name}
                      {r.description && (
                        <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                          {r.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                      <Link
                        href={`/admin/batches/${r.batch_id}`}
                        className="hover:underline"
                      >
                        {r.batch_code}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      <span className="font-semibold">{r.college_name}</span>
                      <span className="block text-[11px] text-slate-500 font-normal">
                        {r.program_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {r.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#0A3A7A] hover:underline"
                      >
                        <span>Open Drive Resource</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
