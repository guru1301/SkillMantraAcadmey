'use client';

import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { FAQS_DATA } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const { openModal } = useAdvisorModal();

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-16 lg:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Context & Support (4 cols on lg) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#0A3A7A]">
              Frequently Asked Questions
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#062551] tracking-tight leading-tight">
              Common questions, answered.
            </h2>
            <div className="w-10 h-0.5 bg-[#FCAF0A]" />
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Find clear answers regarding prerequisites, eligibility, hands-on projects, batch formats, and certification.
            </p>

            <div className="pt-3">
              <div className="text-xs text-slate-500 mb-2">Have a specific question not listed here?</div>
              <button
                type="button"
                onClick={() => openModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Talk to an Advisor</span>
              </button>
            </div>
          </div>

          {/* Right Column: Clean Accordion with Hairline Dividers (8 cols on lg) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200">
            {FAQS_DATA.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} className="transition-colors">
                  <button
                    type="button"
                    id={`faq-btn-${faq.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${faq.id}`}
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors focus:outline-none focus-visible:bg-slate-50"
                  >
                    <span className="text-sm sm:text-base font-semibold text-[#162033] tracking-tight pr-2">
                      {faq.question}
                    </span>
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border border-slate-200 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-slate-100' : 'bg-white'
                      }`}
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-panel-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-btn-${faq.id}`}
                      className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal"
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
