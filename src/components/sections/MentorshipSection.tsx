'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, ArrowRight } from 'lucide-react';
import { BRAND_INFO, TRAINER_EXPECTATIONS } from '@/data/siteData';

export default function MentorshipSection() {
  return (
    <section
      id="trainers"
      aria-labelledby="trainers-heading"
      className="py-12 sm:py-14 lg:py-16 bg-white border-b border-slate-200 scroll-mt-20 select-none"
    >
      <div id="mentors" className="sr-only" />
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Authentic Faculty & Facility (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {/* Image Container with Natural Proportions */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-50 aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] w-full">
              <Image
                src="/images/founder-trainer.jpg"
                alt="Skillthinker Solutions trainers and technical mentors in Trichy"
                fill
                priority={false}
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover object-center"
              />
            </div>

            {/* Grounded Institutional Quote & Campus Attribution */}
            <div className="mt-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="italic text-slate-800 text-xs sm:text-[13.5px] font-medium leading-relaxed">
                {BRAND_INFO.trainerQuote}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-[#0A3A7A] uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#FCAF0A] shrink-0" />
                <span>Trichy Campus Faculty Hub • Live Mentorship</span>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & Clear Expectations (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-0.5 rounded-full bg-[#FCAF0A]" />
                <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#06284F]">
                  OUR TRAINERS
                </span>
              </div>

              <h2
                id="trainers-heading"
                className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight leading-[1.18] text-[#06284F]"
              >
                Learn from people who <span className="text-[#1548AE]">guide your growth.</span>
              </h2>

              <p className="text-slate-600 text-xs sm:text-sm font-normal leading-relaxed mt-2">
                A great learning experience starts with the right guidance. At Skillthinker Solutions, our trainers and mentors are committed to making learning practical, understandable, and engaging. They bring knowledge, industry experience, and a learner-first approach to the classroom — encouraging curiosity, problem-solving, and continuous improvement.
              </p>
            </div>

            {/* Compact Expectations Grid */}
            <div className="pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                What You Can Expect From Our Trainers
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TRAINER_EXPECTATIONS.map((exp, i) => (
                  <div
                    key={i}
                    className="py-2 px-3 rounded-lg bg-slate-50/80 border border-slate-200/70 flex items-center gap-2.5 transition-colors hover:bg-slate-100/70"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FCAF0A] shrink-0" />
                    <span className="text-xs text-slate-800 font-semibold leading-tight">
                      {exp}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compact Action Row */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="#courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06284F] hover:bg-[#0A3A7A] text-white text-xs sm:text-sm font-bold transition-all shadow-2xs hover:shadow-xs active:translate-y-0"
              >
                <span>Explore Programs &amp; Tracks</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FCAF0A]" />
              </a>

              <a
                href="#contact"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
              >
                <span>Talk to an Advisor</span>
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
