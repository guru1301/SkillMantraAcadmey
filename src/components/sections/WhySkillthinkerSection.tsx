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
  ArrowRight,
  CheckCircle2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

interface CapabilityPillar {
  id: string;
  number: string;
  tabTitle: string;
  fullTitle: string;
  icon: React.ElementType;
  description: string;
  highlights: string[];
  image: string;
  badge: string;
  ctaText: string;
  ctaHref?: string;
  isAdvisorAction?: boolean;
}

const PILLARS_DATA: CapabilityPillar[] = [
  {
    id: 'practical-training',
    number: '01',
    tabTitle: 'PRACTICAL TRAINING',
    fullTitle: 'Industry-Relevant and Practical Training',
    icon: Laptop,
    description:
      'Courses engineered around modern industry tooling, active paradigms, and practical execution. We discard outdated syllabus models in favor of live workflows and tools used by engineering teams today.',
    highlights: [
      'Modern full-stack and Python software stacks',
      'Production-grade tooling & Git version control',
      'Active lab execution and hands-on coding daily',
    ],
    image: '/images/pillars/pillar-1.jpg',
    badge: 'Live Technical Laboratory',
    ctaText: 'Explore All 10 Courses',
    ctaHref: '/#programs',
  },
  {
    id: 'expert-mentors',
    number: '02',
    tabTitle: 'EXPERT MENTORS',
    fullTitle: 'Learn Directly from Experienced Practitioners',
    icon: Users,
    description:
      'Learn directly from seasoned mentors who bring deep software and domain experience to the classroom. Our mentors provide 1-on-1 code reviews, real-time debugging guidance, and industry insights.',
    highlights: [
      '1-on-1 code reviews and direct doubt resolution',
      'Seasoned software practitioners as mentors',
      'Real workplace engineering methodologies',
    ],
    image: '/images/pillars/pillar-2.jpg',
    badge: 'Trichy Faculty Desk',
    ctaText: 'Talk to an Advisor',
    isAdvisorAction: true,
  },
  {
    id: 'hands-on-projects',
    number: '03',
    tabTitle: 'HANDS-ON PROJECTS',
    fullTitle: 'Applied Learning and Real-World Projects',
    icon: FolderGit2,
    description:
      'Apply theoretical understanding through live coding, assignments, and real-world project portfolios. Every student builds deployable applications that showcase genuine technical competency to hiring managers.',
    highlights: [
      'End-to-end full-stack application builds',
      'Personal GitHub portfolio development',
      'Real client scenarios & API integrations',
    ],
    image: '/images/pillars/pillar-3.jpg',
    badge: 'Project Lab Sessions',
    ctaText: 'Explore Course Projects',
    ctaHref: '/#programs',
  },
  {
    id: 'career-focused',
    number: '04',
    tabTitle: 'CAREER FOCUSED',
    fullTitle: 'Curriculum Engineered for Hiring Standards',
    icon: TrendingUp,
    description:
      'Curriculum specifically designed to build competencies that recruiters and technical teams actively look for. We bridge the gap between academic education and day-one workplace readiness.',
    highlights: [
      'Competency-based industry alignment',
      'Bridge between degree theory and industry work',
      'High workplace productivity readiness',
    ],
    image: '/images/pillars/pillar-4.jpg',
    badge: 'Industry Alignment Track',
    ctaText: 'Talk to an Advisor',
    isAdvisorAction: true,
  },
  {
    id: 'personalized-guidance',
    number: '05',
    tabTitle: '1-ON-1 GUIDANCE',
    fullTitle: 'Personalized Academic Guidance and Support',
    icon: Headphones,
    description:
      'We maintain structured batch sizes so every learner receives individual attention, question resolution, and constructive feedback throughout their technical development journey.',
    highlights: [
      'Individual attention and structured batch sizes',
      'Dedicated question resolution & feedback',
      'Continuous progress tracking and mentor check-ins',
    ],
    image: '/images/pillars/pillar-5.jpg',
    badge: 'Mentorship Laboratory',
    ctaText: 'Request Guidance Session',
    isAdvisorAction: true,
  },
  {
    id: 'recognized-certification',
    number: '06',
    tabTitle: 'RECOGNIZED CERTS',
    fullTitle: 'Verifiable Digital Certification of Merit',
    icon: Award,
    description:
      'Earn a recognized Bronze, Silver, or Gold digital certificate backed by an online verification ID. Each credential reflects verified project evaluations and comprehensive test performance.',
    highlights: [
      'Recognized Gold, Silver, and Bronze merit tiers',
      'Permanent digital verification endpoint',
      'Directly shareable on LinkedIn and technical resumes',
    ],
    image: '/images/pillars/pillar-6.jpg',
    badge: 'Verifiable Credential Hub',
    ctaText: 'View Certification Tiers',
    ctaHref: '/#certifications',
  },
  {
    id: 'interview-preparation',
    number: '07',
    tabTitle: 'INTERVIEW PREP',
    fullTitle: 'Placement and Comprehensive Interview Preparation',
    icon: Briefcase,
    description:
      'Dedicated placement training covering quantitative aptitude, logical reasoning, technical problem-solving, group discussions, and mock technical interviews with seasoned professionals.',
    highlights: [
      'Simulated technical mock interviews with mentors',
      'Quantitative aptitude and logical reasoning training',
      'Resume engineering and interview confidence building',
    ],
    image: '/images/pillars/pillar-7.jpg',
    badge: 'Placement Preparation Desk',
    ctaText: 'Start Placement Preparation',
    isAdvisorAction: true,
  },
];

