import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Clock, ArrowRight, FileText, ChevronRight } from 'lucide-react';
import { RESOURCES_DATA } from '@/data/siteData';

export const metadata: Metadata = {
  title: 'Academic Resources & Insights | Higher-Ed Whitepapers',
  description:
    'Read insights, whitepapers, and curriculum modernization guides designed for college administrators, engineering educators, and academic leadership.',
};

export default function ResourcesPage() {
  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-[#062F68] text-white py-16 lg:py-20 border-b-4 border-[#FCAF0A]">
        <div className="container-custom">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A] mb-2 block">
              Knowledge Repository
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              Academic Resources & Institutional Papers
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Research articles, pedagogical guides, and curriculum alignment insights authored for higher-education leadership and engineering faculty.
            </p>
          </div>
        </div>
      </section>

      {/* Main Articles List */}
      <section className="py-20 bg-white border-b border-[#E4E8EF]">
        <div className="container-custom max-w-4xl space-y-12">
          {RESOURCES_DATA.map((article) => (
            <article
              key={article.id}
              id={article.slug}
              className="bg-[#F7F9FC] border border-[#E4E8EF] rounded-2xl p-8 scroll-mt-24 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#667085] mb-3">
                <span className="font-bold text-[#0A3A7A] bg-blue-50 border border-blue-100 px-3 py-1 rounded uppercase tracking-wider">
                  {article.category}
                </span>
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{article.readTime}</span>
                  </span>
                  <span>•</span>
                  <span>{article.publishDate}</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#162033] mb-4 leading-tight">
                {article.title}
              </h2>

              <p className="text-sm font-medium text-slate-600 mb-6 italic border-l-2 border-[#FCAF0A] pl-3">
                {article.excerpt}
              </p>

              <div className="space-y-4 text-sm text-[#162033] leading-relaxed border-t border-[#E4E8EF] pt-5">
                {article.content.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-[#E4E8EF] flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Skill Mantra Academic Advisory Series
                </span>
                <Link
                  href="/contact?intent=academic-dialogue"
                  className="text-xs font-bold text-[#0A3A7A] hover:underline inline-flex items-center gap-1"
                >
                  <span>Discuss With Academic Director</span>
                  <ChevronRight className="w-4 h-4 text-[#FCAF0A]" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
