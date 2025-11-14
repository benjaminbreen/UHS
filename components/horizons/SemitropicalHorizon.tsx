/**
 * components/horizons/SemitropicalHorizon.tsx
 *
 * Semitropical horizon — WEATHER++ edition
 * - Clearer banding (violet far hills → mangroves → palms)
 * - Full weather feature parity:
 *    • Rain: angled animated streaks, rippling puddles, wet ground sheen, lightning
 *    • Snow: rare but supported; drifting flakes + ridge/roof accumulation
 *    • Fog/Mist/Haze: density-aware bands from Weather.fx
 *    • Wind: palm/banana frond sway, whitecaps, airborne dust/pollen
 *    • Seasonal flourishes: jacaranda/cherry blossoms (fx.blossoms), leaf fall, fireflies, rainbow hint
 *    • City niceties: window glow w/ flicker at night/dusk (isUrban)
 *
 * Drop-in with other WEATHER+ horizons: accepts WeatherState from services/weatherService.
 */

import React, { useMemo } from 'react';
import { TimeOfDay } from '../../types';
import { WeatherState } from '../../services/weatherService';

interface SemitropicalHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  hasWater?: boolean;
  hasLagoon?: boolean;   // shallow central water pocket
  isUrban?: boolean;
  bottomPanelColor?: string;
  seed?: number;
  weather?: WeatherState;
  sky?: {
    top: string;
    mid: string;
    bottom: string;
    hazeDark?: string;
    hazeLight?: string;
    water?: string;
  };
}