export default function WhySkillthinkerSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const { openModal } = useAdvisorModal();

  const activePillar = PILLARS_DATA[activeIdx];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? PILLARS_DATA.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === PILLARS_DATA.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="why-skillthinker" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200">
      <div className="container-custom">
        
        {/* Section Header - ICT Academy Inspired Centered Header with Underline Bar */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-[#0A3A7A] mb-2">
            Why Skillthinker Solutions
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#06284F] tracking-tight leading-[1.12]">
            WHAT WE DO
          </h2>

          <div className="w-12 h-1 bg-[#FCAF0A] mx-auto mt-3.5 mb-4 rounded-full" />

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal max-w-2xl mx-auto">
            Curriculum engineered around practical industry outcomes, modern tooling, and genuine workplace readiness. Every learner gains real confidence through active project execution.
          </p>
        </div>

        {/* 7 Interactive Capability Tabs Strip */}
        <div className="relative mb-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
            {PILLARS_DATA.map((pillar, idx) => {
              const Icon = pillar.icon;
              const isActive = idx === activeIdx;

              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`relative flex flex-col items-center text-center p-3 sm:p-4 rounded-t-xl transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'bg-[#06284F] text-[#FCAF0A] shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#06284F]'
                  }`}
                  aria-selected={isActive}
                  role="tab"
                >
                  {/* Icon Housing */}
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center mb-2.5 transition-colors ${
                      isActive
                        ? 'bg-white/10 text-[#FCAF0A]'
                        : 'bg-white text-slate-700 shadow-2xs group-hover:text-[#0A3A7A]'
                    }`}
                  >
                    <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                  </div>

                  {/* 2-Line Tab Title */}
                  <span
                    className={`text-[11px] sm:text-xs font-extrabold tracking-tight uppercase leading-snug line-clamp-2 ${
                      isActive ? 'text-white' : 'text-slate-700 group-hover:text-[#06284F]'
                    }`}
                  >
                    {pillar.tabTitle}
                  </span>

                  {/* Active Caret Pointer pointing into the Detail Box below */}
                  {isActive && (
                    <div
                      className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[10px] border-x-transparent border-t-[10px] border-t-[#06284F] z-20"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* The Interactive Showcase Stage Box */}
        <div className="relative rounded-2xl bg-[#06284F] text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-[#0A3A7A]/40 overflow-hidden">
          
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FCAF0A]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#0A3A7A]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Inner 2-Column Split: Detailed Words + Photo */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Detailed Narrative, Highlights, and Action (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Pillar Number & Category Kicker */}
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-[#FCAF0A] text-[#041427] text-xs font-black tracking-wider uppercase">
                  Pillar {activePillar.number}
                </span>
                <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                  {activePillar.tabTitle}
                </span>
              </div>

              {/* Bold Headline */}
              <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-white tracking-tight leading-tight">
                {activePillar.fullTitle}
              </h3>

              {/* Detailed Paragraph */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                {activePillar.description}
              </p>

              {/* 3 Key Highlights Checklist */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                {activePillar.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#FCAF0A] shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons & Tab Steppers */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
                {activePillar.isAdvisorAction ? (
                  <button
                    type="button"
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FCAF0A] hover:bg-[#F5A800] text-[#041427] font-extrabold text-xs sm:text-sm transition-colors cursor-pointer shadow-md"
                  >
                    <span>{activePillar.ctaText}</span>
                    <ArrowRight className="w-4 h-4 text-[#041427]" />
                  </button>
                ) : (
                  <Link
                    href={activePillar.ctaHref || '/#programs'}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FCAF0A] hover:bg-[#F5A800] text-[#041427] font-extrabold text-xs sm:text-sm transition-colors cursor-pointer shadow-md"
                  >
                    <span>{activePillar.ctaText}</span>
                    <ArrowRight className="w-4 h-4 text-[#041427]" />
                  </Link>
                )}

                {/* Stepper Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous capability"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-300 px-1">
                    {activeIdx + 1} / {PILLARS_DATA.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next capability"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: High-Quality Photo with Badge (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[16/10] sm:aspect-[16/11] rounded-xl overflow-hidden border border-white/15 shadow-2xl group">
                <Image
                  src={activePillar.image}
                  alt={activePillar.fullTitle}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Floating Campus Facility Badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-lg border border-white/10">
                  <span className="font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FCAF0A]" />
                    <span>{activePillar.badge}</span>
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