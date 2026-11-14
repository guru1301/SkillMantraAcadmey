'use client';

import React from 'react';
import Image from 'next/image';

interface TechLogoProps {
  name: string;
  className?: string;
  size?: number;
}

const LOGO_MAP: Record<string, string> = {
  python: '/images/tech/python.png',
  java: '/images/tech/java.png',
  react: '/images/tech/react.png',
  fullstack: '/images/tech/react.png',
  dotnet: '/images/tech/dotnet.png',
  analytics: '/images/tech/powerbi.png',
  powerbi: '/images/tech/powerbi.png',
  ai: '/images/tech/ai.png',
  database: '/images/tech/database.png',
  sql: '/images/tech/database.png',
  cpp: '/images/tech/cpp.png',
  c: '/images/tech/cpp.png',
  fundamentals: '/images/tech/cpp.png',
  aptitude: '/images/tech/aptitude.png',
  placement: '/images/tech/aptitude.png',
  marketing: '/images/tech/marketing.png',
  growth: '/images/tech/marketing.png',
};

export default function TechLogo({ name, className = '', size = 36 }: TechLogoProps) {
  const src = LOGO_MAP[name.toLowerCase()] || '/images/tech/python.png';

  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={`${name} official logo`}
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain filter drop-shadow-sm"
        priority={false}
      />
    </div>
  );
}
