'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, LogIn, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { LEARNING_JOURNEY } from '@/data/siteData';

export default function LearningJourneySection() {
  return (
    <section id="journey" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-slate-200">
      <div className="container-custom">
        
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0A3A7A] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
            <span>Structured Progression</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-tight">
            From enrollment to certificate,<br className="hidden lg:block" />
            <span className="text-[#0A3A7A]">step by step.</span>
          </h2>
          <div className="w-12 h-1 bg-[#FCAF0A] mt-4 rounded-full" />
          <p className="text-slate-600 text-base mt-4 max-w-2xl font-normal leading-relaxed">
            Our 5-stage learning progression ensures every learner acquires deep conceptual foundation, builds verified project repositories, and graduates with verifiable credential proof.
          </p>
        </div>

        {/* 5-Step Connected Pipeline */}
        <div className="relative mb-14">
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-10 left-10 right-10 h-0.5 bg-slate-200 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4 relative z-10">
            {LEARNING_JOURNEY.map((step, i) => (
              <div
                key={step.step}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-md transition-all group hover:-translate-y-1"
              >
                {/* Step badge */}
                <div className="w-14 h-14 rounded-2xl bg-[#06284F] text-[#FCAF0A] font-mono font-black text-xl flex items-center justify-center mb-5 shadow-xs group-hover:bg-[#0A3A7A] transition-colors">
                  {step.step}
                </div>

                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0A3A7A] mb-1">
                  Stage 0{i + 1}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-[#0A3A7A] transition-colors leading-snug">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Portal Access Callout Banner */}
        <div className="rounded-2xl bg-white border border-slate-200 p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0A3A7A] mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>For Registered Learners &amp; Alumni</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#06284F] tracking-tight">
              Ready to validate your assessment or verify a certificate?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
              Enrolled students can log in to take scheduled module assessments, download study resources, or verify official certificates with digital ID credentials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#06284F] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Student / Trainer Portal</span>
            </Link>

            <Link
              href="/verify"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verify Certificate</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
