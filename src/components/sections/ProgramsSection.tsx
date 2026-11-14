'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Laptop, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';
import TechLogo from '@/components/ui/TechLogos';
import CurriculumPreview from '@/components/sections/CurriculumPreviews';

export interface CurriculumTrack {
  id: string;
  number: string;
  name: string;
  shortName: string;
  category: string;
  logoKey: string;
  duration: string;
  mode: string;
  tagline: string;
  overview: string;
  deliverables: string[];
  techStack: string[];
  idealFor: string;
}

export const CURRICULUM_TRACKS: CurriculumTrack[] = [
  {
    id: 'prog-java',
    number: '01',
    name: 'Java Programming',
    shortName: 'Java',
    category: 'Enterprise Engineering',
    logoKey: 'java',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    tagline: 'Enterprise Backend & Microservices Architecture',
    overview:
      'Engineer robust, scalable backends using modern Java and Spring Boot. Learn multi-threading, concurrency, Spring Data JPA, Hibernate, and containerized microservice architectures built for enterprise production.',
    deliverables: [
      'Spring Boot RESTful microservices with JWT authentication',
      'Hibernate ORM & relational SQL persistence layer',
      'Multi-threaded concurrent task executors & containerized deploys',
    ],
    techStack: ['Java 21', 'Spring Boot', 'Hibernate', 'REST APIs', 'JDBC', 'Docker'],
    idealFor: 'Developers aiming for senior enterprise Java backend roles.',
  },
  {
    id: 'prog-python',
    number: '02',
    name: 'Python Programming',
    shortName: 'Python',
    category: 'Core Programming',
    logoKey: 'python',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    tagline: 'Advanced Python, Async IO & Software Engineering',
    overview:
      'From foundational scripting to advanced asynchronous frameworks, OOP metaprogramming, and automated workflows. Write idiomatic, production-grade Python that powers modern backends and data pipelines.',
    deliverables: [
      'Asynchronous web backends with FastAPI & AsyncIO event loop',
      'Advanced OOP protocols, dunder methods & custom decorators',
      'Automated data ingestion and API pipelines with Pydantic validation',
    ],
    techStack: ['Python 3', 'Async IO', 'FastAPI', 'OOP Models', 'Decorators', 'Pydantic'],
    idealFor: 'Students & engineers seeking deep Python fluency for production.',
  },
  {
    id: 'prog-web',
    number: '03',
    name: 'Web & Full Stack Development',
    shortName: 'Full Stack',
    category: 'Software Engineering',
    logoKey: 'fullstack',
    duration: '10–14 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'Modern Reactive UIs & Cloud-Native Backends',
    overview:
      'Master the entire modern web development lifecycle. Build high-performance frontend interfaces in React.js and connect them to scalable Node.js backends and MongoDB databases with clean REST architecture.',
    deliverables: [
      'Component-driven UIs with React, Tailwind CSS, and TanStack Query',
      'Node.js RESTful API architectures, middleware & authentication',
      'End-to-end full stack deployment on cloud platforms with Git CI/CD',
    ],
    techStack: ['React.js', 'JavaScript (ES6+)', 'Node.js', 'MongoDB', 'REST APIs', 'Git'],
    idealFor: 'Aspiring full stack web engineers building modern SaaS products.',
  },
  {
    id: 'prog-dotnet',
    number: '04',
    name: '.NET Development',
    shortName: '.NET',
    category: 'Software Engineering',
    logoKey: 'dotnet',
    duration: '10–12 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'Microsoft Enterprise Architecture & Cloud Services',
    overview:
      'Build enterprise software and mission-critical cloud APIs with C#, ASP.NET Core, and Entity Framework Core. Learn enterprise architectural patterns, MVC, dependency injection, and SQL Server optimization.',
    deliverables: [
      'Enterprise ASP.NET Core Web APIs with JWT security & authorization',
      'Entity Framework Core code-first database migrations & LINQ queries',
      'Clean architecture, dependency injection, and repository patterns',
    ],
    techStack: ['C#', 'ASP.NET Core', 'EF Core', 'SQL Server', 'Web API', 'LINQ'],
    idealFor: 'Developers preparing for Microsoft .NET enterprise engineering positions.',
  },
  {
    id: 'prog-analytics',
    number: '05',
    name: 'Data Analytics & BI',
    shortName: 'Analytics',
    category: 'Data & Analytics',
    logoKey: 'analytics',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'Relational Intelligence & Executive Decision Dashboards',
    overview:
      'Transform unstructured raw enterprise data into automated executive dashboards. Master complex SQL queries, star schemas, Power BI DAX formulas, Python analytics, and business intelligence reporting.',
    deliverables: [
      'Interactive executive dashboards in Power BI Desktop with drilldowns',
      'Advanced SQL joins, CTEs, and analytic window functions',
      'Python data manipulation with Pandas, NumPy, and Seaborn visualization',
    ],
    techStack: ['Power BI Desktop', 'SQL Queries', 'Python Analytics', 'Advanced Excel', 'DAX'],
    idealFor: 'Data analysts, BI specialists, and quantitative decision makers.',
  },
  {
    id: 'prog-ai',
    number: '06',
    name: 'AI & Emerging Technologies',
    shortName: 'AI & RAG',
    category: 'AI & Emerging',
    logoKey: 'ai',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'Generative AI, Agentic Workflows & Production RAG',
    overview:
      'Build applied AI applications using foundational models, vector embeddings, semantic retrieval, and agentic tool workflows. Learn to automate complex business workflows with n8n and modern AI frameworks.',
    deliverables: [
      'Document RAG pipelines with vector databases and semantic search',
      'Autonomous multi-step AI agents using n8n workflows and API tooling',
      'Prompt engineering standards, evaluation frameworks, and guardrails',
    ],
    techStack: ['Generative AI', 'Agentic RAG', 'Prompt Engineering', 'n8n Automation', 'Vector DB'],
    idealFor: 'Engineers and technical leaders building applied generative AI software.',
  },
  {
    id: 'prog-backend',
    number: '07',
    name: 'Database & Backend Tech',
    shortName: 'Databases',
    category: 'Backend & Data',
    logoKey: 'database',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'High-Throughput Relational & NoSQL Architecture',
    overview:
      'Master schema normalization, B-Tree indexing, subqueries, ACID transactions, and document data models in MongoDB. Design robust databases capable of handling heavy concurrent write and read operations.',
    deliverables: [
      'Relational schema design with integrity constraints & foreign keys',
      'Complex query optimization, indexing strategies, and EXPLAIN plans',
      'MongoDB aggregation pipelines and document-oriented storage models',
    ],
    techStack: ['SQL Architecture', 'MongoDB', 'PostgreSQL', 'Indexing', 'Stored Procedures'],
    idealFor: 'Backend developers and database engineers optimizing storage layers.',
  },
  {
    id: 'prog-programming',
    number: '08',
    name: 'Programming Fundamentals',
    shortName: 'C & C++',
    category: 'Core Programming',
    logoKey: 'cpp',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'Algorithmic Thinking, Pointers & Memory Models',
    overview:
      'Build an ironclad foundation in computational logic and memory models. Master procedural programming, pointers, memory allocation, and object-oriented principles in C, C++, and modern data structures.',
    deliverables: [
      'Pointers, memory addressing, and dynamic heap/stack allocation',
      'Classic data structures: Linked Lists, Stacks, Queues, Trees, and Graphs',
      'Object-oriented principles: Polymorphism, Inheritance, Encapsulation, STL',
    ],
    techStack: ['C Programming', 'C++', 'C#', 'Data Structures', 'Algorithms', 'Memory Models'],
    idealFor: 'Beginners and computer science students building core coding ability.',
  },
  {
    id: 'prog-aptitude',
    number: '09',
    name: 'Aptitude & Placement Training',
    shortName: 'Placement Prep',
    category: 'Placement & Career',
    logoKey: 'aptitude',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    tagline: 'Quantitative Reasoning, Logic & Technical Mock Interviews',
    overview:
      'Comprehensive placement readiness for IT services and product company campus drives. Master speed math, quantitative aptitude, syllogisms, reading comprehension, and simulate 1-on-1 technical and HR interviews.',
    deliverables: [
      'Speed math techniques, shortcut formulas & quantitative deduction',
      'Logical puzzle solving, syllogisms, and data interpretation',
      'Realistic 1-on-1 mock technical interviews and constructive evaluation',
    ],
    techStack: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Mock Interviews', 'GD'],
    idealFor: 'Final-year college students preparing for campus recruitment drives.',
  },
  {
    id: 'prog-marketing',
    number: '10',
    name: 'Digital Marketing',
    shortName: 'Growth Marketing',
    category: 'Digital & Growth',
    logoKey: 'marketing',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    tagline: 'Technical SEO, Tag Management & User Acquisition',
    overview:
      'Execute high-impact organic search optimization, tag management, and conversion analytics. Learn technical site audits, Google Tag Manager event tracking, Search Console analysis, and growth analytics.',
    deliverables: [
      'Technical SEO audits, Core Web Vitals, and crawl optimization',
      'Google Tag Manager custom triggers, dataLayer events, and conversion tags',
      'Audience acquisition funnels and executive analytics reporting',
    ],
    techStack: ['Technical SEO', 'Google Tag Manager', 'Search Console', 'Analytics', 'Conversion Funnels'],
    idealFor: 'Marketing professionals, entrepreneurs, and career switchers.',
  },
];

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();
  const [activeIdx, setActiveIdx] = useState(0);

  const active = CURRICULUM_TRACKS[activeIdx];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? CURRICULUM_TRACKS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === CURRICULUM_TRACKS.length - 1 ? 0 : prev + 1));
  };

  return (
    <section 
      id="programs" 
      aria-labelledby="curriculum-index-heading"
      className="relative py-20 lg:py-28 bg-[#07182B] text-white border-b border-white/10"
    >
      {/* Anchor for external links */}
      <div id="courses" className="absolute -top-20 left-0 pointer-events-none" />

      {/* Subtle Background Structural Accent */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#1769D2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#FFB000]/5 rounded-full blur-3xl pointer-events-none" />

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
            id="curriculum-index-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-[-0.03em] leading-[1.15]"
          >
            Choose the right <span className="text-[#FFB000]">learning path.</span>
          </h2>

          <p className="text-[#B8C6D8] text-sm sm:text-base mt-3 max-w-2xl font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* ── MOBILE TRACK SELECTOR (HORIZONTAL PILL BAR) ── */}
        <div className="lg:hidden mb-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#B8C6D8] mb-2 flex items-center justify-between">
            <span>Select Discipline ({activeIdx + 1} of 10)</span>
            <span className="text-[#FFB000]">{active.shortName}</span>
          </div>
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
            <div className="flex items-center gap-2 min-w-max">
              {CURRICULUM_TRACKS.map((track, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-[#102A45] text-white border-[#FFB000] shadow-sm'
                        : 'bg-[#0D233B]/80 text-[#B8C6D8] border-white/10 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-[11px] text-[#FFB000]">{track.number}</span>
                    <span className="whitespace-nowrap">{track.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MAIN EXPERIENCE: TWO-PART INTERACTIVE CURRICULUM INDEX ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ════ LEFT COLUMN: CURRICULUM NAVIGATION (10 COURSES) ════ */}
          <div className="hidden lg:block lg:col-span-4 bg-[#0D233B] border border-white/10 rounded-2xl overflow-hidden shadow-lg sticky top-24">
            
            {/* Navigation Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#07182B]/60">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B8C6D8]">
                Discipline Index
              </span>
              <span className="text-[11px] font-mono text-[#FFB000] bg-[#FFB000]/10 px-2 py-0.5 rounded border border-[#FFB000]/20 font-semibold">
                10 Tracks
              </span>
            </div>

            {/* Vertical List of Courses */}
            <div className="divide-y divide-white/5 max-h-[660px] overflow-y-auto no-scrollbar">
              {CURRICULUM_TRACKS.map((track, idx) => {
                const isActive = idx === activeIdx;

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`w-full text-left px-5 py-3.5 transition-colors flex items-center justify-between gap-3 cursor-pointer group border-l-2 ${
                      isActive
                        ? 'bg-[#102A45] border-[#FFB000] text-white'
                        : 'border-transparent text-[#B8C6D8] hover:bg-[#07182B]/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Sequence Number */}
                      <span
                        className={`text-xs font-mono font-bold shrink-0 ${
                          isActive ? 'text-[#FFB000]' : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      >
                        {track.number}
                      </span>

                      {/* Brand Logo */}
                      <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                        <TechLogo name={track.logoKey} size={18} />
                      </div>

                      {/* Course Title and Category */}
                      <div className="min-w-0">
                        <div className={`text-sm font-bold truncate leading-snug ${isActive ? 'text-white' : 'text-[#B8C6D8] group-hover:text-white'}`}>
                          {track.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {track.category}
                        </div>
                      </div>
                    </div>

                    {/* Active Indicator Chevron / Dot */}
                    <div className="shrink-0">
                      {isActive ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFB000]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer Hint */}
            <div className="px-5 py-3 border-t border-white/10 bg-[#07182B]/60 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Verified Syllabus</span>
              <span className="font-mono text-[#FFB000]">Trichy Campus Hub</span>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: SELECTED COURSE PRESENTATION ════ */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-[#0D233B] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
              
              {/* 1. Header: Course number & Category + Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-md bg-[#FFB000]/15 border border-[#FFB000]/30 text-[#FFB000] text-xs font-mono font-bold">
                    TRACK {active.number}
                  </span>
                  <span className="text-xs font-semibold text-[#B8C6D8] uppercase tracking-wider">
                    {active.category}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#B8C6D8] font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{active.duration}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    <span>{active.mode}</span>
                  </span>
                </div>
              </div>

              {/* 2 & 3. Title & Tagline */}
              <div className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#102A45] border border-white/10 flex items-center justify-center shrink-0">
                    <TechLogo name={active.logoKey} size={22} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    {active.name}
                  </h3>
                </div>
                <p className="text-sm sm:text-base font-semibold text-[#FFB000] mt-2">
                  {active.tagline}
                </p>
              </div>

              {/* 5. Concise Overview */}
              <p className="text-[#B8C6D8] text-sm sm:text-base leading-relaxed mt-4 font-normal">
                {active.overview}
              </p>

              {/* 8. Dedicated Discipline-Specific Visual Preview */}
              <div className="mt-6 pt-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Technical Lab Architecture &amp; Execution Preview</span>
                  <span className="text-[#FFB000]">Live Lab Artifact</span>
                </div>
                <CurriculumPreview trackId={active.id} />
              </div>

              {/* 6. Three Core Deliverables */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Key Production Deliverables:
                </div>
                <div className="space-y-2.5">
                  {active.deliverables.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#B8C6D8]">
                      <CheckCircle2 className="w-4 h-4 text-[#FFB000] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Tooling & Frameworks Compact Inline Labels */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Tooling &amp; Frameworks Covered:
                </div>
                <div className="flex flex-wrap gap-2">
                  {active.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded bg-[#102A45] border border-white/10 text-white text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* 9. Action Buttons & Track Stepper */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openModal(active.name)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFB000] hover:bg-[#E59E00] text-[#07182B] font-extrabold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
                  >
                    <span>Enquire for this Track</span>
                    <ArrowRight className="w-4 h-4 text-[#07182B]" />
                  </button>

                  <Link
                    href={`/programs#${active.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#102A45] hover:bg-[#102A45]/80 border border-white/10 text-white text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <span>Explore Full Catalog</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                  </Link>

                  <a
                    href={`https://wa.me/919442605096?text=Hi%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(active.name)}%20curriculum%20syllabus.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors py-2 px-2"
                  >
                    <span>WhatsApp Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Track Steppers (Prev / Next) */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous track"
                    className="p-2 rounded-lg bg-[#102A45] hover:bg-[#102A45]/80 border border-white/10 text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-[#B8C6D8] px-2 font-medium">
                    {active.number} / 10
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next track"
                    className="p-2 rounded-lg bg-[#102A45] hover:bg-[#102A45]/80 border border-white/10 text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ── BOTTOM ADVISORY STRIP ── */}
        <div className="mt-12 p-6 rounded-2xl bg-[#0D233B] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg">
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
