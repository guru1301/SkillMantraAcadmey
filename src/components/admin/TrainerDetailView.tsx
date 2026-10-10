'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Mail,
  Phone,
  Code2,
  Calendar,
  Layers,
  Edit,
  Power,
  PowerOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  BookOpen,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { TrainerDetailRecord } from '@/lib/db/trainers';
import StatusBadge from '@/components/admin/StatusBadge';
import TrainerModal from '@/components/admin/TrainerModal';
import { toggleTrainerStatusAction } from '@/app/actions/trainers';

interface TrainerDetailViewProps {
  trainer: TrainerDetailRecord;
}

export default function TrainerDetailView({ trainer: initialTrainer }: TrainerDetailViewProps) {
  const router = useRouter();
  const [trainer, setTrainer] = useState<TrainerDetailRecord>(initialTrainer);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const skills = trainer.skills
    ? trainer.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleToggleStatus = async () => {
    const newStatus = trainer.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'reactivate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} ${trainer.full_name}?`)) return;

    setToggling(true);
    setMsg(null);

    const res = await toggleTrainerStatusAction(trainer.id, newStatus);
    setToggling(false);

    if (res.success) {
      setTrainer((prev) => ({ ...prev, status: newStatus }));
      setMsg({ type: 'success', text: `Trainer successfully set to ${newStatus}.` });
      router.refresh();
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg({ type: 'error', text: res.error || 'Failed to update trainer status.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Return button */}
      <Link
        href="/admin/trainers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Trainers Directory</span>
      </Link>

      {/* Notification */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#062F68] to-[#0A3A7A] text-[#FCAF0A] flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              {trainer.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {trainer.full_name}
                </h1>
                <StatusBadge status={trainer.status} />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                {trainer.email && (
                  <a
                    href={`mailto:${trainer.email}`}
                    className="flex items-center gap-1.5 text-blue-700 hover:underline font-medium"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{trainer.email}</span>
                  </a>
                )}
                {trainer.phone && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{trainer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined {new Date(trainer.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsEditOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              type="button"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs transition ${
                trainer.status === 'active'
                  ? 'border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100'
                  : 'border border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {toggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : trainer.status === 'active' ? (
                <PowerOff className="w-3.5 h-3.5" />
              ) : (
                <Power className="w-3.5 h-3.5" />
              )}
              <span>{trainer.status === 'active' ? 'Deactivate' : 'Activate'}</span>
            </button>
          </div>
        </div>

        {/* Skills Section */}
        {skills.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Domain Competencies &amp; Technologies
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assigned Batches History Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Cohort Deployments &amp; Assignments</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Academic training batches assigned to this instructor.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
            {trainer.assigned_batches.length} Batch{trainer.assigned_batches.length === 1 ? '' : 'es'}
          </span>
        </div>

        {trainer.assigned_batches.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No batch assignments yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Assign this instructor to active cohorts directly from the batch workspace.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {trainer.assigned_batches.map((batch) => (
              <div
                key={batch.batch_id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {batch.batch_code}
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      {batch.program_name}
                    </span>
                    {batch.is_lead ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-600" />
                        <span>Lead Trainer</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {batch.role || 'Assistant'}
                      </span>
                    )}
                    <StatusBadge status={batch.batch_status} />
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{batch.college_name}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {batch.start_date} → {batch.end_date}
                      </span>
                    </span>
                  </div>
                </div>

                <Link
                  href={`/admin/batches/${batch.batch_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 text-xs font-semibold self-start sm:self-auto transition"
                >
                  <span>Open Batch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <TrainerModal
          isOpen={true}
          isEdit={true}
          trainerId={trainer.id}
          initialData={{
            fullName: trainer.full_name,
            email: trainer.email,
            phone: trainer.phone,
            skills: trainer.skills,
            status: trainer.status,
          }}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            setIsEditOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
