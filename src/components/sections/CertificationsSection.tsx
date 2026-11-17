'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Medal, CheckCircle2 } from 'lucide-react';
import { CERTIFICATE_TIERS } from '@/data/siteData';

const TIER_ACCENTS: Record<string, { iconColor: string; badgeClass: string }> = {
  Bronze: {
    iconColor: 'text-[#92400E]',
    badgeClass: 'text-[#92400E] bg-[#FDF6ED] border-[#F3D7B5]',
  },
  Silver: {
    iconColor: 'text-[#475569]',
    badgeClass: 'text-[#334155] bg-[#F1F5F9] border-[#CBD5E1]',
  },
  Gold: {
    iconColor: 'text-[#B45309]',
    badgeClass: 'text-[#92400E] bg-[#FEF9EE] border-[#FDE68A]',
  },
};

export default function CertificationsSection() {
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="certifications"
      ref={sectionRef}
      aria-labelledby="certifications-heading"
      className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200 select-none overflow-hidden"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div
          className={`max-w-3xl mb-12 lg:mb-14 transition-all duration-500 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          } motion-reduce:opacity-100 motion-reduce:translate-y-0`}
        >
          {/* Overline with Brand Indicator */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-5 h-0.5 rounded-full bg-[#1548AE]" />
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#06284F]">
              DIGITAL CREDENTIAL AUTHORITY
            </span>
          </div>

          {/* Headline */}
          <h2
            id="certifications-heading"
            className="text-2xl sm:text-3xl lg:text-[38px] xl:text-[40px] font-black tracking-tight leading-[1.15] text-[#06284F]"
          >
            100% Digitally Verifiable Credentials with{' '}
            <span className="text-[#0A3A7A]">3 Merit Tiers</span>.
          </h2>

          {/* Description */}
          <p className="text-slate-600 text-sm sm:text-base font-normal mt-3 max-w-2xl leading-relaxed">
            Every credential issued by Skillthinker Solutions is backed by rigorous practical
            evaluations, lab assignments, and project defense. Recruiters, HR teams, and academic
            institutions can verify certificate authenticity instantly online.
          </p>
        </div>

        {/* Certificate Presentation & Credential Levels Grid */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center transition-opacity duration-600 ease-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          } motion-reduce:opacity-100`}
        >
          {/* Left: Certificate Presentation */}
          <div className="lg:col-span-6 w-full">
            {/* Architectural Frame with Restrained Border and Natural Shadow */}
            <div className="relative rounded-xl bg-white p-2.5 sm:p-3 border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)]">
              <div className="relative rounded-lg overflow-hidden bg-white border border-slate-200/60 select-none">
                <Image
                  src="/images/certificates/student-certificate-template.jpg"
                  alt="Skillthinker Solutions Official Certificate of Completion"
                  width={1024}
                  height={682}
                  className="w-full h-auto object-contain block rounded"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Compact Verification Information Line */}
            <div className="flex items-center gap-2 pt-3.5 px-1 text-xs text-slate-600 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#1548AE] shrink-0" />
              <span>
                Official physical &amp; digital credential issued with verifiable ID upon assessment completion.
              </span>
            </div>
          </div>

          {/* Right: Certificate Levels (Three Elegant Horizontal Credential Entries) */}
          <div className="lg:col-span-6 w-full">
            <div className="divide-y divide-slate-200/80">
              {CERTIFICATE_TIERS.map((tier) => {
                const accent = TIER_ACCENTS[tier.tier] || {
                  iconColor: 'text-[#1548AE]',
                  badgeClass: 'text-slate-800 bg-slate-100 border-slate-300',
                };

                return (
                  <div
                    key={tier.tier}
                    className="group py-5 sm:py-6 first:pt-0 last:pb-0 -mx-3 px-3 rounded-lg hover:bg-slate-50/80 transition-colors duration-200"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Small, Refined Medal Symbol */}
                      <div className="pt-0.5 shrink-0" aria-hidden="true">
                        <Medal className={`w-4 h-4 ${accent.iconColor}`} />
                      </div>

                      {/* Credential Details */}
                      <div className="flex-1 min-w-0">
                        {/* Level & Title Header */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${accent.badgeClass}`}
                          >
                            {tier.tier} Level
                          </span>
                          <h3 className="text-base font-bold text-[#06284F] tracking-tight">
                            {tier.title}
                          </h3>
                        </div>

                        {/* Description */}
                        <p className="text-xs sm:text-[13.5px] text-slate-600 leading-relaxed font-normal mb-2">
                          {tier.description}
                        </p>

                        {/* Eligibility & Assessment Criteria */}
                        <div className="text-xs text-slate-500 leading-normal flex flex-wrap items-baseline gap-1.5">
                          <span className="font-semibold text-[#0A3A7A] uppercase tracking-wide text-[11px] shrink-0">
                            Criteria:
                          </span>
                          <span className="text-slate-600 font-normal">
                            {tier.criteria}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
