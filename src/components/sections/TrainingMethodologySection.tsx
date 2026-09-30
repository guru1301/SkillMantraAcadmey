import React from 'react';
import { TRAINING_METHODOLOGY } from '@/data/siteData';

export default function TrainingMethodologySection() {
  return (
    <section className="py-20 bg-white border-b border-[#E4E8EF]">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Instructional Rigor
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Our 6-Stage Training Methodology
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            A disciplined, iterative instructional framework that ensures every training hour produces tangible, verifiable skill acquisition.
          </p>
        </div>

        {/* 6 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRAINING_METHODOLOGY.map((step) => (
            <div
              key={step.number}
              className="academic-card p-6 flex flex-col justify-between hover:border-[#0A3A7A]/30"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-extrabold text-[#0A3A7A] font-mono tracking-tight">
                    {step.number}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-[#FCAF0A]" />
                </div>
                <h3 className="text-lg font-bold text-[#162033] mb-2">
                  {step.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  {step.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E4E8EF] mt-5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Phase {step.number} of 06
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
