'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Award, Laptop, TrendingUp, Handshake, Trophy } from 'lucide-react';
import { BRAND_INFO, CORE_VALUES } from '@/data/siteData';

const VALUE_CARDS = [
  {
    title: 'Quality',
    description: 'We focus on delivering meaningful and effective learning experiences.',
    icon: Award,
    iconBg: 'bg-[#EBF2FE]',
    iconColor: 'text-[#0A3A7A]',
  },
  {
    title: 'Practical Learning',
    description: 'We encourage learners to apply knowledge through practical activities and projects.',
    icon: Laptop,
    iconBg: 'bg-[#FEF7E6]',
    iconColor: 'text-[#D97706]',
  },
  {
    title: 'Growth',
    description: 'We promote continuous improvement and lifelong learning.',
    icon: TrendingUp,
    iconBg: 'bg-[#EBF2FE]',
    iconColor: 'text-[#0A3A7A]',
  },
  {
    title: 'Integrity',
    description: 'We believe in transparent, responsible, and learner-focused education.',
    icon: Handshake,
    iconBg: 'bg-[#FEF7E6]',
    iconColor: 'text-[#D97706]',
  },
  {
    title: 'Excellence',
    description: 'We encourage every learner to aim higher and achieve their potential.',
    icon: Trophy,
    iconBg: 'bg-[#EBF2FE]',
    iconColor: 'text-[#0A3A7A]',
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-12 sm:py-16 lg:py-20 bg-[#FAFCFF] border-b border-slate-200 select-none">
      <div className="w-full max-w-[1400px] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12 lg:space-y-16">
        
        {/* ── BLOCK 1: Senior Editorial Split (Institution Narrative & Campus Hub) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Narrative Story & Educational Ethos (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Overline Kicker */}
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A3A7A]" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#0A3A7A]">
                Institution Overview
              </span>
            </div>

            {/* Master Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#06284F] tracking-[-0.03em] leading-[1.12]">
              Learn with purpose.<br />
              <span className="text-[#0A3A7A]">Grow with Skillthinker.</span>
            </h2>

            {/* Exact Verified Story Text */}
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm sm:text-base">
              <p className="font-semibold text-slate-900 text-base sm:text-lg leading-snug">
                {BRAND_INFO.aboutStoryP1}
              </p>
              <p className="font-normal text-slate-600 leading-[1.75]">
                {BRAND_INFO.aboutStoryP2}
              </p>
            </div>

            {/* Educational Ethos Pull-Quote */}
            <div className="border-l-2 border-[#FCAF0A] pl-5 sm:pl-6 py-2 my-6 bg-slate-50/50 rounded-r-xl">
              <blockquote className="text-base sm:text-lg font-bold text-[#06284F] italic tracking-tight">
                {BRAND_INFO.aboutQuote}
              </blockquote>
              <span className="block text-xs font-bold uppercase tracking-wider text-[#0A3A7A] mt-2">
                — Skillthinker Educational Ethos
              </span>
            </div>

          </div>

          {/* Right Column: High-Res Campus Hub Anchor Photo (5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-[5/4] border border-slate-200/90 shadow-xl bg-slate-900 group">
              <Image
                src="/images/student-lab.jpg"
                alt="Skillthinker technical laboratory, Anna Nagar, Trichy"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
              
              {/* Architectural Campus Plaque */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0A3A7A]/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#0A3A7A]" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Trichy Campus Hub
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Phase 1, Anna Nagar, Trichy
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-[#0A3A7A] text-white text-[10px] font-black tracking-wider uppercase inline-block">
                    HQ
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Technical Lab
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── BLOCK 2: Mission & Vision (Dual Architectural Horizon Split) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Mission Card: Core Purpose */}
          <div className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-amber-700 tracking-widest uppercase">
                  Core Purpose
                </span>
                <span className="text-xs font-mono text-slate-300 group-hover:text-amber-500 transition-colors">
                  01
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#06284F] tracking-tight mb-1">
                Our Mission
              </h3>
              <div className="text-sm font-bold text-[#0A3A7A] mb-4">
                Accessible, meaningful skill development
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {BRAND_INFO.mission}
              </p>
            </div>

            <div className="w-12 h-0.5 bg-[#FCAF0A] mt-8" />
          </div>

          {/* Vision Card: Long-Term Horizon */}
          <div className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-[#0A3A7A] tracking-widest uppercase">
                  Long-Term Horizon
                </span>
                <span className="text-xs font-mono text-slate-300 group-hover:text-[#0A3A7A] transition-colors">
                  02
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#06284F] tracking-tight mb-1">
                Our Vision
              </h3>
              <div className="text-sm font-bold text-[#0A3A7A] mb-4">
                A trusted center of excellence
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {BRAND_INFO.vision}
              </p>
            </div>

            <div className="w-12 h-0.5 bg-[#0A3A7A] mt-8" />
          </div>

        </div>

        {/* ── BLOCK 3: Our Values (What Guides How We Teach.) ── */}
        <div className="pt-2">
          
          {/* Upper Row: Left Intro & Right Architectural Photo Grounded Together */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-8 mb-3 sm:mb-4">
            
            {/* Left: Section Header */}
            <div className="max-w-xl pb-1">
              {/* Overline with Amber Accent Dash */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-0.5 rounded-full bg-[#FCAF0A]" />
                <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#06284F]">
                  OUR VALUES
                </span>
              </div>

              {/* Master Heading */}
              <h3 className="text-2xl sm:text-3xl lg:text-[36px] font-black tracking-tight leading-[1.15] text-[#06284F]">
                What Guides <span className="text-[#1548AE]">How We Teach.</span>
              </h3>

              {/* Description */}
              <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed mt-1.5 max-w-lg">
                Five core values shape our programs, our training approach, and the learning experience we create for every learner.
              </p>
            </div>

            {/* Right: Bespoke 3D Head-Out Reference Artwork */}
            <div className="w-full lg:w-auto lg:shrink-0 flex justify-end">
              <div className="relative w-full sm:w-[380px] lg:w-[440px] xl:w-[480px] flex items-end justify-end animate-audience-fade">
                <Image
                  src="/images/values-leadership-3d.png"
                  alt="Skillthinker Solutions experienced trainers mentoring students in hands-on technical sessions"
                  width={770}
                  height={306}
                  className="w-full h-auto max-h-[165px] sm:max-h-[180px] lg:max-h-[195px] object-contain object-right-bottom"
                  priority
                />
              </div>
            </div>

          </div>

          {/* Lower Row: 5-Column Core Values Ribbon with Hairline Dividers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 pt-4 sm:pt-5 border-t border-slate-200/80">
            {VALUE_CARDS.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  className="py-3 sm:py-3.5 lg:py-1 px-3 sm:px-4 lg:px-5 flex flex-col justify-start group"
                >
                  {/* Icon Box */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${val.iconBg} ${val.iconColor} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  {/* Principle Title */}
                  <h4 className="text-sm sm:text-base font-black text-[#06284F] tracking-tight mt-2.5 group-hover:text-[#1548AE] transition-colors leading-snug">
                    {val.title}
                  </h4>

                  {/* Amber Accent Line */}
                  <div className="w-5 h-0.5 rounded-full bg-[#FCAF0A] mt-1.5 mb-2.5" />

                  {/* Principle Description */}
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                    {val.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
