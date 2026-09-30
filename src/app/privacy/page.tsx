import React from 'react';
import type { Metadata } from 'next';
import { BRAND_INFO } from '@/data/siteData';

export const metadata: Metadata = {
  title: 'Privacy Policy | Skill Mantra Academy',
  description: 'Our privacy standards and data protection practices for institutional partners, faculty members, and learners.',
};

export default function PrivacyPage() {
  return (
    <div className="w-full">
      <section className="bg-[#062F68] text-white py-16 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-slate-300 text-sm mt-2">Effective Date: Academic Year 2026–2027</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom max-w-3xl space-y-6 text-sm text-[#162033] leading-relaxed">
          <p>
            At {BRAND_INFO.name}, we hold the privacy and data security of our academic partners, faculty participants, and learners to the highest standard. This policy outlines how information is gathered, managed, and safeguarded.
          </p>

          <h2 className="text-lg font-bold text-[#062F68] pt-4">1. Institutional Information Collection</h2>
          <p>
            When college administrators or corporate representatives submit enquiries, we collect necessary contact information (name, professional designation, institution name, official email, phone number) strictly for program coordination, curriculum formulation, and scheduling.
          </p>

          <h2 className="text-lg font-bold text-[#062F68] pt-4">2. Learner & Academic Data</h2>
          <p>
            Student laboratory submissions and assessment outcomes are shared exclusively with the authorized college leadership and placement directors. We never sell, monetize, or lease learner data to third-party commercial advertisers.
          </p>

          <h2 className="text-lg font-bold text-[#062F68] pt-4">3. Data Security & Storage</h2>
          <p>
            Institutional records and academic reports are preserved in encrypted storage adhering to recognized industry privacy standards and educational data ethics.
          </p>

          <h2 className="text-lg font-bold text-[#062F68] pt-4">4. Contact Directorate</h2>
          <p>
            For privacy inquiries or institutional audit queries, please contact our academic compliance office at {BRAND_INFO.contactEmail}.
          </p>
        </div>
      </section>
    </div>
  );
}
