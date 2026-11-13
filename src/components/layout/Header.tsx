'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, ChevronDown, MessageCircle, ShieldCheck, LogIn } from 'lucide-react';
import { BRAND_INFO, PROGRAMS_DATA } from '@/data/siteData';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';

export default function Header() {
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

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const { openModal } = useAdvisorModal();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProgramsOpen(false);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProgramsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { label: 'Why Us', href: '/#why-skillthinker' },
    { label: 'About', href: '/#about' },
    { label: 'Audiences', href: '/#audiences' },
    { label: 'Programs', href: '/#programs' },
    { label: 'Credentials', href: '/#certifications' },
    { label: 'Journey', href: '/#journey' },
    { label: 'Mentors', href: '/#mentors' },
    { label: 'FAQ', href: '/#faq' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b ${
          isScrolled ? 'border-slate-200 shadow-sm py-2' : 'border-slate-100 py-3'
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-14 lg:h-16">

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative h-8 w-auto">
                <Image
                  src="/images/brand/logo-brand.png"
                  alt="Skillthinker Solutions"
                  width={140}
                  height={34}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Programs Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProgramsOpen(!programsOpen)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#0A3A7A] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <span>All Tracks</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-[#0A3A7A] ${programsOpen ? 'rotate-180' : ''}`} />
                </button>

                {programsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden z-50 p-2">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#0A3A7A] border-b border-slate-100">
                      10 Specialized Technical Tracks
                    </div>
                    <div className="py-1 divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                      {PROGRAMS_DATA.map((prog) => (
                        <Link
                          key={prog.id}
                          href="/#programs"
                          onClick={() => setProgramsOpen(false)}
                          className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0A3A7A] mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#0A3A7A] transition-colors">
                              {prog.name}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">
                              {prog.shortDesc}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="p-2 border-t border-slate-100 mt-1">
                      <Link
                        href="/#programs"
                        onClick={() => setProgramsOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/80 hover:bg-[#0A3A7A] hover:text-white text-[#0A3A7A] text-xs font-bold transition-all"
                      >
                        <span>Explore full syllabus</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#0A3A7A] rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Action Terminal */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/verify"
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verify Credential</span>
              </Link>

              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#0A3A7A] px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal</span>
              </Link>

              <button
                type="button"
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FCAF0A] hover:bg-[#F5A800] text-[#06284F] text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Talk to Advisor</span>
              </button>
            </div>

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-80 max-w-full bg-white shadow-2xl flex flex-col p-6 z-10">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <Image
                src="/images/brand/logo-brand.png"
                alt="Skillthinker"
                width={120}
                height={30}
                className="h-7 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 space-y-2">
              <Link
                href="/#programs"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-lg text-sm font-bold text-[#0A3A7A] bg-blue-50/60"
              >
                All 10 Programs
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm font-medium text-slate-700 hover:text-[#0A3A7A] hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-lg text-sm font-medium text-slate-700 hover:text-[#0A3A7A] hover:bg-slate-50"
              >
                Contact Admissions
              </Link>
            </nav>

            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openModal();
                }}
                className="w-full py-3 rounded-xl bg-[#FCAF0A] text-[#06284F] font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Talk to an Advisor</span>
              </button>

              <Link
                href="/verify"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verify Certificate</span>
              </Link>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal Login</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
