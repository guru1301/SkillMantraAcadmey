import React from 'react';
import type { Metadata } from 'next';
import EventsSection from '@/components/sections/EventsSection';
import Link from 'next/link';
import { Calendar, ArrowRight, Building } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workshops & Events | Academic Initiatives & FDPs',
  description:
    'Upcoming technical workshops, faculty development cohorts, and campus technology symposiums conducted by Skill Mantra Academy.',
};

export default function EventsPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-[#062F68] text-white py-16 lg:py-20 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2 block">
              Academic Calendar
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              Workshops, FDPs & Academic Initiatives
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore upcoming faculty empowerment cohorts and institutional student immersion camps. Contact us to schedule a workshop on your campus.
            </p>
          </div>
        </div>
      </section>

      {/* Main Events Grid */}
      <EventsSection />

      {/* Host an Event CTA */}
      <section className="py-16 bg-[#F7F9FC] border-t border-[#E4E8EF] text-center">
        <div className="container-custom max-w-2xl">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A3A7A] mx-auto mb-4">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#162033] mb-2">
            Host a Technical Workshop at Your Campus
          </h2>
          <p className="text-sm text-[#667085] leading-relaxed mb-6">
            We provide verified resource persons, lab project files, software setup checklists, and participation certificates for college-hosted events.
          </p>
          <Link
            href="/contact?intent=host-workshop"
            className="inline-flex items-center gap-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm"
          >
            <span>Discuss Campus Hosting</span>
            <ArrowRight className="w-4 h-4 text-[#FCAF0A]" />
          </Link>
        </div>
      </section>
    </div>
  );
}
