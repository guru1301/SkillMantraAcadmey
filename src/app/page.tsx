import React, { Suspense } from 'react';
import HeroSection from '@/components/sections/HeroSection';
import WhySkillthinkerSection from '@/components/sections/WhySkillthinkerSection';
import AboutSection from '@/components/sections/AboutSection';
import AudienceSection from '@/components/sections/AudienceSection';
import ProgramsSection from '@/components/sections/ProgramsSection';
import LearningJourneySection from '@/components/sections/LearningJourneySection';
import MentorshipSection from '@/components/sections/MentorshipSection';
import FaqSection from '@/components/sections/FaqSection';
import ContactSection from '@/components/sections/ContactSection';

export default function HomePage() {
  return (
    <div className="w-full overflow-hidden">
      {/* 1. Hero: The right skills can transform your career. */}
      <HeroSection />

      {/* 2. Why Choose: The right skills can create real opportunities. */}
      <WhySkillthinkerSection />

      {/* 3. About Us: Learn with purpose. Grow with Skillthinker. */}
      <AboutSection />

      {/* 4. Who We Serve: Training built around where you're starting from. */}
      <AudienceSection />

      {/* 5. Courses & Programs: Choose the right learning path. */}
      <ProgramsSection />

      {/* 6. How It Works: From enrollment to certificate, step by step. */}
      <LearningJourneySection />

      {/* 7. Our Trainers: Learn from people who guide your growth. */}
      <MentorshipSection />

      {/* 8. FAQ: Common questions, answered. */}
      <FaqSection />

      {/* 9. Contact Us: Ready to start your learning journey? */}
      <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">Loading enquiry form...</div>}>
        <ContactSection />
      </Suspense>
    </div>
  );
}
