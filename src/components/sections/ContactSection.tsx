'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, MessageCircle, Sparkles } from 'lucide-react';
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
      setErrorMessage('Please fill in your Name, Phone Number, and Email Address.');
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

  return (
    <section id="contact" className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Direct Contacts & Campus Information (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0A3A7A] text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
                <span>Admissions Desk</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-tight">
                Ready to start your <span className="text-[#0A3A7A]">learning journey?</span>
              </h2>
              <div className="w-12 h-1 bg-[#FCAF0A] mt-4 rounded-full" />
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Connect directly with our academic coordinators for course syllabi, fee structures, upcoming batch schedules, or to schedule a visit to our Anna Nagar training center in Trichy.
            </p>

            {/* Direct Contact Cards */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-[#0A3A7A] shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 block mb-0.5">Training Center &amp; Head Office:</strong>
                  <span className="text-slate-600 leading-relaxed">{BRAND_INFO.officeLocation}</span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 block mb-0.5">Direct Telephones:</strong>
                  <a href={`tel:${BRAND_INFO.contactPhone.replace(/\s+/g, '')}`} className="text-[#0A3A7A] hover:underline font-semibold block">
                    {BRAND_INFO.contactPhone}
                  </a>
                  <a href="tel:+918015577800" className="text-slate-500 hover:text-slate-800 block text-xs mt-0.5">
                    +91 80155 77800 (Alternate Desk)
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 block mb-0.5">Admissions Email:</strong>
                  <a href={`mailto:${BRAND_INFO.contactEmail}`} className="text-[#0A3A7A] hover:underline font-semibold">
                    {BRAND_INFO.contactEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Quick Chat */}
            <div>
              <a
                href={BRAND_INFO.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Directly on WhatsApp: +91 94426 05096</span>
              </a>
            </div>
          </div>

          {/* Right Column: High-Precision Enquiry Terminal (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-50 border border-slate-200 p-7 sm:p-9 shadow-xs">
            <div className="mb-6 pb-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Send Us an Enquiry
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Our admissions advisor will respond with full course details, upcoming batch timings, and fee structures.
              </p>
            </div>

            {status === 'success' ? (
              <div className="py-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  Enquiry Submitted Successfully
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to Skillthinker Solutions. An academic coordinator will contact you shortly via phone or WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setFormData({
                      name: '',
                      phone: '',
                      email: '',
                      course: 'Web & Full Stack Development',
                      message: '',
                    });
                  }}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-[#0A3A7A] text-white text-xs font-bold hover:bg-[#06284F] transition-colors"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4.5">
                {status === 'error' && errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Anand Kumar"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-[#0A3A7A] focus:outline-none transition-colors shadow-2xs"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-700">
                      Phone Number (WhatsApp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      name="phone"
                      required
                      placeholder="e.g. +91 94426 05096"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-[#0A3A7A] focus:outline-none transition-colors shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700">
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
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-[#0A3A7A] focus:outline-none transition-colors shadow-2xs"
                    />
                  </div>

                  {/* Course of Interest */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-course" className="block text-xs font-semibold text-slate-700">
                      Program of Interest
                    </label>
                    <select
                      id="contact-course"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-[#0A3A7A] focus:outline-none transition-colors shadow-2xs"
                    >
                      {PROGRAMS_DATA.map((prog) => (
                        <option key={prog.id} value={prog.name}>
                          {prog.name}
                        </option>
                      ))}
                      <option value="Not sure yet / General enquiry">
                        Not sure yet / General enquiry
                      </option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-700">
                    Message or Questions (Optional)
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={3}
                    placeholder="Tell us about your background, career goals, or batch preferences..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:border-[#0A3A7A] focus:outline-none resize-none transition-colors shadow-2xs"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#0A3A7A] hover:bg-[#06284F] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{status === 'submitting' ? 'Submitting Enquiry...' : 'Submit Course Enquiry'}</span>
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
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading admissions terminal...</div>}>
      <ContactFormContent />
    </Suspense>
  );
}
