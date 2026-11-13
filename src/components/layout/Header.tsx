'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, Phone, Mail, MapPin, ChevronDown, MessageCircle, ShieldCheck } from 'lucide-react';
import { BRAND_INFO, PROGRAMS_DATA } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function Header() {
  const pathname = usePathname();

  // Hide public header on dedicated portal and login routes
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/portal') ||
    pathname?.startsWith('/student') ||
    pathname?.startsWith('/trainer') ||
    pathname === '/login'
  ) {
    return null;
  }

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const { openModal } = useAdvisorModal();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProgramsDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'Why Skillthinker', href: '/#why-skillthinker' },
    { label: 'About', href: '/#about' },
    { label: 'Who We Serve', href: '/#audiences' },
    { label: 'Learning Journey', href: '/#journey' },
    { label: 'Mentors', href: '/#mentors' },
    { label: 'FAQs', href: '/#faq' },
    { label: 'Contact', href: '/#contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-200">
      {/* 1. Refined Institutional Top Utility Strip */}
      <div className="bg-[#061D3B] text-slate-300 text-[11px] sm:text-xs py-1.5 px-4 border-b border-blue-950/80 font-normal">
        <div className="container-custom flex flex-wrap justify-between items-center gap-2">
          {/* Location & Direct Phone */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3 h-3 text-[#FCAF0A]" />
              <span>Tiruchirappalli, Tamil Nadu</span>
            </span>
            <span className="hidden md:inline text-slate-700">•</span>
            <a
              href={`tel:${BRAND_INFO.contactPhone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3 text-[#FCAF0A]" />
              <span>{BRAND_INFO.contactPhone}</span>
            </a>
            <span className="hidden sm:inline text-slate-700">•</span>
            <a
              href={`mailto:${BRAND_INFO.contactEmail}`}
              className="hidden sm:inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail className="w-3 h-3 text-[#FCAF0A]" />
              <span>{BRAND_INFO.contactEmail}</span>
            </a>
          </div>

          {/* Institutional Fast Links */}
          <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
            <Link
              href="/verify"
              className="inline-flex items-center gap-1 text-[#FCAF0A] hover:underline font-medium"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Verify Certificate</span>
            </Link>
            <span className="text-slate-700">|</span>
            <Link
              href="/login"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Assessment Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div
        className={`bg-white border-b border-[#E2E8F0] transition-all duration-200 ${
          isScrolled ? 'shadow-xs py-2.5' : 'py-3.5'
        }`}
      >
        <div className="container-custom flex items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative h-9 sm:h-10 w-auto">
              <Image
                src="/images/brand/logo-brand.png"
                alt="Skillthinker Solutions"
                width={150}
                height={40}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
            <div className="hidden xl:flex flex-col border-l border-slate-200 pl-3 leading-tight">
              <span className="text-[12px] font-semibold text-[#062F68] tracking-tight">
                Skillthinker Solutions
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Learn Today • Build Tomorrow
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-xs font-medium text-slate-700">
            {/* Programs Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProgramsDropdownOpen(true)}
              onMouseLeave={() => setProgramsDropdownOpen(false)}
            >
              <Link
                href="/#programs"
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                  programsDropdownOpen ? 'text-[#0A3A7A] bg-slate-50' : 'hover:text-[#0A3A7A] hover:bg-slate-50'
                }`}
              >
                <span>Programs</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${programsDropdownOpen ? 'rotate-180' : ''}`} />
              </Link>

              {/* Refined Mega Dropdown Menu */}
              {programsDropdownOpen && (
                <div className="absolute top-full left-0 w-80 bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 z-50 animate-in fade-in-50 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                    All 10 Specialized Tracks
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-0.5">
                    {PROGRAMS_DATA.map((prog) => (
                      <Link
                        key={prog.id}
                        href="/#programs"
                        onClick={() => setProgramsDropdownOpen(false)}
                        className="flex flex-col px-2.5 py-2 rounded-md hover:bg-slate-50 text-left transition-colors group"
                      >
                        <span className="text-xs font-semibold text-[#162033] group-hover:text-[#0A3A7A]">
                          {prog.name}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {prog.shortDesc}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-2.5 xl:px-3 py-1.5 rounded-md hover:text-[#0A3A7A] hover:bg-slate-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[#0A3A7A] px-2.5 py-1.5 transition-colors"
            >
              <span>Portal Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => openModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0A3A7A] hover:bg-[#062F68] rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Talk to an Advisor</span>
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => openModal()}
              className="p-1.5 text-[#0A3A7A] bg-blue-50 rounded-md text-xs font-medium"
              aria-label="Talk to advisor"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-700 hover:text-[#0A3A7A] hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-md py-4 px-5 animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1 pb-4 border-b border-slate-100 text-sm font-medium text-slate-800">
            <Link
              href="/#programs"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-2 rounded-md hover:bg-slate-50 text-[#0A3A7A] font-semibold"
            >
              Browse Programs (10 Tracks)
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-2 rounded-md hover:bg-slate-50 hover:text-[#0A3A7A]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-4 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#0A3A7A] hover:bg-[#062F68] rounded-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Talk to an Advisor</span>
            </button>

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-medium text-slate-700 hover:text-[#0A3A7A] border border-slate-200 rounded-md transition-colors"
            >
              <span>Student / Trainer Portal Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
