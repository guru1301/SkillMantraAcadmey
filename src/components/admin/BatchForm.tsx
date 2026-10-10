'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBatchAction } from '@/app/actions/batches';
import { batchSchema, BatchInput } from '@/lib/validations/batch';
import {
  Layers,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

interface ProgramOption {
  id: string;
  name: string;
  duration_days?: number;
}

interface BatchFormProps {
  collegeId: string;
  collegeName: string;
  programs: ProgramOption[];
  onOpenNewProgramModal?: () => void;
}

export default function BatchForm({
  collegeId,
  collegeName,
  programs,
  onOpenNewProgramModal,
}: BatchFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<BatchInput>({
    code: '',
    collegeId,
    programId: programs.length > 0 ? programs[0].id : '',
    startDate: '',
    endDate: '',
    targetStrength: 60,
    status: 'planned',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Client-side Zod validation
    const parsed = batchSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        const path = err.path[0]?.toString() || 'general';
        errors[path] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('code', formData.code);
      data.append('collegeId', formData.collegeId);
      data.append('programId', formData.programId);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('targetStrength', formData.targetStrength.toString());
      data.append('status', formData.status);

      const result = await createBatchAction(data);

      if (!result.success) {
        setGeneralError(result.error || 'Failed to create batch');
        setLoading(false);
        return;
      }

      setSuccessMsg('Batch created successfully! Redirecting to Batch Workspace...');
      setTimeout(() => {
        router.push(`/admin/batches/${result.data?.id}`);
        router.refresh();
      }, 700);
    } catch (err: any) {
      setGeneralError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* General Error Banner */}
      {generalError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Failed to create batch</h4>
            <p className="text-xs text-rose-700 mt-0.5">{generalError}</p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* College Info Card */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A3A7A] text-white flex items-center justify-center font-bold text-sm shadow">
            {collegeName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
              Selected College / Organization
            </div>
            <div className="text-sm font-bold text-slate-900">{collegeName}</div>
          </div>
        </div>
        <Link
          href={`/admin/colleges/${collegeId}`}
          className="text-xs text-blue-700 font-semibold hover:underline"
        >
          View College Workspace
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            Batch Details
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Define cohort identity, target capacity, and curriculum timeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Batch Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Batch Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              placeholder="e.g. DA-TRI-2026-01"
              value={formData.code}
              onChange={handleChange}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm border font-mono ${
                fieldErrors.code
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
              } outline-none transition uppercase`}
              required
            />
            {fieldErrors.code ? (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.code}</p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Unique identifier across the platform.
              </p>
            )}
          </div>

          {/* Program Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Training Program <span className="text-rose-500">*</span>
              </label>
              {onOpenNewProgramModal && (
                <button
                  type="button"
                  onClick={onOpenNewProgramModal}
                  className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> New Program
                </button>
              )}
            </div>

            {programs.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>No programs available yet.</span>
                {onOpenNewProgramModal && (
                  <button
                    type="button"
                    onClick={onOpenNewProgramModal}
                    className="font-bold text-amber-900 underline"
                  >
                    Create one now
                  </button>
                )}
              </div>
            ) : (
              <select
                name="programId"
                value={formData.programId}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white ${
                  fieldErrors.programId
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                } outline-none transition`}
                required
              >
                <option value="" disabled>
                  Select a program
                </option>
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name} {prog.duration_days ? `(${prog.duration_days} days)` : ''}
                  </option>
                ))}
              </select>
            )}

            {fieldErrors.programId && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.programId}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                  fieldErrors.startDate
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                } outline-none transition`}
                required
              />
            </div>
            {fieldErrors.startDate && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              End Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                  fieldErrors.endDate
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                } outline-none transition`}
                required
              />
            </div>
            {fieldErrors.endDate && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.endDate}</p>
            )}
          </div>

          {/* Target Strength */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Strength (Planned Capacity)
            </label>
            <div className="relative">
              <input
                type="number"
                name="targetStrength"
                min={0}
                max={5000}
                value={formData.targetStrength}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                  fieldErrors.targetStrength
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                } outline-none transition`}
              />
            </div>
            {fieldErrors.targetStrength ? (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.targetStrength}</p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Planned capacity. Actual students will be calculated dynamically from enrollment.
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Batch Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={`/admin/colleges/${collegeId}/batches`}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading || programs.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-60 transition"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving Batch...</span>
            </>
          ) : (
            <>
              <span>Create Batch</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
