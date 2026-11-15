'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Layers, Plus, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { createBatchAction } from '@/app/actions/batches';
import { useAdminToast } from './AdminToast';

interface QuickCreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  colleges: Array<{ id: string; name: string; city: string | null }>;
  programs: Array<{ id: string; name: string; duration_days?: number }>;
}

export default function QuickCreateBatchModal({
  isOpen,
  onClose,
  colleges,
  programs,
}: QuickCreateBatchModalProps) {
  const router = useRouter();
  const toast = useAdminToast();

  const [collegeId, setCollegeId] = useState<string>(colleges[0]?.id || '');
  const [programId, setProgramId] = useState<string>(programs[0]?.id || '');
  const [batchCode, setBatchCode] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [targetStrength, setTargetStrength] = useState<number>(60);
  const [status, setStatus] = useState<'planned' | 'active'>('active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAutoSuggestCode = () => {
    const col = colleges.find((c) => c.id === collegeId);
    const prog = programs.find((p) => p.id === programId);
    const colCode = col ? col.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'COL';
    const progCode = prog ? prog.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'TRN';
    const year = new Date().getFullYear();
    const rand = Math.floor(10 + Math.random() * 90);
    setBatchCode(`${colCode}-${progCode}-${year}-${rand}`);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeId || !programId || !batchCode.trim() || !startDate || !endDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('collegeId', collegeId);
    formData.append('programId', programId);
    formData.append('code', batchCode.trim().toUpperCase());
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('targetStrength', String(targetStrength));
    formData.append('status', status);

    try {
      const res = await createBatchAction(formData);
      if (res.success && res.data?.id) {
        toast.success(`Batch ${batchCode.toUpperCase()} created successfully!`);
        onClose();
        router.refresh();
      } else {
        setError(res.error || 'Failed to create batch.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while creating batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A3A7A] flex items-center justify-center border border-blue-200 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Create New Training Batch</h3>
              <p className="text-xs text-slate-500">Fast batch configuration with program and college dropdowns</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {/* Dropdown 1: Partner College */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Partner College <span className="text-rose-500">*</span>
            </label>
            <select
              value={collegeId}
              onChange={(e) => {
                setCollegeId(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
            >
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.city ? `(${c.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Training Program */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Training Program <span className="text-rose-500">*</span>
            </label>
            <select
              value={programId}
              onChange={(e) => {
                setProgramId(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 bg-white font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.duration_days ? `• ${p.duration_days} Days` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Code with Auto Suggest */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Batch Code <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoSuggestCode}
                className="text-xs text-[#0A3A7A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
                <span>Auto Suggest</span>
              </button>
            </div>
            <input
              type="text"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              placeholder="e.g. SRM-FSD-2025-01"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm uppercase font-bold text-slate-900 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
            />
          </div>

          {/* Start and End Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
              />
            </div>
          </div>

          {/* Capacity and Initial Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Target Capacity (Seats)
              </label>
              <input
                type="number"
                min="1"
                value={targetStrength}
                onChange={(e) => setTargetStrength(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A3A7A]/20 focus:border-[#0A3A7A]"
              >
                <option value="active">Active (Opening Now)</option>
                <option value="planned">Planned (Upcoming)</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons with Very Large Submit Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Batch...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#FCAF0A]" />
                  <span>Create Batch Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
