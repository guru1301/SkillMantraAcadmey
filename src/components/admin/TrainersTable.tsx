'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Code2,
  Layers,
  Edit,
  Power,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { TrainerWithCounts } from '@/lib/db/trainers';
import StatusBadge from '@/components/admin/StatusBadge';
import TrainerModal from '@/components/admin/TrainerModal';
import { toggleTrainerStatusAction } from '@/app/actions/trainers';

interface TrainersTableProps {
  initialTrainers: TrainerWithCounts[];
}

export default function TrainersTable({ initialTrainers }: TrainersTableProps) {
  const router = useRouter();
  const [trainers, setTrainers] = useState<TrainerWithCounts[]>(initialTrainers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<TrainerWithCounts | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  React.useEffect(() => {
    setTrainers(initialTrainers);
  }, [initialTrainers]);

  const filtered = trainers.filter((t) => {
    const s = search.toLowerCase().trim();
    const matchesSearch =
      s === '' ||
      t.full_name.toLowerCase().includes(s) ||
      (t.email && t.email.toLowerCase().includes(s)) ||
      (t.skills && t.skills.toLowerCase().includes(s));

    const matchesStatus =
      statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (trainer: TrainerWithCounts) => {
    const newStatus = trainer.status === 'active' ? 'inactive' : 'active';
    const actionLabel = newStatus === 'active' ? 'reactivate' : 'deactivate';

    if (
      !confirm(
        `Are you sure you want to ${actionLabel} trainer "${trainer.full_name}"?`
      )
    ) {
      return;
    }

    setTogglingId(trainer.id);
    setActionMsg(null);

    const res = await toggleTrainerStatusAction(trainer.id, newStatus);
    setTogglingId(null);

    if (res.success) {
      setTrainers((prev) =>
        prev.map((t) => (t.id === trainer.id ? { ...t, status: newStatus } : t))
      );
      setActionMsg({
        type: 'success',
        text: `Trainer "${trainer.full_name}" is now ${newStatus}.`,
      });
      router.refresh();
      setTimeout(() => setActionMsg(null), 3500);
    } else {
      setActionMsg({
        type: 'error',
        text: res.error || `Failed to ${actionLabel} trainer.`,
      });
    }
  };

  const getSkillsList = (skillsStr: string | null): string[] => {
    if (!skillsStr) return [];
    return skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Faculty &amp; Trainers Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage certified instructors, domain specialists, and academic mentors available for cohort deployment.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-bold text-xs shadow-sm hover:shadow transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#FCAF0A]" />
          <span>Register Trainer</span>
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

      {/* 2. Filter & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 shrink-0">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 font-medium focus:outline-hidden focus:border-blue-600"
          >
            <option value="all">All Trainers ({trainers.length})</option>
            <option value="active">
              Active ({trainers.filter((t) => t.status === 'active').length})
            </option>
            <option value="inactive">
              Inactive ({trainers.filter((t) => t.status === 'inactive').length})
            </option>
          </select>
        </div>
      </div>

      {/* 3. Data View (Table on Desktop, Cards on Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {trainers.length === 0 ? (
          /* Zero State */
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
              <Users className="w-8 h-8 text-[#0A3A7A]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No technical trainers registered yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
              Build your technical instructor roster to assign Lead Trainers and mentors to partner college cohorts.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-bold text-xs shadow-sm transition"
            >
              <UserPlus className="w-4 h-4 text-[#FCAF0A]" />
              <span>Register First Trainer</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Search Empty State */
          <div className="py-12 px-4 text-center text-slate-500 text-xs">
            No trainers found matching your search filter &quot;{search}&quot;.
          </div>
        ) : (
          /* Desktop Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Trainer Details</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Domain Skills</th>
                  <th className="py-3 px-4 text-center">Batches</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((trainer) => {
                  const skills = getSkillsList(trainer.skills);
                  return (
                    <tr key={trainer.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {trainer.full_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/admin/trainers/${trainer.id}`}
                              className="font-bold text-slate-900 hover:text-blue-700 transition block"
                            >
                              {trainer.full_name}
                            </Link>
                            <span className="text-[11px] text-slate-400">
                              Registered on {new Date(trainer.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 space-y-0.5 text-[11px]">
                        {trainer.email ? (
                          <a
                            href={`mailto:${trainer.email}`}
                            className="flex items-center gap-1.5 text-blue-700 hover:underline"
                          >
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{trainer.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No email</span>
                        )}
                        {trainer.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{trainer.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Skills */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {skills.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {skills.slice(0, 3).map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px]"
                              >
                                {skill}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{skills.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Skills unassigned
                          </span>
                        )}
                      </td>

                      {/* Assigned Batches */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200">
                          <Layers className="w-3 h-3 text-blue-600" />
                          <span>{trainer.assigned_batches_count}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={trainer.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/trainers/${trainer.id}`}
                            title="View Trainer Profile & Assignments"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => setEditingTrainer(trainer)}
                            title="Edit Trainer Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(trainer)}
                            disabled={togglingId === trainer.id}
                            title={
                              trainer.status === 'active'
                                ? 'Deactivate Trainer'
                                : 'Reactivate Trainer'
                            }
                            className={`p-1.5 rounded-lg transition ${
                              trainer.status === 'active'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {togglingId === trainer.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                            ) : trainer.status === 'active' ? (
                              <PowerOff className="w-3.5 h-3.5" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Trainer Modal */}
      <TrainerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Edit Trainer Modal */}
      {editingTrainer && (
        <TrainerModal
          isOpen={true}
          isEdit={true}
          trainerId={editingTrainer.id}
          initialData={{
            fullName: editingTrainer.full_name,
            email: editingTrainer.email,
            phone: editingTrainer.phone,
            skills: editingTrainer.skills,
            status: editingTrainer.status,
          }}
          onClose={() => setEditingTrainer(null)}
          onSuccess={() => {
            setEditingTrainer(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
