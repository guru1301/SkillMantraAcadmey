'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, MessageCircle, BookOpen } from 'lucide-react';
import { PROGRAMS_DATA, COURSE_FEATURES_LIST, BRAND_INFO } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [activeCourseId, setActiveCourseId] = useState(PROGRAMS_DATA[2]?.id || PROGRAMS_DATA[0].id);

  const filterTabs = [
    { label: 'All 10 Programs', value: 'All' },
    { label: 'Software Engineering', value: 'Software Engineering' },
    { label: 'Core Programming', value: 'Core Programming' },
    { label: 'Data & Analytics', value: 'Data & Analytics' },
    { label: 'Placement & Career', value: 'Placement & Career' },
  ];

  const filtered =
    selectedFilter === 'All'
      ? PROGRAMS_DATA
      : PROGRAMS_DATA.filter(
          (p) =>
            p.category.includes(selectedFilter) ||
            (selectedFilter === 'Data & Analytics' && (p.category.includes('AI') || p.category.includes('Backend')))
        );

  // Ensure active course stays valid when switching filters
  const activeCourse =
    filtered.find((p) => p.id === activeCourseId) || filtered[0] || PROGRAMS_DATA[0];

  return (
    <section id="programs" className="py-16 lg:py-24 bg-white border-b border-[#E2E8F0]">
      <div className="container-custom">
        {/* Section Header */}
        <div className="max-w-3xl mb-10 lg:mb-14">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#0A3A7A] mb-2">
            Curriculum &amp; Training Tracks
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#062551] tracking-tight leading-tight">
            Choose the right learning path.
          </h2>
          <div className="w-10 h-0.5 bg-[#FCAF0A] mt-3" />
          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed font-normal">
            Whether you&apos;re starting your career, upgrading your technical depth, or pivoting into a new domain, our 10 tracks combine foundational theory with practical project execution.
          </p>

          {/* Curriculum Standard Features */}
          <div className="pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
            {COURSE_FEATURES_LIST.map((feat, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-1 h-1 rounded-full bg-[#0A3A7A]" />
                <span>{feat}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 mb-8">
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setSelectedFilter(tab.value);
                  const firstInCat =
                    tab.value === 'All'
                      ? PROGRAMS_DATA[0].id
                      : PROGRAMS_DATA.find((p) => p.category.includes(tab.value))?.id;
                  if (firstInCat) setActiveCourseId(firstInCat);
                }}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#062551] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#062551] hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Desktop Split-Detail Explorer */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Programs Index (5 cols) */}
          <div className="lg:col-span-5 border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white">
            <div className="px-4 py-2.5 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500 border-b border-slate-200">
              Select Track to Inspect Syllabus
            </div>
            <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-100">
              {filtered.map((course) => {
                const isSelected = activeCourse.id === course.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setActiveCourseId(course.id)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-l-[#0A3A7A]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        {course.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {course.durationEstimate}
                      </span>
                    </div>
                    <div className={`text-sm font-semibold ${isSelected ? 'text-[#062551]' : 'text-slate-800'}`}>
                      {course.name}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {course.shortDesc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Program Dossier / Details (7 cols) */}
          <div className="lg:col-span-7 bg-[#F8FAFC] border border-slate-200 rounded-lg p-7 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#0A3A7A] block mb-1">
                  {activeCourse.category} • {activeCourse.durationEstimate}
                </span>
                <h3 className="text-2xl font-bold text-[#062551] tracking-tight">
                  {activeCourse.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => openModal(activeCourse.name)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Inquire About This Track</span>
              </button>
            </div>

            {/* Target Outcome */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Target Professional Competency
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                {activeCourse.targetOutcome}
              </p>
            </div>

            {/* Ideal For */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-md">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#0A3A7A] block mb-0.5">
                Ideal Participant Profile:
              </span>
              <span className="text-xs text-slate-700 font-medium">
                {activeCourse.idealFor}
              </span>
            </div>

            {/* Modules List */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Course Syllabus Highlights ({activeCourse.curriculumHighlights.length} Key Modules)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {activeCourse.curriculumHighlights.map((topic, i) => (
                  <div key={i} className="flex items-start gap-2 bg-white p-2.5 rounded border border-slate-200/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium leading-snug">{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dual Inquire Strip */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Classroom (Trichy Hub) &amp; Live Interactive Batches Available</span>
              </div>
              <a
                href={`https://wa.me/919442605096?text=Hi%20Skillthinker%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(activeCourse.name)}%20program.`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:underline font-semibold"
              >
                Direct WhatsApp Enquiry →
              </a>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Accordion View */}
        <div className="lg:hidden space-y-4">
          {filtered.map((course) => {
            const isExpanded = activeCourseId === course.id;
            return (
              <div
                key={course.id}
                className="border border-slate-200 rounded-lg overflow-hidden bg-white"
              >
                <button
                  type="button"
                  onClick={() => setActiveCourseId(isExpanded ? '' : course.id)}
                  className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer bg-white hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      {course.category}
                    </span>
                    <span className="text-base font-semibold text-[#162033] block">
                      {course.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {course.shortDesc}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#0A3A7A]">
                    {isExpanded ? 'Hide' : 'View'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-[#F8FAFC] border-t border-slate-200 space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                        Target Competency:
                      </span>
                      <p className="text-slate-700">{course.targetOutcome}</p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded">
                      <span className="text-[10px] font-mono uppercase text-[#0A3A7A] block mb-0.5">
                        Ideal For:
                      </span>
                      <p className="text-slate-700 font-medium">{course.idealFor}</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                        Syllabus Highlights:
                      </span>
                      <ul className="space-y-1 text-slate-700">
                        {course.curriculumHighlights.map((topic, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(course.name)}
                        className="w-full py-2.5 px-4 bg-[#0A3A7A] text-white text-xs font-semibold rounded text-center"
                      >
                        Inquire About This Track
                      </button>
                      <a
                        href={`https://wa.me/919442605096?text=Hi%20Skillthinker%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(course.name)}%20program.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center py-2 text-emerald-700 font-semibold text-xs"
                      >
                        Chat on WhatsApp
                      </a>
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
