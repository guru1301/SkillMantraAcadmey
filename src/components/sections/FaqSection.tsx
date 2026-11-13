'use client';

import React, { useState } from 'react';
import { ChevronDown, MessageCircle, Sparkles, HelpCircle } from 'lucide-react';
import { FAQS_DATA } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const { openModal } = useAdvisorModal();

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="relative py-24 lg:py-32 bg-[#041427] text-white overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#0A3A7A]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left Column: Context & Support Desk (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCAF0A]/10 border border-[#FCAF0A]/30 text-[#FCAF0A] text-xs font-semibold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Learner Support</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Common questions, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCAF0A] to-[#F5A800]">answered.</span>
            </h2>

            <div className="h-1 w-16 bg-[#FCAF0A] rounded-full" />

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              Find transparent answers regarding eligibility, prerequisites, batch formats, laboratory projects, and official certificate verification.
            </p>

            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Need immediate guidance?
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our admissions advisors in Anna Nagar, Trichy can walk you through course syllabus, fees, and next batch timings.
              </p>
              <button
                type="button"
                onClick={() => openModal()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCAF0A] hover:bg-[#FDBE2E] text-[#041427] font-bold text-xs transition-all cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Talk to an Advisor</span>
              </button>
            </div>
          </div>

          {/* Right Column: High-Contrast Dark Accordion (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            {FAQS_DATA.map((faq, i) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 overflow-hidden backdrop-blur-md transition-all"
                >
                  <button
                    type="button"
                    id={`faq-btn-${faq.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${faq.id}`}
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <span className="text-xs font-mono font-bold text-[#FCAF0A]">
                        0{i + 1}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                        {faq.question}
                      </span>
                    </div>

                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/20 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-[#FCAF0A] border-[#FCAF0A] text-[#041427]' : 'bg-white/5 text-slate-300'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-panel-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-btn-${faq.id}`}
                      className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal border-t border-white/5 pt-4"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
