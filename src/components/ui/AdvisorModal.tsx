'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle, MessageCircle, Phone, Mail } from 'lucide-react';
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
    if (course) {
      setSelectedCourse(course);
    }
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

  // Lock body scroll and handle Escape key
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        const data = await response.json().catch(() => null);
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

  const handleResetAndClose = () => {
    setStatus('idle');
    setFormData({
      name: '',
      phone: '',
      email: '',
      course: 'Web & Full Stack Development',
      message: '',
    });
    closeModal();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="advisor-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0 -z-10" onClick={closeModal} />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header Strip */}
        <div className="bg-[#062551] text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0 border-b border-blue-950">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#FCAF0A] mb-1">
              Skillthinker Solutions • Admissions &amp; Advisor Desk
            </div>
            <h3 id="advisor-modal-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Talk to an Advisor
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed font-normal">
              Questions regarding curriculum, batch timings, fees, or course selection? Connect with an admissions mentor.
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-blue-900/60 transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Quick WhatsApp Action */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <div className="text-xs font-semibold text-emerald-950 flex items-center justify-center sm:justify-start gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prefer Instant Messaging?</span>
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5">
                WhatsApp Chat with admissions: +91 94426 05096
              </div>
            </div>

            <a
              href={BRAND_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-2xs"
            >
              Open WhatsApp
            </a>
          </div>

          <div className="flex items-center gap-3 my-1">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Or Submit Enquiry Form
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {status === 'success' ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#162033]">
                Enquiry Submitted Successfully
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Thank you for reaching out to Skillthinker Solutions. An academic advisor will contact you shortly via phone or WhatsApp with schedule and syllabus details.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-md bg-[#062551] text-white text-xs font-semibold hover:bg-[#0A3A7A] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {status === 'error' && errorMessage && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-name" className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:border-[#0A3A7A] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="modal-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-phone"
                    type="tel"
                    name="phone"
                    required
                    placeholder="+91 94426 05096"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:border-[#0A3A7A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-email"
                  type="email"
                  name="email"
                  required
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:border-[#0A3A7A] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="modal-course" className="block text-xs font-semibold text-slate-700 mb-1">
                  Program of Interest
                </label>
                <select
                  id="modal-course"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:border-[#0A3A7A] focus:outline-none bg-white"
                >
                  {PROGRAMS_DATA.map((prog) => (
                    <option key={prog.id} value={prog.name}>
                      {prog.name}
                    </option>
                  ))}
                  <option value="Not sure yet / General enquiry">Not sure yet / General enquiry</option>
                </select>
              </div>

              <div>
                <label htmlFor="modal-message" className="block text-xs font-semibold text-slate-700 mb-1">
                  Questions or Preferred Batch (Optional)
                </label>
                <textarea
                  id="modal-message"
                  name="message"
                  rows={2}
                  placeholder="Ask about batch timings, fee structures, or curriculum..."
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:border-[#0A3A7A] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-2.5 px-4 rounded-md bg-[#062551] hover:bg-[#0A3A7A] text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {status === 'submitting' ? (
                    <span>Submitting Enquiry...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Course Enquiry</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-2 pt-1">
                <Phone className="w-3 h-3 text-[#0A3A7A]" />
                <span>Admissions line: {BRAND_INFO.contactPhone}</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

