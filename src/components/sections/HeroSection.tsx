'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { BRAND_INFO, HERO_HIGHLIGHTS } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function HeroSection() {
  const { openModal } = useAdvisorModal();

  return (
    <section className="relative bg-white text-[#162033] pt-12 pb-16 lg:pt-18 lg:pb-22 border-b border-[#E2E8F0]">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Asymmetric Editorial Content (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Context Dateline */}
            <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A3A7A]" />
              <span>Skillthinker Solutions • Tiruchirappalli, Tamil Nadu</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-bold text-[#062551] tracking-[-0.03em] leading-[1.14]">
              The right skills can transform your career.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
              {BRAND_INFO.heroSubheadline}
            </p>

            {/* 5 Authentic Highlights as an Editorial Index */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Core Training Standard
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-700">
                {HERO_HIGHLIGHTS.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#0A3A7A] font-semibold text-xs mt-0.5">•</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                href="/#programs"
                className="inline-flex items-center justify-center gap-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-md shadow-xs transition-colors"
              >
                <span>Explore Programs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => openModal()}
                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-md border border-slate-200 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Talk to an Advisor</span>
              </button>

              <a
                href={BRAND_INFO.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-emerald-700 transition-colors inline-flex items-center gap-1 pl-1"
              >
                <span>or WhatsApp: {BRAND_INFO.contactPhone}</span>
              </a>
            </div>

            {/* Location & Training Center Note */}
            <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Center: {BRAND_INFO.officeLocation}. Classroom &amp; Live Interactive Cohorts.</span>
            </div>
          </div>

          {/* Right Column: Architectural Photography Frame & Metrics (5 cols on lg) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Image Container with Crisp 8px Corners & Hairline Border */}
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-[4/3] sm:aspect-[16/11]">
                <Image
                  src="/images/hero-training.jpg"
                  alt="Skillthinker Solutions practical technology training classroom in Trichy"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061830]/85 via-[#061830]/20 to-transparent" />

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#FCAF0A] mb-0.5">
                    Classroom Lab • Trichy
                  </div>
                  <p className="text-xs text-slate-200 leading-snug">
                    Hands-on software development, real-world projects &amp; career guidance.
                  </p>
                </div>
              </div>

              {/* Institutional Metrics Matrix */}
              <div className="mt-4 grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="space-y-0.5">
                  <div className="text-lg sm:text-xl font-bold text-[#062551] font-mono">10</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Technical Tracks</div>
                </div>
                <div className="space-y-0.5 border-x border-slate-200">
                  <div className="text-lg sm:text-xl font-bold text-[#062551] font-mono">5-Step</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Guided Journey</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-lg sm:text-xl font-bold text-[#062551] font-mono">100%</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">Verifiable Certificates</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
