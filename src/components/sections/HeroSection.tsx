'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Layers, Laptop, Medal, ShieldCheck } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

const HERO_FEATURES = [
  {
    icon: Layers,
    title: '10',
    subtitle: 'Industry-Relevant Programs',
  },
  {
    icon: Laptop,
    title: 'Hands-On',
    subtitle: 'Projects & Real-World Learning',
  },
  {
    icon: Medal,
    title: '3 Certificate Tiers',
    subtitle: 'Bronze to Gold',
  },
  {
    icon: ShieldCheck,
    title: '100% Verifiable',
    subtitle: 'Digital Certificates',
  },
];

export default function HeroSection() {
  const { openModal } = useAdvisorModal();

  return (
    <section className="relative w-full bg-[#031222] text-white overflow-hidden flex flex-col justify-between min-h-[100dvh] lg:h-[100dvh] lg:max-h-[860px] pt-20 sm:pt-22 lg:pt-20 pb-4 sm:pb-5 select-none">
      
      {/* ── CINEMATIC MASTER BACKGROUND (Unified scene with fine edge gradient blending) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none" aria-hidden="true">
        <Image
          src="/images/hero-cinematic-master.webp"
          alt="Skillthinker Solutions learning journey: Learn, Practice, Build, Upskill, Career"
          fill
          priority
          className="object-cover object-right lg:object-center"
          sizes="100vw"
        />
        {/* Fine Ambient Atmospheric Vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#031222]/90 via-[#031222]/30 to-transparent pointer-events-none" />
      </div>

      {/* ── MAIN CONTENT CONTAINER (Strictly inside single viewport) ── */}
      <div className="relative z-10 container-custom w-full flex-1 flex flex-col justify-between">
        
        {/* Middle Stage: Left Column Content (Overlays the smooth navy region) */}
        <div className="w-full flex-1 flex items-center justify-start my-auto py-2">
          
          {/* Left Column: Eyebrow, Master Headline, Description & CTAs */}
          <div className="w-full lg:w-[48%] xl:w-[44%] flex flex-col items-start text-left shrink-0">
            
            {/* Eyebrow Label with Golden Accent Dash */}
            <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
              <span className="w-6 h-0.5 rounded-full bg-[#FFB000]" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#FFB000]">
                SKILLTHINKER SOLUTIONS
              </span>
            </div>

            {/* Master Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[52px] font-black tracking-tight leading-[1.08] text-white mb-3.5 sm:mb-4 drop-shadow-sm">
              The right skills<br />
              <span className="text-[#FFB000]">can transform</span><br />
              your career.
            </h1>

            {/* Supporting Description */}
            <p className="text-slate-200/90 text-xs sm:text-sm lg:text-[14.5px] leading-relaxed max-w-lg font-normal mb-5 sm:mb-6">
              Our training programs are designed to help students, graduates, and working professionals
              develop practical, industry-relevant skills and prepare for the demands of the modern workplace.
            </p>

            {/* Action Buttons Terminal: Pill Buttons Matching Reference */}
            <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              {/* Primary CTA: Explore Courses */}
              <Link
                href="/#programs"
                className="h-12 px-7 rounded-full bg-[#FFB000] hover:bg-[#E59E00] text-[#06182B] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-4 h-4 text-[#06182B] stroke-[2.5]" />
              </Link>

              {/* Secondary CTA: Talk to an Advisor */}
              <button
                type="button"
                onClick={() => openModal()}
                className="h-12 px-6 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/25 hover:border-white/50 text-white font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer backdrop-blur-xs"
              >
                <MessageSquare className="w-4 h-4 text-white/85" />
                <span>Talk to an Advisor</span>
              </button>
            </div>

          </div>

        </div>

        {/* ── BOTTOM INFORMATION STRIP (Bare line icons, minimal luxury design) ── */}
        <div className="w-full shrink-0 pt-2">
          <div className="w-full rounded-2xl bg-[#041527]/85 border border-white/10 shadow-2xl backdrop-blur-md px-5 sm:px-7 py-3.5 sm:py-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              {HERO_FEATURES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`flex items-center gap-3 sm:gap-3.5 ${
                      index > 0 ? 'pt-3 sm:pt-0 sm:pl-4 lg:pl-6' : ''
                    }`}
                  >
                    {/* Bare Golden Line Icon Matching Reference */}
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFB000] shrink-0 stroke-[1.8]" />

                    {/* Metric / Information */}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-300 font-normal truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
