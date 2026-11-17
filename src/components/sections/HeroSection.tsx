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
    <section className="relative w-full bg-[#06182B] text-white overflow-hidden flex flex-col justify-between min-h-[100dvh] lg:h-[100dvh] lg:max-h-[860px] pt-20 sm:pt-22 lg:pt-20 pb-4 sm:pb-5 select-none">
      
      {/* ── DESKTOP STAIRCASE BACKDROP (Locked within viewport, never cropped) ── */}
      <div
        className="hidden lg:block absolute right-0 top-16 bottom-20 w-[60%] xl:w-[64%] pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="relative w-full h-full flex items-center justify-end">
          
          {/* Staircase Base Image with Right Alignment */}
          <div className="relative w-full h-full max-h-[500px]">
            <Image
              src="/images/hero-staircase-base.jpg"
              alt="Skillthinker Solutions architectural staircase with stone wall branding and 5 learning steps"
              fill
              priority
              className="object-cover object-right"
              sizes="(min-width: 1024px) 64vw, 100vw"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 6%, black 16%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 6%, black 16%, black 100%)',
              }}
            />

            {/* Subtle Top & Bottom Gradient Edge Blends (Keeps Center Stone Wall & Steps 100% Bright) */}
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#06182B] to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#06182B] to-transparent pointer-events-none" />

            {/* Luminous Golden Upward-Curving Arrow SVG (Pixel-Matched to Steps) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1024 458"
              preserveAspectRatio="xMaxYMid slice"
            >
              <defs>
                <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur1" />
                  <feGaussianBlur stdDeviation="6" result="blur2" />
                  <feGaussianBlur stdDeviation="12" result="blur3" />
                  <feMerge>
                    <feMergeNode in="blur3" />
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Ambient Warm Glow Halo */}
              <path
                d="M 520 395 C 690 395 850 390 885 320 C 915 255 930 200 942 152"
                fill="none"
                stroke="#FFB000"
                strokeWidth="7"
                strokeOpacity="0.4"
                filter="url(#gold-glow)"
              />

              {/* Core Luminous Golden Path */}
              <path
                d="M 520 395 C 690 395 850 390 885 320 C 915 255 930 200 942 152"
                fill="none"
                stroke="#FFD566"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="url(#gold-glow)"
              />

              {/* Golden Arrowhead Pointing Toward Career Step */}
              <path
                d="M 944 133 L 956 158 L 944 151 L 932 158 Z"
                fill="#FFD566"
                filter="url(#gold-glow)"
              />
            </svg>
          </div>

        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER (Fits strictly inside single viewport) ── */}
      <div className="relative z-10 container-custom w-full flex-1 flex flex-col justify-between">
        
        {/* Middle Stage: Left Column Content */}
        <div className="w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 my-auto py-2">
          
          {/* Left Column: Eyebrow, Master Headline, Description & CTAs (~40% width) */}
          <div className="w-full lg:w-[44%] xl:w-[40%] flex flex-col items-start text-left shrink-0">
            
            {/* Eyebrow Label with Golden Accent Dash */}
            <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
              <span className="w-5 h-0.5 rounded-full bg-[#FFB000]" />
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#FFB000]">
                SKILLTHINKER SOLUTIONS
              </span>
            </div>

            {/* Master Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] xl:text-[46px] font-black tracking-tight leading-[1.08] text-white mb-2.5 sm:mb-3">
              The right skills<br />
              <span className="text-[#FFB000]">can transform</span><br />
              your career.
            </h1>

            {/* Supporting Description */}
            <p className="text-slate-300 text-xs sm:text-sm lg:text-[14px] leading-relaxed max-w-lg font-normal mb-4 sm:mb-5">
              Our training programs are designed to help students, graduates, and working professionals
              develop practical, industry-relevant skills and prepare for the demands of the modern workplace.
            </p>

            {/* Action Buttons Terminal */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Primary CTA: Explore Courses */}
              <Link
                href="/#programs"
                className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-[#FFB000] hover:bg-[#E59E00] text-[#06182B] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-4 h-4 text-[#06182B] stroke-[2.5]" />
              </Link>

              {/* Secondary CTA: Talk to an Advisor */}
              <button
                type="button"
                onClick={() => openModal()}
                className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl bg-transparent hover:bg-white/[0.08] border border-white/30 hover:border-white/50 text-white font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-white/80" />
                <span>Talk to an Advisor</span>
              </button>
            </div>

          </div>

          {/* Mobile & Tablet Staircase Card (Shown only on screens < lg) */}
          <div className="block lg:hidden w-full my-3 rounded-2xl overflow-hidden border border-white/10 relative aspect-[2.1/1] bg-[#031122] shadow-xl">
            <Image
              src="/images/hero-staircase-base.jpg"
              alt="Skillthinker Solutions learning journey staircase: Learn, Practice, Build, Upskill, Career"
              fill
              className="object-cover object-center"
              sizes="100vw"
            />
            {/* Luminous Curved Arrow for Mobile */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1024 458"
              preserveAspectRatio="xMidYMid slice"
            >
              <path
                d="M 500 395 C 670 395 850 390 885 320 C 915 255 930 200 942 152"
                fill="none"
                stroke="#FFD566"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 944 135 L 956 160 L 944 153 L 932 160 Z"
                fill="#FFD566"
              />
            </svg>
          </div>

        </div>

        {/* ── BOTTOM INFORMATION STRIP (Always visible inside viewport) ── */}
        <div className="w-full shrink-0 pt-2">
          <div className="w-full rounded-2xl bg-[#061D33]/90 border border-white/10 shadow-2xl backdrop-blur-md px-4 sm:px-6 py-3 sm:py-3.5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              {HERO_FEATURES.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`flex items-center gap-2.5 sm:gap-3 ${
                      index > 0 ? 'pt-2.5 sm:pt-0 sm:pl-3 lg:pl-5' : ''
                    }`}
                  >
                    {/* Icon Container with Golden Accent */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#FFB000]/10 border border-[#FFB000]/25 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#FFB000]" />
                    </div>

                    {/* Metric / Label */}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                        {item.title}
                      </div>
                      <div className="text-[10.5px] sm:text-xs text-slate-300 font-normal truncate">
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
