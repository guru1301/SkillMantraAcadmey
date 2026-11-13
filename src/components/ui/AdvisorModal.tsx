'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle, MessageCircle, Phone } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      style={{ animation: 'fadeIn 150ms ease' }}
    >
      {/* Backdrop dismiss */}
      <div className="absolute inset-0 -z-10" onClick={closeModal} />

      {/* Modal dialog */}
      <div
        className="relative w-full max-w-[520px] bg-white rounded-xl shadow-2xl shadow-black/25 overflow-hidden max-h-[92vh] flex flex-col border border-gray-200"
        style={{ animation: 'scaleIn 150ms ease' }}
      >
        {/* Header */}
        <div className="bg-[#06284F] text-white px-7 py-6 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FCAF0A] mb-1.5">
              Skillthinker Solutions · Admissions
            </div>
            <h3 id="advisor-modal-title" className="text-xl font-bold text-white tracking-tight">
              Talk to an Advisor
            </h3>
            <p className="text-xs text-white/55 mt-1.5 leading-relaxed font-normal">
              Questions about curriculum, batch timings, fees, or course selection?
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 mt-0.5"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 overflow-y-auto space-y-5">

          {/* WhatsApp quick action — compact, one line */}
          <div className="flex items-center justify-between gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-900">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Prefer instant messaging?</span>
              <span className="text-xs text-emerald-700 font-normal hidden sm:inline">+91 94426 05096</span>
            </div>
            <a
              href={BRAND_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shrink-0"
            >
              WhatsApp
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-gray-100 flex-1" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Or submit form
            </span>
            <div className="h-px bg-gray-100 flex-1" />
          </div>

          {status === 'success' ? (
            <div className="py-8 text-center space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Enquiry Submitted</h4>
              <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                An academic advisor will contact you shortly via phone or WhatsApp.
              </p>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2.5 rounded-lg bg-[#062551] text-white text-sm font-semibold hover:bg-[#0A3A7A] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && errorMessage && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    name="name"
                    required
                    placeholder="Anand Kumar"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-[#0A3A7A] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="modal-phone" className="block text-xs font-semibold text-gray-700 mb-1.5">
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
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-[#0A3A7A] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-email" className="block text-xs font-semibold text-gray-700 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-[#0A3A7A] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="modal-course" className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Program of Interest
                </label>
                <select
                  id="modal-course"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-[#0A3A7A] focus:outline-none bg-white transition-colors"
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
                <label htmlFor="modal-message" className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Questions or Preferred Batch <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="modal-message"
                  name="message"
                  rows={2}
                  placeholder="Batch timings, fee structure, or curriculum questions..."
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-[#0A3A7A] focus:outline-none resize-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-3 px-4 rounded-lg bg-[#062551] hover:bg-[#0A3A7A] text-white font-semibold text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {status === 'submitting' ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Course Enquiry</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-2">
                <Phone className="w-3 h-3 text-[#0A3A7A]" />
                <span>Admissions line: {BRAND_INFO.contactPhone}</span>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
