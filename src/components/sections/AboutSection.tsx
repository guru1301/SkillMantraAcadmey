'use client';

import React from 'react';
import Image from 'next/image';
import { Target, Compass, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { BRAND_INFO, CORE_VALUES } from '@/data/siteData';

export default function AboutSection() {
  return (
    <section id="about" className="relative py-24 lg:py-32 bg-[#041427] text-white overflow-hidden">
      {/* Background radial gradient & subtle grid */}
      <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#0A3A7A]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container-custom">
        
        {/* Section Eyebrow & Title */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCAF0A]/10 border border-[#FCAF0A]/30 text-[#FCAF0A] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Institution Overview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Learn with purpose.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCAF0A] to-[#F5A800]">
              Grow with Skillthinker.
            </span>
          </h2>
          <div className="h-1 w-16 bg-[#FCAF0A] mt-4 rounded-full" />
        </div>

        {/* 2-Column Balanced Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left Column: Visual Laboratory Photography + Mission & Vision Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Real Training Laboratory Visual */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/15 shadow-2xl group">
              <Image
                src="/images/student-lab.jpg"
                alt="Students inside Skillthinker technical laboratory, Anna Nagar, Trichy"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#041427] via-transparent to-black/20" />
              
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#FCAF0A] uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Trichy Headquarters</span>
                  </div>
                  <div className="text-xs text-white/90 font-medium mt-0.5">
                    H274, First Floor, Phase 1, Anna Nagar
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300">
                  Active Hub
                </div>
              </div>
            </div>

            {/* Mission & Vision Dual Glass Bento Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mission Card */}
              <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10 hover:border-[#FCAF0A]/40 backdrop-blur-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FCAF0A]/10 border border-[#FCAF0A]/30 flex items-center justify-center text-[#FCAF0A]">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A]">
                    Our Mission
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {BRAND_INFO.mission}
                </p>
              </div>

              {/* Vision Card */}
              <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10 hover:border-[#FCAF0A]/40 backdrop-blur-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0A3A7A] border border-white/15 flex items-center justify-center text-white">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Our Vision
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {BRAND_INFO.vision}
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Institutional Story & 5 Core Values */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Story Paragraphs */}
            <div className="space-y-4 text-base text-slate-300 leading-relaxed">
              <p className="font-medium text-white text-lg">
                {BRAND_INFO.aboutStoryP1}
              </p>
              <p className="text-sm sm:text-base text-slate-300 font-normal">
                {BRAND_INFO.aboutStoryP2}
              </p>
            </div>

            {/* Official Brand Quote */}
            <blockquote className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#06284F] to-[#0A3A7A] border-l-4 border-[#FCAF0A] shadow-lg">
              <p className="text-base sm:text-lg font-bold text-white italic">
                {BRAND_INFO.aboutQuote}
              </p>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#FCAF0A] mt-2">
                — Skillthinker Educational Ethos
              </span>
            </blockquote>

            {/* 5 Core Values Cards Grid */}
            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                <CheckCircle2 className="w-4 h-4 text-[#FCAF0A]" />
                <span>Our 5 Foundational Principles</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {CORE_VALUES.map((val, i) => (
                  <div
                    key={val.title}
                    className="p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#FCAF0A]/30 transition-all backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-white">
                        {val.title}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#FCAF0A]">
                        0{i + 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
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
