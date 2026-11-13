'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, LogIn } from 'lucide-react';
import { LEARNING_JOURNEY } from '@/data/siteData';

export default function LearningJourneySection() {
  return (
    <section id="journey" className="py-16 lg:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="container-custom">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 lg:mb-16">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#0A3A7A] mb-2">
            The Learning Methodology
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#062551] tracking-tight leading-tight">
            From enrollment to certificate, step by step.
          </h2>
          <div className="w-10 h-0.5 bg-[#FCAF0A] mt-3" />
          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed font-normal">
            A simple, structured progression — so you always know what&apos;s next on your path to job readiness.
          </p>
        </div>

        {/* 5-Step Continuous Timeline Pipeline */}
        <div className="relative mb-14">
          {/* Subtle connecting line across desktop */}
          <div className="hidden lg:block absolute top-7 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
            {LEARNING_JOURNEY.map((step) => (
              <div
                key={step.step}
                className="bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-md bg-[#062551] text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                    0{step.step}
                  </div>

                  <h3 className="text-base font-bold text-[#162033] tracking-tight">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Step 0{step.step} of 05
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Assessment & Verification Banner */}
        <div className="p-6 sm:p-8 rounded-lg bg-[#062551] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#FCAF0A]">
              Enrolled Students &amp; Certificate Holders
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Ready to validate your technical competency?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Take your online course assessment using your batch access code or verify authentic certificates online.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#FCAF0A] hover:bg-[#e09b00] text-[#062551] text-xs font-bold transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Assessment Portal</span>
            </Link>

            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-blue-900/60 hover:bg-blue-900 text-white border border-blue-800 text-xs font-semibold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Verify Certificate</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
