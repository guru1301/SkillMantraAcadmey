import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Code, Terminal, CheckCircle2, GitBranch, Layers } from 'lucide-react';
import StudentDevelopmentSection from '@/components/sections/StudentDevelopmentSection';
import ProgramsDiscoverySection from '@/components/sections/ProgramsDiscoverySection';

export const metadata: Metadata = {
  title: 'Student Skill Development | Hands-On Technology Immersion',
  description:
    'Transform theoretical classroom concepts into production-grade projects. Practical coding labs, GitHub portfolios, and placement technical interview readiness.',
};

export default function StudentDevelopmentPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-[#062F68] text-white py-16 lg:py-20 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2 block">
              Applied Student Readiness
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              From Classroom Knowledge to Industry-Ready Skills
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Moving beyond rote memorization into real-world software architecture, hands-on debugging, and collaborative engineering practices.
            </p>
          </div>
        </div>
      </section>

      {/* Main Student Section */}
      <StudentDevelopmentSection />

      {/* Relevant Programs */}
      <ProgramsDiscoverySection />
    </div>
  );
}
