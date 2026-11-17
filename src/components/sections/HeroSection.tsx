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
    <section className="relative w-full bg-[#06182B] text-white overflow-hidden pt-24 sm:pt-28 lg:pt-28 pb-6 sm:pb-8">
      {/* ── DESKTOP STAIRCASE ARTWORK & CINEMATIC BLEND (lg and above) ── */}
      <div
        className="hidden lg:block absolute right-0 top-0 bottom-0 w-[58%] xl:w-[62%] h-full pointer-events-none select-none z-0"
        aria-hidden="true"
      >
        <div className="relative w-full h-full">
          {/* Authentic Architectural Staircase Base Image */}
          <Image
            src="/images/hero-staircase-base.jpg"
            alt="Skillthinker Solutions architectural staircase with stone wall branding and 5 learning steps"
            fill
            priority
            className="object-cover object-right-center"
            sizes="(min-width: 1024px) 62vw, 100vw"
          />

          {/* Seamless Deep Navy Gradient Blends into #06182B Background */}
          {/* Left edge blend */}
          <div className="absolute inset-y-0 left-0 w-[35%] bg-gradient-to-r from-[#06182B] via-[#06182B]/85 to-transparent" />
          {/* Top edge blend under header */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#06182B] to-transparent" />
          {/* Bottom edge blend above feature strip */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#06182B] to-transparent" />

          {/* Luminous Golden Upward-Curving Arrow Sweeping from Practice to Career */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1024 458"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur1" />
                <feGaussianBlur stdDeviation="7" result="blur2" />
                <feGaussianBlur stdDeviation="14" result="blur3" />
                <feMerge>
                  <feMergeNode in="blur3" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ambient Warm Golden Glow Halo */}
            <path
              d="M 500 395 C 670 395 850 390 885 320 C 915 255 930 200 942 152"
              fill="none"
              stroke="#FFB000"
              strokeWidth="6"
              strokeOpacity="0.45"
              filter="url(#gold-glow)"
            />

            {/* Sharp Core Luminous Golden Path */}
            <path
              d="M 500 395 C 670 395 850 390 885 320 C 915 255 930 200 942 152"
              fill="none"
              stroke="#FFD566"
              strokeWidth="3.2"
              strokeLinecap="round"
              filter="url(#gold-glow)"
            />

            {/* Golden Arrowhead Pointing Toward Career & Sunlight */}
            <path
              d="M 944 135 L 956 160 L 944 153 L 932 160 Z"
              fill="#FFD566"
              filter="url(#gold-glow)"
            />
          </svg>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="relative z-10 container-custom w-full flex flex-col justify-between min-h-[calc(100vh-140px)] lg:min-h-[640px]">
        {/* Top/Middle Area: Left Content + Mobile Staircase Preview */}
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 pt-4 sm:pt-6 lg:pt-10">
          
          {/* Left Column: Eyebrow, Master Headline, Description & Action Buttons (~42% width) */}
          <div className="w-full lg:w-[46%] xl:w-[42%] flex flex-col items-start text-left">
            
            {/* Eyebrow Label with Golden Accent Dash */}
            <div className="flex items-center gap-2.5 mb-3.5 sm:mb-4">
              <span className="w-6 h-0.5 rounded-full bg-[#FFB000]" />
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#FFB000]">
                SKILLTHINKER SOLUTIONS
              </span>
            </div>

            {/* Master Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[52px] font-black tracking-tight leading-[1.08] text-white mb-4 sm:mb-5">
              The right skills<br />
              <span className="text-[#FFB000]">can transform</span><br />
              your career.
            </h1>

            {/* Supporting Description */}
            <p className="text-slate-300 text-sm sm:text-[15px] leading-relaxed max-w-xl font-normal mb-6 sm:mb-7">
              Our training programs are designed to help students, graduates, and working professionals
              develop practical, industry-relevant skills and prepare for the demands of the modern workplace.
            </p>

            {/* Action Buttons Terminal */}
            <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              {/* Primary CTA: Explore Courses */}
              <Link
                href="/#programs"
                className="h-12 sm:h-13 px-6 sm:px-7 rounded-xl bg-[#FFB000] hover:bg-[#E59E00] text-[#06182B] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-4 h-4 text-[#06182B] stroke-[2.5]" />
              </Link>

              {/* Secondary CTA: Talk to an Advisor */}
              <button
                type="button"
                onClick={() => openModal()}
                className="h-12 sm:h-13 px-5 sm:px-6 rounded-xl bg-transparent hover:bg-white/[0.08] border border-white/30 hover:border-white/50 text-white font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-white/80" />
                <span>Talk to an Advisor</span>
              </button>
            </div>

          </div>

          {/* Mobile & Tablet Staircase Card (Shown only on screens < lg) */}
          <div className="block lg:hidden w-full my-4 rounded-2xl overflow-hidden border border-white/10 relative aspect-[2.1/1] bg-[#031122] shadow-xl">
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

        {/* ── BOTTOM COMPACT INFORMATION STRIP ── */}
        <div className="w-full mt-10 lg:mt-12 pt-2">
          <div className="w-full rounded-2xl bg-[#061D33]/90 border border-white/10 shadow-2xl backdrop-blur-md p-4 sm:p-5 lg:py-4 lg:px-6">
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
                    {/* Icon Container with subtle Golden Accent */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFB000]/10 border border-[#FFB000]/25 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFB000]" />
                    </div>

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
