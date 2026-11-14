'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function HeroSection() {
  const { openModal } = useAdvisorModal();

  return (
    <section className="relative min-h-[90vh] lg:min-h-[720px] bg-[#041427] text-white overflow-hidden flex items-center pt-24 pb-16 lg:pt-32 lg:pb-20">
      {/* Background cinematic photograph with multi-layer deep gradient */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-training.jpg"
          alt="Skillthinker Solutions live training classroom — Anna Nagar, Trichy"
          fill
          priority
          className="object-cover object-center brightness-75 scale-105"
          sizes="100vw"
        />
        {/* Cinematic atmospheric overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#031122]/98 via-[#051C38]/92 to-[#041427]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041427] via-transparent to-[#031122]/80" />
        <div className="absolute inset-0 bg-tech-grid opacity-25" />
      </div>

      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#0A3A7A]/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-[#FCAF0A]/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Primary Hero Stage */}
      <div className="relative z-10 container-custom w-full">
        <div className="max-w-3xl xl:max-w-4xl">
          
          {/* Brand Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FCAF0A]" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-white/95">
              Skillthinker Solutions
            </span>
          </div>

          {/* Master Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-5">
            The right skills<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCAF0A] via-[#FDC34E] to-[#F5A800]">
              can transform
            </span><br />
            your career.
          </h1>

          {/* Exact Narrative */}
          <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-2xl font-normal mb-8">
            Our training programs are designed to help students, graduates, and working professionals develop practical, industry-relevant skills and prepare for the demands of the modern workplace.
          </p>

          {/* Action Button Terminal */}
          <div className="flex flex-wrap items-center gap-3.5 mb-10">
            <Link
              href="/#courses"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#FCAF0A] to-[#E59B00] hover:from-[#FDBE2E] hover:to-[#FCAF0A] text-[#041427] font-bold text-sm shadow-md shadow-[#FCAF0A]/20 hover:shadow-[#FCAF0A]/40 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4 text-[#041427]" />
            </Link>

            <button
              type="button"
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all hover:-translate-y-0.5 cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-[#FCAF0A]" />
              <span>Talk to an Advisor</span>
            </button>
          </div>

          {/* Directly below Talk to an Advisor: The 3 Metrics */}
          <div className="pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#FCAF0A] tracking-tight">
                10
              </div>
              <div className="text-xs sm:text-sm text-slate-300 mt-1.5 font-medium leading-snug">
                Industry-relevant programs
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-8">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Hands-On
              </div>
              <div className="text-xs sm:text-sm text-slate-300 mt-1.5 font-medium leading-snug">
                Projects &amp; real-world learning
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-8">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#FCAF0A] tracking-tight">
                Certified
              </div>
              <div className="text-xs sm:text-sm text-slate-300 mt-1.5 font-medium leading-snug">
                Certification on completion
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
