import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Award, BookCheck, Shield } from 'lucide-react';

export default function FacultyDevelopmentSection() {
  const fdpFocusAreas = [
    {
      title: 'Emerging Technologies & AI Integration',
      desc: 'Applied machine learning pipelines, Python data ecosystems, and practical generative tooling for modern engineering coursework.',
    },
    {
      title: 'Cloud & Modern Infrastructure Pedagogy',
      desc: 'Equipping educators to guide students through real-world cloud deployment, Linux administration, and containerization.',
    },
    {
      title: 'Industry-Standard Software Engineering',
      desc: 'Modern web architectures, TypeScript, automated testing, and collaborative Git workflows used in top technology companies.',
    },
    {
      title: 'Cybersecurity & Defensive Concepts',
      desc: 'Core network security, secure coding standards, and vulnerability remediation to modernize campus computer labs.',
    },
    {
      title: 'Project Mentorship & Research Guidance',
      desc: 'Techniques for supervising student capstone projects, academic publications, and industry-collaborative problem statements.',
    },
    {
      title: 'Continuous Pedagogical Improvement',
      desc: 'Active learning strategies, flipped classrooms, and automated coding evaluation platforms for computer science departments.',
    },
  ];

  return (
    <section id="faculty-development" className="py-20 bg-[#F7F9FC] border-b border-[#E4E8EF]">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Visual Column with authentic FDP photo (5 cols) */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative">
              <div className="relative rounded-xl overflow-hidden border border-[#E4E8EF] shadow-lg bg-slate-900 aspect-[4/3]">
                <Image
                  src="/images/faculty-development.jpg"
                  alt="Faculty Development Program (FDP) session conducted with senior engineering professors in an academic conference room"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#062F68]/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-semibold text-[#FCAF0A] uppercase tracking-wider block mb-0.5">
                    Faculty Capacity Building
                  </span>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium">
                    Strengthening educators with hands-on technical curriculum tools and industry context.
                  </p>
                </div>
              </div>

              {/* Floating Stat card */}
              <div className="absolute -bottom-5 -right-4 sm:-bottom-6 sm:-right-6 bg-white border border-[#E4E8EF] rounded-xl p-4 shadow-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A3A7A] shrink-0">
                  <Award className="w-5 h-5 text-[#0A3A7A]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#062F68]">
                    Accreditation Alignment
                  </div>
                  <div className="text-[12px] text-[#667085]">
                    Outcome-Based Education (OBE)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text & Content Column (7 cols) */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A]">
              Educator Empowerment
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
              Faculty Development for a Changing Technology Landscape
            </h2>
            <div className="gold-accent-line" />

            <p className="text-base text-[#667085] leading-relaxed">
              When faculty members are equipped with modern technological depth and practical industry frameworks, the quality of education permanently elevates across every classroom. Our Faculty Development Programs provide structured, hands-on immersion designed around academic schedules.
            </p>

            {/* Grid of FDP Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {fdpFocusAreas.map((area) => (
                <div key={area.title} className="bg-white p-4 rounded-lg border border-[#E4E8EF] shadow-2xs">
                  <h4 className="text-sm font-bold text-[#162033] mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0" />
                    <span>{area.title}</span>
                  </h4>
                  <p className="text-xs text-[#667085] leading-relaxed pl-6">
                    {area.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/contact?intent=fdp-enquiry"
                className="inline-flex items-center justify-center gap-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-sm px-6 py-3.5 rounded-lg shadow-sm transition-all"
              >
                <span>Enquire About FDP for Your College</span>
                <ArrowRight className="w-4 h-4 text-[#FCAF0A]" />
              </Link>
              <Link
                href="/faculty-development"
                className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0A3A7A] hover:underline"
              >
                <span>View FDP Framework</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
