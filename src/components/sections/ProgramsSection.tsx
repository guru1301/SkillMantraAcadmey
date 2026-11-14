'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Laptop, HelpCircle } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export interface CurriculumTrack {
  number: string;
  name: string;
  category: string;
  filterCategory: string;
  tagline: string;
  duration: string;
  mode: string;
  logo: string;
  slug: string;
  techStack: string[];
}

export const CURRICULUM_TRACKS: CurriculumTrack[] = [
  {
    number: '01',
    name: 'Java Programming',
    category: 'Enterprise Engineering',
    filterCategory: 'Enterprise Engineering',
    tagline: 'Enterprise Backend & Microservices Architecture',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    logo: '/images/tech/java.png',
    slug: 'java-programming',
    techStack: ['Java 21', 'Spring Boot', 'Hibernate', 'REST APIs'],
  },
  {
    number: '02',
    name: 'Python Programming',
    category: 'Core Programming',
    filterCategory: 'Core Programming',
    tagline: 'Advanced Python, Async IO & Software Engineering',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    logo: '/images/tech/python.png',
    slug: 'python-programming',
    techStack: ['Python 3', 'FastAPI', 'Async IO', 'Pydantic'],
  },
  {
    number: '03',
    name: 'Web & Full Stack Development',
    category: 'Software Engineering',
    filterCategory: 'Software Engineering',
    tagline: 'Modern Reactive UIs & Cloud-Native Backends',
    duration: '10–14 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/react.png',
    slug: 'web-full-stack-development',
    techStack: ['React.js', 'Node.js', 'Tailwind CSS', 'MongoDB'],
  },
  {
    number: '04',
    name: '.NET Development',
    category: 'Enterprise Engineering',
    filterCategory: 'Software Engineering',
    tagline: 'Microsoft Enterprise Architecture & Cloud Services',
    duration: '10–12 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/dotnet.png',
    slug: 'dotnet-development',
    techStack: ['C#', 'ASP.NET Core', 'EF Core', 'SQL Server'],
  },
  {
    number: '05',
    name: 'Data Analytics & BI',
    category: 'Data & Analytics',
    filterCategory: 'Data & Analytics',
    tagline: 'Relational Intelligence & Executive Decision Dashboards',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/powerbi.png',
    slug: 'data-analytics-bi',
    techStack: ['Power BI', 'Advanced SQL', 'DAX', 'Python Analytics'],
  },
  {
    number: '06',
    name: 'AI & Emerging Technologies',
    category: 'AI & Emerging',
    filterCategory: 'AI & Emerging',
    tagline: 'Generative AI, Agentic Workflows & Production RAG',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/ai.png',
    slug: 'ai-emerging-technologies',
    techStack: ['Generative AI', 'LangChain', 'Agentic RAG', 'Vector DB'],
  },
  {
    number: '07',
    name: 'Database & Backend Technologies',
    category: 'Backend & Data',
    filterCategory: 'Backend & Data',
    tagline: 'High-Throughput Relational & NoSQL Architecture',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/database.png',
    slug: 'database-backend-technologies',
    techStack: ['PostgreSQL', 'MongoDB', 'ACID Transactions', 'Indexing'],
  },
  {
    number: '08',
    name: 'Programming Fundamentals',
    category: 'Core Programming',
    filterCategory: 'Core Programming',
    tagline: 'Algorithmic Thinking, Pointers & Memory Models',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    logo: '/images/tech/cpp.png',
    slug: 'programming-fundamentals',
    techStack: ['C Programming', 'C++', 'Data Structures', 'Algorithms'],
  },
  {
    number: '09',
    name: 'Aptitude & Placement Training',
    category: 'Placement & Career',
    filterCategory: 'Placement & Career',
    tagline: 'Quantitative Reasoning, Logic & Technical Mock Interviews',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    logo: '/images/tech/aptitude.png',
    slug: 'aptitude-placement-training',
    techStack: ['Quantitative Aptitude', 'Logical Reasoning', 'Technical Mock', 'GD'],
  },
  {
    number: '10',
    name: 'Digital Marketing',
    category: 'Digital & Growth',
    filterCategory: 'Digital & Growth',
    tagline: 'Technical SEO, Tag Management & User Acquisition',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    logo: '/images/tech/marketing.png',
    slug: 'digital-marketing',
    techStack: ['Technical SEO', 'Google Tag Manager', 'Analytics', 'Conversion Funnels'],
  },
];

