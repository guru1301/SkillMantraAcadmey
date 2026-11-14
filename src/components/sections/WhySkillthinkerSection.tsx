'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Award, 
  Users, 
  Code, 
  TrendingUp, 
  Compass, 
  ShieldCheck, 
  Briefcase,
  Sparkles,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { WHY_CHOOSE_ITEMS, BRAND_INFO } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

const ITEM_ICONS = [
  Code,        // 01 Industry-relevant
  Users,       // 02 Experienced mentors
  TrendingUp,  // 03 Hands-on learning
  Briefcase,   // 04 Career-focused
  Compass,     // 05 Personalized guidance
  Award,       // 06 Certification
  ShieldCheck, // 07 Interview prep
];

export default function WhySkillthinkerSection() {
  const { openModal } = useAdvisorModal();

  return (
    <section id="why-skillthinker" className="py-16 lg:py-22 bg-white border-b border-slate-200">
      <div className="container-custom space-y-10 lg:space-y-12">
        
        {/* Header & Subtitle */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-slate-150">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Why Skillthinker</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#06284F] tracking-tight leading-[1.12]">
              The right skills create <span className="text-[#0A3A7A]">real opportunities.</span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal mt-3">
              Curriculum engineered around practical industry outcomes, modern tooling, and genuine workplace readiness. Every learner gains real confidence through active project execution.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A3A7A] hover:bg-[#06284F] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>Talk to an Advisor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <Link
              href="/#programs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
            >
              <span>View All 10 Courses</span>
            </Link>
          </div>
        </div>

        {/* Compact 4x2 Bento Grid: 7 Advantage Cards + 1 Campus Anchor Card (Zero waste, Zero drag) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {WHY_CHOOSE_ITEMS.map((item, i) => {
            const IconComponent = ITEM_ICONS[i % ITEM_ICONS.length];
            return (
              <div
                key={item.title}
                className="group p-5 rounded-2xl bg-[#F8FAFC] hover:bg-white border border-slate-200/90 hover:border-[#0A3A7A]/30 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0A3A7A] shadow-2xs group-hover:bg-[#0A3A7A] group-hover:text-white transition-colors">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-black text-slate-400 group-hover:text-[#FCAF0A] transition-colors">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#0A3A7A] transition-colors leading-snug mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}

          {/* 8th Card: Trichy Center of Excellence Facility Anchor */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#06284F] to-[#0A3A7A] text-white shadow-md flex flex-col justify-between border border-white/10 group">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FCAF0A]">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-bold tracking-wider uppercase border border-emerald-400/30">
                  Active Facility
                </span>
              </div>

              <h3 className="text-base font-extrabold text-white leading-snug mb-1.5">
                Trichy Center of Excellence
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed font-normal mb-2">
                {BRAND_INFO.officeLocation}
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FCAF0A] shrink-0" />
                <span>Dedicated offline lab &amp; mentor desks</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openModal()}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#FCAF0A] hover:bg-[#FDBE2E] text-[#06284F] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Consult Advisor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
