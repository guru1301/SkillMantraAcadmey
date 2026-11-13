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
    <section id="programs" className="relative py-24 lg:py-32 bg-[#041427] text-white overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#0A3A7A]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#FCAF0A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container-custom">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCAF0A]/10 border border-[#FCAF0A]/30 text-[#FCAF0A] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Curriculum</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Choose the right <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCAF0A] to-[#F5A800]">learning path.</span>
          </h2>
          <div className="h-1 w-16 bg-[#FCAF0A] mt-4 rounded-full" />
          <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-2xl font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* Category Filter Navigation Bar */}
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
                    ? 'bg-[#FCAF0A] text-[#041427] font-bold shadow-md shadow-[#FCAF0A]/20'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/10'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Desktop Split Explorer Terminal (5 cols) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left: Program Directory Selector (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden backdrop-blur-md flex flex-col">
            <div className="px-5 py-3.5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Track Directory ({filteredPrograms.length})
              </span>
              <span className="text-[11px] font-mono text-[#FCAF0A]">
                Click track to inspect
              </span>
            </div>

            <div className="divide-y divide-white/5 overflow-y-auto max-h-[580px]">
              {filteredPrograms.map((prog) => {
                const isActive = prog.id === activeId;
                return (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => setActiveId(prog.id)}
                    className={`w-full text-left p-4.5 flex items-start gap-4 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0A3A7A] to-[#06284F] border-l-4 border-[#FCAF0A] text-white'
                        : 'hover:bg-white/[0.04] text-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-[#FCAF0A] text-[#041427]' : 'bg-white/10 text-slate-400'
                    }`}>
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {prog.name}
                        </span>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive ? 'text-[#FCAF0A] translate-x-1' : 'text-white/20'
                        }`} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="truncate">{prog.category}</span>
                        <span>•</span>
                        <span className="text-[11px] text-[#FCAF0A]/80">{prog.durationEstimate}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Program Dossier (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-[#06284F]/90 to-[#0A3A7A]/80 border border-white/15 p-8 backdrop-blur-md flex flex-col justify-between shadow-2xl">
            <div>
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="px-3 py-1 rounded-full bg-[#FCAF0A]/10 border border-[#FCAF0A]/30 text-xs font-bold text-[#FCAF0A]">
                  {activeCourse.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-slate-200 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>{activeCourse.deliveryMode}</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{activeCourse.durationEstimate}</span>
                </span>
              </div>

              {/* Title & Target Outcome */}
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
                {activeCourse.name}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal mb-6">
                {activeCourse.targetOutcome}
              </p>

              {/* Ideal For Callout */}
              <div className="p-4 rounded-xl bg-black/30 border border-white/10 mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-1">
                  Ideal Candidate Profile:
                </div>
                <div className="text-xs sm:text-sm text-slate-200">
                  {activeCourse.idealFor}
                </div>
              </div>

              {/* Curriculum Highlights */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#FCAF0A]" />
                  <span>Core Syllabus &amp; Lab Milestones</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeCourse.curriculumHighlights.map((topic, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-white/[0.05] border border-white/10 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-200 font-medium leading-snug">
                        {topic}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions Terminal */}
            <div className="pt-8 mt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openModal(activeCourse.name)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FCAF0A] hover:bg-[#FDBE2E] text-[#041427] font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enquire for {activeCourse.name}</span>
                </button>

                <a
                  href={`https://wa.me/919442605096?text=Hi%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(activeCourse.name)}%20program.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold transition-all"
                >
                  <span>WhatsApp Syllabus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="text-xs text-slate-400">
                Verifiable certification upon completion
              </div>
            </div>

          </div>

        </div>

        {/* Mobile Accordion System */}
        <div className="lg:hidden space-y-3">
          {filteredPrograms.map((prog) => {
            const isOpen = prog.id === activeId;
            return (
              <div
                key={prog.id}
                className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={() => setActiveId(isOpen ? '' : prog.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-semibold text-[#FCAF0A] block mb-1">
                      {prog.category}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {prog.name}
                    </h3>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-[#FCAF0A]' : ''}`} />
                </button>

                {isOpen && (
                  <div className="p-5 pt-0 border-t border-white/10 space-y-4">
                    <p className="text-xs text-slate-300 leading-relaxed mt-4">
                      {prog.targetOutcome}
                    </p>

                    <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 text-xs text-slate-200">
                      <strong className="text-[#FCAF0A] block mb-1">Target Profile:</strong>
                      {prog.idealFor}
                    </div>

                    <div className="space-y-2">
                      {prog.curriculumHighlights.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(prog.name)}
                        className="w-full py-3 rounded-xl bg-[#FCAF0A] text-[#041427] font-bold text-xs flex items-center justify-center gap-2"
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
