'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Laptop,
  Users,
  FolderGit2,
  TrendingUp,
  Headphones,
  Award,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

interface CapabilityPillar {
  id: string;
  number: string;
  tabTitle: string;
  headline: string;
  icon: React.ElementType;
  description: string;
  image: string;
  badge: string;
  ctaText: string;
  ctaHref?: string;
  isAdvisorAction?: boolean;
}

const PILLARS: CapabilityPillar[] = [
  {
    id: 'practical-training',
    number: '01',
    tabTitle: 'PRACTICAL TRAINING',
    headline: 'INDUSTRY-RELEVANT & PRACTICAL TRAINING',
    icon: Laptop,
    description:
      'Courses engineered around modern industry tooling, active paradigms, and practical execution. We discard outdated syllabus models in favor of live workflows and production tools used by modern engineering teams today.',
    image: '/images/pillars/pillar-1.jpg',
    badge: 'Live Technical Laboratory',
    ctaText: 'EXPLORE COURSES',
    ctaHref: '/#programs',
  },
  {
    id: 'expert-mentors',
    number: '02',
    tabTitle: 'EXPERT MENTORS',
    headline: 'EXPERIENCED PRACTITIONERS & MENTORS',
    icon: Users,
    description:
      'Learn directly from seasoned mentors who bring deep software and domain experience to the classroom. Our trainers act as active mentors, offering 1-on-1 code reviews, real-time debugging guidance, and industry-tested architecture practices.',
    image: '/images/pillars/pillar-2.jpg',
    badge: 'Trichy Faculty Desk',
    ctaText: 'TALK TO AN ADVISOR',
    isAdvisorAction: true,
  },
  {
    id: 'hands-on-projects',
    number: '03',
    tabTitle: 'HANDS-ON PROJECTS',
    headline: 'REAL-WORLD LEARNING & PORTFOLIO PROJECTS',
    icon: FolderGit2,
    description:
      'Apply theoretical understanding through live coding, assignments, and real-world project portfolios. Every student builds complete production-grade applications that can be demonstrated directly to technical recruiters.',
    image: '/images/pillars/pillar-3.jpg',
    badge: 'Project Lab Sessions',
    ctaText: 'EXPLORE PROJECTS',
    ctaHref: '/#programs',
  },
  {
    id: 'career-focused',
    number: '04',
    tabTitle: 'CAREER FOCUSED',
    headline: 'CAREER-FOCUSED SKILL DEVELOPMENT',
    icon: TrendingUp,
    description:
      'Curriculum specifically designed to build competencies that recruiters and technical teams actively look for. We bridge the gap between academic education and day-one workplace readiness with measurable proficiency.',
    image: '/images/pillars/pillar-4.jpg',
    badge: 'Industry Alignment Track',
    ctaText: 'TALK TO AN ADVISOR',
    isAdvisorAction: true,
  },
  {
    id: 'personalized-guidance',
    number: '05',
    tabTitle: '1-ON-1 GUIDANCE',
    headline: 'PERSONALIZED GUIDANCE & DOUBT RESOLUTION',
    icon: Headphones,
    description:
      'We maintain structured batch sizes so every learner receives individual attention, question resolution, and constructive feedback throughout their technical development journey with continuous mentor check-ins.',
    image: '/images/pillars/pillar-5.jpg',
    badge: 'Mentorship Laboratory',
    ctaText: 'REQUEST COUNSELING',
    isAdvisorAction: true,
  },
  {
    id: 'recognized-certification',
    number: '06',
    tabTitle: 'RECOGNIZED CERTS',
    headline: 'VERIFIABLE DIGITAL CERTIFICATION OF MERIT',
    icon: Award,
    description:
      'Earn a recognized Bronze, Silver, or Gold digital certificate backed by an online verification ID. Each credential reflects verified project evaluations and comprehensive test performance, easily shareable on LinkedIn.',
    image: '/images/pillars/pillar-6.jpg',
    badge: 'Verifiable Credential Hub',
    ctaText: 'VIEW CERTIFICATIONS',
    ctaHref: '/#certifications',
  },
  {
    id: 'interview-preparation',
    number: '07',
    tabTitle: 'INTERVIEW PREP',
    headline: 'PLACEMENT & COMPREHENSIVE INTERVIEW PREPARATION',
    icon: Briefcase,
    description:
      'Dedicated placement readiness covering quantitative aptitude, logical reasoning, technical problem-solving, group discussions, and mock technical interviews with seasoned industry professionals.',
    image: '/images/pillars/pillar-7.jpg',
    badge: 'Placement Preparation Desk',
    ctaText: 'START PLACEMENT PREP',
    isAdvisorAction: true,
  },
];

