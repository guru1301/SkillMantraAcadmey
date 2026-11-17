'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Laptop, Layers, ShieldCheck, LogIn, CheckCircle2 } from 'lucide-react';

export interface JourneyStage {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: JourneyStage[] = [
  {
    number: '01',
    title: 'Enrol',
    description: 'Choose your program and get your access code from our team.',
    icon: ClipboardList,
  },
  {
    number: '02',
    title: 'Learn',
    description: 'Attend structured, instructor-led sessions built around real concepts.',
    icon: Laptop,
  },
  {
    number: '03',
    title: 'Practice',
    description: "Apply what you've learned through hands-on projects and assignments.",
    icon: Layers,
  },
  {
    number: '04',
    title: 'Assess',
    description: 'Take your course assessment online using your access code.',
    icon: function AssessIcon({ className }: { className?: string }) {
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M2 8h20" />
          <circle cx="5" cy="5.5" r="0.75" fill="currentColor" />
          <circle cx="8" cy="5.5" r="0.75" fill="currentColor" />
          <path d="m6.5 13 1.5 1.5 3-3" />
          <path d="m6.5 17 1.5 1.5 3-3" />
          <path d="M14 12.5h4" />
          <path d="M14 16.5h4" />
        </svg>
      );
    },
  },
  {
    number: '05',
    title: 'Get Certified',
    description: 'Earn a verifiable Skillthinker Solutions certificate on completion.',
    icon: function CertificateIcon({ className }: { className?: string }) {
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <circle cx="12" cy="14" r="3" />
          <path d="m10 16.5-1 3.5 2.5-1 2.5 1-1-3.5" />
        </svg>
      );
    },
  },
];

