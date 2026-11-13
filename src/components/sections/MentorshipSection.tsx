'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, Quote, MapPin } from 'lucide-react';
import { BRAND_INFO, TRAINER_EXPECTATIONS } from '@/data/siteData';

export default function MentorshipSection() {
  return (
    <section id="mentors" className="py-16 lg:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Authentic Photography & Plaque (5 cols on lg) */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative mx-auto max-w-md lg:max-w-none space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 aspect-square">
                <Image
                  src="/images/founder-trainer.jpg"
                  alt="Skillthinker Solutions trainers and mentors in Trichy classroom"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061830]/85 via-transparent to-transparent" />

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#FCAF0A]">
                    Skillthinker Faculty &amp; Mentors
                  </div>
                  <div className="text-xs text-slate-200">
                    Trichy Training Hub • Practical Mentorship &amp; Real Code
                  </div>
                </div>
              </div>

              {/* Quote Block */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#062551] font-medium italic flex items-start gap-2.5">
                <Quote className="w-4 h-4 text-[#FCAF0A] shrink-0 mt-0.5" />
                <span>{BRAND_INFO.trainerQuote}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Charter & Expectations (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0A3A7A] mb-2">
                Our Trainers &amp; Mentors
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#062551] tracking-tight leading-tight">
                Learn from people who guide your growth.
              </h2>
              <div className="w-10 h-0.5 bg-[#FCAF0A] mt-3" />
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              A great learning experience starts with the right guidance. At Skillthinker Solutions, our trainers and mentors are committed to making learning practical, understandable, and engaging. They bring knowledge, experience, and a learner-focused approach to the classroom — encouraging questions, practical application, problem-solving, and continuous improvement.
            </p>

            {/* 7 Expectations Standards Ledger */}
            <div className="pt-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3">
                What You Can Expect From Our Mentors
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700">
                {TRAINER_EXPECTATIONS.map((exp, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium leading-snug">{exp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentorship Beyond Classroom */}
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#062551]">
                Mentorship That Goes Beyond the Classroom
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Our trainers don&apos;t just teach concepts. They help learners understand how those concepts can be applied in practical situations and encourage them to develop confidence in their abilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
