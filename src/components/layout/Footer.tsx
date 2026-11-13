'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { BRAND_INFO, PROGRAMS_DATA } from '@/data/siteData';

export default function Footer() {
  const pathname = usePathname();

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
    <footer className="bg-[#061D3B] text-slate-300 pt-16 pb-10 border-t-2 border-[#FCAF0A]">
      <div className="container-custom">

        {/* Main directory grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-[#0A2A4A]">

          {/* Col 1: Brand identity + contacts (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white px-3 py-2 rounded inline-block shadow-xs">
              <Image
                src="/images/brand/logo-brand.png"
                alt="Skillthinker Solutions"
                width={148}
                height={38}
                className="object-contain max-h-9 w-auto"
              />
            </div>

            <p className="text-sm text-slate-400 leading-[1.75] max-w-xs">
              <strong className="text-white font-semibold">Learn Today • Build Tomorrow</strong> — practical, industry-relevant training for students, graduates, and working professionals.
            </p>

            {/* Contact strip */}
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#FCAF0A] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{BRAND_INFO.officeLocation}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-[#FCAF0A] shrink-0" />
                <a href={`tel:${BRAND_INFO.contactPhone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">
                  {BRAND_INFO.contactPhone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-[#FCAF0A] shrink-0" />
                <a href={`mailto:${BRAND_INFO.contactEmail}`} className="hover:text-white transition-colors">
                  {BRAND_INFO.contactEmail}
                </a>
              </div>
            </div>

            <a
              href={BRAND_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          {/* Col 2: Programs (4 cols) */}
          <div className="lg:col-span-4 space-y-3.5">
            <div className="text-[11px] font-mono font-bold tracking-[0.15em] uppercase text-white/80 border-b border-[#0A2A4A] pb-2.5">
              Programs Directory
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-400">
              {PROGRAMS_DATA.map((prog) => (
                <li key={prog.id}>
                  <Link href="/#programs" className="hover:text-[#FCAF0A] transition-colors leading-snug line-clamp-1 block">
                    {prog.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Academy links (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="text-[11px] font-mono font-bold tracking-[0.15em] uppercase text-white/80 border-b border-[#0A2A4A] pb-2.5">
              Academy
            </div>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link href="/#why-skillthinker" className="hover:text-[#FCAF0A] transition-colors">Why Skillthinker</Link></li>
              <li><Link href="/#about" className="hover:text-[#FCAF0A] transition-colors">About Us</Link></li>
              <li><Link href="/#audiences" className="hover:text-[#FCAF0A] transition-colors">Who We Serve</Link></li>
              <li><Link href="/#certifications" className="hover:text-[#FCAF0A] transition-colors">Verifiable Credentials</Link></li>
              <li><Link href="/#journey" className="hover:text-[#FCAF0A] transition-colors">Learning Journey</Link></li>
              <li><Link href="/#mentors" className="hover:text-[#FCAF0A] transition-colors">Our Trainers</Link></li>
              <li><Link href="/#faq" className="hover:text-[#FCAF0A] transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Col 4: Portals (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="text-[11px] font-mono font-bold tracking-[0.15em] uppercase text-white/80 border-b border-[#0A2A4A] pb-2.5">
              Portals
            </div>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/login" className="text-white hover:text-[#FCAF0A] transition-colors font-medium">
                  Portal Login
                </Link>
              </li>
              <li>
                <Link href="/verify" className="inline-flex items-center gap-1.5 text-[#FCAF0A] hover:text-white transition-colors font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verify Certificate</span>
                </Link>
              </li>
              <li><Link href="/login" className="hover:text-[#FCAF0A] transition-colors">Student Account</Link></li>
              <li><Link href="/login" className="hover:text-[#FCAF0A] transition-colors">Trainer Portal</Link></li>
              <li><Link href="/#contact" className="hover:text-[#FCAF0A] transition-colors">Admissions Desk</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom legal bar */}
        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © {currentYear} {BRAND_INFO.legalName}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/verify" className="hover:text-[#FCAF0A] transition-colors">Verify Certificate</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
