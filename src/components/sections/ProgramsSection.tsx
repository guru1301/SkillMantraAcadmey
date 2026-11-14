'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Star, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export interface UdemyCourse {
  number: string;
  name: string;
  shortTitle: string;
  category: string;
  tabs: string[];
  instructor: string;
  badge: 'Bestseller' | 'Premium' | 'Lab Track';
  rating: number;
  ratingCount: string;
  duration: string;
  mode: string;
  tagline: string;
  image: string;
  logo: string;
  slug: string;
}

export const UDEMY_COURSES: UdemyCourse[] = [
  {
    number: '01',
    name: 'Java Programming',
    shortTitle: 'The Complete Java Spring Boot & Microservices Masterclass',
    category: 'Enterprise Engineering',
    tabs: ['All Programmes', 'Java & Enterprise', 'Database Engineering'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Bestseller',
    rating: 4.8,
    ratingCount: '2,840 ratings',
    duration: '8–12 Weeks',
    mode: 'Live Lab & Mentor Evaluation',
    tagline: 'Enterprise Spring Boot, Microservices, JPA & REST Architecture',
    image: '/images/courses/java.jpg',
    logo: '/images/tech/java.png',
    slug: 'java-programming',
  },
  {
    number: '02',
    name: 'Python Programming',
    shortTitle: 'Python Engineering 2026: Async IO, FastAPIs & Automation',
    category: 'Core Programming',
    tabs: ['All Programmes', 'Python Programming', 'Core Programming'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Bestseller',
    rating: 4.9,
    ratingCount: '3,410 ratings',
    duration: '8–12 Weeks',
    mode: 'Live Lab & Mentor Evaluation',
    tagline: 'Advanced Python, OOP, Async IO, Automation & API Engineering',
    image: '/images/courses/python.jpg',
    logo: '/images/tech/python.png',
    slug: 'python-programming',
  },
  {
    number: '03',
    name: 'Web & Full Stack Development',
    shortTitle: 'Full Stack Web Bootcamp: React 19, Next.js, Node & Tailwind',
    category: 'Software Engineering',
    tabs: ['All Programmes', 'Web & Full Stack', 'Software Engineering'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Bestseller',
    rating: 4.9,
    ratingCount: '4,120 ratings',
    duration: '10–14 Weeks',
    mode: 'Live Lab & Mentor Evaluation',
    tagline: 'Full-stack development with modern React, Node.js and cloud deploy',
    image: '/images/courses/web.jpg',
    logo: '/images/tech/react.png',
    slug: 'web-full-stack-development',
  },
  {
    number: '04',
    name: '.NET Development',
    shortTitle: 'C# and .NET Enterprise Architecture: ASP.NET Core & Web APIs',
    category: 'Enterprise Engineering',
    tabs: ['All Programmes', 'Java & Enterprise', 'Software Engineering'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Premium',
    rating: 4.7,
    ratingCount: '1,290 ratings',
    duration: '10–12 Weeks',
    mode: 'Live Lab & Mentor Evaluation',
    tagline: 'High-throughput enterprise applications on Microsoft .NET stack',
    image: '/images/courses/dotnet.jpg',
    logo: '/images/tech/dotnet.png',
    slug: 'dotnet-development',
  },
  {
    number: '05',
    name: 'Data Analytics & BI',
    shortTitle: 'Data Analytics & Executive BI: Power BI, Advanced SQL & DAX',
    category: 'Data & Analytics',
    tabs: ['All Programmes', 'Data Analytics & BI', 'Database Engineering'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Bestseller',
    rating: 4.8,
    ratingCount: '2,630 ratings',
    duration: '8–10 Weeks',
    mode: 'Live Lab & Mentor Evaluation',
    tagline: 'ETL data pipelines, statistical modeling and executive BI dashboards',
    image: '/images/courses/analytics.jpg',
    logo: '/images/tech/powerbi.png',
    slug: 'data-analytics-bi',
  },
  {
    number: '06',
    name: 'AI & Emerging Technologies',
    shortTitle: 'The AI Engineer Track 2026: LLM Apps, Production RAG & Agents',
    category: 'AI & Emerging',
    tabs: ['All Programmes', 'Artificial Intelligence (AI)', 'Python Programming'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Premium',
    rating: 4.9,
    ratingCount: '5,210 ratings',
    duration: '8–10 Weeks',
    mode: 'Live Lab & Mentor Evaluation',
    tagline: 'Generative AI engineering, vector databases, LangChain and agentic AI',
    image: '/images/courses/ai.jpg',
    logo: '/images/tech/ai.png',
    slug: 'ai-emerging-technologies',
  },
  {
    number: '07',
    name: 'Database & Backend Technologies',
    shortTitle: 'Database Architecture Mastery: PostgreSQL, MongoDB & Indexing',
    category: 'Backend & Data',
    tabs: ['All Programmes', 'Database Engineering', 'Data Analytics & BI'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Lab Track',
    rating: 4.7,
    ratingCount: '1,540 ratings',
    duration: '8–10 Weeks',
    mode: 'Live Lab & Mentor Evaluation',
    tagline: 'High-throughput relational schema design, NoSQL storage and sharding',
    image: '/images/courses/database.jpg',
    logo: '/images/tech/database.png',
    slug: 'database-backend-technologies',
  },
  {
    number: '08',
    name: 'Programming Fundamentals',
    shortTitle: 'Computer Science Fundamentals: C, C++, Data Structures & STL',
    category: 'Core Programming',
    tabs: ['All Programmes', 'Python Programming', 'Core Programming'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Bestseller',
    rating: 4.8,
    ratingCount: '3,870 ratings',
    duration: '8–10 Weeks',
    mode: 'Live Lab & Mentor Evaluation',
    tagline: 'Algorithmic thinking, pointer memory models and fundamental data structures',
    image: '/images/courses/cpp.jpg',
    logo: '/images/tech/cpp.png',
    slug: 'programming-fundamentals',
  },
  {
    number: '09',
    name: 'Aptitude & Placement Training',
    shortTitle: 'Campus Placement Bootcamp: Quantitative, Logic & HR Mock',
    category: 'Placement & Career',
    tabs: ['All Programmes', 'Campus Placement'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Bestseller',
    rating: 4.9,
    ratingCount: '6,450 ratings',
    duration: '6–8 Weeks',
    mode: 'Live Lab & Mentor Evaluation',
    tagline: 'Company-specific aptitude patterns, group discussions and interview simulations',
    image: '/images/courses/aptitude.jpg',
    logo: '/images/tech/aptitude.png',
    slug: 'aptitude-placement-training',
  },
  {
    number: '10',
    name: 'Digital Marketing',
    shortTitle: 'Technical Digital Marketing: SEO, Google Tag Manager & Funnels',
    category: 'Digital & Growth',
    tabs: ['All Programmes', 'Digital Marketing'],
    instructor: 'Skillthinker Institutional Lab • Trichy',
    badge: 'Lab Track',
    rating: 4.7,
    ratingCount: '1,180 ratings',
    duration: '6–8 Weeks',
    mode: 'Live Lab & Mentor Evaluation',
    tagline: 'Data-driven performance marketing, conversion tracking and organic SEO',
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
  'Database Engineering',
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
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
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
      className="relative py-16 sm:py-20 lg:py-24 bg-white text-slate-900 border-b border-slate-200 overflow-x-clip select-none"
    >
      {/* Anchor for external routing */}
      <div id="courses" className="absolute -top-20 left-0 pointer-events-none" />

      {/* Wide Container to fill screen comfortably */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        
        {/* ── 1. HEADER: CLEAN EDITORIAL ON WHITE (UDEMY REFERENCE) ── */}
        <div className="max-w-4xl mb-7">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A3A7A]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#0A3A7A]">
              ACADEMIC CURRICULUM
            </span>
          </div>

          <h2 
            id="academic-curriculum-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1c1d1f] tracking-[-0.02em] leading-tight"
          >
            Skills to transform your <span className="text-[#0A3A7A]">career and life</span>
          </h2>

          <p className="text-[#6a6f73] text-sm sm:text-base mt-2 font-normal leading-relaxed">
            From critical programming foundations to production enterprise engineering, Skillthinker supports your professional development with lab projects and mentor evaluations.
          </p>
        </div>

        {/* ── 2. HORIZONTAL TOPIC TABS (UDEMY EXACT STYLE ON WHITE) ── */}
        <div className="border-b border-slate-200 mb-6">
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
                  className={`text-sm pb-3 whitespace-nowrap transition-colors relative cursor-pointer focus-visible:outline-none ${
                    isActive
                      ? 'text-[#1c1d1f] font-bold'
                      : 'text-[#6a6f73] hover:text-[#1c1d1f] font-semibold'
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1c1d1f] rounded-full" />
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
            className={`absolute left-0 sm:-left-3 lg:-left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-slate-900 shadow-xl border border-slate-200 flex items-center justify-center z-30 cursor-pointer transition-all hover:bg-slate-50 active:scale-95 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-slate-800" />
          </button>

          {/* Right Floating Circular Navigation Arrow */}
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Next courses"
            className={`absolute right-0 sm:-right-3 lg:-right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-slate-900 shadow-xl border border-slate-200 flex items-center justify-center z-30 cursor-pointer transition-all hover:bg-slate-50 active:scale-95 ${
              canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight className="w-5 h-5 text-slate-800" />
          </button>

          {/* Carousel Track (Fills 4 cards wide on desktop with generous edge padding so no card is cut off) */}
          <div 
            ref={carouselRef}
            className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar px-2 sm:px-4 lg:px-6 py-4 -mx-2 sm:-mx-4 lg:-mx-6 scroll-px-2 sm:scroll-px-4 lg:scroll-px-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredCourses.map((course) => (
              <Link
                key={course.number}
                href={`/programs#${course.slug}`}
                className="group relative flex flex-col justify-between rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden shadow-xs snap-start flex-[0_0_285px] sm:flex-[0_0_305px] lg:flex-[0_0_295px] xl:flex-[0_0_315px] 2xl:flex-[0_0_325px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A3A7A]"
              >
                <div>
                  {/* Video Thumbnail (Exact 16:9) */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100 border-b border-slate-100">
                    <Image
                      src={course.image}
                      alt={`${course.name} thumbnail`}
                      fill
                      sizes="(max-width: 640px) 285px, (max-width: 1024px) 305px, 325px"
                      className="object-cover"
                    />

                    {/* Official Tech Logo Pin */}
                    <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-md bg-white/95 border border-slate-200 flex items-center justify-center p-1 shadow-2xs backdrop-blur-xs">
                      <Image
                        src={course.logo}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                  </div>

                  {/* Course Details (Udemy Typography Rhythm on White) */}
                  <div className="p-4 pb-2">
                    {/* Course Headline Title */}
                    <h3 className="text-sm sm:text-base font-bold text-[#1c1d1f] group-hover:text-[#0A3A7A] transition-colors leading-snug line-clamp-2 min-h-[2.5rem]">
                      {course.shortTitle}
                    </h3>

                    {/* Instructor / Lab Byline */}
                    <p className="text-[12px] text-[#6a6f73] mt-1 truncate font-normal">
                      {course.instructor}
                    </p>

                    {/* Udemy Rating & Badge Row */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {course.badge === 'Bestseller' && (
                        <span className="px-2 py-0.5 rounded-xs text-[11px] font-bold bg-[#d1f2eb] text-[#005646]">
                          Bestseller
                        </span>
                      )}
                      {course.badge === 'Premium' && (
                        <span className="px-2 py-0.5 rounded-xs text-[11px] font-bold bg-[#401b9c] text-white">
                          Premium
                        </span>
                      )}
                      {course.badge === 'Lab Track' && (
                        <span className="px-2 py-0.5 rounded-xs text-[11px] font-bold bg-[#eceb98] text-[#3d3c0a]">
                          Lab Track
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-xs font-bold text-[#b4690e]">
                        <Star className="w-3.5 h-3.5 fill-[#b4690e] text-[#b4690e]" />
                        <span>{course.rating.toFixed(1)}</span>
                      </div>

                      <span className="text-[11px] text-[#6a6f73]">
                        ({course.ratingCount})
                      </span>
                    </div>

                    {/* Meaningful One-Line Tagline Description */}
                    <p className="text-xs text-[#6a6f73] mt-2 line-clamp-2 leading-relaxed font-normal">
                      {course.tagline}
                    </p>
                  </div>
                </div>

                {/* Footer: Metadata on Left, Udemy Outline Button on Right */}
                <div className="p-4 pt-3 border-t border-slate-100 mt-auto flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1c1d1f]">
                      {course.duration}
                    </span>
                    <span className="text-[11px] text-[#6a6f73] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Lab Certified
                    </span>
                  </div>

                  {/* Clean Human-Crafted Outline Button (Udemy "Add to cart" style) */}
                  <div className="py-1.5 px-3 rounded-md border border-[#0A3A7A] text-[#0A3A7A] group-hover:bg-[#0A3A7A] group-hover:text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap">
                    <span>Explore Track</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>

        {/* ── 4. EXPLORE ALL PROGRAMMES (UDEMY BOTTOM CTA LINK) ── */}
        <div className="mt-7">
          <Link
            href="/programs"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0A3A7A] hover:text-[#06284F] hover:underline transition-colors group"
          >
            <span>Show all {selectedTab === 'All Programmes' ? 'academic' : selectedTab} courses</span>
            <ArrowRight className="w-4 h-4 text-[#0A3A7A] transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ── 5. ADVISORY BANNER: CLEAN LIGHT SURFACE ── */}
        <div className="mt-10 sm:mt-12 p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A3A7A] shrink-0">
              <HelpCircle className="w-5 h-5 text-[#0A3A7A]" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900">
                Unsure which program fits your background?
              </div>
              <div className="text-xs sm:text-sm text-slate-600 font-normal mt-0.5">
                Our admissions advisors in Trichy can evaluate your academic background and recommend the ideal track.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            className="px-6 py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#06284F] text-white font-extrabold text-xs sm:text-sm shrink-0 transition-colors cursor-pointer shadow-xs"
          >
            Get Free Career Assessment
          </button>
        </div>

      </div>
    </section>
  );
}
