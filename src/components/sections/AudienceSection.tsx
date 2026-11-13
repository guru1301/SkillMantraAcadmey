'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Briefcase, Rocket, UserCheck, Sparkles } from 'lucide-react';
import { TARGET_AUDIENCES } from '@/data/siteData';

const AUDIENCE_CONFIG = [
  {
    icon: GraduationCap,
    badge: 'College & Degree Students',
    cardBg: 'bg-amber-50/40 hover:bg-white',
    accentBorder: 'border-amber-200/80 hover:border-amber-400',
    iconBg: 'bg-amber-100 text-amber-800',
    highlight: 'Foundation & Hands-On Code',
    linkText: 'text-amber-800 hover:text-amber-900',
  },
  {
    icon: UserCheck,
    badge: 'Graduates & Job Seekers',
    cardBg: 'bg-blue-50/40 hover:bg-white',
    accentBorder: 'border-blue-200/80 hover:border-blue-400',
    iconBg: 'bg-blue-100 text-[#0A3A7A]',
    highlight: 'Aptitude, GD & Technical Mock Interviews',
    linkText: 'text-[#0A3A7A] hover:text-[#06284F]',
  },
  {
    icon: Briefcase,
    badge: 'Working Professionals',
    cardBg: 'bg-emerald-50/40 hover:bg-white',
    accentBorder: 'border-emerald-200/80 hover:border-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-800',
    highlight: 'Weekend Batches & Domain Transitions',
    linkText: 'text-emerald-800 hover:text-emerald-900',
  },
  {
    icon: Rocket,
    badge: 'Founders & Innovators',
    cardBg: 'bg-purple-50/40 hover:bg-white',
    accentBorder: 'border-purple-200/80 hover:border-purple-400',
    iconBg: 'bg-purple-100 text-purple-800',
    highlight: 'Full-Stack Execution & Digital Growth',
    linkText: 'text-purple-800 hover:text-purple-900',
  },
];

export default function AudienceSection() {
  return (
    <section id="audiences" className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="container-custom">
        
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
            <span>Target Profiles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-tight">
            Training built around <span className="text-[#0A3A7A]">where you&apos;re starting from.</span>
          </h2>
          <div className="w-12 h-1 bg-[#FCAF0A] mt-4 rounded-full" />
          <p className="text-slate-600 text-base mt-4 max-w-2xl font-normal leading-relaxed">
            Whether preparing for your first campus placement or switching tech stacks after five years in industry, our modular learning pathways adapt to your level.
          </p>
        </div>

        {/* 2×2 High-Density Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TARGET_AUDIENCES.map((aud, i) => {
            const config = AUDIENCE_CONFIG[i % AUDIENCE_CONFIG.length];
            const IconComponent = config.icon;

            return (
              <div
                key={aud.id}
                className={`p-7 sm:p-8 rounded-2xl ${config.cardBg} border ${config.accentBorder} transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-slate-700">
                      {config.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      0{i + 1}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#0A3A7A] transition-colors">
                        {aud.title}
                      </h3>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">
                        {config.highlight}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed font-normal mt-2">
                    {aud.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Personalized cohort guidance
                  </span>
                  <Link
                    href="/#programs"
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${config.linkText} group-hover:translate-x-1 transition-all`}
                  >
                    <span>View Recommended Tracks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
