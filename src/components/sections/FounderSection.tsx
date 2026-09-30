import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, CheckCircle2, UserCheck, ArrowRight, Quote, Shield } from 'lucide-react';
import { FOUNDER_INFO } from '@/data/siteData';

export default function FounderSection() {
  return (
    <section id="leadership" className="py-20 bg-[#F7F9FC] border-b border-[#E4E8EF]">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Training Leadership & Pedagogy
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Experienced Institutional Leadership
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            Skill Mantra Academy was founded by an experienced technical educator committed to modernizing campus skill education with authentic engineering practice.
          </p>
        </div>

        <div className="bg-white border border-[#E4E8EF] rounded-2xl p-8 lg:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Founder Portrait (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div className="relative rounded-xl overflow-hidden border border-[#E4E8EF] shadow-md aspect-square bg-slate-900">
                  <Image
                    src="/images/founder-trainer.jpg"
                    alt="Founder and Lead Technical Trainer of Skill Mantra Academy"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#062F68]/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-xs font-bold text-[#FCAF0A] uppercase tracking-wider block">
                      Lead Master Trainer
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      Higher Education & Industry Skill Specialist
                    </span>
                  </div>
                </div>

                {/* Subtle verified badge */}
                <div className="absolute -bottom-3 -right-3 bg-[#062F68] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md border border-blue-800">
                  <UserCheck className="w-3.5 h-3.5 text-[#FCAF0A]" />
                  <span>Academic Practitioner</span>
                </div>
              </div>
            </div>

            {/* Founder Content Column (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A3A7A] block mb-1">
                  {FOUNDER_INFO.organization}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#162033]">
                  {FOUNDER_INFO.name}
                </h3>
                <p className="text-sm font-semibold text-[#0B4EA2] mt-0.5">
                  {FOUNDER_INFO.title}
                </p>
              </div>

              {/* Biography */}
              <p className="text-sm text-[#162033] leading-relaxed">
                {FOUNDER_INFO.bio}
              </p>

              {/* Pedagogy Quote */}
              <div className="bg-[#F7F9FC] border-l-4 border-[#0A3A7A] p-4 rounded-r-lg">
                <div className="flex items-start gap-2.5">
                  <Quote className="w-4 h-4 text-[#FCAF0A] shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm italic text-[#162033] leading-relaxed">
                    &ldquo;{FOUNDER_INFO.pedagogyQuote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Training Expertise List */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2.5">
                  Areas of Training Specialization & Institutional Impact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#162033]">
                  {FOUNDER_INFO.trainingExpertise.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0B4EA2] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Note */}
              <div className="pt-2 text-[11px] text-slate-400 italic">
                * Note: {FOUNDER_INFO.editorNote}
              </div>

              {/* Action */}
              <div className="pt-2">
                <Link
                  href="/contact?intent=director-connect"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0A3A7A] hover:text-[#062F68] group"
                >
                  <span>Request Leadership Meeting / Academic Consultation</span>
                  <ArrowRight className="w-4 h-4 text-[#FCAF0A] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
