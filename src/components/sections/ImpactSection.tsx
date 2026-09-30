import React from 'react';
import { IMPACT_STATISTICS } from '@/data/siteData';
import { AlertCircle } from 'lucide-react';

/* 
  ADMIN / CMS INTEGRATION NOTE:
  Replace placeholder statistics only after client verification.
  Do not invent numbers. Large typography indicates institutional readiness.
*/
export default function ImpactSection() {
  return (
    <section className="py-20 bg-white border-b border-[#E4E8EF]">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Institutional Scale & Engagement
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Designed for Measurable Academic Impact
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            Our training outcomes are evaluated through verifiable student competencies, faculty satisfaction metrics, and institutional institutional placement impact.
          </p>
        </div>

        {/* Impact Numbers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {IMPACT_STATISTICS.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#F7F9FC] border border-[#E4E8EF] rounded-xl p-8 text-center flex flex-col justify-between"
            >
              <div>
                <div className="text-4xl sm:text-5xl font-extrabold text-[#0A3A7A] tracking-tight font-mono mb-2">
                  {stat.value}
                </div>
                <h3 className="text-base font-bold text-[#162033] mb-1">
                  {stat.label}
                </h3>
                <p className="text-xs text-[#667085] leading-relaxed">
                  {stat.subtext}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E4E8EF] mt-5">
                <span className="text-[10px] text-slate-400 font-mono tracking-wide">
                  {stat.note}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Transparent Institutional Verification Notice */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500 text-center">
          <AlertCircle className="w-3.5 h-3.5 text-[#FCAF0A] shrink-0" />
          <span>
            Institutional metrics and batch data are updated quarterly upon verified academic audit.
          </span>
        </div>
      </div>
    </section>
  );
}
