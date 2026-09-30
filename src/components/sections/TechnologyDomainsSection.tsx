import React from 'react';
import { TECHNOLOGY_DOMAINS } from '@/data/siteData';
import { Code2, Database, Cloud, ShieldCheck, Palette, Info } from 'lucide-react';

export default function TechnologyDomainsSection() {
  const domainIcons = [
    <Code2 key="1" className="w-5 h-5 text-[#0A3A7A]" />,
    <Database key="2" className="w-5 h-5 text-[#0A3A7A]" />,
    <Cloud key="3" className="w-5 h-5 text-[#0A3A7A]" />,
    <ShieldCheck key="4" className="w-5 h-5 text-[#0A3A7A]" />,
    <Palette key="5" className="w-5 h-5 text-[#0A3A7A]" />,
  ];

  return (
    <section className="py-20 bg-[#F7F9FC] border-b border-[#E4E8EF]">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Technology Ecosystem
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Domains & Technical Capabilities
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            Our training frameworks encompass foundational computer science, core programming disciplines, and high-demand emerging domains.
          </p>
        </div>

        {/* Domains Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECHNOLOGY_DOMAINS.map((domain, index) => (
            <div
              key={domain.category}
              className="bg-white border border-[#E4E8EF] rounded-xl p-6 shadow-2xs hover:border-[#CBD5E1] transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
                  {domainIcons[index % domainIcons.length]}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#162033]">
                    {domain.category}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-[#667085] mb-5 leading-relaxed">
                {domain.description}
              </p>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Focus Stacks & Frameworks
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {domain.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#F7F9FC] text-[#162033] border border-[#E4E8EF]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Institutional Note Card */}
          <div className="bg-[#0A3A7A] text-white rounded-xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2">
                <Info className="w-4 h-4 text-[#FCAF0A]" />
                <span>Custom Domain Alignment</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Department-Specific Lab Configuration
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                All technologies are modularly tailored to suit your college&apos;s department specifications (CSE, IT, AI-DS, MCA, BCA) and laboratory hardware configurations.
              </p>
            </div>

            <div className="pt-3 border-t border-blue-800/80 text-[11px] text-slate-300 italic">
              Note: Technology tracks are periodically reviewed against current industry demand.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
