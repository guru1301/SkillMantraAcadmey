import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Award, BookOpen, CheckCircle2, ArrowRight, ShieldCheck, Calendar } from 'lucide-react';
import FacultyDevelopmentSection from '@/components/sections/FacultyDevelopmentSection';

export const metadata: Metadata = {
  title: 'Faculty Development Programs (FDP) | Academic Empowerment',
  description:
    'Upskilling engineering and science college faculty members in emerging technologies, AI integration, cloud systems, and modern project mentorship.',
};

export default function FacultyDevelopmentPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-[#062F68] text-white py-16 lg:py-20 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2 block">
              Academic Capacity Building
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              Faculty Development for a Changing Technology Landscape
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Empowering professors, lecturers, and department heads with practical engineering toolkits, hands-on lab projects, and modern pedagogical strategies aligned with AICTE & UGC standards.
            </p>
          </div>
        </div>
      </section>

      {/* Main FDP Section */}
      <FacultyDevelopmentSection />

      {/* FDP Structure & Accreditation Section */}
      <section className="py-20 bg-white border-b border-[#E4E8EF]">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#162033]">
              Standard FDP Engagement Models
            </h2>
            <div className="gold-accent-line mx-auto my-3" />
            <p className="text-sm text-[#667085]">
              Flexible durations structured around college semester breaks, faculty vacation slots, or hybrid weekend cohorts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="academic-card p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] block mb-2">
                Format A
              </span>
              <h3 className="font-bold text-lg text-[#162033] mb-2">
                5-Day Intensive On-Campus FDP
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mb-4">
                Full-day hands-on workshop hosted at your college campus. Includes master lectures, interactive coding labs, and participant mini-projects.
              </p>
              <div className="text-xs text-slate-500 border-t border-[#E4E8EF] pt-3">
                Ideal for department-wide faculty upskilling during term breaks.
              </div>
            </div>

            <div className="academic-card p-6 border-blue-200 bg-blue-50/20">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] block mb-2">
                Format B
              </span>
              <h3 className="font-bold text-lg text-[#162033] mb-2">
                2-Week Blended FDP Series
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mb-4">
                Combines evening virtual masterclasses with weekend physical laboratory immersion, allowing professors to balance ongoing teaching responsibilities.
              </p>
              <div className="text-xs text-slate-500 border-t border-[#E4E8EF] pt-3">
                Suitable for inter-collegiate and regional faculty cohorts.
              </div>
            </div>

            <div className="academic-card p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] block mb-2">
                Format C
              </span>
              <h3 className="font-bold text-lg text-[#162033] mb-2">
                Customized Curriculum Alignment FDP
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mb-4">
                Tailored specifically to new autonomous college elective syllabi, equipping educators to teach upcoming courses with confidence.
              </p>
              <div className="text-xs text-slate-500 border-t border-[#E4E8EF] pt-3">
                Designed for Autonomous Colleges & Deemed Universities.
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/contact?intent=fdp-proposal"
              className="inline-flex items-center gap-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm"
            >
              <span>Submit FDP Proposal Request</span>
              <ArrowRight className="w-4 h-4 text-[#FCAF0A]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
