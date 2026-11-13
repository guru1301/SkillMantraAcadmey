'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageCircle, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { PROGRAMS_DATA, BRAND_INFO } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function HeroSection() {
  const { openModal } = useAdvisorModal();
  const featuredPrograms = PROGRAMS_DATA.slice(0, 6);

  return (
    <section className="relative min-h-[90vh] lg:h-screen lg:min-h-[800px] lg:max-h-[960px] bg-[#041427] text-white overflow-hidden flex flex-col justify-between pt-24 lg:pt-28">
      {/* Background cinematic photograph with multi-layer deep gradient */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-training.jpg"
          alt="Skillthinker Solutions live training classroom — Anna Nagar, Trichy"
          fill
          priority
          className="object-cover object-center brightness-75 scale-105"
          sizes="100vw"
        />
        {/* Cinematic atmospheric overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#031122]/98 via-[#051C38]/92 to-[#041427]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041427] via-transparent to-[#031122]/80" />
        <div className="absolute inset-0 bg-tech-grid opacity-25" />
      </div>

      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0A3A7A]/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#FCAF0A]/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Primary Hero Stage */}
      <div className="relative z-10 container-custom flex-1 flex flex-col justify-center py-12 lg:py-16">
        <div className="max-w-3xl xl:max-w-4xl">
          
          {/* Official Location & Campus Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FCAF0A] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FCAF0A]" />
            </span>
            <MapPin className="w-3.5 h-3.5 text-[#FCAF0A]" />
            <span className="text-xs font-semibold tracking-wide text-white/90">
              Anna Nagar, Trichy Campus
            </span>
            <span className="text-white/30">•</span>
            <span className="text-xs font-medium text-white/70">
              Admissions Open 2026
            </span>
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.08] text-white mb-6">
            The right skills<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCAF0A] via-[#FDC34E] to-[#F5A800]">
              can transform
            </span><br />
            your career.
          </h1>

          {/* Core Verified Narrative */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-300/90 leading-relaxed max-w-2xl font-normal mb-9">
            Practical, industry-relevant training for students, fresh graduates, and working professionals — engineered by seasoned mentors at Trichy&apos;s premier skills academy.
          </p>

          {/* Action Button Terminal */}
          <div className="flex flex-wrap items-center gap-4 mb-12">
            <Link
              href="/#programs"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#FCAF0A] to-[#E59B00] hover:from-[#FDBE2E] hover:to-[#FCAF0A] text-[#041427] font-bold text-sm shadow-lg shadow-[#FCAF0A]/20 hover:shadow-[#FCAF0A]/40 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>Explore All 10 Tracks</span>
              <ArrowRight className="w-4 h-4 text-[#041427]" />
            </Link>

            <button
              type="button"
              onClick={() => openModal()}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all hover:-translate-y-0.5 cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-[#FCAF0A]" />
              <span>Talk to an Advisor</span>
            </button>

            <Link
              href="/verify"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-transparent hover:bg-white/[0.05] text-white/75 hover:text-white font-medium text-sm transition-colors border border-transparent hover:border-white/10"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify Credential</span>
            </Link>
          </div>

          {/* Interactive Program Selector Pills */}
          <div className="pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Specialized Technical Disciplines</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {featuredPrograms.map((prog) => (
                <Link
                  key={prog.id}
                  href="/#programs"
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-[#0A3A7A]/80 border border-white/10 hover:border-[#FCAF0A]/40 text-xs text-slate-200 hover:text-white transition-all backdrop-blur-sm"
                >
                  {prog.name}
                </Link>
              ))}
              <Link
                href="/#programs"
                className="px-3.5 py-1.5 rounded-lg bg-[#FCAF0A]/10 hover:bg-[#FCAF0A]/20 border border-[#FCAF0A]/30 text-xs font-semibold text-[#FCAF0A] transition-colors flex items-center gap-1"
              >
                <span>View All 10 Tracks</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Live Metrics & Accreditation Ribbon */}
      <div className="relative z-10 border-t border-white/10 bg-[#030F1D]/80 backdrop-blur-md">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10 py-4">
            
            <div className="py-3 px-4 flex items-center gap-3.5">
              <div className="text-2xl sm:text-3xl font-black text-[#FCAF0A] font-mono">10</div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Programs</div>
                <div className="text-[11px] text-slate-400">Industry-aligned curricula</div>
              </div>
            </div>

            <div className="py-3 px-4 flex items-center gap-3.5">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">5-Step</div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Learning Journey</div>
                <div className="text-[11px] text-slate-400">Theory to live project</div>
              </div>
            </div>

            <div className="py-3 px-4 flex items-center gap-3.5">
              <div className="text-2xl sm:text-3xl font-black text-[#FCAF0A] font-mono">3 Tiers</div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Certification</div>
                <div className="text-[11px] text-slate-400">Gold, Silver & Bronze merit</div>
              </div>
            </div>

            <div className="py-3 px-4 flex items-center gap-3.5">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">100%</div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Verifiable</div>
                <div className="text-[11px] text-slate-400">Online encrypted ID check</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
