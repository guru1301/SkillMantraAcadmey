'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
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
    const onScroll = () => setIsScrolled(window.scrollY > 20);
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
    { label: 'About', href: '/#about' },
    { label: 'Why Us', href: '/#why-skillthinker' },
    { label: 'Certifications', href: '/#certifications' },
    { label: 'Contact', href: '/#contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#041427]/95 backdrop-blur-md border-b border-white/10 shadow-lg py-2.5'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-14">

            {/* Brand Logo in Frosted Pill */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm">
                <Image
                  src="/images/brand/logo-brand.png"
                  alt="Skillthinker Solutions"
                  width={130}
                  height={32}
                  className="h-7 w-auto object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation - Pure Human-Crafted Typography (No Icon Clutter) */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className="px-3.5 py-2 text-white/85 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Home
              </Link>

              {/* Programs Mega-Menu Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProgramsOpen(!programsOpen)}
                  className={`group flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
                    programsOpen
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-white/85 hover:text-white hover:bg-white/5'
                  }`}
                  aria-expanded={programsOpen}
                >
                  <span>Programs</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/60 group-hover:text-white transition-transform duration-200 ${programsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Smooth High-Presence Mega-Menu */}
                {programsOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/4 mt-3 w-[700px] rounded-xl bg-[#06284F]/98 border border-white/15 shadow-2xl p-6 backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Header Strip */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FCAF0A]">
                        10 Technical Disciplines
                      </span>
                      <span className="text-xs text-slate-300">
                        Anna Nagar, Trichy Campus &amp; Live Lab
                      </span>
                    </div>

                    {/* 2-Column Grid of All 10 Courses */}
                    <div className="grid grid-cols-2 gap-2">
                      {PROGRAMS_DATA.map((prog) => (
                        <Link
                          key={prog.id}
                          href="/#programs"
                          onClick={() => setProgramsOpen(false)}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white group-hover:text-[#FCAF0A] transition-colors truncate">
                              {prog.name}
                            </div>
                            <div className="text-xs text-slate-300 line-clamp-1 mt-0.5 font-normal">
                              {prog.shortDesc}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-300">
                        Practical project evaluations &amp; merit certification.
                      </span>
                      <Link
                        href="/#programs"
                        onClick={() => setProgramsOpen(false)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FCAF0A] hover:text-[#FFD066] transition-colors"
                      >
                        <span>View All Tracks</span>
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
                  className="px-3.5 py-2 text-white/85 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Action Area - Clean, Restrained */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-white/80 hover:text-white px-2 py-1.5 transition-colors"
              >
                Portal
              </Link>

              <button
                type="button"
                onClick={() => openModal()}
                className="px-4 py-2 rounded-lg bg-[#FCAF0A] hover:bg-[#F5A800] text-[#041427] text-xs font-bold tracking-wide transition-colors cursor-pointer shadow-sm"
              >
                Talk to Advisor
              </button>
            </div>

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-80 max-w-full bg-[#041427] border-l border-white/10 shadow-2xl flex flex-col p-6 z-10">
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="bg-white px-2.5 py-1.5 rounded-lg">
                <Image
                  src="/images/brand/logo-brand.png"
                  alt="Skillthinker"
                  width={120}
                  height={30}
                  className="h-7 w-auto object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5"
              >
                Home
              </Link>
              <Link
                href="/#programs"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-3 rounded-lg text-sm font-bold text-[#FCAF0A] hover:bg-white/5"
              >
                Programs (All 10 Tracks)
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openModal();
                }}
                className="w-full py-3 rounded-lg bg-[#FCAF0A] text-[#06284F] font-bold text-sm text-center shadow-sm"
              >
                Talk to an Advisor
              </button>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold block text-center"
              >
                Portal Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
