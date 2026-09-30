import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import InstitutionalChatWidget from '@/components/ui/InstitutionalChatWidget';
import { BRAND_INFO } from '@/data/siteData';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  themeColor: '#0A3A7A',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Skill Mantra Academy | Learn Today • Build Tomorrow | Institutional Education & Skill Development',
    template: '%s | Skill Mantra Academy',
  },
  description:
    'Skill Mantra Academy connects higher-education institutions, educators, students, and corporate organizations through industry-relevant technical training, Faculty Development Programs (FDP), and hands-on bootcamps.',
  keywords: [
    'Skill Mantra Academy',
    'Faculty Development Program',
    'FDP Engineering Colleges',
    'Institutional Technical Training',
    'Student Skill Development',
    'Campus Placement Training',
    'Corporate Upskilling',
    'Data Analytics Training',
    'Full Stack Web Development',
    'Cloud Computing Workshops',
  ],
  authors: [{ name: 'Skill Mantra Academy' }],
  creator: 'Skill Mantra Academy',
  publisher: 'Skill Mantra Academy',
  metadataBase: new URL('https://skillmantraacademy.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://skillmantraacademy.com',
    title: 'Skill Mantra Academy — Institutional Education & Professional Skill Development',
    description:
      'Connecting learners, institutions, and industry through practical, industry-relevant technical and professional skill training.',
    siteName: 'Skill Mantra Academy',
    images: [
      {
        url: '/images/hero-training.jpg',
        width: 1200,
        height: 630,
        alt: 'Skill Mantra Academy Institutional Training',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skill Mantra Academy | Learn Today • Build Tomorrow',
    description: 'Bridging higher education with practical industry skills through institutional training and faculty programs.',
    images: ['/images/hero-training.jpg'],
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: BRAND_INFO.name,
    slogan: BRAND_INFO.tagline,
    description: BRAND_INFO.positioning,
    url: 'https://skillmantraacademy.com',
    logo: 'https://skillmantraacademy.com/images/brand/logo-brand.png',
    email: BRAND_INFO.contactEmail,
    telephone: BRAND_INFO.contactPhone,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'Tamil Nadu',
    },
    knowsAbout: [
      'Faculty Development Programs',
      'Computer Science Engineering Training',
      'Data Analytics & AI',
      'Cloud Computing & DevOps',
      'Institutional MoUs & Technical Workshops',
    ],
  };

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-[#162033] antialiased selection:bg-[#FCAF0A]/30 selection:text-[#062F68]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <InstitutionalChatWidget />
      </body>
    </html>
  );
}
