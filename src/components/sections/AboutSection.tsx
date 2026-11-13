'use client';

import React from 'react';
import { Target, Compass, MapPin } from 'lucide-react';
import { BRAND_INFO, CORE_VALUES } from '@/data/siteData';

export default function AboutSection() {
  return (
    <section id="about" className="py-16 lg:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="container-custom">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 lg:mb-16">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#0A3A7A] mb-2">
            About Skillthinker Solutions
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#062551] tracking-tight leading-tight">
            Learn with purpose. Grow with Skillthinker.
          </h2>
          <div className="w-10 h-0.5 bg-[#FCAF0A] mt-3" />
        </div>

        {/* Asymmetric Editorial Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column (7 cols): Narrative & Core Values Matrix */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
              <p>{BRAND_INFO.aboutStoryP1}</p>
              <p>{BRAND_INFO.aboutStoryP2}</p>
            </div>

            {/* Official Institutional Quote */}
            <blockquote className="border-l-2 border-[#FCAF0A] pl-4 py-1 text-sm sm:text-base text-[#062551] font-medium italic">
              {BRAND_INFO.aboutQuote}
            </blockquote>

            {/* 5 Core Values — Architectural Grid with Hairline Dividers */}
            <div className="pt-4 border-t border-slate-200">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-4">
                Five Guiding Principles
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CORE_VALUES.map((val, idx) => (
                  <div
                    key={val.title}
                    className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-md"
                  >
                    <div className="text-xs font-mono font-semibold text-[#0A3A7A] mb-1">
                      0{idx + 1} • {val.title}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {val.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Mission & Vision Institutional Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#062551] text-white p-7 sm:p-8 rounded-lg border border-blue-950 space-y-6 shadow-xs">
              {/* Mission */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#FCAF0A]">
                  <Target className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-mono uppercase tracking-wider">Our Mission</span>
                </div>
                <h3 className="text-base font-semibold text-white">
                  {BRAND_INFO.missionSubtitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {BRAND_INFO.mission}
                </p>
              </div>

              <div className="h-px bg-blue-900/80" />

              {/* Vision */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#FCAF0A]">
                  <Compass className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-mono uppercase tracking-wider">Our Vision</span>
                </div>
                <h3 className="text-base font-semibold text-white">
                  {BRAND_INFO.visionSubtitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {BRAND_INFO.vision}
                </p>
              </div>
            </div>

            {/* Official Physical Hub Callout */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#0A3A7A] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-snug">
                <strong className="text-[#162033] block mb-0.5">Physical Training Facility</strong>
                {BRAND_INFO.officeLocation}. Classroom training and dedicated mentor lab.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