export default function LearningJourneySection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="journey"
      ref={sectionRef}
      aria-labelledby="how-it-works-heading"
      className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200 select-none relative overflow-hidden"
    >
      <div className="container-custom">
        {/* Section Heading */}
        <div className="max-w-3xl mb-12 lg:mb-16">
          {/* Overline with Amber Accent Dash */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-5 h-0.5 rounded-full bg-[#FCAF0A]" />
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#06284F]">
              HOW IT WORKS
            </span>
          </div>

          {/* Heading */}
          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl lg:text-[38px] xl:text-[40px] font-black tracking-tight leading-[1.15] text-[#06284F]"
          >
            From enrolment to certification<span className="text-[#FCAF0A]">.</span>
          </h2>

          {/* Subheading */}
          <p className="text-slate-600 text-sm sm:text-base font-normal mt-2.5 max-w-xl leading-relaxed">
            A simple, structured path — so you always know what&apos;s next.
          </p>
        </div>

        {/* ── DESKTOP TIMELINE (lg and above: single horizontal sequence) ── */}
        <div className="hidden lg:block mb-16">
          {/* Top Row: Circular Icons & Connecting Line */}
          <div className="relative mb-6">
            {/* Continuous horizontal connecting line running through the center of all 5 icons */}
            {/* Center of col 1 is 10%, center of col 5 is 90% */}
            <div className="absolute top-1/2 left-[10%] right-[10%] -translate-y-1/2 h-[1.5px] bg-[#E2E8F0] z-0 overflow-hidden">
              <div
                className={`h-full bg-[#D0E2FF] transition-transform duration-1000 ease-out origin-left ${
                  isVisible ? 'scale-x-100' : 'scale-x-0'
                } motion-reduce:scale-x-100`}
              />
            </div>

            {/* Subtle Gold Connection Markers at Midpoints between adjacent columns */}
            {/* Col boundaries at 20%, 40%, 60%, 80% */}
            {[20, 40, 60, 80].map((pos) => (
              <div
                key={pos}
                style={{ left: `${pos}%` }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white border-2 border-[#FCAF0A] shadow-2xs transition-all duration-700 ${
                    isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  } motion-reduce:opacity-100 motion-reduce:scale-100`}
                />
              </div>
            ))}

            {/* 5 Evenly Distributed Circular Icons */}
            <div className="grid grid-cols-5 relative z-20">
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.number} className="flex justify-center group cursor-default">
                    <div
                      className={`w-16 h-16 rounded-full bg-[#F0F5FF] border border-[#D5E3FA] flex items-center justify-center text-[#0A3A7A] transition-all duration-300 shadow-2xs group-hover:scale-105 group-hover:bg-[#E4EEFE] group-hover:border-[#B8D3F9] group-hover:text-[#06284F] ${
                        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                      } motion-reduce:opacity-100 motion-reduce:scale-100`}
                      style={{ transitionDelay: `${idx * 120}ms` }}
                    >
                      <Icon className="w-6 h-6 stroke-[1.75]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: 5 Columns of Content with Delicate Vertical Dividers */}
          <div className="grid grid-cols-5 divide-x divide-slate-200/80 pt-2">
            {STAGES.map((stage, idx) => (
              <div
                key={stage.number}
                className={`flex flex-col ${
                  idx === 0
                    ? 'pr-5 xl:pr-6'
                    : idx === 4
                    ? 'pl-5 xl:pl-6'
                    : 'px-5 xl:px-6'
                } transition-opacity duration-700 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                } motion-reduce:opacity-100 motion-reduce:translate-y-0`}
                style={{ transitionDelay: `${200 + idx * 100}ms` }}
              >
                {/* Stage Number in Gold */}
                <div className="text-sm font-black tracking-wider text-[#FCAF0A] mb-1">
                  {stage.number}
                </div>

                {/* Stage Title */}
                <h3 className="text-lg lg:text-[21px] font-black text-[#06284F] tracking-tight mb-2 leading-snug">
                  {stage.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-[14px] leading-relaxed text-slate-600 font-normal">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── MOBILE / TABLET TIMELINE (< lg: Clean Vertical Sequence) ── */}
        <div className="lg:hidden relative mb-14 pl-3 sm:pl-6">
          {/* Vertical connecting line */}
          <div className="absolute left-[39px] sm:left-[51px] top-6 bottom-6 w-[1.5px] bg-[#E2E8F0] z-0 overflow-hidden">
            <div
              className={`w-full bg-[#D0E2FF] transition-transform duration-1000 ease-out origin-top ${
                isVisible ? 'scale-y-100' : 'scale-y-0'
              } motion-reduce:scale-y-100`}
            />
          </div>

          {/* Vertical Stages List */}
          <div className="space-y-8 sm:space-y-10 relative z-10">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.number}
                  className={`flex items-start gap-4 sm:gap-6 transition-all duration-500 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                  } motion-reduce:opacity-100 motion-reduce:translate-y-0`}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  {/* Left: Stage Icon on Vertical Track */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F0F5FF] border border-[#D5E3FA] flex items-center justify-center text-[#0A3A7A] shrink-0 shadow-2xs">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.75]" />
                  </div>

                  {/* Right: Stage Content */}
                  <div className="pt-1.5 pb-2">
                    {/* Stage Number in Gold */}
                    <div className="text-xs sm:text-sm font-black tracking-wider text-[#FCAF0A] mb-0.5">
                      {stage.number}
                    </div>

                    {/* Stage Title */}
                    <h3 className="text-base sm:text-lg font-black text-[#06284F] tracking-tight mb-1.5">
                      {stage.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-lg">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BOTTOM CALLOUT: Verification & Assessment Quick Access ── */}
        <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/90 p-6 sm:p-8 lg:p-9 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0A3A7A] mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>For Registered Learners &amp; Alumni</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#06284F] tracking-tight">
              Ready to validate your assessment or verify a certificate?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
              Enrolled students can log in to take scheduled module assessments, download study resources, or verify official certificates with digital ID credentials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="/assessment.html"
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#06284F] text-white font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Take the Assessment</span>
            </a>

            <a
              href="/verify.html"
              className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm shadow-2xs transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verify a Certificate</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
