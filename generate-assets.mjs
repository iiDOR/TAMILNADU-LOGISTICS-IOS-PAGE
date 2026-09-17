// Run with: node generate-assets.mjs
import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('public/icons',  { recursive: true });
mkdirSync('public/splash', { recursive: true });

// ── Icons from real TNL logo ──────────────────────────────────────────────────
const icons = [
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },
  { file: 'public/icons/icon-180.png', size: 180 },
  { file: 'public/icons/icon-152.png', size: 152 },
  { file: 'public/icons/icon-120.png', size: 120 },
];

for (const { file, size } of icons) {
  await sharp('tnl.png').resize(size, size).png().toFile(file);
  console.log('✓', file);
}

// ── Splash: yellow bg, centered TNL logo ─────────────────────────────────────
async function splash(file, w, h) {
  const logoSize = Math.round(Math.min(w, h) * 0.38);
  const logo = await sharp('tnl.png').resize(logoSize, logoSize).png().toBuffer();

  await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 245, g: 197, b: 24, alpha: 1 } },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(file);

  console.log('✓', file);
}

const splashes = [
  ['public/splash/splash-2796x1290.png', 2796, 1290],
  ['public/splash/splash-2556x1179.png', 2556, 1179],
  ['public/splash/splash-2532x1170.png', 2532, 1170],
  ['public/splash/splash-2778x1284.png', 2778, 1284],
  ['public/splash/splash-1170x2532.png', 1170, 2532],
  ['public/splash/splash-1290x2796.png', 1290, 2796],
  ['public/splash/splash-1179x2556.png', 1179, 2556],
];

for (const [file, w, h] of splashes) {
  await splash(file, w, h);
}

console.log('\nAll assets generated.');
