import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, CheckCircle2, Award, Users, Target, ShieldCheck } from 'lucide-react';
import FounderSection from '@/components/sections/FounderSection';
import { BRAND_INFO } from '@/data/siteData';

export const metadata: Metadata = {
  title: 'About Us | Institutional Vision & Leadership',
  description:
    'Learn about Skill Mantra Academy, our institutional mission, educational philosophy, and commitment to bridging the gap between college curricula and industry competencies.',
};

export default function AboutPage() {
  const values = [
    {
      title: 'Pedagogical Rigor',
      desc: 'We replace passive lectures with structured, hands-on engineering practice where every concept is coded and deployed.',
    },
    {
      title: 'Institutional Respect',
      desc: 'We align harmoniously with university schedules, autonomous curricula, and internal academic governance.',
    },
    {
      title: 'Industry Authenticity',
      desc: 'Our curricula and toolkits mirror active engineering practices used by modern tech organizations.',
    },
    {
      title: 'Measurable Outcomes',
      desc: 'We provide structured assessment metrics, attendance verification, and placement capability reports for college administrators.',
    },
  ];

  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="bg-[#062F68] text-white py-16 lg:py-20 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2 block">
              Organization & Ethos
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              Connecting Academic Potential With Industry Capability
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Skill Mantra Academy was founded to deliver structured, high-impact technical training and faculty development programs that empower higher-education institutions and modern learners.
            </p>
          </div>
        </div>
      </section>

      {/* Institutional Narrative Section */}
      <section className="py-20 bg-white border-b border-[#E4E8EF]">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] block">
                Our Institutional Purpose
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#162033] tracking-tight">
                Why Skill Mantra Academy Exists
              </h2>
              <div className="gold-accent-line" />
              <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
                Across India&apos;s higher-education landscape, colleges and universities produce millions of eager graduates every year. However, corporate recruiters consistently identify a widening gap: students master theory for semester examinations but often lack practical confidence in writing clean code, architecting databases, and deploying software.
              </p>
              <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
                Skill Mantra Academy addresses this structural challenge at its roots. By collaborating directly with college principals, deans, heads of department, and faculty members, we deliver immersive, project-based technical workshops and FDPs that seamlessly integrate into the academic lifecycle.
              </p>

              <div className="pt-2 border-t border-[#E4E8EF]">
                <div className="flex items-center gap-3 text-xs font-semibold text-[#0A3A7A]">
                  <ShieldCheck className="w-4 h-4 text-[#0B4EA2]" />
                  <span>Aligned with National Education Policy (NEP 2020) Skill Framework</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-[#E4E8EF] shadow-lg aspect-[4/3] bg-slate-900">
                <Image
                  src="/images/hero-training.jpg"
                  alt="Skill Mantra Academy higher-education seminar and practical lab session"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#062F68]/70 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-xs font-bold text-[#FCAF0A] uppercase tracking-wider block">
                    Institutional Commitment
                  </span>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium mt-1">
                    Building long-term academic excellence and campus employability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-[#F7F9FC] border-b border-[#E4E8EF]">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] block mb-1">
              Guiding Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#162033]">
              The Four Pillars of Our Educational Ethos
            </h2>
            <div className="gold-accent-line mx-auto my-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val) => (
              <div key={val.title} className="bg-white border border-[#E4E8EF] rounded-xl p-6 shadow-2xs">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A3A7A] mb-4">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#162033] mb-2">
                  {val.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Leadership Section */}
      <FounderSection />

      {/* Call to Action */}
      <section className="py-16 bg-[#062F68] text-white text-center">
        <div className="container-custom max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Partner With Skill Mantra Academy
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Let&apos;s collaborate to design a structured skill development initiative or faculty empowerment program for your campus.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact?intent=institutional-partnership"
              className="inline-flex items-center gap-2 bg-[#FCAF0A] hover:bg-[#F5A800] text-[#062F68] font-bold text-sm px-6 py-3 rounded-lg shadow-sm"
            >
              <span>Initiate Institutional Discussion</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 bg-transparent hover:bg-white/10 text-white font-medium text-sm px-6 py-3 rounded-lg border border-white/20"
            >
              <span>Explore Programs Catalog</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
