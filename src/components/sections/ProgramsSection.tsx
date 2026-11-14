'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Laptop, HelpCircle } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export interface CourseProgram {
  number: string;
  title: string;
  category: string;
  tagline: string;
  duration: string;
  mode: string;
  logo: string;
  slug: string;
}

export const ACADEMIC_PROGRAMS: CourseProgram[] = [
  {
    number: '01',
    title: 'Java Programming',
    category: 'Enterprise Engineering',
    tagline: 'Enterprise Backend & Microservices Architecture',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    logo: '/images/tech/java.png',
    slug: 'java-programming',
  },
  {
    number: '02',
    title: 'Python Programming',
    category: 'Core Programming',
    tagline: 'Advanced Python, Async IO & Software Engineering',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    logo: '/images/tech/python.png',
    slug: 'python-programming',
  },
  {
    number: '03',
    title: 'Web & Full Stack Development',
    category: 'Software Engineering',
    tagline: 'Modern Reactive UIs & Cloud-Native Backends',
    duration: '10–14 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/react.png',
    slug: 'web-full-stack-development',
  },
  {
    number: '04',
    title: '.NET Development',
    category: 'Enterprise Engineering',
    tagline: 'Microsoft Enterprise Architecture & Cloud Services',
    duration: '10–12 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/dotnet.png',
    slug: 'dotnet-development',
  },
  {
    number: '05',
    title: 'Data Analytics & BI',
    category: 'Data & Analytics',
    tagline: 'Relational Intelligence & Executive Decision Dashboards',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/powerbi.png',
    slug: 'data-analytics-bi',
  },
  {
    number: '06',
    title: 'AI & Emerging Technologies',
    category: 'AI & Emerging',
    tagline: 'Generative AI, Agentic Workflows & Production RAG',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/ai.png',
    slug: 'ai-emerging-technologies',
  },
  {
    number: '07',
    title: 'Database & Backend Technologies',
    category: 'Backend & Data',
    tagline: 'High-Throughput Relational & NoSQL Architecture',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/database.png',
    slug: 'database-backend-technologies',
  },
  {
    number: '08',
    title: 'Programming Fundamentals',
    category: 'Core Programming',
    tagline: 'Algorithmic Thinking, Pointers & Memory Models',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/cpp.png',
    slug: 'programming-fundamentals',
  },
  {
    number: '09',
    title: 'Aptitude & Placement Training',
    category: 'Placement & Career',
    tagline: 'Quantitative Reasoning, Logic & Technical Mock Interviews',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    logo: '/images/tech/aptitude.png',
    slug: 'aptitude-placement-training',
  },
  {
    number: '10',
    title: 'Digital Marketing',
    category: 'Digital & Growth',
    tagline: 'Technical SEO, Tag Management & User Acquisition',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    logo: '/images/tech/marketing.png',
    slug: 'digital-marketing',
  },
];

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();

  return (
    <section 
      id="programs" 
      aria-labelledby="academic-curriculum-heading"
      className="relative py-20 lg:py-28 bg-[#07182B] text-white border-b border-white/10"
    >
      {/* Anchor for external links */}
      <div id="courses" className="absolute -top-20 left-0 pointer-events-none" />

      {/* Subtle Structural Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1769D2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#FFB000]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        
        {/* ── 1. SECTION HEADING: COMPACT, EDITORIAL, PRECISE ── */}
        <div className="max-w-3xl mb-12 lg:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB000]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#FFB000]">
              ACADEMIC CURRICULUM
            </span>
          </div>

          <h2 
            id="academic-curriculum-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-[-0.03em] leading-[1.15]"
          >
            Choose the right <span className="text-[#FFB000]">learning path.</span>
          </h2>

          <p className="text-[#B8C6D8] text-sm sm:text-base mt-3 max-w-2xl font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* ── 2. THREE-COLUMN RESPONSIVE COURSE GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ACADEMIC_PROGRAMS.map((course) => (
            <Link
              key={course.number}
              href={`/programs#${course.slug}`}
              className="group relative flex flex-col justify-between h-full p-6 rounded-2xl bg-[#0D233B] border border-white/10 hover:border-white/20 hover:bg-[#102A45] transition-all duration-200 shadow-md"
            >
              <div>
                {/* Top Row: Understated Sequence Number & Official Brand Logo */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <span className="font-mono text-xs font-semibold text-[#8FA5C2] tracking-wider">
                    {course.number}
                  </span>

                  <div className="w-10 h-10 rounded-xl bg-[#07182B] border border-white/10 flex items-center justify-center p-2 shrink-0 group-hover:border-white/20 transition-colors">
                    <Image
                      src={course.logo}
                      alt={`${course.title} emblem`}
                      width={28}
                      height={28}
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                </div>

                {/* Category Badge / Label */}
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA5C2] mb-1.5">
                  {course.category}
                </div>

                {/* Course Title */}
                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#FFB000] transition-colors leading-snug mb-2.5">
                  {course.title}
                </h3>

                {/* Meaningful One-Line Description derived from tagline */}
                <p className="text-xs sm:text-sm text-[#B8C6D8] leading-relaxed mb-6 font-normal">
                  {course.tagline}
                </p>
              </div>

              {/* Bottom Metadata & Consistent CTA Alignment */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                {/* Duration and Training Mode as Compact Metadata */}
                <div className="flex items-center gap-2.5 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FFB000] shrink-0" />
                    <span>{course.duration}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 truncate">
                    <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{course.mode}</span>
                  </span>
                </div>

                {/* Clear "Explore Course →" Link */}
                <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-[#FFB000] transition-colors">
                  <span>Explore Course</span>
                  <ArrowRight className="w-4 h-4 text-[#FFB000] transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── 7. BOTTOM ADVISORY BANNER: COMPACT, ELEGANT STRIP ── */}
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
