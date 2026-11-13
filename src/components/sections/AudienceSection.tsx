'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TARGET_AUDIENCES } from '@/data/siteData';

export default function AudienceSection() {
  return (
    <section id="audiences" className="py-16 lg:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
      <div className="container-custom">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 lg:mb-16">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#0A3A7A] mb-2">
            Target Audiences &amp; Career Stages
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#062551] tracking-tight leading-tight">
            Training built around where you&apos;re starting from.
          </h2>
          <div className="w-10 h-0.5 bg-[#FCAF0A] mt-3" />
          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed font-normal">
            Wherever you are in your journey, our programs are structured to meet you there — with the right pace, depth, and support.
          </p>
        </div>

        {/* 4-Column Architectural Matrix with Hairline Dividers */}
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {TARGET_AUDIENCES.map((aud, index) => (
            <div
              key={aud.id}
              className="p-6 sm:p-7 flex flex-col justify-between hover:bg-slate-50/50 transition-colors group"
            >
              <div className="space-y-4">
                <div className="text-xs font-mono font-semibold text-slate-400 group-hover:text-[#0A3A7A] transition-colors">
                  Stage 0{index + 1}
                </div>

                <h3 className="text-lg font-bold text-[#162033] tracking-tight">
                  {aud.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {aud.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <Link
                  href="/#programs"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A3A7A] hover:text-[#062551] transition-colors"
                >
                  <span>Explore Courses</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
