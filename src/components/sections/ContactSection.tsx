'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, ShieldCheck, Building2, AlertCircle } from 'lucide-react';
import { BRAND_INFO } from '@/data/siteData';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    organization: '',
    email: '',
    phone: '',
    requirementType: 'Institutional Training (Colleges)',
    areaOfInterest: 'Full-Stack Web Engineering',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!formData.name.trim() || !formData.organization.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setErrorMessage('Please complete all required fields.');
      setStatus('error');
      return;
    }

    setStatus('submitting');

    // Simulate reliable API enquiry processing
    setTimeout(() => {
      setStatus('success');
      setErrorMessage('');
    }, 1000);
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Institutional Lead Engagement
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Let&apos;s Build the Right Training Program for Your Institution or Team.
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            Whether you represent a college leadership team, academic department, training & placement cell, or corporate enterprise, we welcome the opportunity to discuss your training requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Details & Institutional Advisory (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#062F68] text-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold text-white mb-2">
                Academic & Corporate Training Directorate
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Our team assists institutions with curriculum mapping, laboratory infrastructure checklists, and semester scheduling.
              </p>

              <div className="space-y-4 text-sm text-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-800 text-[#FCAF0A] shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Direct Email
                    </span>
                    <a href={`mailto:${BRAND_INFO.contactEmail}`} className="font-medium hover:text-[#FCAF0A] transition-colors break-all">
                      {BRAND_INFO.contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-800 text-[#FCAF0A] shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Institutional Helpline
                    </span>
                    <a href={`tel:${BRAND_INFO.contactPhone}`} className="font-medium hover:text-[#FCAF0A] transition-colors">
                      {BRAND_INFO.contactPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-800 text-[#FCAF0A] shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Regional Coverage
                    </span>
                    <span className="font-medium text-slate-200">
                      {BRAND_INFO.officeLocation}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-blue-900/80">
                <div className="flex items-center gap-2 text-xs text-[#FCAF0A]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Confidential proposal review for college administrators</span>
                </div>
              </div>
            </div>

            {/* Quick Consultation Badge */}
            <div className="p-6 bg-[#F7F9FC] border border-[#E4E8EF] rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0A3A7A] uppercase tracking-wider mb-1">
                <Building2 className="w-4 h-4" />
                <span>Institutional Consultation Process</span>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                Upon receiving your form, a senior training lead will review department goals, cohort strength, and propose an initial curriculum outline within 24 to 48 hours.
              </p>
            </div>
          </div>

          {/* Form Column (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#E4E8EF] rounded-2xl p-8 shadow-sm">
              {status === 'success' ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#162033]">
                    Institutional Enquiry Registered
                  </h3>
                  <p className="text-sm text-[#667085] max-w-md mx-auto leading-relaxed">
                    Thank you, <span className="font-semibold text-slate-900">{formData.name}</span>. Your enquiry for <span className="font-semibold text-slate-900">{formData.organization}</span> has been received. Our academic coordinator will contact you via email/phone within 24–48 hours.
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setStatus('idle');
                        setFormData({
                          name: '',
                          designation: '',
                          organization: '',
                          email: '',
                          phone: '',
                          requirementType: 'Institutional Training (Colleges)',
                          areaOfInterest: 'Full-Stack Web Engineering',
                          message: '',
                        });
                      }}
                      className="px-6 py-2.5 bg-[#0A3A7A] text-white text-xs font-semibold rounded-lg hover:bg-[#062F68] transition-all cursor-pointer"
                    >
                      Submit Another Enquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Name & Designation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#162033] uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Dr. / Prof. / Mr. / Ms. Full Name"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E8EF] rounded-lg text-[#162033] focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#162033] uppercase tracking-wider mb-1.5">
                        Designation / Role *
                      </label>
                      <select
                        name="designation"
                        required
                        value={formData.designation}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E8EF] rounded-lg text-[#162033] focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A] transition-all"
                      >
                        <option value="">Select Designation</option>
                        <option value="Principal / Dean / Director">Principal / Dean / Director</option>
                        <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                        <option value="Placement / Training Officer">Placement / Training Officer</option>
                        <option value="Corporate HR / L&D Manager">Corporate HR / L&D Manager</option>
                        <option value="Academic Faculty Member">Academic Faculty Member</option>
                        <option value="Student / Research Scholar">Student / Research Scholar</option>
                        <option value="Other">Other Executive</option>
                      </select>
                    </div>
                  </div>

                  {/* Organization & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#162033] uppercase tracking-wider mb-1.5">
                        College / Organization Name *
                      </label>
                      <input
                        type="text"
                        name="organization"
                        required
                        value={formData.organization}
                        onChange={handleChange}
                        placeholder="e.g. Government College of Engineering"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E8EF] rounded-lg text-[#162033] focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#162033] uppercase tracking-wider mb-1.5">
                        Official / Professional Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@institution.edu.in"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E8EF] rounded-lg text-[#162033] focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A] transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone & Requirement Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#162033] uppercase tracking-wider mb-1.5">
                        Contact / Mobile Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E8EF] rounded-lg text-[#162033] focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#162033] uppercase tracking-wider mb-1.5">
                        Requirement Type *
                      </label>
                      <select
                        name="requirementType"
                        value={formData.requirementType}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E8EF] rounded-lg text-[#162033] focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A] transition-all"
                      >
                        <option value="Institutional Training (Colleges)">Institutional Training (Colleges)</option>
                        <option value="Faculty Development Program (FDP)">Faculty Development Program (FDP)</option>
                        <option value="Student Technical Workshop">Student Technical Workshop</option>
                        <option value="Corporate Upskilling">Corporate Upskilling</option>
                        <option value="Pre-Placement Bootcamp">Pre-Placement Bootcamp</option>
                        <option value="Institutional MoU / Partnership">Institutional MoU / Partnership</option>
                        <option value="General Information">General Information</option>
                      </select>
                    </div>
                  </div>

                  {/* Area of Interest */}
                  <div>
                    <label className="block text-xs font-semibold text-[#162033] uppercase tracking-wider mb-1.5">
                      Domain / Area of Interest
                    </label>
                    <select
                      name="areaOfInterest"
                      value={formData.areaOfInterest}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E8EF] rounded-lg text-[#162033] focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A] transition-all"
                    >
                      <option value="Full-Stack Web Engineering">Full-Stack Web Engineering (React / Node / APIs)</option>
                      <option value="Data Analytics & Applied Python">Data Analytics & Applied Python (EDA / Power BI)</option>
                      <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                      <option value="Cloud Infrastructure & DevOps">Cloud Infrastructure & DevOps (AWS / Docker)</option>
                      <option value="Cybersecurity & Network Defense">Cybersecurity & Network Defense</option>
                      <option value="Professional & Placement Readiness">Professional & Placement Readiness</option>
                      <option value="Multi-disciplinary / Customized Track">Multi-disciplinary / Customized Track</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-[#162033] uppercase tracking-wider mb-1.5">
                      Message / Approximate Batch Size / Specific Goals
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please mention your prospective schedule (e.g. November 2026), approximate student/faculty count, and any specific objectives..."
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E4E8EF] rounded-lg text-[#162033] focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A] transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-sm px-8 py-3.5 rounded-lg shadow-sm transition-all border border-[#0A3A7A] cursor-pointer disabled:opacity-70"
                    >
                      {status === 'submitting' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Processing Enquiry...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Institutional Enquiry</span>
                          <Send className="w-4 h-4 text-[#FCAF0A]" />
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400 block sm:inline sm:ml-4 mt-2 sm:mt-0">
                      * Privacy guaranteed. No spam or commercial data sharing.
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
