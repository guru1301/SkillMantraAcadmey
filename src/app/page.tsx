import React from 'react';
import HeroSection from '@/components/sections/HeroSection';
import TrustStrip from '@/components/sections/TrustStrip';
import WhatWeDoSection from '@/components/sections/WhatWeDoSection';
import ProgramsDiscoverySection from '@/components/sections/ProgramsDiscoverySection';
import InstitutionalSection from '@/components/sections/InstitutionalSection';
import FacultyDevelopmentSection from '@/components/sections/FacultyDevelopmentSection';
import StudentDevelopmentSection from '@/components/sections/StudentDevelopmentSection';
import CorporateTrainingSection from '@/components/sections/CorporateTrainingSection';
import TrainingMethodologySection from '@/components/sections/TrainingMethodologySection';
import TechnologyDomainsSection from '@/components/sections/TechnologyDomainsSection';
import ImpactSection from '@/components/sections/ImpactSection';
import EventsSection from '@/components/sections/EventsSection';
import FounderSection from '@/components/sections/FounderSection';
import PartnersSection from '@/components/sections/PartnersSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import ResourcesSection from '@/components/sections/ResourcesSection';
import ContactSection from '@/components/sections/ContactSection';

export default function HomePage() {
  return (
    <div className="w-full overflow-hidden">
      {/* 1. Hero Section with authentic Indian institutional training imagery */}
      <HeroSection />

      {/* 2. Trust & Positioning Strip */}
      <TrustStrip />

      {/* 3. What We Do / Core Service Areas */}
      <WhatWeDoSection />

      {/* 4. Programs Discovery Section with Domain Filtering */}
      <ProgramsDiscoverySection />

      {/* 5. For Educational Institutions (High Priority) */}
      <InstitutionalSection />

      {/* 6. Faculty Development Programs (FDP) */}
      <FacultyDevelopmentSection />

      {/* 7. Student Skill Development (Hands-on Learning) */}
      <StudentDevelopmentSection />

      {/* 8. Corporate & Enterprise Upskilling (B2B) */}
      <CorporateTrainingSection />

      {/* 9. 6-Stage Training Methodology */}
      <TrainingMethodologySection />

      {/* 10. Technology Domains & Tooling */}
      <TechnologyDomainsSection />

      {/* 11. Institutional Impact & Metrics */}
      <ImpactSection />

      {/* 12. Academic Events & Workshops Calendar */}
      <EventsSection />

      {/* 13. Founder & Training Leadership Credibility */}
      <FounderSection />

      {/* 14. Academic & Industry Partnerships */}
      <PartnersSection />

      {/* 15. Institutional Feedback & Testimonials */}
      <TestimonialsSection />

      {/* 16. Academic Resources & Insights */}
      <ResourcesSection />

      {/* 17. High-Conversion Institutional Contact & Enquiry */}
      <ContactSection />
    </div>
  );
}
