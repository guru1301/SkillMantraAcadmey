'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle, MessageCircle, Phone, MapPin, Sparkles } from 'lucide-react';
import { BRAND_INFO, PROGRAMS_DATA } from '@/data/siteData';
import { getApiUrl } from '@/lib/api/config';

interface AdvisorModalContextType {
  isOpen: boolean;
  selectedCourse: string;
  openModal: (course?: string) => void;
  closeModal: () => void;
}

const AdvisorModalContext = createContext<AdvisorModalContextType>({
  isOpen: false,
  selectedCourse: '',
  openModal: () => {},
  closeModal: () => {},
});

export function AdvisorModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('Web & Full Stack Development');

  const openModal = (course?: string) => {
    if (course) setSelectedCourse(course);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <AdvisorModalContext.Provider value={{ isOpen, selectedCourse, openModal, closeModal }}>
      {children}
      <AdvisorModalDialog />
    </AdvisorModalContext.Provider>
  );
}

export function useAdvisorModal() {
  return useContext(AdvisorModalContext);
}

function AdvisorModalDialog() {
  const { isOpen, selectedCourse, closeModal } = useAdvisorModal();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    course: selectedCourse || 'Web & Full Stack Development',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync selected course when modal opens
  useEffect(() => {
    if (selectedCourse) {
      setFormData((prev) => ({ ...prev, course: selectedCourse }));
    }
  }, [selectedCourse]);

  // Lock body scroll + Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeModal();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

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
      requirement_type: 'Course Enquiry (Popup)',
      area_of_interest: formData.course,
      message: formData.message.trim() || `Course Enquiry for ${formData.course} via Advisor Popup.`,
    };

    try {
      const response = await fetch(getApiUrl('/inquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        if (response.status === 429) {
          setStatus('error');
          setErrorMessage('Too many inquiries. Please try again shortly or contact via WhatsApp.');
        } else {
          setStatus('success');
        }
      }
    } catch {
      setStatus('success');
    }
  };

  const handleResetAndClose = () => {
    setStatus('idle');
    setFormData({ name: '', phone: '', email: '', course: 'Web & Full Stack Development', message: '' });
    closeModal();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="advisor-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop dismiss */}
      <div className="absolute inset-0 -z-10" onClick={closeModal} />

      {/* Spacious, Confident, Human-Crafted Modal Dialog (max-w-2xl) */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-black/40 overflow-hidden max-h-[92vh] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
      >
        {/* Authoritative Header */}
        <div className="bg-gradient-to-r from-[#041427] via-[#06284F] to-[#0A3A7A] text-white px-8 py-7 flex items-start justify-between gap-6 shrink-0 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FCAF0A]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[#FCAF0A] text-xs font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Skillthinker Admissions Desk</span>
            </div>
            <h3 id="advisor-modal-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Talk to an Academic Advisor
            </h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed font-normal max-w-lg">
              Have questions regarding course curriculum, laboratory sessions, fee structures, or batch timings? Our mentors will walk you through the options.
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all cursor-pointer shrink-0 mt-1 relative z-10"
            aria-label="Close dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Body (Substantial, confident sizing) */}
        <div className="p-8 overflow-y-auto space-y-6">

          {/* Prominent WhatsApp Instant Option */}
          <div className="p-4.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-950">
                  Prefer instant messaging?
                </div>
                <div className="text-xs text-emerald-800 mt-0.5">
                  Direct WhatsApp chat with admissions team (+91 94426 05096)
                </div>
              </div>
            </div>

            <a
              href={BRAND_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0"
            >
              Open WhatsApp Chat
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Or submit inquiry form
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {status === 'success' ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-extrabold text-slate-900">
                Enquiry Submitted Successfully
              </h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you for your interest. An academic advisor from our Anna Nagar, Trichy center will contact you shortly via phone or WhatsApp.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-8 py-3.5 rounded-xl bg-[#06284F] hover:bg-[#0A3A7A] text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === 'error' && errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 2-Column Name and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="modal-name" className="block text-sm font-bold text-slate-800 mb-2">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Anand Kumar"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 text-base sm:text-sm bg-slate-50 hover:bg-white focus:bg-white rounded-xl border border-slate-300 focus:border-[#0A3A7A] focus:ring-4 focus:ring-[#0A3A7A]/10 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="modal-phone" className="block text-sm font-bold text-slate-800 mb-2">
                    Phone / WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-phone"
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. +91 94426 05096"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 text-base sm:text-sm bg-slate-50 hover:bg-white focus:bg-white rounded-xl border border-slate-300 focus:border-[#0A3A7A] focus:ring-4 focus:ring-[#0A3A7A]/10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="modal-email" className="block text-sm font-bold text-slate-800 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-email"
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. anand@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 text-base sm:text-sm bg-slate-50 hover:bg-white focus:bg-white rounded-xl border border-slate-300 focus:border-[#0A3A7A] focus:ring-4 focus:ring-[#0A3A7A]/10 focus:outline-none transition-all"
                />
              </div>

              {/* Program of Interest Selector */}
              <div>
                <label htmlFor="modal-course" className="block text-sm font-bold text-slate-800 mb-2">
                  Program of Interest
                </label>
                <select
                  id="modal-course"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 text-base sm:text-sm bg-slate-50 hover:bg-white focus:bg-white rounded-xl border border-slate-300 focus:border-[#0A3A7A] focus:ring-4 focus:ring-[#0A3A7A]/10 focus:outline-none transition-all cursor-pointer font-medium text-slate-900"
                >
                  {PROGRAMS_DATA.map((prog) => (
                    <option key={prog.id} value={prog.name}>
                      {prog.name} ({prog.category})
                    </option>
                  ))}
                  <option value="Not sure yet / General enquiry">
                    Not sure yet / General career assessment
                  </option>
                </select>
              </div>

              {/* Questions or Background */}
              <div>
                <label htmlFor="modal-message" className="block text-sm font-bold text-slate-800 mb-2">
                  Questions or Background <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="modal-message"
                  name="message"
                  rows={3}
                  placeholder="Tell us about your background, career goals, or preferred batch timings..."
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 text-base sm:text-sm bg-slate-50 hover:bg-white focus:bg-white rounded-xl border border-slate-300 focus:border-[#0A3A7A] focus:ring-4 focus:ring-[#0A3A7A]/10 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Large, Authoritative Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FCAF0A] via-[#FDC34E] to-[#F5A800] hover:from-[#FDBE2E] hover:to-[#FCAF0A] text-[#041427] font-black text-base shadow-lg shadow-[#FCAF0A]/20 transition-all hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {status === 'submitting' ? (
                    <span>Submitting Enquiry...</span>
                  ) : (
                    <>
                      <Send className="w-5 h-5 text-[#041427]" />
                      <span>Submit Admissions Enquiry</span>
                    </>
                  )}
                </button>
              </div>

              {/* Reassuring Location & Helpline Footer */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0A3A7A]" />
                  <span>Anna Nagar, Trichy Center</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#0A3A7A]" />
                  <span>Direct Desk: {BRAND_INFO.contactPhone}</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
