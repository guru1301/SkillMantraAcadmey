import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, Building2, Briefcase, Award, CheckCircle } from 'lucide-react';
import { SERVICE_AREAS } from '@/data/siteData';

export default function WhatWeDoSection() {
  const iconList = [
    <BookOpen key="1" className="w-5 h-5 text-[#0A3A7A]" />,
    <GraduationCap key="2" className="w-5 h-5 text-[#0A3A7A]" />,
    <Building2 key="3" className="w-5 h-5 text-[#0A3A7A]" />,
    <Briefcase key="4" className="w-5 h-5 text-[#0A3A7A]" />,
    <Award key="5" className="w-5 h-5 text-[#0A3A7A]" />,
  ];

  return (
    <section className="py-20 bg-white border-b border-[#E4E8EF]">
      <div className="container-custom">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Core Service Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Training That Connects Learning With Industry
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto mt-2">
            Skill Mantra Academy delivers structured learning experiences designed around practical skills, institutional needs, and evolving workplace requirements.
          </p>
        </div>

        {/* Services Grid (3 cols on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICE_AREAS.map((service, index) => (
            <div
              key={service.id}
              className="academic-card p-7 flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-lg bg-[#F7F9FC] border border-[#E4E8EF] flex items-center justify-center mb-5 group-hover:bg-[#0A3A7A]/5 group-hover:border-[#0A3A7A]/20 transition-colors">
                  {iconList[index]}
                </div>
                <h3 className="text-lg font-bold text-[#162033] mb-3 group-hover:text-[#0A3A7A] transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-[#667085] leading-relaxed mb-5">
                  {service.shortDesc}
                </p>

                <div className="border-t border-[#E4E8EF] pt-4 mb-6">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-2">
                    Key Features
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#162033]">
                    {service.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0B4EA2] shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link
                href={service.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A3A7A] group-hover:text-[#062F68] pt-2"
              >
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 text-[#FCAF0A] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}

          {/* Quick Institutional Consultation Card */}
          <div className="academic-card p-7 bg-[#062F68] text-white flex flex-col justify-between border-transparent hover:border-[#FCAF0A]/40">
            <div>
              <div className="w-12 h-12 rounded-lg bg-blue-900/60 border border-blue-700/60 flex items-center justify-center mb-5 text-[#FCAF0A]">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FCAF0A] mb-1 block">
                Custom Institutional Solutions
              </span>
              <h3 className="text-lg font-bold text-white mb-3">
                Need a Custom Program for Your Institution?
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                We design specialized training schedules, CoE labs, and technical immersion bootcamps tailored to college semester requirements and student cohorts.
              </p>
            </div>

            <Link
              href="/contact?intent=institutional-program"
              className="inline-flex items-center justify-center gap-2 bg-[#FCAF0A] hover:bg-[#F5A800] text-[#062F68] font-semibold text-sm px-4 py-3 rounded-lg transition-all shadow-sm"
            >
              <span>Schedule Institutional Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
