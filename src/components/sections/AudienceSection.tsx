'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Briefcase, Rocket, UserCheck } from 'lucide-react';
import { TARGET_AUDIENCES } from '@/data/siteData';

const AUDIENCE_CONFIG = [
  {
    icon: GraduationCap,
    badge: 'College & Degree Students',
    highlight: 'Foundation & Hands-On Code',
  },
  {
    icon: UserCheck,
    badge: 'Graduates & Job Seekers',
    highlight: 'Aptitude, GD & Technical Mock Interviews',
  },
  {
    icon: Briefcase,
    badge: 'Working Professionals',
    highlight: 'Weekend Batches & Domain Transitions',
  },
  {
    icon: Rocket,
    badge: 'Founders & Innovators',
    highlight: 'Full-Stack Execution & Digital Growth',
  },
];

export default function AudienceSection() {
  return (
    <section id="audiences" className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="container-custom">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-bold tracking-[0.18em] uppercase text-[#0A3A7A] mb-3">
            Target Profiles
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-[1.12]">
            Training built around <span className="text-[#0A3A7A]">where you&apos;re starting from.</span>
          </h2>
          <p className="text-slate-600 text-base mt-3 max-w-2xl font-normal leading-relaxed">
            Whether preparing for your first campus placement or switching tech stacks after five years in industry, our modular learning pathways adapt to your level.
          </p>
        </div>

        {/* 2×2 Structured Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TARGET_AUDIENCES.map((aud, i) => {
            const config = AUDIENCE_CONFIG[i % AUDIENCE_CONFIG.length];
            const IconComponent = config.icon;

            return (
              <div
                key={aud.id}
                className="p-7 sm:p-8 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-slate-300 transition-colors duration-200 flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      {config.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      0{i + 1}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-[#06284F]/5 text-[#06284F] border border-[#06284F]/10 flex items-center justify-center shrink-0">
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
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A3A7A] hover:text-[#06284F] transition-colors"
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
