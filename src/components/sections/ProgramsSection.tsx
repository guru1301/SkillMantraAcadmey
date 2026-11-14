'use client';

import React, { useState } from 'react';
import { ArrowRight, Clock, Laptop, MessageCircle, HelpCircle } from 'lucide-react';
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
  levelBadge: string;
}

const PROGRAM_METAS: Record<string, ProgramMeta> = {
  'prog-aptitude': {
    logoKey: 'aptitude',
    tags: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Mock Interviews', 'GD Skills'],
    levelBadge: 'Recruitment Prep',
  },
  'prog-programming': {
    logoKey: 'cpp',
    tags: ['C', 'C++', 'C#', 'Data Structures', 'Algorithms', 'OOP'],
    levelBadge: 'Foundational',
  },
  'prog-web': {
    logoKey: 'fullstack',
    tags: ['React.js', 'JavaScript', 'HTML5 / CSS3', 'MongoDB', 'REST APIs'],
    levelBadge: 'Full Stack',
  },
  'prog-dotnet': {
    logoKey: 'dotnet',
    tags: ['C#', 'ASP.NET Core', 'MVC Architecture', 'Entity Framework', 'SQL Server'],
    levelBadge: 'Enterprise .NET',
  },
  'prog-analytics': {
    logoKey: 'analytics',
    tags: ['Power BI Desktop', 'SQL Queries', 'Python Analytics', 'Advanced Excel', 'Tableau'],
    levelBadge: 'BI & Analytics',
  },
  'prog-ai': {
    logoKey: 'ai',
    tags: ['Generative AI', 'Agentic RAG', 'Prompt Engineering', 'n8n Automation', 'AI Apps'],
    levelBadge: 'AI Specialization',
  },
  'prog-backend': {
    logoKey: 'database',
    tags: ['SQL Architecture', 'MongoDB', 'Joins & Subqueries', 'Stored Procedures', 'Indexing'],
    levelBadge: 'Backend Focus',
  },
  'prog-marketing': {
    logoKey: 'marketing',
    tags: ['Technical SEO', 'Google Tag Manager', 'Search Console', 'Conversion Analytics'],
    levelBadge: 'Growth Marketing',
  },
  'prog-java': {
    logoKey: 'java',
    tags: ['Core Java', 'Spring Boot', 'Spring Framework', 'JDBC', 'Multithreading', 'REST APIs'],
    levelBadge: 'Enterprise Java',
  },
  'prog-python': {
    logoKey: 'python',
    tags: ['Python 3', 'Async IO & Concurrency', 'OOP & Data Model', 'Metaprogramming', 'APIs'],
    levelBadge: 'Python Mastery',
  },
};

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();
  const [selectedCategory, setSelectedCategory] = useState('All Tracks');

  const filteredPrograms = selectedCategory === 'All Tracks'
    ? PROGRAMS_DATA
    : PROGRAMS_DATA.filter((p) => p.category === selectedCategory);

  return (
    <section id="programs" className="relative py-20 lg:py-28 bg-[#FAFCFF] border-b border-slate-200 select-none">
      <div id="courses" className="absolute -top-24 left-0 pointer-events-none" />
      <div className="container-custom">
        
        {/* Section Header - Clean, Authoritative Editorial Design */}
        <div className="max-w-3xl mb-10 sm:mb-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A3A7A]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#0A3A7A]">
              Academic Curriculum
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-[-0.03em] leading-[1.12]">
            Choose the right <span className="text-[#0A3A7A]">learning path.</span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-2xl font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* Category Navigation Bar (Clean Executive Switcher) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-10 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
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

        {/* High-Impact Technical Course Grid (2 Columns, Non-Draggy, Compact) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredPrograms.map((prog) => {
            const meta = PROGRAM_METAS[prog.id] || {
              logoKey: 'fundamentals',
              tags: prog.curriculumHighlights.slice(0, 5),
              levelBadge: prog.level,
            };

            return (
              <div
                key={prog.id}
                className="rounded-2xl bg-white border border-slate-200 hover:border-[#0A3A7A]/35 p-6 sm:p-7 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  
                  {/* Card Header Strip: Real Tech Logo + Category + Mode */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      {/* Authentic Tech Stack Logo */}
                      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <TechLogo name={meta.logoKey} size={28} />
                      </div>

                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0A3A7A] block">
                          {prog.category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {meta.levelBadge}
                        </span>
                      </div>
                    </div>

                    {/* Mode Tag */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <Laptop className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prog.deliveryMode.includes('Live') ? 'Instructor-Led' : 'Lab & Mentorship'}</span>
                    </div>
                  </div>

                  {/* Course Title */}
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#06284F] tracking-tight mb-2.5 group-hover:text-[#0A3A7A] transition-colors leading-snug">
                    {prog.name}
                  </h3>

                  {/* Course Value Proposition / Outcome */}
                  <p className="text-sm text-slate-600 leading-relaxed font-normal mb-5 line-clamp-2">
                    {prog.targetOutcome}
                  </p>

                  {/* Key Tech Stack Pills (Real Technologies Taught) */}
                  <div className="mb-5">
                    <div className="flex flex-wrap gap-1.5">
                      {meta.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-md bg-slate-100/80 group-hover:bg-blue-50/70 border border-slate-200/60 text-slate-700 group-hover:text-[#06284F] text-[11px] font-medium transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ideal Candidate Profile (Single Clean Line) */}
                  <div className="text-xs text-slate-500 mb-6 flex items-start gap-1.5">
                    <span className="font-bold text-slate-700 shrink-0">Ideal for:</span>
                    <span className="line-clamp-1">{prog.idealFor}</span>
                  </div>

                </div>

                {/* Card Action Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openModal(prog.name)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06284F] hover:bg-[#0A3A7A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Enquire Track</span>
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
