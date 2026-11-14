'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, HelpCircle, CheckCircle2, Check, UserCheck } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export interface CourseProgram {
  number: string;
  name: string;
  category: string;
  topics: string[];
  idealFor: string;
  badge: 'Bestseller' | 'Premium' | 'Foundation' | 'Specialization';
  rating: number;
  ratingCount: string;
  image: string;
  logo: string;
  slug: string;
  contactUrl: string;
}

export const PROGRAM_FEATURES = [
  'Structured, easy-to-understand learning',
  'Practical, hands-on training',
  'Projects and assignments',
  'Expert guidance',
  'Career-oriented learning',
  'Certification',
  'Continuous learner support',
] as const;

export const COURSES_DATA: CourseProgram[] = [
  {
    number: '01',
    name: 'Java Programming',
    category: 'Enterprise Engineering',
    topics: [
      'Java Fundamentals',
      'Methods & Recursion',
      'OOP',
      'Exception Handling',
      'Collections Framework',
      'Multithreading & Concurrency',
      'JDBC & Database Connectivity',
      'Spring Framework',
      'Spring Boot',
      'RESTful Web Services',
    ],
    idealFor: 'Backend developers building with Java & Spring',
    badge: 'Bestseller',
    rating: 4.9,
    ratingCount: '2,840 ratings',
    image: '/images/courses/java.jpg',
    logo: '/images/tech/java.png',
    slug: 'java-programming',
    contactUrl: '/#contact',
  },
  {
    number: '02',
    name: 'Python Programming',
    category: 'Core Programming',
    topics: [
      'Python Fundamentals',
      'Python Data Model & Metaprogramming',
      'Advanced Control Flow & Memory Management',
      'Concurrency, Parallelism & Async IO',
      'Enterprise Design & Ecosystem Tools',
      'High-Level Framework Domains',
    ],
    idealFor: 'Python developers at any level, beginner to advanced',
    badge: 'Bestseller',
    rating: 4.9,
    ratingCount: '3,410 ratings',
    image: '/images/courses/python.jpg',
    logo: '/images/tech/python.png',
    slug: 'python-programming',
    contactUrl: '/#contact',
  },
  {
    number: '03',
    name: 'Web & Full Stack Development',
    category: 'Software Engineering',
    topics: [
      'HTML and CSS',
      'JavaScript',
      'React.js',
      'MongoDB',
      'Full Stack Project Development',
    ],
    idealFor: 'Aspiring front-end & full stack developers',
    badge: 'Bestseller',
    rating: 4.9,
    ratingCount: '4,120 ratings',
    image: '/images/courses/web.jpg',
    logo: '/images/tech/react.png',
    slug: 'web-full-stack-development',
    contactUrl: '/#contact',
  },
  {
    number: '04',
    name: '.NET Development',
    category: 'Enterprise Engineering',
    topics: [
      'C# Programming',
      'ASP.NET Core',
      'MVC Architecture',
      'Web API Development',
      'Entity Framework Core',
      'SQL Server',
      'Full Stack .NET Projects',
    ],
    idealFor: 'Developers targeting enterprise .NET roles',
    badge: 'Premium',
    rating: 4.8,
    ratingCount: '1,290 ratings',
    image: '/images/courses/dotnet.jpg',
    logo: '/images/tech/dotnet.png',
    slug: 'dotnet-development',
    contactUrl: '/#contact',
  },
  {
    number: '05',
    name: 'Data Analytics & BI',
    category: 'Data & Analytics',
    topics: [
      'Advanced Excel',
      'SQL & Database Concepts',
      'Power BI Desktop',
      'Data Modeling',
      'Dashboard Design',
      'Business Reporting Projects',
      'Data Analytics using Python',
      'Tableau',
    ],
    idealFor: 'Analysts & BI aspirants who love working with data',
    badge: 'Bestseller',
    rating: 4.8,
    ratingCount: '2,630 ratings',
    image: '/images/courses/analytics.jpg',
    logo: '/images/tech/powerbi.png',
    slug: 'data-analytics-bi',
    contactUrl: '/#contact',
  },
  {
    number: '06',
    name: 'AI & Emerging Technologies',
    category: 'AI & Emerging',
    topics: [
      'Generative AI',
      'Prompt Engineering',
      'Agentic AI + RAG',
      'AI Application Development',
      'N8N (Nodemation)',
    ],
    idealFor: 'Developers exploring applied AI & automation',
    badge: 'Premium',
    rating: 4.9,
    ratingCount: '5,210 ratings',
    image: '/images/courses/ai.jpg',
    logo: '/images/tech/ai.png',
    slug: 'ai-emerging-technologies',
    contactUrl: '/#contact',
  },
  {
    number: '07',
    name: 'Database & Backend Technologies',
    category: 'Backend & Data',
    topics: [
      'SQL',
      'MongoDB',
      'Database Design',
      'Joins, Subqueries & Stored Procedures',
    ],
    idealFor: 'Backend & database-focused learners',
    badge: 'Specialization',
    rating: 4.7,
    ratingCount: '1,540 ratings',
    image: '/images/courses/database.jpg',
    logo: '/images/tech/database.png',
    slug: 'database-backend-technologies',
    contactUrl: '/#contact',
  },
  {
    number: '08',
    name: 'Programming Fundamentals',
    category: 'Core Programming',
    topics: [
      'C and C++',
      'C# Programming',
      'Data Structures & Algorithms',
      'Object-Oriented Programming',
      'Problem Solving & Coding Practice',
    ],
    idealFor: 'Beginners starting their programming journey',
    badge: 'Foundation',
    rating: 4.8,
    ratingCount: '3,870 ratings',
    image: '/images/courses/cpp.jpg',
    logo: '/images/tech/cpp.png',
    slug: 'programming-fundamentals',
    contactUrl: '/#contact',
  },
  {
    number: '09',
    name: 'Aptitude & Placement Training',
    category: 'Placement & Career',
    topics: [
      'Quantitative Aptitude',
      'Verbal Ability & English',
      'Logical & Non-Verbal Reasoning',
      'Puzzles & Analytical Thinking',
      'Tabulation, DI & Charts',
      'Company-Specific Prep',
      'GD & Interview Skills',
    ],
    idealFor: 'Final-year students & graduates preparing for placements',
    badge: 'Bestseller',
    rating: 4.9,
    ratingCount: '6,450 ratings',
    image: '/images/courses/aptitude.jpg',
    logo: '/images/tech/aptitude.png',
    slug: 'aptitude-placement-training',
    contactUrl: '/#contact',
  },
  {
    number: '10',
    name: 'Digital Marketing',
    category: 'Digital & Growth',
    topics: [
      'SEO (Search Engine Optimization)',
      'Google Tag Manager (GTM)',
    ],
    idealFor: 'Marketers, business owners & career switchers',
    badge: 'Specialization',
    rating: 4.7,
    ratingCount: '1,180 ratings',
    image: '/images/courses/marketing.jpg',
    logo: '/images/tech/marketing.png',
    slug: 'digital-marketing',
    contactUrl: '/#contact',
  },
];

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();

  return (
    <section 
      id="programs" 
      aria-labelledby="courses-programs-heading"
      className="relative py-16 sm:py-20 lg:py-24 bg-white text-slate-900 border-b border-slate-200"
    >
      {/* Anchor for external routing */}
      <div id="courses" className="absolute -top-20 left-0 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        
        {/* ── 1. HEADER: EXACT USER COPY ON CLEAN WHITE ── */}
        <div className="max-w-4xl mb-10 sm:mb-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A3A7A]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#0A3A7A]">
              Courses &amp; Programs
            </span>
          </div>

          <h2 
            id="courses-programs-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1c1d1f] tracking-[-0.02em] leading-tight"
          >
            Choose the right <span className="text-[#0A3A7A]">learning path.</span>
          </h2>

          <p className="text-[#6a6f73] text-sm sm:text-base mt-2.5 font-normal leading-relaxed">
            Whether you&apos;re starting your career, upgrading your existing skills, or exploring a new professional direction, our programs are designed to provide a structured and engaging learning experience.
          </p>

          {/* Program Value Propositions Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            {PROGRAM_FEATURES.map((feature) => (
              <span 
                key={feature} 
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 rounded-full shadow-2xs"
              >
                <Check className="w-3 h-3 text-[#0A3A7A] shrink-0" />
                <span>{feature}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── 2. CLEAN DIRECT COURSE GRID (NO SLIDER, NO CLIPPING, ZERO REDUNDANCY) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {COURSES_DATA.map((course) => (
            <div
              key={course.number}
              className="group relative flex flex-col justify-between rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A3A7A]"
            >
              <div>
                {/* 16:9 Thumbnail with Official Tech Logo */}
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100 border-b border-slate-100">
                  <Image
                    src={course.image}
                    alt={`${course.name} preview thumbnail`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />

                  {/* Number & Category Pill */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-white/95 border border-slate-200 backdrop-blur-xs flex items-center gap-1.5 shadow-2xs">
                    <span className="font-mono text-[10px] font-bold text-[#0A3A7A]">
                      {course.number}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      {course.category}
                    </span>
                  </div>

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

                {/* Course Details */}
                <div className="p-4 sm:p-5 pb-3">
                  {/* Course Headline Title */}
                  <Link href={`/programs#${course.slug}`}>
                    <h3 className="text-lg font-bold text-[#1c1d1f] hover:text-[#0A3A7A] transition-colors leading-snug">
                      {course.name}
                    </h3>
                  </Link>

                  {/* Ideal For Box */}
                  <div className="mt-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-100 flex items-start gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-[#0A3A7A] shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 leading-snug">
                      <strong className="text-slate-900 font-semibold">Ideal for:</strong> {course.idealFor}
                    </p>
                  </div>

                  {/* Rating & Badge Row */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
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
                    {course.badge === 'Foundation' && (
                      <span className="px-2 py-0.5 rounded-xs text-[11px] font-bold bg-[#fef3c7] text-[#92400e]">
                        Foundation
                      </span>
                    )}
                    {course.badge === 'Specialization' && (
                      <span className="px-2 py-0.5 rounded-xs text-[11px] font-bold bg-[#e0e7ff] text-[#3730a3]">
                        Specialization
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-xs font-bold text-[#b4690e]">
                      <Star className="w-3.5 h-3.5 fill-[#b4690e] text-[#b4690e]" />
                      <span>{course.rating.toFixed(1)}</span>
                    </div>

                    <span className="text-xs text-[#6a6f73]">
                      ({course.ratingCount})
                    </span>
                  </div>

                  {/* Core Syllabus Modules */}
                  <div className="mt-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Core Syllabus Modules
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {course.topics.map((topic) => (
                        <span 
                          key={topic} 
                          className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer: Certification & Direct Ask CTA */}
              <div className="p-4 sm:p-5 pt-3.5 border-t border-slate-100 mt-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Certification</span>
                </div>

                <Link
                  href={course.contactUrl}
                  className="py-2 px-3.5 rounded-md border border-[#0A3A7A] text-[#0A3A7A] hover:bg-[#0A3A7A] hover:text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Ask about this course</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ── 3. ADVISORY BANNER: CLEAN LIGHT SURFACE ── */}
        <div className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A3A7A] shrink-0">
              <HelpCircle className="w-5 h-5 text-[#0A3A7A]" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900">
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
