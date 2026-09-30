import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, CheckCircle2, Award, ShieldCheck, Globe, Users } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative bg-[#0d1624] text-white pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-[#0A3A7A]/50 overflow-hidden">
      {/* Background Institutional Mesh & Global Tech Network Accents */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#061830] via-[#0d1e38] to-[#081528] opacity-95 -z-10" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent -z-10 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#0A3A7A]/20 filter blur-3xl -z-10 pointer-events-none" />

      {/* Subtle Grid Lines Overlay for Institutional Precision */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10" 
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Text Column (7 cols) - Matches ICT Academy authoritative typography */}
          <div className="lg:col-span-7 space-y-6">
            {/* Academic Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-700/60 text-[#FCAF0A]">
              <span className="w-2 h-2 rounded-full bg-[#FCAF0A] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Institutional Education • Skill Development • Industry Readiness
              </span>
            </div>

            {/* Main Headline (Inspired by ICT Academy's bold institutional statements) */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-extrabold text-white tracking-tight leading-[1.18] uppercase">
              Promoting Technical Rigor &amp;{' '}
              <span className="text-[#FCAF0A] block sm:inline">Nurturing Innovation</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
              Skill Mantra Academy connects higher-education institutions, educators, students, and corporate organizations through rigorous, industry-relevant training—transforming academic curricula into verified, career-ready competencies.
            </p>

            {/* Key Institutional Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FCAF0A] shrink-0" />
                <span>Curriculum-Aligned Technical Workshops</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FCAF0A] shrink-0" />
                <span>Faculty Development Programs (FDP)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FCAF0A] shrink-0" />
                <span>Hands-on Project &amp; Lab-Based Pedagogy</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#FCAF0A] shrink-0" />
                <span>Measurable Outcomes &amp; Accreditation Metrics</span>
              </div>
            </div>

            {/* Dual CTAs - Notice the Orange/Gold [LEARN MORE] Button matching ICT Academy! */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/for-institutions"
                className="inline-flex items-center justify-center gap-2 bg-[#F5A800] hover:bg-[#FCAF0A] text-[#162033] font-extrabold text-sm uppercase tracking-wider px-8 py-3.5 rounded shadow-md transition-all group"
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4 text-[#162033] group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/contact?intent=institutional-partnership"
                className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 rounded border border-white/30 hover:border-white transition-all"
              >
                <Building2 className="w-4 h-4 text-[#FCAF0A]" />
                <span>Partner With Us</span>
              </Link>
            </div>

            {/* Institutional Framework Verification */}
            <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FCAF0A] shrink-0" />
              <span>Aligned with National Education Policy (NEP 2020) &amp; Outcome-Based Education (OBE)</span>
            </div>
          </div>

          {/* Right Visual Column (5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Outer Decorative Frame */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-blue-800/80 shadow-2xl bg-slate-900 aspect-[16/10] sm:aspect-[4/3]">
                <Image
                  src="/images/hero-training.jpg"
                  alt="Skill Mantra Academy institutional technology training session in modern Indian higher-education university seminar hall"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061830]/90 via-transparent to-transparent" />

                {/* Overlay Caption */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-1">
                    <Award className="w-3.5 h-3.5 text-[#FCAF0A]" />
                    <span>Applied Computing &amp; Engineering Labs</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                    Real-world hands-on computing labs, microservices architecture, and faculty empowerment across college campuses.
                  </p>
                </div>
              </div>

              {/* Floating Academic Badge */}
              <div className="absolute -bottom-5 -left-4 sm:-bottom-6 sm:-left-6 bg-[#062F68] border border-blue-700 rounded-xl p-3 sm:p-4 shadow-xl flex items-center gap-3.5 text-white">
                <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center text-[#FCAF0A] shrink-0">
                  <Building2 className="w-5 h-5 text-[#FCAF0A]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#FCAF0A] uppercase tracking-wider">
                    Institutional Directorate
                  </div>
                  <div className="text-[12px] text-slate-200 font-medium">
                    Higher-Ed &amp; Corporate Synergy
                  </div>
                </div>
              </div>

              {/* Tagline Badge */}
              <div className="absolute -top-3 -right-3 bg-[#F5A800] text-[#162033] px-3.5 py-1 rounded text-xs font-black tracking-wide shadow-md hidden sm:block">
                Learn Today • Build Tomorrow
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
