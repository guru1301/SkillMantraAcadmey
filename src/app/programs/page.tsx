import React from 'react';
import type { Metadata } from 'next';
import ProgramsDiscoverySection from '@/components/sections/ProgramsDiscoverySection';
import TechnologyDomainsSection from '@/components/sections/TechnologyDomainsSection';
import Link from 'next/link';
import { ArrowRight, BookOpen, DownloadCloud } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Skill Programs Catalog | Industry-Relevant Technical Curricula',
  description:
    'Explore hands-on skill development programs across Modern Web Engineering, Data Analytics, Cloud & DevOps, Cybersecurity, UI/UX Design, and Placement Readiness.',
};

export default function ProgramsPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-[#062F68] text-white py-16 lg:py-20 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2 block">
              Curriculum Discovery
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              Programs Built Around Practical Skills
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Every course is engineered with an emphasis on code quality, active labs, and measurable competencies—customizable for college semester schedules or intensive corporate bootcamps.
            </p>
          </div>
        </div>
      </section>

      {/* Main Interactive Discovery Section */}
      <ProgramsDiscoverySection />

      {/* Technology Domains Matrix */}
      <TechnologyDomainsSection />

      {/* Custom Syllabus CTA */}
      <section className="py-16 bg-white text-center border-t border-[#E4E8EF]">
        <div className="container-custom max-w-2xl">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A3A7A] mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#162033] mb-2">
            Need a Customized Syllabus for Your Department?
          </h2>
          <p className="text-sm text-[#667085] leading-relaxed mb-6">
            We adapt program hours, lab exercises, and capstone milestones to match autonomous college credit structures and department requirements.
          </p>
          <Link
            href="/contact?intent=custom-syllabus"
            className="inline-flex items-center gap-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm"
          >
            <span>Request Custom Curriculum Mapping</span>
            <ArrowRight className="w-4 h-4 text-[#FCAF0A]" />
          </Link>
        </div>
      </section>
    </div>
  );
}
