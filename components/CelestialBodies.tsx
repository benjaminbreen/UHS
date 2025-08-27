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
  } | null;
  gameDay?: number;
  gameMonth?: number;
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
  gameMonth = 1
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
    if (timeOfDay !== 'Night' && timeOfDay !== 'Dusk') return [];
    const planets: { name: string; x: number; y: number; size: number; color: string; glow: string; opacity?: number }[] = [];
    const bandY = height * 0.18; // base ecliptic height
    const eclipticAmp = height * 0.06 * (1 + 0.3 * Math.cos(month01 * 2 * Math.PI));

    // Helper to place a body along ecliptic-ish band from east→west
    const place = (t: number, offset = 0) => {
      const x = width * lerp(0.82, 0.18, clamp(t + offset, 0, 1));
      const y = bandY + Math.sin((t + offset) * Math.PI) * eclipticAmp;
      return { x, y };
    };

    // Visibility damping by clouds
    const vis = clamp(1 - cloudIntensity * 0.85, 0, 1);

    // Venus (evening star half the year; bright)
    if (((gameMonth + 3) % 12) < 6) {
      const p = place(0.28, 0.05);
      planets.push({ name: 'Venus', x: p.x, y: p.y, size: 4, color: '#FFF8DC', glow: '#FFFACD', opacity: vis });
    }

    // Mars (rusty)
    if (((gameMonth + 7) % 12) < 8) {
      const p = place(0.52, -0.03);
      planets.push({ name: 'Mars', x: p.x, y: p.y, size: 3, color: '#D2691E', glow: '#FF7F50', opacity: vis });
    }

    // Jupiter (bright gold)
    if (gameMonth % 12 > 2 && gameMonth % 12 < 10) {
      const p = place(0.65, 0.02);
      planets.push({ name: 'Jupiter', x: p.x, y: p.y, size: 2.5, color: '#FFD700', glow: '#FFF6A6', opacity: vis });
    }

    // Saturn (paler)
    if (((gameMonth + 5) % 12) > 4 && ((gameMonth + 5) % 12) < 11) {
      const p = place(0.38, -0.06);
      planets.push({ name: 'Saturn', x: p.x, y: p.y, size: 2, color: '#F0E68C', glow: '#FFF8C6', opacity: vis });
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

          {/* Sun glow */}
          <div
            aria-hidden
            className="absolute"
            style={{
              width:
                celestialPosition.sunNearHorizon ? `${130 + (1 - celestialPosition.sunHorizonProgress) * 100}px` : `${Math.max(110, width * 0.09)}px`,
              height:
                celestialPosition.sunNearHorizon ? `${110 + (1 - celestialPosition.sunHorizonProgress) * 70}px` : `${Math.max(110, width * 0.09)}px`,
              background: celestialPosition.sunNearHorizon
                ? `radial-gradient(ellipse, ${colorWithAlpha(getSunColors.glow, 0.32)} 0%, ${colorWithAlpha(
                    getSunColors.core,
                    0.12
                  )} 45%, transparent 70%)`
                : `radial-gradient(circle, ${colorWithAlpha(getSunColors.glow, 0.28)} 0%, transparent 68%)`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              filter: `blur(${20 + (1 - (celestialPosition.sunHorizonProgress || 1)) * 16}px)`
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

      {/* -------------------------------- MOON ------------------------------- */}
      {celestialPosition.moonVisible && (
        <div
          className="absolute transition-transform duration-[2600ms] ease-in-out"
          style={{
            left: `${celestialPosition.moonPosition.x}px`,
            top: `${celestialPosition.moonPosition.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
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

          {/* Moon glow */}
          <div
            aria-hidden
            className="absolute"
            style={{
              width: celestialPosition.moonNearHorizon ? `${52 + (1 - celestialPosition.moonHorizonProgress) * 40}px` : '52px',
              height: celestialPosition.moonNearHorizon ? `${52 + (1 - celestialPosition.moonHorizonProgress) * 22}px` : '52px',
              background: celestialPosition.moonNearHorizon
                ? `radial-gradient(ellipse, ${colorWithAlpha(moonGlowColor, 0.18)} 0%, ${colorWithAlpha(
                    moonColor,
                    0.07
                  )} 40%, transparent 72%)`
                : `radial-gradient(circle, ${colorWithAlpha(moonColor, 0.1)} 0%, transparent 60%)`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              filter: `blur(${12 + (1 - (celestialPosition.moonHorizonProgress || 1)) * 12}px)`
            }}
          />

          {/* Moon w/ realistic phase & rotated terminator */}
          <svg
            width={celestialPosition.moonNearHorizon ? `${32 + (1 - celestialPosition.moonHorizonProgress) * 16}` : '32'}
            height={celestialPosition.moonNearHorizon ? `${32 + (1 - celestialPosition.moonHorizonProgress) * 10}` : '32'}
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
                {/* Phase shadow rotated by terminator angle */}
                <g transform={`rotate(${moonTerminatorAngleDeg}, 15, 15)`}>
                  {celestialPosition.moonPhase < 0.5 ? (
                    // Waxing crescent → full
                    celestialPosition.moonPhase < 0.25 ? (
                      <ellipse
                        cx={15 + 15 * (1 - celestialPosition.moonPhase * 4)}
                        cy="15"
                        rx={14 * (1 - celestialPosition.moonPhase * 4)}
                        ry="14"
                        fill="black"
                      />
                    ) : (
                      <ellipse
                        cx={15 - 15 * ((celestialPosition.moonPhase - 0.25) * 4)}
                        cy="15"
                        rx={14 * ((celestialPosition.moonPhase - 0.25) * 4)}
                        ry="14"
                        fill="black"
                      />
                    )
                  ) : celestialPosition.moonPhase > 0.5 ? (
                    celestialPosition.moonPhase < 0.75 ? (
                      <ellipse
                        cx={15 + 15 * ((celestialPosition.moonPhase - 0.5) * 4)}
                        cy="15"
                        rx={14 * ((celestialPosition.moonPhase - 0.5) * 4)}
                        ry="14"
                        fill="black"
                      />
                    ) : (
                      <ellipse
                        cx={15 - 15 * (1 - (celestialPosition.moonPhase - 0.75) * 4)}
                        cy="15"
                        rx={14 * (1 - (celestialPosition.moonPhase - 0.75) * 4)}
                        ry="14"
                        fill="black"
                      />
                    )
                  ) : null}
                </g>
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

            {/* Subtle craters */}
            {[
              { cx: 11, cy: 12, r: 1.5, o: 0.18 },
              { cx: 18, cy: 16, r: 1.0, o: 0.15 },
              { cx: 14, cy: 19, r: 0.9, o: 0.14 }
            ].map((c, i) => (
              <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="#E6E6E6" opacity={c.o} mask={`url(#${moonMaskId})`} />
            ))}
          </svg>
        </div>
      )}

      {/* ------------------------------ PLANETS ------------------------------- */}
      {planetPositions.map((p, i) => (
        <div
          key={`planet-${p.name}-${i}`}
          className="absolute"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            transform: 'translate(-50%, -50%)',
            opacity: clamp((p.opacity ?? 1) * (timeOfDay === 'Dusk' ? 0.85 : 1), 0, 1)
          }}
          title={p.name}
        >
          <div
            aria-hidden
            className="absolute"
            style={{
              width: `${p.size * 4}px`,
              height: `${p.size * 4}px`,
              background: `radial-gradient(circle, ${colorWithAlpha(p.glow, 0.18)} 0%, transparent 70%)`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(2px)'
            }}
          />
          <div
            aria-hidden
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${colorWithAlpha(p.glow, 0.35)}`
            }}
          />
        </div>
      ))}

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
