'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Laptop, HelpCircle } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export interface Programme {
  number: string;
  name: string;
  category: string;
  filterCategory: string;
  tagline: string;
  duration: string;
  mode: string;
  image: string;
  logo: string;
  slug: string;
}

export const PROGRAMMES: Programme[] = [
  {
    number: '01',
    name: 'Java Programming',
    category: 'Enterprise Engineering',
    filterCategory: 'Enterprise Engineering',
    tagline: 'Enterprise Backend & Microservices Architecture',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    image: '/images/courses/java.jpg',
    logo: '/images/tech/java.png',
    slug: 'java-programming',
  },
  {
    number: '02',
    name: 'Python Programming',
    category: 'Core Programming',
    filterCategory: 'Core Programming',
    tagline: 'Advanced Python, Async IO & Software Engineering',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    image: '/images/courses/python.jpg',
    logo: '/images/tech/python.png',
    slug: 'python-programming',
  },
  {
    number: '03',
    name: 'Web & Full Stack Development',
    category: 'Software Engineering',
    filterCategory: 'Software Engineering',
    tagline: 'Modern Reactive UIs & Cloud-Native Backends',
    duration: '10–14 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    image: '/images/courses/web.jpg',
    logo: '/images/tech/react.png',
    slug: 'web-full-stack-development',
  },
  {
    number: '04',
    name: '.NET Development',
    category: 'Software Engineering',
    filterCategory: 'Software Engineering',
    tagline: 'Microsoft Enterprise Architecture & Cloud Services',
    duration: '10–12 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    image: '/images/courses/dotnet.jpg',
    logo: '/images/tech/dotnet.png',
    slug: 'dotnet-development',
  },
  {
    number: '05',
    name: 'Data Analytics & BI',
    category: 'Data & Analytics',
    filterCategory: 'Data & Analytics',
    tagline: 'Relational Intelligence & Executive Decision Dashboards',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    image: '/images/courses/analytics.jpg',
    logo: '/images/tech/powerbi.png',
    slug: 'data-analytics-bi',
  },
  {
    number: '06',
    name: 'AI & Emerging Technologies',
    category: 'AI & Emerging',
    filterCategory: 'AI & Emerging',
    tagline: 'Generative AI, Agentic Workflows & Production RAG',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    image: '/images/courses/ai.jpg',
    logo: '/images/tech/ai.png',
    slug: 'ai-emerging-technologies',
  },
  {
    number: '07',
    name: 'Database & Backend Technologies',
    category: 'Backend & Data',
    filterCategory: 'Backend & Data',
    tagline: 'High-Throughput Relational & NoSQL Architecture',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    image: '/images/courses/database.jpg',
    logo: '/images/tech/database.png',
    slug: 'database-backend-technologies',
  },
  {
    number: '08',
    name: 'Programming Fundamentals',
    category: 'Core Programming',
    filterCategory: 'Core Programming',
    tagline: 'Algorithmic Thinking, Pointers & Memory Models',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    image: '/images/courses/cpp.jpg',
    logo: '/images/tech/cpp.png',
    slug: 'programming-fundamentals',
  },
  {
    number: '09',
    name: 'Aptitude & Placement Training',
    category: 'Placement & Career',
    filterCategory: 'Placement & Career',
    tagline: 'Quantitative Reasoning, Logic & Technical Mock Interviews',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    image: '/images/courses/aptitude.jpg',
    logo: '/images/tech/aptitude.png',
    slug: 'aptitude-placement-training',
  },
  {
    number: '10',
    name: 'Digital Marketing',
    category: 'Digital & Growth',
    filterCategory: 'Digital & Growth',
    tagline: 'Technical SEO, Tag Management & User Acquisition',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    image: '/images/courses/marketing.jpg',
    logo: '/images/tech/marketing.png',
    slug: 'digital-marketing',
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
  const filteredProgrammes = selectedCategory === 'All Programmes'
    ? PROGRAMMES
    : PROGRAMMES.filter((p) => p.filterCategory === selectedCategory);

  // Check scroll boundary state
  const updateScrollBounds = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
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
  }, [updateScrollBounds, filteredProgrammes]);

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
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section 
      id="programs" 
      aria-labelledby="academic-curriculum-heading"
      className="relative py-20 lg:py-28 bg-[#07182B] text-white border-b border-white/10"
    >
      {/* Anchor for external routing */}
      <div id="courses" className="absolute -top-20 left-0 pointer-events-none" />

      {/* Structural Ambience Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1769D2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#FFB000]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        
        {/* ── A. SECTION INTRODUCTION: COMPACT, EDITORIAL, PRECISE ── */}
        <div className="max-w-3xl mb-10 lg:mb-12">
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

        {/* ── B. CATEGORY FILTER NAVIGATION & CAROUSEL CONTROLS ── */}
        <div className="flex items-center justify-between border-b border-white/10 mb-8 pb-1 gap-4">
          
          {/* Horizontal Category Nav */}
          <div 
            role="tablist"
            aria-label="Programme Categories"
            className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar py-2 -mx-2 px-2"
          >
            {CATEGORY_FILTERS.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategorySelect(cat)}
                  className={`text-xs sm:text-sm font-semibold pb-3 whitespace-nowrap transition-colors border-b-2 cursor-pointer focus-visible:outline-none focus-visible:text-white ${
                    isActive
                      ? 'border-[#FFB000] text-white font-bold'
                      : 'border-transparent text-[#8FA5C2] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Carousel Desktop Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-2 shrink-0 pb-2">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous programmes"
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-[#0D233B] border-white/20 text-white hover:bg-[#102A45] hover:border-white/30 shadow-xs'
                  : 'bg-white/[0.02] border-white/5 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Next programmes"
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-[#0D233B] border-white/20 text-white hover:bg-[#102A45] hover:border-white/30 shadow-xs'
                  : 'bg-white/[0.02] border-white/5 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* ── C. IMAGE-LED HORIZONTAL PROGRAMME CAROUSEL ── */}
        <div 
          ref={carouselRef}
          className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-4 pt-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredProgrammes.map((prog) => (
            <Link
              key={prog.number}
              href={`/programs#${prog.slug}`}
              className="group flex-shrink-0 w-[84vw] sm:w-[340px] lg:w-[380px] snap-start flex flex-col justify-between rounded-2xl bg-[#0D233B] border border-white/10 hover:border-white/25 hover:bg-[#102A45] transition-all duration-200 shadow-lg overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB000]"
            >
              <div>
                {/* 16:9 Image Area */}
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#07182B]">
                  <Image
                    src={prog.image}
                    alt={`${prog.name} discipline preview`}
                    fill
                    sizes="(max-width: 640px) 84vw, (max-width: 1024px) 340px, 380px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Technology Emblem & Sequence Badge Overlay */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#07182B]/85 border border-white/15 backdrop-blur-xs flex items-center gap-2 shadow-xs">
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                      <Image
                        src={prog.logo}
                        alt=""
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    </div>
                    <span className="font-mono text-xs font-bold text-[#FFB000]">
                      {prog.number}
                    </span>
                  </div>
                </div>

                {/* Card Content Information */}
                <div className="p-5 sm:p-6 pb-4">
                  {/* Category */}
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA5C2] mb-1.5">
                    {prog.category}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#FFB000] transition-colors leading-snug mb-2">
                    {prog.name}
                  </h3>

                  {/* Short Tagline Description */}
                  <p className="text-xs sm:text-sm text-[#B8C6D8] leading-relaxed line-clamp-2 font-normal">
                    {prog.tagline}
                  </p>
                </div>
              </div>

              {/* Card Footer: Metadata & Primary Action */}
              <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-white/10 space-y-3 mt-auto">
                {/* Duration & Mode Metadata */}
                <div className="flex items-center gap-2.5 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FFB000] shrink-0" />
                    <span>{prog.duration}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 truncate">
                    <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{prog.mode}</span>
                  </span>
                </div>

                {/* Primary Action */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#FFB000] pt-1">
                  <span>Explore Track</span>
                  <ArrowRight className="w-4 h-4 text-[#FFB000] transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── D. EXPLORE ALL PROGRAMMES LINK ── */}
        <div className="mt-6 text-center">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#B8C6D8] hover:text-[#FFB000] transition-colors group"
          >
            <span>Explore all programmes</span>
            <ArrowRight className="w-4 h-4 text-[#FFB000] transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ── E. ADVISORY SECTION: COMPACT & ELEGANT ── */}
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
