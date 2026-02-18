#!/usr/bin/env node
/**
 * Generate app icon and splash screen assets for Aretee.
 * Uses pure SVG → PNG conversion via sharp (or canvas).
 * 
 * Run: node scripts/generate-assets.js
 */
const fs = require('fs')
const path = require('path')

// Brand colors
const BRAND = {
  primary: '#6C3CE1',
  background: '#0D0D1A',
  accent: '#00E5FF',
  text: '#E8E8F0',
}

/**
 * Generate SVG for the app icon
 * Design: Dark background with a stylized "A" bolt/flash mark
 */
function generateIconSVG(size = 1024) {
  const padding = size * 0.12
  const cornerRadius = size * 0.22 // iOS-like rounded corners
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#12122A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0D0D1A;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="boltGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:${BRAND.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#5B21B6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND.accent};stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:${BRAND.accent};stop-opacity:0.1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${size * 0.02}" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#bgGrad)" />
  
  <!-- Subtle corner accents -->
  <circle cx="${size * 0.15}" cy="${size * 0.15}" r="${size * 0.2}" fill="url(#accentGrad)" opacity="0.15" />
  <circle cx="${size * 0.85}" cy="${size * 0.85}" r="${size * 0.25}" fill="${BRAND.primary}" opacity="0.08" />
  
  <!-- Lightning bolt / "A" hybrid shape -->
  <g transform="translate(${size * 0.5}, ${size * 0.5})" filter="url(#glow)">
    <!-- Main bolt -->
    <path d="
      M ${size * -0.06} ${size * -0.32}
      L ${size * -0.20} ${size * 0.02}
      L ${size * -0.04} ${size * 0.02}
      L ${size * -0.10} ${size * 0.32}
      L ${size * 0.20} ${size * -0.06}
      L ${size * 0.04} ${size * -0.06}
      L ${size * 0.12} ${size * -0.32}
      Z
    " fill="url(#boltGrad)" />
    
    <!-- Inner highlight for depth -->
    <path d="
      M ${size * -0.04} ${size * -0.28}
      L ${size * -0.16} ${size * 0.00}
      L ${size * -0.02} ${size * 0.00}
      L ${size * -0.07} ${size * 0.25}
      L ${size * 0.16} ${size * -0.04}
      L ${size * 0.03} ${size * -0.04}
      L ${size * 0.10} ${size * -0.28}
      Z
    " fill="${BRAND.primary}" opacity="0.4" />
  </g>
  
  <!-- Bottom text: "ARETEE" -->
  <text x="${size * 0.5}" y="${size * 0.88}" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="${size * 0.06}" 
    font-weight="900" 
    fill="${BRAND.text}" 
    text-anchor="middle" 
    letter-spacing="${size * 0.015}"
    opacity="0.9">ARETEE</text>
</svg>`
}

/**
 * Generate SVG for the splash screen icon (centered, smaller)
 */
function generateSplashIconSVG(size = 200) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="boltGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:${BRAND.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#5B21B6;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  
  <!-- Lightning bolt centered -->
  <g transform="translate(${size * 0.5}, ${size * 0.45})" filter="url(#glow)">
    <path d="
      M ${size * -0.06} ${size * -0.32}
      L ${size * -0.20} ${size * 0.02}
      L ${size * -0.04} ${size * 0.02}
      L ${size * -0.10} ${size * 0.32}
      L ${size * 0.20} ${size * -0.06}
      L ${size * 0.04} ${size * -0.06}
      L ${size * 0.12} ${size * -0.32}
      Z
    " fill="url(#boltGrad)" />
  </g>
  
  <!-- App name below -->
  <text x="${size * 0.5}" y="${size * 0.92}" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="${size * 0.1}" 
    font-weight="900" 
    fill="${BRAND.text}" 
    text-anchor="middle" 
    letter-spacing="${size * 0.02}">ARETEE</text>
</svg>`
}

/**
 * Generate SVG for adaptive icon foreground (Android)
 */
function generateAdaptiveIconSVG(size = 1024) {
  // Android adaptive icons need content in the safe zone (66% center)
  const center = size * 0.5
  const safeRadius = size * 0.33
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="boltGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:${BRAND.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#5B21B6;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${size * 0.015}" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background fill -->
  <rect width="${size}" height="${size}" fill="${BRAND.background}" />
  
  <!-- Lightning bolt centered in safe zone -->
  <g transform="translate(${center}, ${center})" filter="url(#glow)">
    <path d="
      M ${safeRadius * -0.18} ${safeRadius * -0.95}
      L ${safeRadius * -0.60} ${safeRadius * 0.06}
      L ${safeRadius * -0.12} ${safeRadius * 0.06}
      L ${safeRadius * -0.30} ${safeRadius * 0.95}
      L ${safeRadius * 0.60} ${safeRadius * -0.18}
      L ${safeRadius * 0.12} ${safeRadius * -0.18}
      L ${safeRadius * 0.36} ${safeRadius * -0.95}
      Z
    " fill="url(#boltGrad)" />
  </g>
</svg>`
}

// Write SVG files
const assetsDir = path.join(__dirname, '..', 'assets')

fs.writeFileSync(path.join(assetsDir, 'icon.svg'), generateIconSVG(1024))
fs.writeFileSync(path.join(assetsDir, 'splash-icon.svg'), generateSplashIconSVG(200))
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), generateAdaptiveIconSVG(1024))
fs.writeFileSync(path.join(assetsDir, 'favicon.svg'), generateIconSVG(32))

console.log('✅ SVG assets generated in assets/')
console.log('')
console.log('To convert to PNG, use one of:')
console.log('  npx @aspect-build/rules_esbuild/svg2png (if available)')
console.log('  brew install librsvg && rsvg-convert -w 1024 -h 1024 assets/icon.svg > assets/icon.png')
console.log('  Or use https://cloudconvert.com/svg-to-png')
