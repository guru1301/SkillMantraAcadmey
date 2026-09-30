import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { BRAND_INFO } from '@/data/siteData';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#062F68] text-white pt-16 pb-12 border-t-4 border-[#FCAF0A]">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-14 border-b border-blue-900/60">
          {/* Column 1: Brand & Institutional Identity (5 cols on lg) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white p-3 rounded-lg inline-block shadow-sm">
              <Image
                src="/images/brand/logo-brand.png"
                alt="Skill Mantra Academy — Learn Today, Build Tomorrow"
                width={190}
                height={62}
                className="object-contain max-h-12 w-auto"
              />
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Skill Mantra Academy connects higher-education institutions, educators, learners, and corporate organizations through rigorous, industry-relevant technical and professional skill training.
            </p>

            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-950/70 border border-blue-800/80 text-xs text-[#FCAF0A]">
                <Award className="w-4 h-4 text-[#FCAF0A] shrink-0" />
                <span>Learn Today • Build Tomorrow</span>
              </div>
            </div>

            <p className="text-[12px] text-slate-400 leading-normal flex items-start gap-2 pt-1">
              <ShieldCheck className="w-4 h-4 text-[#FCAF0A] shrink-0 mt-0.5" />
              <span>{BRAND_INFO.accreditationNote}</span>
            </p>
          </div>

          {/* Column 2: Academy Links (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white/90 border-b border-blue-900/80 pb-2">
              Academy
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/about" className="hover:text-[#FCAF0A] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/programs" className="hover:text-[#FCAF0A] transition-colors">
                  Skill Programs
                </Link>
              </li>
              <li>
                <Link href="/faculty-development" className="hover:text-[#FCAF0A] transition-colors">
                  Faculty Development
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-[#FCAF0A] transition-colors">
                  Workshops & Events
                </Link>
              </li>
              <li>
                <Link href="/about#leadership" className="hover:text-[#FCAF0A] transition-colors">
                  Trainer Credentials
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Institutional & Enterprise Solutions (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white/90 border-b border-blue-900/80 pb-2">
              Solutions
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link href="/for-institutions" className="hover:text-[#FCAF0A] transition-colors">
                  Institutional Training (Colleges)
                </Link>
              </li>
              <li>
                <Link href="/for-corporates" className="hover:text-[#FCAF0A] transition-colors">
                  Corporate Upskilling (B2B)
                </Link>
              </li>
              <li>
                <Link href="/student-development" className="hover:text-[#FCAF0A] transition-colors">
                  Student Technical Immersion
                </Link>
              </li>
              <li>
                <Link href="/for-institutions#methodology" className="hover:text-[#FCAF0A] transition-colors">
                  Institutional Delivery Model
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-[#FCAF0A] transition-colors">
                  Academic Insights & Whitepapers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Engagement (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white/90 border-b border-blue-900/80 pb-2">
              Institutional Enquiry
            </h3>
            
            <p className="text-xs text-slate-300">
              Engage with our academic training directorate for college MoUs, FDPs, and campus bootcamps.
            </p>

            <div className="space-y-3 text-sm text-slate-200">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#FCAF0A] shrink-0 mt-0.5" />
                <a href={`mailto:${BRAND_INFO.contactEmail}`} className="hover:text-[#FCAF0A] transition-colors break-all">
                  {BRAND_INFO.contactEmail}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#FCAF0A] shrink-0 mt-0.5" />
                <a href={`tel:${BRAND_INFO.contactPhone}`} className="hover:text-[#FCAF0A] transition-colors">
                  {BRAND_INFO.contactPhone}
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#FCAF0A] shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  {BRAND_INFO.officeLocation}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#FCAF0A] hover:bg-[#F5A800] text-[#062F68] font-semibold text-xs px-4 py-2.5 rounded-md transition-all shadow-sm group"
              >
                <span>Submit Institutional RFP</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#062F68] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {currentYear} {BRAND_INFO.name}. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <Link href="/privacy" className="hover:text-slate-200 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-200 transition-colors">
              Terms of Engagement
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-200 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
