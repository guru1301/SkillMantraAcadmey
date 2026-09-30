import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, TrendingUp, Users, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import CorporateTrainingSection from '@/components/sections/CorporateTrainingSection';
import ContactSection from '@/components/sections/ContactSection';

export const metadata: Metadata = {
  title: 'Corporate Training & Upskilling | B2B Technology Programs',
  description:
    'Customized corporate upskilling programs, new hire developer onboarding bootcamps, and digital transformation workshops for tech companies and enterprise teams.',
};

export default function ForCorporatesPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-[#062F68] text-white py-16 lg:py-20 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2 block">
              Enterprise Learning Solutions
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              Upskilling Teams for a Changing Workplace
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Tailored technology training programs designed for corporate development teams, IT services organizations, and L&D managers seeking measurable performance outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* Corporate Tracks Section */}
      <CorporateTrainingSection />

      {/* Enterprise Benefits */}
      <section className="py-20 bg-white border-b border-[#E4E8EF]">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#162033]">
              Why Corporate L&D Teams Choose Skill Mantra Academy
            </h2>
            <div className="gold-accent-line mx-auto my-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="academic-card p-6">
              <h3 className="font-bold text-base text-[#162033] mb-2">
                Tech Stack Customization
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                We design curricula around your exact architectural stack, frameworks, code linting standards, and internal toolchains.
              </p>
            </div>

            <div className="academic-card p-6">
              <h3 className="font-bold text-base text-[#162033] mb-2">
                Pre & Post Diagnostic Audits
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                Objective benchmark assessments before training begins, followed by comprehensive post-training capability reports.
              </p>
            </div>

            <div className="academic-card p-6">
              <h3 className="font-bold text-base text-[#162033] mb-2">
                Accelerated Billability
              </h3>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                Our intensive graduate onboarding bootcamps compress time-to-billability from typical 6 months down to 4–6 weeks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />
    </div>
  );
}
