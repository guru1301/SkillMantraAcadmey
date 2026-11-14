'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  ArrowRight, 
  ChevronDown, 
  MessageCircle, 
  ShieldCheck, 
  LogIn, 
  Sparkles, 
  BookOpen,
  Home,
  Info,
  Award,
  Phone
} from 'lucide-react';
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
    { label: 'About', href: '/#about', icon: Info },
    { label: 'Why Us', href: '/#why-skillthinker', icon: Sparkles },
    { label: 'Certifications', href: '/#certifications', icon: Award },
    { label: 'Contact', href: '/#contact', icon: Phone },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#041427]/95 backdrop-blur-md border-b border-white/10 shadow-xl shadow-black/20 py-3'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-14 lg:h-16">

            {/* Brand Logo in Frosted Pill */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="bg-white px-3 py-1.5 rounded-xl shadow-md group-hover:scale-102 transition-transform">
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
            <nav className="hidden lg:flex items-center gap-1.5">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white/90 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <Home className="w-4 h-4 text-[#FCAF0A]" />
                <span>Home</span>
              </Link>

              {/* Programs Mega-Menu Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProgramsOpen(!programsOpen)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    programsOpen
                      ? 'bg-white/15 text-white'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                  aria-expanded={programsOpen}
                >
                  <BookOpen className="w-4 h-4 text-[#FCAF0A]" />
                  <span>Programs</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-[#FCAF0A] ${programsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Smooth High-Presence Mega-Menu (NO inner scrollbars) */}
                {programsOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/4 mt-3 w-[720px] rounded-2xl bg-[#06284F]/98 border border-white/20 shadow-2xl p-6 backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-200"
                    style={{ animationDuration: '180ms' }}
                  >
                    {/* Header Strip */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#FCAF0A]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#FCAF0A]">
                          10 Specialized Technical Tracks
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300">
                        Anna Nagar, Trichy Campus &amp; Live Lab
                      </span>
                    </div>

                    {/* 2-Column Grid of All 10 Courses (Zero scrollbar, full view) */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {PROGRAMS_DATA.map((prog) => (
                        <Link
                          key={prog.id}
                          href="/#programs"
                          onClick={() => setProgramsOpen(false)}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#FCAF0A] mt-2 shrink-0 group-hover:scale-125 transition-transform" />
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
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="text-xs text-slate-300">
                        Every track includes hands-on projects &amp; verifiable certification.
                      </div>
                      <Link
                        href="/#programs"
                        onClick={() => setProgramsOpen(false)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-[#FCAF0A] hover:text-[#06284F] text-[#FCAF0A] text-xs font-bold transition-all"
                      >
                        <span>View Detailed Syllabi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white/90 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <IconComponent className="w-4 h-4 text-[#FCAF0A]" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Terminal */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal</span>
              </Link>

              <button
                type="button"
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FCAF0A] to-[#E59B00] hover:from-[#FDBE2E] hover:to-[#FCAF0A] text-[#06284F] text-xs font-extrabold shadow-md shadow-[#FCAF0A]/20 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <MessageCircle className="w-4 h-4 text-[#06284F]" />
                <span>Talk to Advisor</span>
              </button>
            </div>

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl text-white hover:bg-white/10 transition-colors"
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
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-80 max-w-full bg-[#041427] border-l border-white/10 shadow-2xl flex flex-col p-6 z-10">
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="bg-white px-2.5 py-1.5 rounded-xl">
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
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5"
              >
                <Home className="w-4 h-4 text-[#FCAF0A]" />
                <span>Home</span>
              </Link>
              <Link
                href="/#programs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold text-[#FCAF0A] bg-white/[0.06]"
              >
                <BookOpen className="w-4 h-4 text-[#FCAF0A]" />
                <span>All 10 Programs</span>
              </Link>
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5"
                  >
                    <IconComponent className="w-4 h-4 text-[#FCAF0A]" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openModal();
                }}
                className="w-full py-3.5 rounded-xl bg-[#FCAF0A] text-[#06284F] font-bold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Talk to an Advisor</span>
              </button>

              <Link
                href="/verify"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-white/[0.06] border border-white/15 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Certificate</span>
              </Link>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2"
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
