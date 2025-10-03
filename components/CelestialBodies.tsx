/**
 * components/CelestialBodies.tsx - Dynamic sun, moon, and planets positioning
 * Renders celestial bodies with gothic arch path and realistic planets
 * — Upgrades:
 *   • Seasonal (month-based) arch height/tilt for sun & moon
 *   • Physically-plausible moon phase mask with sun-relative terminator angle
 *   • Stable seeded starfield w/ gentle twinkle and density falloff near horizon
 *   • Optional faint Milky Way band on clear nights
 *   • Cloud cover dims stars/planets/sun; horizon glow & extinction near horizon
 *   • Unique SVG mask ids to avoid collisions
 *   • Soft, performance-friendly effects (no heavy layout thrash)
 */

import React, { useMemo } from 'react';
import { TimeOfDay } from '../types';

interface CelestialBodiesProps {
  timeOfDay: TimeOfDay;
  gameTimeHours: number;
  gameTimeMinutes: number;
  width?: number;
  height?: number;
  weather?: {
    precipitation: 'none' | 'rain' | 'snow' | 'sleet' | 'hail';
    cloudCover: number;
    intensity: number;
    previousPrecipitation?: 'none' | 'rain' | 'snow' | 'sleet' | 'hail';
  } | null;
  gameDay?: number;
  gameMonth?: number;
  gameYear?: number;
  climate?: string;
}

