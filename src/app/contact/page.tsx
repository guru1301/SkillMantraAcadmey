import React from 'react';
import type { Metadata } from 'next';
import ContactSection from '@/components/sections/ContactSection';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact & Institutional RFP | Partner With Us',
  description:
    'Submit an institutional training enquiry, request an academic MoU consultation, or schedule a faculty development program for your institution.',
};

export default function ContactPage() {
  const faqs = [
    {
      q: 'How does Skill Mantra Academy schedule training around our college examination timetable?',
      a: 'We customize training calendars in direct coordination with college deans and HODs, utilizing term breaks, post-internal exam slots, or weekend modules to prevent academic clashes.',
    },
    {
      q: 'Do you provide curriculum mapping for autonomous engineering colleges?',
      a: 'Yes. Our senior trainers review your department syllabus to map lab sessions directly against course outcomes (CO) and program outcomes (PO) for accreditation compliance.',
    },
    {
      q: 'Can programs be delivered both on-campus and in hybrid modes?',
      a: 'Yes. We deliver intensive on-campus practical bootcamps utilizing your college computer labs, as well as blended models featuring live virtual mentoring and offline project defense.',
    },
    {
      q: 'How are student learning outcomes measured and reported to the institution?',
      a: 'Every participant completes milestone coding evaluations and capstone projects. We submit attendance reports, skill gap metrics, and individual performance benchmarks directly to the college leadership.',
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-[#062F68] text-white py-16 lg:py-20 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2 block">
              Institutional Advisory & Inquiries
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              Connect With Our Academic Directorate
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              We welcome enquiries from College Principals, Deans, Placement Officers, Faculty Members, and Corporate L&D Leads.
            </p>
          </div>
        </div>
      </section>

      {/* Main Lead Generation Form */}
      <ContactSection />

      {/* Institutional FAQs */}
      <section className="py-20 bg-[#F7F9FC] border-t border-[#E4E8EF]">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-[#0A3A7A]" />
              Institutional FAQs
            </div>
            <h2 className="text-2xl font-bold text-[#162033]">
              Frequently Asked Questions by College Leadership
            </h2>
            <div className="gold-accent-line mx-auto my-3" />
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-[#E4E8EF] rounded-xl p-6 shadow-2xs">
                <h3 className="text-base font-bold text-[#162033] mb-2">
                  {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
