'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Laptop, TrendingUp, Briefcase, Rocket } from 'lucide-react';

export interface AudienceItem {
  id: string;
  number: string;
  name: string;
  badge: string;
  heading: string;
  descriptor: string;
  focusIcon: React.ElementType;
  focusTitle: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
}

export const AUDIENCE_DATA: AudienceItem[] = [
  {
    id: 'students',
    number: '01',
    name: 'Students',
    badge: '01 / STUDENTS',
    heading: 'Build your technical\nfoundation.',
    descriptor: 'COLLEGE & DEGREE STUDENTS',
    focusIcon: Laptop,
    focusTitle: 'Foundation & Hands-On Code',
    description:
      'Build a strong technical foundation alongside your degree, with structured, easy-to-follow learning paths.',
    ctaText: 'View Recommended Tracks',
    ctaHref: '/#courses',
    image: '/images/audience/students-collaboration.jpg',
    imageAlt: 'College students collaborating on hands-on programming projects in computer lab',
  },
  {
    id: 'graduates',
    number: '02',
    name: 'Fresh Graduates',
    badge: '02 / FRESH GRADUATES',
    heading: 'Turn your knowledge into\ncareer readiness.',
    descriptor: 'GRADUATES & JOB SEEKERS',
    focusIcon: TrendingUp,
    focusTitle: 'Aptitude, GD & Technical Mock Interviews',
    description:
      'Sharpen placement-ready skills — aptitude, technical depth, and interview confidence — before you enter the job market.',
    ctaText: 'View Recommended Tracks',
    ctaHref: '/#courses',
    image: '/images/audience/graduates-readiness.jpg',
    imageAlt: 'Fresh graduate studying aptitude, data structures, and interview preparation for job readiness',
  },
  {
    id: 'professionals',
    number: '03',
    name: 'Working Professionals',
    badge: '03 / WORKING PROFESSIONALS',
    heading: 'Take your technical\nskills further.',
    descriptor: 'WORKING PROFESSIONALS',
    focusIcon: Briefcase,
    focusTitle: 'Weekend Batches & Domain Transitions',
    description:
      'Upskill or pivot into a new domain with practical, project-driven training designed around a working schedule.',
    ctaText: 'View Recommended Tracks',
    ctaHref: '/#courses',
    image: '/images/audience/professionals-corporate.jpg',
    imageAlt: 'Corporate working professionals upskilling and advancing their careers at tech park',
  },
  {
    id: 'entrepreneurs',
    number: '04',
    name: 'Aspiring Entrepreneurs',
    badge: '04 / ASPIRING ENTREPRENEURS',
    heading: 'Build the skills behind\nyour next idea.',
    descriptor: 'FOUNDERS & INNOVATORS',
    focusIcon: Rocket,
    focusTitle: 'Full-Stack Execution & Digital Growth',
    description:
      'Pick up the technical and digital marketing skills needed to build, launch, and grow your own ideas.',
    ctaText: 'View Recommended Tracks',
    ctaHref: '/#courses',
    image: '/images/audience/entrepreneurs-founders.jpg',
    imageAlt: 'Startup founders and innovators collaborating on digital product development in modern workspace',
  },
];

