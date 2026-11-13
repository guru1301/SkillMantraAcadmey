'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Briefcase, Rocket, UserCheck, Sparkles } from 'lucide-react';
import { TARGET_AUDIENCES } from '@/data/siteData';

const AUDIENCE_CONFIG = [
  {
    icon: GraduationCap,
    badge: 'College & Degree Students',
    accentBorder: 'hover:border-amber-400/50',
    iconBg: 'from-amber-500/20 to-amber-700/20 text-[#FCAF0A]',
    highlight: 'Foundation & Hands-On Code',
  },
  {
    icon: UserCheck,
    badge: 'Graduates & Job Seekers',
    accentBorder: 'hover:border-blue-400/50',
    iconBg: 'from-blue-500/20 to-blue-700/20 text-blue-400',
    highlight: 'Aptitude, GD & Technical Mock Interviews',
  },
  {
    icon: Briefcase,
    badge: 'Working Professionals',
    accentBorder: 'hover:border-emerald-400/50',
    iconBg: 'from-emerald-500/20 to-emerald-700/20 text-emerald-400',
    highlight: 'Weekend Batches & Domain Transitions',
  },
  {
    icon: Rocket,
    badge: 'Founders & Innovators',
    accentBorder: 'hover:border-purple-400/50',
    iconBg: 'from-purple-500/20 to-purple-700/20 text-purple-400',
    highlight: 'Full-Stack Execution & Digital Growth',
  },
];

export default function AudienceSection() {
  return (
    <section id="audiences" className="relative py-24 lg:py-32 bg-[#051C38] text-white overflow-hidden border-t border-b border-white/10">
      {/* Tech grid texture */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#0A3A7A]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container-custom">
        
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCAF0A]/10 border border-[#FCAF0A]/30 text-[#FCAF0A] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target Profiles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Training built around <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCAF0A] to-[#F5A800]">where you&apos;re starting from.</span>
          </h2>
          <div className="h-1 w-16 bg-[#FCAF0A] mt-4 rounded-full" />
          <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-2xl font-normal leading-relaxed">
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
                className={`relative p-8 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 ${config.accentBorder} backdrop-blur-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group shadow-xl`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 text-slate-300">
                      {config.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-white/40 group-hover:text-[#FCAF0A]">
                      0{i + 1}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.iconBg} border border-white/15 flex items-center justify-center shrink-0`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#FCAF0A] transition-colors">
                        {aud.title}
                      </h3>
                      <div className="text-xs font-medium text-slate-400 mt-0.5">
                        {config.highlight}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300/90 leading-relaxed font-normal mt-2">
                    {aud.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Personalized cohort guidance
                  </span>
                  <Link
                    href="/#programs"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FCAF0A] group-hover:translate-x-1 transition-all"
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