export default function WhySkillthinkerSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const { openModal } = useAdvisorModal();

  const active = PILLARS[activeIdx];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? PILLARS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === PILLARS.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="why-skillthinker" className="w-full bg-white select-none">
      
      {/* ── TOP SECTION: Crisp Centered Header & Minimalist Icon Tabs ── */}
      <div className="pt-16 sm:pt-20 pb-8 sm:pb-12 border-t border-slate-200">
        <div className="container-custom">
          
          {/* Section Heading - Exact Corporate Aesthetic from Reference */}
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#06284F] tracking-tight uppercase">
              WHAT WE DO
            </h2>
            <div className="w-12 h-1 bg-[#FCAF0A] mx-auto mt-2.5 rounded-full" />
          </div>

          {/* Horizontal Icon Tabs (7 Columns) */}
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="grid grid-cols-7 min-w-[680px] lg:min-w-0 gap-2 sm:gap-4">
              {PILLARS.map((item, idx) => {
                const Icon = item.icon;
                const isActive = idx === activeIdx;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className="group relative flex flex-col items-center justify-start text-center pb-3 pt-2 px-1 transition-all duration-200 cursor-pointer focus:outline-none"
                    aria-selected={isActive}
                    role="tab"
                  >
                    {/* Clean Outline Icon (No Box/Circle Background) */}
                    <div className="mb-3 transition-transform duration-200 group-hover:-translate-y-1">
                      <Icon
                        strokeWidth={1.6}
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors duration-200 ${
                          isActive
                            ? 'text-[#FCAF0A]'
                            : 'text-slate-500 group-hover:text-[#06284F]'
                        }`}
                      />
                    </div>

                    {/* 2-Line Uppercase Condensed Title */}
                    <span
                      className={`text-[11px] sm:text-xs font-bold uppercase tracking-tight leading-tight line-clamp-2 transition-colors duration-200 ${
                        isActive
                          ? 'text-[#FCAF0A] font-extrabold'
                          : 'text-slate-600 group-hover:text-[#06284F]'
                      }`}
                    >
                      {item.tabTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM SECTION: Full-Width Executive Dark Showcase Band ── */}
      <div className="relative w-full bg-[#182332] text-white py-12 sm:py-16 lg:py-20 shadow-2xl">
        
        {/* Dynamic Connected Triangle Notch - Points Up Directly Under Active Tab */}
        <div className="container-custom relative">
          <div className="hidden lg:block absolute -top-[12px] left-0 right-0 pointer-events-none z-10">
            <div className="grid grid-cols-7">
              {PILLARS.map((_, idx) => (
                <div key={idx} className="flex justify-center">
                  {idx === activeIdx && (
                    <div
                      className="w-0 h-0 border-x-[12px] border-x-transparent border-b-[12px] border-b-[#182332]"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Showcase Content Container (50/50 Split: Narrative & Photo) */}
        <div className="container-custom">
          <div
            key={active.id}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center animate-in fade-in duration-300"
          >
            
            {/* Left Column: Headline, Narrative & Orange Button (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <h3 className="text-xl sm:text-2xl lg:text-[28px] font-extrabold text-white tracking-tight leading-snug uppercase">
                {active.headline}
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal max-w-2xl">
                {active.description}
              </p>

              {/* Action Button & Steppers */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
                {active.isAdvisorAction ? (
                  <button
                    type="button"
                    onClick={() => openModal()}
                    className="px-7 py-3 bg-[#FCAF0A] hover:bg-[#F5A800] text-[#041427] font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-colors shadow-md cursor-pointer rounded-sm"
                  >
                    {active.ctaText}
                  </button>
                ) : (
                  <Link
                    href={active.ctaHref || '/#programs'}
                    className="inline-block px-7 py-3 bg-[#FCAF0A] hover:bg-[#F5A800] text-[#041427] font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-colors shadow-md cursor-pointer rounded-sm"
                  >
                    {active.ctaText}
                  </Link>
                )}

                {/* Steppers */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous capability"
                    className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer rounded-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-400 px-1">
                    {activeIdx + 1} / {PILLARS.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next capability"
                    className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer rounded-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Framed Photograph (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-white/10 shadow-2xl group">
                <Image
                  src={active.image}
                  alt={active.headline}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Campus Facility Anchor Badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white bg-black/60 backdrop-blur-md px-3.5 py-2 rounded border border-white/10">
                  <span className="font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FCAF0A]" />
                    <span>{active.badge}</span>
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    Anna Nagar, Trichy
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
}
