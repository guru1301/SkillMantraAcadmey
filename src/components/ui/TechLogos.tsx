'use client';

import React from 'react';

interface TechLogoProps {
  name: string;
  className?: string;
  size?: number;
}

export default function TechLogo({ name, className = 'w-8 h-8', size = 32 }: TechLogoProps) {
  switch (name.toLowerCase()) {
    case 'python':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#3776AB"
            d="M63.5 8c-14.7 0-24 6.5-24 19.3V38h24.5v3.6H24.5C10.7 41.6 0 51.5 0 65.7c0 14.8 11.8 24.3 26 24.3h8.5v-12c0-14 11.7-24 25.5-24h24.5V41.6C84.5 27 75.3 8 63.5 8zm-13 7.8c2.6 0 4.8 2.1 4.8 4.8s-2.1 4.8-4.8 4.8-4.8-2.1-4.8-4.8 2.1-4.8 4.8-4.8z"
          />
          <path
            fill="#FFD43B"
            d="M64.5 120c14.7 0 24-6.5 24-19.3V90H64v-3.6h39.5c13.8 0 24.5-9.9 24.5-24.1 0-14.8-11.8-24.3-26-24.3H113v12c0 14-11.7 24-25.5 24H63v12.4c0 14.6 9.2 33.6 21 33.6zm13-7.8c-2.6 0-4.8-2.1-4.8-4.8s2.1-4.8 4.8-4.8 4.8 2.1 4.8 4.8-2.1 4.8-4.8 4.8z"
          />
        </svg>
      );

    case 'java':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Steam lines */}
          <path
            d="M48 24c4-4 12-6 16 0 4 6-2 10-6 14-3 3-5 7-3 10"
            stroke="#E76F00"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M62 16c5-4 14-5 18 2 4 7-3 11-7 15-4 4-6 8-4 12"
            stroke="#5382A1"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M76 22c3-3 10-4 13 1 3 5-2 9-5 12-3 3-4 7-3 10"
            stroke="#E76F00"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Coffee Cup Body */}
          <path
            d="M36 56h56v30c0 14-11 22-28 22s-28-8-28-22V56z"
            fill="#5382A1"
          />
          {/* Cup Handle */}
          <path
            d="M92 62h6c6 0 10 4 10 10s-4 10-10 10h-6v-6h6c3 0 5-2 5-4s-2-4-5-4h-6v-6z"
            fill="#5382A1"
          />
          {/* Saucer Base */}
          <path
            d="M26 112c0-3 18-6 38-6s38 3 38 6-18 6-38 6-38-3-38-6z"
            fill="#E76F00"
          />
        </svg>
      );

    case 'fullstack':
    case 'react':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse
            cx="64"
            cy="64"
            rx="56"
            ry="22"
            fill="none"
            stroke="#00D8FF"
            strokeWidth="4"
          />
          <ellipse
            cx="64"
            cy="64"
            rx="56"
            ry="22"
            fill="none"
            stroke="#00D8FF"
            strokeWidth="4"
            transform="rotate(60 64 64)"
          />
          <ellipse
            cx="64"
            cy="64"
            rx="56"
            ry="22"
            fill="none"
            stroke="#00D8FF"
            strokeWidth="4"
            transform="rotate(120 64 64)"
          />
          <circle cx="64" cy="64" r="9" fill="#00D8FF" />
        </svg>
      );

    case 'dotnet':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M64 12l48 26v52l-48 26-48-26V38z"
            fill="#512BD4"
          />
          <text
            x="64"
            y="76"
            fontSize="34"
            fontWeight="900"
            fill="#FFFFFF"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            .NET
          </text>
        </svg>
      );

    case 'analytics':
    case 'powerbi':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="22" y="68" width="18" height="42" rx="3" fill="#E06800" />
          <rect x="46" y="44" width="18" height="66" rx="3" fill="#F2C811" />
          <rect x="70" y="24" width="18" height="86" rx="3" fill="#F2C811" />
          <rect x="94" y="52" width="18" height="58" rx="3" fill="#E06800" />
        </svg>
      );

    case 'ai':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="36" y="36" width="56" height="56" rx="12" fill="#0F172A" stroke="#F59E0B" strokeWidth="4" />
          {/* Inner Chip */}
          <rect x="48" y="48" width="32" height="32" rx="6" fill="#F59E0B" />
          <text x="64" y="70" fontSize="16" fontWeight="900" fill="#0F172A" textAnchor="middle" fontFamily="sans-serif">AI</text>
          {/* Pins */}
          <path d="M52 24v12M64 24v12M76 24v12M52 92v12M64 92v12M76 92v12M24 52h12M24 64h12M24 76h12M92 52h12M92 64h12M92 76h12" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'database':
    case 'sql':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="64" cy="32" rx="44" ry="16" fill="#0284C7" />
          <path d="M20 32v24c0 9 20 16 44 16s44-7 44-16V32" fill="none" stroke="#0284C7" strokeWidth="6" />
          <path d="M20 56v24c0 9 20 16 44 16s44-7 44-16V56" fill="none" stroke="#0284C7" strokeWidth="6" />
          <path d="M20 80v24c0 9 20 16 44 16s44-7 44-16V80" fill="none" stroke="#0284C7" strokeWidth="6" />
        </svg>
      );

    case 'cpp':
    case 'c':
    case 'fundamentals':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M64 12l48 26v52l-48 26-48-26V38z" fill="#00599C" />
          <text x="56" y="78" fontSize="38" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif" textAnchor="middle">C</text>
          <text x="86" y="66" fontSize="26" fontWeight="bold" fill="#659AD2" fontFamily="sans-serif">+</text>
          <text x="98" y="74" fontSize="26" fontWeight="bold" fill="#659AD2" fontFamily="sans-serif">+</text>
        </svg>
      );

    case 'aptitude':
    case 'placement':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M64 24L16 48l48 24 48-24z" fill="#D97706" />
          <path d="M32 58v30c0 14 14 24 32 24s32-10 32-24V58L64 74z" fill="#B45309" />
          <path d="M104 52v36" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'marketing':
    case 'growth':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 128 128"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="64" cy="64" r="50" fill="#059669" />
          <path d="M38 78l20-22 14 12 26-28" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M84 40h14v14" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    default:
      return (
        <div className={`rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 ${className}`}>
          {name.slice(0, 2).toUpperCase()}
        </div>
      );
  }
}
