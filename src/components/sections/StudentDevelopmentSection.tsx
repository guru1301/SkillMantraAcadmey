import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Code, Terminal, CheckCircle2, Cpu, GitBranch, Layers } from 'lucide-react';

export default function StudentDevelopmentSection() {
  const philosophySteps = [
    { step: '01', name: 'Learn', desc: 'Grasp foundational computer science and architectural concepts.' },
    { step: '02', name: 'Practice', desc: 'Code daily in structured sandbox environments and interactive labs.' },
    { step: '03', name: 'Build', desc: 'Engineer complete real-world software applications and systems.' },
    { step: '04', name: 'Apply', desc: 'Deploy projects to cloud platforms using industry git workflows.' },
    { step: '05', name: 'Assess', desc: 'Undergo code reviews, logic evaluations, and viva defense.' },
    { step: '06', name: 'Improve', desc: 'Iterate continuously based on practitioner feedback.' },
  ];

  return (
    <section id="student-development" className="py-20 bg-white border-b border-[#E4E8EF]">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A]">
              Learner Centricity
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
              From Classroom Knowledge to Industry-Ready Skills
            </h2>
            <div className="gold-accent-line" />

            <p className="text-base text-[#667085] leading-relaxed">
              Academic exams test theoretical knowledge, but modern technology recruiters evaluate engineering problem-solving, architectural intuition, and git discipline. Our student programs bridge this gap through rigorous, mentor-guided project labs.
            </p>

            {/* Philosophy Flow */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                The Skill Mantra Learning Philosophy
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {philosophySteps.map((item) => (
                  <div key={item.step} className="bg-[#F7F9FC] border border-[#E4E8EF] p-3 rounded-lg">
                    <span className="text-xs font-bold text-[#0A3A7A] block font-mono">{item.step}</span>
                    <span className="text-sm font-bold text-[#162033] block mt-0.5">{item.name}</span>
                    <p className="text-[11px] text-[#667085] mt-1 leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Outcomes List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-[#162033]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0" />
                <span>Hands-on lab immersion with live debugging</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0" />
                <span>Portfolio-ready GitHub repositories</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0" />
                <span>Technical interview problem-solving intuition</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0" />
                <span>Rigorous code quality and structure standards</span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center gap-2 bg-[#0A3A7A] hover:bg-[#062F68] text-white font-semibold text-sm px-6 py-3.5 rounded-lg shadow-sm transition-all"
              >
                <span>Explore Student Technical Programs</span>
                <ArrowRight className="w-4 h-4 text-[#FCAF0A]" />
              </Link>
              <Link
                href="/contact?intent=campus-workshop"
                className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-[#0A3A7A] hover:underline"
              >
                <span>Request Workshop at Your Campus</span>
              </Link>
            </div>
          </div>

          {/* Visual Column with authentic student lab image (5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="relative rounded-xl overflow-hidden border border-[#E4E8EF] shadow-lg bg-slate-900 aspect-[16/10] sm:aspect-[4/3]">
                <Image
                  src="/images/student-lab.jpg"
                  alt="Engineering students collaborating in a university computer science center of excellence lab with a lead mentor"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#062F68]/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-xs font-semibold text-[#FCAF0A] uppercase tracking-wider block mb-0.5">
                    Applied Coding Labs
                  </span>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium">
                    Mentored project sprints and collaborative algorithm design in campus labs.
                  </p>
                </div>
              </div>

              {/* Tag overlay */}
              <div className="absolute -bottom-4 -left-4 bg-white border border-[#E4E8EF] rounded-lg p-3 shadow-md flex items-center gap-3">
                <Terminal className="w-5 h-5 text-[#0A3A7A]" />
                <div className="text-xs font-bold text-[#162033]">
                  No Passive Lectures • 100% Practical Labs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
