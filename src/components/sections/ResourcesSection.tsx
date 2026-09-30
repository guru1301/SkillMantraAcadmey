import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { RESOURCES_DATA } from '@/data/siteData';

export default function ResourcesSection() {
  return (
    <section id="resources" className="py-20 bg-[#F7F9FC] border-b border-[#E4E8EF]">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Academic Insights & Whitepapers
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Knowledge Resources & Institutional Papers
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            Practical analyses on engineering curriculum modernization, faculty empowerment, and higher-education skill integration.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RESOURCES_DATA.map((article) => (
            <article
              key={article.id}
              className="bg-white border border-[#E4E8EF] rounded-xl p-6 flex flex-col justify-between shadow-2xs hover:border-[#CBD5E1] transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#667085] mb-3">
                  <span className="font-semibold text-[#0A3A7A] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100 text-[11px] uppercase tracking-wider">
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{article.readTime}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#162033] mb-3 leading-snug hover:text-[#0A3A7A] transition-colors">
                  <Link href={`/resources#${article.slug}`}>
                    {article.title}
                  </Link>
                </h3>

                <p className="text-xs sm:text-sm text-[#667085] line-clamp-3 leading-relaxed mb-4">
                  {article.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E4E8EF] mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">{article.publishDate}</span>
                <Link
                  href={`/resources#${article.slug}`}
                  className="text-xs font-semibold text-[#0A3A7A] hover:text-[#062F68] inline-flex items-center gap-1 group"
                >
                  <span>Read Paper</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FCAF0A] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
