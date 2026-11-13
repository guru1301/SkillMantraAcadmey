'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, LogIn, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { LEARNING_JOURNEY } from '@/data/siteData';

export default function LearningJourneySection() {
  return (
    <section id="journey" className="relative py-24 lg:py-32 bg-[#041427] text-white overflow-hidden">
      {/* Background ambient grid */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#0A3A7A]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container-custom">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCAF0A]/10 border border-[#FCAF0A]/30 text-[#FCAF0A] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured Progression</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            From enrollment to certificate,<br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCAF0A] to-[#F5A800]">
              step by step.
            </span>
          </h2>
          <div className="h-1 w-16 bg-[#FCAF0A] mt-4 rounded-full" />
          <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-2xl font-normal leading-relaxed">
            Our 5-stage learning progression ensures every learner acquires deep conceptual foundation, builds verified project repositories, and graduates with verifiable credential proof.
          </p>
        </div>

        {/* 5-Step Connected Pipeline */}
        <div className="relative mb-16">
          {/* Desktop Connecting Circuit Line */}
          <div className="hidden lg:block absolute top-10 left-10 right-10 h-0.5 bg-gradient-to-r from-[#FCAF0A]/20 via-[#FCAF0A] to-[#FCAF0A]/20 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4 relative z-10">
            {LEARNING_JOURNEY.map((step, i) => (
              <div
                key={step.step}
                className="p-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#FCAF0A]/40 backdrop-blur-md transition-all group hover:-translate-y-1 shadow-lg"
              >
                {/* Step badge */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A3A7A] to-[#041427] border-2 border-[#FCAF0A] flex items-center justify-center text-[#FCAF0A] font-mono font-black text-xl mb-5 shadow-md group-hover:scale-105 transition-transform">
                  {step.step}
                </div>

                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FCAF0A] mb-1">
                  Stage 0{i + 1}
                </div>

                <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#FCAF0A] transition-colors leading-snug">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Portal Access Callout Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#06284F] via-[#0A3A7A] to-[#041427] border border-white/20 p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>For Registered Learners &amp; Alumni</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Ready to validate your assessment or verify a certificate?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Enrolled students can log in to take scheduled module assessments, download study resources, or verify official certificates with digital ID credentials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FCAF0A] hover:bg-[#FDBE2E] text-[#041427] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Student / Trainer Portal</span>
            </Link>

            <Link
              href="/verify"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white font-semibold text-xs sm:text-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify Certificate</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
