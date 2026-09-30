import React from 'react';
import Link from 'next/link';
import { Building2, Cpu, GraduationCap, Handshake, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PartnersSection() {
  const frameworkCategories = [
    {
      icon: <GraduationCap className="w-5 h-5 text-[#0A3A7A]" />,
      title: 'Academic Institutions',
      desc: 'Engineering colleges, autonomous campuses, and state universities implementing structured technical semester tracks and CoE initiatives.',
      badge: 'Academic Alliances',
    },
    {
      icon: <Building2 className="w-5 h-5 text-[#0A3A7A]" />,
      title: 'Corporate & Industry Partners',
      desc: 'Technology organizations offering live problem statements, placement opportunity visibility, and technical capstone evaluations.',
      badge: 'Industry Connect',
    },
    {
      icon: <Cpu className="w-5 h-5 text-[#0A3A7A]" />,
      title: 'Open Source & Technology Ecosystem',
      desc: 'Adopting globally recognized open-source architectures, cloud toolchains, and developer communities.',
      badge: 'Modern Stacks',
    },
  ];

  return (
    <section className="py-20 bg-white border-b border-[#E4E8EF]">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Collaborative Framework
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Building Meaningful Academic & Industry Connections
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            We partner with higher-education campuses and enterprise teams through disciplined, verified academic engagement frameworks.
          </p>
        </div>

        {/* 3 Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {frameworkCategories.map((item) => (
            <div
              key={item.title}
              className="academic-card p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-[#F7F9FC] border border-[#E4E8EF]">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-[#0A3A7A]">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#162033] mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E4E8EF] mt-5">
                <span className="text-xs font-semibold text-[#0A3A7A] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0B4EA2]" />
                  <span>Institutional Engagement Protocol</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Institutional Callout */}
        <div className="bg-[#F7F9FC] border border-[#E4E8EF] rounded-xl p-8 text-center max-w-2xl mx-auto">
          <div className="w-10 h-10 rounded-full bg-blue-100/70 border border-blue-200 flex items-center justify-center text-[#0A3A7A] mx-auto mb-3">
            <Handshake className="w-5 h-5 text-[#0A3A7A]" />
          </div>
          <h4 className="text-base font-bold text-[#162033] mb-1">
            Looking to Establish an Academic MoU?
          </h4>
          <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mb-4">
            We sign structured training and faculty development MoUs with engineering and science colleges, establishing clear semester goals, lab milestones, and assessment rubrics.
          </p>
          <Link
            href="/contact?intent=mou-partnership"
            className="inline-flex items-center gap-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <span>Request Institutional MoU Information</span>
            <ArrowRight className="w-4 h-4 text-[#FCAF0A]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
