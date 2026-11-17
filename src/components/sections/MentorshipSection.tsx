'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  BookOpen,
  Layers,
  Laptop,
  Folder,
  Users,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react';

const BENEFITS_ROW_1 = [
  {
    title: 'Clear and structured explanations',
    icon: BookOpen,
  },
  {
    title: 'Practical examples',
    icon: Layers,
  },
  {
    title: 'Hands-on guidance',
    icon: Laptop,
  },
  {
    title: 'Project support',
    icon: Folder,
  },
];

const BENEFITS_ROW_2 = [
  {
    title: 'Individual attention',
    icon: Users,
  },
  {
    title: 'Career-oriented mentoring',
    icon: TrendingUp,
  },
  {
    title: 'Encouragement to learn and improve',
    icon: Target,
  },
];

export default function MentorshipSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="trainers"
      ref={sectionRef}
      aria-labelledby="trainers-heading"
      className="py-14 sm:py-16 lg:py-20 bg-white border-b border-slate-200 scroll-mt-20 select-none overflow-hidden"
    >
      <div id="mentors" className="sr-only" />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 xl:gap-14">
          
          {/* ── LEFT COLUMN: Text, Benefits & Actions (~56% width on lg) ── */}
          <div
            className={`w-full lg:w-[56%] xl:w-[57%] flex flex-col justify-center transition-all duration-500 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            } motion-reduce:opacity-100 motion-reduce:translate-y-0`}
          >
            {/* Section Overline Label */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="w-5 h-0.5 rounded-full bg-[#1548AE]" />
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[#06284F]">
                OUR TRAINERS
              </span>
            </div>

            {/* Headline */}
            <h2
              id="trainers-heading"
              className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[46px] font-black tracking-tight leading-[1.14] text-[#06284F] mb-4"
            >
              Learn from people who{' '}
              <span className="text-[#1548AE]">guide your growth.</span>
            </h2>

            {/* Description Paragraph */}
            <p className="text-slate-600 text-sm sm:text-[15px] font-normal leading-relaxed mb-7 max-w-xl">
              A great learning experience starts with the right guidance. At Skillthinker Solutions,
              our trainers and mentors are committed to making learning practical, understandable,
              and engaging. They bring knowledge, experience, and a learner-focused approach to the
              classroom — encouraging questions, practical application, problem-solving, and
              continuous improvement.
            </p>

            {/* Benefits Subheading */}
            <h3 className="text-base sm:text-lg font-bold text-[#06284F] tracking-tight mb-4">
              What You Can Expect From Our Trainers
            </h3>

            {/* Benefits Grid (Matching Reference: 4 in Row 1, 3 in Row 2) */}
            <div className="space-y-3.5 sm:space-y-4 mb-8">
              {/* Row 1: 4 Benefits */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-3 lg:gap-3.5">
                {BENEFITS_ROW_1.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#F0F5FE] text-[#1548AE] flex items-center justify-center shrink-0 border border-blue-100/60 shadow-2xs">
                        <Icon className="w-5 h-5 stroke-[1.75]" />
                      </div>
                      <span className="text-xs sm:text-[13px] font-bold text-[#06284F] leading-tight">
                        {item.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Row 2: 3 Benefits */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-4 max-w-[95%]">
                {BENEFITS_ROW_2.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#F0F5FE] text-[#1548AE] flex items-center justify-center shrink-0 border border-blue-100/60 shadow-2xs">
                        <Icon className="w-5 h-5 stroke-[1.75]" />
                      </div>
                      <span className="text-xs sm:text-[13px] font-bold text-[#06284F] leading-tight">
                        {item.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <a
                href="#courses"
                className="h-12 px-6 rounded-xl bg-[#0A3A7A] hover:bg-[#06284F] text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors duration-200 shadow-2xs active:translate-y-0"
              >
                <span>Explore Programs &amp; Tracks</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </a>

              <a
                href="#contact"
                className="h-12 px-6 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-[#06284F] font-bold text-xs sm:text-sm inline-flex items-center justify-center transition-colors duration-200 shadow-2xs"
              >
                <span>Talk to an Advisor</span>
              </a>
            </div>

          </div>

          {/* ── RIGHT COLUMN: Trainer Photograph in Geometric Architectural Frame (~44% width on lg) ── */}
          <div
            className={`w-full lg:w-[44%] xl:w-[43%] flex items-center justify-center lg:justify-end transition-opacity duration-600 ease-out ${
              isVisible ? 'opacity-100' : 'opacity-0'
            } motion-reduce:opacity-100`}
          >
            <div className="relative w-full max-w-[460px] sm:max-w-[480px] lg:max-w-[500px] xl:max-w-[520px]">
              
              {/* Subtle Pale-Blue Background Geometry Behind the Image */}
              <div
                className="absolute -top-3.5 -left-3.5 sm:-top-4 sm:-left-4 w-full h-full bg-[#EBF2FE] -z-10 transition-transform duration-500"
                style={{
                  clipPath:
                    'polygon(28% 0%, 96% 0%, 100% 4%, 100% 96%, 96% 100%, 4% 100%, 0% 96%, 0% 28%)',
                }}
              />

              {/* Bottom-Right Pale-Blue Geometric Tab Accent */}
              <div
                className="absolute -bottom-3 -right-3 sm:-bottom-3.5 sm:-right-3.5 w-24 h-24 bg-[#E0EDFE] -z-20 rounded-2xl"
                aria-hidden="true"
              />

              {/* Geometric Image Container with Diagonal Top-Left Architectural Cut */}
              <div
                className="relative w-full aspect-[4/3] sm:aspect-[1/1] lg:aspect-auto lg:h-[450px] xl:h-[480px] overflow-hidden bg-slate-100 shadow-sm border border-blue-50/50"
                style={{
                  clipPath:
                    'polygon(28% 0%, 96% 0%, 100% 4%, 100% 96%, 96% 100%, 4% 100%, 0% 96%, 0% 28%)',
                }}
              >
                <Image
                  src="/images/founder-trainer.jpg"
                  alt="Skillthinker Solutions experienced faculty and technical mentors"
                  fill
                  priority={false}
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover object-top"
                />
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
