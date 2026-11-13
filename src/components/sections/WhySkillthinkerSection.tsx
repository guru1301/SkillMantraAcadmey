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
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { WHY_CHOOSE_ITEMS, BRAND_INFO } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

const ITEM_ICONS = [
  Code,
  Users,
  Compass,
  TrendingUp,
  Award,
  ShieldCheck,
  Briefcase,
];

export default function WhySkillthinkerSection() {
  const { openModal } = useAdvisorModal();

  return (
    <section id="why-skillthinker" className="relative py-24 lg:py-32 bg-[#051C38] text-white overflow-hidden border-t border-b border-white/10">
      {/* Background architectural textures */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#0A3A7A]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FCAF0A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Sticky Left Editorial Pillar */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCAF0A]/10 border border-[#FCAF0A]/30 text-[#FCAF0A] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Proven Training Methodology</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
              The right skills create <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCAF0A] to-[#F5A800]">real opportunities.</span>
            </h2>

            <p className="text-base text-slate-300 leading-relaxed font-normal">
              Every course at Skillthinker Solutions is engineered around practical industry outcomes, direct mentorship, and live hands-on projects — turning theoretical concepts into workplace readiness.
            </p>

            {/* Quick Trichy Campus Card */}
            <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A]">
                Skillthinker Center of Excellence
              </div>
              <div className="text-sm text-slate-200">
                {BRAND_INFO.officeLocation}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Dedicated offline laboratory &amp; live mentor desks</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => openModal()}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#FCAF0A] hover:bg-[#FDBE2E] text-[#041427] font-bold text-sm shadow-md shadow-[#FCAF0A]/20 transition-all cursor-pointer"
              >
                <span>Talk to an Advisor</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/#programs"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white text-sm font-semibold transition-all"
              >
                <span>View All 10 Courses</span>
              </Link>
            </div>
          </div>

          {/* Right: 7 High-Impact Structured Cards (No empty white spaces!) */}
          <div className="lg:col-span-7 space-y-4">
            {WHY_CHOOSE_ITEMS.map((item, i) => {
              const IconComponent = ITEM_ICONS[i % ITEM_ICONS.length];
              return (
                <div
                  key={item.title}
                  className="group relative p-6 sm:p-7 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#FCAF0A]/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
                >
                  <div className="flex items-start gap-5">
                    {/* Glowing index badge */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0A3A7A] to-[#041427] border border-white/15 flex items-center justify-center text-[#FCAF0A] shadow-inner group-hover:scale-105 group-hover:border-[#FCAF0A]/50 transition-all">
                      <IconComponent className="w-5 h-5 text-[#FCAF0A]" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-[#FCAF0A] transition-colors">
                          {item.title}
                        </h3>
                        <span className="text-xs font-mono font-bold text-white/40 group-hover:text-[#FCAF0A]">
                          0{i + 1}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300/90 leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
