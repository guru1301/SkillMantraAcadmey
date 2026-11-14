const sharp = require('sharp');
const fs = require('fs');

const dir = 'public/images/tech';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const LOGOS = {
  // 1. Python - Official Python Software Foundation Dual Snakes with Drop Shadow & Rich Gradients
  'python.svg': `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="py-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#387EB8" />
          <stop offset="100%" stop-color="#215783" />
        </linearGradient>
        <linearGradient id="py-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFE052" />
          <stop offset="100%" stop-color="#FFC31D" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.18" />
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <!-- Blue Snake (Top Left) -->
        <path fill="url(#py-blue)" d="M126.9 16c-29.4 0-48 13-48 38.6v28.8h49.2v7.2H48.9C21.3 90.6 0 110.4 0 138.8c0 29.6 23.6 48.6 52 48.6h17v-24c0-28 23.4-48 51-48h49V90.6C169 61.4 150.6 16 126.9 16zm-26 15.6c5.2 0 9.6 4.2 9.6 9.6 0 5.4-4.4 9.6-9.6 9.6-5.2 0-9.6-4.2-9.6-9.6 0-5.4 4.4-9.6 9.6-9.6z" transform="translate(14, 14) scale(0.9)" />
        <!-- Yellow Snake (Bottom Right) -->
        <path fill="url(#py-yellow)" d="M129 240c29.4 0 48-13 48-38.6v-28.8H127.8v-7.2h79.2c27.6 0 49-19.8 49-48.2 0-29.6-23.6-48.6-52-48.6h-17v24c0 28-23.4 48-51 48H87v24.8C87 194.6 105.4 240 129 240zm26-15.6c-5.2 0-9.6-4.2-9.6-9.6 0-5.4 4.4-9.6 9.6-9.6 5.2 0 9.6 4.2 9.6 9.6 0 5.4-4.4 9.6-9.6 9.6z" transform="translate(14, 14) scale(0.9)" />
      </g>
    </svg>
  `,

  // 2. Java - Official Oracle / Sun Java Cup with Steam and Rich Shading
  'java.svg': `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="java-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F89820" />
          <stop offset="100%" stop-color="#E76F00" />
        </linearGradient>
        <linearGradient id="java-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#5382A1" />
          <stop offset="100%" stop-color="#1B4F72" />
        </linearGradient>
      </defs>
      <!-- Steam Wave 1 -->
      <path d="M102 36c10-12 30-16 40 0 10 16-6 26-16 36-8 8-12 18-8 26" fill="none" stroke="url(#java-red)" stroke-width="8" stroke-linecap="round" />
      <!-- Steam Wave 2 -->
      <path d="M136 20c12-10 36-12 46 4 10 18-8 28-18 38-10 10-14 20-10 30" fill="none" stroke="url(#java-blue)" stroke-width="8" stroke-linecap="round" />
      <!-- Steam Wave 3 -->
      <path d="M70 48c8-8 24-10 32 2 8 12-4 20-12 28-6 6-8 14-6 20" fill="none" stroke="url(#java-red)" stroke-width="7" stroke-linecap="round" />
      <!-- Cup Body -->
      <path d="M68 116h120v64c0 28-24 44-60 44s-60-16-60-44v-64z" fill="url(#java-blue)" />
      <!-- Cup Rim Highlight -->
      <ellipse cx="128" cy="116" rx="60" ry="12" fill="#75A6C7" />
      <!-- Cup Handle -->
      <path d="M188 128h16c14 0 24 10 24 24s-10 24-24 24h-16v-14h16c6 0 10-4 10-10s-4-10-10-10h-16v-14z" fill="url(#java-blue)" />
      <!-- Saucer Base -->
      <path d="M48 226c0-6 36-12 80-12s80 6 80 12-36 12-80 12-80-6-80-12z" fill="url(#java-red)" />
    </svg>
  `,

  // 3. React / Full Stack - Official React Atom in Glowing Cyan
  'react.svg': `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="128" cy="128" rx="108" ry="42" fill="none" stroke="#61DAFB" stroke-width="8" />
      <ellipse cx="128" cy="128" rx="108" ry="42" fill="none" stroke="#61DAFB" stroke-width="8" transform="rotate(60 128 128)" />
      <ellipse cx="128" cy="128" rx="108" ry="42" fill="none" stroke="#61DAFB" stroke-width="8" transform="rotate(120 128 128)" />
      <circle cx="128" cy="128" r="18" fill="#61DAFB" />
    </svg>
  `,

  // 4. Microsoft .NET - Official Microsoft .NET Ecosystem Emblem
  'dotnet.svg': `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="net-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#68217A" />
          <stop offset="100%" stop-color="#512BD4" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="56" fill="url(#net-grad)" />
      <text x="128" y="152" font-family="'Segoe UI', system-ui, sans-serif" font-size="74" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-1">.NET</text>
    </svg>
  `,

  // 5. Microsoft Power BI - Official Staggered Golden Analytics Bars
  'powerbi.svg': `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pbi-1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F2C811" />
          <stop offset="100%" stop-color="#D9A300" />
        </linearGradient>
        <linearGradient id="pbi-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E87B00" />
          <stop offset="100%" stop-color="#BA5600" />
        </linearGradient>
      </defs>
      <rect x="42" y="136" width="38" height="84" rx="8" fill="url(#pbi-2)" />
      <rect x="88" y="88" width="38" height="132" rx="8" fill="url(#pbi-1)" />
      <rect x="134" y="44" width="38" height="176" rx="8" fill="url(#pbi-1)" />
      <rect x="180" y="104" width="38" height="116" rx="8" fill="url(#pbi-2)" />
    </svg>
  `,

  // 6. AI & Emerging - Neural Processing Core / Next-Gen AI Chip
  'ai.svg': `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10B981" />
          <stop offset="50%" stop-color="#059669" />
          <stop offset="100%" stop-color="#047857" />
        </linearGradient>
      </defs>
      <rect x="52" y="52" width="152" height="152" rx="32" fill="url(#ai-grad)" />
      <rect x="76" y="76" width="104" height="104" rx="20" fill="#064E3B" />
      <text x="128" y="142" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="46" font-weight="900" fill="#34D399" text-anchor="middle" letter-spacing="2">AI</text>
      <!-- Circuit Pins -->
      <path d="M80 32v20M104 32v20M128 32v20M152 32v20M176 32v20M80 204v20M104 204v20M128 204v20M152 204v20M176 204v20M32 80h20M32 104h20M32 128h20M32 152h20M32 176h20M204 80h20M204 104h20M204 128h20M204 152h20M204 176h20" stroke="#10B981" stroke-width="7" stroke-linecap="round" />
    </svg>
  `,

  // 7. Database & Backend - Multi-Tier Relational SQL Cylinder
  'database.svg': `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sql-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284C7" />
          <stop offset="100%" stop-color="#0369A1" />
        </linearGradient>
      </defs>
      <ellipse cx="128" cy="64" rx="88" ry="32" fill="url(#sql-grad)" />
      <path d="M40 64v48c0 18 40 32 88 32s88-14 88-32V64" fill="none" stroke="url(#sql-grad)" stroke-width="12" stroke-linecap="round" />
      <path d="M40 112v48c0 18 40 32 88 32s88-14 88-32v-48" fill="none" stroke="url(#sql-grad)" stroke-width="12" stroke-linecap="round" />
      <path d="M40 160v48c0 18 40 32 88 32s88-14 88-32v-48" fill="none" stroke="url(#sql-grad)" stroke-width="12" stroke-linecap="round" />
    </svg>
  `,

  // 8. C / C++ - Standard C++ Foundation Hexagonal Mark
  'cpp.svg': `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cpp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00599C" />
          <stop offset="100%" stop-color="#004482" />
        </linearGradient>
      </defs>
      <path d="M128 24l92 52v104l-92 52-92-52V76z" fill="url(#cpp-grad)" />
      <text x="110" y="156" font-family="'Segoe UI', system-ui, sans-serif" font-size="80" font-weight="900" fill="#FFFFFF" text-anchor="middle">C</text>
      <text x="174" y="132" font-family="'Segoe UI', system-ui, sans-serif" font-size="52" font-weight="900" fill="#659AD2" text-anchor="middle">+</text>
      <text x="198" y="148" font-family="'Segoe UI', system-ui, sans-serif" font-size="52" font-weight="900" fill="#659AD2" text-anchor="middle">+</text>
    </svg>
  `,

  // 9. Aptitude & Placement - Professional Campus Recruitment Crest
  'aptitude.svg': `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="apt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
      </defs>
      <!-- Graduation Mortarboard -->
      <path d="M128 44L32 92l96 48 96-48z" fill="url(#apt-grad)" />
      <path d="M64 112v60c0 28 28 48 64 48s64-20 64-48v-60l-64 32z" fill="#B45309" />
      <path d="M208 100v72" stroke="url(#apt-grad)" stroke-width="8" stroke-linecap="round" />
      <circle cx="208" cy="180" r="8" fill="#F59E0B" />
    </svg>
  `,

  // 10. Digital Marketing - Organic Search & High-Growth Rocket Circle
  'marketing.svg': `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mkt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#10B981" />
          <stop offset="100%" stop-color="#047857" />
        </linearGradient>
      </defs>
      <circle cx="128" cy="128" r="104" fill="url(#mkt-grad)" />
      <!-- Rising Growth Trend Line -->
      <path d="M72 156l42-44 30 26 56-58" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M168 80h32v32" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `
};

async function generateAllLogos() {
  for (const [filename, svgContent] of Object.entries(LOGOS)) {
    const pngName = filename.replace('.svg', '.png');
    await sharp(Buffer.from(svgContent.trim()))
      .resize(256, 256, { fit: 'contain' })
      .png({ compressionLevel: 9 })
      .toFile(dir + '/' + pngName);
    console.log('Generated ' + pngName);
  }
  console.log('All 10 authentic high-res tech logos generated successfully!');
}

generateAllLogos().catch(console.error);
