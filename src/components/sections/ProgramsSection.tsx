'use client';

import React, { useState } from 'react';
import { ArrowRight, Laptop, Clock, CheckCircle2, Award, MessageCircle, HelpCircle, ChevronRight } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';
import TechLogo from '@/components/ui/TechLogos';

interface CurriculumTrack {
  id: string;
  number: string;
  name: string;
  category: string;
  logoKey: string;
  duration: string;
  mode: string;
  level: string;
  summary: string;
  milestones: { title: string; desc: string }[];
  techStack: string[];
  idealFor: string;
  keyOutcome: string;
}

const TRACKS_CATALOG: CurriculumTrack[] = [
  {
    id: 'prog-java',
    number: '01',
    name: 'Java Programming',
    category: 'Software Engineering',
    logoKey: 'java',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    level: 'Beginner to Enterprise',
    summary:
      'Master enterprise backend architecture with Core Java, Spring Boot, multithreading, and RESTful web services. Build scalable microservices backed by relational database persistence.',
    milestones: [
      { title: 'Core Java & OOP', desc: 'Syntax, memory model, recursion, OOP patterns, and Exception Handling.' },
      { title: 'Collections & Concurrency', desc: 'Generics, Collections Framework, Multithreading, and Thread Synchronization.' },
      { title: 'Spring Boot Ecosystem', desc: 'Dependency Injection, Spring MVC, Spring Data JPA, and Hibernate.' },
      { title: 'Enterprise Capstone', desc: 'Production RESTful API with authentication, testing, and SQL persistence.' },
    ],
    techStack: ['Core Java', 'Spring Boot', 'Spring Framework', 'JDBC', 'Hibernate', 'RESTful APIs', 'Maven'],
    idealFor: 'Backend developers and graduates targeting Java enterprise software engineering roles.',
    keyOutcome: 'Build deployable, production-ready enterprise backends and REST microservices.',
  },
  {
    id: 'prog-python',
    number: '02',
    name: 'Python Programming',
    category: 'Core Programming',
    logoKey: 'python',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    level: 'Beginner to Advanced',
    summary:
      'From foundational scripting and data structures to advanced metaprogramming and asynchronous frameworks. Write clean, idiomatic Python for automation, backends, and data tasks.',
    milestones: [
      { title: 'Pythonic Fundamentals', desc: 'Data structures, control flow, functions, modules, and error handling.' },
      { title: 'OOP & Data Model', desc: 'Classes, dunder methods, decorators, generators, and memory architecture.' },
      { title: 'Async & Concurrency', desc: 'Multiprocessing, Threading, and Async IO for high-performance I/O.' },
      { title: 'Live Framework Project', desc: 'REST API backend and automated data pipelines using modern Python.' },
    ],
    techStack: ['Python 3', 'Async IO', 'OOP & Data Model', 'FastAPI', 'Data Structures', 'Automation'],
    idealFor: 'Developers, automation engineers, and students looking for comprehensive Python depth.',
    keyOutcome: 'Develop asynchronous Python web services and robust automated software pipelines.',
  },
  {
    id: 'prog-web',
    number: '03',
    name: 'Web & Full Stack Development',
    category: 'Software Engineering',
    logoKey: 'fullstack',
    duration: '10–14 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    level: 'Beginner to Full Stack',
    summary:
      'Build modern responsive web applications from interface to database. Master component architectures, state management, REST APIs, and full-stack deployment on modern clouds.',
    milestones: [
      { title: 'Modern UI Engineering', desc: 'Semantic HTML5, modern CSS3, responsive layouts, and Tailwind.' },
      { title: 'JavaScript Mastery', desc: 'ES6+ syntax, closures, event loop, Promises, and asynchronous DOM.' },
      { title: 'React Frontend Arch', desc: 'Components, hooks, state management, client routing, and API integration.' },
      { title: 'Full Stack Deployment', desc: 'Node.js backend, MongoDB database schemas, and live cloud deployment.' },
    ],
    techStack: ['React.js', 'JavaScript (ES6+)', 'Node.js', 'HTML5 / CSS3', 'MongoDB', 'REST APIs', 'Git'],
    idealFor: 'Aspiring frontend, backend, and full stack software engineers building web applications.',
    keyOutcome: 'Engineer and deploy complete, responsive full-stack applications with database integration.',
  },
  {
    id: 'prog-dotnet',
    number: '04',
    name: '.NET Development',
    category: 'Software Engineering',
    logoKey: 'dotnet',
    duration: '10–12 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    level: 'Intermediate to Pro',
    summary:
      'Develop enterprise-grade web applications and APIs using the Microsoft .NET ecosystem. Learn C#, ASP.NET Core, MVC architectures, and SQL Server persistence.',
    milestones: [
      { title: 'C# Language & OOP', desc: 'Types, LINQ, delegates, interfaces, memory models, and clean architecture.' },
      { title: 'ASP.NET Core & MVC', desc: 'Dependency Injection, middleware pipelines, routing, and Razor/MVC.' },
      { title: 'Entity Framework & SQL', desc: 'Code-first migrations, SQL Server schema design, and query optimization.' },
      { title: 'Enterprise Web API', desc: 'RESTful API with JWT authentication, logging, and deployment.' },
    ],
    techStack: ['C#', 'ASP.NET Core', 'Entity Framework Core', 'SQL Server', 'Web APIs', 'LINQ', 'MVC'],
    idealFor: 'Software developers targeting corporate enterprise .NET and Microsoft stack roles.',
    keyOutcome: 'Build and deploy secure, scalable enterprise APIs and MVC business applications.',
  },
  {
    id: 'prog-analytics',
    number: '05',
    name: 'Data Analytics & BI',
    category: 'Data & Analytics',
    logoKey: 'analytics',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    level: 'All Levels',
    summary:
      'Transform complex business datasets into interactive, executive decision dashboards. Master relational queries, data pipelines, statistical modeling, and visualization.',
    milestones: [
      { title: 'Excel & Data Hygiene', desc: 'Advanced formulas, PivotTables, Power Query, and cleaning dirty datasets.' },
      { title: 'SQL Data Querying', desc: 'Complex joins, aggregations, window functions, and database extraction.' },
      { title: 'Power BI & DAX Modeling', desc: 'Data modeling, star schemas, measures, and executive KPI design.' },
      { title: 'Python & Business BI', desc: 'Pandas, data analysis, and end-to-end interactive reporting project.' },
    ],
    techStack: ['Power BI Desktop', 'SQL Queries', 'Python Analytics', 'Advanced Excel', 'DAX', 'Tableau'],
    idealFor: 'Aspiring business intelligence analysts, data specialists, and operational managers.',
    keyOutcome: 'Deliver automated, executive-ready BI dashboards backed by optimized SQL models.',
  },
  {
    id: 'prog-ai',
    number: '06',
    name: 'AI & Emerging Technologies',
    category: 'AI & Emerging',
    logoKey: 'ai',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    level: 'Intermediate',
    summary:
      'Build intelligent applications with generative models, retrieval-augmented generation (RAG), and agentic workflows. Automate complex business logic with modern AI orchestrators.',
    milestones: [
      { title: 'Generative AI & LLMs', desc: 'Foundational transformer concepts, API integration, and system prompting.' },
      { title: 'Retrieval Augmented Gen', desc: 'Vector embeddings, chunking, semantic retrieval, and document indexing.' },
      { title: 'Agentic Automation', desc: 'n8n workflow pipelines, tool calling, and multi-step AI task execution.' },
      { title: 'Applied AI Product', desc: 'Complete RAG-based AI assistant integrated with practical business tools.' },
    ],
    techStack: ['Generative AI', 'Agentic RAG', 'Prompt Engineering', 'n8n Automation', 'Vector DB', 'LangChain'],
    idealFor: 'Engineers, technical founders, and automation developers building with modern AI APIs.',
    keyOutcome: 'Deploy functional AI agent pipelines and RAG assistants connected to production data.',
  },
  {
    id: 'prog-backend',
    number: '07',
    name: 'Database & Backend Tech',
    category: 'Backend & Data',
    logoKey: 'database',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    level: 'Beginner to Pro',
    summary:
      'Design high-performance relational and document database architectures. Master schema normalization, indexing, query optimization, and complex transactional logic.',
    milestones: [
      { title: 'Relational Schemas & SQL', desc: 'Normalization, primary/foreign keys, joins, subqueries, and constraints.' },
      { title: 'Stored Procedures & Logic', desc: 'Triggers, indexes, ACID transactions, and procedural database code.' },
      { title: 'Document Data & NoSQL', desc: 'MongoDB collections, aggregation pipelines, and document schema design.' },
      { title: 'Performance Optimization', desc: 'Execution plan analysis, indexing strategies, and connection pooling.' },
    ],
    techStack: ['SQL Architecture', 'MongoDB', 'Stored Procedures', 'Indexing', 'Schema Design', 'PostgreSQL'],
    idealFor: 'Backend developers and database administrators seeking deep database proficiency.',
    keyOutcome: 'Design normalized, scalable database backends with optimized indexing strategies.',
  },
  {
    id: 'prog-programming',
    number: '08',
    name: 'Programming Fundamentals',
    category: 'Core Programming',
    logoKey: 'cpp',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    level: 'Beginner',
    summary:
      'Build an unbreakable foundation in computational logic, memory models, and algorithmic thinking. Master procedural programming, pointers, and object-oriented principles.',
    milestones: [
      { title: 'Computational Logic & C', desc: 'Variables, memory pointers, control structures, and array manipulations.' },
      { title: 'Object-Oriented C++', desc: 'Encapsulation, inheritance, polymorphism, templates, and STL usage.' },
      { title: 'Data Structures & DSA', desc: 'Linked lists, stacks, queues, trees, searching, and sorting algorithms.' },
      { title: 'Algorithmic Problem Solving', desc: 'Time/space complexity analysis and competitive coding problems.' },
    ],
    techStack: ['C Programming', 'C++', 'C#', 'Data Structures', 'Algorithms', 'Memory Pointers', 'OOP'],
    idealFor: 'First-year engineering students and beginners starting their coding foundation.',
    keyOutcome: 'Master core algorithmic problem solving, pointer mechanics, and data structures.',
  },
  {
    id: 'prog-aptitude',
    number: '09',
    name: 'Aptitude & Placement Training',
    category: 'Placement & Career',
    logoKey: 'aptitude',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    level: 'All Levels',
    summary:
      'Comprehensive preparation for corporate campus recruitment drives and technical interviews. Master quantitative reasoning, logical deduction, verbal ability, and mock interviews.',
    milestones: [
      { title: 'Quantitative Aptitude', desc: 'Percentages, ratios, time & work, permutations, probability, and speed math.' },
      { title: 'Reasoning & Logic', desc: 'Syllogisms, seating arrangements, coding-decoding, and puzzle analysis.' },
      { title: 'Verbal & Communication', desc: 'Grammar, reading comprehension, vocabulary, and business communication.' },
      { title: 'Interview Simulation', desc: 'Company-specific test patterns, group discussions, and 1-on-1 mock interviews.' },
    ],
    techStack: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Mock Interviews', 'GD Preparation'],
    idealFor: 'Pre-final and final-year college students preparing for IT and MNC campus placement drives.',
    keyOutcome: 'Clear corporate aptitude screening tests and deliver confident technical and HR interviews.',
  },
  {
    id: 'prog-marketing',
    number: '10',
    name: 'Digital Marketing',
    category: 'Digital & Growth',
    logoKey: 'marketing',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    level: 'Beginner to Intermediate',
    summary:
      'Execute high-impact organic search optimization, tag management, and conversion analytics. Drive sustainable qualified user acquisition across modern digital channels.',
    milestones: [
      { title: 'Technical SEO Audit', desc: 'Site architecture, crawling, indexing, metadata, and Core Web Vitals.' },
      { title: 'Content & Keyword Strategy', desc: 'Search intent mapping, on-page optimization, and competitive research.' },
      { title: 'Google Tag Manager', desc: 'Container setup, custom triggers, data layer variables, and event tags.' },
      { title: 'Analytics & Attribution', desc: 'Conversion goal tracking, audience funnels, and executive reporting.' },
    ],
    techStack: ['Technical SEO', 'Google Tag Manager', 'Search Console', 'Conversion Analytics', 'Organic Growth'],
    idealFor: 'Marketers, business founders, and career switchers entering digital acquisition.',
    keyOutcome: 'Audit, optimize, and track multi-channel digital campaigns with enterprise precision.',
  },
];

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();
  const [activeTrackIdx, setActiveTrackIdx] = useState(0);

  const activeTrack = TRACKS_CATALOG[activeTrackIdx];

  return (
    <section id="programs" className="relative py-20 lg:py-28 bg-[#FAFCFF] border-b border-slate-200">
      <div id="courses" className="absolute -top-24 left-0 pointer-events-none" />
      <div className="container-custom">
        
        {/* Section Header: Prestigious Editorial Typography */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A3A7A]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#0A3A7A]">
              Academic Curriculum
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#06284F] tracking-[-0.03em] leading-[1.12]">
            Choose the right <span className="text-[#0A3A7A]">learning path.</span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-2xl font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* ── INNOVATIVE MASTER CURRICULUM CONSOLE (NO REPETITIVE BOXES) ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            
            {/* ── LEFT COLUMN: Interactive Track Navigator (5 cols) ── */}
            <div className="lg:col-span-5 flex flex-col bg-slate-50/50">
              
              {/* Directory Strip Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-[#06284F]">
                  All 10 Specialized Disciplines
                </span>
                <span className="text-xs font-mono font-semibold text-[#0A3A7A] bg-blue-50 px-2 py-0.5 rounded">
                  Track {activeTrack.number} / 10
                </span>
              </div>

              {/* Scrollable / Clickable Track Items (Zero Boxes, Pure Architectural List) */}
              <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto no-scrollbar">
                {TRACKS_CATALOG.map((track, idx) => {
                  const isActive = idx === activeTrackIdx;

                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setActiveTrackIdx(idx)}
                      className={`w-full text-left px-5 py-3.5 flex items-center justify-between transition-all duration-150 cursor-pointer group ${
                        isActive
                          ? 'bg-[#06284F] text-white shadow-xs'
                          : 'hover:bg-slate-100/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Monospace Index Number */}
                        <span
                          className={`text-xs font-mono font-bold shrink-0 ${
                            isActive ? 'text-[#FCAF0A]' : 'text-slate-400 group-hover:text-[#0A3A7A]'
                          }`}
                        >
                          {track.number}
                        </span>

                        {/* Authentic Brand Logo Image */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center p-1 shrink-0 ${
                            isActive ? 'bg-white/10' : 'bg-white border border-slate-200/80 shadow-2xs'
                          }`}
                        >
                          <TechLogo name={track.logoKey} size={22} />
                        </div>

                        {/* Title & Category */}
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-bold truncate transition-colors ${
                              isActive ? 'text-white' : 'text-slate-900 group-hover:text-[#06284F]'
                            }`}
                          >
                            {track.name}
                          </div>
                          <div
                            className={`text-[11px] truncate mt-0.5 ${
                              isActive ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {track.category}
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive
                            ? 'text-[#FCAF0A] translate-x-1'
                            : 'text-slate-300 group-hover:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

            </div>

            {/* ── RIGHT COLUMN: Active Curriculum Studio View (7 cols) ── */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
              
              <div className="space-y-6">
                
                {/* Active Header: High-Res Logo + Track Metadata */}
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-2.5 shrink-0 shadow-xs">
                      <TechLogo name={activeTrack.logoKey} size={36} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-[#FCAF0A] bg-[#06284F] px-2 py-0.5 rounded">
                          Track {activeTrack.number}
                        </span>
                        <span className="text-xs font-semibold text-[#0A3A7A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {activeTrack.category}
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-extrabold text-[#06284F] tracking-tight">
                        {activeTrack.name}
                      </h3>
                    </div>
                  </div>

                  {/* Mode & Duration Metadata */}
                  <div className="hidden sm:flex flex-col items-end text-xs text-slate-500 gap-1 shrink-0">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeTrack.duration}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Laptop className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeTrack.mode}</span>
                    </span>
                  </div>
                </div>

                {/* Course Narrative Overview */}
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
                  {activeTrack.summary}
                </p>

                {/* 4-Milestone Academic Progression Roadmap */}
                <div className="pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center justify-between">
                    <span>Curriculum Milestones &amp; Progression:</span>
                    <span className="font-mono text-[11px] text-[#0A3A7A]">4 Structured Phases</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeTrack.milestones.map((ms, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#06284F] mb-1">
                          <span className="w-4 h-4 rounded-full bg-[#0A3A7A] text-white text-[9px] font-mono flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span>{ms.title}</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-600 leading-snug font-normal pl-6">
                          {ms.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Technologies Covered */}
                <div className="pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Technologies &amp; Tools Mastered:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTrack.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-xs font-medium shadow-2xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Ideal Candidate Profile */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 flex items-start gap-2">
                  <span className="font-bold text-[#06284F] shrink-0">Target Profile:</span>
                  <span className="leading-relaxed">{activeTrack.idealFor}</span>
                </div>

              </div>

              {/* Action Terminal */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => openModal(activeTrack.name)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#06284F] hover:bg-[#0A3A7A] text-white text-xs sm:text-sm font-extrabold transition-all shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enquire Track &amp; Schedule Visit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/919442605096?text=Hi%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(activeTrack.name)}%20curriculum%20syllabus.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Download Syllabus via WhatsApp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>

          </div>
        </div>

        {/* Global Admissions Advisor Banner */}
        <div className="mt-12 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A3A7A] shrink-0">
              <HelpCircle className="w-5 h-5 text-[#0A3A7A]" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-[#06284F]">
                Unsure which program fits your background?
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Our admissions advisors in Trichy can evaluate your academic background and recommend the ideal track.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            className="px-6 py-3 rounded-xl bg-[#FCAF0A] hover:bg-[#F5A800] text-[#06284F] text-xs font-extrabold shrink-0 transition-colors cursor-pointer shadow-xs"
          >
            Get Free Career Assessment
          </button>
        </div>

      </div>
    </section>
  );
}