/* --------------------------------- Utils --------------------------------- */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const p = (n: number) => Math.round(n);

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const rgbToHex = (r: number, g: number, b: number) =>
  `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
const blendHex = (a: string, b: string, t: number) => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const u = clamp01(t);
  return rgbToHex(
    Math.round(ar + (br - ar) * u),
    Math.round(ag + (bg - ag) * u),
    Math.round(ab + (bb - ab) * u)
  );
};

// rng
const mulberry32 = (a: number) => {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const WINDY_KMH = 18;

/* -------------------------------- Component ------------------------------- */

const SemitropicalHorizon: React.FC<SemitropicalHorizonProps> = ({
  timeOfDay,
  width,
  height,
  hasWater = true,
  hasLagoon = true,
  isUrban = false,
  bottomPanelColor = '#132125',
  seed,
  weather,
  sky,
}) => {
  /* RNG (stable per visual state) */
  const rng = useMemo(() => {
    const base =
      (seed ?? 0) ^
      (width | 0) ^
      ((height | 0) << 5) ^
      Array.from(String(timeOfDay)).reduce((a, c) => a + c.charCodeAt(0), 0) ^
      Math.round((weather?.windSpeed ?? 0) * 7) ^
      Math.round((weather?.intensity ?? 0) * 199);
    return mulberry32(base >>> 0);
  }, [seed, width, height, timeOfDay, weather?.windSpeed, weather?.intensity]);

  const isNight = timeOfDay === 'Night';
  const isDawn = timeOfDay === 'Dawn';
  const isDusk = timeOfDay === 'Dusk';
  const isMid = timeOfDay === 'Midday';

  const getSky = () => {
    if (sky) {
      return {
        skyTop: sky.top,
        skyMid: sky.mid,
        skyBottom: sky.bottom,
        hazeDark: sky.hazeDark ?? '#98A9C6',
        hazeLight: sky.hazeLight ?? '#CFE0F2',
        water: sky.water ?? '#4F7CA6',
      };
    }
    return {
      skyTop: '#5AA7E6',
      skyMid: '#8CCBF3',
      skyBottom: '#DDEFFF',
      hazeDark: '#98A9C6',
      hazeLight: '#CFE0F2',
      water: '#4F7CA6',
    };
  };
  const { skyTop, skyMid, skyBottom, hazeDark, hazeLight, water: waterBase } = getSky();

  /* Palette (semisaturated jade/teal greens + violet hills) */
  const P = useMemo(() => {
    const skyInfluence = isNight ? 0.70 : isDusk ? 0.38 : isDawn ? 0.32 : 0.20;

    const farViolet = blendHex('#6E5AA8', skyTop, 0.28);
    const farGreen  = blendHex('#67A08A', skyTop, skyInfluence * 0.3);
    const midGreen  = blendHex('#3D816B', skyMid, skyInfluence * 0.26);
    const nearGreen = blendHex('#2A6C5B', skyBottom, skyInfluence * 0.2);
    const darkBand  = blendHex('#164842', skyBottom, skyInfluence * 0.15);

    const water     = isNight ? blendHex(waterBase, '#0A1A2B', 0.35) : waterBase;
    const waterHi   = blendHex(waterBase, '#FFFFFF', isNight ? 0.28 : 0.55);

    return {
      farViolet, farGreen, midGreen, nearGreen, darkBand,
      trunk: blendHex('#5A4230', skyBottom, skyInfluence * 0.1),
      leafDark: blendHex('#1E6B51', skyBottom, skyInfluence * 0.1),
      leafLight: blendHex('#2F8D71', skyBottom, skyInfluence * 0.1),
      reed: blendHex('#3FA989', skyBottom, 0.08),
      hazeL: hazeLight,
      hazeD: hazeDark,
      water, waterHi,
      windowGlow: 'rgba(255,224,170,0.85)',
      rain: '#9ec9ff',
      snow: '#F4F7FB',
      snowBlue: '#E9F2FF',
      pollen: '#EBD37A',
      dust: '#B79563',
      firefly: '#FFE87A',
      rim: blendHex(hazeLight, '#FFFFFF', 0.55),
      panel0: bottomPanelColor,
      vign: 'rgba(0,0,0,0.18)',
    };
  }, [isNight, isDusk, isDawn, skyTop, skyMid, skyBottom, hazeDark, hazeLight, waterBase, bottomPanelColor]);

  /* Layout bands */
  const compact = height < 110;
  const yVF   = p(height * (compact ? 0.16 : 0.14));
  const yFar  = p(height * (compact ? 0.26 : 0.24));
  const yMid  = p(height * (compact ? 0.42 : 0.38));
  const yNear = p(height * (compact ? 0.58 : 0.56));
  const yTree = p(height * (compact ? 0.68 : 0.66));
  const yFG   = p(height * (compact ? 0.78 : 0.75));
  const yFeather = p(height * 0.88);

  const ridgePath = (yBase: number, amp: number, kinks = 12, jitter = 0.7) => {
    const xs = Array.from({ length: kinks }, (_, i) => (i / (kinks - 1)) * width);
    let d = `M 0 ${height} L 0 ${yBase}`;
    for (let i = 1; i < xs.length; i++) {
      const x0 = xs[i - 1];
      const x1 = xs[i];
      const cx = (x0 + x1) / 2;
      const dy = amp * (0.35 + rng() * 0.65);
      const cy = yBase - amp * (0.35 + rng() * 0.65) + (rng() - 0.5) * amp * 0.15 * jitter;
      d += ` Q ${p(cx)} ${p(cy)}, ${p(x1)} ${p(yBase - dy)}`;
    }
    d += ` L ${width} ${height} Z`;
    return d;
  };

  const sampleXs = (count: number, minGapPx: number) => {
    const xs: number[] = [];
    let safety = 0;
    while (xs.length < count && safety++ < 400) {
      const x = width * (0.04 + Math.random() * 0.92); // not seeded; avoids “samey” rows when many re-renders
      if (xs.every(px => Math.abs(px - x) > minGapPx)) xs.push(x);
    }
    return xs.sort((a, b) => a - b);
  };

  /* Flora stamps (palmetto, banana, mangrove/yucca-ish) */
  const Palmetto: React.FC<{ x: number; baseY: number; h: number; dark?: boolean }> = ({ x, baseY, h, dark }) => {
    const stem = dark ? P.darkBand : P.trunk;
    const leaf = dark ? P.darkBand : P.leafDark;
    const cy = baseY - h * 0.06;
    const r = h * 0.22;
    return (
      <g shapeRendering="crispEdges">
        <rect x={p(x - h * 0.02)} y={p(baseY - h * 0.25)} width={p(h * 0.04)} height={p(h * 0.25)} fill={stem} />
        {[-40, -20, 0, 20, 40].map((a, i) => {
          const rad = (a * Math.PI) / 180;
          return (
            <line key={i} x1={p(x)} y1={p(cy)} x2={p(x + Math.cos(rad) * r)} y2={p(cy - Math.sin(rad) * r)} stroke={leaf} strokeWidth={dark ? 3 : 2} />
          );
        })}
      </g>
    );
  };

  const Banana: React.FC<{ x: number; baseY: number; h: number; dark?: boolean }> = ({ x, baseY, h, dark }) => {
    const stem = dark ? P.darkBand : P.trunk;
    const leaf = dark ? P.darkBand : P.leafLight;
    return (
      <g shapeRendering="crispEdges">
        <rect x={p(x - h * 0.015)} y={p(baseY - h * 0.30)} width={p(h * 0.03)} height={p(h * 0.30)} fill={stem} />
        {[-24, -12, 0, 12, 24].map((ang, i) => (
          <path
            key={i}
            d={`M ${p(x)} ${p(baseY - h * 0.25)}
               L ${p(x + Math.cos((ang*Math.PI)/180) * h * 0.26)}
                 ${p(baseY - h * 0.25 - Math.sin((ang*Math.PI)/180) * h * 0.18)}
               L ${p(x + Math.cos((ang*Math.PI)/180) * h * 0.16)}
                 ${p(baseY - h * 0.25 - Math.sin((ang*Math.PI)/180) * h * 0.10)} Z`}
            fill={leaf}
          />
        ))}
      </g>
    );
  };

  const Mangrove: React.FC<{ x: number; baseY: number; w: number; h: number; dark?: boolean }> = ({ x, baseY, w, h, dark }) => {
    const fill = dark ? P.darkBand : blendHex(P.midGreen, '#10251f', 0.15);
    return <rect x={p(x - w / 2)} y={p(baseY - h)} width={p(w)} height={p(h)} fill={fill} />;
  };

  /* Flora placements */
  const midPlants = useMemo(() => {
    const n = 18 + ((rng() * 8) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.02 + rng() * 0.96),
      h: height * (0.14 + rng() * 0.12),
      t: rng(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, timeOfDay]);

  const fgPlants = useMemo(() => {
    const n = 12 + ((rng() * 6) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.03 + (i / (n - 1)) * 0.94) + (rng() - 0.5) * 10,
      h: height * (0.22 + rng() * 0.16),
      t: rng(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, timeOfDay]);

  /* Weather flags */
  const fx = weather?.fx;
  const windy = (weather?.windSpeed ?? 0) >= WINDY_KMH;
  const precip = weather?.precipitation ?? 'none';
  const intensity = clamp01(weather?.intensity ?? 0);
  const isRain = (precip === 'rain' || precip === 'drizzle' || precip === 'sleet') && intensity > 0;
  const isSnow = precip === 'snow' && intensity > 0;
  const isFoggy = weather?.special === 'fog' || weather?.special === 'mist';

  const dropletSize = clamp01(fx?.dropletSize ?? (isRain ? 0.5 + intensity * 0.5 : 0));
  const flakeSize = clamp01(fx?.flakeSize ?? (isSnow ? 0.5 + intensity * 0.4 : 0));
  const leavesActivity = clamp01(fx?.leavesActivity ?? 0);
  const airborne = fx?.airborneParticles;
  const fireflyP = fx?.fireflyProbability ?? 0;
  const showFireflies = isNight && fireflyP > 0.15;
  const showRainbow = (fx?.rainbowProbability ?? 0) > 0.5 && !isNight;
  const showLightning = (fx?.lightningProbability ?? 0) > 0.2 && isRain;
  const blossoms = fx?.blossoms; // jacaranda expected here
  const showBlossoms = !!(blossoms && blossoms.activity > 0.08);
  const showLeaves = leavesActivity > 0.05;

  // counts
  const rainDrops = isRain ? Math.min(190, 50 + Math.round(intensity * 160)) : 0;
  const puddles = isRain ? (3 + Math.round(intensity * 5)) : 0;
  const snowFlakes = isSnow ? Math.min(160, 36 + Math.round(intensity * 140)) : 0;
  const blossomCount = showBlossoms ? (10 + Math.round((blossoms!.activity || 0.2) * 18)) : 0;
  const leafCount = showLeaves ? (10 + Math.round(leavesActivity * 24)) : 0;
  const pollenDots = airborne?.type === 'pollen' ? Math.round(60 * clamp01(airborne.density ?? 0.4)) : 0;
  const dustDots = airborne && (airborne.type === 'dust' || airborne.type === 'sand')
    ? Math.round(60 * clamp01(airborne.density)) : 0;

  // angles
  const windRad = ((weather?.windDirection ?? 0) * Math.PI) / 180;
  const rainAngleX = Math.sin(windRad) * (0.6 + (weather?.windSpeed ?? 0) / 45);
  const rainAngleY = Math.cos(windRad) * (1.2 + (weather?.windSpeed ?? 0) / 30);

  /* Villas (urban) */
  type Villa = { x: number; w: number; h: number; y: number; glow: boolean };
  const villas: Villa[] = useMemo(() => {
    if (!isUrban) return [];
    const n = 3 + ((Math.random() * 3) | 0);
    const xs = sampleXs(n, width * 0.22);
    return xs.map((x, i) => {
      const w = p(16 + (i % 2) * 3);
      const h = p(10 + (i % 3));
      const y = p(yFG - 10 - (Math.random() * 8));
      const glow = Math.random() > 0.45;
      return { x, w, h, y, glow };
    });
  }, [isUrban, width, yFG]);

  /* IDs */
  const uid = useMemo(() => `semi-${Math.random().toString(36).slice(2, 9)}`, []);
  const ids = {
    topfade: `${uid}-topfade`,
    topmask: `${uid}-topmask`,
    hazeL: `${uid}-hazeL`,
    hazeD: `${uid}-hazeD`,
    panel: `${uid}-panel`,
    waterSheen: `${uid}-waterSheen`,
    rimHL: `${uid}-rimHL`,
    rainBlur: `${uid}-rainBlur`,
    snowBlur: `${uid}-snowBlur`,
    glow: `${uid}-glow`,
    pollen: `${uid}-pollen`,
    dust: `${uid}-dust`,
    rainbow: `${uid}-rainbow`,
    whitecap: `${uid}-whitecap`,
    fogVertical: `${uid}-fogvert`,
    dustVertical: `${uid}-dustvert`,
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', left: 0, bottom: 0, pointerEvents: 'none', imageRendering: 'pixelated' }}
      shapeRendering="crispEdges"
    >
      <defs>
        {/* Top fade (mask) */}
        <linearGradient id={ids.topfade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0" />
          <stop offset="40%"  stopColor="white" stopOpacity="0.12" />
          <stop offset="68%"  stopColor="white" stopOpacity="0.45" />
          <stop offset="100%" stopColor="white" stopOpacity="0.98" />
        </linearGradient>
        <mask id={ids.topmask}>
          <rect x="0" y="0" width={width} height={height} fill={`url(#${ids.topfade})`} />
          <path d={ridgePath(height * 0.18, height * 0.08, 11, 0.7)} fill="white" opacity="0.18" />
        </mask>

        {/* Haze bands */}
        <linearGradient id={ids.hazeL} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.hazeL} stopOpacity="0.25" />
          <stop offset="100%" stopColor={P.hazeL} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.hazeD} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.hazeD} stopOpacity="0.28" />
          <stop offset="100%" stopColor={P.hazeD} stopOpacity="0" />
        </linearGradient>

        {/* Fog/mist vertical fade - transparent at top, opaque at bottom */}
        <linearGradient id={ids.fogVertical} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.hazeL} stopOpacity="0" />
          <stop offset="25%" stopColor={P.hazeL} stopOpacity="0" />
          <stop offset="60%" stopColor={P.hazeL} stopOpacity="0.5" />
          <stop offset="100%" stopColor={P.hazeL} stopOpacity="0.9" />
        </linearGradient>

        {/* Dust vertical fade - transparent at top, opaque at bottom */}
        <linearGradient id={ids.dustVertical} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.dust} stopOpacity="0" />
          <stop offset="30%" stopColor={P.dust} stopOpacity="0" />
          <stop offset="65%" stopColor={P.dust} stopOpacity="0.6" />
          <stop offset="100%" stopColor={P.dust} stopOpacity="1" />
        </linearGradient>

        {/* Bottom panel feather */}
        <linearGradient id={ids.panel} x1="0" y1={yFeather} x2="0" y2={height}>
          <stop offset="0%" stopColor={P.nearGreen} />
          <stop offset="60%" stopColor={P.darkBand} />
          <stop offset="100%" stopColor={P.panel0} />
        </linearGradient>

        {/* Water sheen */}
        <linearGradient id={ids.waterSheen} x1="0" y1={height - 18} x2="0" y2={height}>
          <stop offset="0%" stopColor={P.water} stopOpacity="0.22" />
          <stop offset="100%" stopColor={P.water} stopOpacity="0" />
        </linearGradient>

        {/* Subtle blur for precip */}
        <filter id={ids.rainBlur}><feGaussianBlur stdDeviation="0.4" /></filter>
        <filter id={ids.snowBlur}><feGaussianBlur stdDeviation="0.3" /></filter>

        {/* Glows */}
        <filter id={ids.glow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Dust/pollen tint */}
        <filter id={ids.dust}>
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.85 0 0 0  0 0 0.7 0 0  0 0 0 0.35 0"/>
        </filter>
        <filter id={ids.pollen}>
          <feColorMatrix type="matrix" values="1 0 0 0 0.15  0.9 1 0 0 0  0 0 0.3 0 0  0 0 0 0.45 0"/>
        </filter>

        {/* Rainbow */}
        <radialGradient id={ids.rainbow} cx="50%" cy="100%" r="80%">
          <stop offset="30%" stopColor="#ff0000" stopOpacity="0.06"/>
          <stop offset="45%" stopColor="#ffa500" stopOpacity="0.05"/>
          <stop offset="58%" stopColor="#ffff00" stopOpacity="0.05"/>
          <stop offset="70%" stopColor="#00ff00" stopOpacity="0.05"/>
          <stop offset="82%" stopColor="#00bfff" stopOpacity="0.05"/>
          <stop offset="92%" stopColor="#8a2be2" stopOpacity="0.05"/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
        </radialGradient>

        {/* Sea whitecaps */}
        <filter id={ids.whitecap}>
          <feTurbulence baseFrequency="0.12" numOctaves="1" seed="11" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0 1 0" />
          </feComponentTransfer>
        </filter>

        {/* Animations */}
        <style>{`
          @keyframes ${ids.rimHL} { 0%{opacity:.2} 50%{opacity:.42} 100%{opacity:.2} }
          @keyframes semi-sway { 0%,100%{ transform: rotate(0deg);} 50%{ transform: rotate(${windy ? 3 : 1.5}deg);} }
          @keyframes semi-rain { 0%{ transform: translate(0,0); opacity:0;} 10%{opacity:.65;} 100%{ transform: translate(${rainAngleX * height}px, ${rainAngleY * height}px); opacity:0; } }
          @keyframes semi-ripple { 0%{ transform: scale(0.4); opacity:.6;} 100%{ transform: scale(1.4); opacity:0;} }
          @keyframes semi-snow { 0%{ transform: translate(0,0) rotate(0deg); opacity:.95;} 100%{ transform: translate(${(Math.sin(windRad) * (windy ? 55 : 25))}px, ${height * 0.22}px) rotate(180deg); opacity:.1;} }
          @keyframes semi-lightning { 0%,96%,100%{opacity:0;} 97%{opacity:.9;} 98%{opacity:.15;} 99%{opacity:.75;} }
          @keyframes semi-window { 0%,100%{ opacity:.86;} 60%{ opacity:.55;} }
          @keyframes semi-petal { 0%{ transform: translateY(0) translateX(0) rotate(0); opacity:.9;} 100%{ transform: translateY(${height*0.2}px) translateX(${windy?42:22}px) rotate(200deg); opacity:0;} }
          @keyframes semi-leaf { 0%{ transform: translateY(0) translateX(0) rotate(0); opacity:.95;} 100%{ transform: translateY(${height*0.22}px) translateX(${windy?46:24}px) rotate(240deg); opacity:0;} }
          @keyframes semi-firefly { 0%,100%{opacity:.1;} 50%{opacity:.9;} }
        `}</style>
      </defs>

      {/* Scene under a top mask to blend into real sky */}
      <g mask={`url(#${ids.topmask})`}>
        {/* VERY FAR violet hills */}
        <g opacity={isNight ? 0.55 : 0.60}>
          <path d={ridgePath(yVF, p(height * 0.12), 11, 0.7)} fill={P.farViolet} />
        </g>

        {/* Haze band */}
        <rect x="0" y={p(yVF - height * 0.02)} width={width} height={p(height * 0.08)} fill={`url(#${ids.hazeD})`} opacity={clamp01((fx?.hazeDensity ?? 0.25) * 1.0)} />

        {/* FAR green ridge (broken clumps) */}
        <g opacity={0.92}>
          <path d={ridgePath(yFar, p(height * 0.18), 11, 0.8)} fill={P.farGreen} />
          {Array.from({ length: 12 }).map((_, i) => {
            const cx = ((i + 0.5) / 12) * width + (Math.random() - 0.5) * 10;
            const w = 12 + Math.random() * 12;
            const h = 8 + Math.random() * 6;
            return <rect key={i} x={cx - w / 2} y={yFar - 4 - h} width={w} height={h} fill={blendHex(P.farGreen, '#1b1b1b', 0.12)} />;
          })}
        </g>

        {/* Haze */}
        <rect x="0" y={p(yFar - height * 0.03)} width={width} height={p(height * 0.08)} fill={`url(#${ids.hazeL})`} opacity={clamp01((fx?.hazeDensity ?? 0.22) * 1.0)} />

        {/* MID mangrove flats */}
        <g opacity={0.96}>
          <path d={ridgePath(yMid, p(height * 0.16), 12, 0.9)} fill={P.midGreen} />
          {Array.from({ length: 16 }).map((_, i) => {
            const cx = width * (0.02 + Math.random() * 0.96);
            if (Math.random() < 0.4) {
              return <rect key={i} x={p(cx)} y={p(yMid - 2)} width={2} height={p(10 + Math.random() * 10)} fill={P.reed} />;
            }
            const w = 16 + Math.random() * 16, h = 10 + Math.random() * 12;
            return <Mangrove key={i} x={cx} baseY={yMid - 4} w={w} h={h} />;
          })}
        </g>

        {/* Fog/mist bank if present */}
        {isFoggy && (
          <g opacity={fx?.fogDensity ? clamp01(fx.fogDensity) : (weather!.special === 'fog' ? 0.5 : 0.25)}>
            <rect x="0" y={p(yMid - height * 0.06)} width={width} height={p(height * 0.28)} fill={`url(#${ids.fogVertical})`} />
          </g>
        )}

        {/* NEAR ridge with rim highlight */}
        <g opacity={0.98}>
          <path d={ridgePath(yNear, p(height * 0.15), 13, 1.0)} fill={P.nearGreen} />
          <path
            d={ridgePath(yNear - 1, p(height * 0.15), 13, 1.0)}
            fill="none"
            stroke={P.rim}
            strokeWidth={1}
            opacity={isNight ? 0.22 : 0.32}
            style={{ animation: `${ids.rimHL} ${14 + ((Math.random() * 6) | 0)}s ease-in-out infinite` }}
          />
        </g>

        {/* TREE LINE shelf */}
        <path d={ridgePath(yTree, p(height * 0.10), 40, 1.0)} fill={P.darkBand} />

        {/* Mid plants */}
        {midPlants.map((m, i) => {
          if (m.t < 0.34) return <Palmetto key={`m-p-${i}`} x={m.x} baseY={yTree} h={m.h} />;
          if (m.t < 0.67) return <Banana key={`m-b-${i}`} x={m.x} baseY={yTree} h={m.h} />;
          return <Mangrove key={`m-m-${i}`} x={m.x} baseY={yTree} w={p(m.h * 0.55)} h={p(m.h * 0.6)} />;
        })}

        {/* FOREGROUND silhouettes */}
        <g opacity={0.96}>
          <path d={ridgePath(yFG, p(height * 0.08), 42, 1.2)} fill={P.darkBand} />
          {fgPlants.map((f, i) => {
            const origin = `${p(f.x)}px ${yFG}px`;
            const swayDur = 3 + (i % 3);
            const style = windy ? { transformOrigin: origin, animation: `semi-sway ${swayDur}s ease-in-out infinite` } : undefined;
            if (f.t < 0.33) return <g key={`f-p-${i}`} style={style}><Palmetto x={f.x} baseY={yFG} h={f.h} dark /></g>;
            if (f.t < 0.66) return <g key={`f-b-${i}`} style={style}><Banana x={f.x} baseY={yFG} h={f.h * 0.94} dark /></g>;
            return <g key={`f-m-${i}`} style={style}><Mangrove x={f.x} baseY={yFG} w={p(f.h * 0.60)} h={p(f.h * 0.66)} dark /></g>;
          })}
        </g>

        {/* Urban villas with window glow */}
        {villas.map((v, k) => (
          <g key={`villa-${k}`} opacity={0.97}>
            <rect x={v.x - v.w / 2} y={v.y - v.h} width={v.w} height={v.h} fill={blendHex('#fff3df', skyBottom, 0.15)} />
            <path
              d={`M ${v.x - v.w / 2 - 2} ${v.y - v.h}
                 L ${v.x} ${v.y - v.h - 6}
                 L ${v.x + v.w / 2 + 2} ${v.y - v.h} Z`}
              fill={blendHex('#cb6a38', skyBottom, 0.2)}
            />
            {(isNight || isDusk) && v.glow && (
              <g filter={`url(#${ids.glow})`} style={{ animation: `semi-window ${4 + (k % 3)}s ease-in-out infinite` }}>
                <rect x={v.x - v.w * 0.25} y={v.y - v.h + 3} width="3" height="3" fill={P.windowGlow} rx="0.5" />
                <rect x={v.x + v.w * 0.1}  y={v.y - v.h + 3} width="3" height="3" fill={P.windowGlow} rx="0.5" opacity="0.85" />
              </g>
            )}
            {isSnow && <rect x={v.x - v.w / 2 - 1} y={v.y - v.h - 1} width={v.w + 2} height="2" fill={P.snow} opacity="0.9" />}
          </g>
        ))}

        {/* Lagoon / water pocket */}
        {hasLagoon && hasWater && (
          <g opacity="0.9">
            <path
              d={`
                M ${p(width * 0.28)} ${p(yMid + 4)}
                C ${p(width * 0.36)} ${p(yMid)}, ${p(width * 0.46)} ${p(yMid + 2)}, ${p(width * 0.54)} ${p(yMid + 4)}
                S ${p(width * 0.66)} ${p(yMid + 2)}, ${p(width * 0.72)} ${p(yMid + 4)}
                L ${p(width * 0.72)} ${p(yNear)}
                C ${p(width * 0.64)} ${p(yNear - 2)}, ${p(width * 0.56)} ${p(yNear)}, ${p(width * 0.50)} ${p(yNear)}
                S ${p(width * 0.36)} ${p(yNear - 2)}, ${p(width * 0.28)} ${p(yNear)}
                Z
              `}
              fill={P.water}
              opacity="0.78"
            />
            <path
              d={`M ${p(width * 0.34)} ${p((yMid + yNear) / 2)} Q ${p(width * 0.50)} ${p((yMid + yNear) / 2 - 2)}, ${p(width * 0.66)} ${p((yMid + yNear) / 2)}`}
              stroke={P.waterHi}
              strokeWidth="1"
              opacity="0.4"
              fill="none"
            />
          </g>
        )}

        {/* Coastal edges if not lagoon */}
        {!hasLagoon && hasWater && (
          <>
            <g opacity="0.88">
              <path
                d={`M 0 ${p(yNear - 10)} C ${p(width*0.10)} ${p(yNear - 12)}, ${p(width*0.20)} ${p(yNear - 6)}, ${p(width*0.26)} ${p(yNear - 3)} L ${p(width*0.26)} ${height} L 0 ${height} Z`}
                fill={P.water}
              />
              <path d={`M 0 ${p(yNear - 3)} Q ${p(width*0.12)} ${p(yNear - 4)}, ${p(width*0.26)} ${p(yNear - 3)}`} stroke={P.waterHi} strokeWidth="1.5" opacity="0.45" fill="none" />
            </g>
            <g opacity="0.88">
              <path
                d={`M ${width} ${p(yNear - 8)} C ${p(width*0.92)} ${p(yNear - 10)}, ${p(width*0.86)} ${p(yNear - 6)}, ${p(width*0.80)} ${p(yNear - 3)} L ${p(width*0.80)} ${height} L ${width} ${height} Z`}
                fill={P.water}
              />
              <path d={`M ${width} ${p(yNear - 3)} Q ${p(width*0.90)} ${p(yNear - 4)}, ${p(width*0.80)} ${p(yNear - 3)}`} stroke={P.waterHi} strokeWidth="1.5" opacity="0.45" fill="none" />
            </g>
          </>
        )}

        {/* Wind whitecaps */}
        {hasWater && windy && (
          <rect
            x="0" y={p(yNear - 8)} width={width} height={p(height - (yNear - 8))}
            fill="white" filter={`url(#${ids.whitecap})`} opacity="0.08"
          />
        )}

        {/* RAIN: streaks + puddles + wet sheen + lightning */}
        {isRain && (
          <g>
            <g filter={`url(#${ids.rainBlur})`} opacity={0.6}>
              {Array.from({ length: rainDrops }).map((_, i) => {
                const x = p(width * Math.random());
                const y = p(yVF * 0.3 * Math.random());
                const len = p((8 + dropletSize * 16) * (0.6 + Math.random() * 0.6));
                const w = Math.max(1, Math.round(1 + dropletSize));
                const dur = (0.9 + Math.random() * 0.8) * (1.4 - intensity);
                const delay = Math.random() * -4;
                return (
                  <rect
                    key={`rd-${i}`}
                    x={x} y={y} width={w} height={len} rx={w/2}
                    fill={P.rain} opacity={0.8}
                    style={{ animation: `semi-rain ${dur}s linear ${delay}s infinite` }}
                  />
                );
              })}
            </g>

            {/* Wet sheen */}
            <rect x="0" y={p(height * 0.86)} width={width} height={p(height * 0.14)} fill={P.water} opacity={0.12 + (fx?.surfaceWetnessNow ?? intensity) * 0.22} />

            {/* Puddles + ripples */}
            <g opacity={0.36 + intensity * 0.4}>
              {Array.from({ length: puddles }).map((_, i) => {
                const cx = p(width * ((i + 1) / (puddles + 1)) + Math.sin(i * 13.7) * 18);
                const cy = p(height * (0.90 + Math.sin(i * 7.3) * 0.02));
                const rx = p(12 + intensity * 14 + (i % 3) * 3);
                const ry = p(3 + intensity * 3);
                return (
                  <g key={`pud-${i}`}>
                    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={P.water} opacity={0.45 + intensity * 0.3} />
                    {[0,1,2].map((r) => (
                      <ellipse
                        key={`rip-${i}-${r}`}
                        cx={cx} cy={cy} rx={rx * (0.5 + r * 0.2)} ry={ry * (0.5 + r * 0.2)}
                        fill="none" stroke={P.waterHi} strokeWidth="1" opacity="0.5"
                        style={{ transformOrigin: `${cx}px ${cy}px`, animation: `semi-ripple ${1.4 + r * 0.3}s ease-out ${r * 0.35 + i * 0.2}s infinite` }}
                      />
                    ))}
                  </g>
                );
              })}
            </g>

            {/* Lightning */}
            {showLightning && (
              <rect x="0" y="0" width={width} height={height} fill="#ffffff" style={{ animation: `semi-lightning ${6 + ((Math.random() * 5) | 0)}s linear ${Math.random()*3}s infinite` }} opacity="0" />
            )}
          </g>
        )}

        {/* SNOW: flakes + drift accumulation (rare in semitropical, but supported) */}
        {isSnow && (
          <g>
            <g filter={`url(#${ids.snowBlur})`}>
              {Array.from({ length: snowFlakes }).map((_, i) => {
                const sx = p(width * Math.random());
                const sy = p(yVF * 0.2 * Math.random());
                const size = 1 + Math.round(1 + flakeSize * 2 + (i % 2));
                const dur = 3.5 + (Math.random() * 2) + (1 - intensity) * 2;
                const delay = Math.random() * -6;
                return (
                  <circle
                    key={`sf-${i}`}
                    cx={sx} cy={sy} r={size}
                    fill={P.snow} opacity={0.9}
                    style={{ animation: `semi-snow ${dur}s linear ${delay}s infinite` }}
                  />
                );
              })}
            </g>
            <path
              d={`M 0 ${p(yNear + 2)} C ${p(width*0.20)} ${p(yNear - 2)}, ${p(width*0.50)} ${p(yNear + 2)}, ${p(width*0.80)} ${p(yNear - 2)} L ${width} ${p(yNear)} L ${width} ${height} L 0 ${height} Z`}
              fill={P.snowBlue} opacity={0.35 + intensity * 0.35}
            />
          </g>
        )}

        {/* Airborne dust/sand */}
        {dustDots > 0 && (
          <g opacity={clamp01((airborne?.density ?? 0.5) * 0.6)}>
            <rect x="0" y={yMid - 10} width={width} height={p(height - (yMid - 10))} fill={`url(#${ids.dustVertical})`} filter={`url(#${ids.dust})`} />
          </g>
        )}

        {/* Pollen drift */}
        {pollenDots > 0 && (
          <g opacity={0.45} filter={`url(#${ids.pollen})`}>
            {Array.from({ length: pollenDots }).map((_, i) => {
              const x = p(width * (0.05 + Math.random() * 0.90));
              const y = p(yMid + Math.random() * (height - yMid));
              const r = 1 + (i % 2);
              const dur = 6 + (i % 5);
              return (
                <circle key={`pol-${i}`} cx={x} cy={y} r={r} fill={P.pollen} style={{ animation: `${ids.rimHL} ${dur}s ${Math.random()*2}s infinite` }} opacity="0" />
              );
            })}
          </g>
        )}

        {/* Blossoms (jacaranda/cherry) */}
        {showBlossoms && (
          <g opacity={0.85}>
            {Array.from({ length: blossomCount }).map((_, i) => {
              const px = p(width * (0.05 + Math.random() * 0.90));
              const py = p(yNear - 18 - Math.random() * 24);
              const palette = blossoms!.palette ?? ['#C7A0E8', '#B57EDC', '#9F6ED1', '#8F5BC7', '#E6D7F7'];
              const color = palette[i % palette.length];
              const sizeMin = blossoms!.sizeRange?.[0] ?? 3;
              const sizeMax = blossoms!.sizeRange?.[1] ?? 7;
              const size = sizeMin + Math.random() * (sizeMax - sizeMin);
              return (
                <rect
                  key={`petal-${i}`} x={px} y={py}
                  width={size} height={size * 0.6}
                  fill={color} opacity={0.9}
                  style={{ transformOrigin: `${px}px ${py}px`, animation: `semi-petal ${7 + (i % 5)}s linear ${i * 0.18}s infinite` }}
                />
              );
            })}
          </g>
        )}

        {/* Autumn leaves (rare in semitropics but supported) */}
        {showLeaves && (
          <g opacity={0.9}>
            {Array.from({ length: leafCount }).map((_, i) => {
              const px = p(width * (0.06 + Math.random() * 0.88));
              const py = p(yMid - 6 - Math.random() * 22);
              const palette = fx?.leafPalette ?? ['#C43E2F','#E07A2E','#E3A018','#9E6A3A','#7A4F2C','#B26E5D'];
              const color = palette[i % palette.length];
              const w = 4 + (i % 3);
              const h = 3 + (i % 2);
              return (
                <path
                  key={`leaf-${i}`}
                  d={`M ${px} ${py} q ${-w} ${h}, 0 ${2*h} q ${w} ${-h}, 0 ${-2*h} z`}
                  fill={color}
                  style={{ transformOrigin: `${px}px ${py}px`, animation: `semi-leaf ${6 + (i % 5)}s linear ${i * 0.15}s infinite` }}
                  opacity="0.95"
                />
              );
            })}
          </g>
        )}

        {/* Rainbow hint */}
        {showRainbow && (
          <ellipse cx={width / 2} cy={height} rx={width * 0.7} ry={height * 0.9} fill={`url(#${ids.rainbow})`} opacity="0.35" />
        )}

        {/* Fireflies */}
        {showFireflies && (
          <g filter={`url(#${ids.glow})`}>
            {Array.from({ length: 6 + Math.round(fireflyP * 10) }).map((_, i) => {
              const x = p(width * (0.08 + Math.random() * 0.84));
              const y = p(yMid + Math.random() * (yNear - yMid));
              return (
                <circle key={`ff-${i}`} cx={x} cy={y} r="1.6" fill={P.firefly} style={{ animation: `semi-firefly ${3 + (i%4)}s ease-in-out ${Math.random()*2}s infinite` }} opacity="0.7" />
              );
            })}
          </g>
        )}

        {/* Bottom feather into panel */}
        <rect x="0" y={yFeather} width={width} height={height - yFeather} fill={`url(#${ids.panel})`} />
      </g>

      {/* Optional water sheen near the very bottom (outside mask to sit over panel) */}
      {hasWater && (
        <rect x="0" y={height - 18} width={width} height={18} fill={`url(#${ids.waterSheen})`} />
      )}
    </svg>
  );
};

export default React.memo(SemitropicalHorizon);
