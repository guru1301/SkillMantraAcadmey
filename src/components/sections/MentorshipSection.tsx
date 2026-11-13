'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, Sparkles, MapPin, Users } from 'lucide-react';
import { BRAND_INFO, TRAINER_EXPECTATIONS } from '@/data/siteData';

export default function MentorshipSection() {
  return (
    <section id="mentors" className="relative py-24 lg:py-32 bg-[#051C38] text-white overflow-hidden border-t border-b border-white/10">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#0A3A7A]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Real Faculty & Lab Photography (5 cols) */}
          <div className="lg:col-span-5 relative group order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-white/15 shadow-2xl">
              <Image
                src="/images/founder-trainer.jpg"
                alt="Skillthinker Faculty and Technical Mentors in Trichy"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#051C38] via-transparent to-black/20" />
              
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#FCAF0A] uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Anna Nagar Training Facility</span>
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  Live Classroom Mentorship &amp; Code Reviews
                </div>
              </div>
            </div>

            {/* Floating Trichy Hub Badge */}
            <div className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FCAF0A] to-[#E59B00] text-[#041427] text-xs font-bold shadow-xl flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Trichy Faculty Hub</span>
            </div>
          </div>

          {/* Right: Narrative & Trainer Standards (7 cols) */}
          <div className="lg:col-span-7 space-y-7 order-1 lg:order-2">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCAF0A]/10 border border-[#FCAF0A]/30 text-[#FCAF0A] text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mentorship Ethos</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Learn from people who <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCAF0A] to-[#F5A800]">guide your growth.</span>
              </h2>
              <div className="h-1 w-16 bg-[#FCAF0A] mt-4 rounded-full" />
            </div>

            <p className="text-base text-slate-300 leading-relaxed font-normal">
              A transformative learning journey requires direct human guidance. Our trainers are experienced software practitioners committed to making complex concepts simple, resolving doubts one-on-one, and providing real-time code reviews during lab exercises.
            </p>

            {/* Official Trainer Quote */}
            <blockquote className="p-5 rounded-xl bg-white/[0.04] border-l-4 border-[#FCAF0A] border-white/10 backdrop-blur-md">
              <p className="text-base font-bold text-white italic">
                {BRAND_INFO.trainerQuote}
              </p>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#FCAF0A] mt-2">
                — Skillthinker Mentor Commitment
              </span>
            </blockquote>

            {/* 7 Trainer Expectations Checklist */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FCAF0A]" />
                <span>What Every Learner Can Expect from Mentors</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRAINER_EXPECTATIONS.map((exp, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-start gap-2.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-200 font-medium leading-snug">
                      {exp}
                    </span>
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
