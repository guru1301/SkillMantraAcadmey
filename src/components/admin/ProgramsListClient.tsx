'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgramRecord } from '@/lib/db/programs';
import ProgramModal from './ProgramModal';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import { BookOpen, Plus, Clock, Layers } from 'lucide-react';

interface ProgramsListClientProps {
  programs: ProgramRecord[];
}

export default function ProgramsListClient({ programs }: ProgramsListClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Curriculum Offerings</h2>
          <p className="text-xs text-slate-500">
            Reusable training programs available for deployment across partner college cohorts
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-semibold text-xs shadow-sm hover:shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Program</span>
        </button>
      </div>

      {programs.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-slate-400" />}
          title="No training programs found"
          description="Define reusable curriculum offerings such as Data Analytics, Full Stack Development, or Aptitude Training."
          actionLabel="Create First Program"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 flex items-center justify-center font-bold shadow-xs">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <StatusBadge status={program.status} />
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1.5">
                  {program.name}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 mb-4">
                  {program.description ||
                    'Comprehensive industry curriculum covering hands-on technical competencies and project benchmarks.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{program.duration_days} days curriculum</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{program.batches_count || 0} batches</span>
                </div>
              </div>
            </div>
          ))}
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
