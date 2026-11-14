'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, Sparkles, MapPin, Users } from 'lucide-react';
import { BRAND_INFO, TRAINER_EXPECTATIONS } from '@/data/siteData';

export default function MentorshipSection() {
  return (
    <section id="mentors" className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Real Faculty & Lab Photography (5 cols) */}
          <div className="lg:col-span-5 relative group order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] border border-slate-200 shadow-md p-1.5 bg-white">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                <Image
                  src="/images/founder-trainer.jpg"
                  alt="Skillthinker Faculty and Technical Mentors in Trichy"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A3A7A] uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Anna Nagar Training Facility</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    Live Classroom Mentorship &amp; Code Reviews
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Trichy Hub Badge */}
            <div className="absolute -top-3 -right-3 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-md flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#FCAF0A]" />
              <span>Trichy Faculty Hub</span>
            </div>
          </div>

          {/* Right: Narrative & Trainer Standards (7 cols) */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#0A3A7A] mb-3">
                Mentorship Ethos
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-tight">
                Learn from people who <span className="text-[#0A3A7A]">guide your growth.</span>
              </h2>
            </div>

            <p className="text-base text-slate-600 leading-relaxed font-normal">
              A transformative learning journey requires direct human guidance. Our trainers are experienced software practitioners committed to making complex concepts simple, resolving doubts one-on-one, and providing real-time code reviews during lab exercises.
            </p>

            {/* Official Trainer Quote */}
            <blockquote className="p-5 rounded-xl bg-blue-50/70 border-l-4 border-[#0A3A7A] border-y border-r border-blue-100">
              <p className="text-base font-bold text-[#06284F] italic">
                {BRAND_INFO.trainerQuote}
              </p>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mt-2">
                — Skillthinker Mentor Commitment
              </span>
            </blockquote>

            {/* 7 Trainer Expectations Checklist */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0A3A7A]" />
                <span>What Every Learner Can Expect from Mentors</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TRAINER_EXPECTATIONS.map((exp, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-800 font-medium leading-snug">
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
