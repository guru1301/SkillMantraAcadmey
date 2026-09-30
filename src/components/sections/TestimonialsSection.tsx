import React from 'react';
import { TESTIMONIALS_DATA } from '@/data/siteData';
import { Quote, Building2, User, ShieldCheck } from 'lucide-react';

/* 
  ADMIN / CMS INTEGRATION NOTE:
  Institutional testimonials are formatted with verified placeholders.
  Update with signed institutional quotes upon final client sign-off.
*/
export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-[#F7F9FC] border-b border-[#E4E8EF]">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Academic & Partner Feedback
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Institutional Feedback & Perspectives
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            Testimonial architecture prioritizing leadership feedback from college principals, HODs, faculty members, and learners.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS_DATA.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#E4E8EF] rounded-xl p-7 flex flex-col justify-between shadow-2xs hover:border-[#CBD5E1] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#0A3A7A] border border-blue-100">
                    {t.badge}
                  </span>
                  <Quote className="w-5 h-5 text-[#FCAF0A]/80" />
                </div>

                <p className="text-sm text-[#162033] leading-relaxed italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="border-t border-[#E4E8EF] pt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#162033]">
                    {t.author}
                  </div>
                  <div className="text-[11px] text-[#0A3A7A] font-medium">
                    {t.role}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {t.institution}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Placeholders formatted for verified academic leadership reviews.</span>
        </div>
      </div>
    </section>
  );
}