export default function AudienceSection() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const activeAudience = AUDIENCE_DATA[selectedIdx];
  const FocusIcon = activeAudience.focusIcon;

  return (
    <section
      id="audiences"
      aria-labelledby="who-we-serve-heading"
      className="py-14 sm:py-16 lg:py-20 bg-white border-b border-slate-200 select-none relative overflow-hidden"
    >
      {/* Anchor for external routing */}
      <div id="who-we-serve" className="absolute -top-20 left-0 pointer-events-none" />

      <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* ── 1. SECTION INTRODUCTION (Matches Reference Upper-Left) ── */}
        <div className="max-w-2xl mb-8 sm:mb-10 lg:mb-12">
          {/* Overline with Amber Accent Line */}
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-6 h-0.5 rounded-full bg-[#FCAF0A]" />
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#06284F]">
              WHO WE SERVE
            </span>
          </div>

          {/* Master Heading — Two lines: deep navy + brand blue */}
          <h2
            id="who-we-serve-heading"
            className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#06284F] tracking-[-0.03em] leading-[1.12]"
          >
            Training built around <br />
            <span className="text-[#1548AE]">
              where you&apos;re starting from.
            </span>
          </h2>

          {/* Supporting Description */}
          <p className="text-slate-600 text-sm sm:text-[15px] mt-3 font-normal leading-relaxed max-w-xl">
            Wherever you are in your journey, our programs are structured to meet you there — with the right pace, depth, and support.
          </p>
        </div>

        {/* ── 2. THREE-COLUMN EDITORIAL COMPOSITION ── */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 lg:gap-0">
          
          {/* ── COLUMN A: Audience Navigation (Left, ~26%) ── */}
          <div className="w-full lg:w-[26%] lg:shrink-0 flex flex-col justify-center space-y-1.5 lg:pr-6 xl:pr-8 lg:border-r lg:border-slate-200/80">
            <div className="space-y-1" role="tablist" aria-label="Audience Selector">
              {AUDIENCE_DATA.map((item, idx) => {
                const isSelected = idx === selectedIdx;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`audience-tab-${item.id}`}
                    aria-selected={isSelected}
                    aria-controls={`audience-panel-${item.id}`}
                    onClick={() => setSelectedIdx(idx)}
                    className={`group w-full text-left rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-between py-3.5 px-4 sm:py-4 sm:px-5 ${
                      isSelected
                        ? 'bg-[#FEF7E6] text-[#06284F] border-l-[3.5px] border-[#FCAF0A] shadow-[0_2px_12px_rgba(252,175,10,0.08)]'
                        : 'bg-transparent hover:bg-slate-50/80 text-slate-700 border-l-[3.5px] border-transparent border-b border-slate-100 last:border-b-0'
                    }`}
                  >
                    {/* Number, Hairline Pipe, Name */}
                    <div className="flex items-center">
                      <span
                        className={`font-mono text-sm sm:text-base font-bold transition-colors ${
                          isSelected ? 'text-[#06284F]' : 'text-slate-400'
                        }`}
                      >
                        {item.number}
                      </span>

                      {/* Thin Vertical Separator */}
                      <span
                        className={`inline-block h-4 w-px mx-3 sm:mx-3.5 transition-colors ${
                          isSelected ? 'bg-amber-300' : 'bg-slate-200'
                        }`}
                        aria-hidden="true"
                      />

                      {/* Audience Name */}
                      <span
                        className={`text-sm sm:text-[15px] font-bold transition-colors ${
                          isSelected ? 'text-[#06284F]' : 'text-slate-700 group-hover:text-slate-900'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    {/* Small Right Arrow */}
                    {isSelected ? (
                      <ArrowRight className="w-4 h-4 text-[#FCAF0A] shrink-0 transform transition-transform duration-200 group-hover:translate-x-1" />
                    ) : (
                      <span className="w-4 h-4 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── COLUMN B: Dynamic Information Panel (Centre, ~34%) ── */}
          <div
            id={`audience-panel-${activeAudience.id}`}
            role="tabpanel"
            aria-labelledby={`audience-tab-${activeAudience.id}`}
            className="w-full lg:w-[34%] lg:shrink-0 flex flex-col justify-between py-2 sm:py-4 lg:px-6 xl:px-10 min-h-[400px]"
          >
            <div key={activeAudience.id} className="animate-audience-fade">
              {/* Selected Audience Identifier */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#EBF2FE] border border-blue-100/60 mb-3">
                <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-[#0A3A7A]">
                  {activeAudience.badge}
                </span>
              </div>

              {/* Main Heading (38–42px large desktop scale) */}
              <h3 className="text-2xl sm:text-3xl lg:text-[36px] xl:text-[38px] font-extrabold text-[#06284F] tracking-[-0.025em] leading-[1.15] whitespace-pre-line min-h-[4.8rem] flex items-center">
                {activeAudience.heading}
              </h3>

              {/* Descriptor */}
              <div className="text-xs sm:text-[13px] font-bold tracking-[0.16em] uppercase text-slate-400 mt-2">
                {activeAudience.descriptor}
              </div>

              {/* Training Focus Row */}
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF7E6] border border-amber-200/80 flex items-center justify-center text-[#06284F] shrink-0 shadow-2xs">
                  <FocusIcon className="w-5 h-5 text-[#06284F]" />
                </div>
                <span className="text-sm sm:text-base font-bold text-[#06284F]">
                  {activeAudience.focusTitle}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed font-normal mt-4 min-h-[3.6rem]">
                {activeAudience.description}
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-6 mt-auto">
              <Link
                href={activeAudience.ctaHref}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#FCAF0A] hover:bg-[#F5A800] text-[#041427] font-extrabold text-sm sm:text-[15px] transition-all cursor-pointer shadow-xs hover:shadow-md hover:translate-x-0.5 active:translate-y-0"
              >
                <span>{activeAudience.ctaText}</span>
                <ArrowRight className="w-4 h-4 text-[#041427]" />
              </Link>
            </div>
          </div>

          {/* ── COLUMN C: Large Contextual Photograph (Right, ~40%) ── */}
          <div className="w-full lg:w-[40%] xl:w-[40%] lg:shrink-0 flex items-center justify-end">
            <div
              className="relative w-full aspect-[4/3] sm:aspect-[1/1] lg:aspect-auto lg:h-[440px] xl:h-[470px] max-w-[540px] xl:max-w-[580px] ml-auto overflow-hidden bg-slate-100"
              style={{
                clipPath:
                  'polygon(22% 0%, 96% 0%, 100% 4%, 100% 96%, 96% 100%, 8% 100%, 0% 90%, 0% 86%)',
              }}
            >
              {/* Reference Angled Gold Slash Accent at Top-Left of Slanted Edge */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1="22"
                  y1="0"
                  x2="15"
                  y2="28"
                  stroke="#FCAF0A"
                  strokeWidth="3.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                />
              </svg>

              {/* Stack of Preloaded Images with Smooth Hardware-Accelerated Crossfade */}
              {AUDIENCE_DATA.map((item, idx) => (
                <div
                  key={item.id}
                  className={`absolute inset-0 transition-opacity duration-350 ease-out ${
                    idx === selectedIdx
                      ? 'opacity-100 z-10'
                      : 'opacity-0 z-0 pointer-events-none'
                  }`}
                  aria-hidden={idx !== selectedIdx}
                >
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 580px"
                    priority={idx === 0}
                    className="object-cover object-center"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
