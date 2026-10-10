'use client';

import React, { useState } from 'react';
import { createProgramAction } from '@/app/actions/programs';
import { programSchema, ProgramInput } from '@/lib/validations/program';
import { X, BookOpen, AlertCircle, CheckCircle2, Plus } from 'lucide-react';

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newProgram: { id: string; name: string }) => void;
}

export default function ProgramModal({
  isOpen,
  onClose,
  onSuccess,
}: ProgramModalProps) {
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProgramInput>({
    name: '',
    description: '',
    durationDays: 30,
    status: 'active',
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
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

    const parsed = programSchema.safeParse(formData);
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
      data.append('name', formData.name);
      data.append('description', formData.description || '');
      data.append('durationDays', formData.durationDays.toString());
      data.append('status', formData.status);

      const res = await createProgramAction(data);
      if (!res.success) {
        setGeneralError(res.error || 'Failed to create program');
        setLoading(false);
        return;
      }

      setSuccessMsg('Program created successfully!');
      setTimeout(() => {
        if (res.data?.id && onSuccess) {
          onSuccess({ id: res.data.id, name: formData.name });
        }
        setFormData({
          name: '',
          description: '',
          durationDays: 30,
          status: 'active',
        });
        setSuccessMsg(null);
        setLoading(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setGeneralError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Add Training Program</h3>
              <p className="text-[11px] text-slate-500">
                Reusable curriculum offering across colleges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {generalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Program Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Program Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Full Stack Development, Data Analytics"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-xl text-sm border ${
                fieldErrors.name
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
              } outline-none transition`}
              required
            />
            {fieldErrors.name && (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* Duration Days & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Days) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="durationDays"
                min={1}
                max={365}
                value={formData.durationDays}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-xl text-sm border ${
                  fieldErrors.durationDays
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                } outline-none transition`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Curriculum outline, core competencies, prerequisites..."
              value={formData.description || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white text-xs font-semibold shadow disabled:opacity-60 transition"
            >
              {loading ? 'Creating...' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
