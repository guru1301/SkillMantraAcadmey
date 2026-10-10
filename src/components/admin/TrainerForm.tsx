'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Code2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
} from 'lucide-react';
import { trainerSchema, TrainerInput } from '@/lib/validations/trainer';
import { createTrainerAction, updateTrainerAction } from '@/app/actions/trainers';

interface TrainerFormProps {
  initialData?: Partial<TrainerInput>;
  trainerId?: string;
  isEdit?: boolean;
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
}

export default function TrainerForm({
  initialData,
  trainerId,
  isEdit = false,
  onSuccess,
  onCancel,
}: TrainerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<TrainerInput>({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    skills: initialData?.skills || '',
    status: initialData?.status || 'active',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Client-side Zod validation
    const parsed = trainerSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    const fData = new FormData();
    fData.append('fullName', formData.fullName);
    if (formData.email) fData.append('email', formData.email);
    if (formData.phone) fData.append('phone', formData.phone);
    if (formData.skills) fData.append('skills', formData.skills);
    fData.append('status', formData.status);

    let res;
    if (isEdit && trainerId) {
      res = await updateTrainerAction(trainerId, fData);
    } else {
      res = await createTrainerAction(fData);
    }

    setLoading(false);

    if (res.success) {
      setSuccessMsg(
        isEdit
          ? 'Trainer profile successfully updated!'
          : 'New trainer successfully registered!'
      );
      if (onSuccess) {
        onSuccess(res.data?.id || trainerId);
      } else {
        setTimeout(() => {
          router.push('/admin/trainers');
          router.refresh();
        }, 800);
      }
    } else {
      setGeneralError(res.error || 'Failed to save trainer record. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {generalError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Full Name <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Dr. Rajesh Kannan, M.Tech"
            required
            className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
              fieldErrors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
            } focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition`}
          />
        </div>
        {fieldErrors.fullName && (
          <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.fullName}</p>
        )}
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="e.g. rajesh.k@skillmantra.com"
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border ${
                fieldErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.email}</p>
          )}
          <p className="text-[10px] text-slate-400 mt-1">
            Optional, but must be unique if provided.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Phone / WhatsApp Number
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="e.g. +91 94431 55678"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>
        </div>
      </div>

      {/* Skills / Expertise */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Technical Skills &amp; Domain Expertise
        </label>
        <div className="relative">
          <Code2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            name="skills"
            rows={2}
            value={formData.skills || ''}
            onChange={handleChange}
            placeholder="e.g. Full Stack Development, React, Node.js, Python, PostgreSQL, AWS"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Separate multiple skills with commas for automatic tagging.
        </p>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Profile Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-blue-600 transition"
        >
          <option value="active">Active (Available for Batch Assignment)</option>
          <option value="inactive">Inactive (Archived / Unavailable)</option>
        </select>
        <p className="text-[10px] text-slate-400 mt-1">
          Inactive trainers cannot be newly assigned to active batches.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white text-xs font-bold shadow-sm hover:shadow disabled:opacity-50 transition"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>{isEdit ? 'Update Trainer' : 'Register Trainer'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
