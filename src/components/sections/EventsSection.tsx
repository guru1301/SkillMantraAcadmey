import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight, Clock } from 'lucide-react';
import { EVENTS_DATA } from '@/data/siteData';

export default function EventsSection() {
  return (
    <section id="events" className="py-20 bg-white border-b border-[#E4E8EF]">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold uppercase tracking-wider text-[#0A3A7A] mb-3">
            Academic Calendar & Initiatives
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#162033] tracking-tight">
            Workshops, FDPs & Academic Initiatives
          </h2>
          <div className="gold-accent-line mx-auto my-3" />
          <p className="text-base text-[#667085] leading-relaxed max-w-2xl mx-auto">
            Upcoming faculty development cohorts, campus technical workshops, and higher-education symposiums.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EVENTS_DATA.map((evt) => (
            <div
              key={evt.id}
              className="academic-card p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#0A3A7A] border border-blue-100">
                    {evt.category}
                  </span>
                  {evt.isUpcoming ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Registration Open
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400">
                      Academic Series
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#162033] mb-2 leading-snug">
                  {evt.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#667085] line-clamp-3 mb-4 leading-relaxed">
                  {evt.description}
                </p>

                <div className="space-y-2 border-t border-[#E4E8EF] pt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#0A3A7A] shrink-0" />
                    <span>{evt.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#0A3A7A] shrink-0" />
                    <span>{evt.location} ({evt.mode})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#0A3A7A] shrink-0" />
                    <span className="line-clamp-1">{evt.targetAudience}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-[#E4E8EF] mt-5">
                <Link
                  href={`/contact?event=${encodeURIComponent(evt.title)}`}
                  className="text-xs font-semibold text-[#0A3A7A] hover:text-[#062F68] inline-flex items-center gap-1.5"
                >
                  <span>Enquire / Register Institutional Seats</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FCAF0A]" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-8 text-center text-xs text-slate-400">
          * Sample academic schedules. Specific dates are confirmed mutually with host institutions.
        </div>
      </div>
    </section>
  );
}
