import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronRight, School, Building, Award } from 'lucide-react';
import { INSTITUTIONAL_SERVICES, INSTITUTION_PROCESS_STEPS } from '@/data/siteData';

export default function InstitutionalSection() {
  return (
    <section id="for-institutions" className="py-20 bg-white border-b border-[#E4E8EF]">
      <div className="container-custom">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Academic Partnerships & Campus MoUs
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Empowering Institutions Through Industry-Relevant Training
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            Skill Mantra Academy partners with forward-thinking academic leadership—Principals, Deans, HODs, and Placement Officers—to deliver impactful student workshops, FDPs, and technical bootcamps.
          </p>
        </div>

        {/* Institutions We Work With Strip */}
        <div className="bg-[#F7F9FC] border border-[#E4E8EF] rounded-xl p-6 mb-16">
          <div className="text-center mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Institutional Spectrum We Serve
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg border border-[#E4E8EF] shadow-2xs">
              <School className="w-6 h-6 text-[#0A3A7A] mx-auto mb-2" />
              <div className="text-sm font-bold text-[#162033]">Engineering Colleges</div>
              <div className="text-xs text-[#667085] mt-0.5">CSE, IT, ECE & Allied branches</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E4E8EF] shadow-2xs">
              <Building className="w-6 h-6 text-[#0A3A7A] mx-auto mb-2" />
              <div className="text-sm font-bold text-[#162033]">Arts & Science Colleges</div>
              <div className="text-xs text-[#667085] mt-0.5">B.Sc, BCA, MCA & Data tracks</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E4E8EF] shadow-2xs">
              <Award className="w-6 h-6 text-[#0A3A7A] mx-auto mb-2" />
              <div className="text-sm font-bold text-[#162033]">Universities & Autonomous</div>
              <div className="text-xs text-[#667085] mt-0.5">Curricular elective alignment</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E4E8EF] shadow-2xs">
              <School className="w-6 h-6 text-[#0A3A7A] mx-auto mb-2" />
              <div className="text-sm font-bold text-[#162033]">Polytechnic Institutions</div>
              <div className="text-xs text-[#667085] mt-0.5">Applied technical skills</div>
            </div>
          </div>
        </div>

        {/* Institutional Services Grid */}
        <div className="mb-20">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#162033]">
              Institutional Engagement Offerings
            </h3>
            <p className="text-sm text-[#667085] mt-1">
              Customized training models adapted to institutional calendars and campus infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INSTITUTIONAL_SERVICES.map((srv) => (
              <div
                key={srv.title}
                className="academic-card p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0A3A7A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mb-3">
                    {srv.scope}
                  </span>
                  <h4 className="text-base font-bold text-[#162033] mb-2">
                    {srv.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                    {srv.description}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#E4E8EF] mt-4 flex items-center gap-2 text-xs font-semibold text-[#0A3A7A]">
                  <CheckCircle2 className="w-4 h-4 text-[#0B4EA2]" />
                  <span>Syllabus & Lab Plan Provided</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5-Stage Institutional Delivery Process */}
        <div className="bg-[#062F68] text-white rounded-2xl p-8 lg:p-12 shadow-md">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-1 block">
              Execution Methodology
            </span>
            <h3 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Structured 5-Stage Institutional Delivery
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              Every institutional collaboration is governed by a transparent, milestone-driven framework ensuring accountability and measurable outcomes.
            </p>
          </div>

          {/* Process Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            {INSTITUTION_PROCESS_STEPS.map((step, idx) => (
              <div key={step.step} className="relative group">
                {/* Step Card */}
                <div className="bg-blue-950/70 border border-blue-800/80 rounded-xl p-5 h-full flex flex-col justify-between transition-all group-hover:border-[#FCAF0A]">
                  <div>
                    <span className="text-2xl font-black text-[#FCAF0A]/90 block mb-2 font-mono">
                      {step.step}
                    </span>
                    <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Arrow indicator between steps for desktop */}
                {idx < INSTITUTION_PROCESS_STEPS.length - 1 && (
                  <div className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-[#FCAF0A]/60">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Box */}
          <div className="mt-12 pt-8 border-t border-blue-900 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-base font-semibold text-white">
                Initiate a Partnership for Your Academic Institution
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Our academic coordinators can prepare an institutional training proposal within 48 hours.
              </div>
            </div>

            <Link
              href="/contact?intent=institutional-partnership"
              className="inline-flex items-center gap-2 bg-[#FCAF0A] hover:bg-[#F5A800] text-[#062F68] font-bold text-sm px-6 py-3 rounded-lg shadow-sm transition-all whitespace-nowrap"
            >
              <span>Discuss an Institutional Program</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
