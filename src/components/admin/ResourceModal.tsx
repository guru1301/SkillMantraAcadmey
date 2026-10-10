'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createResourceAction } from '@/app/actions/resources';
import { resourceSchema, ResourceInput } from '@/lib/validations/resource';
import { X, FolderPlus, AlertCircle, CheckCircle2, HardDrive, ExternalLink } from 'lucide-react';

interface ResourceModalProps {
  isOpen: boolean;
  batchId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ResourceModal({
  isOpen,
  batchId,
  onClose,
  onSuccess,
}: ResourceModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<ResourceInput>({
    batchId,
    name: '',
    type: 'google_drive',
    url: '',
    description: '',
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    const parsed = resourceSchema.safeParse(formData);
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
      data.append('batchId', formData.batchId);
      data.append('name', formData.name);
      data.append('type', formData.type);
      data.append('url', formData.url);
      data.append('description', formData.description || '');

      const res = await createResourceAction(data);
      if (!res.success) {
        setGeneralError(res.error || 'Failed to add resource link');
        setLoading(false);
        return;
      }

      setSuccessMsg('Resource added successfully!');
      setTimeout(() => {
        setFormData({
          batchId,
          name: '',
          type: 'google_drive',
          url: '',
          description: '',
        });
        setSuccessMsg(null);
        setLoading(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
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
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Add Batch Resource</h3>
              <p className="text-[11px] text-slate-500">
                Link shared course materials, folders, or repositories
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

          {/* Resource Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Data Analytics Materials, Lab Codes"
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

          {/* Resource Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
            >
              <option value="google_drive">Google Drive Folder / Link</option>
              <option value="document">Document / PDF Link</option>
              <option value="video">Video Recording Link</option>
              <option value="link">Web Link / Repository</option>
            </select>
          </div>

          {/* Resource URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              name="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={formData.url}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-xl text-sm border ${
                fieldErrors.url
                  ? 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
              } outline-none transition`}
              required
            />
            {fieldErrors.url ? (
              <p className="text-xs text-rose-600 mt-1">{fieldErrors.url}</p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Enter valid HTTPS URL (e.g. Google Drive folder or document share link).
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Notes on contents, access permissions, lecture notes..."
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow disabled:opacity-60 transition"
            >
              {loading ? 'Adding...' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
