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
  Sparkles,
  MapPin
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
    <section id="why-skillthinker" className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left Column: Context & Campus Anchor (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Why Skillthinker</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-tight">
              The right skills create <span className="text-[#0A3A7A]">real opportunities.</span>
            </h2>

            <div className="w-12 h-1 bg-[#FCAF0A] rounded-full" />

            <p className="text-slate-600 text-base leading-relaxed font-normal">
              Curriculum engineered around practical industry outcomes, modern tooling, and genuine workplace readiness. Every learner gains real confidence through active project execution.
            </p>

            {/* Trichy Campus Center Box */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Trichy Center of Excellence</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Active Facility
                </span>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                {BRAND_INFO.officeLocation}
              </div>
              <div className="pt-1 flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Dedicated offline laboratory &amp; mentor desks</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3.5">
              <button
                type="button"
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0A3A7A] hover:bg-[#06284F] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                <span>Talk to an Advisor</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/#programs"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all"
              >
                <span>View All 10 Courses</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 7 Elevated Structured Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            {WHY_CHOOSE_ITEMS.map((item, i) => {
              const IconComponent = ITEM_ICONS[i % ITEM_ICONS.length];
              return (
                <div
                  key={item.title}
                  className="group p-5 sm:p-6 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    {/* Icon container */}
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0A3A7A] shrink-0 shadow-2xs group-hover:bg-[#0A3A7A] group-hover:text-white transition-colors">
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0A3A7A] transition-colors">
                          {item.title}
                        </h3>
                        <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-[#FCAF0A]">
                          0{i + 1}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
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
