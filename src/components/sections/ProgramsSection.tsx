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
    <section id="programs" className="relative py-16 sm:py-20 lg:py-24 bg-[#FAFCFF] border-b border-slate-200">
      <div id="courses" className="absolute -top-24 left-0 pointer-events-none" />
      <div className="container-custom">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-10">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A3A7A]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#0A3A7A]">
              Academic Curriculum
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#06284F] tracking-[-0.03em] leading-[1.12]">
            Choose the right <span className="text-[#0A3A7A]">learning path.</span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base mt-2.5 max-w-2xl font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* Category Filter Pills (Lightweight, High-Performance) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#06284F] text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {cat}
                {cat === 'All Tracks' && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-100 text-[#0A3A7A] text-[10px] font-mono">
                    10
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* High-Performance 2-Column Catalog Grid (Buttery Smooth 60fps Scrolling) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-7">
          {filteredPrograms.map((prog) => {
            const meta = PROGRAM_METAS[prog.id] || {
              logoKey: 'fundamentals',
              tags: prog.curriculumHighlights.slice(0, 5),
              levelBadge: prog.level,
            };

            return (
              <div
                key={prog.id}
                className="rounded-xl bg-white border border-slate-200/90 hover:border-[#0A3A7A]/40 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-150 flex flex-col justify-between group"
              >
                <div>
                  
                  {/* Card Header Strip: Real High-Res Brand Icon + Track Info */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Real Authentic Tech Logo Image */}
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform duration-150">
                        <TechLogo name={meta.logoKey} size={28} />
                      </div>

                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0A3A7A] block leading-tight">
                          {prog.category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {meta.levelBadge}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Mode Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                      <Laptop className="w-3 h-3 text-slate-400" />
                      <span>{prog.deliveryMode.includes('Live') ? 'Live Live' : 'Lab & Mentors'}</span>
                    </div>
                  </div>

                  {/* Course Title */}
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#06284F] tracking-tight mb-2 group-hover:text-[#0A3A7A] transition-colors leading-snug">
                    {prog.name}
                  </h3>

                  {/* Outcome Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-4 line-clamp-2">
                    {prog.targetOutcome}
                  </p>

                  {/* Tech Stack Pills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {meta.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200/60 text-slate-700 text-[11px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ideal Candidate Profile */}
                  <div className="text-xs text-slate-500 mb-5 flex items-start gap-1.5">
                    <span className="font-bold text-slate-700 shrink-0">Ideal for:</span>
                    <span className="line-clamp-1">{prog.idealFor}</span>
                  </div>

                </div>

                {/* Card Action Footer */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openModal(prog.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#06284F] hover:bg-[#0A3A7A] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
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

        {/* Admissions Advisor Banner */}
        <div className="mt-10 p-5 sm:p-6 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A3A7A] shrink-0">
              <HelpCircle className="w-5 h-5 text-[#0A3A7A]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#06284F]">
                Unsure which program fits your background?
              </div>
              <div className="text-xs text-slate-500 font-normal mt-0.5">
                Our admissions advisors in Trichy can evaluate your academic background and recommend the ideal track.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            className="px-5 py-2.5 rounded-lg bg-[#FCAF0A] hover:bg-[#F5A800] text-[#06284F] text-xs font-extrabold shrink-0 transition-colors cursor-pointer shadow-2xs"
          >
            Get Free Career Assessment
          </button>
        </div>

      </div>
    </section>
  );
}
