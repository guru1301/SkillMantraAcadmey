'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Phone, MessageCircle, CheckCircle2 } from 'lucide-react';
import { BRAND_INFO } from '@/data/siteData';

export default function InstitutionalChatWidget() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quickForm, setQuickForm] = useState({
    name: '',
    phone: '',
    program: 'Full Stack Development',
  });

  // Hide floating chat on admin, portal, student, trainer, and login routes
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/portal') ||
    pathname?.startsWith('/student') ||
    pathname?.startsWith('/trainer') ||
    pathname === '/login'
  ) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.phone) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
      setQuickForm({ name: '', phone: '', program: 'Full Stack Development' });
    }, 2500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-13 h-13 rounded-full bg-[#0A3A7A] hover:bg-[#062F68] text-white shadow-xl flex items-center justify-center transition-all transform hover:scale-105 border-2 border-white/90 cursor-pointer group"
          aria-label="Open Skillthinker Support & Enquiry"
        >
          <MessageSquare className="w-5 h-5 text-[#FCAF0A] group-hover:scale-110 transition-transform" />
          <span className="sr-only">Chat with Skillthinker Advisor</span>
        </button>
      )}

      {/* Quick Enquiry Pop-up Window */}
      {isOpen && (
        <div className="w-[320px] sm:w-[350px] bg-white rounded-2xl shadow-2xl border border-[#E4E8EF] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-[#062F68] text-white p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A]">
                Skillthinker Advisor
              </h4>
              <span className="text-[11px] text-slate-300">
                Trichy, Tamil Nadu • Live Guidance
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white p-1 rounded-md"
              aria-label="Close widget"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 text-xs space-y-3">
            {/* Quick WhatsApp Action */}
            <a
              href={BRAND_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp (+91 94426 05096)</span>
            </a>

            <div className="flex items-center gap-2 my-2">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Or Request Callback</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {submitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h5 className="font-bold text-slate-900 text-sm">Callback Requested</h5>
                <p className="text-slate-600 text-[11px]">
                  An advisor will reach out to you shortly on WhatsApp / Phone.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={quickForm.name}
                    onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4E8EF] rounded-lg text-slate-900 text-xs focus:border-[#0A3A7A] focus:outline-none"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Phone / WhatsApp Number *"
                    value={quickForm.phone}
                    onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4E8EF] rounded-lg text-slate-900 text-xs focus:border-[#0A3A7A] focus:outline-none"
                  />
                </div>

                <div>
                  <select
                    value={quickForm.program}
                    onChange={(e) => setQuickForm({ ...quickForm, program: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4E8EF] rounded-lg text-slate-900 text-xs focus:border-[#0A3A7A] focus:outline-none bg-white"
                  >
                    <option value="Full Stack Development">Web &amp; Full Stack Development</option>
                    <option value="Aptitude & Placement">Aptitude &amp; Placement Training</option>
                    <option value="Data Analytics & BI">Data Analytics &amp; BI</option>
                    <option value="AI & Emerging Tech">AI &amp; Emerging Technologies</option>
                    <option value="Python Programming">Python Programming</option>
                    <option value="Java Programming">Java Programming</option>
                    <option value=".NET Development">.NET Development</option>
                    <option value="Programming Fundamentals">Programming Fundamentals</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Request Fast Callback
                </button>

                <div className="pt-2 text-center text-[10px] text-slate-400">
                  <a href={`tel:${BRAND_INFO.contactPhone.replace(/\s+/g, '')}`} className="hover:text-slate-700 inline-flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#0A3A7A]" /> Call us: {BRAND_INFO.contactPhone}
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
