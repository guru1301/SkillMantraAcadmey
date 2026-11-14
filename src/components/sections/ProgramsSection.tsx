'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Laptop, HelpCircle, Award } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export interface UdemyCourse {
  number: string;
  name: string;
  shortTitle: string;
  category: string;
  tabs: string[];
  instructor: string;
  badge: 'Bestseller' | 'Lab Track' | 'Enterprise' | 'Foundation' | 'Specialization';
  tagline: string;
  duration: string;
  mode: string;
  image: string;
  logo: string;
  slug: string;
}

export const UDEMY_COURSES: UdemyCourse[] = [
  {
    number: '01',
    name: 'Java Programming',
    shortTitle: 'Java Enterprise: Complete Spring Boot & Microservices Lab',
    category: 'Enterprise Engineering',
    tabs: ['All Programmes', 'Java & Enterprise', 'Backend & Data'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Enterprise',
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
    shortTitle: 'Python Engineering: Async IO, FastAPIs & Systems Automation',
    category: 'Core Programming',
    tabs: ['All Programmes', 'Python Programming', 'Core Programming'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Bestseller',
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
    shortTitle: 'Modern Web & Full Stack: React.js, Node.js & Cloud Deploy',
    category: 'Software Engineering',
    tabs: ['All Programmes', 'Web & Full Stack', 'Software Engineering'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Bestseller',
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
    shortTitle: '.NET Enterprise Architecture: C#, ASP.NET Core & EF Core',
    category: 'Enterprise Engineering',
    tabs: ['All Programmes', 'Java & Enterprise', 'Software Engineering'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Enterprise',
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
    shortTitle: 'Data Analytics & BI: Power BI, Advanced SQL & Dashboards',
    category: 'Data & Analytics',
    tabs: ['All Programmes', 'Data Analytics & BI', 'Data & Analytics'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Bestseller',
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
    shortTitle: 'Artificial Intelligence (AI): LLM Apps, RAG & Agentic Workflows',
    category: 'AI & Emerging',
    tabs: ['All Programmes', 'Artificial Intelligence (AI)', 'AI & Emerging'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Specialization',
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
    shortTitle: 'Database Architecture: PostgreSQL, MongoDB & High-Load DDL',
    category: 'Backend & Data',
    tabs: ['All Programmes', 'Backend & Data', 'Data Analytics & BI'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Lab Track',
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
    shortTitle: 'Computer Science Fundamentals: C, C++, Pointers & STL',
    category: 'Core Programming',
    tabs: ['All Programmes', 'Python Programming', 'Core Programming'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Foundation',
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
    shortTitle: 'Campus Placement Bootcamp: Quantitative, Logic & HR Mock',
    category: 'Placement & Career',
    tabs: ['All Programmes', 'Campus Placement', 'Placement & Career'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Bestseller',
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
    shortTitle: 'Digital Marketing Mastery: Technical SEO & GTM Tracking Funnels',
    category: 'Digital & Growth',
    tabs: ['All Programmes', 'Digital Marketing', 'Digital & Growth'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Specialization',
    tagline: 'Technical SEO, Tag Management & User Acquisition',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    image: '/images/courses/marketing.jpg',
    logo: '/images/tech/marketing.png',
    slug: 'digital-marketing',
  },
];

export const TOPIC_TABS = [
  'All Programmes',
  'Artificial Intelligence (AI)',
  'Python Programming',
  'Web & Full Stack',
  'Java & Enterprise',
  'Data Analytics & BI',
  'Campus Placement',
  'Digital Marketing',
] as const;

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();
  const [selectedTab, setSelectedTab] = useState<string>('All Programmes');
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter courses based on active tab
  const filteredCourses = selectedTab === 'All Programmes'
    ? UDEMY_COURSES
    : UDEMY_COURSES.filter((c) => c.tabs.includes(selectedTab));

  // Update left/right floating arrow bounds
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
  }, [updateScrollBounds, filteredCourses]);

  const handleTabSelect = (tab: string) => {
    setSelectedTab(tab);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

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
        
        {/* ── 1. HEADER: UDEMY STYLE INSPIRATION ── */}
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

          <p className="text-[#B8C6D8] text-sm sm:text-base mt-2 font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* ── 2. HORIZONTAL TOPIC TABS (UDEMY UNDERLINED STYLE) ── */}
        <div className="border-b border-white/15 mb-7">
          <div 
            role="tablist"
            aria-label="Course Topics"
            className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar -mx-2 px-2"
          >
            {TOPIC_TABS.map((tab) => {
              const isActive = selectedTab === tab;
              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabSelect(tab)}
                  className={`text-sm font-semibold pb-3 whitespace-nowrap transition-colors relative cursor-pointer focus-visible:outline-none ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-[#8FA5C2] hover:text-white'
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FFB000] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. FOUR-CARD CAROUSEL WITH UDEMY FLOATING ARROWS ── */}
        <div className="relative group/carousel">
          
          {/* Left Floating Circular Navigation Arrow */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous courses"
            className={`absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#07182B] shadow-2xl border border-slate-200 flex items-center justify-center z-20 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-[#07182B]" />
          </button>

          {/* Right Floating Circular Navigation Arrow */}
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next courses"
            className={`absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#07182B] shadow-2xl border border-slate-200 flex items-center justify-center z-20 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
              canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight className="w-5 h-5 text-[#07182B]" />
          </button>

          {/* Carousel Track (Fills 4 cards wide on desktop) */}
          <div 
            ref={carouselRef}
            className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-4 pt-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredCourses.map((course) => (
              <Link
                key={course.number}
                href={`/programs#${course.slug}`}
                className="group relative flex flex-col justify-between rounded-xl bg-[#0D233B] border border-white/10 hover:border-white/25 hover:bg-[#102A45] transition-all duration-200 overflow-hidden shadow-lg snap-start flex-[0_0_285px] sm:flex-[0_0_305px] lg:flex-[0_0_295px] xl:flex-[0_0_315px] 2xl:flex-[0_0_325px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB000]"
              >
                <div>
                  {/* Video Thumbnail (Exact 16:9) */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#07182B]">
                    <Image
                      src={course.image}
                      alt={`${course.name} thumbnail`}
                      fill
                      sizes="(max-width: 640px) 285px, (max-width: 1024px) 305px, 325px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Number & Track Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#07182B]/90 border border-white/15 backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                      <span className="font-mono text-[10px] font-bold text-[#FFB000]">
                        {course.number}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                        {course.category}
                      </span>
                    </div>

                    {/* Official Tech Logo Pin */}
                    <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-md bg-[#07182B]/90 border border-white/15 flex items-center justify-center p-1 shadow-sm backdrop-blur-xs">
                      <Image
                        src={course.logo}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                  </div>

                  {/* Course Details (Udemy Typography Rhythm) */}
                  <div className="p-4 sm:p-4.5 pb-2">
                    {/* Course Headline Title */}
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#FFB000] transition-colors leading-snug line-clamp-2 min-h-[2.5rem]">
                      {course.shortTitle}
                    </h3>

                    {/* Institutional Instructor Byline */}
                    <p className="text-[11px] text-[#8FA5C2] mt-1 truncate font-normal">
                      {course.instructor}
                    </p>

                    {/* Metadata & Bestseller Badge */}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FFB000]/15 text-[#FFB000] border border-[#FFB000]/30">
                        {course.badge}
                      </span>

                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#FFB000] shrink-0" />
                        <span>{course.duration}</span>
                      </div>
                    </div>

                    {/* Meaningful One-Line Tagline Description */}
                    <p className="text-xs text-[#B8C6D8] mt-2 line-clamp-2 leading-relaxed font-normal">
                      {course.tagline}
                    </p>
                  </div>
                </div>

                {/* Footer: Mode & Premium Explore Button */}
                <div className="p-4 sm:p-4.5 pt-3 border-t border-white/10 mt-auto space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{course.mode}</span>
                  </div>

                  {/* Premium Action Button */}
                  <div className="w-full py-2 px-3 rounded-lg bg-[#FFB000] group-hover:bg-[#E59E00] text-[#07182B] text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5">
                    <span>Explore Track</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#07182B] transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>

        {/* ── 4. EXPLORE ALL PROGRAMMES (UDEMY BOTTOM CTA LINK) ── */}
        <div className="mt-8">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-[#FFB000] transition-colors group"
          >
            <span>Show all {selectedTab === 'All Programmes' ? 'academic' : selectedTab} courses</span>
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
