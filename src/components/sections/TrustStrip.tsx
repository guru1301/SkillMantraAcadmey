import React from 'react';
import { Building, Users, GraduationCap, Briefcase } from 'lucide-react';
import { TRUST_PILLARS } from '@/data/siteData';

export default function TrustStrip() {
  const iconMap = [
    <Building key="1" className="w-5 h-5 text-[#0A3A7A]" />,
    <GraduationCap key="2" className="w-5 h-5 text-[#0A3A7A]" />,
    <Users key="3" className="w-5 h-5 text-[#0A3A7A]" />,
    <Briefcase key="4" className="w-5 h-5 text-[#0A3A7A]" />,
  ];

  return (
    <section className="bg-[#F7F9FC] border-b border-[#E4E8EF] py-10">
      <div className="container-custom">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">
            Target Stakeholders
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#162033] mt-1">
            Training Purpose-Built For
          </h2>
          <div className="gold-accent-line mx-auto mt-2.5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_PILLARS.map((item, index) => (
            <div
              key={item.title}
              className="bg-white border border-[#E4E8EF] rounded-xl p-5 hover:border-[#CBD5E1] transition-all duration-200 shadow-xs"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-100/60">
                  {iconMap[index]}
                </div>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-slate-100 text-[#0A3A7A]">
                  {item.badge}
                </span>
              </div>
              <h3 className="font-semibold text-base text-[#162033] mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
