'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Award,
  Trash2,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  X,
  ExternalLink,
  Crown,
  Search,
} from 'lucide-react';
import { BatchAssignedTrainer } from '@/lib/db/trainers';
import StatusBadge from '@/components/admin/StatusBadge';
import SecureDeleteModal from '@/components/admin/SecureDeleteModal';
import {
  assignTrainerToBatchAction,
  setLeadTrainerAction,
  removeTrainerFromBatchAction,
} from '@/app/actions/trainers';

interface AvailableTrainerOption {
  id: string;
  full_name: string;
  email: string | null;
  skills: string | null;
}

interface BatchTrainersManagerProps {
  batchId: string;
  batchCode: string;
  programName: string;
  initialAssigned: BatchAssignedTrainer[];
  availableTrainers: AvailableTrainerOption[];
}

export default function BatchTrainersManager({
  batchId,
  batchCode,
  programName,
  initialAssigned,
  availableTrainers: initialAvailable,
}: BatchTrainersManagerProps) {
  const router = useRouter();
  const [assigned, setAssigned] = useState<BatchAssignedTrainer[]>(initialAssigned);
  const [available, setAvailable] = useState<AvailableTrainerOption[]>(initialAvailable);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [isLead, setIsLead] = useState(false);
  const [customRole, setCustomRole] = useState('Assistant Trainer');
  const [submitting, setSubmitting] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ trainerId: string; trainerName: string } | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  React.useEffect(() => {
    setAssigned(initialAssigned);
  }, [initialAssigned]);

  React.useEffect(() => {
    setAvailable(initialAvailable);
  }, [initialAvailable]);

  const currentLead = assigned.find((t) => t.is_lead);

  // Available trainers filtered by search query
  const filteredAvailable = available.filter((t) => {
    const q = modalSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      t.full_name.toLowerCase().includes(q) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.skills && t.skills.toLowerCase().includes(q))
    );
  });

  const handleOpenAssignModal = () => {
    setIsAssignOpen(true);
    setSelectedTrainerId(available.length > 0 ? available[0].id : '');
    setIsLead(!currentLead); // default to lead if no lead exists
    setCustomRole(!currentLead ? 'Lead Trainer' : 'Assistant Trainer');
    setActionMsg(null);
  };

  const handleLeadToggle = (checked: boolean) => {
    setIsLead(checked);
    if (checked) {
      setCustomRole('Lead Trainer');
    } else {
      setCustomRole('Assistant Trainer');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainerId) return;

    setSubmitting(true);
    setActionMsg(null);

    const fData = new FormData();
    fData.append('batchId', batchId);
    fData.append('trainerId', selectedTrainerId);
    fData.append('isLead', String(isLead));
    fData.append('role', customRole);

    const res = await assignTrainerToBatchAction(fData);
    setSubmitting(false);

    if (res.success) {
      setIsAssignOpen(false);
      setActionMsg({
        type: 'success',
        text: 'Trainer successfully assigned to this batch.',
      });
      router.refresh();
      setTimeout(() => setActionMsg(null), 3500);
    } else {
      setActionMsg({
        type: 'error',
        text: res.error || 'Failed to assign trainer.',
      });
    }
  };

  const handlePromoteToLead = async (trainerId: string, trainerName: string) => {
    if (
      !confirm(
        `Designate "${trainerName}" as the primary Lead Trainer for batch ${batchCode}?`
      )
    ) {
      return;
    }

    setPromotingId(trainerId);
    setActionMsg(null);

    const res = await setLeadTrainerAction(batchId, trainerId);
    setPromotingId(null);

    if (res.success) {
      setActionMsg({
        type: 'success',
        text: `"${trainerName}" is now the Lead Trainer for this batch.`,
      });
      router.refresh();
      setTimeout(() => setActionMsg(null), 3500);
    } else {
      setActionMsg({
        type: 'error',
        text: res.error || 'Failed to change lead trainer.',
      });
    }
  };

  const handleOpenRemoveModal = (trainerId: string, trainerName: string) => {
    setDeleteTarget({ trainerId, trainerName });
  };

  const handleExecuteRemoval = async () => {
    if (!deleteTarget) return;
    const { trainerId, trainerName } = deleteTarget;

    setRemovingId(trainerId);
    setActionMsg(null);

    const res = await removeTrainerFromBatchAction(batchId, trainerId);
    setRemovingId(null);

    if (res.success) {
      setAssigned((prev) => prev.filter((t) => t.trainer_id !== trainerId));
      setActionMsg({
        type: 'success',
        text: `Removed "${trainerName}" from batch assignment.`,
      });
      router.refresh();
      setTimeout(() => setActionMsg(null), 3500);
    } else {
      setActionMsg({
        type: 'error',
        text: res.error || 'Failed to remove trainer assignment.',
      });
      throw new Error(res.error || 'Failed to remove trainer assignment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Assigned Training Faculty &amp; Mentors</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Technical trainers assigned to instruct and guide cohort{' '}
            <strong className="text-slate-700">{batchCode}</strong> ({programName}).
          </p>
        </div>

        <button
          onClick={handleOpenAssignModal}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-bold text-xs shadow-sm hover:shadow transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#FCAF0A]" />
          <span>Assign Trainer</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition animate-in fade-in ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* 2. Assigned Trainers Card List */}
      <div className="space-y-4">
        {assigned.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-200 shadow-xs">
              <Users className="w-7 h-7 text-[#0A3A7A]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No technical trainers assigned yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Assign a Lead Trainer and assistant mentors from your master trainer directory before the cohort start date.
            </p>
            <button
              onClick={handleOpenAssignModal}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-bold text-xs shadow-sm transition"
            >
              <UserPlus className="w-4 h-4 text-[#FCAF0A]" />
              <span>Assign First Trainer</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {assigned.map((trainer) => {
              const skills = trainer.skills
                ? trainer.skills.split(',').map((s) => s.trim()).filter(Boolean)
                : [];

              const isInactive = trainer.trainer_status === 'inactive';

              return (
                <div
                  key={trainer.assignment_id}
                  className={`bg-white rounded-2xl border ${
                    trainer.is_lead
                      ? 'border-blue-300 ring-2 ring-blue-500/10 shadow-sm'
                      : 'border-slate-200 shadow-2xs'
                  } p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-blue-400`}
                >
                  {/* Left: Trainer Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        trainer.is_lead
                          ? 'bg-[#0A3A7A] text-[#FCAF0A]'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {trainer.full_name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/trainers/${trainer.trainer_id}`}
                          className="font-bold text-sm text-slate-900 hover:text-blue-700 transition"
                        >
                          {trainer.full_name}
                        </Link>

                        {trainer.is_lead ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                            <Crown className="w-3 h-3 text-amber-600" />
                            <span>Lead Trainer</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {trainer.role || 'Assistant'}
                          </span>
                        )}

                        {isInactive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>Trainer Inactive</span>
                          </span>
                        )}
                      </div>

                      {/* Contact & Assignment info */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {trainer.email && (
                          <a
                            href={`mailto:${trainer.email}`}
                            className="flex items-center gap-1 text-blue-700 hover:underline"
                          >
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{trainer.email}</span>
                          </a>
                        )}
                        {trainer.phone && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{trainer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Assigned on {new Date(trainer.assigned_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Skills Tags */}
                      {skills.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                    {!trainer.is_lead && (
                      <button
                        onClick={() => handlePromoteToLead(trainer.trainer_id, trainer.full_name)}
                        disabled={promotingId === trainer.trainer_id}
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-800 text-xs font-bold transition shadow-2xs"
                      >
                        {promotingId === trainer.trainer_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>Make Lead</span>
                      </button>
                    )}

                    <Link
                      href={`/admin/trainers/${trainer.trainer_id}`}
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                      title="View Trainer Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() =>
                        handleOpenRemoveModal(trainer.trainer_id, trainer.full_name)
                      }
                      disabled={removingId === trainer.trainer_id}
                      type="button"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove Trainer from Batch"
                    >
                      {removingId === trainer.trainer_id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Assign Trainer Modal */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-[#062F68] to-[#0A3A7A] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[#FCAF0A]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Assign Trainer to Batch
                  </h3>
                  <p className="text-xs text-blue-200">
                    Cohort:{' '}
                    <span className="font-mono font-bold text-[#FCAF0A]">{batchCode}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {available.length === 0 ? (
                <div className="py-6 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    No available active trainers to assign
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 mb-4">
                    All registered active trainers are already assigned to this batch or no active trainers exist.
                  </p>
                  <Link
                    href="/admin/trainers"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A3A7A] text-white text-xs font-bold"
                  >
                    <span>Register New Trainer</span>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Select Trainer */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Technical Trainer <span className="text-rose-500">*</span>
                    </label>

                    {/* Quick filter in modal */}
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search available instructors..."
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-600"
                      />
                    </div>

                    <select
                      value={selectedTrainerId}
                      onChange={(e) => setSelectedTrainerId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-blue-600"
                    >
                      {filteredAvailable.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name} {t.skills ? `(${t.skills})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lead designation toggle */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isLead}
                        onChange={(e) => handleLeadToggle(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Designate as Lead Trainer
                      </span>
                    </label>

                    {isLead && currentLead && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                        ⚠️ <strong>Notice:</strong> This batch already has a Lead Trainer (
                        <strong>{currentLead.full_name}</strong>). To prevent duplicate leads,
                        either assign this trainer as an assistant first and use &quot;Make Lead&quot;
                        to swap, or remove the existing lead.
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500">
                      Each batch has at most 1 primary Lead Trainer. Assistant trainers support
                      labs and specialized modules.
                    </p>
                  </div>

                  {/* Custom Role */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Assignment Role Label
                    </label>
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="e.g. Lead Trainer, Lab Mentor, Cloud Architect"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  {/* Footer */}
                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAssignOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !selectedTrainerId}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white text-xs font-bold shadow-sm disabled:opacity-50 transition"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Assigning...</span>
                        </>
                      ) : (
                        <span>Confirm Assignment</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Secure Delete Confirmation Modal */}
      <SecureDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Trainer Assignment"
        description={`Are you sure you want to remove "${deleteTarget?.trainerName}" from batch ${batchCode}?`}
        impactDetails={[
          `The trainer will be disconnected from batch ${batchCode}.`,
          `The trainer's master profile and other college/batch allocations remain completely safe.`,
        ]}
        requiredText="REMOVE"
        confirmButtonText="Remove Assignment"
        onConfirm={handleExecuteRemoval}
      />
    </div>
  );
}
