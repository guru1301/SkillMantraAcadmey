'use client';

import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  /**
   * 'dark' = for dark backgrounds (white text, gold accent, slate tagline)
   * 'light' = for light backgrounds (navy text, amber accent, blue tagline)
   */
  variant?: 'dark' | 'light';
  showTagline?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BrandLogo({
  variant = 'dark',
  showTagline = true,
  className = '',
  size = 'md',
}: BrandLogoProps) {
  const isDark = variant === 'dark';

  // Dimension scaling
  const dimensions = {
    sm: { icon: 34, iconClass: 'h-8 w-8', title: 'text-sm sm:text-base', subtitle: 'text-[9px] tracking-[0.16em]' },
    md: { icon: 42, iconClass: 'h-10 w-10 sm:h-11 sm:w-11', title: 'text-base sm:text-lg', subtitle: 'text-[10px] sm:text-[10.5px] tracking-[0.18em]' },
    lg: { icon: 52, iconClass: 'h-12 w-12 sm:h-14 sm:w-14', title: 'text-lg sm:text-xl', subtitle: 'text-[11px] sm:text-[12px] tracking-[0.2em]' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official Transparent Emblem Icon */}
      <div className={`relative shrink-0 ${dimensions.iconClass} transition-transform duration-200 group-hover:scale-105`}>
        <Image
          src="/images/brand/logo-emblem.png"
          alt="Skillthinker Solutions Official Emblem"
          width={dimensions.icon * 2}
          height={dimensions.icon * 2}
          className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
          priority
        />
      </div>

      {/* Senior Typographic Wordmark & Registered Tagline */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline gap-1.5 flex-nowrap">
          <span
            className={`font-extrabold uppercase ${dimensions.title} tracking-[-0.03em] ${
              isDark ? 'text-white' : 'text-[#06284F]'
            }`}
          >
            SKILLTHINKER
          </span>
          <span
            className={`font-black uppercase ${dimensions.title} tracking-wider ${
              isDark ? 'text-[#FCAF0A]' : 'text-[#D97706]'
            }`}
          >
            SOLUTIONS
          </span>
        </div>

        {showTagline && (
          <span
            className={`font-bold uppercase ${dimensions.subtitle} mt-1 ${
              isDark ? 'text-slate-300/90' : 'text-[#0A3A7A]'
            }`}
          >
            Learn Today • Build Tomorrow
          </span>
        )}
      </div>
    </div>
  );
}
