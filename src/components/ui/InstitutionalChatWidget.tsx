'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, X, Send, Phone, Mail, Building, CheckCircle2 } from 'lucide-react';
import { BRAND_INFO } from '@/data/siteData';

export default function InstitutionalChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quickForm, setQuickForm] = useState({
    collegeName: '',
    contactName: '',
    phone: '',
    queryType: 'Institutional Training / MoU',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.collegeName || !quickForm.phone) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
      setQuickForm({ collegeName: '', contactName: '', phone: '', queryType: 'Institutional Training / MoU' });
    }, 2500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Circle Button (Matching ICT Academy blue circle floating button!) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-[#0B4EA2] hover:bg-[#0A3A7A] text-white shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 border-2 border-white/80 cursor-pointer group"
          aria-label="Open Institutional Helpdesk"
        >
          <MessageSquare className="w-6 h-6 text-[#FCAF0A] group-hover:scale-110 transition-transform" />
          <span className="sr-only">Institutional Assistance</span>
        </button>
      )}

      {/* Quick Enquiry Pop-up Window */}
      {isOpen && (
        <div className="w-[330px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-[#E4E8EF] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-[#062F68] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-[#FCAF0A]">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Academic Helpdesk
                </h4>
                <span className="text-[10px] text-slate-300">
                  Skill Mantra Advisory Team
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 text-xs">
            {submitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h5 className="font-bold text-slate-900 text-sm">Query Received</h5>
                <p className="text-slate-600 text-[11px]">
                  Our institutional coordinator will call you back within 1 hour.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-slate-600 text-[11.5px] leading-relaxed">
                  Have an enquiry about college workshops, FDPs, or syllabus mapping? Send us a quick callback request:
                </p>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Institution / College Name *"
                    value={quickForm.collegeName}
                    onChange={(e) => setQuickForm({ ...quickForm, collegeName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4E8EF] rounded-lg text-slate-900 text-xs focus:border-[#0A3A7A] focus:outline-none"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Your Name & Designation"
                    value={quickForm.contactName}
                    onChange={(e) => setQuickForm({ ...quickForm, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4E8EF] rounded-lg text-slate-900 text-xs focus:border-[#0A3A7A] focus:outline-none"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Mobile / WhatsApp Number *"
                    value={quickForm.phone}
                    onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4E8EF] rounded-lg text-slate-900 text-xs focus:border-[#0A3A7A] focus:outline-none"
                  />
                </div>

                <div>
                  <select
                    value={quickForm.queryType}
                    onChange={(e) => setQuickForm({ ...quickForm, queryType: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E4E8EF] rounded-lg text-slate-900 text-xs focus:border-[#0A3A7A] focus:outline-none"
                  >
                    <option value="Institutional Training / MoU">College Training / MoU</option>
                    <option value="Faculty Development Program">Faculty Development (FDP)</option>
                    <option value="Student Technical Workshop">Student Coding Camp</option>
                    <option value="Corporate Upskilling">Corporate Training</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#F5A800] hover:bg-[#FCAF0A] text-[#162033] font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all"
                >
                  Request Fast Callback
                </button>

                <div className="pt-2 border-t border-[#E4E8EF] flex items-center justify-between text-[10px] text-slate-400">
                  <a href={`tel:${BRAND_INFO.contactPhone}`} className="hover:text-slate-700 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#FCAF0A]" /> {BRAND_INFO.contactPhone}
                  </a>
                  <span>Pan-India Campuses</span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
