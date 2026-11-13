'use client';

import React, { useState } from 'react';
import { ChevronDown, MessageCircle, HelpCircle } from 'lucide-react';
import { FAQS_DATA } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const { openModal } = useAdvisorModal();

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-slate-200">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left Column: Context & Support Desk (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0A3A7A] text-xs font-semibold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Learner Support</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-tight">
              Common questions, <span className="text-[#0A3A7A]">answered.</span>
            </h2>

            <div className="w-12 h-1 bg-[#FCAF0A] rounded-full" />

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              Find transparent answers regarding eligibility, prerequisites, batch formats, laboratory projects, and official certificate verification.
            </p>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Need immediate guidance?
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our admissions advisors in Anna Nagar, Trichy can walk you through course syllabus, fees, and next batch timings.
              </p>
              <button
                type="button"
                onClick={() => openModal()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#06284F] text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Talk to an Advisor</span>
              </button>
            </div>
          </div>

          {/* Right Column: Clean White Accordion (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            {FAQS_DATA.map((faq, i) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden transition-all"
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
                      <span className="text-xs font-mono font-bold text-[#0A3A7A]">
                        0{i + 1}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                        {faq.question}
                      </span>
                    </div>

                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-blue-50 border-blue-300 text-[#0A3A7A]' : 'bg-slate-50 text-slate-500'
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
                      className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal border-t border-slate-100 pt-4"
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
