'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Target, 
  Compass, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Code2, 
  TrendingUp, 
  HeartHandshake, 
  Award 
} from 'lucide-react';
import { BRAND_INFO, CORE_VALUES } from '@/data/siteData';

const PRINCIPLE_META = [
  { icon: ShieldCheck,    color: 'text-[#0A3A7A]',   bg: 'bg-blue-50 border-blue-200' },
  { icon: Code2,          color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200' },
  { icon: TrendingUp,     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { icon: HeartHandshake, color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200' },
  { icon: Award,          color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-slate-200">
      <div className="container-custom space-y-16 lg:space-y-20">
        
        {/* Block 1: Editorial Split (Story & Photo) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Narrative Story & Ethos (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0A3A7A] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Institution Overview</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-[1.12]">
              Learn with purpose.<br />
              <span className="text-[#0A3A7A]">Grow with Skillthinker.</span>
            </h2>

            {/* Core Narrative Paragraphs */}
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm sm:text-base">
              <p className="font-semibold text-slate-900 text-base sm:text-lg leading-snug">
                {BRAND_INFO.aboutStoryP1}
              </p>
              <p className="font-normal text-slate-600">
                {BRAND_INFO.aboutStoryP2}
              </p>
            </div>

            {/* Educational Ethos Quote Banner */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-[#FCAF0A] to-[#0A3A7A]" />
              <p className="text-base sm:text-lg font-bold text-[#06284F] italic pl-2">
                &ldquo;{BRAND_INFO.aboutQuote}&rdquo;
              </p>
              <span className="block text-xs font-bold uppercase tracking-wider text-[#0A3A7A] mt-2 pl-2">
                — Skillthinker Educational Ethos
              </span>
            </div>

          </div>

          {/* Right Column: Lab Photo & Campus Anchor (5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-[5/4] border border-slate-200 shadow-xl bg-white p-2">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900">
                <Image
                  src="/images/student-lab.jpg"
                  alt="Skillthinker technical laboratory, Anna Nagar, Trichy"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Location Overlay Pill */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3A7A] shrink-0">
                      <MapPin className="w-4 h-4 text-[#0A3A7A]" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">Trichy Campus Hub</div>
                      <div className="text-[11px] text-slate-500 font-medium">Phase 1, Anna Nagar, Trichy</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[#0A3A7A] text-white text-[10px] font-bold tracking-wider uppercase">
                    HQ
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Block 2: Mission & Vision (2-Column Equal Full-Width Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Mission Card */}
          <div className="p-7 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-5 shadow-xs">
                <Target className="w-6 h-6 text-[#E59B00]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
                Our Mission
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {BRAND_INFO.mission}
              </p>
            </div>
            <div className="w-12 h-1 bg-amber-400 mt-6 rounded-full" />
          </div>

          {/* Vision Card */}
          <div className="p-7 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3A7A] mb-5 shadow-xs">
                <Compass className="w-6 h-6 text-[#0A3A7A]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
                Our Vision
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {BRAND_INFO.vision}
              </p>
            </div>
            <div className="w-12 h-1 bg-[#0A3A7A] mt-6 rounded-full" />
          </div>

        </div>

        {/* Block 3: Our 5 Foundational Principles (With Custom Icons, Balanced 5-Col Grid) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-200 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#0A3A7A]" />
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Our 5 Foundational Principles
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Guiding institutional education &amp; student success
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CORE_VALUES.map((val, i) => {
              const meta = PRINCIPLE_META[i % PRINCIPLE_META.length];
              const IconComp = meta.icon;
              return (
                <div
                  key={val.title}
                  className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#0A3A7A]/30 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Icon & Number Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl ${meta.bg} border flex items-center justify-center ${meta.color} shadow-2xs group-hover:scale-105 transition-transform`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                        0{i + 1}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#0A3A7A] transition-colors mb-2 leading-snug">
                      {val.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {val.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
