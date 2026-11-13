'use client';

import React from 'react';
import Image from 'next/image';
import { Target, Compass, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { BRAND_INFO, CORE_VALUES } from '@/data/siteData';

export default function AboutSection() {
  return (
    <section id="about" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-slate-200">
      <div className="container-custom">
        
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0A3A7A] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
            <span>Institution Overview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-tight">
            Learn with purpose.<br />
            <span className="text-[#0A3A7A]">Grow with Skillthinker.</span>
          </h2>
          <div className="w-12 h-1 bg-[#FCAF0A] mt-4 rounded-full" />
        </div>

        {/* 2-Column Balanced Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Visual Photography + Mission & Vision (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Real Lab Photo */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-slate-200 shadow-md bg-white p-1.5">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                <Image
                  src="/images/student-lab.jpg"
                  alt="Skillthinker technical laboratory, Anna Nagar, Trichy"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0A3A7A]" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Trichy Campus Hub</div>
                      <div className="text-[10px] text-slate-500">Phase 1, Anna Nagar, Trichy</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0A3A7A] text-[10px] font-bold">
                    HQ
                  </span>
                </div>
              </div>
            </div>

            {/* Mission & Vision Dual Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Our Mission
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {BRAND_INFO.mission}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3A7A]">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Our Vision
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {BRAND_INFO.vision}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Institutional Story & 5 Core Values (7 cols) */}
          <div className="lg:col-span-7 space-y-7">
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                {BRAND_INFO.aboutStoryP1}
              </p>
              <p className="text-sm sm:text-base font-normal">
                {BRAND_INFO.aboutStoryP2}
              </p>
            </div>

            {/* Brand Quote */}
            <blockquote className="p-5 rounded-xl bg-blue-50/70 border-l-4 border-[#0A3A7A] border-y border-r border-blue-100">
              <p className="text-base font-bold text-[#06284F] italic">
                {BRAND_INFO.aboutQuote}
              </p>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mt-2">
                — Skillthinker Educational Ethos
              </span>
            </blockquote>

            {/* 5 Core Values Grid */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                <CheckCircle2 className="w-4 h-4 text-[#0A3A7A]" />
                <span>Our 5 Foundational Principles</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CORE_VALUES.map((val, i) => (
                  <div
                    key={val.title}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">
                        {val.title}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#0A3A7A]">
                        0{i + 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {val.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
