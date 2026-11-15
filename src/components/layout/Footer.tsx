'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { BRAND_INFO, PROGRAMS_DATA } from '@/data/siteData';
import BrandLogo from '@/components/ui/BrandLogo';

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

          {/* Col 1: Brand identity (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/#top" className="inline-block group">
              <BrandLogo variant="dark" size="md" showTagline={true} />
            </Link>

            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Learn Today · Build Tomorrow — practical, industry-relevant training for students, graduates, and working professionals.
            </p>
          </div>

          {/* Col 2: Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="text-xs font-mono font-bold tracking-[0.15em] uppercase text-white/90 border-b border-[#0A2A4A] pb-2.5">
              Quick Links
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link href="/#top" className="hover:text-[#FCAF0A] transition-colors">Home</Link></li>
              <li><Link href="/#about" className="hover:text-[#FCAF0A] transition-colors">About</Link></li>
              <li><Link href="/#courses" className="hover:text-[#FCAF0A] transition-colors">Courses</Link></li>
              <li><Link href="/#trainers" className="hover:text-[#FCAF0A] transition-colors">Trainers</Link></li>
              <li><Link href="/#faq" className="hover:text-[#FCAF0A] transition-colors">FAQ</Link></li>
              <li><Link href="/#contact" className="hover:text-[#FCAF0A] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Col 3: Portal & Tools (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="text-xs font-mono font-bold tracking-[0.15em] uppercase text-white/90 border-b border-[#0A2A4A] pb-2.5">
              Portal &amp; Tools
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <a href="/assessment.html" className="text-[#FCAF0A] hover:underline font-medium">
                  Take Assessment
                </a>
              </li>
              <li>
                <a href="/student-login.html" className="hover:text-white transition-colors">
                  Feedback
                </a>
              </li>
              <li>
                <a href="/verify.html" className="hover:text-[#FCAF0A] transition-colors flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verify Certificate</span>
                </a>
              </li>
              <li>
                <Link href="/portal" className="hover:text-white transition-colors">
                  College Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Info (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="text-xs font-mono font-bold tracking-[0.15em] uppercase text-white/90 border-b border-[#0A2A4A] pb-2.5">
              Contact Info
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FCAF0A] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  H274, First Floor, Phase 1, Anna Nagar, Trichy – 620026
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FCAF0A] shrink-0" />
                <a href="tel:+919442605096" className="hover:text-white transition-colors font-medium">
                  +91 94426 05096
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FCAF0A] shrink-0" />
                <a href="mailto:info@skillthinker.com" className="hover:text-white transition-colors font-medium">
                  info@skillthinker.com
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom legal bar */}
        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            © 2026 Skillthinker Solutions. All rights reserved. www.skillthinker.com
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span>•</span>
            <a href="/verify.html" className="hover:text-[#FCAF0A] transition-colors">Verify Certificate</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
