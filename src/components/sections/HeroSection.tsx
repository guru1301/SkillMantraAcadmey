'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function HeroSection() {
  const { openModal } = useAdvisorModal();

  return (
    <section className="relative min-h-[100dvh] w-full bg-[#041427] text-white overflow-hidden flex flex-col justify-between pt-16 pb-4 sm:pt-20 sm:pb-6">
      {/* Background cinematic photograph with multi-layer deep gradient */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-training.jpg"
          alt="Skillthinker Solutions live training classroom — Anna Nagar, Trichy"
          fill
          priority
          className="object-cover object-center brightness-75"
          sizes="100vw"
        />
        {/* Cinematic atmospheric overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#031122]/98 via-[#051C38]/92 to-[#041427]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041427] via-transparent to-[#031122]/80" />
        <div className="absolute inset-0 bg-tech-grid opacity-20" />
      </div>

      {/* Primary Hero Stage - Centered vertically, guaranteed 100% viewport fit */}
      <div className="relative z-10 container-custom w-full my-auto">
        <div className="max-w-3xl xl:max-w-4xl py-2">
          
          {/* Brand Eyebrow - Pure Editorial (No AI pill badge) */}
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FCAF0A]" />
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#FCAF0A]">
              Skillthinker Solutions
            </span>
          </div>

          {/* Master Headline - Executive, sharp human-crafted typography */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] xl:text-[50px] font-extrabold tracking-[-0.03em] leading-[1.1] text-white mb-2.5 sm:mb-3.5">
            The right skills<br />
            <span className="text-[#FCAF0A]">
              can transform
            </span><br />
            your career.
          </h1>

          {/* Exact Narrative */}
          <p className="text-xs sm:text-sm md:text-[15px] text-slate-300 leading-relaxed max-w-2xl font-normal mb-4 sm:mb-5">
            Our training programs are designed to help students, graduates, and working professionals develop practical, industry-relevant skills and prepare for the demands of the modern workplace.
          </p>

          {/* Action Button Terminal */}
          <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
            <Link
              href="/#courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#FCAF0A] hover:bg-[#F5A800] text-[#041427] font-extrabold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4 text-[#041427]" />
            </Link>

            <button
              type="button"
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md transition-colors cursor-pointer"
            >
              <span>Talk to an Advisor</span>
            </button>
          </div>

          {/* Directly below Action Buttons: The 3 Metrics - Guaranteed In-Viewport on all screens */}
          <div className="pt-3 sm:pt-4 border-t border-white/10 grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl">
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#FCAF0A] tracking-tight">
                10
              </div>
              <div className="text-[11px] sm:text-xs md:text-sm text-slate-300 mt-0.5 font-medium leading-snug">
                Industry-relevant programs
              </div>
            </div>

            <div className="border-l border-white/10 pl-3 sm:pl-6">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Hands-On
              </div>
              <div className="text-[11px] sm:text-xs md:text-sm text-slate-300 mt-0.5 font-medium leading-snug">
                Projects &amp; real-world learning
              </div>
            </div>

            <div className="border-l border-white/10 pl-3 sm:pl-6">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#FCAF0A] tracking-tight">
                Certified
              </div>
              <div className="text-[11px] sm:text-xs md:text-sm text-slate-300 mt-0.5 font-medium leading-snug">
                Certification on completion
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
