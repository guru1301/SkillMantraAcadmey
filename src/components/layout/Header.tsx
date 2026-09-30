'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Menu,
  X,
  ChevronDown,
  User,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  GraduationCap,
  Award,
  BookOpen,
  Briefcase,
  Globe,
  ShieldCheck,
  FileText,
  Search,
  CheckCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { BRAND_INFO, PROGRAMS_DATA } from '@/data/siteData';

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'institutional' | 'faculty' | 'student' | 'corporate'>('institutional');

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const toggleMobileSection = (name: string) => {
    setMobileExpandedSection((prev) => (prev === name ? null : name));
  };

  return (
    <>
      {/* 1. TOP UTILITY HEADER STRIP */}
      <div className="bg-[#0b1c38] text-white text-[11px] py-1.5 px-4 border-b border-blue-900/60 font-medium">
        <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-2">
          {/* Left: Quick Institutional Contacts & Social Presence */}
          <div className="flex items-center space-x-4 text-slate-300">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FCAF0A]" />
              ESTD. 2024 | ISO 9001:2015 ALIGNED SKILL ECOSYSTEM
            </span>
            <span className="hidden lg:inline text-slate-600">|</span>
            <a
              href={`mailto:${BRAND_INFO.contactEmail}`}
              className="flex items-center gap-1.5 hover:text-[#FCAF0A] transition-colors"
            >
              <Mail className="w-3 h-3 text-[#FCAF0A]" />
              <span className="hidden sm:inline">{BRAND_INFO.contactEmail}</span>
            </a>
            <span className="hidden sm:inline text-slate-600">|</span>
            <a
              href={`tel:${BRAND_INFO.contactPhone}`}
              className="flex items-center gap-1.5 hover:text-[#FCAF0A] transition-colors"
            >
              <Phone className="w-3 h-3 text-[#FCAF0A]" />
              <span>{BRAND_INFO.contactPhone}</span>
            </a>
          </div>

          {/* Right: Institutional Utility Links */}
          <div className="flex items-center space-x-4 text-[11px]">
            <Link
              href="/events"
              className="text-slate-200 hover:text-[#FCAF0A] uppercase tracking-wider transition-colors"
            >
              Events & Programs
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              href="/resources"
              className="text-slate-200 hover:text-[#FCAF0A] uppercase tracking-wider transition-colors"
            >
              Publications & News
            </Link>
            <span className="text-slate-600">|</span>
            <Link
              href="/contact?intent=mou-partnership"
              className="text-[#FCAF0A] hover:underline font-bold uppercase tracking-wider"
            >
              College MoU Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN WHITE BRANDING ROW (WITH ACADEMIC ALIGNMENT SEALS) */}
      <div className="bg-white py-3 border-b border-[#E4E8EF] shadow-2xs">
        <div className="container-custom flex items-center justify-between gap-4">
          {/* Left: Skill Mantra Academy Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="Skill Mantra Academy">
            <div className="relative h-14 sm:h-16 w-auto aspect-[1134/930] flex items-center">
              <Image
                src="/images/brand/logo-brand.png"
                alt="Skill Mantra Academy — Learn Today, Build Tomorrow"
                width={200}
                height={66}
                priority
                className="object-contain max-h-14 sm:max-h-16 w-auto"
              />
            </div>
          </Link>

          {/* Center / Right: Institutional Government / Academic Framework Badges (Inspired by ICT Academy standard) */}
          <div className="hidden lg:flex items-center gap-8 text-[#162033]">
            {/* NEP 2020 Skill Framework Alignment */}
            <div className="flex items-center gap-3 border-r border-[#E4E8EF] pr-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3A7A] shrink-0">
                <GraduationCap className="w-5 h-5 text-[#0A3A7A]" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Academic Framework
                </div>
                <div className="text-[12px] font-bold text-[#062F68] leading-tight">
                  NEP 2020 Aligned
                </div>
                <div className="text-[10px] text-slate-500">
                  Skill Integration Guidelines
                </div>
              </div>
            </div>

            {/* Outcome-Based Education (OBE) Certified */}
            <div className="flex items-center gap-3 border-r border-[#E4E8EF] pr-6">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Accreditation Quality
                </div>
                <div className="text-[12px] font-bold text-[#062F68] leading-tight">
                  OBE & Lab Standards
                </div>
                <div className="text-[10px] text-slate-500">
                  NAAC / NBA Curriculum Support
                </div>
              </div>
            </div>

            {/* Industry-Institute Interaction Directorate */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0A3A7A] shrink-0">
                <Building2 className="w-5 h-5 text-[#0A3A7A]" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Directorate
                </div>
                <div className="text-[12px] font-bold text-[#062F68] leading-tight">
                  Industry-Institute Linkage
                </div>
                <div className="text-[10px] text-slate-500">
                  Universities & Engineering Colleges
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="p-2 rounded-lg bg-[#0A3A7A] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#FCAF0A]" />
              <span>Login</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#162033] hover:bg-slate-100 focus:outline-none"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. DEEP INSTITUTIONAL NAVY BAR (MATCHING ICT ACADEMY STYLE) */}
      <nav
        ref={navRef}
        className={`sticky top-0 z-40 bg-[#1e2633] text-white transition-all shadow-md ${
          isScrolled ? 'py-1 shadow-lg bg-[#161f2e]' : 'py-0'
        }`}
      >
        <div className="container-custom flex items-center justify-between relative">
          {/* Main Horizontal Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* HOME */}
            <Link
              href="/"
              className={`px-4 py-3 text-[13.5px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 ${
                pathname === '/' ? 'text-[#FCAF0A] bg-black/20' : 'text-slate-100 hover:text-[#FCAF0A] hover:bg-black/10'
              }`}
            >
              Home
            </Link>

            {/* ABOUT US (Dropdown) */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('about')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                onClick={() => toggleDropdown('about')}
                className={`px-4 py-3 text-[13.5px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer ${
                  activeDropdown === 'about' || pathname.startsWith('/about')
                    ? 'text-[#FCAF0A] bg-black/20'
                    : 'text-slate-100 hover:text-[#FCAF0A] hover:bg-black/10'
                }`}
              >
                <span>About Us</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'about' ? 'rotate-180' : ''}`} />
              </button>

              {/* ABOUT US Dropdown Menu (Screenshot 3 match) */}
              {activeDropdown === 'about' && (
                <div className="absolute top-full left-0 w-72 bg-[#1e2633] border-t-2 border-[#FCAF0A] shadow-2xl py-2 z-50 text-xs uppercase tracking-wider font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
                  <Link
                    href="/about"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    About Skill Mantra Academy
                  </Link>
                  <Link
                    href="/about#governance"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Advisory Board & Governance
                  </Link>
                  <Link
                    href="/about#pillars"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    7 Core Pillars of Pedagogy
                  </Link>
                  <Link
                    href="/about#leadership"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Executive & Trainer Leadership
                  </Link>
                  <Link
                    href="/for-corporates"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Corporate Partners & Ecosystem
                  </Link>
                  <Link
                    href="/for-institutions"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Nodal Universities & Colleges
                  </Link>
                  <Link
                    href="/about#impact"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Institutional Reach & Impact
                  </Link>
                  <Link
                    href="/resources"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    News & Press Releases
                  </Link>
                  <Link
                    href="/about#certificates"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Awards & Quality Certifications
                  </Link>
                  <Link
                    href="/about#brand"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30"
                  >
                    Brand Identity & Logo
                  </Link>
                </div>
              )}
            </div>

            {/* INITIATIVES (Dropdown - Screenshot 4 match) */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('initiatives')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                onClick={() => toggleDropdown('initiatives')}
                className={`px-4 py-3 text-[13.5px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer ${
                  activeDropdown === 'initiatives' || pathname.startsWith('/initiatives')
                    ? 'text-[#FCAF0A] bg-black/20'
                    : 'text-slate-100 hover:text-[#FCAF0A] hover:bg-black/10'
                }`}
              >
                <span>Initiatives</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'initiatives' ? 'rotate-180' : ''}`} />
              </button>

              {/* INITIATIVES Dropdown Menu */}
              {activeDropdown === 'initiatives' && (
                <div className="absolute top-full left-0 w-72 bg-[#1e2633] border-t-2 border-[#FCAF0A] shadow-2xl py-2 z-50 text-xs uppercase tracking-wider font-semibold animate-in fade-in slide-in-from-top-1 duration-150">
                  <Link
                    href="/faculty-development"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Faculty Development
                  </Link>
                  <Link
                    href="/student-development"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Skill Development
                  </Link>
                  <Link
                    href="/programs#entrepreneurship"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Entrepreneurship & Innovation
                  </Link>
                  <Link
                    href="/student-development#youth"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Youth Empowerment
                  </Link>
                  <Link
                    href="/resources"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Research & Publications
                  </Link>
                  <Link
                    href="/for-institutions#digital"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30 border-b border-slate-700/40"
                  >
                    Digital Empowerment
                  </Link>
                  <Link
                    href="/for-institutions"
                    className="block px-5 py-2.5 text-slate-200 hover:text-white hover:bg-black/30"
                  >
                    Industry-Institute Interaction
                  </Link>
                </div>
              )}
            </div>

            {/* SERVICES (FULL 5-COLUMN MEGA MENU - EXACT SCREENSHOT 2 MATCH!) */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('services')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                onClick={() => toggleDropdown('services')}
                className={`px-4 py-3 text-[13.5px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer ${
                  activeDropdown === 'services' || pathname.startsWith('/for-')
                    ? 'text-[#FCAF0A] bg-black/20'
                    : 'text-slate-100 hover:text-[#FCAF0A] hover:bg-black/10'
                }`}
              >
                <span>Services</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'services' ? 'rotate-180' : ''}`} />
              </button>

              {/* SERVICES MEGA DROPDOWN (Matches user screenshot 2!) */}
              {activeDropdown === 'services' && (
                <div className="absolute top-full -left-48 w-[1050px] bg-[#1a2330] border-t-4 border-[#FCAF0A] shadow-2xl p-8 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="grid grid-cols-5 gap-6 text-xs text-slate-300">
                    {/* Column 1: HIGHER EDUCATION */}
                    <div className="space-y-3">
                      <div className="font-extrabold text-[12.5px] uppercase tracking-wider text-white border-b border-slate-700 pb-2">
                        Higher Education
                      </div>
                      <ul className="space-y-2 text-[11px] uppercase tracking-wider font-semibold">
                        <li>
                          <Link href="/for-institutions" className="hover:text-[#FCAF0A] transition-colors block">
                            Institutional Membership
                          </Link>
                        </li>
                        <li>
                          <Link href="/faculty-development" className="hover:text-[#FCAF0A] transition-colors block">
                            Faculty Development Program
                          </Link>
                        </li>
                        <li>
                          <Link href="/programs" className="hover:text-[#FCAF0A] transition-colors block">
                            Skill Development Courses
                          </Link>
                        </li>
                        <li>
                          <Link href="/programs#assessments" className="hover:text-[#FCAF0A] transition-colors block">
                            SkillTester & Audits
                          </Link>
                        </li>
                        <li>
                          <Link href="/for-institutions#coe" className="hover:text-[#FCAF0A] transition-colors block">
                            Partner CoE Programs
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Column 2: CORPORATE */}
                    <div className="space-y-3">
                      <div className="font-extrabold text-[12.5px] uppercase tracking-wider text-white border-b border-slate-700 pb-2">
                        Corporate
                      </div>
                      <ul className="space-y-2 text-[11px] uppercase tracking-wider font-semibold">
                        <li>
                          <Link href="/for-corporates" className="hover:text-[#FCAF0A] transition-colors block">
                            Patron Membership
                          </Link>
                        </li>
                        <li>
                          <Link href="/for-corporates#csr" className="hover:text-[#FCAF0A] transition-colors block">
                            Corporate Social Responsibility
                          </Link>
                        </li>
                        <li>
                          <Link href="/about#mentors" className="hover:text-[#FCAF0A] transition-colors block">
                            The Guide Network
                          </Link>
                        </li>
                        <li>
                          <Link href="/for-institutions#placement" className="hover:text-[#FCAF0A] transition-colors block">
                            Campus Placement Facilitation
                          </Link>
                        </li>
                        <li>
                          <Link href="/events" className="hover:text-[#FCAF0A] transition-colors block">
                            Workshops
                          </Link>
                        </li>
                        <li>
                          <Link href="/for-corporates" className="hover:text-[#FCAF0A] transition-colors block">
                            Corporate Partners
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Column 3: GOVERNMENT & CSR / PUBLICATIONS */}
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <div className="font-extrabold text-[12.5px] uppercase tracking-wider text-white border-b border-slate-700 pb-2">
                          Govt & CSR Projects
                        </div>
                        <ul className="space-y-2 text-[11px] uppercase tracking-wider font-semibold">
                          <li>
                            <Link href="/events" className="hover:text-[#FCAF0A] transition-colors block">
                              Ongoing Skill Projects
                            </Link>
                          </li>
                          <li>
                            <Link href="/about#impact" className="hover:text-[#FCAF0A] transition-colors block">
                              Completed Projects
                            </Link>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="font-extrabold text-[12.5px] uppercase tracking-wider text-white border-b border-slate-700 pb-2">
                          Publications
                        </div>
                        <ul className="space-y-2 text-[11px] uppercase tracking-wider font-semibold">
                          <li>
                            <Link href="/resources" className="hover:text-[#FCAF0A] transition-colors block">
                              Skill Mantra Journals
                            </Link>
                          </li>
                          <li>
                            <Link href="/resources" className="hover:text-[#FCAF0A] transition-colors block">
                              Academic Connect Magazine
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Column 4: EVENTS & AWARDS */}
                    <div className="space-y-3">
                      <div className="font-extrabold text-[12.5px] uppercase tracking-wider text-white border-b border-slate-700 pb-2">
                        Events & Awards
                      </div>
                      <ul className="space-y-2 text-[11px] uppercase tracking-wider font-semibold">
                        <li>
                          <Link href="/events" className="hover:text-[#FCAF0A] transition-colors block">
                            Bridge Conclave
                          </Link>
                        </li>
                        <li>
                          <Link href="/events" className="hover:text-[#FCAF0A] transition-colors block">
                            Academic Awards
                          </Link>
                        </li>
                        <li>
                          <Link href="/events" className="hover:text-[#FCAF0A] transition-colors block">
                            Tech Conclaves
                          </Link>
                        </li>
                        <li>
                          <Link href="/events" className="hover:text-[#FCAF0A] transition-colors block">
                            Youth Summits
                          </Link>
                        </li>
                        <li>
                          <Link href="/events" className="hover:text-[#FCAF0A] transition-colors block">
                            Youth Contests & Hackathons
                          </Link>
                        </li>
                        <li>
                          <Link href="/events" className="hover:text-[#FCAF0A] transition-colors block">
                            Power Seminars
                          </Link>
                        </li>
                        <li>
                          <Link href="/for-institutions" className="hover:text-[#FCAF0A] transition-colors block">
                            Conference Collaboration
                          </Link>
                        </li>
                      </ul>
                    </div>

                    {/* Column 5: DIGITAL LITERACY & SECTOR SKILLS */}
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <div className="font-extrabold text-[12.5px] uppercase tracking-wider text-white border-b border-slate-700 pb-2">
                          Digital Literacy
                        </div>
                        <ul className="space-y-2 text-[11px] uppercase tracking-wider font-semibold">
                          <li>
                            <Link href="/programs" className="hover:text-[#FCAF0A] transition-colors block">
                              Digital Literacy Drive
                            </Link>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="font-extrabold text-[12.5px] uppercase tracking-wider text-white border-b border-slate-700 pb-2">
                          Sector Skills
                        </div>
                        <ul className="space-y-2 text-[11px] uppercase tracking-wider font-semibold">
                          <li>
                            <Link href="/programs" className="hover:text-[#FCAF0A] transition-colors block">
                              Sector Skill Council
                            </Link>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="font-extrabold text-[12.5px] uppercase tracking-wider text-white border-b border-slate-700 pb-2">
                          Procurement
                        </div>
                        <ul className="space-y-2 text-[11px] uppercase tracking-wider font-semibold">
                          <li>
                            <Link href="/contact?intent=tender-rfp" className="hover:text-[#FCAF0A] transition-colors block">
                              Institutional Tenders
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Mega Menu Bottom Bar: Orange "LEARN MORE" Button (Exact Screenshot match!) */}
                  <div className="mt-8 pt-6 border-t border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Looking for institutional partnership or customized faculty training?
                    </span>
                    <Link
                      href="/for-institutions"
                      className="bg-[#F5A800] hover:bg-[#FCAF0A] text-[#162033] font-extrabold text-xs uppercase tracking-wider px-6 py-2.5 rounded shadow-sm transition-all"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* PROGRAMS */}
            <Link
              href="/programs"
              className={`px-4 py-3 text-[13.5px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 ${
                pathname === '/programs' ? 'text-[#FCAF0A] bg-black/20' : 'text-slate-100 hover:text-[#FCAF0A] hover:bg-black/10'
              }`}
            >
              Programs
            </Link>

            {/* CONTACT */}
            <Link
              href="/contact"
              className={`px-4 py-3 text-[13.5px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 ${
                pathname === '/contact' ? 'text-[#FCAF0A] bg-black/20' : 'text-slate-100 hover:text-[#FCAF0A] hover:bg-black/10'
              }`}
            >
              Contact
            </Link>
          </div>

          {/* Right: Pill "LOGIN / MY ACCOUNT" Button (Exact match to screenshot 1, 2, 3, 4!) */}
          <div className="hidden lg:flex items-center space-x-3 py-1.5">
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="border border-slate-400/80 hover:border-[#FCAF0A] rounded-full px-4 py-1.5 flex items-center gap-2.5 text-xs text-slate-200 hover:text-white transition-all bg-black/20 hover:bg-black/40 cursor-pointer"
            >
              <User className="w-4 h-4 text-[#FCAF0A]" />
              <div className="text-left leading-tight">
                <span className="block text-[11px] font-extrabold text-[#FCAF0A] uppercase tracking-wider">
                  Login
                </span>
                <span className="block text-[10px] text-slate-300 font-medium">
                  My Account
                </span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* 4. INSTITUTIONAL LOGIN / MY ACCOUNT MODAL */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E4E8EF] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#062F68] text-white p-6 relative">
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs font-bold text-[#FCAF0A] uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Institutional Portal Access</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Skill Mantra Member Sign-In
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Select your role to access attendance, courseware, or institution dashboard.
              </p>
            </div>

            {/* Portal Tab Switcher */}
            <div className="grid grid-cols-4 border-b border-[#E4E8EF] text-center text-xs font-semibold bg-[#F7F9FC]">
              <button
                type="button"
                onClick={() => setLoginTab('institutional')}
                className={`py-3 px-1 border-b-2 transition-all ${
                  loginTab === 'institutional'
                    ? 'border-[#0A3A7A] text-[#0A3A7A] bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                College
              </button>
              <button
                type="button"
                onClick={() => setLoginTab('faculty')}
                className={`py-3 px-1 border-b-2 transition-all ${
                  loginTab === 'faculty'
                    ? 'border-[#0A3A7A] text-[#0A3A7A] bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => setLoginTab('student')}
                className={`py-3 px-1 border-b-2 transition-all ${
                  loginTab === 'student'
                    ? 'border-[#0A3A7A] text-[#0A3A7A] bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setLoginTab('corporate')}
                className={`py-3 px-1 border-b-2 transition-all ${
                  loginTab === 'corporate'
                    ? 'border-[#0A3A7A] text-[#0A3A7A] bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Corporate
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-600 bg-blue-50 border border-blue-100 p-3 rounded-lg">
                <strong>{loginTab.toUpperCase()} PORTAL:</strong> Enter registered institutional email or enrollment ID to access batch dashboards.
              </div>

              <div>
                <label className="block text-xs font-bold text-[#162033] uppercase tracking-wider mb-1">
                  Registered Institutional Email / ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. principal@college.edu.in"
                  className="w-full px-3 py-2 text-sm border border-[#E4E8EF] rounded-lg focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#162033] uppercase tracking-wider mb-1">
                  Password / Passcode
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-sm border border-[#E4E8EF] rounded-lg focus:border-[#0A3A7A] focus:ring-1 focus:ring-[#0A3A7A]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    alert('Institutional demo authentication verified. In production, this securely connects with your college SSO / LMS credentials.');
                    setLoginModalOpen(false);
                  }}
                  className="w-full py-2.5 bg-[#0A3A7A] hover:bg-[#062F68] text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all"
                >
                  Access {loginTab} Dashboard
                </button>
              </div>

              <div className="text-center text-xs text-slate-500 pt-2">
                Need to register your institution or faculty cohort?{' '}
                <Link
                  href="/contact?intent=portal-onboarding"
                  onClick={() => setLoginModalOpen(false)}
                  className="text-[#0A3A7A] font-bold hover:underline"
                >
                  Request Institutional Credentials
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MOBILE ACCORDION DRAWER NAVIGATION */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-[85%] max-w-sm bg-[#1e2633] text-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-5 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div className="bg-white p-2 rounded-md">
                  <Image
                    src="/images/brand/logo-brand.png"
                    alt="Skill Mantra Academy"
                    width={130}
                    height={40}
                    className="object-contain max-h-8 w-auto"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Login Button in Mobile */}
              <div className="py-4 border-b border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="w-full border border-[#FCAF0A] rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 text-xs font-bold text-[#FCAF0A] uppercase tracking-wider bg-black/30"
                >
                  <User className="w-4 h-4" />
                  <span>Login / My Account</span>
                </button>
              </div>

              {/* Mobile Accordions */}
              <nav className="mt-4 space-y-1 text-xs uppercase tracking-wider font-bold">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded hover:bg-slate-800 text-slate-200"
                >
                  Home
                </Link>

                {/* About Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleMobileSection('about')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded hover:bg-slate-800 text-slate-200"
                  >
                    <span>About Us</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileExpandedSection === 'about' ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileExpandedSection === 'about' && (
                    <div className="pl-5 py-1 space-y-1 text-[11px] text-slate-300 normal-case border-l border-slate-700 ml-3">
                      <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        About Skill Mantra Academy
                      </Link>
                      <Link href="/about#governance" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        Advisory Board & Governance
                      </Link>
                      <Link href="/about#leadership" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        Trainer Leadership
                      </Link>
                      <Link href="/for-institutions" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        Nodal Universities & Colleges
                      </Link>
                    </div>
                  )}
                </div>

                {/* Initiatives Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleMobileSection('initiatives')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded hover:bg-slate-800 text-slate-200"
                  >
                    <span>Initiatives</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileExpandedSection === 'initiatives' ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileExpandedSection === 'initiatives' && (
                    <div className="pl-5 py-1 space-y-1 text-[11px] text-slate-300 normal-case border-l border-slate-700 ml-3">
                      <Link href="/faculty-development" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        Faculty Development
                      </Link>
                      <Link href="/student-development" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        Skill Development
                      </Link>
                      <Link href="/for-institutions" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        Industry-Institute Interaction
                      </Link>
                    </div>
                  )}
                </div>

                {/* Services Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleMobileSection('services')}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded hover:bg-slate-800 text-slate-200"
                  >
                    <span>Services</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileExpandedSection === 'services' ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileExpandedSection === 'services' && (
                    <div className="pl-5 py-1 space-y-1 text-[11px] text-slate-300 normal-case border-l border-slate-700 ml-3">
                      <Link href="/for-institutions" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        Institutional Membership & MoUs
                      </Link>
                      <Link href="/faculty-development" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        Faculty Development Program
                      </Link>
                      <Link href="/for-corporates" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        Corporate Upskilling
                      </Link>
                      <Link href="/events" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#FCAF0A]">
                        Conclaves, Workshops & Awards
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/programs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded hover:bg-slate-800 text-slate-200"
                >
                  Programs
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded hover:bg-slate-800 text-slate-200"
                >
                  Contact
                </Link>
              </nav>
            </div>

            {/* Mobile Footer */}
            <div className="pt-6 border-t border-slate-700 space-y-3">
              <Link
                href="/for-institutions"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-[#F5A800] hover:bg-[#FCAF0A] text-[#162033] font-bold text-xs uppercase tracking-wider py-2.5 rounded text-center block"
              >
                Learn More
              </Link>
              <div className="text-[11px] text-slate-400 text-center">
                {BRAND_INFO.officeLocation}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
