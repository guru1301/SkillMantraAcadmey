'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgramRecord } from '@/lib/db/programs';
import ProgramModal from './ProgramModal';
import StatusBadge from './StatusBadge';
import { BookOpen, Plus, Clock, Layers, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CollegeProgramsTabProps {
  collegeId: string;
  collegeName: string;
  activePrograms: ProgramRecord[];
  allPrograms: ProgramRecord[];
}

export default function CollegeProgramsTab({
  collegeId,
  collegeName,
  activePrograms,
  allPrograms,
}: CollegeProgramsTabProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Training Programs</h2>
          <p className="text-xs text-slate-500">
            Curriculums deployed across cohorts at {collegeName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/programs"
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            All Programs ({allPrograms.length})
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white text-xs font-semibold shadow-sm hover:shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Program</span>
          </button>
        </div>
      </div>

      {activePrograms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">
            No active programs in this college yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create a batch under this college and link it with an existing platform program
            (or author a new custom curriculum).
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200 hover:bg-blue-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Program Offering</span>
            </button>
            <Link
              href={`/admin/colleges/${collegeId}/batches/new`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] text-white text-xs font-semibold hover:bg-[#082e61] transition"
            >
              <span>Create Batch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePrograms.map((prog) => (
            <div
              key={prog.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <StatusBadge status={prog.status} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">{prog.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                  {prog.description || 'Standard industry training curriculum with practical laboratories.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{prog.duration_days} days</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{prog.batches_count || 0} batches here</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available Platform Programs Catalog */}
      {allPrograms.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Platform Curriculum Catalog (Reusable Across Colleges)
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {allPrograms.length} total available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allPrograms.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{p.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.duration_days} days duration
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <ProgramModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
