import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, School, Award, CheckCircle2, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import InstitutionalSection from '@/components/sections/InstitutionalSection';
import PartnersSection from '@/components/sections/PartnersSection';

export const metadata: Metadata = {
  title: 'For Educational Institutions | College Training, FDPs & MoUs',
  description:
    'Skill Mantra Academy partners with engineering colleges, universities, and arts & science institutions to deliver technical workshops, faculty development, and placement bootcamps.',
};

export default function ForInstitutionsPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-[#062F68] text-white py-16 lg:py-20 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2 block">
              Priority Academic Engagement
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              Institutional Training & College Partnerships
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Designed specifically for College Principals, Deans, Heads of Department, and Training & Placement Directors seeking credible, industry-aligned skill immersion for their campus.
            </p>
          </div>
        </div>
      </section>

      {/* Main Institutional Framework Section */}
      <InstitutionalSection />

      {/* College MoU & Center of Excellence Deep Dive */}
      <section className="py-20 bg-[#F7F9FC] border-b border-[#E4E8EF]">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] block">
                Institutional Partnership Framework
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#162033] tracking-tight">
                Academic Memorandum of Understanding (MoU)
              </h2>
              <div className="gold-accent-line" />
              <p className="text-sm text-[#667085] leading-relaxed">
                An institutional MoU with Skill Mantra Academy provides your campus with a structured roadmap for multi-semester skill enhancement. We work with your academic calendar to schedule semester-aligned tracks without disrupting university examination schedules.
              </p>

              <div className="space-y-3 pt-2 text-sm text-[#162033]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0 mt-0.5" />
                  <span>Curriculum alignment with department syllabus & lab infrastructure</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0 mt-0.5" />
                  <span>Regular Faculty Development Program (FDP) access for teaching staff</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0 mt-0.5" />
                  <span>Objective student outcome reporting for NAAC & NBA accreditation files</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0 mt-0.5" />
                  <span>Pre-placement technical bootcamps prior to campus recruitment drives</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/contact?intent=mou-partnership"
                  className="inline-flex items-center gap-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm"
                >
                  <FileText className="w-4 h-4 text-[#FCAF0A]" />
                  <span>Request Institutional MoU Draft & Scope</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white border border-[#E4E8EF] rounded-2xl p-8 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-[#162033] border-b border-[#E4E8EF] pb-3">
                  Campus Engagement Checklist
                </h3>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-lg bg-[#F7F9FC] border border-[#E4E8EF]">
                    <div className="font-bold text-[#062F68] mb-1">
                      1. Discovery & Needs Assessment
                    </div>
                    <p className="text-slate-600">
                      Consultation with Principal, HODs, and Placement Officer on student baseline and goals.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F7F9FC] border border-[#E4E8EF]">
                    <div className="font-bold text-[#062F68] mb-1">
                      2. Lab & Hardware Verification
                    </div>
                    <p className="text-slate-600">
                      Audit of campus computing labs, internet bandwidth, and compiler/toolkit readiness.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F7F9FC] border border-[#E4E8EF]">
                    <div className="font-bold text-[#062F68] mb-1">
                      3. Milestone-Based Execution
                    </div>
                    <p className="text-slate-600">
                      Instructor-led coding sprints, capstone mini-projects, and continuous evaluations.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F7F9FC] border border-[#E4E8EF]">
                    <div className="font-bold text-[#062F68] mb-1">
                      4. Verification & Placement Readiness Report
                    </div>
                    <p className="text-slate-600">
                      Individual student performance analytics submitted to department leadership.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Connections */}
      <PartnersSection />
    </div>
  );
}
