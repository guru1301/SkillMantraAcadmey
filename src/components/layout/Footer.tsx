'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { BRAND_INFO, PROGRAMS_DATA } from '@/data/siteData';

export default function Footer() {
  const pathname = usePathname();

  // Hide public footer on dedicated portal and login routes
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/portal') ||
    pathname?.startsWith('/student') ||
    pathname?.startsWith('/trainer') ||
    pathname === '/login'
  ) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#061D3B] text-slate-300 pt-16 pb-12 border-t-2 border-[#FCAF0A]">
      <div className="container-custom">
        {/* Main 4-Column Directory */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-blue-950/80">
          {/* Column 1: Institutional Identity & Contacts (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-2 rounded inline-block shadow-xs">
              <Image
                src="/images/brand/logo-brand.png"
                alt="Skillthinker Solutions — Learn Today • Build Tomorrow"
                width={150}
                height={40}
                className="object-contain max-h-9 w-auto"
              />
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm font-normal">
              <strong className="text-white font-semibold">Learn Today • Build Tomorrow</strong> — practical, industry-relevant training for students, graduates, and working professionals.
            </p>

            {/* Verified Address & Contact Strip */}
            <div className="space-y-2 text-xs text-slate-400 pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FCAF0A] shrink-0 mt-0.5" />
                <span>{BRAND_INFO.officeLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FCAF0A] shrink-0" />
                <a href={`tel:${BRAND_INFO.contactPhone.replace(/\s+/g, '')}`} className="hover:text-white">
                  {BRAND_INFO.contactPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#FCAF0A] shrink-0" />
                <a href={`mailto:${BRAND_INFO.contactEmail}`} className="hover:text-white">
                  {BRAND_INFO.contactEmail}
                </a>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={BRAND_INFO.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp: +91 94426 05096</span>
              </a>
            </div>
          </div>

          {/* Column 2: Courses Directory (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-white/90 border-b border-blue-900/80 pb-2">
              Programs Directory (10 Tracks)
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-300">
              {PROGRAMS_DATA.map((prog) => (
                <li key={prog.id}>
                  <Link href="/#programs" className="hover:text-[#FCAF0A] transition-colors line-clamp-1">
                    {prog.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Academy & Methodology (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-white/90 border-b border-blue-900/80 pb-2">
              Academy
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/#why-skillthinker" className="hover:text-[#FCAF0A] transition-colors">
                  Why Skillthinker
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-[#FCAF0A] transition-colors">
                  About Us &amp; Values
                </Link>
              </li>
              <li>
                <Link href="/#audiences" className="hover:text-[#FCAF0A] transition-colors">
                  Who We Serve
                </Link>
              </li>
              <li>
                <Link href="/#journey" className="hover:text-[#FCAF0A] transition-colors">
                  Learning Journey
                </Link>
              </li>
              <li>
                <Link href="/#mentors" className="hover:text-[#FCAF0A] transition-colors">
                  Our Trainers
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#FCAF0A] transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional & Portals (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-white/90 border-b border-blue-900/80 pb-2">
              Portals
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/login" className="text-white hover:text-[#FCAF0A] transition-colors font-medium">
                  Assessment Portal Login
                </Link>
              </li>
              <li>
                <Link href="/verify" className="inline-flex items-center gap-1 text-[#FCAF0A] hover:underline font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verify Certificate</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#FCAF0A] transition-colors">
                  Student Account
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#FCAF0A] transition-colors">
                  Trainer Portal
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-[#FCAF0A] transition-colors">
                  Admissions Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {currentYear} {BRAND_INFO.legalName}. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/verify" className="hover:text-[#FCAF0A] transition-colors">
              Certificate Verification
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
