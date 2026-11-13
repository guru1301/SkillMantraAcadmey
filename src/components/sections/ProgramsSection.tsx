'use client';

import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, ChevronRight, Sparkles, BookOpen, Clock, Laptop, ArrowRight } from 'lucide-react';
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

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();
  const [selectedCategory, setSelectedCategory] = useState('All Tracks');
  const [activeId, setActiveId] = useState(PROGRAMS_DATA[0].id);

  const filteredPrograms = selectedCategory === 'All Tracks'
    ? PROGRAMS_DATA
    : PROGRAMS_DATA.filter((p) => p.category === selectedCategory);

  const activeCourse = PROGRAMS_DATA.find((p) => p.id === activeId) || filteredPrograms[0] || PROGRAMS_DATA[0];

  return (
    <section id="programs" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-slate-200">
      <div className="container-custom">
        
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0A3A7A] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
            <span>Academic Curriculum</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#06284F] tracking-tight leading-tight">
            Choose the right <span className="text-[#0A3A7A]">learning path.</span>
          </h2>
          <div className="w-12 h-1 bg-[#FCAF0A] mt-4 rounded-full" />
          <p className="text-slate-600 text-base mt-4 max-w-2xl font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  const firstInCat = cat === 'All Tracks' 
                    ? PROGRAMS_DATA[0] 
                    : PROGRAMS_DATA.find((p) => p.category === cat);
                  if (firstInCat) setActiveId(firstInCat.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0A3A7A] text-white shadow-xs font-bold'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Desktop Split Explorer Terminal (12 cols) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left: Program Directory Selector (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Track Directory ({filteredPrograms.length})
              </span>
              <span className="text-[11px] font-medium text-[#0A3A7A]">
                Select track to view details
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[580px]">
              {filteredPrograms.map((prog) => {
                const isActive = prog.id === activeId;
                return (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => setActiveId(prog.id)}
                    className={`w-full text-left p-4.5 flex items-start gap-4 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/80 border-l-4 border-[#0A3A7A] text-[#06284F]'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-[#0A3A7A] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-sm font-bold truncate ${isActive ? 'text-[#06284F]' : 'text-slate-900'}`}>
                          {prog.name}
                        </span>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive ? 'text-[#0A3A7A] translate-x-1' : 'text-slate-300'
                        }`} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="truncate">{prog.category}</span>
                        <span>•</span>
                        <span className="text-[11px] font-medium text-[#0A3A7A]">{prog.durationEstimate}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Program Dossier (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-8 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#0A3A7A]">
                  {activeCourse.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-600 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-500" />
                  <span>{activeCourse.deliveryMode}</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{activeCourse.durationEstimate}</span>
                </span>
              </div>

              {/* Title & Target Outcome */}
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#06284F] tracking-tight mb-3">
                {activeCourse.name}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mb-6">
                {activeCourse.targetOutcome}
              </p>

              {/* Ideal For Callout */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] mb-1">
                  Ideal Candidate Profile:
                </div>
                <div className="text-xs sm:text-sm text-slate-700">
                  {activeCourse.idealFor}
                </div>
              </div>

              {/* Curriculum Highlights */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
                  <span>Core Syllabus &amp; Lab Milestones</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeCourse.curriculumHighlights.map((topic, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-800 font-medium leading-snug">
                        {topic}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions Terminal */}
            <div className="pt-8 mt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openModal(activeCourse.name)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A3A7A] hover:bg-[#06284F] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enquire for {activeCourse.name}</span>
                </button>

                <a
                  href={`https://wa.me/919442605096?text=Hi%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(activeCourse.name)}%20program.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all"
                >
                  <span>WhatsApp Syllabus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="text-xs text-slate-500">
                Verifiable certification upon completion
              </div>
            </div>

          </div>

        </div>

        {/* Mobile Accordion */}
        <div className="lg:hidden space-y-3">
          {filteredPrograms.map((prog) => {
            const isOpen = prog.id === activeId;
            return (
              <div
                key={prog.id}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setActiveId(isOpen ? '' : prog.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-semibold text-[#0A3A7A] block mb-1">
                      {prog.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {prog.name}
                    </h3>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-[#0A3A7A]' : ''}`} />
                </button>

                {isOpen && (
                  <div className="p-5 pt-0 border-t border-slate-100 space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed mt-4">
                      {prog.targetOutcome}
                    </p>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <strong className="text-[#0A3A7A] block mb-1">Target Profile:</strong>
                      {prog.idealFor}
                    </div>

                    <div className="space-y-2">
                      {prog.curriculumHighlights.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(prog.name)}
                        className="w-full py-3 rounded-xl bg-[#0A3A7A] text-white font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Enquire About This Track</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
