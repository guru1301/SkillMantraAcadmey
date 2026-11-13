'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Search, Award, ArrowRight, ArrowLeft } from 'lucide-react';
import { CERTIFICATE_TIERS, BRAND_INFO } from '@/data/siteData';

export default function CertificateVerifyPage() {
  const router = useRouter();
  const [certCode, setCertCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = certCode.trim();
    if (!clean) {
      setErrorMsg('Please enter a certificate verification code.');
      return;
    }
    setErrorMsg('');
    router.push(`/verify/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/50 to-white py-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0A3A7A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Main Verification Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          <div className="h-2.5 w-full bg-gradient-to-r from-[#0A3A7A] via-[#0B4EA2] to-[#FCAF0A]" />

          <div className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3A7A] mx-auto shadow-sm ring-8 ring-blue-500/10">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#062F68] tracking-tight">
                Official Credential Verification
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
                Skillthinker Central Credential Registry • Trichy, Tamil Nadu
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Skillthinker digital certificates are awarded upon successful completion of structured courses, practical laboratory evaluations, and capstone project defense. Enter the certificate code below to verify authenticity.
            </p>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3 pt-2">
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. SKT-2026-XXXX or certificate code"
                  value={certCode}
                  onChange={(e) => {
                    setCertCode(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:border-[#0A3A7A] focus:outline-none shadow-xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-600 font-medium text-left">{errorMsg}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#062F68] text-white text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Verify Credential Authenticity</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Tiers Reference */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            About Skillthinker Performance Tiers
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {CERTIFICATE_TIERS.map((tier) => (
              <div key={tier.tier} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${tier.badgeColor}`}>
                  {tier.tier}
                </span>
                <div className="font-bold text-[#162033] pt-1">{tier.title}</div>
                <p className="text-slate-500 leading-normal">{tier.description}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center text-xs text-slate-400">
            Need verification assistance? Contact{' '}
            <a href={`mailto:${BRAND_INFO.contactEmail}`} className="text-[#0A3A7A] hover:underline font-semibold">
              {BRAND_INFO.contactEmail}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

