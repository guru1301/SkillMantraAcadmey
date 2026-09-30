import React from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, CheckCircle2, TrendingUp, Users2, ShieldAlert } from 'lucide-react';

export default function CorporateTrainingSection() {
  const corporateTracks = [
    {
      title: 'Full-Stack Modernization & Cloud Migration',
      desc: 'Transitioning engineering teams to modern TypeScript, microservices, containerization with Docker, and cloud-native architecture.',
    },
    {
      title: 'Enterprise Data Analytics & Intelligence',
      desc: 'Applied business analytics, automated reporting with Python, and interactive executive dashboards with Power BI.',
    },
    {
      title: 'Graduate Onboarding & Lateral Bootcamps',
      desc: 'Accelerated 4 to 8-week corporate bootcamps transforming campus hires into billable engineering contributors.',
    },
    {
      title: 'Applied Generative AI & Automation',
      desc: 'Practical enterprise adoption of generative developer tools, workflow automation, and responsible AI implementation.',
    },
  ];

  return (
    <section id="for-corporates" className="py-20 bg-[#F7F9FC] border-b border-[#E4E8EF]">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/70 border border-slate-300 text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
              <Briefcase className="w-3.5 h-3.5 text-[#0A3A7A]" />
              Enterprise & B2B Learning Solutions
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
              Upskilling Teams for a Changing Workplace
            </h2>
            <div className="gold-accent-line mx-auto my-3" />
            <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
              Skill Mantra Academy delivers customized technical training and digital transformation workshops for corporate development teams, IT consultancies, and emerging tech enterprises.
            </p>
          </div>

          {/* Corporate Tracks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {corporateTracks.map((track) => (
              <div
                key={track.title}
                className="bg-white border border-[#E4E8EF] rounded-xl p-6 shadow-2xs hover:border-slate-400 transition-colors"
              >
                <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0A3A7A] mb-3">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#162033] mb-2">
                  {track.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  {track.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Corporate Value Strip */}
          <div className="bg-[#0A3A7A] text-white rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-lg font-bold text-white">
                Looking for Corporate or Team Upskilling?
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 max-w-lg">
                Customized syllabi aligned with your tech stack, pre-training diagnostic assessments, and dedicated post-training review metrics.
              </p>
            </div>

            <Link
              href="/contact?intent=corporate-training"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-[#0A3A7A] font-bold text-sm px-6 py-3 rounded-lg shadow-sm whitespace-nowrap transition-all"
            >
              <span>Talk to Our Training Team</span>
              <ArrowRight className="w-4 h-4 text-[#FCAF0A]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
