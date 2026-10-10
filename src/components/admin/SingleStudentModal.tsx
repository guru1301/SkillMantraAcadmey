'use client';

import React, { useState } from 'react';
import { UserPlus, X, Loader2, AlertCircle } from 'lucide-react';
import { addSingleStudentAction } from '@/app/actions/students';
import { StudentRowInput } from '@/lib/validations/student';

interface SingleStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  collegeId: string;
  batchCode: string;
  onSuccess: () => void;
}

export default function SingleStudentModal({
  isOpen,
  onClose,
  batchId,
  collegeId,
  batchCode,
  onSuccess,
}: SingleStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<StudentRowInput>({
    rollNumber: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    yearOrSemester: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rollNumber.trim() || !formData.fullName.trim()) {
      setError('Roll number and full name are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await addSingleStudentAction(batchId, collegeId, formData);
    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Failed to add student. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#062F68] to-[#0A3A7A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-[#FCAF0A]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Add Single Student
              </h3>
              <p className="text-xs text-blue-200">
                Enroll student into batch{' '}
                <span className="font-mono font-bold text-[#FCAF0A]">
                  {batchCode}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Roll / Register Number *
              </label>
              <input
                type="text"
                name="rollNumber"
                placeholder="e.g. 21CS045"
                value={formData.rollNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="e.g. Dinesh Kumar"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                placeholder="e.g. CSE / IT / ECE"
                value={formData.department || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Year / Semester
              </label>
              <input
                type="text"
                name="yearOrSemester"
                placeholder="e.g. 3rd Year / 6th Sem"
                value={formData.yearOrSemester || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="e.g. dinesh@example.com"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="e.g. +91 98765 43210"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#0A3A7A] hover:bg-[#082e61] text-white text-xs font-bold shadow-sm disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Enroll Student</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
