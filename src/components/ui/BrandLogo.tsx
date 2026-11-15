'use client';

import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  /**
   * 'dark' = for dark backgrounds (white text, gold accent, bright slate tagline)
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
  size = 'sm',
}: BrandLogoProps) {
  const isDark = variant === 'dark';

  const dimensions = {
    sm: {
      emblem: 36,
      emblemClass: 'w-8 h-8 sm:w-9 sm:h-9',
      dividerClass: 'h-6',
      title: 'text-[15px] sm:text-[16px]',
      subtitle: 'text-[8.5px] sm:text-[9.5px] tracking-[0.2em]',
    },
    md: {
      emblem: 42,
      emblemClass: 'w-9 h-9 sm:w-10 sm:h-10',
      dividerClass: 'h-7',
      title: 'text-[17px] sm:text-[18px]',
      subtitle: 'text-[9.5px] sm:text-[10.5px] tracking-[0.22em]',
    },
    lg: {
      emblem: 52,
      emblemClass: 'w-11 h-11 sm:w-12 sm:h-12',
      dividerClass: 'h-8',
      title: 'text-[19px] sm:text-[21px]',
      subtitle: 'text-[11px] sm:text-[12px] tracking-[0.24em]',
    },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official Transparent Emblem Icon */}
      <div className={`relative shrink-0 ${dimensions.emblemClass} transition-transform duration-200 group-hover:scale-105`}>
        <Image
          src="/images/brand/logo-emblem.png"
          alt="Skillthinker Solutions Official Emblem"
          width={dimensions.emblem * 2}
          height={dimensions.emblem * 2}
          className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
          priority
        />
      </div>

      {/* Hairline Divider */}
      <div
        className={`w-px ${dimensions.dividerClass} shrink-0 ${
          isDark ? 'bg-white/25' : 'bg-[#0A3A7A]/25'
        }`}
        aria-hidden="true"
      />

      {/* Senior Typographic Wordmark & Tagline */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline gap-1.5 flex-nowrap">
          <span
            className={`font-black uppercase ${dimensions.title} tracking-tight ${
              isDark ? 'text-white' : 'text-[#06284F]'
            }`}
          >
            SKILLTHINKER
          </span>
          <span
            className="font-black uppercase tracking-tight text-[#FCAF0A]"
            style={{ fontSize: 'inherit' }}
          >
            SOLUTIONS
          </span>
        </div>

        {showTagline && (
          <span
            className={`font-bold uppercase ${dimensions.subtitle} mt-1 ${
              isDark ? 'text-slate-200' : 'text-[#0A3A7A]'
            } flex items-center gap-1.5`}
          >
            <span>LEARN TODAY</span>
            <span className="w-1 h-1 rounded-full bg-[#FCAF0A] inline-block shrink-0" />
            <span>BUILD TOMORROW</span>
          </span>
        )}
      </div>
    </div>
  );
}
