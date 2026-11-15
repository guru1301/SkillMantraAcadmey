'use client';

import React from 'react';
import Image from 'next/image';
import { Award, CheckCircle2 } from 'lucide-react';
import { CERTIFICATE_TIERS } from '@/data/siteData';

export default function CertificationsSection() {
  return (
    <section id="certifications" className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="container-custom">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-bold tracking-[0.18em] uppercase text-[#0A3A7A] mb-3">
            Digital Credential Authority
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-[1.12]">
            100% Digitally Verifiable Credentials with <span className="text-[#0A3A7A]">3 Merit Tiers.</span>
          </h2>
          <p className="text-slate-600 text-base mt-3 max-w-2xl font-normal leading-relaxed">
            Every credential issued by Skillthinker Solutions is backed by rigorous practical evaluations, lab assignments, and project defense. Recruiters, HR teams, and academic institutions can verify certificate authenticity instantly online.
          </p>
        </div>

        {/* Certificate Visual Showcase + Merit Tiers Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left: Clean Official Certificate Showcase (6 cols) */}
          <div className="lg:col-span-6 relative group">
            {/* Ambient Frame Container */}
            <div className="relative rounded-2xl bg-white p-2.5 sm:p-4 shadow-xl border border-slate-200/90 transition-all duration-300 hover:shadow-2xl">
              
              {/* Clean Certificate Image (No Overlays) */}
              <div className="relative rounded-xl overflow-hidden bg-white shadow-xs border border-slate-200/60 select-none">
                <Image
                  src="/images/certificates/student-certificate-template.jpg"
                  alt="Skillthinker Solutions Official Certificate of Completion"
                  width={1024}
                  height={682}
                  className="w-full h-auto object-contain block rounded-lg"
                  priority
                  unoptimized
                />
              </div>

              {/* Bottom Floating Live Verification Seal */}
              <div className="absolute -bottom-3 right-4 sm:right-6 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 border-2 border-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>100% Digitally Verifiable</span>
              </div>
            </div>

            {/* Authentic Credential Assurance Caption */}
            <p className="text-center text-xs text-slate-400 font-medium mt-5">
              Official physical &amp; digital credential issued to graduating cohort members upon course defense.
            </p>
          </div>

          {/* Right: 3 Merit Tiers (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {CERTIFICATE_TIERS.map((tier) => (
              <div
                key={tier.tier}
                className="p-6 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${tier.badgeColor}`}>
                      {tier.tier} Level
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {tier.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {tier.description}
                  </p>
                  <div className="text-xs text-[#0A3A7A] font-semibold pt-1">
                    Criteria: <span className="text-slate-600 font-normal">{tier.criteria}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-xs font-mono text-slate-400">
                  <Award className="w-4 h-4 text-[#FCAF0A]" />
                  <span>Encrypted ID</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
