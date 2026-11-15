'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Plus,
  ArrowRight,
  CalendarCheck,
  GraduationCap,
  Sparkles,
  Building2,
  Zap,
} from 'lucide-react';
import { BatchWithDetails } from '@/lib/db/batches';
import { CollegeWithCounts } from '@/lib/db/colleges';
import OptimisticBatchStatusBadge, { BatchStatusType } from './OptimisticBatchStatusBadge';
import EmptyState from './EmptyState';

interface BatchesDirectoryClientProps {
  initialBatches: BatchWithDetails[];
  colleges: CollegeWithCounts[];
}

export default function BatchesDirectoryClient({
  initialBatches,
  colleges,
}: BatchesDirectoryClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'planned' | 'completed'>('all');

  // Status counts
  const counts = useMemo(() => {
    return {
      all: initialBatches.length,
      active: initialBatches.filter((b) => b.status === 'active').length,
      planned: initialBatches.filter((b) => b.status === 'planned').length,
      completed: initialBatches.filter((b) => b.status === 'completed').length,
    };
  }, [initialBatches]);

  // Client-side instant filtering (0ms latency)
  const filteredBatches = useMemo(() => {
    return initialBatches.filter((b) => {
      // 1. Tab filter
      if (activeTab !== 'all' && b.status !== activeTab) {
        return false;
      }

      // 2. College filter
      if (selectedCollegeId !== 'all' && b.college_id !== selectedCollegeId) {
        return false;
      }

      // 3. Search query
      const q = search.toLowerCase().trim();
      if (!q) return true;

      return (
        b.code.toLowerCase().includes(q) ||
        b.program_name.toLowerCase().includes(q) ||
        b.college_name.toLowerCase().includes(q) ||
        (b.assigned_trainers && b.assigned_trainers.toLowerCase().includes(q))
      );
    });
  }, [initialBatches, activeTab, selectedCollegeId, search]);

  return (
    <div className="space-y-4">
      {/* 1. Instant Status Filter Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'all', label: 'All Batches', count: counts.all },
              { key: 'active', label: 'Active', count: counts.active },
              { key: 'planned', label: 'Planned', count: counts.planned },
              { key: 'completed', label: 'Completed', count: counts.completed },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0A3A7A] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & College Picker */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, college, program..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
            />
          </div>

          <select
            value={selectedCollegeId}
            onChange={(e) => setSelectedCollegeId(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden max-w-[160px] truncate"
          >
            <option value="all">All Colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Batches Table */}
      {filteredBatches.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-8 h-8 text-slate-400" />}
          title={search ? 'No matching batches found' : 'No training batches found'}
          description={
            search
              ? `No batch matches your search "${search}". Try resetting the filter.`
              : 'Create a training batch to assign a program, college, trainer, and student roster.'
          }
          actionLabel="Create Training Batch"
          actionHref="/admin/batches/new"
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Batch Code</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">Training Program</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-center">Students</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Quick Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition group">
                    {/* Batch Code */}
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/batches/${b.id}`}
                        className="font-mono font-bold text-[#0A3A7A] hover:underline block text-xs"
                      >
                        {b.code}
                      </Link>
                    </td>

                    {/* College */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link
                        href={`/admin/colleges/${b.college_id}`}
                        className="hover:text-blue-700 transition"
                      >
                        {b.college_name}
                      </Link>
                      {b.college_city && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {b.college_city}
                        </span>
                      )}
                    </td>

                    {/* Program */}
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {b.program_name}
                    </td>

                    {/* Timeline */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {b.start_date} to {b.end_date}
                    </td>

                    {/* Students */}
                    <td className="py-3.5 px-4 text-center font-medium">
                      <span className="font-semibold text-slate-900">{b.actual_students_count}</span>
                      <span className="text-slate-400">/{b.target_strength}</span>
                    </td>

                    {/* Faculty Trainer */}
                    <td className="py-3.5 px-4">
                      {b.assigned_trainers ? (
                        <span className="text-slate-800 font-medium">{b.assigned_trainers}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Optimistic Status Badge with instant dropdown */}
                    <td className="py-3.5 px-4">
                      <OptimisticBatchStatusBadge
                        batchId={b.id}
                        initialStatus={b.status as BatchStatusType}
                        batchCode={b.code}
                      />
                    </td>

                    {/* Quick Row Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/batches/${b.id}/attendance`}
                          title="Record daily attendance"
                          className="p-1 rounded-md text-slate-500 hover:text-[#0A3A7A] hover:bg-blue-50 transition"
                        >
                          <CalendarCheck className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/batches/${b.id}/students`}
                          title="View student roster"
                          className="p-1 rounded-md text-slate-500 hover:text-[#0A3A7A] hover:bg-blue-50 transition"
                        >
                          <GraduationCap className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/batches/${b.id}`}
                          className="inline-flex items-center gap-1 font-bold text-xs text-[#0A3A7A] hover:underline px-2 py-1 rounded-md hover:bg-blue-50 transition"
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

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Showing {filteredBatches.length} of {initialBatches.length} batch(es)
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Status changes update optimistically in 0ms</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
