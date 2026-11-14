'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { BRAND_INFO, CORE_VALUES } from '@/data/siteData';

export default function AboutSection() {
  return (
    <section id="about" className="py-20 lg:py-28 bg-[#FAFCFF] border-b border-slate-200 select-none">
      <div className="container-custom space-y-16 lg:space-y-24">
        
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

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#06284F] tracking-tight mb-4">
                Our Mission
              </h3>

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

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#06284F] tracking-tight mb-4">
                Our Vision
              </h3>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {BRAND_INFO.vision}
              </p>
            </div>

            <div className="w-12 h-0.5 bg-[#0A3A7A] mt-8" />
          </div>

        </div>

        {/* ── BLOCK 3: Our 5 Foundational Principles (Continuous Divided Ribbon) ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-200 gap-2">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#06284F] tracking-tight">
                Our 5 Foundational Principles
              </h3>
              <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 font-medium">
                Guiding institutional education &amp; student success
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              5 Pillars of Excellence
            </div>
          </div>

          {/* Continuous Architectural Ribbon with Hairline Dividers */}
          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200 border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
            {CORE_VALUES.map((val, i) => (
              <div
                key={val.title}
                className="group relative p-6 sm:p-7 flex flex-col justify-between hover:bg-slate-50/70 transition-colors"
              >
                {/* Subtle top indicator bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-[#FCAF0A] transition-colors" />

                <div>
                  {/* Monospace Phase Number */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[#0A3A7A] transition-colors">
                      0{i + 1}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 group-hover:text-[#FCAF0A] transition-colors">
                      P{i + 1}
                    </span>
                  </div>

                  {/* Principle Title */}
                  <h4 className="text-base sm:text-lg font-extrabold text-[#06284F] group-hover:text-[#0A3A7A] transition-colors mb-2.5 leading-snug">
                    {val.title}
                  </h4>

                  {/* Principle Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {val.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