export const CATEGORY_FILTERS = [
  'All Programmes',
  'Enterprise Engineering',
  'Core Programming',
  'Software Engineering',
  'Data & Analytics',
  'AI & Emerging',
  'Backend & Data',
  'Placement & Career',
  'Digital & Growth',
] as const;

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();
  const [selectedCategory, setSelectedCategory] = useState<string>('All Programmes');
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter programmes
  const filteredTracks = selectedCategory === 'All Programmes'
    ? CURRICULUM_TRACKS
    : CURRICULUM_TRACKS.filter((t) => t.filterCategory === selectedCategory);

  // Check scroll boundary state
  const updateScrollBounds = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollBounds();
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollBounds, { passive: true });
    window.addEventListener('resize', updateScrollBounds);
    return () => {
      el.removeEventListener('scroll', updateScrollBounds);
      window.removeEventListener('resize', updateScrollBounds);
    };
  }, [updateScrollBounds, filteredTracks]);

  // Handle filter selection and reset carousel position
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Carousel manual arrow movement
  const handleScroll = (direction: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section 
      id="programs" 
      aria-labelledby="academic-curriculum-heading"
      className="relative py-16 sm:py-20 lg:py-24 bg-[#07182B] text-white border-b border-white/10 overflow-hidden"
    >
      {/* Anchor for external routing */}
      <div id="courses" className="absolute -top-20 left-0 pointer-events-none" />

      {/* Wide Container to fill screen comfortably */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        
        {/* ── 1. SECTION INTRODUCTION: REFINED, AUTHORITATIVE, COMPACT ── */}
        <div className="max-w-4xl mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB000]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#FFB000]">
              ACADEMIC CURRICULUM
            </span>
          </div>

          <h2 
            id="academic-curriculum-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-[-0.02em] leading-tight"
          >
            Choose the right <span className="text-[#FFB000]">learning path.</span>
          </h2>

          <p className="text-[#B8C6D8] text-sm sm:text-base mt-2 font-normal leading-relaxed max-w-3xl">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* ── 2. HORIZONTAL CATEGORY NAVIGATION (UNDERLINED CORPORATE STYLE) ── */}
        <div className="border-b border-white/15 mb-7">
          <div 
            role="tablist"
            aria-label="Curriculum Categories"
            className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar -mx-2 px-2"
          >
            {CATEGORY_FILTERS.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategorySelect(cat)}
                  className={`text-sm font-semibold pb-3 whitespace-nowrap transition-colors relative cursor-pointer focus-visible:outline-none ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-[#8FA5C2] hover:text-white'
                  }`}
                >
                  <span>{cat}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FFB000] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. FOUR-CARD DISCOVERY CAROUSEL WITH FLOATING CONTROLS ── */}
        <div className="relative group/carousel">
          
          {/* Left Floating Circular Navigation Arrow */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous tracks"
            className={`absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#07182B] shadow-2xl border border-slate-200 flex items-center justify-center z-20 cursor-pointer transition-all ${
              canScrollLeft ? 'opacity-100 hover:bg-slate-100 active:scale-95' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-[#07182B]" />
          </button>

          {/* Right Floating Circular Navigation Arrow */}
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next tracks"
            className={`absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#07182B] shadow-2xl border border-slate-200 flex items-center justify-center z-20 cursor-pointer transition-all ${
              canScrollRight ? 'opacity-100 hover:bg-slate-100 active:scale-95' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight className="w-5 h-5 text-[#07182B]" />
          </button>

          {/* Carousel Track (Fills 4 cards wide on desktop with zero fake images) */}
          <div 
            ref={carouselRef}
            className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-4 pt-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredTracks.map((track) => (
              <Link
                key={track.number}
                href={`/programs#${track.slug}`}
                className="group relative flex flex-col justify-between rounded-xl bg-[#0D233B] border border-white/10 hover:border-white/30 hover:bg-[#102A45] transition-colors duration-200 overflow-hidden shadow-lg snap-start flex-[0_0_285px] sm:flex-[0_0_305px] lg:flex-[0_0_295px] xl:flex-[0_0_315px] 2xl:flex-[0_0_325px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB000]"
              >
                <div>
                  {/* Executive Header Banner: Authentic Brand Emblem + Sequence */}
                  <div className="p-4 sm:p-5 pb-3 border-b border-white/10 bg-[#06182C]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-[#0B2442] border border-white/15 p-2 flex items-center justify-center shrink-0 shadow-xs">
                          <Image
                            src={track.logo}
                            alt=""
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain"
                          />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-bold text-[#FFB000] tracking-wider">
                            TRACK {track.number}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider truncate">
                            {track.category}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                        Live Lab
                      </span>
                    </div>
                  </div>

                  {/* Discipline Information */}
                  <div className="p-4 sm:p-5 pt-4">
                    {/* Course Headline Title */}
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#FFB000] transition-colors leading-snug line-clamp-2 min-h-[3rem]">
                      {track.name}
                    </h3>

                    {/* Technical Tagline Focus */}
                    <p className="text-xs text-[#B8C6D8] mt-2 line-clamp-2 leading-relaxed font-normal min-h-[2.25rem]">
                      {track.tagline}
                    </p>

                    {/* Authentic Production Tooling Chips */}
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Tooling &amp; Stack:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {track.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded bg-[#07182B] text-slate-300 border border-white/10 text-[10px] font-mono"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer: Metadata & Premium Action Button */}
                <div className="p-4 sm:p-5 pt-3 border-t border-white/10 mt-auto space-y-3 bg-[#06182C]/50">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#FFB000] shrink-0" />
                      <span>{track.duration}</span>
                    </span>
                    <span className="flex items-center gap-1.5 truncate text-slate-400">
                      <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{track.mode}</span>
                    </span>
                  </div>

                  {/* Clean, Full-Width Action Button */}
                  <div className="w-full py-2.5 px-3 rounded-lg bg-[#FFB000] group-hover:bg-[#E59E00] text-[#07182B] text-xs font-extrabold transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>Explore Track</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#07182B]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>

        {/* ── 4. EXPLORE ALL PROGRAMMES (EDITORIAL LINK) ── */}
        <div className="mt-8">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-[#FFB000] transition-colors group"
          >
            <span>Explore all 10 specialized academic curricula</span>
            <ArrowRight className="w-4 h-4 text-[#FFB000] transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ── 5. ADVISORY BANNER: COMPACT & ELEGANT ── */}
        <div className="mt-10 sm:mt-12 p-6 rounded-2xl bg-[#0D233B] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg">
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
