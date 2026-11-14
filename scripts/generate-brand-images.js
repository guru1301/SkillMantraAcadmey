const sharp = require('sharp');
const fs = require('fs');

async function generateBrandImages() {
  // Resize emblem to 120x120
  const emblem = await sharp('public/images/brand/logo-emblem.png')
    .resize(120, 120, { fit: 'contain' })
    .toBuffer();

  // Create SVG text overlay for dark background (white text)
  const svgDark = Buffer.from(`
    <svg width="480" height="120" viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="65" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38" fill="#FFFFFF" letter-spacing="-0.5">SKILLTHINKER</text>
      <text x="295" y="65" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="28" fill="#FCAF0A" letter-spacing="1">SOLUTIONS</text>
      <text x="2" y="98" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="16" fill="#CBD5E1" letter-spacing="3.2">LEARN TODAY • BUILD TOMORROW</text>
    </svg>
  `);

  // Create SVG text overlay for light background (navy text)
  const svgLight = Buffer.from(`
    <svg width="480" height="120" viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="65" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38" fill="#06284F" letter-spacing="-0.5">SKILLTHINKER</text>
      <text x="295" y="65" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="28" fill="#D97706" letter-spacing="1">SOLUTIONS</text>
      <text x="2" y="98" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="16" fill="#0A3A7A" letter-spacing="3.2">LEARN TODAY • BUILD TOMORROW</text>
    </svg>
  `);

  // Canvas width 620 x 120 transparent
  await sharp({
    create: {
      width: 620,
      height: 120,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    { input: emblem, top: 0, left: 0 },
    { input: svgDark, top: 0, left: 130 }
  ])
  .png()
  .toFile('public/images/brand/logo-brand-dark.png');

  await sharp({
    create: {
      width: 620,
      height: 120,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([
    { input: emblem, top: 0, left: 0 },
    { input: svgLight, top: 0, left: 130 }
  ])
  .png()
  .toFile('public/images/brand/logo-brand-light.png');

  // Also replace logo-brand.png with the transparent light version for compatibility
  fs.copyFileSync('public/images/brand/logo-brand-light.png', 'public/images/brand/logo-brand.png');
  fs.copyFileSync('public/images/brand/logo-brand-light.png', 'public/images/brand/logo.png');

  console.log('Brand images generated successfully!');
}

generateBrandImages().catch(console.error);
