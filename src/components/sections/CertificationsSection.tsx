'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Award, ShieldCheck, CheckCircle2, Search, ArrowRight, Sparkles } from 'lucide-react';
import { CERTIFICATE_TIERS, BRAND_INFO } from '@/data/siteData';

export default function CertificationsSection() {
  const router = useRouter();
  const [certCode, setCertCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = certCode.trim();
    if (!clean) {
      setErrorMsg('Please enter a valid certificate code');
      return;
    }
    setErrorMsg('');
    router.push(`/verify/${encodeURIComponent(clean)}`);
  };

  return (
    <section id="certifications" className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="container-custom">
        
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Digital Credential Authority</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-tight">
            100% Digitally Verifiable Credentials with <span className="text-[#0A3A7A]">3 Merit Tiers.</span>
          </h2>
          <div className="w-12 h-1 bg-[#FCAF0A] mt-4 rounded-full" />
          <p className="text-slate-600 text-base mt-4 max-w-2xl font-normal leading-relaxed">
            Every credential issued by Skillthinker Solutions is backed by rigorous practical evaluations, lab assignments, and project defense. Recruiters, HR teams, and academic institutions can verify certificate authenticity instantly online.
          </p>
        </div>

        {/* Certificate Visual Showcase + Merit Tiers Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-14">
          
          {/* Left: Certificate Mockup Card (5 cols) */}
          <div className="lg:col-span-5 relative group">
            <div className="relative rounded-2xl bg-gradient-to-b from-white via-slate-50 to-amber-50/30 p-7 sm:p-8 text-slate-900 border-4 border-[#FCAF0A] shadow-xl">
              
              {/* Certificate Inner Border */}
              <div className="border border-slate-300 rounded-xl p-5 sm:p-6 text-center space-y-4 bg-white/95">
                {/* Logo & Header */}
                <div className="flex justify-center">
                  <Image
                    src="/images/brand/logo-brand.png"
                    alt="Skillthinker Solutions"
                    width={130}
                    height={32}
                    className="h-8 w-auto object-contain"
                  />
                </div>

                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#0A3A7A] font-bold">
                  Certificate of Competence &amp; Merit
                </div>

                <div className="text-xs text-slate-500 font-serif italic">
                  This is proudly presented to
                </div>

                <div className="text-lg sm:text-xl font-bold text-[#06284F] border-b-2 border-slate-200 pb-1 font-serif">
                  Karthik Ramesh
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  for successfully demonstrating project excellence in <br />
                  <strong className="text-slate-900">Web &amp; Full Stack Development</strong>
                </p>

                {/* Badge & Seal Row */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <div className="text-left">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900">
                      ★ Gold Merit Tier
                    </span>
                    <div className="text-[9px] font-mono text-slate-400 mt-1">
                      ID: SKT-2026-FSD-0842
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#0A3A7A] flex items-center justify-center bg-blue-50">
                    <ShieldCheck className="w-6 h-6 text-[#0A3A7A]" />
                  </div>
                </div>
              </div>

              {/* Floating Verification Tag */}
              <div className="absolute -bottom-3 -right-3 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-md flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Online</span>
              </div>
            </div>
          </div>

          {/* Right: 3 Merit Tiers (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
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

        {/* Real-Time Certificate Verification Form Terminal */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 sm:p-10 shadow-xs max-w-3xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-[#0A3A7A] mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#06284F]">
              Instant Certificate Verification Portal
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Enter any issued Skillthinker credential code below to authenticate candidate name, program track, issue date, and merit tier.
            </p>
          </div>

          <form onSubmit={handleVerify} className="max-w-md mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. SKT-2026-FSD-0842"
                  value={certCode}
                  onChange={(e) => {
                    setCertCode(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-[#0A3A7A] focus:outline-none shadow-2xs"
                  aria-label="Certificate Code"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#06284F] text-white font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Verify</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 text-center font-medium">{errorMsg}</p>
            )}

            <div className="text-center text-[11px] text-slate-400 pt-1">
              Public registry endpoint: <span className="font-mono text-[#0A3A7A]">/verify/[code]</span>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
}
