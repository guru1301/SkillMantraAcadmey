'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgramRecord } from '@/lib/db/programs';
import ProgramModal from './ProgramModal';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import { deleteProgramAction } from '@/app/actions/programs';
import { useAdminToast } from './AdminToast';
import { BookOpen, Plus, Clock, Layers, Trash2, AlertTriangle } from 'lucide-react';

interface ProgramsListClientProps {
  programs: ProgramRecord[];
}

export default function ProgramsListClient({ programs }: ProgramsListClientProps) {
  const router = useRouter();
  const toast = useAdminToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (programId: string, programName: string) => {
    setIsDeleting(true);
    try {
      const res = await deleteProgramAction(programId);
      if (res.success) {
        toast.success(`Program "${programName}" deleted successfully`);
        setDeleteConfirmId(null);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete program');
      }
    } catch {
      toast.error('An error occurred while deleting program');
    } finally {
      setIsDeleting(false);
    }
  };

  const programToDelete = programs.find((p) => p.id === deleteConfirmId);

  return (
    <div className="space-y-4">
      {/* Top Header Bar with Big Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Training Programs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create or manage training tracks available across all partner colleges.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#FCAF0A]" />
          <span>+ Add Program</span>
        </button>
      </div>

      {programs.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-slate-400" />}
          title="No training programs found"
          description="Create your first training program such as Full Stack Development, Data Analytics, or Python."
          actionLabel="+ Add Program"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#0A3A7A] flex items-center justify-center font-bold shadow-2xs">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={program.status} />
                    <button
                      type="button"
                      title="Delete program"
                      onClick={() => setDeleteConfirmId(program.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1">
                  {program.name}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                  {program.description || 'Hands-on training curriculum and technical modules.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{program.duration_days} Days</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-[#0A3A7A] bg-blue-50 px-2 py-0.5 rounded-md">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{program.batches_count || 0} batches</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && programToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Delete &ldquo;{programToDelete.name}&rdquo;?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This program will be removed from your catalog.
                </p>
              </div>
            </div>

            {programToDelete.batches_count && programToDelete.batches_count > 0 ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Notice:</strong> This program is currently linked to{' '}
                  <strong>{programToDelete.batches_count} batch(es)</strong>. You cannot delete it until those batches are reassigned or deleted.
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently remove this program?
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(programToDelete.id, programToDelete.name)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Program'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Program Create Modal */}
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
