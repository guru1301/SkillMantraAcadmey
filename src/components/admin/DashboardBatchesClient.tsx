'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowRight,
  CalendarCheck,
  GraduationCap,
  Plus,
  Search,
} from 'lucide-react';
import { BatchWithDetails } from '@/lib/db/batches';
import OptimisticBatchStatusBadge, { BatchStatusType } from './OptimisticBatchStatusBadge';

interface DashboardBatchesClientProps {
  batches: BatchWithDetails[];
  totalBatchesCount: number;
}

export default function DashboardBatchesClient({
  batches,
  totalBatchesCount,
}: DashboardBatchesClientProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'planned'>('active');
  const [search, setSearch] = useState('');

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (filter !== 'all' && b.status !== filter) {
        return false;
      }
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        b.code.toLowerCase().includes(q) ||
        b.program_name.toLowerCase().includes(q) ||
        b.college_name.toLowerCase().includes(q)
      );
    });
  }, [batches, filter, search]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header with Title and Instant Filters */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Current Training Batches
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active and opening batches across partner colleges.
          </p>
        </div>

        {/* Filter Pills & View All */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setFilter('active')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                filter === 'active'
                  ? 'bg-[#0A3A7A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilter('planned')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                filter === 'planned'
                  ? 'bg-[#0A3A7A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Planned
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#0A3A7A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Recent
            </button>
          </div>

          <Link
            href="/admin/batches"
            className="text-xs font-semibold text-[#0A3A7A] hover:underline inline-flex items-center gap-1 pl-2 border-l border-slate-200"
          >
            <span>View All ({totalBatchesCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Table */}
      {filteredBatches.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <p className="text-xs text-slate-500">
            No batches found in the &ldquo;{filter}&rdquo; category.
          </p>
          <Link
            href="/admin/batches/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A3A7A] text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5 text-[#FCAF0A]" />
            <span>Create Batch</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Program</th>
                <th className="py-3 px-4">Faculty</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4 text-center">Roster</th>
                <th className="py-3 px-4">Quick Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBatches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition group">
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/batches/${b.id}`}
                      className="font-mono font-bold text-[#0A3A7A] hover:underline"
                    >
                      {b.code}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {b.college_name}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {b.program_name}
                  </td>
                  <td className="py-3 px-4">
                    {b.assigned_trainers ? (
                      <span className="text-slate-800 font-medium">{b.assigned_trainers}</span>
                    ) : (
                      <span className="text-amber-600 font-semibold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {b.start_date} to {b.end_date}
                  </td>
                  <td className="py-3 px-4 text-center font-medium">
                    <span className="font-semibold text-slate-900">{b.actual_students_count}</span>
                    <span className="text-slate-400">/{b.target_strength}</span>
                  </td>
                  {/* Optimistic Status Dropdown */}
                  <td className="py-3 px-4">
                    <OptimisticBatchStatusBadge
                      batchId={b.id}
                      initialStatus={b.status as BatchStatusType}
                      batchCode={b.code}
                    />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/batches/${b.id}/attendance`}
                        title="Mark Attendance"
                        className="p-1 rounded-md text-slate-400 hover:text-[#0A3A7A] hover:bg-blue-50 transition"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/admin/batches/${b.id}`}
                        className="font-bold text-[#0A3A7A] hover:underline text-xs inline-flex items-center gap-0.5"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
