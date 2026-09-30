import React from 'react';
import type { Metadata } from 'next';
import { BRAND_INFO } from '@/data/siteData';

export const metadata: Metadata = {
  title: 'Terms of Engagement | Skill Mantra Academy',
  description: 'Terms and academic conditions governing institutional partnerships, campus training programs, and workshops.',
};

export default function TermsPage() {
  return (
    <div className="w-full">
      <section className="bg-[#062F68] text-white py-16 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <h1 className="text-3xl font-bold">Terms of Engagement</h1>
          <p className="text-slate-300 text-sm mt-2">Effective Date: Academic Year 2026–2027</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom max-w-3xl space-y-6 text-sm text-[#162033] leading-relaxed">
          <p>
            Welcome to {BRAND_INFO.name}. By accessing this website or engaging our training services, institutions, faculty members, and learners agree to the following terms.
          </p>

          <h2 className="text-lg font-bold text-[#062F68] pt-4">1. Institutional Memoranda & Scope</h2>
          <p>
            Institutional engagements are governed by formal Memoranda of Understanding (MoU) or work orders that define exact training schedules, learning outcomes, batch strengths, and faculty coordination protocols.
          </p>

          <h2 className="text-lg font-bold text-[#062F68] pt-4">2. Intellectual Property & Courseware</h2>
          <p>
            All courseware, laboratory exercises, and software templates provided by {BRAND_INFO.name} remain the proprietary educational property of the academy, licensed for educational use by enrolled participants.
          </p>

          <h2 className="text-lg font-bold text-[#062F68] pt-4">3. Academic Conduct & Code Quality</h2>
          <p>
            Participants are expected to observe standard institutional codes of conduct during both physical classroom workshops and virtual lab mentoring sessions.
          </p>

          <h2 className="text-lg font-bold text-[#062F68] pt-4">4. Governing Framework</h2>
          <p>
            Institutional engagements adhere to prevailing educational norms in the jurisdiction of Tamil Nadu and India.
          </p>
        </div>
      </section>
    </div>
  );
}
