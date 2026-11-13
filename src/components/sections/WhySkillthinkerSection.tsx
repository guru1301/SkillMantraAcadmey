'use client';

import React from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { WHY_CHOOSE_ITEMS } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function WhySkillthinkerSection() {
  const { openModal } = useAdvisorModal();

  return (
    <section id="why-skillthinker" className="py-16 lg:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Sticky Editorial Narrative (4 cols on lg) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#0A3A7A]">
              Why Choose Skillthinker Solutions
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#062551] tracking-tight leading-tight">
              The right skills can create real opportunities.
            </h2>

            <div className="w-10 h-0.5 bg-[#FCAF0A]" />

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Theoretical knowledge is only half the equation. Our curriculum is engineered around practical application, modern tools, mentor feedback, and genuine workplace readiness.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A3A7A] hover:text-[#062F68] group cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span className="underline underline-offset-4">Talk to an advisor about your goals</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Refined Architectural Index (7 cols on lg) */}
          <div className="lg:col-span-7">
            <div className="border-t border-slate-200 divide-y divide-slate-200">
              {WHY_CHOOSE_ITEMS.map((item, index) => (
                <div
                  key={item.title}
                  className="py-5 sm:py-6 group transition-colors duration-150 hover:bg-white/60 px-2 sm:px-4 rounded-md"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline">
                    <div className="sm:col-span-2 text-xs font-mono font-semibold text-slate-400 group-hover:text-[#0A3A7A] transition-colors">
                      0{index + 1} /
                    </div>
                    <div className="sm:col-span-10 space-y-1.5">
                      <h3 className="text-base font-semibold text-[#162033] tracking-tight group-hover:text-[#062551] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
