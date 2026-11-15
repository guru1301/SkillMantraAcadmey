'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { BRAND_INFO, PROGRAMS_DATA } from '@/data/siteData';
import { getApiUrl } from '@/lib/api/config';

function ContactFormContent() {
  const searchParams = useSearchParams();
  const initialCourse = searchParams?.get('course') || 'Web & Full Stack Development';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    course: initialCourse,
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const courseParam = searchParams?.get('course');
    if (courseParam) {
      setFormData((prev) => ({ ...prev, course: courseParam }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setStatus('error');
      setErrorMessage('Please fill in your Full Name, Phone / WhatsApp Number, and Email Address.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    const payload = {
      name: formData.name.trim(),
      designation: 'Prospective Learner',
      organization: 'Skillthinker Enrollee',
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      requirement_type: 'Course Enquiry',
      area_of_interest: formData.course,
      message: formData.message.trim() || `Course Enquiry for ${formData.course}.`,
    };

    try {
      const response = await fetch(getApiUrl('/inquiries'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        if (response.status === 429) {
          setStatus('error');
          setErrorMessage('Too many inquiries received from this connection. Please try again shortly or contact via WhatsApp.');
        } else {
          setStatus('success');
        }
      }
    } catch {
      setStatus('success');
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Skillthinker Solutions H274 First Floor Phase 1 Anna Nagar Trichy 620026'
  )}`;

  return (
    <section id="contact" className="py-10 sm:py-12 lg:py-14 bg-[#FBFDFF] border-b border-slate-200 select-none relative overflow-hidden">
      {/* Subtle Luminous Ambient Background Waves */}
      <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-blue-100/35 rounded-full blur-3xl pointer-events-none -mr-32 -mt-16" aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/2 left-0 w-[320px] h-[320px] bg-amber-50/40 rounded-full blur-3xl pointer-events-none -ml-16" aria-hidden="true" />

      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ── 2-COLUMN BALANCED COMPOSITION (Left ~40%, Right ~60%) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
          
          {/* ── LEFT COLUMN: Contact Information (~40%) ── */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-4 sm:space-y-5">
            
            {/* Header Block */}
            <div>
              {/* Overline with Amber Accent Dash */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-0.5 rounded-full bg-[#FCAF0A]" />
                <span className="text-[10.5px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#06284F]">
                  CONTACT US
                </span>
              </div>

              {/* Master Heading */}
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-black text-[#06284F] tracking-tight leading-[1.14]">
                Ready to start your <br />
                <span className="text-[#1548AE]">learning journey?</span>
              </h2>

              {/* Description */}
              <p className="text-slate-600 text-xs sm:text-[13.5px] font-normal leading-relaxed mt-2.5 max-w-md">
                Have questions about our courses, training programs, fees, schedules, or career opportunities? Our team is here to help you find the right learning path.
              </p>
            </div>

            {/* 3 Refined Contact-Information Panels */}
            <div className="space-y-2.5">
              
              {/* Panel 1: CALL US */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3 transition-all hover:border-amber-300 hover:shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-[#FEF7E6] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4 text-[#D97706]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide block">
                    Call Us
                  </span>
                  <a
                    href={`tel:${BRAND_INFO.contactPhone.replace(/\s+/g, '')}`}
                    className="text-sm sm:text-[15px] font-extrabold text-[#06284F] hover:text-[#1548AE] transition-colors block leading-tight mt-0.5"
                  >
                    {BRAND_INFO.contactPhone}
                  </a>
                  <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                    Mon–Sat, 9:30 AM – 6:00 PM
                  </span>
                </div>
              </div>

              {/* Panel 2: EMAIL US */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3 transition-all hover:border-blue-300 hover:shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-[#EBF2FE] text-[#0A3A7A] flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-[#0A3A7A]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide block">
                    Email Us
                  </span>
                  <a
                    href={`mailto:${BRAND_INFO.contactEmail}`}
                    className="text-sm sm:text-[15px] font-extrabold text-[#06284F] hover:text-[#1548AE] transition-colors block leading-tight mt-0.5"
                  >
                    {BRAND_INFO.contactEmail}
                  </a>
                  <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                    We respond within 24 hours
                  </span>
                </div>
              </div>

              {/* Panel 3: VISIT US */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3 transition-all hover:border-purple-300 hover:shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide block">
                    Visit Us
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-[#06284F] block mt-0.5 leading-snug">
                    H274, First Floor, Phase 1, Anna Nagar, <br />
                    Trichy – 620026
                  </span>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1548AE] hover:underline mt-1 cursor-pointer"
                  >
                    <span>View on map</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#1548AE]" />
                  </a>
                </div>
              </div>

            </div>

            {/* Prominent WhatsApp Contact Action */}
            <div>
              <a
                href={BRAND_INFO.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#0F8A5F] hover:bg-[#0D7A53] text-white transition-all shadow-xs hover:shadow-md cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-white shrink-0" />
                  <span className="text-xs sm:text-[13px] font-bold tracking-tight">
                    Chat with us on WhatsApp
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs sm:text-[13px] font-bold tracking-tight">
                  <span className="opacity-95">{BRAND_INFO.contactPhone}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>

          </div>

          {/* ── RIGHT COLUMN: Refined Enquiry Form Panel (~60%) ── */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/40 p-5 sm:p-6 lg:p-7">
            
            {/* Form Header */}
            <div className="flex items-center gap-3.5 mb-4 pb-3.5 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#EBF2FE] flex items-center justify-center text-[#0A3A7A] shrink-0">
                <MessageSquare className="w-5 h-5 text-[#0A3A7A]" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#06284F] tracking-tight leading-tight">
                  Send Us an Enquiry
                </h3>
                <p className="text-[11.5px] sm:text-xs text-slate-500 mt-0.5 font-normal">
                  Fill in the details below and our team will get in touch with you.
                </p>
              </div>
            </div>

            {/* Success State */}
            {status === 'success' ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-extrabold text-[#06284F]">
                  Enquiry Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to Skillthinker Solutions. An academic advisor will contact you within 24 hours with complete curriculum details and fee schedules.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('idle');
                      setFormData({
                        name: '',
                        phone: '',
                        email: '',
                        course: initialCourse,
                        message: '',
                      });
                    }}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#06284F] hover:bg-[#041B37] text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <span>Submit Another Enquiry</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
                
                {/* Error Banner */}
                {status === 'error' && errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Row 1: Full Name & Phone/WhatsApp Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label htmlFor="contact-name" className="block text-xs font-bold text-[#06284F]">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Anand Kumar"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-[13px] font-medium focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/10 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  {/* Phone / WhatsApp */}
                  <div className="space-y-1">
                    <label htmlFor="contact-phone" className="block text-xs font-bold text-[#06284F]">
                      Phone / WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      name="phone"
                      required
                      placeholder="e.g. +91 94426 05096"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-[13px] font-medium focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/10 outline-none transition-all shadow-2xs"
                    />
                  </div>

                </div>

                {/* Row 2: Email Address & Course Interested In */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  
                  {/* Email Address */}
                  <div className="space-y-1">
                    <label htmlFor="contact-email" className="block text-xs font-bold text-[#06284F]">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. anand@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-[13px] font-medium focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/10 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  {/* Course Interested In */}
                  <div className="space-y-1">
                    <label htmlFor="contact-course" className="block text-xs font-bold text-[#06284F]">
                      Course Interested In
                    </label>
                    <div className="relative">
                      <select
                        id="contact-course"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        className="w-full h-10 px-3.5 pr-9 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs sm:text-[13px] font-medium focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/10 outline-none transition-all shadow-2xs appearance-none cursor-pointer"
                      >
                        {PROGRAMS_DATA.map((prog) => (
                          <option key={prog.id} value={prog.name}>
                            {prog.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                </div>

                {/* Row 3: Message (Full Width) */}
                <div className="space-y-1">
                  <label htmlFor="contact-message" className="block text-xs font-bold text-[#06284F]">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={3}
                    placeholder="Tell us about your learning goal, course query, or anything we can help with..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-[13px] font-medium focus:border-[#0A3A7A] focus:ring-2 focus:ring-[#0A3A7A]/10 outline-none transition-all shadow-2xs resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-[#06284F] hover:bg-[#041B37] text-white font-bold text-xs sm:text-[13.5px] transition-all cursor-pointer shadow-xs hover:shadow-md hover:translate-x-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    <Send className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
                    <span>{status === 'submitting' ? 'Submitting Enquiry...' : 'Submit Enquiry'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}

export default function ContactSection() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-slate-400 font-medium">
          Loading Contact Form...
        </div>
      }
    >
      <ContactFormContent />
    </Suspense>
  );
}
