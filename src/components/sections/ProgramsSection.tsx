'use client';

import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Sparkles, Clock, Laptop, ArrowRight, BookOpen } from 'lucide-react';
import { PROGRAMS_DATA } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

const CATEGORIES = [
  'All Tracks',
  'Placement & Career',
  'Core Programming',
  'Software Engineering',
  'Data & Analytics',
  'AI & Emerging',
  'Backend & Data',
  'Digital & Growth',
];

const CATEGORY_COLORS: Record<string, { badge: string; border: string }> = {
  'Placement & Career':     { badge: 'bg-amber-100 text-amber-900 border-amber-200',   border: 'hover:border-amber-300' },
  'Core Programming':       { badge: 'bg-violet-100 text-violet-900 border-violet-200', border: 'hover:border-violet-300' },
  'Software Engineering':   { badge: 'bg-blue-100 text-blue-900 border-blue-200',       border: 'hover:border-blue-300' },
  'Enterprise Engineering': { badge: 'bg-indigo-100 text-indigo-900 border-indigo-200', border: 'hover:border-indigo-300' },
  'Data & Analytics':       { badge: 'bg-teal-100 text-teal-900 border-teal-200',       border: 'hover:border-teal-300' },
  'AI & Emerging':          { badge: 'bg-orange-100 text-orange-900 border-orange-200', border: 'hover:border-orange-300' },
  'Backend & Data':         { badge: 'bg-cyan-100 text-cyan-900 border-cyan-200',       border: 'hover:border-cyan-300' },
  'Digital & Growth':       { badge: 'bg-emerald-100 text-emerald-900 border-emerald-200', border: 'hover:border-emerald-300' },
};

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();
  const [selectedCategory, setSelectedCategory] = useState('All Tracks');

  const filteredPrograms = selectedCategory === 'All Tracks'
    ? PROGRAMS_DATA
    : PROGRAMS_DATA.filter((p) => p.category === selectedCategory);

  return (
    <section id="programs" className="relative py-20 lg:py-28 bg-[#F8FAFC] border-b border-slate-200">
      <div id="courses" className="absolute -top-24 left-0 pointer-events-none" />
      <div className="container-custom">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="text-xs font-bold tracking-[0.18em] uppercase text-[#0A3A7A] mb-3">
            Academic Curriculum
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-[1.12]">
            Choose the right <span className="text-[#0A3A7A]">learning path.</span>
          </h2>
          <p className="text-slate-600 text-base mt-3 max-w-2xl font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* Category Navigation Bar (Clean Pill Switcher) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#06284F] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {cat}
                {cat === 'All Tracks' && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-100 text-[#0A3A7A] text-[10px]">
                    10
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* High-Presence Program Cards Grid — ZERO INNER SCROLLBARS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {filteredPrograms.map((prog) => {
            const catStyle = CATEGORY_COLORS[prog.category] || { badge: 'bg-slate-100 text-slate-800 border-slate-200', border: 'hover:border-blue-300' };

            return (
              <div
                key={prog.id}
                className={`rounded-2xl bg-white border border-slate-200/90 ${catStyle.border} p-7 sm:p-8 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group`}
              >
                <div>
                  {/* Card Header Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${catStyle.badge}`}>
                      {prog.category}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prog.durationEstimate}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Laptop className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prog.deliveryMode}</span>
                      </span>
                    </div>
                  </div>

                  {/* Program Title */}
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#06284F] tracking-tight mb-2.5 group-hover:text-[#0A3A7A] transition-colors">
                    {prog.name}
                  </h3>

                  {/* Target Outcome */}
                  <p className="text-sm text-slate-600 leading-relaxed font-normal mb-5">
                    {prog.targetOutcome}
                  </p>

                  {/* Ideal Candidate Profile */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-5 text-xs text-slate-700">
                    <span className="font-bold text-[#06284F] block mb-0.5">Target Audience:</span>
                    <span>{prog.idealFor}</span>
                  </div>

                  {/* Curriculum Milestones */}
                  <div className="space-y-2 mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Core Syllabus Highlights:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {prog.curriculumHighlights.map((topic, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openModal(prog.name)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06284F] hover:bg-[#0A3A7A] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Enquire for this Track</span>
                  </button>

                  <a
                    href={`https://wa.me/919442605096?text=Hi%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(prog.name)}%20program%20syllabus.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>WhatsApp Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Bottom Guidance Card */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A3A7A] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#06284F]">
                Unsure which program fits your background?
              </div>
              <div className="text-xs text-slate-500">
                Our admissions advisors in Trichy can evaluate your academic background and recommend the ideal track.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            className="px-5 py-2.5 rounded-xl bg-[#FCAF0A] hover:bg-[#F5A800] text-[#06284F] text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Get Free Career Assessment
          </button>
        </div>

      </div>
    </section>
  );
}