/* ------------------------------- Utilities -------------------------------- */

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Simple fast seeded RNG (Mulberry32) */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert HEX (#rrggbb) to rgba() string with alpha; passthrough for hsla/rgba */
function colorWithAlpha(col: string, alpha: number) {
  if (!col) return `rgba(255,255,255,${alpha})`;
  if (col.startsWith('rgba(') || col.startsWith('hsla(')) return col;
  if (col.startsWith('hsl(')) {
    const [h, s, l] = col
      .slice(col.indexOf('(') + 1, col.indexOf(')'))
      .split(',')
      .map((p) => p.trim());
    return `hsla(${h}, ${s}, ${l}, ${alpha})`;
  }
  // HEX
  let hex = col.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Gothic-arch inspired path with adjustable peak height & shoulder steepness */
function gothicArchXY(
  progress01: number, // 0 sunrise/east → 1 sunset/west
  width: number,
  height: number,
  eastX = 0.92,
  westX = 0.08,
  horizonY = 0.86,
  peakY = 0.22,
  shoulder = 0.78 // <1 = steeper shoulders, >1 = softer
) {
  const t = clamp(progress01, 0, 1);
  const x = width * lerp(eastX, westX, t);
  // Gothic arch: sin^k for steep sides + high crown
  const s = Math.sin(Math.PI * t);
  const arch = Math.pow(s, shoulder);
  const y = height * lerp(horizonY, peakY, arch);
  return { x, y };
}

/* ------------------------------- Component -------------------------------- */

const CelestialBodies: React.FC<CelestialBodiesProps> = ({
  timeOfDay,
  gameTimeHours,
  gameTimeMinutes,
  width = typeof window !== 'undefined' ? window.innerWidth : 1280,
  height = typeof window !== 'undefined' ? window.innerHeight : 720,
  weather = null,
  gameDay = 1,
  gameMonth = 1,
  gameYear = 1500,
  climate = 'TEMPERATE'
}) => {
  const totalMinutes = gameTimeHours * 60 + gameTimeMinutes;
  const isRaining = weather?.precipitation === 'rain';
  const isSnowing = weather?.precipitation === 'snow' || weather?.precipitation === 'sleet';
  const cloudIntensity = clamp(weather?.cloudCover ?? 0, 0, 1);
  const precipIntensity = clamp(weather?.intensity ?? 0, 0, 1);

  // Seasonal tilt: higher summer arches, lower winter arches (Northern hemi vibe)
  const month01 = ((gameMonth % 12) + 12) % 12 / 12; // 0..1
  const seasonalLift = 0.12 * Math.cos((month01 - 0.5) * 2 * Math.PI); // -0.12..+0.12
  const horizonY = 0.865;
  const peakYSun = clamp(0.22 - seasonalLift, 0.14, 0.28);
  const peakYMoon = clamp(0.26 + seasonalLift * 0.6, 0.18, 0.34);
  const shoulder = 0.78;

  /* ----------------------- Sun/Moon positions & states ---------------------- */
  const celestialPosition = useMemo(() => {
    const sunriseTime = 6 * 60;
    const sunsetTime = 18 * 60;
    const dayDuration = sunsetTime - sunriseTime;

    let sunVisible = false;
    let moonVisible = false;
    let sunPosition = { x: 0, y: 0 };
    let moonPosition = { x: 0, y: 0 };
    let moonPhase = 0; // 0=new → 0.5=full → 1=new
    let sunNearHorizon = false;
    let moonNearHorizon = false;
    let sunHorizonProgress = 1;
    let moonHorizonProgress = 1;

    // Lunar phase (29.5-day synodic cycle)
    const lunarCycle = 29.5;
    const dayInCycle = ((gameDay % lunarCycle) + lunarCycle) % lunarCycle;
    moonPhase = dayInCycle <= lunarCycle / 2 ? dayInCycle / (lunarCycle / 2) : 1 - (dayInCycle - lunarCycle / 2) / (lunarCycle / 2);

    // Sun
    if (totalMinutes >= sunriseTime && totalMinutes <= sunsetTime) {
      sunVisible = true;
      const sunProgress = (totalMinutes - sunriseTime) / dayDuration; // 0..1
      sunPosition = gothicArchXY(sunProgress, width, height, 0.92, 0.08, horizonY, peakYSun, shoulder);

      const horizonThreshold = height * 0.72;
      sunNearHorizon = sunPosition.y > horizonThreshold;
      sunHorizonProgress = sunNearHorizon ? 1 - (sunPosition.y - horizonThreshold) / (height * 0.16) : 1;
      sunHorizonProgress = clamp(sunHorizonProgress, 0, 1);
    }

    // Moon: opposite window (6pm→6am)
    if (totalMinutes < sunriseTime || totalMinutes > sunsetTime) {
      moonVisible = true;
      const nightLen = 24 * 60 - dayDuration; // 12h
      const tNight =
        totalMinutes > sunsetTime
          ? (totalMinutes - sunsetTime) / nightLen
          : (totalMinutes + (24 * 60 - sunsetTime)) / nightLen;
      moonPosition = gothicArchXY(tNight, width, height, 0.92, 0.08, horizonY, peakYMoon, shoulder);

      const horizonThreshold = height * 0.72;
      moonNearHorizon = moonPosition.y > horizonThreshold;
      moonHorizonProgress = moonNearHorizon ? 1 - (moonPosition.y - horizonThreshold) / (height * 0.16) : 1;
      moonHorizonProgress = clamp(moonHorizonProgress, 0, 1);
    }

    return {
      sunVisible,
      moonVisible,
      sunPosition,
      moonPosition,
      moonPhase,
      sunNearHorizon,
      moonNearHorizon,
      sunHorizonProgress,
      moonHorizonProgress
    };
  }, [totalMinutes, width, height, horizonY, peakYSun, peakYMoon, shoulder, gameDay]);

  // Terminator angle for the moon (phase shading direction relative to sun)
  const moonTerminatorAngleDeg = useMemo(() => {
    if (!celestialPosition.sunVisible && !celestialPosition.moonVisible) return 0;
    // Use vector from moon → sun; terminator is approx perpendicular to this
    const dx = celestialPosition.sunPosition.x - celestialPosition.moonPosition.x;
    const dy = celestialPosition.sunPosition.y - celestialPosition.moonPosition.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return angle + 90; // perpendicular
  }, [celestialPosition.sunVisible, celestialPosition.moonVisible, celestialPosition.sunPosition, celestialPosition.moonPosition]);

  /* -------------------------- Planets along ecliptic ------------------------ */
  const planetPositions = useMemo(() => {
    if (timeOfDay !== 'Night' && timeOfDay !== 'Dusk' && timeOfDay !== 'Dawn') return [];
    const planets: { name: string; x: number; y: number; size: number; color: string; glow: string; opacity?: number; description?: string }[] = [];
    const bandY = height * 0.18; // base ecliptic height
    const eclipticAmp = height * 0.06 * (1 + 0.3 * Math.cos(month01 * 2 * Math.PI));

    // Helper to place a body along ecliptic-ish band from east→west
    const place = (t: number, offset = 0) => {
      const x = width * lerp(0.82, 0.18, clamp(t + offset, 0, 1));
      const y = bandY + Math.sin((t + offset) * Math.PI) * eclipticAmp;
      return { x, y };
    };

    // Visibility damping by clouds (but keep planets somewhat visible)
    const vis = clamp(1 - cloudIntensity * 0.65, 0.2, 1); // Minimum 20% visibility

    // Venus (evening/morning star; brightest planet)
    if (((gameMonth + 3) % 12) < 6) {
      const p = place(0.28, 0.05);
      planets.push({
        name: 'Venus',
        x: p.x,
        y: p.y,
        size: 6, // Increased from 4
        color: '#FFFAF0',
        glow: '#FFE4B5',
        opacity: vis * 1.2, // Extra bright
        description: 'The Evening Star'
      });
    } else {
      // Venus as morning star
      const p = place(0.75, 0.05);
      planets.push({
        name: 'Venus',
        x: p.x,
        y: p.y,
        size: 6,
        color: '#FFFAF0',
        glow: '#FFE4B5',
        opacity: vis * 1.2,
        description: 'The Morning Star'
      });
    }

    // Mars (rusty red, closer during opposition)
    const marsOpposition = ((gameMonth + 7) % 12) === 0; // Special brightness
    if (((gameMonth + 7) % 12) < 8) {
      const p = place(0.52, -0.03);
      planets.push({
        name: 'Mars',
        x: p.x,
        y: p.y,
        size: marsOpposition ? 5.5 : 4.5, // Bigger during opposition
        color: '#FF6B35', // More vibrant orange-red
        glow: '#FF4500',
        opacity: marsOpposition ? vis * 1.3 : vis,
        description: marsOpposition ? 'Mars at Opposition!' : 'The Red Planet'
      });
    }

    // Jupiter (king of planets, always prominent)
    if (gameMonth % 12 > 2 && gameMonth % 12 < 10) {
      const p = place(0.65, 0.02);
      planets.push({
        name: 'Jupiter',
        x: p.x,
        y: p.y,
        size: 5, // Increased from 2.5
        color: '#FFDAA0', // Warmer cream color
        glow: '#FFE4B5',
        opacity: vis * 1.1,
        description: 'The Giant Planet'
      });
    }

    // Saturn (pale gold with rings hint)
    // Visible most of the year except late winter/early spring (realistic: ~10 months visibility)
    // Invisible only February-April when too close to sun
    if (gameMonth < 2 || gameMonth > 4) {
      const p = place(0.38, -0.06);
      planets.push({
        name: 'Saturn',
        x: p.x,
        y: p.y,
        size: 4, // Increased from 2
        color: '#F4E4C1',
        glow: '#FFF8DC',
        opacity: vis,
        description: 'The Ringed Planet'
      });
    }

    // Mercury (small, close to sun, only visible at twilight)
    if (timeOfDay === 'Dusk' || timeOfDay === 'Dawn') {
      const mercuryEvening = timeOfDay === 'Dusk';
      const p = place(mercuryEvening ? 0.15 : 0.85, 0);
      planets.push({
        name: 'Mercury',
        x: p.x,
        y: p.y,
        size: 2.5,
        color: '#E0E0E0',
        glow: '#F5F5F5',
        opacity: vis * 0.7,
        description: 'The Swift Planet'
      });
    }

    return planets;
  }, [timeOfDay, gameMonth, width, height, month01, cloudIntensity]);

  /* ------------------------------ Sun coloring ------------------------------ */
  const getSunColors = useMemo(() => {
    // Weather dims overall intensity
    const weatherDim = isRaining || isSnowing ? 0.6 : 1;
    // Clouds dim further (nonlinearly)
    const cloudDim = 1 - 0.75 * cloudIntensity;
    const dim = weatherDim * cloudDim;

    const t = totalMinutes;

    const base = (core: string, glow: string) => ({
      core,
      glow,
      dim
    });

    // Sunrise 6:00–8:00
    if (t >= 360 && t < 480) {
      const p = (t - 360) / 120;
      return p < 0.5 ? base('#FF5A36', '#FF7A50') : base('#FF9A2F', '#FFB347');
    }
    // Morning 8:00–10:00
    if (t >= 480 && t < 600) return base('#FFC266', '#FFD24D');
    // Midday 10:00–15:00
    if (t >= 600 && t < 900) return base('#FFD54D', '#FFEB3B');
    // Late afternoon 15:00–17:00
    if (t >= 900 && t < 1020) return base('#FFC266', '#FFD24D');
    // Sunset 17:00–18:30
    if (t >= 1020 && t < 1110) {
      const p = (t - 1020) / 90;
      if (p < 0.33) return base('#FF9E7A', '#FFC08F');
      if (p < 0.66) return base('#FF6B4A', '#FF8E6C');
      return base('#FF4D2E', '#FF6A49');
    }
    // Default
    return base('#FFD54D', '#FFEB7A');
  }, [totalMinutes, isRaining, isSnowing, cloudIntensity]);

  /* ---------------------------- Moon coloring/glow -------------------------- */
  const baseMoonColor = '#FFF7D6';
  const moonColor = celestialPosition.moonNearHorizon
    ? `hsl(30, ${70 + (1 - celestialPosition.moonHorizonProgress) * 20}%, ${85 - (1 - celestialPosition.moonHorizonProgress) * 10}%)`
    : baseMoonColor;
  const moonGlowColor = celestialPosition.moonNearHorizon
    ? `hsl(20, 60%, ${60 - (1 - celestialPosition.moonHorizonProgress) * 10}%)`
    : '#6FA8FF';

  /* ----------------------------- Stable starfield --------------------------- */
  const starVisibilityBase = timeOfDay === 'Night' ? 1 : timeOfDay === 'Dusk' ? 0.35 : timeOfDay === 'Dawn' ? 0.25 : 0;
  const starVisibility = clamp(starVisibilityBase * (1 - cloudIntensity * 0.9), 0, 1);
  const starSeed = Math.floor((gameMonth + 1) * 1000 + gameDay * 17);

  /* -------------------- Named Historical Stars (with precession) -------------------- */
  const namedStars = useMemo(() => {
    if (starVisibility <= 0) return [];

    // Simple precession: Earth's axis precesses ~26,000 years, so adjust positions by year
    const yearsSince2000 = gameYear - 2000;
    const precessionDegrees = (yearsSince2000 / 26000) * 360; // Full circle = 26k years

    // Historical stars with celestial coordinates (simplified RA/Dec → screen x/y)
    // Format: { name, brightness (0-1), approx x% (0-100), y% (0-50, top half), era, description }
    const stars = [
      // Navigation & Pole Stars
      { name: 'Polaris', brightness: 0.75, x: 50, y: 8, era: 500, desc: 'North Star (after 500 CE)' },
      { name: 'Vega', brightness: 1.0, x: 68, y: 18, era: -12000, desc: 'Ancient Pole Star' },
      { name: 'Canopus', brightness: 0.95, x: 42, y: 52, era: -3000, desc: 'Southern Navigator' },
      { name: 'Arcturus', brightness: 0.9, x: 58, y: 22, era: -10000, desc: 'Bear Guardian' },

      // Mythological & Calendrical
      { name: 'Sirius', brightness: 1.0, x: 38, y: 38, era: -3000, desc: 'Dog Star, Egyptian Calendar' },
      { name: 'Betelgeuse', brightness: 0.85, x: 44, y: 28, era: -5000, desc: 'Orion\'s Shoulder' },
      { name: 'Rigel', brightness: 0.88, x: 40, y: 36, era: -5000, desc: 'Orion\'s Foot' },
      { name: 'Aldebaran', brightness: 0.8, x: 35, y: 32, era: -3000, desc: 'Bull\'s Eye' },
      { name: 'Antares', brightness: 0.82, x: 55, y: 42, era: -2000, desc: 'Rival of Mars' },

      // Constellation Anchors
      { name: 'Pleiades', brightness: 0.7, x: 32, y: 30, era: -10000, desc: 'Seven Sisters' },
      { name: 'Acrux', brightness: 0.75, x: 62, y: 58, era: -5000, desc: 'Southern Cross' },
      { name: 'Deneb', brightness: 0.78, x: 72, y: 16, era: -3000, desc: 'Swan\'s Tail' },
      { name: 'Altair', brightness: 0.76, x: 65, y: 26, era: -2000, desc: 'Eagle Star' },
      { name: 'Fomalhaut', brightness: 0.74, x: 48, y: 46, era: -2000, desc: 'Autumn Star' },
      { name: 'Regulus', brightness: 0.77, x: 52, y: 32, era: -2000, desc: 'Little King, Lion\'s Heart' },
    ];

    // Apply simple precession rotation (rotate around north pole)
    const precessionRad = (precessionDegrees * Math.PI) / 180;

    return stars.map(star => {
      // Only show Polaris after ~500 CE (before that it wasn't the pole star)
      if (star.name === 'Polaris' && gameYear < 500) return null;

      // Vega was pole star ~12,000 BCE
      if (star.name === 'Vega' && gameYear > -10000 && gameYear < 500) {
        // Not prominent as "pole star" during this era
        star.brightness *= 0.7;
        star.desc = 'Bright Star';
      }

      // Apply precession (simplified 2D rotation around center)
      const centerX = 50;
      const centerY = 25;
      const dx = star.x - centerX;
      const dy = star.y - centerY;
      const rotatedX = centerX + (dx * Math.cos(precessionRad) - dy * Math.sin(precessionRad));
      const rotatedY = centerY + (dx * Math.sin(precessionRad) + dy * Math.cos(precessionRad));

      // Convert % to pixels
      const x = (rotatedX / 100) * width;
      const y = (rotatedY / 50) * height;

      // Don't show if below horizon
      if (y > height * 0.5) return null;

      // Astronomically accurate star colors based on spectral type
      let starColor = '#FFFFFF'; // Default white
      let glowColor = '#FFFFFF';

      if (star.name === 'Betelgeuse' || star.name === 'Antares') {
        // Red supergiants (cool, M-type)
        starColor = '#FF6347'; // Deep red-orange
        glowColor = '#FF8C69';
      } else if (star.name === 'Aldebaran') {
        // Orange giant (K-type)
        starColor = '#FFA347';
        glowColor = '#FFB366';
      } else if (star.name === 'Arcturus') {
        // Orange giant (K-type)
        starColor = '#FFB347';
        glowColor = '#FFC466';
      } else if (star.name === 'Rigel') {
        // Blue supergiant (B-type, hottest visible)
        starColor = '#9BB0FF'; // Cool blue
        glowColor = '#ADBFFF';
      } else if (star.name === 'Sirius' || star.name === 'Vega') {
        // White main sequence (A-type, hot)
        starColor = '#F0F8FF'; // Bright blue-white
        glowColor = '#FFFFFF';
      } else if (star.name === 'Canopus' || star.name === 'Deneb') {
        // White supergiants (F-type)
        starColor = '#FFFACD'; // Pale yellow-white
        glowColor = '#FFFEF0';
      } else if (star.name === 'Regulus' || star.name === 'Altair') {
        // Blue-white (B-A type)
        starColor = '#E0F0FF';
        glowColor = '#F0F8FF';
      } else if (star.name === 'Fomalhaut') {
        // White (A-type)
        starColor = '#F8F8FF';
        glowColor = '#FFFFFF';
      } else if (star.name === 'Polaris') {
        // Yellow supergiant (F-type)
        starColor = '#FFF9E3';
        glowColor = '#FFFEF5';
      } else if (star.name === 'Pleiades') {
        // Hot blue cluster (B-type)
        starColor = '#CAD7FF';
        glowColor = '#E0E7FF';
      } else {
        // Generic white/yellow
        starColor = '#FFF5E1';
        glowColor = '#FFFEF0';
      }

      return {
        name: star.name,
        x,
        y,
        size: 1 + star.brightness * 1, // 1-2px (50% smaller than before, distinct from planets)
        brightness: star.brightness,
        description: star.desc,
        color: starColor,
        glow: glowColor
      };
    }).filter(Boolean) as { name: string; x: number; y: number; size: number; brightness: number; description: string; color: string; glow: string }[];
  }, [starVisibility, gameYear, width, height]);

  // Moon and planet hover states (moved outside conditional rendering to fix React hooks)
  const [isMoonHovered, setIsMoonHovered] = React.useState(false);
  const [planetHoverStates, setPlanetHoverStates] = React.useState<boolean[]>([]);
  const [namedStarHoverStates, setNamedStarHoverStates] = React.useState<boolean[]>([]);

  // Initialize planet hover states when planetPositions change
  React.useEffect(() => {
    setPlanetHoverStates(new Array(planetPositions.length).fill(false));
  }, [planetPositions.length]);

  // Initialize named star hover states
  React.useEffect(() => {
    setNamedStarHoverStates(new Array(namedStars.length).fill(false));
  }, [namedStars.length]);

  const stars = useMemo(() => {
    if (starVisibility <= 0) return [];
    const rng = mulberry32(starSeed);
    const count = Math.round(80 + 80 * (1 - cloudIntensity)); // 80–160
    const arr: { x: number; y: number; s: number; tw: number; o: number }[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rng() * width);
      const y = Math.floor(rng() * height * 0.45);
      const size = 0.6 + Math.pow(rng(), 2) * 1.4; // bias small
      const twinkle = 2 + rng() * 3; // 2–5s
      const nearHorizon = y / (height * 0.45);
      const opacity = 0.45 + (1 - nearHorizon) * 0.55; // fade near horizon
      arr.push({ x, y, s: size, tw: twinkle, o: opacity });
    }
    return arr;
  }, [width, height, starVisibility, cloudIntensity, starSeed]);

  // Unique mask id so multiple components don’t clash
  const moonMaskId = useMemo(() => `moon-phase-mask-${gameMonth}-${gameDay}`, [gameMonth, gameDay]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {/* Faint Milky Way band on clear nights */}
      {timeOfDay === 'Night' && starVisibility > 0.6 && cloudIntensity < 0.2 && (
        <div
          aria-hidden
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width,
            height,
            opacity: 0.18 * (1 - cloudIntensity),
            background: `radial-gradient(ellipse at 40% 20%, ${colorWithAlpha('#CDE2FF', 0.16)} 0%, ${colorWithAlpha(
              '#CDE2FF',
              0.06
            )} 30%, transparent 70%)`,
            transform: `rotate(-18deg) translateY(-8%)`,
            filter: 'blur(6px)'
          }}
        />
      )}

      {/* Enhanced Shooting Stars & Meteor Showers */}
      {starVisibility > 0.2 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
          {(() => {
            // Check for named meteor showers by month
            const isPerseids = gameMonth === 8; // August - most spectacular
            const isGeminids = gameMonth === 12; // December
            const isLyrids = gameMonth === 4; // April
            const isQuadrantids = gameMonth === 1; // January
            const isOrionids = gameMonth === 10; // October
            const isLeonids = gameMonth === 11; // November - storms every 33 years

            const showerData = isPerseids ? { intensity: 12, name: 'Perseid Meteor Shower', radiant: { x: 60, y: 25 } } :
                               isGeminids ? { intensity: 10, name: 'Geminid Meteor Shower', radiant: { x: 30, y: 30 } } :
                               isLeonids ? { intensity: 8, name: 'Leonid Meteor Shower', radiant: { x: 45, y: 35 } } :
                               isOrionids ? { intensity: 6, name: 'Orionid Meteor Shower', radiant: { x: 50, y: 20 } } :
                               isLyrids ? { intensity: 5, name: 'Lyrid Meteor Shower', radiant: { x: 70, y: 40 } } :
                               isQuadrantids ? { intensity: 7, name: 'Quadrantid Meteor Shower', radiant: { x: 25, y: 45 } } :
                               { intensity: 2, name: null, radiant: null }; // Sporadic meteors

            const meteors = [];
            const rng = mulberry32(starSeed + gameTimeMinutes * 13);

            // Generate meteors based on intensity
            for (let i = 0; i < showerData.intensity; i++) {
              const chance = showerData.name ? 0.08 : 0.02; // Higher chance during showers
              if (rng() < chance) {
                // If there's a radiant point, meteors emanate from there
                const startX = showerData.radiant ?
                  showerData.radiant.x + (rng() - 0.5) * 20 :
                  10 + rng() * 80;
                const startY = showerData.radiant ?
                  showerData.radiant.y + (rng() - 0.5) * 15 :
                  5 + rng() * 40;

                // Meteor colors based on composition
                const colorTypes = [
                  { color: '#FFFFFF', trail: '#87CEEB', prob: 0.5 }, // Iron (white-blue)
                  { color: '#FFE4B5', trail: '#FFA500', prob: 0.2 }, // Sodium (orange)
                  { color: '#90EE90', trail: '#00FF00', prob: 0.15 }, // Copper (green)
                  { color: '#FFB6C1', trail: '#FF69B4', prob: 0.1 }, // Lithium (pink)
                  { color: '#FF4500', trail: '#FF0000', prob: 0.05 } // Fireball (red)
                ];

                let cumProb = 0;
                const roll = rng();
                let selectedColor = colorTypes[0];
                for (const ct of colorTypes) {
                  cumProb += ct.prob;
                  if (roll < cumProb) {
                    selectedColor = ct;
                    break;
                  }
                }

                const angle = showerData.radiant ?
                  Math.atan2(50 - showerData.radiant.y, 50 - showerData.radiant.x) * 180 / Math.PI + (rng() - 0.5) * 30 :
                  30 + rng() * 60;
                const duration = 0.5 + rng() * 2; // 0.5-2.5 seconds
                const delay = rng() * 8; // 0-8 second delay
                const length = rng() > 0.9 ? 120 : 60 + rng() * 40; // Some extra long ones
                const isBright = rng() > 0.8;

                meteors.push(
                  <div
                    key={`meteor-${i}-${starSeed}-${gameTimeMinutes}`}
                    className="absolute"
                    style={{
                      top: `${startY}%`,
                      left: `${startX}%`,
                      width: isBright ? '3px' : '2px',
                      height: `${length}px`,
                      background: `linear-gradient(to bottom, ${selectedColor.color}, ${colorWithAlpha(selectedColor.trail, 0.6)}, transparent)`,
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: 'top',
                      animation: `shooting-star-enhanced ${duration}s ease-out ${delay}s`,
                      boxShadow: `0 0 ${isBright ? 10 : 6}px ${selectedColor.color}, 0 0 ${isBright ? 20 : 12}px ${selectedColor.trail}`,
                      filter: isBright ? 'brightness(1.5)' : 'none',
                      opacity: 0
                    }}
                  />
                );
              }
            }

            return (
              <>
                {meteors}
                {showerData.name && (
                  <div
                    className="absolute top-8 right-8 text-white text-sm pointer-events-none"
                    style={{
                      textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.7)',
                      fontFamily: 'serif',
                      letterSpacing: '1px',
                      opacity: 0.7
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{showerData.name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                      {showerData.intensity > 8 ? 'Peak Activity' : 'Active'}
                    </div>
                  </div>
                )}
                <style jsx>{`
                  @keyframes shooting-star-enhanced {
                    0% {
                      opacity: 0;
                      transform: rotate(var(--angle, 45deg)) translateY(0) scaleY(0);
                    }
                    10% {
                      opacity: 1;
                      transform: rotate(var(--angle, 45deg)) translateY(0) scaleY(0.5);
                    }
                    90% {
                      opacity: 1;
                      transform: rotate(var(--angle, 45deg)) translateY(300px) scaleY(1);
                    }
                    100% {
                      opacity: 0;
                      transform: rotate(var(--angle, 45deg)) translateY(400px) scaleY(0.5);
                    }
                  }
                `}</style>
              </>
            );
          })()}
        </div>
      )}

      {/* ------------------------------- SUN -------------------------------- */}
      {celestialPosition.sunVisible && !isSnowing && (
        <div
          className="absolute transition-transform duration-[2600ms] ease-in-out"
          style={{
            left: `${celestialPosition.sunPosition.x}px`,
            top: `${celestialPosition.sunPosition.y}px`,
            transform: 'translate(-50%, -50%)',
            opacity: isRaining ? 0.45 : getSunColors.dim
          }}
        >
          {/* Horizon extinction bands (only near horizon, clearer when not raining) */}
          {celestialPosition.sunNearHorizon && !isRaining && (
            <>
              <div
                aria-hidden
                className="absolute"
                style={{
                  width: `${160 + (1 - celestialPosition.sunHorizonProgress) * 110}px`,
                  height: '4px',
                  background: `linear-gradient(90deg, transparent, ${colorWithAlpha(getSunColors.core, 0.28)}, transparent)`,
                  left: '50%',
                  top: '46%',
                  transform: 'translate(-50%, -50%)',
                  filter: 'blur(1px)',
                  opacity: (1 - celestialPosition.sunHorizonProgress) * 0.9
                }}
              />
              <div
                aria-hidden
                className="absolute"
                style={{
                  width: `${130 + (1 - celestialPosition.sunHorizonProgress) * 90}px`,
                  height: '3px',
                  background: `linear-gradient(90deg, transparent, ${colorWithAlpha(getSunColors.glow, 0.22)}, transparent)`,
                  left: '50%',
                  top: '54%',
                  transform: 'translate(-50%, -50%)',
                  filter: 'blur(1px)',
                  opacity: (1 - celestialPosition.sunHorizonProgress) * 0.6
                }}
              />
            </>
          )}

          {/* Multi-layered sun glow for more beauty */}
          {/* Outer corona */}
          <div
            aria-hidden
            className="absolute animate-pulse"
            style={{
              width: celestialPosition.sunNearHorizon ? `${200 + (1 - celestialPosition.sunHorizonProgress) * 150}px` : '200px',
              height: celestialPosition.sunNearHorizon ? `${180 + (1 - celestialPosition.sunHorizonProgress) * 100}px` : '200px',
              background: `radial-gradient(circle, ${colorWithAlpha(getSunColors.glow, 0.15)} 0%, ${colorWithAlpha(getSunColors.glow, 0.05)} 40%, transparent 70%)`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              filter: `blur(30px)`,
              animationDuration: '8s'
            }}
          />

          {/* Middle glow */}
          <div
            aria-hidden
            className="absolute"
            style={{
              width:
                celestialPosition.sunNearHorizon ? `${130 + (1 - celestialPosition.sunHorizonProgress) * 100}px` : `${Math.max(110, width * 0.09)}px`,
              height:
                celestialPosition.sunNearHorizon ? `${110 + (1 - celestialPosition.sunHorizonProgress) * 70}px` : `${Math.max(110, width * 0.09)}px`,
              background: celestialPosition.sunNearHorizon
                ? `radial-gradient(ellipse, ${colorWithAlpha(getSunColors.glow, 0.4)} 0%, ${colorWithAlpha(
                    getSunColors.core,
                    0.2
                  )} 45%, transparent 70%)`
                : `radial-gradient(circle, ${colorWithAlpha(getSunColors.glow, 0.35)} 0%, transparent 68%)`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              filter: `blur(${20 + (1 - (celestialPosition.sunHorizonProgress || 1)) * 16}px)`
            }}
          />

          {/* Inner bright glow */}
          <div
            aria-hidden
            className="absolute"
            style={{
              width: celestialPosition.sunNearHorizon ? `${70 + (1 - celestialPosition.sunHorizonProgress) * 40}px` : '70px',
              height: celestialPosition.sunNearHorizon ? `${65 + (1 - celestialPosition.sunHorizonProgress) * 30}px` : '70px',
              background: `radial-gradient(circle, ${getSunColors.core} 0%, ${colorWithAlpha(getSunColors.glow, 0.8)} 50%, transparent 100%)`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(8px)'
            }}
          />

          {/* Sun core */}
          <div
            aria-hidden
            style={{
              width: celestialPosition.sunNearHorizon ? `${44 + (1 - celestialPosition.sunHorizonProgress) * 24}px` : '44px',
              height: celestialPosition.sunNearHorizon ? `${40 + (1 - celestialPosition.sunHorizonProgress) * 14}px` : '44px',
              borderRadius: celestialPosition.sunNearHorizon ? '50% / 45%' : '50%',
              background: `radial-gradient(ellipse, ${getSunColors.core} 0%, ${getSunColors.core}ee 62%, ${colorWithAlpha(
                getSunColors.glow,
                0.78
              )} 86%, ${colorWithAlpha(getSunColors.glow, 0.55)} 100%)`,
              boxShadow: `0 0 ${celestialPosition.sunNearHorizon ? 56 : 40}px ${colorWithAlpha(
                getSunColors.core,
                0.6
              )}, 0 0 ${celestialPosition.sunNearHorizon ? 110 : 80}px ${colorWithAlpha(getSunColors.glow, 0.4)}`
            }}
          />

          {/* Gentle rays at dawn/dusk (hidden in rain) */}
          {!isRaining && (timeOfDay === 'Dawn' || timeOfDay === 'Dusk') && (
            <svg
              aria-hidden
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{ position: 'absolute', left: '-80px', top: '-80px', opacity: 0.28 * getSunColors.dim }}
            >
              {[0, 30, 60, 90, 120, 150].map((angle) => (
                <line
                  key={angle}
                  x1="100"
                  y1="100"
                  x2={100 + Math.cos((angle * Math.PI) / 180) * 100}
                  y2={100 + Math.sin((angle * Math.PI) / 180) * 100}
                  stroke={colorWithAlpha(getSunColors.glow, 0.6)}
                  strokeWidth="2"
                  opacity="0.6"
                />
              ))}
            </svg>
          )}
        </div>
      )}

      {/* -------------------------------- RAINBOW ----------------------------- */}
      {/* Rainbow appears when sun is out after rain */}
      {celestialPosition.sunVisible &&
       weather?.precipitation === 'none' &&
       weather?.previousPrecipitation === 'rain' &&
       cloudIntensity < 0.5 && (
        <div
          className="absolute pointer-events-none"
          style={{
            // Rainbow appears opposite the sun (antisolar point)
            left: width - celestialPosition.sunPosition.x,
            top: celestialPosition.sunPosition.y - height * 0.1,
            transform: 'translate(-50%, -50%)',
            opacity: 0.6 * (1 - cloudIntensity)
          }}
        >
          {/* Primary rainbow arc */}
          <svg
            width={width * 0.8}
            height={height * 0.5}
            viewBox="0 0 800 400"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <defs>
              <radialGradient id="rainbow-gradient" cx="50%" cy="100%" r="100%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="70%" stopColor="transparent" />
                <stop offset="72%" stopColor="#FF0000" stopOpacity="0.4" />
                <stop offset="74%" stopColor="#FF7F00" stopOpacity="0.4" />
                <stop offset="76%" stopColor="#FFFF00" stopOpacity="0.4" />
                <stop offset="78%" stopColor="#00FF00" stopOpacity="0.4" />
                <stop offset="80%" stopColor="#0000FF" stopOpacity="0.4" />
                <stop offset="82%" stopColor="#4B0082" stopOpacity="0.4" />
                <stop offset="84%" stopColor="#9400D3" stopOpacity="0.4" />
                <stop offset="86%" stopColor="transparent" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
              {/* Double rainbow (fainter, reversed colors) */}
              <radialGradient id="double-rainbow-gradient" cx="50%" cy="100%" r="100%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="86%" stopColor="transparent" />
                <stop offset="88%" stopColor="#9400D3" stopOpacity="0.15" />
                <stop offset="89%" stopColor="#4B0082" stopOpacity="0.15" />
                <stop offset="90%" stopColor="#0000FF" stopOpacity="0.15" />
                <stop offset="91%" stopColor="#00FF00" stopOpacity="0.15" />
                <stop offset="92%" stopColor="#FFFF00" stopOpacity="0.15" />
                <stop offset="93%" stopColor="#FF7F00" stopOpacity="0.15" />
                <stop offset="94%" stopColor="#FF0000" stopOpacity="0.15" />
                <stop offset="96%" stopColor="transparent" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            {/* Primary rainbow */}
            <ellipse
              cx="400"
              cy="400"
              rx="380"
              ry="380"
              fill="url(#rainbow-gradient)"
              style={{
                filter: 'blur(2px)'
              }}
            />

            {/* Double rainbow */}
            {((starSeed % 100) > 60) && (
              <ellipse
                cx="400"
                cy="400"
                rx="420"
                ry="420"
                fill="url(#double-rainbow-gradient)"
                style={{
                  filter: 'blur(3px)'
                }}
              />
            )}
          </svg>
        </div>
      )}

      {/* ---------------------------- AURORA BOREALIS ------------------------ */}
      {/* Aurora appears in cold climates at night, or temperate climates in winter */}
      {timeOfDay === 'Night' &&
       starVisibility > 0.5 &&
       cloudIntensity < 0.4 &&
       (climate === 'COLD' || (climate === 'TEMPERATE' && (gameMonth >= 11 || gameMonth <= 2))) &&
       ((starSeed % 100) < 30) && ( // 30% chance on clear nights (deterministic)
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 2 }}
        >
          {/* Aurora curtains */}
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: '60%',
              background: 'linear-gradient(180deg, transparent 0%, transparent 40%, rgba(0, 255, 150, 0.05) 70%, transparent 100%)',
              animation: 'aurora-wave 20s ease-in-out infinite'
            }}
          />

          {/* Multiple aurora bands */}
          {[
            { color: '#00FF96', opacity: 0.15, delay: 0, height: 45 },
            { color: '#00FFFF', opacity: 0.12, delay: 2, height: 40 },
            { color: '#9400D3', opacity: 0.08, delay: 4, height: 35 },
            { color: '#00FF00', opacity: 0.18, delay: 1, height: 50 }
          ].map((band, i) => (
            <svg
              key={`aurora-band-${i}`}
              className="absolute"
              width={width}
              height={height * 0.6}
              style={{
                top: 0,
                left: 0,
                opacity: band.opacity,
                animation: `aurora-shimmer ${15 + i * 3}s ease-in-out ${band.delay}s infinite`
              }}
            >
              <defs>
                <linearGradient id={`aurora-gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="30%" stopColor={band.color} stopOpacity="0.1" />
                  <stop offset="50%" stopColor={band.color} stopOpacity="0.3" />
                  <stop offset="70%" stopColor={band.color} stopOpacity="0.1" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>

              {/* Wavy curtain effect */}
              <path
                d={`
                  M 0 ${height * 0.1}
                  Q ${width * 0.25} ${height * 0.15 + Math.sin(i) * 20}
                    ${width * 0.5} ${height * 0.1}
                  T ${width} ${height * 0.1}
                  L ${width} ${height * (band.height / 100)}
                  Q ${width * 0.75} ${height * (band.height / 100) + Math.cos(i) * 15}
                    ${width * 0.5} ${height * (band.height / 100)}
                  T 0 ${height * (band.height / 100)}
                  Z
                `}
                fill={`url(#aurora-gradient-${i})`}
                style={{
                  filter: `blur(${8 + i * 2}px)`
                }}
              />
            </svg>
          ))}

          {/* Aurora glow on ground */}
          <div
            className="absolute bottom-0 inset-x-0"
            style={{
              height: '30%',
              background: 'radial-gradient(ellipse at center top, rgba(0, 255, 150, 0.03) 0%, transparent 50%)',
              animation: 'aurora-pulse 12s ease-in-out infinite'
            }}
          />

          <style jsx>{`
            @keyframes aurora-wave {
              0%, 100% { transform: translateY(0) scaleY(1); }
              50% { transform: translateY(-10px) scaleY(1.1); }
            }
            @keyframes aurora-shimmer {
              0%, 100% {
                opacity: var(--opacity);
                transform: translateX(0) scaleX(1);
              }
              25% {
                opacity: calc(var(--opacity) * 1.3);
                transform: translateX(-20px) scaleX(1.05);
              }
              50% {
                opacity: calc(var(--opacity) * 0.7);
                transform: translateX(20px) scaleX(0.95);
              }
              75% {
                opacity: calc(var(--opacity) * 1.2);
                transform: translateX(-10px) scaleX(1.02);
              }
            }
            @keyframes aurora-pulse {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 0.8; }
            }
          `}</style>
        </div>
      )}

      {/* -------------------------------- COMETS ------------------------------ */}
      {/* Historical comets based on actual recorded appearances */}
      {(() => {
        // Historical comet data (year, month, duration in days, name, brightness)
        const historicalComets = [
          { year: 1066, month: 4, duration: 30, name: "Halley's Comet", brightness: 0.9 },
          { year: 1301, month: 10, duration: 25, name: "Halley's Comet", brightness: 0.85 },
          { year: 1378, month: 11, duration: 20, name: "Comet of 1378", brightness: 0.7 },
          { year: 1456, month: 6, duration: 40, name: "Halley's Comet", brightness: 0.95 },
          { year: 1472, month: 1, duration: 60, name: "Great Comet of 1472", brightness: 1.0 },
          { year: 1531, month: 8, duration: 30, name: "Halley's Comet", brightness: 0.8 },
          { year: 1556, month: 3, duration: 15, name: "Comet of 1556", brightness: 0.6 },
          { year: 1577, month: 11, duration: 50, name: "Great Comet of 1577", brightness: 0.95 },
          { year: 1607, month: 10, duration: 25, name: "Halley's Comet", brightness: 0.75 },
          { year: 1618, month: 11, duration: 45, name: "Great Comet of 1618", brightness: 0.9 },
          { year: 1664, month: 12, duration: 35, name: "Great Comet of 1664", brightness: 0.85 },
          { year: 1680, month: 12, duration: 40, name: "Great Comet of 1680", brightness: 0.95 },
          { year: 1682, month: 9, duration: 30, name: "Halley's Comet", brightness: 0.8 },
          { year: 1744, month: 3, duration: 60, name: "Comet Klinkenberg", brightness: 1.0 },
          { year: 1758, month: 12, duration: 25, name: "Halley's Comet", brightness: 0.75 },
          { year: 1811, month: 9, duration: 90, name: "Great Comet of 1811", brightness: 1.0 },
          { year: 1835, month: 11, duration: 30, name: "Halley's Comet", brightness: 0.8 },
          { year: 1858, month: 9, duration: 40, name: "Donati's Comet", brightness: 0.9 },
          { year: 1882, month: 9, duration: 50, name: "Great September Comet", brightness: 0.95 },
          { year: 1910, month: 5, duration: 35, name: "Halley's Comet", brightness: 0.85 }
        ];

        // Check if a comet should be visible
        const visibleComet = historicalComets.find(comet => {
          const yearMatch = Math.abs(gameYear - comet.year) < 1;
          const monthMatch = Math.abs(gameMonth - comet.month) < 2;
          const dayInRange = gameDay <= comet.duration;
          return yearMatch && monthMatch && dayInRange;
        });

        if (!visibleComet || cloudIntensity > 0.6) return null;
        if (timeOfDay !== 'Night' && timeOfDay !== 'Dusk' && timeOfDay !== 'Dawn') return null;

        // Calculate comet position (moves slowly across sky over duration)
        const progress = gameDay / visibleComet.duration;
        const cometX = width * lerp(0.85, 0.15, progress);
        const cometY = height * (0.2 + Math.sin(progress * Math.PI) * 0.1);

        // Tail always points away from sun
        const tailAngle = celestialPosition.sunVisible ?
          Math.atan2(cometY - celestialPosition.sunPosition.y, cometX - celestialPosition.sunPosition.x) :
          Math.PI * 0.25; // Default angle when sun not visible

        return (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${cometX}px`,
              top: `${cometY}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}
          >
            {/* Comet tail */}
            <svg
              width="300"
              height="150"
              style={{
                position: 'absolute',
                left: '-150px',
                top: '-75px',
                transform: `rotate(${tailAngle * 180 / Math.PI}deg)`,
                transformOrigin: '150px 75px'
              }}
            >
              <defs>
                <linearGradient id="comet-tail-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.6 * visibleComet.brightness} />
                  <stop offset="30%" stopColor="#87CEEB" stopOpacity={0.3 * visibleComet.brightness} />
                  <stop offset="60%" stopColor="#4682B4" stopOpacity={0.1 * visibleComet.brightness} />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <radialGradient id="comet-dust-gradient">
                  <stop offset="0%" stopColor="#FFE4B5" stopOpacity={0.4 * visibleComet.brightness} />
                  <stop offset="50%" stopColor="#FFDAA0" stopOpacity={0.2 * visibleComet.brightness} />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              {/* Ion tail (blue) */}
              <path
                d="M 150 75 L 10 65 L 5 75 L 10 85 Z"
                fill="url(#comet-tail-gradient)"
                style={{ filter: 'blur(2px)' }}
              />

              {/* Dust tail (yellowish) */}
              <path
                d="M 150 75 L 20 70 L 15 75 L 20 80 Z"
                fill="url(#comet-dust-gradient)"
                style={{ filter: 'blur(3px)' }}
              />
            </svg>

            {/* Comet coma and nucleus */}
            <div
              className="absolute"
              style={{
                width: '20px',
                height: '20px',
                background: `radial-gradient(circle, #FFFFFF ${50 * visibleComet.brightness}%, #87CEEB ${70 * visibleComet.brightness}%, transparent)`,
                borderRadius: '50%',
                boxShadow: `0 0 ${30 * visibleComet.brightness}px #FFFFFF, 0 0 ${60 * visibleComet.brightness}px #87CEEB`,
                filter: 'blur(1px)'
              }}
            />

            {/* Bright nucleus */}
            <div
              className="absolute"
              style={{
                width: '6px',
                height: '6px',
                left: '7px',
                top: '7px',
                background: '#FFFFFF',
                borderRadius: '50%',
                boxShadow: `0 0 10px #FFFFFF`
              }}
            />

            {/* Comet label */}
            {visibleComet.brightness > 0.8 && (
              <div
                className="absolute"
                style={{
                  top: '40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '11px',
                  fontFamily: 'serif',
                  textShadow: '0 0 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none'
                }}
              >
                {visibleComet.name}
              </div>
            )}
          </div>
        );
      })()}

      {/* -------------------------------- MOON ------------------------------- */}
      {celestialPosition.moonVisible && (() => {
        // Calculate moon phase description
        const getMoonPhaseDescription = () => {
          const phase = celestialPosition.moonPhase;
          if (phase < 0.05 || phase > 0.95) return "New Moon";
          if (phase < 0.2) return "Waxing Crescent";
          if (phase < 0.3) return "First Quarter";
          if (phase < 0.45) return "Waxing Gibbous";
          if (phase < 0.55) return "Full Moon";
          if (phase < 0.7) return "Waning Gibbous";
          if (phase < 0.8) return "Last Quarter";
          return "Waning Crescent";
        };

        return (
          <div
            className="absolute transition-transform duration-[2600ms] ease-in-out"
            style={{
              left: `${celestialPosition.moonPosition.x}px`,
              top: `${celestialPosition.moonPosition.y}px`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
            onMouseEnter={() => setIsMoonHovered(true)}
            onMouseLeave={() => setIsMoonHovered(false)}
          >
          {/* Horizon bands for moon */}
          {celestialPosition.moonNearHorizon && (
            <>
              <div
                aria-hidden
                className="absolute"
                style={{
                  width: `${80 + (1 - celestialPosition.moonHorizonProgress) * 60}px`,
                  height: '2px',
                  background: `linear-gradient(90deg, transparent, ${colorWithAlpha(moonColor, 0.12)}, transparent)`,
                  left: '50%',
                  top: '45%',
                  transform: 'translate(-50%, -50%)',
                  filter: 'blur(1px)',
                  opacity: 1 - celestialPosition.moonHorizonProgress
                }}
              />
              <div
                aria-hidden
                className="absolute"
                style={{
                  width: `${60 + (1 - celestialPosition.moonHorizonProgress) * 40}px`,
                  height: '2px',
                  background: `linear-gradient(90deg, transparent, ${colorWithAlpha(moonGlowColor, 0.1)}, transparent)`,
                  left: '50%',
                  top: '55%',
                  transform: 'translate(-50%, -50%)',
                  filter: 'blur(1px)',
                  opacity: (1 - celestialPosition.moonHorizonProgress) * 0.5
                }}
              />
            </>
          )}

          {/* Enhanced Moon glow layers */}
          {/* Outer lunar halo (ice crystals effect on cold nights) */}
          {cloudIntensity < 0.3 && (
            <div
              aria-hidden
              className="absolute animate-pulse"
              style={{
                width: '140px',
                height: '140px',
                background: `radial-gradient(circle, transparent 30%, ${colorWithAlpha(moonGlowColor, 0.08)} 45%, transparent 55%, ${colorWithAlpha(moonGlowColor, 0.05)} 65%, transparent 70%)`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'blur(2px)',
                animationDuration: '12s'
              }}
            />
          )}

          {/* Main moon glow */}
          <div
            aria-hidden
            className="absolute"
            style={{
              width: celestialPosition.moonNearHorizon ? `${52 + (1 - celestialPosition.moonHorizonProgress) * 40}px` : '52px',
              height: celestialPosition.moonNearHorizon ? `${52 + (1 - celestialPosition.moonHorizonProgress) * 22}px` : '52px',
              background: celestialPosition.moonNearHorizon
                ? `radial-gradient(ellipse, ${colorWithAlpha(moonGlowColor, 0.25)} 0%, ${colorWithAlpha(
                    moonColor,
                    0.1
                  )} 40%, transparent 72%)`
                : `radial-gradient(circle, ${colorWithAlpha(moonColor, 0.15)} 0%, transparent 60%)`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              filter: `blur(${12 + (1 - (celestialPosition.moonHorizonProgress || 1)) * 12}px)`
            }}
          />

          {/* Moon w/ realistic phase & rotated terminator */}
          <svg
            width={celestialPosition.moonNearHorizon ? `${60 + (1 - celestialPosition.moonHorizonProgress) * 20}` : '50'}
            height={celestialPosition.moonNearHorizon ? `${60 + (1 - celestialPosition.moonHorizonProgress) * 15}` : '50'}
            viewBox="0 0 30 30"
            style={{
              position: 'relative',
              filter: `drop-shadow(0 0 ${10 + (1 - (celestialPosition.moonHorizonProgress || 1)) * 16}px ${colorWithAlpha(
                moonGlowColor,
                0.28
              )})`
            }}
          >
            <defs>
              <mask id={moonMaskId}>
                <rect x="0" y="0" width="30" height="30" fill="black" />
                <circle cx="15" cy="15" r="14" fill="white" />
                {/* Improved phase shadow rendering */}
                {(() => {
                  const phase = celestialPosition.moonPhase;

                  if (phase < 0.02 || phase > 0.98) {
                    // New moon - fully dark
                    return <circle cx="15" cy="15" r="14" fill="black" />;
                  } else if (Math.abs(phase - 0.5) < 0.02) {
                    // Full moon - no shadow
                    return null;
                  } else if (phase < 0.5) {
                    // Waxing phases (right side lit)
                    const ellipseWidth = Math.abs(Math.cos(phase * Math.PI * 2)) * 14;
                    const isGrowing = phase < 0.25;

                    return (
                      <g>
                        {/* Dark left half */}
                        <rect x="0" y="0" width="15" height="30" fill="black" />
                        {/* Elliptical terminator */}
                        <ellipse
                          cx="15"
                          cy="15"
                          rx={ellipseWidth}
                          ry="14"
                          fill={isGrowing ? "black" : "white"}
                        />
                      </g>
                    );
                  } else {
                    // Waning phases (left side lit)
                    const ellipseWidth = Math.abs(Math.cos(phase * Math.PI * 2)) * 14;
                    const isShrinking = phase > 0.75;

                    return (
                      <g>
                        {/* Dark right half */}
                        <rect x="15" y="0" width="15" height="30" fill="black" />
                        {/* Elliptical terminator */}
                        <ellipse
                          cx="15"
                          cy="15"
                          rx={ellipseWidth}
                          ry="14"
                          fill={isShrinking ? "black" : "white"}
                        />
                      </g>
                    );
                  }
                })()}
              </mask>
            </defs>

            {/* Lit disc */}
            <circle cx="15" cy="15" r="14" fill={moonColor} mask={`url(#${moonMaskId})`} />
            {/* Gentle limb shading */}
            <radialGradient id="moonShade">
              <stop offset="60%" stopColor={colorWithAlpha('#000', 0)} />
              <stop offset="100%" stopColor={colorWithAlpha('#000', 0.18)} />
            </radialGradient>
            <circle cx="15" cy="15" r="14" fill="url(#moonShade)" mask={`url(#${moonMaskId})`} />

            {/* Enhanced craters and surface features */}
            {/* Mare (dark seas) */}
            <ellipse cx="12" cy="10" rx="4" ry="3" fill="#C8C8C8" opacity="0.2" mask={`url(#${moonMaskId})`} />
            <ellipse cx="18" cy="18" rx="3" ry="2.5" fill="#D0D0D0" opacity="0.15" mask={`url(#${moonMaskId})`} />

            {/* Individual craters with depth */}
            {[
              { cx: 11, cy: 12, r: 1.8, o: 0.22, inner: true },
              { cx: 18, cy: 16, r: 1.2, o: 0.18, inner: false },
              { cx: 14, cy: 19, r: 1.0, o: 0.16, inner: true },
              { cx: 8, cy: 8, r: 0.8, o: 0.14, inner: false },
              { cx: 22, cy: 11, r: 0.6, o: 0.12, inner: false },
              { cx: 16, cy: 8, r: 0.7, o: 0.13, inner: true }
            ].map((c, i) => (
              <g key={i}>
                <circle cx={c.cx} cy={c.cy} r={c.r} fill="#BDBDBD" opacity={c.o} mask={`url(#${moonMaskId})`} />
                {c.inner && (
                  <circle cx={c.cx + 0.2} cy={c.cy + 0.2} r={c.r * 0.4} fill="#A0A0A0" opacity={c.o * 0.7} mask={`url(#${moonMaskId})`} />
                )}
              </g>
            ))}
          </svg>

          {/* Moon hover label */}
          {isMoonHovered && (
            <div
              className="absolute"
              style={{
                bottom: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.85)',
                color: '#FFF7D6',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                textShadow: '0 0 4px rgba(255, 247, 214, 0.5)',
                border: '1px solid rgba(255, 247, 214, 0.3)',
                zIndex: 1000,
                pointerEvents: 'none'
              }}
            >
              <div>Moon</div>
              <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
                {getMoonPhaseDescription()}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '1px' }}>
                Day {Math.floor(((gameDay % 29.5) + 29.5) % 29.5)} of cycle
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* ------------------------------ PLANETS ------------------------------- */}
      {planetPositions.map((p, i) => {
        const isHovered = planetHoverStates[i] || false;
        const setIsHovered = (hovered: boolean) => {
          setPlanetHoverStates(prev => {
            const newStates = [...prev];
            newStates[i] = hovered;
            return newStates;
          });
        };

        return (
          <div
            key={`planet-${p.name}-${i}`}
            className="absolute"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              transform: 'translate(-50%, -50%)',
              opacity: clamp((p.opacity ?? 1) * (timeOfDay === 'Dusk' ? 0.85 : 1), 0, 1),
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Outer glow - more prominent */}
            <div
              aria-hidden
              className="absolute animate-pulse"
              style={{
                width: `${p.size * 8}px`,
                height: `${p.size * 8}px`,
                background: `radial-gradient(circle, ${colorWithAlpha(p.glow, 0.25)} 0%, ${colorWithAlpha(p.glow, 0.1)} 40%, transparent 70%)`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'blur(4px)',
                animationDuration: '4s'
              }}
            />

            {/* Inner glow */}
            <div
              aria-hidden
              className="absolute"
              style={{
                width: `${p.size * 4}px`,
                height: `${p.size * 4}px`,
                background: `radial-gradient(circle, ${colorWithAlpha(p.glow, 0.4)} 0%, transparent 60%)`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'blur(2px)'
              }}
            />

            {/* Planet body */}
            <div
              aria-hidden
              className="relative"
              style={{
                width: `${p.size * 2}px`,
                height: `${p.size * 2}px`,
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${p.color}, ${colorWithAlpha(p.color, 0.8)})`,
                boxShadow: `0 0 ${p.size * 3}px ${colorWithAlpha(p.glow, 0.6)}, 0 0 ${p.size * 6}px ${colorWithAlpha(p.glow, 0.3)}`,
                transition: 'transform 0.3s ease'
              }}
            >
              {/* Saturn's rings */}
              {p.name === 'Saturn' && (
                <div
                  className="absolute"
                  style={{
                    width: `${p.size * 3.5}px`,
                    height: `${p.size * 1.2}px`,
                    border: `2px solid ${colorWithAlpha(p.color, 0.6)}`,
                    borderRadius: '50%',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotateX(70deg)',
                    boxShadow: `0 0 ${p.size}px ${colorWithAlpha(p.glow, 0.3)}`
                  }}
                />
              )}
            </div>

            {/* Hover label */}
            {isHovered && (
              <div
                className="absolute"
                style={{
                  bottom: `${-p.size * 4}px`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: p.glow,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  textShadow: `0 0 4px ${p.glow}`,
                  border: `1px solid ${colorWithAlpha(p.glow, 0.3)}`,
                  zIndex: 1000,
                  pointerEvents: 'none'
                }}
              >
                <div>{p.name}</div>
                {p.description && (
                  <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                    {p.description}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ----------------------------- NAMED STARS ---------------------------- */}
      {starVisibility > 0 && namedStars.map((star, i) => {
        const isHovered = namedStarHoverStates[i] || false;
        const setIsHovered = (hovered: boolean) => {
          setNamedStarHoverStates(prev => {
            const newStates = [...prev];
            newStates[i] = hovered;
            return newStates;
          });
        };

        return (
          <div
            key={`named-star-${star.name}-${i}`}
            className="absolute"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              transform: 'translate(-50%, -50%)',
              opacity: starVisibility * star.brightness,
              cursor: 'pointer',
              pointerEvents: 'auto',
              zIndex: 1
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Outer glow (brightness-scaled) */}
            <div
              aria-hidden
              style={{
                width: `${star.size * 10 * star.brightness}px`,
                height: `${star.size * 10 * star.brightness}px`,
                background: `radial-gradient(circle, ${colorWithAlpha(star.glow, 0.4 * star.brightness)} 0%, ${colorWithAlpha(star.glow, 0.1 * star.brightness)} 50%, transparent 80%)`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'blur(3px)',
                position: 'absolute'
              }}
            />

            {/* Star rays (4-pointed cross pattern) */}
            <div
              aria-hidden
              style={{
                width: `${star.size * 8}px`,
                height: `${star.size * 8}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                position: 'absolute'
              }}
            >
              {/* Horizontal ray */}
              <div style={{
                position: 'absolute',
                left: '0',
                top: '50%',
                width: '100%',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${colorWithAlpha(star.color, 0.8)} 50%, transparent)`,
                boxShadow: `0 0 ${star.size * 2}px ${colorWithAlpha(star.glow, 0.6)}`,
                transform: 'translateY(-50%)'
              }} />
              {/* Vertical ray */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '0',
                width: '1px',
                height: '100%',
                background: `linear-gradient(180deg, transparent, ${colorWithAlpha(star.color, 0.8)} 50%, transparent)`,
                boxShadow: `0 0 ${star.size * 2}px ${colorWithAlpha(star.glow, 0.6)}`,
                transform: 'translateX(-50%)'
              }} />
              {/* Diagonal ray 1 */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${Math.sqrt(2) * 100}%`,
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${colorWithAlpha(star.color, 0.5)} 50%, transparent)`,
                boxShadow: `0 0 ${star.size}px ${colorWithAlpha(star.glow, 0.4)}`,
                transform: 'translate(-50%, -50%) rotate(45deg)',
                opacity: 0.7
              }} />
              {/* Diagonal ray 2 */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${Math.sqrt(2) * 100}%`,
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${colorWithAlpha(star.color, 0.5)} 50%, transparent)`,
                boxShadow: `0 0 ${star.size}px ${colorWithAlpha(star.glow, 0.4)}`,
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                opacity: 0.7
              }} />
            </div>

            {/* Star core (small point) */}
            <div
              aria-hidden
              style={{
                width: `${star.size * 3}px`,
                height: `${star.size * 3}px`,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${star.color}, ${colorWithAlpha(star.color, 0.85)})`,
                boxShadow: `0 0 ${star.size * 6 * star.brightness}px ${colorWithAlpha(star.glow, 0.8 * star.brightness)}, 0 0 ${star.size * 3}px ${colorWithAlpha(star.color, 0.9)}, inset 0 0 ${star.size}px ${colorWithAlpha('#FFFFFF', 0.4)}`,
                position: 'relative',
                filter: `brightness(${1 + star.brightness * 0.2})`
              }}
            />

            {/* Hover label */}
            {isHovered && (
              <div
                className="absolute"
                style={{
                  bottom: `${-star.size * 8}px`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.95)',
                  color: star.color,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  textShadow: `0 0 8px ${star.glow}, 0 0 4px ${star.color}`,
                  border: `1.5px solid ${colorWithAlpha(star.glow, 0.5)}`,
                  boxShadow: `0 0 12px ${colorWithAlpha(star.glow, 0.3)}, inset 0 0 8px ${colorWithAlpha(star.glow, 0.1)}`,
                  zIndex: 1000,
                  pointerEvents: 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: star.color,
                    boxShadow: `0 0 6px ${star.glow}`
                  }} />
                  {star.name}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '3px', color: '#E0E0E0' }}>
                  {star.description}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* -------------------------------- STARS ------------------------------- */}
      {starVisibility > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: starVisibility, zIndex: 0 }}>
          {stars.map((st, i) => (
            <div
              key={`star-${i}`}
              aria-hidden
              style={{
                position: 'absolute',
                left: `${st.x}px`,
                top: `${st.y}px`,
                width: `${st.s}px`,
                height: `${st.s}px`,
                borderRadius: '50%',
                background: '#FFFFFF',
                opacity: st.o,
                animation: `twinkle ${st.tw}s ease-in-out infinite`,
                boxShadow: `0 0 ${st.s * 2}px rgba(255,255,255,0.85)`
              }}
            />
          ))}
          <style jsx="true">{`
            @keyframes twinkle {
              0% { transform: scale(1); opacity: 0.7; }
              50% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(1); opacity: 0.7; }
            }
          `}</style>
        </div>
      )}

      {/* ------------------------------- SNOW -------------------------------- */}
      {isSnowing && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          {Array.from({ length: Math.round(120 + 120 * precipIntensity) }, (_, i) => {
            // spread and drift; random but stable enough per render
            const rng = mulberry32(starSeed + i * 13);
            const x = rng() * width;
            const startY = -20 - rng() * 60;
            const size = 0.8 + rng() * 2.2;
            const duration = 8 + rng() * 12;
            const delay = rng() * duration;
            const drift = 20 + rng() * 40;
            return (
              <div
                key={`snow-${i}`}
                className="absolute"
                style={{
                  left: `${x}px`,
                  top: `${startY}px`,
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow: `0 0 ${size}px rgba(255,255,255,0.5)`,
                  animation: `snowfall ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                  // @ts-ignore – CSS var assignment
                  '--drift': `${drift}px`
                } as React.CSSProperties}
              />
            );
          })}
          <style jsx="true">{`
            @keyframes snowfall {
              0%   { transform: translateY(0) translateX(0);   opacity: 0; }
              10%  { opacity: 1; }
              90%  { opacity: 1; }
              100% { transform: translateY(${height + 40}px) translateX(var(--drift)); opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default CelestialBodies;
