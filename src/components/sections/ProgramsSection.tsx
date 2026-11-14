'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export interface ProgrammeEntry {
  number: string;
  name: string;
  category: string;
  duration: string;
  logo: string;
  slug: string;
}

export const ACADEMIC_PROGRAMMES: ProgrammeEntry[] = [
  {
    number: '01',
    name: 'Java Programming',
    category: 'Enterprise Engineering',
    duration: '8–12 Weeks',
    logo: '/images/tech/java.png',
    slug: 'java-programming',
  },
  {
    number: '02',
    name: 'Python Programming',
    category: 'Core Programming',
    duration: '8–12 Weeks',
    logo: '/images/tech/python.png',
    slug: 'python-programming',
  },
  {
    number: '03',
    name: 'Web & Full Stack Development',
    category: 'Software Engineering',
    duration: '10–14 Weeks',
    logo: '/images/tech/react.png',
    slug: 'web-full-stack-development',
  },
  {
    number: '04',
    name: '.NET Development',
    category: 'Enterprise Engineering',
    duration: '10–12 Weeks',
    logo: '/images/tech/dotnet.png',
    slug: 'dotnet-development',
  },
  {
    number: '05',
    name: 'Data Analytics & BI',
    category: 'Data & Analytics',
    duration: '8–10 Weeks',
    logo: '/images/tech/powerbi.png',
    slug: 'data-analytics-bi',
  },
  {
    number: '06',
    name: 'AI & Emerging Technologies',
    category: 'AI & Emerging',
    duration: '8–10 Weeks',
    logo: '/images/tech/ai.png',
    slug: 'ai-emerging-technologies',
  },
  {
    number: '07',
    name: 'Database & Backend Technologies',
    category: 'Backend & Data',
    duration: '8–10 Weeks',
    logo: '/images/tech/database.png',
    slug: 'database-backend-technologies',
  },
  {
    number: '08',
    name: 'Programming Fundamentals',
    category: 'Core Programming',
    duration: '8–10 Weeks',
    logo: '/images/tech/cpp.png',
    slug: 'programming-fundamentals',
  },
  {
    number: '09',
    name: 'Aptitude & Placement Training',
    category: 'Placement & Career',
    duration: '6–8 Weeks',
    logo: '/images/tech/aptitude.png',
    slug: 'aptitude-placement-training',
  },
  {
    number: '10',
    name: 'Digital Marketing',
    category: 'Digital & Growth',
    duration: '6–8 Weeks',
    logo: '/images/tech/marketing.png',
    slug: 'digital-marketing',
  },
];

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();

  const columnOne = ACADEMIC_PROGRAMMES.slice(0, 5);
  const columnTwo = ACADEMIC_PROGRAMMES.slice(5, 10);

  return (
    <section 
      id="programs" 
      aria-labelledby="programme-directory-heading"
      className="relative py-20 lg:py-28 bg-[#07182B] text-white border-b border-white/10"
    >
      {/* Anchor for external routing */}
      <div id="courses" className="absolute -top-20 left-0 pointer-events-none" />

      {/* Deliberate structural ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1769D2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#FFB000]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        
        {/* ── SECTION INTRODUCTION: COMPACT, EDITORIAL, PRECISE ── */}
        <div className="max-w-3xl mb-12 lg:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB000]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#FFB000]">
              ACADEMIC CURRICULUM
            </span>
          </div>

          <h2 
            id="programme-directory-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-[-0.03em] leading-[1.15]"
          >
            Choose the right <span className="text-[#FFB000]">learning path.</span>
          </h2>

          <p className="text-[#B8C6D8] text-sm sm:text-base mt-3 max-w-2xl font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* ── TWO-COLUMN PROGRAMME DIRECTORY ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-14">
          
          {/* Column 1: Programmes 01 – 05 */}
          <div className="divide-y divide-white/10 border-t border-b border-white/10">
            {columnOne.map((prog) => (
              <Link
                key={prog.number}
                href={`/programs#${prog.slug}`}
                className="group flex items-center justify-between py-4.5 sm:py-5 px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-lg transition-colors duration-150 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFB000]"
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-4">
                  {/* Sequence Number */}
                  <span className="font-mono text-xs font-semibold text-[#8FA5C2] w-6 shrink-0">
                    {prog.number}
                  </span>

                  {/* Technology Logo */}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-[#0D233B] border border-white/10 flex items-center justify-center p-1.5 shrink-0 group-hover:border-white/20 transition-colors">
                    <Image
                      src={prog.logo}
                      alt=""
                      aria-hidden="true"
                      width={28}
                      height={28}
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                    />
                  </div>

                  {/* Title & Category */}
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-bold text-white group-hover:text-[#FFB000] transition-colors truncate tracking-tight leading-snug">
                      {prog.name}
                    </div>
                    <div className="text-xs text-[#8FA5C2] truncate mt-0.5 font-normal">
                      <span>{prog.category}</span>
                      <span className="sm:hidden text-slate-400"> • {prog.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Duration & Restrained Arrow */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <span className="text-xs text-[#B8C6D8] font-medium hidden sm:inline-block">
                    {prog.duration}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#FFB000] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>

          {/* Column 2: Programmes 06 – 10 */}
          <div className="divide-y divide-white/10 border-t border-b border-white/10 mt-[-1px] lg:mt-0">
            {columnTwo.map((prog) => (
              <Link
                key={prog.number}
                href={`/programs#${prog.slug}`}
                className="group flex items-center justify-between py-4.5 sm:py-5 px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-lg transition-colors duration-150 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFB000]"
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-4">
                  {/* Sequence Number */}
                  <span className="font-mono text-xs font-semibold text-[#8FA5C2] w-6 shrink-0">
                    {prog.number}
                  </span>

                  {/* Technology Logo */}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-[#0D233B] border border-white/10 flex items-center justify-center p-1.5 shrink-0 group-hover:border-white/20 transition-colors">
                    <Image
                      src={prog.logo}
                      alt=""
                      aria-hidden="true"
                      width={28}
                      height={28}
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                    />
                  </div>

                  {/* Title & Category */}
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-bold text-white group-hover:text-[#FFB000] transition-colors truncate tracking-tight leading-snug">
                      {prog.name}
                    </div>
                    <div className="text-xs text-[#8FA5C2] truncate mt-0.5 font-normal">
                      <span>{prog.category}</span>
                      <span className="sm:hidden text-slate-400"> • {prog.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Duration & Restrained Arrow */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <span className="text-xs text-[#B8C6D8] font-medium hidden sm:inline-block">
                    {prog.duration}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#FFB000] group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>

        </div>

        {/* ── ADVISORY STRIP: COMPACT & ELEGANT ── */}
        <div className="mt-12 lg:mt-16 p-6 sm:p-7 rounded-2xl bg-[#0D233B] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFB000]/10 border border-[#FFB000]/20 flex items-center justify-center text-[#FFB000] shrink-0">
              <HelpCircle className="w-5 h-5 text-[#FFB000]" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-white">
                Unsure which program fits your background?
              </div>
              <div className="text-xs sm:text-sm text-[#B8C6D8] font-normal mt-0.5">
                Our admissions advisors in Trichy can evaluate your academic background and recommend the ideal track.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            className="px-6 py-3 rounded-xl bg-[#FFB000] hover:bg-[#E59E00] text-[#07182B] font-extrabold text-xs sm:text-sm shrink-0 transition-colors cursor-pointer shadow-md"
          >
            Get Free Career Assessment
          </button>
        </div>

      </div>
    </section>
  );
}
