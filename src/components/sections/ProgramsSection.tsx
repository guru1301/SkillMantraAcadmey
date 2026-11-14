'use client';

import React, { useState } from 'react';
import { ArrowRight, Laptop, MessageCircle, HelpCircle } from 'lucide-react';
import { PROGRAMS_DATA } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';
import TechLogo from '@/components/ui/TechLogos';

const CATEGORIES = [
  'All Tracks',
  'Software Engineering',
  'Core Programming',
  'Data & Analytics',
  'AI & Emerging',
  'Backend & Data',
  'Placement & Career',
  'Digital & Growth',
];

interface ProgramMeta {
  logoKey: string;
  tags: string[];
  trackLabel: string;
  description: string;
}

const PROGRAM_METAS: Record<string, ProgramMeta> = {
  'prog-java': {
    logoKey: 'java',
    trackLabel: 'Enterprise Java',
    description:
      'Master enterprise backend architecture with Core Java, Spring Boot, multithreading, and RESTful web services. Build scalable microservices backed by database persistence.',
    tags: ['Core Java', 'Spring Boot', 'Spring Framework', 'JDBC', 'Multithreading', 'REST APIs'],
  },
  'prog-python': {
    logoKey: 'python',
    trackLabel: 'Python Mastery',
    description:
      'From foundational scripting and data structures to advanced metaprogramming and asynchronous frameworks. Write clean, idiomatic Python for automation, backends, and data tasks.',
    tags: ['Python 3', 'Async IO & Concurrency', 'OOP & Data Model', 'Metaprogramming', 'REST APIs'],
  },
  'prog-web': {
    logoKey: 'fullstack',
    trackLabel: 'Full Stack Web',
    description:
      'Build modern responsive web applications from interface to database. Master component architectures, state management, REST APIs, and full-stack deployment.',
    tags: ['React.js', 'JavaScript (ES6+)', 'HTML5 / CSS3', 'MongoDB', 'REST APIs', 'Full Stack Build'],
  },
  'prog-dotnet': {
    logoKey: 'dotnet',
    trackLabel: 'Enterprise .NET',
    description:
      'Develop enterprise-grade web applications and APIs using the Microsoft .NET ecosystem. Learn C#, ASP.NET Core, MVC architectures, and SQL Server persistence.',
    tags: ['C#', 'ASP.NET Core', 'MVC Architecture', 'Entity Framework', 'SQL Server', 'Web APIs'],
  },
  'prog-analytics': {
    logoKey: 'analytics',
    trackLabel: 'BI & Analytics',
    description:
      'Transform complex business datasets into interactive, executive decision dashboards. Master relational queries, data pipelines, statistical modeling, and visualization.',
    tags: ['Power BI Desktop', 'SQL Queries', 'Python Analytics', 'Advanced Excel', 'DAX', 'Tableau'],
  },
  'prog-ai': {
    logoKey: 'ai',
    trackLabel: 'AI & Automation',
    description:
      'Build intelligent applications with generative models, retrieval-augmented generation (RAG), and agentic workflows. Automate complex business logic with modern AI orchestrators.',
    tags: ['Generative AI', 'Agentic RAG', 'Prompt Engineering', 'n8n Automation', 'AI Applications'],
  },
  'prog-backend': {
    logoKey: 'database',
    trackLabel: 'Backend & Data',
    description:
      'Design high-performance relational and document database architectures. Master schema normalization, indexing, query optimization, and complex transactional logic.',
    tags: ['SQL Architecture', 'MongoDB', 'Joins & Subqueries', 'Stored Procedures', 'Indexing'],
  },
  'prog-programming': {
    logoKey: 'cpp',
    trackLabel: 'Programming Fundamentals',
    description:
      'Build an unbreakable foundation in computational logic, memory models, and algorithmic thinking. Master procedural programming, pointers, and object-oriented principles.',
    tags: ['C Programming', 'C++', 'C#', 'Data Structures', 'Algorithms', 'OOP Concepts'],
  },
  'prog-aptitude': {
    logoKey: 'aptitude',
    trackLabel: 'Career & Placements',
    description:
      'Comprehensive preparation for corporate campus recruitment drives and technical interviews. Master quantitative reasoning, logical deduction, verbal ability, and mock interviews.',
    tags: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Mock Interviews', 'GD Preparation'],
  },
  'prog-marketing': {
    logoKey: 'marketing',
    trackLabel: 'Growth Marketing',
    description:
      'Execute high-impact organic search optimization, tag management, and conversion analytics. Drive sustainable qualified user acquisition across modern digital channels.',
    tags: ['Technical SEO', 'Google Tag Manager', 'Search Console', 'Conversion Analytics', 'Organic Growth'],
  },
};

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();
  const [selectedCategory, setSelectedCategory] = useState('All Tracks');

  const filteredPrograms = selectedCategory === 'All Tracks'
    ? PROGRAMS_DATA
    : PROGRAMS_DATA.filter((p) => p.category === selectedCategory);

  return (
    <section id="programs" className="relative py-20 lg:py-28 bg-[#FAFCFF] border-b border-slate-200">
      <div id="courses" className="absolute -top-24 left-0 pointer-events-none" />
      <div className="container-custom">
        
        {/* Section Header: Prestigious Editorial Typography */}
        <div className="max-w-3xl mb-12 sm:mb-14">
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

        {/* Category Navigation Bar (Senior Executive Tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-12 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#06284F] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                }`}
              >
                {cat}
                {cat === 'All Tracks' && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-100/80 text-[#0A3A7A] text-[10px] font-mono">
                    10
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Executive 2-Column Catalog Grid (Harmonic Typography, Zero Clutter) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredPrograms.map((prog) => {
            const meta = PROGRAM_METAS[prog.id] || {
              logoKey: 'fundamentals',
              trackLabel: prog.category,
              description: prog.targetOutcome,
              tags: prog.curriculumHighlights.slice(0, 5),
            };

            return (
              <div
                key={prog.id}
                className="rounded-2xl bg-white border border-slate-200/90 hover:border-[#0A3A7A]/35 p-7 sm:p-8 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  
                  {/* Top Row: Authentic Brand Icon + Badges */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform duration-200">
                      <TechLogo name={meta.logoKey} size={32} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className="text-xs font-semibold text-[#0A3A7A] bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-100/60">
                        {meta.trackLabel}
                      </span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                        {prog.deliveryMode.includes('Live') ? 'Instructor-Led Live' : 'Lab & Mentorship'}
                      </span>
                    </div>
                  </div>

                  {/* Course Title: Confident, Authoritative Headline */}
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#0A3A7A] transition-colors tracking-tight mb-3">
                    {prog.name}
                  </h3>

                  {/* Course Narrative: Clear, High-Legibility Outcome */}
                  <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                    {meta.description}
                  </p>

                  {/* Tech Stack Strip: Clean, Harmonious Badges */}
                  <div className="pt-4 border-t border-slate-100 mb-6">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Technologies &amp; Tools Covered:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {meta.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-white text-slate-700 text-xs font-medium border border-slate-200/80 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card Action Footer: Clean, Balanced Primary & WhatsApp Links */}
                <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => openModal(prog.name)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06284F] hover:bg-[#0A3A7A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <span>Enquire Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`https://wa.me/919442605096?text=Hi%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(prog.name)}%20curriculum%20syllabus.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    <span>WhatsApp Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

              </div>
            );
          })}
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
