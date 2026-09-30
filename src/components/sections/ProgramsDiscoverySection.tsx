'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Users, ArrowRight, X, CheckCircle2, Laptop } from 'lucide-react';
import { PROGRAMS_DATA, Program } from '@/data/siteData';

const CATEGORIES = [
  'All Programs',
  'Technology',
  'Data & AI',
  'Cloud & DevOps',
  'Cybersecurity',
  'Design & Digital',
  'Professional Skills',
] as const;

export default function ProgramsDiscoverySection() {
  const [activeCategory, setActiveCategory] = useState<string>('All Programs');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const filteredPrograms = activeCategory === 'All Programs'
    ? PROGRAMS_DATA
    : PROGRAMS_DATA.filter((p) => p.category === activeCategory);

  return (
    <section id="programs" className="py-20 bg-[#F7F9FC] border-b border-[#E4E8EF]">
      <div className="container-custom">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Domain-Aligned Catalog
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Programs Built Around Practical Skills
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            Practical curricula designed with industry engineering practices. Structured for college workshops, semester modules, and professional upskilling.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#0A3A7A] text-white shadow-sm'
                  : 'bg-white text-[#162033] border border-[#E4E8EF] hover:border-[#CBD5E1] hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div
              key={program.id}
              className="academic-card p-6 flex flex-col justify-between bg-white group hover:shadow-md"
            >
              <div>
                {/* Meta Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-50 text-[#0A3A7A] border border-blue-100">
                    {program.category}
                  </span>
                  <span className="text-xs text-[#667085] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#0A3A7A]" />
                    <span>{program.duration}</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#162033] mb-2 group-hover:text-[#0A3A7A] transition-colors line-clamp-1">
                  {program.name}
                </h3>

                <p className="text-xs sm:text-sm text-[#667085] line-clamp-3 mb-4 leading-relaxed">
                  {program.description}
                </p>

                {/* Details Breakdown */}
                <div className="space-y-2 border-t border-[#E4E8EF] pt-3 text-xs text-[#162033]">
                  <div className="flex items-start gap-2">
                    <Users className="w-3.5 h-3.5 text-[#667085] shrink-0 mt-0.5" />
                    <span className="line-clamp-1 text-slate-600">
                      <strong className="font-semibold text-slate-800">Target:</strong> {program.audience}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Laptop className="w-3.5 h-3.5 text-[#667085] shrink-0 mt-0.5" />
                    <span className="text-slate-600">
                      <strong className="font-semibold text-slate-800">Mode:</strong> {program.deliveryMode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-6 border-t border-[#E4E8EF] mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedProgram(program)}
                  className="text-xs sm:text-sm font-semibold text-[#0A3A7A] hover:text-[#062F68] inline-flex items-center gap-1.5 cursor-pointer group-hover:underline"
                >
                  <span>View Syllabus & Outcomes</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FCAF0A]" />
                </button>
                <span className="w-2 h-2 rounded-full bg-[#FCAF0A] opacity-70" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Catalog Action Note */}
        <div className="mt-14 p-6 rounded-xl bg-white border border-[#E4E8EF] text-center max-w-2xl mx-auto shadow-xs">
          <p className="text-sm text-[#667085]">
            Looking for a customized syllabus or semester track tailored to your university curriculum?
          </p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <Link
              href="/contact?intent=custom-curriculum"
              className="text-xs sm:text-sm font-bold text-[#0A3A7A] hover:text-[#062F68] underline inline-flex items-center gap-1"
            >
              Request Custom Institutional Syllabus
              <ArrowRight className="w-3.5 h-3.5 text-[#FCAF0A]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E4E8EF] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E4E8EF] flex items-start justify-between bg-[#F7F9FC]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] px-2.5 py-1 rounded bg-blue-100/60 inline-block mb-2">
                  {selectedProgram.category}
                </span>
                <h3 className="text-xl font-bold text-[#162033]">
                  {selectedProgram.name}
                </h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#667085]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#0A3A7A]" />
                    {selectedProgram.duration}
                  </span>
                  <span>•</span>
                  <span>{selectedProgram.deliveryMode}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProgram(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-sm">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-1">
                  Program Overview
                </h4>
                <p className="text-[#162033] leading-relaxed">
                  {selectedProgram.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#FCAF0A]" />
                  Curriculum Highlights & Labs
                </h4>
                <ul className="space-y-2">
                  {selectedProgram.curriculumHighlights.map((topic, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[#162033]">
                      <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0 mt-0.5" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F7F9FC] p-4 rounded-lg border border-[#E4E8EF]">
                <div>
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Prerequisites
                  </h5>
                  <p className="text-xs text-[#162033]">
                    {selectedProgram.prerequisites}
                  </p>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Target Capability Outcome
                  </h5>
                  <p className="text-xs text-[#162033]">
                    {selectedProgram.targetOutcome}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#E4E8EF] bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#667085]">
                Customizable for institutional batches & corporate teams.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedProgram(null)}
                  className="w-full sm:w-auto px-4 py-2 border border-[#E4E8EF] text-xs font-medium text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href={`/contact?program=${encodeURIComponent(selectedProgram.name)}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white text-xs font-semibold rounded-md shadow-sm"
                >
                  <span>Enquire For Batch</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FCAF0A]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
