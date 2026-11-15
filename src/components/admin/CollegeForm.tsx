'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Link2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { createCollegeAction, updateCollegeAction } from '@/app/actions/colleges';
import { collegeSchema } from '@/lib/validations/college';
import { useAdminToast } from './AdminToast';

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
  const toast = useAdminToast();
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

  const executeSubmit = () => {
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
    data.append('name', formData.name.trim());
    data.append('city', formData.city.trim());
    data.append('state', formData.state.trim());
    data.append('contactName', formData.contactName.trim());
    data.append('contactEmail', formData.contactEmail.trim().toLowerCase());
    data.append('contactPhone', formData.contactPhone.trim());
    data.append('logoUrl', formData.logoUrl.trim());
    data.append('status', formData.status);

    startTransition(async () => {
      try {
        if (isEditing && initialData?.id) {
          const res = await updateCollegeAction(initialData.id, data);
          if (res.success) {
            toast.success(`Successfully updated ${formData.name}`);
            router.push(`/admin/colleges/${initialData.id}`);
            router.refresh();
          } else {
            setErrorMessage(res.error || 'Failed to update college details.');
          }
        } else {
          const res = await createCollegeAction(data);
          if (res.success && res.data?.id) {
            toast.success(`Partner college ${formData.name} successfully registered!`);
            router.push(`/admin/colleges/${res.data.id}`);
            router.refresh();
          } else {
            setErrorMessage(res.error || 'Failed to register partner college.');
          }
        }
      } catch (err: any) {
        setErrorMessage('A network error occurred. Please try again.');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSubmit();
  };

  // Keyboard shortcut: Ctrl + Enter / Cmd + Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, isPending]);

  // Derived monogram for preview
  const previewMonogram = formData.name.trim()
    ? formData.name
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')
    : 'SM';

  return (
    <div className="max-w-6xl mx-auto">
      {/* 2-Column Responsive Layout: Form on Left, Live Preview & Setup on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Main College Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Error Notification */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* SECTION 1: Institution Details */}
            <div className="space-y-3 sm:space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0A3A7A] flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  1. Institution &amp; Campus Details
                </h2>
              </div>

              {/* College Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
                >
                  Official Institution Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Saranathan College of Engineering"
                    disabled={isPending}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Location: City and State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
                  >
                    City / Campus Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Tiruchirappalli"
                      disabled={isPending}
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
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
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Status & Optional Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="status"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
                  >
                    Partnership Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isPending}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 font-medium transition-all cursor-pointer"
                  >
                    <option value="active">Active (Available for Cohorts)</option>
                    <option value="inactive">Inactive / On-Hold</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="logoUrl"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
                  >
                    Institution Logo URL (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Link2 className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="logoUrl"
                      name="logoUrl"
                      type="url"
                      value={formData.logoUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      disabled={isPending}
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Coordinator Liaison */}
            <div className="space-y-3 sm:space-y-3.5 pt-1">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  2. College Coordinator / SPOC Contact
                </h2>
              </div>

              {/* Coordinator Name */}
              <div>
                <label
                  htmlFor="contactName"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
                >
                  Coordinator Name &amp; Designation
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="contactName"
                    name="contactName"
                    type="text"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="e.g. Dr. K. Ramanathan (HOD CSE)"
                    disabled={isPending}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="contactEmail"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
                  >
                    Official Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="hod.cse@college.edu.in"
                      disabled={isPending}
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contactPhone"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1"
                  >
                    Direct Phone / Mobile
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      disabled={isPending}
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:outline-none focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/15 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS — PROPORTIONED FOR LAPTOPS */}
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
              <Link
                href={
                  isEditing && initialData?.id
                    ? `/admin/colleges/${initialData.id}`
                    : '/admin/colleges'
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </Link>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[11px] text-slate-400">
                  Ctrl + Enter
                </span>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] disabled:bg-[#0A3A7A]/70 text-white text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs active:scale-[0.99] transition cursor-pointer disabled:cursor-not-allowed group"
                >
                  {isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#FCAF0A]" />
                      <span>{isEditing ? 'Save Changes' : 'Register College Partner'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Live Directory Preview & Operational Checklist */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. LIVE DIRECTORY CARD PREVIEW */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
                <span>Live Directory Preview</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Real-Time
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Institution Emblem & Name */}
              <div className="flex items-start gap-3">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo"
                    className="w-11 h-11 rounded-xl object-contain border border-slate-200 p-1 bg-white shadow-2xs shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0A3A7A] to-[#041633] text-[#FCAF0A] flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
                    {previewMonogram}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight truncate">
                    {formData.name || 'Institution Name Preview'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {[formData.city, formData.state].filter(Boolean).join(', ') ||
                        'City / State unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Cohorts Summary */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold mt-0.5 ${
                      formData.status === 'active' ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        formData.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {formData.status === 'active' ? 'Active Partner' : 'On-Hold'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Workspace
                  </span>
                  <span className="text-xs font-bold text-blue-900 mt-0.5 block">
                    Dedicated Portal
                  </span>
                </div>
              </div>

              {/* SPOC Contact Preview */}
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900/60 block">
                  Coordinator Liaison
                </span>
                <div className="font-bold text-xs text-slate-900 truncate">
                  {formData.contactName || 'Dr. Coordinator Name (SPOC)'}
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{formData.contactEmail || 'coordinator@college.edu.in'}</span>
                </div>
                {formData.contactPhone && (
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{formData.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. ONBOARDING CHECKLIST / NEXT STEPS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>What unlocks upon registration?</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-[#0A3A7A] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>Immediate ability to schedule multi-week cohorts &amp; batches.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-[#0A3A7A] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>Direct student roster CSV upload &amp; roll-number mapping.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-[#0A3A7A] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>Coordinator login credentials provisioned for Partner Portal.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
