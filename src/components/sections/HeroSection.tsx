'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageCircle, MapPin, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { PROGRAMS_DATA } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function HeroSection() {
  const { openModal } = useAdvisorModal();
  const featuredPrograms = PROGRAMS_DATA.slice(0, 5);

  return (
    <section className="relative bg-gradient-to-b from-slate-50/70 via-white to-white pt-28 pb-16 lg:pt-36 lg:pb-24 border-b border-slate-200/80 overflow-hidden">
      <div className="container-custom">
        
        {/* 2-Column Balanced Hero Composition (Eliminates all empty white space) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Core Narrative & Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Location Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0A3A7A] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#FCAF0A] animate-pulse" />
              <MapPin className="w-3.5 h-3.5 text-[#0A3A7A]" />
              <span>Anna Nagar, Trichy Campus</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">Admissions Open 2026</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#06284F] tracking-tight leading-tight">
              The right skills <br />
              <span className="text-[#0A3A7A]">can transform</span> <br />
              your career.
            </h1>

            {/* Narrative text */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              Practical, industry-relevant training for students, fresh graduates, and working professionals — engineered by seasoned mentors at Trichy&apos;s premier skills academy.
            </p>

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/#programs"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FCAF0A] hover:bg-[#F5A800] text-[#06284F] font-bold text-sm shadow-xs hover:shadow-sm transition-all"
              >
                <span>Explore All 10 Tracks</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-[#06284F] font-bold text-sm shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#0A3A7A]" />
                <span>Talk to an Advisor</span>
              </button>

              <Link
                href="/verify"
                className="inline-flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verify Credential</span>
              </Link>
            </div>

            {/* Technical Disciplines Badges */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
                <span>Popular Technical Disciplines</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {featuredPrograms.map((prog) => (
                  <Link
                    key={prog.id}
                    href="/#programs"
                    className="px-3 py-1.5 rounded-lg bg-slate-100/80 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-xs text-slate-700 hover:text-[#0A3A7A] font-medium transition-all"
                  >
                    {prog.name}
                  </Link>
                ))}
                <Link
                  href="/#programs"
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-xs font-bold text-[#0A3A7A] hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <span>+5 more</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>

          {/* Right Column: High-Impact Visual Frame (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl bg-white p-2">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/4] bg-slate-100">
                <Image
                  src="/images/hero-training.jpg"
                  alt="Skillthinker live training classroom in Anna Nagar, Trichy"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06284F]/80 via-transparent to-transparent" />

                {/* Inset Bottom Label */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#06284F]">
                      Trichy Learning Laboratory
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Live Classroom &amp; Dedicated Lab Mentors
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Active
                  </span>
                </div>
              </div>

              {/* Floating Top Badge */}
              <div className="absolute -top-3 -right-3 p-3 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">3 Merit Tiers</div>
                  <div className="text-[10px] text-slate-500">Gold, Silver, Bronze</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Metrics Bar */}
        <div className="mt-14 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
              <div className="text-3xl font-black text-[#0A3A7A] font-mono">10</div>
              <div>
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Programs</div>
                <div className="text-[11px] text-slate-500">Industry-aligned curricula</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
              <div className="text-3xl font-black text-[#06284F] font-mono">5-Step</div>
              <div>
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Learning Journey</div>
                <div className="text-[11px] text-slate-500">Theory to live project</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
              <div className="text-3xl font-black text-[#FCAF0A] font-mono">3 Tiers</div>
              <div>
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Certification</div>
                <div className="text-[11px] text-slate-500">Merit qualification levels</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5">
              <div className="text-3xl font-black text-emerald-600 font-mono">100%</div>
              <div>
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Verifiable</div>
                <div className="text-[11px] text-slate-500">Online encrypted ID check</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
