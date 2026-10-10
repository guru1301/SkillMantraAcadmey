'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, MapPin, Mail, Phone, Link2, AlertCircle, ArrowRight } from 'lucide-react';
import { createCollegeAction, updateCollegeAction } from '@/app/actions/colleges';
import { collegeSchema } from '@/lib/validations/college';

interface CollegeFormProps {
  initialData?: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    logo_url?: string | null;
    status: 'active' | 'inactive';
  };
  isEditing?: boolean;
}

export default function CollegeForm({ initialData, isEditing: isEditingProp }: CollegeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    contactName: initialData?.contact_name || '',
    contactEmail: initialData?.contact_email || '',
    contactPhone: initialData?.contact_phone || '',
    logoUrl: initialData?.logo_url || '',
    status: initialData?.status || 'active',
  });

  const isEditing = isEditingProp ?? Boolean(initialData?.id);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;

    // 1. Client-side Zod validation
    const clientValidation = collegeSchema.safeParse(formData);
    if (!clientValidation.success) {
      const msg = clientValidation.error.issues.map((i) => i.message).join(', ');
      setErrorMessage(msg);
      return;
    }

    setErrorMessage(null);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('city', formData.city);
    data.append('state', formData.state);
    data.append('contactName', formData.contactName);
    data.append('contactEmail', formData.contactEmail);
    data.append('contactPhone', formData.contactPhone);
    data.append('logoUrl', formData.logoUrl);
    data.append('status', formData.status);

    startTransition(async () => {
      if (isEditing && initialData?.id) {
        const res = await updateCollegeAction(initialData.id, data);
        if (res.success) {
          router.push(`/admin/colleges/${initialData.id}`);
          router.refresh();
        } else {
          setErrorMessage(res.error || 'Failed to update college.');
        }
      } else {
        const res = await createCollegeAction(data);
        if (res.success && res.data?.id) {
          router.push(`/admin/colleges/${res.data.id}`);
          router.refresh();
        } else {
          setErrorMessage(res.error || 'Failed to create college.');
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-150"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic College Information */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0A3A7A]" />
            <span>Institution Details</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                College / Organization Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Saranathan College of Engineering"
                disabled={isPending}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  City
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Trichy"
                    disabled={isPending}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Tamil Nadu"
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="logoUrl"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Logo URL (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                    disabled={isPending}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Lifecycle Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 transition-all cursor-pointer"
                >
                  <option value="active">Active (Available for Batches)</option>
                  <option value="inactive">Inactive (Archived)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Primary Institutional Contact */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#0A3A7A]" />
            <span>Primary Institutional Liaison</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="contactName"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Contact Person (HOD / Dean / Principal)
              </label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="e.g. Dr. K. Ramanathan (HOD CSE)"
                disabled={isPending}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Contact Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="hod.cse@college.edu.in"
                    disabled={isPending}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contactPhone"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Contact Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    disabled={isPending}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href={isEditing && initialData?.id ? `/admin/colleges/${initialData.id}` : '/admin/colleges'}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] disabled:bg-[#0A3A7A]/70 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span>Saving...</span>
            ) : (
              <>
                <span>{isEditing ? 'Save Changes' : 'Create College'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
