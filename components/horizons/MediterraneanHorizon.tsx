/**
 * components/horizons/MediterraneanHorizon.tsx
 *
 * Mediterranean horizon — WEATHER+ edition
 * - Heavily upgraded weather rendering:
 *    • Rain: angled animated streaks, rippling puddles, wet sheen, occasional lightning
 *    • Snow: drifting flakes (size from fx.flakeSize), ridge/roof accumulation, wind-blown spindrift
 *    • Fog/Mist/Haze: density-aware bands from Weather.fx
 *    • Wind: cypress sway, sea whitecaps, particle drifts (dust/pollen)
 *    • Seasonal flourishes: blossoms (spring), leaves (autumn), fireflies (warm summer nights), aurora (rare)
 *    • City niceties: window glow at night/dusk with subtle flicker (isUrban)
 *    • Rainbow hint (fx.rainbowProbability)
 *
 * Drop-in compatible with the earlier horizon component (same props).
 */

import React, { useMemo } from 'react';
import { TimeOfDay } from '../../types';
import { WeatherState } from '../../services/weatherService';

interface MediterraneanHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  hasWater?: boolean;
  hasCentralWater?: boolean;
  isUrban?: boolean;
  weather?: WeatherState;
  seed?: number;
  bottomPanelColor?: string;
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

const blendHex = (a: string, b: string, t: number) => {
  const toRgb = (h: string) => {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b2 = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b2).toString(16).slice(1)}`;
};
const p = (v: number) => Math.round(v);

const mulberry32 = (a: number) => {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const WINDY_KMH = 18;

/* ------------------------------- Component ------------------------------- */

const MediterraneanHorizon: React.FC<MediterraneanHorizonProps> = ({
  timeOfDay,
  width,
  height,
  hasWater = true,
  hasCentralWater = false,
  isUrban = false,
  weather,
  seed,
  bottomPanelColor = '#0B1220',
  sky,
}) => {
  /* -------- rng (stable per props) -------- */
  const rng = useMemo(() => {
    const base =
      (seed ?? 0) ^
      (width | 0) ^
      ((height | 0) << 7) ^
      Array.from(String(timeOfDay)).reduce((a, c) => a + c.charCodeAt(0), 0) ^
      Math.round((weather?.windSpeed ?? 0) * 3) ^
      Math.round((weather?.intensity ?? 0) * 97);
    return mulberry32(base >>> 0);
  }, [seed, width, height, timeOfDay, weather?.windSpeed, weather?.intensity]);

  /* -------- time of day + sky vars -------- */
  const isNight = timeOfDay === 'Night';
  const isDawn = timeOfDay === 'Dawn';
  const isDusk = timeOfDay === 'Dusk';
  const isMid = timeOfDay === 'Midday';

  // Get current month/season from weather
  const month = weather?.month ?? 6; // default to June
  const season = month >= 3 && month <= 5 ? 'spring' :
                month >= 6 && month <= 8 ? 'summer' :
                month >= 9 && month <= 11 ? 'autumn' : 'winter';

  const getSky = () => {
    if (sky) {
      return {
        skyTop: sky.top,
        skyMid: sky.mid,
        skyBottom: sky.bottom,
        hazeDark: sky.hazeDark ?? '#a7b3cf',
        hazeLight: sky.hazeLight ?? '#cfd8ea',
        water: sky.water ?? '#3a78b8',
      };
    }
    if (typeof window === 'undefined') {
      return {
        skyTop: '#6e5e92',
        skyMid: '#87CEEB',
        skyBottom: '#E6F3FF',
        hazeDark: '#a7b3cf',
        hazeLight: '#cfd8ea',
        water: '#3a78b8',
      };
    }
    const root = getComputedStyle(document.documentElement);
    const skyTop = root.getPropertyValue('--sky-top').trim() || '#6e5e92';
    const skyMid = root.getPropertyValue('--sky-mid').trim() || '#87CEEB';
    const skyBottom = root.getPropertyValue('--sky-bottom').trim() || '#E6F3FF';
    return {
      skyTop,
      skyMid,
      skyBottom,
      hazeDark: '#a7b3cf',
      hazeLight: '#cfd8ea',
      water: '#3a78b8',
    };
  };
  const { skyTop, skyMid, skyBottom, hazeDark, hazeLight, water: waterBase } = getSky();

  // Distance tinting strength (atmospheric perspective)
  // Night should darken, not wash out with sky color
  const skyInfluence =
    isNight ? 0.35 :
    isDusk  ? 0.45 :
    isDawn  ? 0.40 :
    isMid   ? 0.20 : 0.25;

  /* -------- palette -------- */
  const P = useMemo(() => {
    // Base colors with seasonal variations
    let base = {
      vf: '#6e5e92',    // very-far violet coast
      far: '#7f6aaa',   // far ridges
      mid1: '#a48e77',  // olive hills
      mid2: '#b8a186',
      near: '#8b735a',  // near scrub/stone/earth
      nearAcc: '#9f866c',
      olive: '#586b2f',
      cypress: '#2f4f3a',
      pine: '#2a4a3f',       // Stone pine - darker blue-green
      maquis: '#6b7a5a',     // Maquis shrubs - silvery sage-green
      maquisDark: '#4a5940', // Darker maquis variety
      villa: '#fff6e5',
      roof: '#c15b2d',
      cliff: '#d9b791',
      cliffHi: '#f1d3ad',
      water: waterBase,
      waterHi: blendHex('#A8D8FF', skyMid, 0.3),
      hazeDark,
      hazeLight,
      bird: '#242b3a',
      windowGlow: 'rgba(255,214,170,0.82)',
      snow: '#F4F7FB',
      snowBlue: '#E9F2FF',
      rain: '#9ec9ff',
      dust: '#B79563',
      pollen: '#EACB76',
      firefly: '#FFE87A',
      auroraG: '#6FFFBF',
      auroraV: '#7F7FFF',
    };

    // Apply seasonal color variations
    if (season === 'spring') {
      base.olive = blendHex('#586b2f', '#6d8a3f', 0.35); // brighter green
      base.cypress = blendHex('#2f4f3a', '#3a5c45', 0.25); // fresher green
      base.pine = blendHex('#2a4a3f', '#3a5a4a', 0.20); // fresher pine
      base.maquis = blendHex('#6b7a5a', '#7a8a6a', 0.25); // brighter shrubs
      base.mid1 = blendHex('#a48e77', '#9eb580', 0.25); // greener hills
    } else if (season === 'summer') {
      base.olive = blendHex('#586b2f', '#7a8b4f', 0.20); // sun-bleached
      base.maquis = blendHex('#6b7a5a', '#8a8a6a', 0.30); // dusty silvery
      base.mid1 = blendHex('#a48e77', '#c4a875', 0.30); // golden dry
      base.near = blendHex('#8b735a', '#a08566', 0.25); // dustier
    } else if (season === 'autumn') {
      base.olive = blendHex('#586b2f', '#8b7a3f', 0.35); // browning
      base.cypress = blendHex('#2f4f3a', '#4a5938', 0.20); // duller
      base.pine = blendHex('#2a4a3f', '#3a4a38', 0.15); // slightly warmer
      base.maquis = blendHex('#6b7a5a', '#7a7050', 0.25); // browning
      base.mid1 = blendHex('#a48e77', '#b89668', 0.30); // golden brown
      base.roof = blendHex('#c15b2d', '#d66432', 0.25); // warmer tiles
    } else if (season === 'winter') {
      base.olive = blendHex('#586b2f', '#4a5928', 0.30); // darker, dormant
      base.cypress = blendHex('#2f4f3a', '#264032', 0.25); // deeper green
      base.pine = blendHex('#2a4a3f', '#1f3a30', 0.20); // darker
      base.maquis = blendHex('#6b7a5a', '#5a6a50', 0.25); // muted
      base.mid1 = blendHex('#a48e77', '#918579', 0.30); // cooler, grayer
      base.villa = blendHex('#fff6e5', '#f5efdf', 0.40); // cooler white
    }

    // Apply sunset/sunrise color gradients
    if (isDawn) {
      base.vf = blendHex(base.vf, '#d4a5c8', 0.30); // pink-purple dawn
      base.far = blendHex(base.far, '#e8c4db', 0.25);
      base.villa = blendHex(base.villa, '#ffe8d5', 0.35); // warm morning glow
      base.roof = blendHex(base.roof, '#e67545', 0.20); // coral tiles
    } else if (isDusk) {
      base.vf = blendHex(base.vf, '#c47db8', 0.35); // deep purple dusk
      base.far = blendHex(base.far, '#d69ac8', 0.30);
      base.mid1 = blendHex(base.mid1, '#d4a876', 0.25); // golden hour
      base.villa = blendHex(base.villa, '#ffd6b5', 0.40); // sunset glow
      base.roof = blendHex(base.roof, '#e85634', 0.30); // burnt orange
      base.water = blendHex(base.water, '#5a6892', 0.25); // twilight water
    }

    const tintFar  = (c: string) => blendHex(c, skyTop, skyInfluence * 1.2);
    const tintMid  = (c: string) => blendHex(c, skyMid, skyInfluence * 0.95);
    const tintNear = (c: string) => blendHex(c, skyBottom, skyInfluence * 0.8);

    const out = {
      vf: tintFar(base.vf),
      far: tintFar(base.far),
      mid1: tintMid(base.mid1),
      mid2: tintMid(base.mid2),
      near: tintNear(base.near),
      nearAcc: tintNear(base.nearAcc),
      olive: tintNear(base.olive),
      cypress: tintNear(base.cypress),
      pine: tintNear(base.pine),
      maquis: tintNear(base.maquis),
      maquisDark: tintNear(base.maquisDark),
      villa: tintNear(base.villa),
      roof: tintNear(base.roof),
      cliff: tintNear(base.cliff),
      cliffHi: tintNear(base.cliffHi),
      water: tintNear(base.water),
      waterHi: base.waterHi,
      hazeDark: base.hazeDark,
      hazeLight: base.hazeLight,
      bird: base.bird,
      windowGlow: base.windowGlow,
      snow: base.snow,
      snowBlue: base.snowBlue,
      rain: base.rain,
      dust: base.dust,
      pollen: base.pollen,
      firefly: base.firefly,
      auroraG: base.auroraG,
      auroraV: base.auroraV,
    };

    if (isNight) {
      out.water = blendHex('#1f3861', skyBottom, 0.3);
      out.waterHi = blendHex('#6aa7ff', skyMid, 0.2);
      // Darken vegetation and ground at night
      out.olive = blendHex(out.olive, '#1a2a18', 0.55);
      out.cypress = blendHex(out.cypress, '#0f1f15', 0.55);
      out.pine = blendHex(out.pine, '#0f1f18', 0.55);
      out.maquis = blendHex(out.maquis, '#2a3025', 0.50);
      out.maquisDark = blendHex(out.maquisDark, '#1a2518', 0.55);
      out.mid1 = blendHex(out.mid1, '#2a2520', 0.50);
      out.mid2 = blendHex(out.mid2, '#2a2520', 0.45);
      out.near = blendHex(out.near, '#1a1815', 0.50);
      out.nearAcc = blendHex(out.nearAcc, '#1f1c18', 0.45);
    }
    if (isDawn) {
      out.vf = blendHex(out.vf, '#B79AD8', 0.25);
      out.far = blendHex(out.far, '#C6B4E4', 0.18);
    }
    if (isDusk) {
      out.vf = blendHex(out.vf, '#A48BD2', 0.20);
      out.far = blendHex(out.far, '#B69FD9', 0.15);
    }
    return out;
  }, [timeOfDay, skyInfluence, skyTop, skyMid, skyBottom, waterBase, hazeDark, hazeLight, season, isDawn, isDusk]);

  /* -------- layout -------- */
  const compact = height < 110;
  const yVF   = p(height * (compact ? 0.36 : 0.32));
  const yFar  = p(height * (compact ? 0.50 : 0.46));
  const yMid  = p(height * (compact ? 0.64 : 0.58));
  const yNear = p(height * (compact ? 0.75 : 0.72));
  const yFeather = p(height * 0.88);

  // Generate an organic ridge path across the full width (no repetition)
  const ridgePath = (yBase: number, amp: number, kinks = 11, jitter = 0.5) => {
    const xs = Array.from({ length: kinks }, (_, i) => (i / (kinks - 1)) * width);
    let d = `M 0 ${height} L 0 ${yBase}`;
    for (let i = 1; i < xs.length; i++) {
      const x0 = xs[i - 1];
      const x1 = xs[i];
      const cx = (x0 + x1) / 2;
      const t1 = rng();
      const t2 = rng();
      const dy0 = amp * (0.35 + t1 * 0.65);
      const cy = yBase - (amp * (0.35 + t2 * 0.65)) + (rng() - 0.5) * amp * 0.15 * jitter;
      d += ` Q ${p(cx)} ${p(cy)}, ${p(x1)} ${p(yBase - dy0)}`;
    }
    d += ` L ${width} ${height} Z`;
    return d;
  };

  // Poisson-ish distribution helper to avoid clumps/repeats
  const sampleXs = (count: number, minGapPx: number) => {
    const xs: number[] = [];
    let safety = 0;
    while (xs.length < count && safety++ < 400) {
      const x = width * (0.04 + rng() * 0.92);
      if (xs.every(px => Math.abs(px - x) > minGapPx)) xs.push(x);
    }
    return xs.sort((a, b) => a - b);
  };

  /* -------- foreground features -------- */

  // Cypress rows
  const cypressXs = useMemo(
    () => sampleXs(12 + ((rng() * 8) | 0), width * 0.06),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height, timeOfDay]
  );

  // Olive clumps (ovals with tiny trunks) along mid slopes
  const oliveXs = useMemo(
    () => sampleXs(10 + ((rng() * 10) | 0), width * 0.08),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height, timeOfDay]
  );

  // Umbrella/stone pines - iconic Mediterranean flat-topped silhouettes
  const pineXs = useMemo(
    () => sampleXs(4 + ((rng() * 5) | 0), width * 0.12),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height, timeOfDay]
  );

  // Maquis/garrigue shrubs - low Mediterranean scrubland
  const shrubClusters = useMemo(() => {
    const clusters: Array<{ x: number; y: number; count: number; spread: number }> = [];
    const numClusters = 6 + ((rng() * 6) | 0);
    for (let i = 0; i < numClusters; i++) {
      clusters.push({
        x: width * (0.05 + rng() * 0.90),
        y: yMid + 4 + rng() * (yNear - yMid - 8),
        count: 3 + ((rng() * 5) | 0),
        spread: 8 + rng() * 12
      });
    }
    return clusters;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, timeOfDay, yMid, yNear]);

  // Villas if urban
  type Villa = { x: number; w: number; h: number; y: number; glow: boolean };
  const villas: Villa[] = useMemo(() => {
    if (!isUrban) return [];
    const n = 4 + ((rng() * 4) | 0);
    const xs = sampleXs(n, width * 0.18);
    return xs.map((x, i) => {
      const w = p(14 + (i % 2) * 4);
      const h = p(9 + (i % 3));
      const y = p(yNear - 14 - (rng() * 6));
      const glow = rng() > 0.4; // some houses glow at night/dusk
      return { x, w, h, y, glow };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUrban, width, height, timeOfDay, yNear]);

  /* -------- ids & flags -------- */
  const uid = useMemo(() => `med-${Math.random().toString(36).slice(2, 9)}`, []);
  const ids = {
    topfade: `${uid}-topfade`,
    topmask: `${uid}-topmask`,
    hazeL: `${uid}-hazeL`,
    hazeD: `${uid}-hazeD`,
    panel: `${uid}-panel`,
    heat: `${uid}-heat`,
    whitecap: `${uid}-whitecap`,
    glow: `${uid}-glow`,
    ripple: `${uid}-ripple`,
    aurora: `${uid}-aurora`,
    dust: `${uid}-dust`,
    pollen: `${uid}-pollen`,
    firefly: `${uid}-firefly`,
    rainBlur: `${uid}-rainBlur`,
    snowBlur: `${uid}-snowBlur`,
    rainbow: `${uid}-rainbow`,
    fogVertical: `${uid}-fogvert`,
    dustVertical: `${uid}-dustvert`,
  };

  const windy = (weather?.windSpeed ?? 0) >= WINDY_KMH;
  const precip = weather?.precipitation ?? 'none';
  const intensity = clamp(weather?.intensity ?? 0);
  const isRain = (precip === 'rain' || precip === 'drizzle' || precip === 'sleet') && intensity > 0;
  const isSnow = precip === 'snow' && intensity > 0;
  const isFoggy = weather?.special === 'fog' || weather?.special === 'mist';
  const isHot = weather?.condition === 'hot' || weather?.special === 'heatwave';
  const isCold = weather?.condition === 'cold' || weather?.condition === 'freezing' || season === 'winter';
  const fx = weather?.fx;

  // Particle hints
  const dropletSize = clamp(fx?.dropletSize ?? (isRain ? 0.5 + intensity * 0.5 : 0));
  const flakeSize = clamp(fx?.flakeSize ?? (isSnow ? 0.5 + intensity * 0.4 : 0));
  const leavesActivity = clamp(fx?.leavesActivity ?? 0);
  const airborne = fx?.airborneParticles;
  const fireflyP = fx?.fireflyProbability ?? 0;
  const auroraP = fx?.auroraProbability ?? 0;

  // Nice little extras
  const showBirds = !isNight && rng() > 0.82;
  const showBoat = hasWater && !isNight && !isRain && rng() > 0.88;
  const blossoms = fx?.blossoms;
  const showBlossoms = !!(blossoms && blossoms.activity > 0.1);
  const showLeaves = leavesActivity > 0.05;
  const showRainbow = (fx?.rainbowProbability ?? 0) > 0.5;
  const showLightning = (fx?.lightningProbability ?? 0) > 0.2 && isRain;
  const showFireflies = isNight && fireflyP > 0.15;
  const showAurora = isNight && auroraP > 0;

  /* --------------------------------- Render --------------------------------- */

  // Derived counts (keep perf in check)
  const rainDrops = isRain ? Math.min(180, 40 + Math.round(intensity * 160)) : 0;
  const puddles = isRain ? (3 + Math.round(intensity * 4)) : 0;
  const snowFlakes = isSnow ? Math.min(160, 36 + Math.round(intensity * 140)) : 0;
  const blossomCount = showBlossoms ? (8 + Math.round((blossoms!.activity || 0.2) * 14)) : 0;
  const leafCount = showLeaves ? (10 + Math.round(leavesActivity * 24)) : 0;
  const dustDots = airborne?.density ? Math.round(60 * clamp(airborne.density)) : 0;
  const pollenDots = airborne?.type === 'pollen' ? Math.round(60 * clamp(airborne.density ?? 0.4)) : 0;
  const fireflyCount = showFireflies ? (6 + Math.round(fireflyP * 10)) : 0;

  // Angles
  const windRad = ((weather?.windDirection ?? 0) * Math.PI) / 180;
  const rainAngleX = Math.sin(windRad) * (0.6 + (weather?.windSpeed ?? 0) / 45);
  const rainAngleY = Math.cos(windRad) * (1.2 + (weather?.windSpeed ?? 0) / 30);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', left: 0, bottom: 0, pointerEvents: 'none' }}
      shapeRendering="crispEdges"
    >
      <defs>
        {/* Top atmospheric fade to transparency, masked by a soft ridge so the blend feels natural */}
        <linearGradient id={ids.topfade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0" />
          <stop offset="15%"  stopColor="white" stopOpacity=".02" />
          <stop offset="30%"  stopColor="white" stopOpacity=".08" />
          <stop offset="45%"  stopColor="white" stopOpacity=".18" />
          <stop offset="60%"  stopColor="white" stopOpacity=".35" />
          <stop offset="75%"  stopColor="white" stopOpacity=".60" />
          <stop offset="88%"  stopColor="white" stopOpacity=".85" />
          <stop offset="100%" stopColor="white" stopOpacity=".98" />
        </linearGradient>
        <mask id={ids.topmask}>
          <rect x="0" y="0" width={width} height={height} fill={`url(#${ids.topfade})`} />
          <path d={ridgePath(height * 0.28, height * 0.05, 12, 0.7)} fill="white" opacity="0.2" />
        </mask>

        {/* Haze bands */}
        <linearGradient id={ids.hazeL} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={P.hazeLight} stopOpacity="0.45" />
          <stop offset="100%" stopColor={P.hazeLight} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.hazeD} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={P.hazeDark} stopOpacity="0.5" />
          <stop offset="100%" stopColor={P.hazeDark} stopOpacity="0" />
        </linearGradient>

        {/* Fog/mist vertical fade - transparent at top, opaque at bottom */}
        <linearGradient id={ids.fogVertical} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.hazeLight} stopOpacity="0" />
          <stop offset="25%" stopColor={P.hazeLight} stopOpacity="0" />
          <stop offset="60%" stopColor={P.hazeLight} stopOpacity="0.5" />
          <stop offset="100%" stopColor={P.hazeLight} stopOpacity="0.9" />
        </linearGradient>

        {/* Dust vertical fade - transparent at top, opaque at bottom */}
        <linearGradient id={ids.dustVertical} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.dust} stopOpacity="0" />
          <stop offset="30%" stopColor={P.dust} stopOpacity="0" />
          <stop offset="65%" stopColor={P.dust} stopOpacity="0.6" />
          <stop offset="100%" stopColor={P.dust} stopOpacity="1" />
        </linearGradient>

        {/* Bottom feather into panel color */}
        <linearGradient id={ids.panel} x1="0" y1={yFeather} x2="0" y2={height}>
          <stop offset="0%" stopColor={P.near} />
          <stop offset="55%" stopColor={P.nearAcc} />
          <stop offset="100%" stopColor={bottomPanelColor} />
        </linearGradient>

        {/* Heat shimmer */}
        <filter id={ids.heat}>
          <feTurbulence baseFrequency="0.02 0.01" numOctaves="2" result="turb" />
          <feDisplacementMap in="SourceGraphic" in2="turb" scale="2" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* Whitecap noise for windy coasts */}
        <filter id={ids.whitecap}>
          <feTurbulence baseFrequency="0.14" numOctaves="1" seed="7" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0 1 0" />
          </feComponentTransfer>
        </filter>

        {/* Soft glows (windows, fireflies) */}
        <filter id={ids.glow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Subtle blur for fast particles */}
        <filter id={ids.rainBlur}><feGaussianBlur stdDeviation="0.4"/></filter>
        <filter id={ids.snowBlur}><feGaussianBlur stdDeviation="0.3"/></filter>

        {/* Aurora gradient */}
        <linearGradient id={ids.aurora} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={P.auroraV} stopOpacity="0.0"/>
          <stop offset="30%" stopColor={P.auroraV} stopOpacity="0.35"/>
          <stop offset="60%" stopColor={P.auroraG} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={P.auroraG} stopOpacity="0.0"/>
        </linearGradient>

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

        {/* Dust/pollen colorize */}
        <filter id={ids.dust}>
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.85 0 0 0  0 0 0.7 0 0  0 0 0 0.35 0"/>
        </filter>
        <filter id={ids.pollen}>
          <feColorMatrix type="matrix" values="1 0 0 0 0.15  0.9 1 0 0 0  0 0 0.3 0 0  0 0 0 0.45 0"/>
        </filter>

        {/* CSS animations */}
        <style>{`
          @keyframes med-bird {
            0% { transform: translateX(-20px) translateY(0); opacity: .0; }
            12% { opacity: .35; }
            100% { transform: translateX(${width + 40}px) translateY(-8px); opacity: .0; }
          }
          @keyframes med-sway {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(${windy ? 2 : 1}deg); }
          }
          @keyframes med-sail {
            0% { transform: translateX(${width * 0.15 * (rng() * 0.6 + 0.4) * (rng() > 0.5 ? 1 : -1)}px); }
            100% { transform: translateX(${width * 0.15 * (rng() * 0.6 + 0.4) * (rng() > 0.5 ? -1 : 1)}px); }
          }
          @keyframes med-glint {
            0% { opacity: 0; }
            40% { opacity: .55; }
            100% { opacity: 0; }
          }
          @keyframes med-petal {
            0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: .85; }
            100% { transform: translateY(${height * 0.18}px) translateX(${windy ? 36 : 18}px) rotate(180deg); opacity: 0; }
          }
          @keyframes med-leaf {
            0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: .9; }
            100% { transform: translateY(${height * 0.22}px) translateX(${windy ? 42 : 22}px) rotate(240deg); opacity: 0; }
          }
          @keyframes med-rain {
            0% { transform: translate(0px, 0px); opacity: 0; }
            10% { opacity: .65; }
            100% { transform: translate(${rainAngleX * height}px, ${rainAngleY * height}px); opacity: 0; }
          }
          @keyframes med-ripple {
            0% { transform: scale(0.4); opacity: .6; }
            100% { transform: scale(1.4); opacity: 0; }
          }
          @keyframes med-snow {
            0% { transform: translate(0px, 0px) rotate(0deg); opacity: .95; }
            100% { transform: translate(${(Math.sin(windRad) * (windy ? 55 : 25))}px, ${height * 0.22}px) rotate(180deg); opacity: .1; }
          }
          @keyframes med-lightning {
            0%, 96%, 100% { opacity: 0; }
            97% { opacity: .9; }
            98% { opacity: .1; }
            99% { opacity: .8; }
          }
          @keyframes med-firefly {
            0%, 100% { opacity: .1; }
            50% { opacity: .9; }
          }
          @keyframes med-aurora {
            0% { transform: translateX(-12px); opacity: .15; }
            50% { transform: translateX(12px); opacity: .35; }
            100% { transform: translateX(-12px); opacity: .15; }
          }
          @keyframes med-window {
            0%, 100% { opacity: .85; }
            60% { opacity: .55; }
          }
          @keyframes med-shimmer {
            0% { transform: translateX(-5px) scaleY(1); opacity: 0.2; }
            50% { transform: translateX(5px) scaleY(1.1); opacity: 0.45; }
            100% { transform: translateX(-5px) scaleY(1); opacity: 0.2; }
          }
          @keyframes med-waterwave {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-2px); }
          }
        `}</style>
      </defs>

      {/* Mask group for top transparency */}
      <g mask={`url(#${ids.topmask})`}>
        {/* VERY FAR coastal violet range - much more transparent at night to avoid dark bands */}
        <g opacity={isNight ? 0.08 : 0.34}>
          <path d={ridgePath(yVF, p(height * 0.12), 12, 0.7)} fill={P.vf} />
        </g>

        {/* Haze between vf/far */}
        <rect x="0" y={p(yVF - height * 0.02)} width={width} height={p(height * 0.07)} fill={`url(#${ids.hazeD})`} opacity={clamp((fx?.hazeDensity ?? 0.25) * (isNight ? 0.4 : 1.2))} />

        {/* FAR ridges - also more transparent at night */}
        <g opacity={isNight ? 0.15 : 0.56}>
          <path d={ridgePath(yFar, p(height * 0.10), 11, 0.8)} fill={P.far} />
          {/* snow dusting (far) */}
          {isSnow && (
            <path d={`M 0 ${p(yFar - 2)} Q ${p(width * 0.5)} ${p(yFar - 6)}, ${width} ${p(yFar - 2)}`} stroke={P.snow} strokeWidth="2" opacity={0.45} />
          )}
        </g>

        {/* Haze between far/mid */}
        <rect x="0" y={p(yFar - height * 0.01)} width={width} height={p(height * 0.06)} fill={`url(#${ids.hazeL})`} opacity={clamp((fx?.hazeDensity ?? 0.2) * 1.1)} />

        {/* MID olive terraces */}
        <g opacity={isNight ? 0.86 : 0.96} filter={isHot ? `url(#${ids.heat})` : undefined}>
          <path
            d={`
              M 0 ${p(yMid + 4)}
              C ${p(width * 0.18)} ${p(yMid - 8)}, ${p(width * 0.42)} ${p(yMid + 2)}, ${p(width * 0.62)} ${p(yMid - 6)}
              S ${p(width * 0.90)} ${p(yMid - 8)}, ${width} ${p(yMid + 4)}
              L ${width} ${height} L 0 ${height} Z
            `}
            fill={P.mid1}
          />
          {/* three terrace ledges with vineyard rows */}
          {[0.24, 0.52, 0.78].map((phase, t) => {
            const ledgeY = p(yMid - 2 + t * 5);
            return (
              <g key={t}>
                <path
                  d={`M 0 ${ledgeY} Q ${p(width * (0.30 + phase * 0.10))} ${p(ledgeY - 2)}, ${p(width * (0.60 + phase * 0.10))} ${ledgeY} T ${width} ${ledgeY}`}
                  stroke={P.mid2}
                  strokeWidth={1}
                  opacity={0.28}
                  fill="none"
                />
                {/* Vineyard rows on terraces */}
                {season !== 'winter' && Array.from({ length: 4 + (t * 2) }).map((_, v) => {
                  const vx = p(width * (0.15 + v * 0.15 + phase * 0.05));
                  if (vx > width - 20) return null;
                  return (
                    <g key={`vine-${t}-${v}`} opacity={0.25}>
                      {/* Vineyard stakes */}
                      <rect x={vx} y={ledgeY - 3} width="1" height="4" fill={P.nearAcc} />
                      <rect x={vx + 8} y={ledgeY - 3} width="1" height="4" fill={P.nearAcc} />
                      {/* Vine foliage */}
                      <ellipse
                        cx={vx + 4}
                        cy={ledgeY - 2}
                        rx="5"
                        ry="2"
                        fill={season === 'autumn' ? blendHex(P.olive, '#a67c52', 0.4) : P.olive}
                        opacity={0.45}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* olive trees - gnarled organic shapes */}
          {oliveXs.map((x, i) => {
            const oy = yMid + p((rng() - 0.5) * 8);
            const variant = i % 4;
            const size = 8 + (i % 3) * 2;
            const twist = (rng() - 0.5) * 3; // trunk twist

            // Generate gnarled olive tree path
            const getOlivePath = () => {
              const cx = p(x);
              const canopyY = p(oy) - size;

              switch(variant) {
                case 0: // Spreading canopy
                  return `M ${cx} ${canopyY}
                    C ${cx - size * 1.4} ${canopyY - 2}, ${cx - size * 1.6} ${canopyY + size * 0.5}, ${cx - size * 1.2} ${canopyY + size * 0.8}
                    Q ${cx - size * 0.4} ${canopyY + size * 1.1}, ${cx} ${canopyY + size * 0.9}
                    Q ${cx + size * 0.4} ${canopyY + size * 1.1}, ${cx + size * 1.2} ${canopyY + size * 0.8}
                    C ${cx + size * 1.6} ${canopyY + size * 0.5}, ${cx + size * 1.4} ${canopyY - 2}, ${cx} ${canopyY}`;
                case 1: // Windswept asymmetric
                  return `M ${cx - size * 0.3} ${canopyY + 2}
                    C ${cx - size * 1.5} ${canopyY}, ${cx - size * 1.8} ${canopyY + size * 0.6}, ${cx - size * 0.6} ${canopyY + size}
                    Q ${cx + size * 0.2} ${canopyY + size * 1.2}, ${cx + size * 1.4} ${canopyY + size * 0.7}
                    C ${cx + size * 1.2} ${canopyY + size * 0.3}, ${cx + size * 0.5} ${canopyY - 1}, ${cx - size * 0.3} ${canopyY + 2}`;
                case 2: // Multi-crowned
                  return `M ${cx - size * 0.8} ${canopyY + 3}
                    C ${cx - size * 1.3} ${canopyY - 1}, ${cx - size * 0.6} ${canopyY - 3}, ${cx} ${canopyY}
                    C ${cx + size * 0.6} ${canopyY - 3}, ${cx + size * 1.3} ${canopyY - 1}, ${cx + size * 0.8} ${canopyY + 3}
                    Q ${cx + size * 1.4} ${canopyY + size * 0.6}, ${cx + size} ${canopyY + size * 0.9}
                    Q ${cx} ${canopyY + size * 1.2}, ${cx - size} ${canopyY + size * 0.9}
                    Q ${cx - size * 1.4} ${canopyY + size * 0.6}, ${cx - size * 0.8} ${canopyY + 3}`;
                default: // Classic gnarled
                  return `M ${cx} ${canopyY + 1}
                    Q ${cx - size * 0.8} ${canopyY - 2}, ${cx - size * 1.1} ${canopyY + size * 0.3}
                    C ${cx - size * 1.4} ${canopyY + size * 0.7}, ${cx - size * 0.8} ${canopyY + size * 1.1}, ${cx} ${canopyY + size * 0.95}
                    C ${cx + size * 0.8} ${canopyY + size * 1.1}, ${cx + size * 1.4} ${canopyY + size * 0.7}, ${cx + size * 1.1} ${canopyY + size * 0.3}
                    Q ${cx + size * 0.8} ${canopyY - 2}, ${cx} ${canopyY + 1}`;
              }
            };

            // Gnarled trunk path
            const getTrunkPath = () => {
              const base = p(oy) + 2;
              const trunkH = size * 0.6;
              return `M ${p(x) - 1} ${base}
                Q ${p(x) + twist} ${base - trunkH * 0.5}, ${p(x) - 1 + twist * 0.3} ${base - trunkH}
                L ${p(x) + 2 + twist * 0.3} ${base - trunkH}
                Q ${p(x) + 1 + twist} ${base - trunkH * 0.5}, ${p(x) + 2} ${base} Z`;
            };

            return (
              <g key={`olive-${i}`} opacity={0.92}>
                {/* Gnarled trunk */}
                <path d={getTrunkPath()} fill={blendHex(P.olive, '#5a4a35', 0.5)} />
                {/* Main canopy */}
                <path d={getOlivePath()} fill={P.olive} />
                {/* Silver-green highlights (olive leaves are silvery underneath) */}
                <ellipse
                  cx={p(x) + size * 0.3}
                  cy={p(oy) - size * 0.6}
                  rx={size * 0.4}
                  ry={size * 0.25}
                  fill={blendHex(P.olive, '#8a9a6a', 0.35)}
                  opacity="0.5"
                />
              </g>
            );
          })}
        </g>

        {/* Fog/mist band near mid if present */}
        {isFoggy && (
          <g opacity={fx?.fogDensity ? clamp(fx.fogDensity) : (weather!.special === 'fog' ? 0.5 : 0.25)}>
            <rect x="0" y={p(yMid - height * 0.06)} width={width} height={p(height * 0.30)} fill={`url(#${ids.fogVertical})`} />
          </g>
        )}

        {/* NEAR ridge + cypress strip */}
        <g>
          <path
            d={`
              M 0 ${p(yNear)}
              C ${p(width * 0.12)} ${p(yNear - 8)}, ${p(width * 0.38)} ${p(yNear - 2)}, ${p(width * 0.62)} ${p(yNear - 9)}
              S ${p(width * 0.88)} ${p(yNear - 8)}, ${width} ${p(yNear)}
              L ${width} ${height} L 0 ${height} Z
            `}
            fill={P.near}
          />

          {/* cypress trees - varied organic shapes */}
          {cypressXs.map((x, i) => {
            const baseY = yNear + 6;
            const h = 18 + ((i % 3) * 3) + Math.round(rng() * 8);
            const swayDur = 3 + (i % 3);
            const transformOrigin = `${p(x)}px ${baseY}px`;
            const variant = i % 5; // 5 different cypress shapes
            const lean = (rng() - 0.5) * 2; // slight random lean
            const widthVar = 4 + (i % 2) * 2; // width variation

            // Generate organic cypress path based on variant
            const getCypressPath = () => {
              const cx = p(x) + lean;
              const top = baseY - h;
              const mid1 = baseY - h * 0.7;
              const mid2 = baseY - h * 0.4;
              const mid3 = baseY - h * 0.15;

              switch(variant) {
                case 0: // Classic tall narrow
                  return `M ${cx} ${top}
                    C ${cx - widthVar * 0.6} ${mid1}, ${cx - widthVar} ${mid2}, ${cx - widthVar * 0.8} ${mid3}
                    Q ${cx - widthVar * 0.5} ${baseY}, ${p(x) - 2} ${baseY}
                    L ${p(x) + 2} ${baseY}
                    Q ${cx + widthVar * 0.5} ${baseY}, ${cx + widthVar * 0.8} ${mid3}
                    C ${cx + widthVar} ${mid2}, ${cx + widthVar * 0.6} ${mid1}, ${cx} ${top}`;
                case 1: // Slightly bulbous middle
                  return `M ${cx} ${top}
                    C ${cx - widthVar * 0.4} ${top + 3}, ${cx - widthVar * 1.2} ${mid1}, ${cx - widthVar * 1.3} ${mid2}
                    S ${cx - widthVar * 0.6} ${mid3}, ${p(x) - 2} ${baseY}
                    L ${p(x) + 2} ${baseY}
                    C ${cx + widthVar * 0.6} ${mid3}, ${cx + widthVar * 1.3} ${mid2}, ${cx + widthVar * 1.2} ${mid1}
                    S ${cx + widthVar * 0.4} ${top + 3}, ${cx} ${top}`;
                case 2: // Tapered spire
                  return `M ${cx} ${top}
                    Q ${cx - widthVar * 0.3} ${mid1}, ${cx - widthVar * 0.9} ${mid2}
                    Q ${cx - widthVar * 1.1} ${mid3}, ${p(x) - 3} ${baseY}
                    L ${p(x) + 3} ${baseY}
                    Q ${cx + widthVar * 1.1} ${mid3}, ${cx + widthVar * 0.9} ${mid2}
                    Q ${cx + widthVar * 0.3} ${mid1}, ${cx} ${top}`;
                case 3: // Windswept lean
                  const leanOffset = widthVar * 0.4;
                  return `M ${cx + leanOffset} ${top}
                    C ${cx - widthVar * 0.3 + leanOffset} ${mid1}, ${cx - widthVar * 0.8} ${mid2}, ${cx - widthVar * 0.7} ${mid3}
                    L ${p(x) - 2} ${baseY}
                    L ${p(x) + 3} ${baseY}
                    C ${cx + widthVar * 0.8} ${mid3}, ${cx + widthVar * 0.5 + leanOffset} ${mid2}, ${cx + leanOffset} ${top}`;
                default: // Rounded top variant
                  return `M ${cx} ${top + 2}
                    C ${cx - widthVar * 0.8} ${top}, ${cx - widthVar * 1.1} ${mid1}, ${cx - widthVar} ${mid2}
                    Q ${cx - widthVar * 0.7} ${mid3}, ${p(x) - 2} ${baseY}
                    L ${p(x) + 2} ${baseY}
                    Q ${cx + widthVar * 0.7} ${mid3}, ${cx + widthVar} ${mid2}
                    C ${cx + widthVar * 1.1} ${mid1}, ${cx + widthVar * 0.8} ${top}, ${cx} ${top + 2}`;
              }
            };

            return (
              <g
                key={`cy-${i}`}
                style={windy ? { transformOrigin, animation: `med-sway ${swayDur}s ease-in-out infinite` } : undefined}
              >
                {/* Visible trunk */}
                <rect x={p(x) - 1} y={baseY - 6} width="3" height="8" fill={blendHex(P.cypress, '#3a2a20', 0.4)} opacity="0.9" />
                {/* Organic foliage */}
                <path d={getCypressPath()} fill={P.cypress} opacity="0.95" />
                {/* Highlight edge */}
                <path
                  d={`M ${p(x) + lean + widthVar * 0.3} ${baseY - h + 2}
                     Q ${p(x) + lean + widthVar * 0.5} ${baseY - h * 0.5}, ${p(x) + widthVar * 0.4} ${baseY - 4}`}
                  stroke={blendHex(P.cypress, '#7a9a6a', 0.35)}
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.4"
                />
              </g>
            );
          })}

          {/* Umbrella / Stone pines - iconic Mediterranean flat-topped silhouettes */}
          {pineXs.map((x, i) => {
            const baseY = yNear + 4;
            const trunkH = 22 + ((i % 3) * 4) + Math.round(rng() * 8);
            const canopyW = 14 + (i % 2) * 6;
            const canopyH = 6 + (i % 3) * 2;
            const lean = (rng() - 0.5) * 4; // slight trunk lean
            const swayDur = 4 + (i % 3);
            const transformOrigin = `${p(x)}px ${baseY}px`;

            return (
              <g
                key={`pine-${i}`}
                style={windy ? { transformOrigin, animation: `med-sway ${swayDur}s ease-in-out infinite` } : undefined}
              >
                {/* Tall trunk with slight curve */}
                <path
                  d={`M ${p(x) - 1.5} ${baseY}
                    Q ${p(x) + lean * 0.3} ${baseY - trunkH * 0.5}, ${p(x) - 1 + lean * 0.5} ${baseY - trunkH + canopyH}
                    L ${p(x) + 2 + lean * 0.5} ${baseY - trunkH + canopyH}
                    Q ${p(x) + 1 + lean * 0.3} ${baseY - trunkH * 0.5}, ${p(x) + 1.5} ${baseY} Z`}
                  fill={blendHex(P.pine, '#4a3a2a', 0.45)}
                />
                {/* Flat umbrella canopy - distinctive Mediterranean silhouette */}
                <path
                  d={`M ${p(x) + lean * 0.5 - canopyW} ${baseY - trunkH + canopyH * 0.7}
                    C ${p(x) + lean * 0.5 - canopyW * 0.8} ${baseY - trunkH - canopyH * 0.3},
                      ${p(x) + lean * 0.5 - canopyW * 0.3} ${baseY - trunkH - canopyH * 0.6},
                      ${p(x) + lean * 0.5} ${baseY - trunkH - canopyH * 0.5}
                    C ${p(x) + lean * 0.5 + canopyW * 0.3} ${baseY - trunkH - canopyH * 0.6},
                      ${p(x) + lean * 0.5 + canopyW * 0.8} ${baseY - trunkH - canopyH * 0.3},
                      ${p(x) + lean * 0.5 + canopyW} ${baseY - trunkH + canopyH * 0.7}
                    Q ${p(x) + lean * 0.5 + canopyW * 0.6} ${baseY - trunkH + canopyH * 1.2},
                      ${p(x) + lean * 0.5} ${baseY - trunkH + canopyH}
                    Q ${p(x) + lean * 0.5 - canopyW * 0.6} ${baseY - trunkH + canopyH * 1.2},
                      ${p(x) + lean * 0.5 - canopyW} ${baseY - trunkH + canopyH * 0.7}`}
                  fill={P.pine}
                  opacity="0.95"
                />
                {/* Canopy texture - darker clusters */}
                {[0.3, 0.6].map((offset, j) => (
                  <ellipse
                    key={`pine-tex-${i}-${j}`}
                    cx={p(x) + lean * 0.5 + (j === 0 ? -canopyW * 0.4 : canopyW * 0.3)}
                    cy={baseY - trunkH}
                    rx={canopyW * 0.25}
                    ry={canopyH * 0.4}
                    fill={blendHex(P.pine, '#1a3a2a', 0.25)}
                    opacity="0.5"
                  />
                ))}
              </g>
            );
          })}

          {/* Maquis / Garrigue shrubs - Mediterranean scrubland */}
          {shrubClusters.map((cluster, ci) => (
            <g key={`shrub-cluster-${ci}`} opacity={0.85}>
              {Array.from({ length: cluster.count }).map((_, si) => {
                const sx = cluster.x + (rng() - 0.5) * cluster.spread * 2;
                const sy = cluster.y + (rng() - 0.5) * cluster.spread * 0.5;
                const shrubType = (ci + si) % 4;
                const size = 3 + rng() * 4;

                // Different shrub shapes for variety
                switch(shrubType) {
                  case 0: // Rosemary - upright spiky
                    return (
                      <g key={`shrub-${ci}-${si}`}>
                        <path
                          d={`M ${p(sx)} ${p(sy)}
                            Q ${p(sx) - size * 0.3} ${p(sy) - size * 0.8}, ${p(sx) - size * 0.1} ${p(sy) - size * 1.4}
                            L ${p(sx) + size * 0.1} ${p(sy) - size * 1.4}
                            Q ${p(sx) + size * 0.3} ${p(sy) - size * 0.8}, ${p(sx)} ${p(sy)}`}
                          fill={P.maquisDark}
                        />
                        <path
                          d={`M ${p(sx) + size * 0.3} ${p(sy)}
                            Q ${p(sx) + size * 0.5} ${p(sy) - size * 0.6}, ${p(sx) + size * 0.4} ${p(sy) - size * 1.1}
                            L ${p(sx) + size * 0.2} ${p(sy) - size * 1.1}
                            Q ${p(sx) + size * 0.1} ${p(sy) - size * 0.5}, ${p(sx) + size * 0.3} ${p(sy)}`}
                          fill={P.maquis}
                          opacity="0.9"
                        />
                      </g>
                    );
                  case 1: // Lavender - rounded mound
                    return (
                      <ellipse
                        key={`shrub-${ci}-${si}`}
                        cx={p(sx)}
                        cy={p(sy) - size * 0.4}
                        rx={size * 1.2}
                        ry={size * 0.6}
                        fill={blendHex(P.maquis, '#7a6a8a', 0.2)}
                      />
                    );
                  case 2: // Wild thyme - low spreading
                    return (
                      <path
                        key={`shrub-${ci}-${si}`}
                        d={`M ${p(sx) - size * 1.5} ${p(sy)}
                          Q ${p(sx) - size * 0.8} ${p(sy) - size * 0.5}, ${p(sx)} ${p(sy) - size * 0.6}
                          Q ${p(sx) + size * 0.8} ${p(sy) - size * 0.5}, ${p(sx) + size * 1.5} ${p(sy)}
                          Q ${p(sx) + size * 0.5} ${p(sy) + size * 0.2}, ${p(sx) - size * 0.5} ${p(sy) + size * 0.2} Z`}
                        fill={P.maquis}
                        opacity="0.8"
                      />
                    );
                  default: // Cistus - bushy irregular
                    return (
                      <g key={`shrub-${ci}-${si}`}>
                        <ellipse
                          cx={p(sx) - size * 0.3}
                          cy={p(sy) - size * 0.5}
                          rx={size * 0.8}
                          ry={size * 0.6}
                          fill={P.maquisDark}
                        />
                        <ellipse
                          cx={p(sx) + size * 0.4}
                          cy={p(sy) - size * 0.4}
                          rx={size * 0.7}
                          ry={size * 0.5}
                          fill={P.maquis}
                        />
                      </g>
                    );
                }
              })}
            </g>
          ))}

          {/* villas (if urban) */}
          {villas.map((v, k) => (
            <g key={`villa-${k}`} opacity={0.97}>
              <rect x={v.x - v.w / 2} y={v.y - v.h} width={v.w} height={v.h} fill={P.villa} />
              <path
                d={`M ${v.x - v.w / 2 - 2} ${v.y - v.h}
                   L ${v.x} ${v.y - v.h - 6}
                   L ${v.x + v.w / 2 + 2} ${v.y - v.h} Z`}
                fill={P.roof}
              />
              {/* chimney */}
              {isCold && (
                <>
                  <rect x={v.x + v.w * 0.25 - 2} y={v.y - v.h - 8} width="4" height="6" fill={P.nearAcc} />
                  {/* smoke plume */}
                  <g opacity={0.35}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <ellipse
                        key={`smoke-${k}-${s}`}
                        cx={v.x + v.w * 0.25 + Math.sin(s * 0.7) * (s + 1)}
                        cy={v.y - v.h - 8 - s * 4}
                        rx={2 + s * 0.8}
                        ry={2 + s * 0.5}
                        fill={blendHex('#888888', skyMid, 0.4)}
                        opacity={0.6 - s * 0.12}
                      />
                    ))}
                  </g>
                </>
              )}
              {/* windows (night/dusk) */}
              {(isNight || isDusk) && v.glow && (
                <g filter={`url(#${ids.glow})`} style={{ animation: `med-window ${4 + (k % 3)}s ease-in-out infinite` }}>
                  <rect x={v.x - v.w * 0.25} y={v.y - v.h + 3} width="3" height="3" fill={P.windowGlow} rx="0.5" />
                  <rect x={v.x + v.w * 0.1}  y={v.y - v.h + 3} width="3" height="3" fill={P.windowGlow} rx="0.5" opacity="0.85" />
                </g>
              )}
              {/* snow roof cap */}
              {isSnow && <rect x={v.x - v.w / 2 - 1} y={v.y - v.h - 1} width={v.w + 2} height="2" fill={P.snow} opacity="0.9" />}
            </g>
          ))}
        </g>

        {/* Bottom feather into the panel color */}
        <rect x="0" y={yFeather} width={width} height={height - yFeather} fill={`url(#${ids.panel})`} />
      </g>

      {/* Water edges or central water */}
      {hasCentralWater ? (
        <g opacity="0.9">
          <path
            d={`
              M ${p(width * 0.28)} ${p(yMid + 2)}
              C ${p(width * 0.36)} ${p(yMid - 2)}, ${p(width * 0.44)} ${p(yMid)}, ${p(width * 0.50)} ${p(yMid + 2)}
              S ${p(width * 0.64)} ${p(yMid)}, ${p(width * 0.72)} ${p(yMid + 2)}
              L ${p(width * 0.72)} ${p(yNear)}
              C ${p(width * 0.64)} ${p(yNear - 2)}, ${p(width * 0.56)} ${p(yNear)}, ${p(width * 0.50)} ${p(yNear)}
              S ${p(width * 0.36)} ${p(yNear - 2)}, ${p(width * 0.28)} ${p(yNear)}
              Z
            `}
            fill={P.water}
            opacity="0.78"
          />
          {/* Water shimmer/reflection bands */}
          <g style={{ animation: `med-waterwave 4s ease-in-out infinite` }}>
            <path
              d={`M ${p(width * 0.34)} ${p((yMid + yNear) / 2)} Q ${p(width * 0.50)} ${p((yMid + yNear) / 2 - 2)}, ${p(width * 0.66)} ${p((yMid + yNear) / 2)}`}
              stroke={P.waterHi}
              strokeWidth="1"
              opacity="0.4"
              fill="none"
            />
            {/* Additional shimmer lines */}
            {[0.38, 0.50, 0.62].map((xPos, idx) => (
              <rect
                key={`shimmer-${idx}`}
                x={p(width * xPos) - 10}
                y={p((yMid + yNear) / 2 + idx * 3)}
                width="20"
                height="1"
                fill={P.waterHi}
                style={{
                  animation: `med-shimmer ${3 + idx * 0.5}s ease-in-out ${idx * 0.3}s infinite`,
                  transformOrigin: `${p(width * xPos)}px ${p((yMid + yNear) / 2)}px`
                }}
              />
            ))}
          </g>
          {/* Reflected cypresses in water */}
          {cypressXs.slice(2, 5).map((x, i) => (
            <g key={`ref-cy-${i}`} opacity={0.15}>
              <path
                d={`M ${p(x)} ${p(yNear - 2)}
                   L ${p(x - 4)} ${p(yNear + 8)}
                   L ${p(x + 4)} ${p(yNear + 8)} Z`}
                fill={P.cypress}
                style={{
                  transform: `scaleY(-0.6)`,
                  transformOrigin: `${p(x)}px ${p(yNear)}px`,
                  animation: `med-waterwave ${4 + i * 0.5}s ease-in-out ${i * 0.2}s infinite`
                }}
              />
            </g>
          ))}
        </g>
      ) : hasWater && (
        <>
          {/* Left */}
          <g opacity="0.88">
            <path
              d={`
                M 0 ${p(yNear - 12)}
                C ${p(width * 0.10)} ${p(yNear - 14)}, ${p(width * 0.16)} ${p(yNear - 8)}, ${p(width * 0.20)} ${p(yNear - 4)}
                L ${p(width * 0.20)} ${height} L 0 ${height} Z
              `}
              fill={P.water}
            />
            {/* shoreline highlight with shimmer */}
            <g style={{ animation: `med-waterwave 3.5s ease-in-out infinite` }}>
              <path
                d={`M 0 ${p(yNear - 4)} Q ${p(width * 0.12)} ${p(yNear - 5)}, ${p(width * 0.20)} ${p(yNear - 4)}`}
                stroke={P.waterHi}
                strokeWidth="1.5"
                opacity="0.5"
                fill="none"
              />
              {/* Shimmer spots */}
              <rect
                x={p(width * 0.08) - 8}
                y={p(yNear)}
                width="16"
                height="1"
                fill={P.waterHi}
                style={{ animation: `med-shimmer 4s ease-in-out infinite` }}
              />
            </g>
            {/* Reflected cypress on left */}
            {cypressXs[0] && cypressXs[0] < width * 0.2 && (
              <g opacity={0.12}>
                <rect
                  x={p(cypressXs[0]) - 2}
                  y={p(yNear + 2)}
                  width="4"
                  height="8"
                  fill={P.cypress}
                  style={{
                    transform: `scaleY(-0.5)`,
                    transformOrigin: `${p(cypressXs[0])}px ${p(yNear)}px`,
                    animation: `med-waterwave 4.5s ease-in-out infinite`
                  }}
                />
              </g>
            )}
          </g>

          {/* Right */}
          <g opacity="0.88">
            <path
              d={`
                M ${width} ${p(yNear - 8)}
                C ${p(width * 0.92)} ${p(yNear - 10)}, ${p(width * 0.86)} ${p(yNear - 6)}, ${p(width * 0.80)} ${p(yNear - 3)}
                L ${p(width * 0.80)} ${height} L ${width} ${height} Z
              `}
              fill={P.water}
            />
            {/* shoreline highlight with shimmer */}
            <g style={{ animation: `med-waterwave 3.8s ease-in-out 0.5s infinite` }}>
              <path
                d={`M ${width} ${p(yNear - 3)} Q ${p(width * 0.90)} ${p(yNear - 4)}, ${p(width * 0.80)} ${p(yNear - 3)}`}
                stroke={P.waterHi}
                strokeWidth="1.5"
                opacity="0.5"
                fill="none"
              />
              {/* Shimmer spots */}
              <rect
                x={p(width * 0.88) - 8}
                y={p(yNear + 1)}
                width="16"
                height="1"
                fill={P.waterHi}
                style={{ animation: `med-shimmer 4.2s ease-in-out 0.8s infinite` }}
              />
            </g>
            {/* Reflected cypress on right */}
            {cypressXs[cypressXs.length - 1] && cypressXs[cypressXs.length - 1] > width * 0.8 && (
              <g opacity={0.12}>
                <rect
                  x={p(cypressXs[cypressXs.length - 1]) - 2}
                  y={p(yNear + 2)}
                  width="4"
                  height="8"
                  fill={P.cypress}
                  style={{
                    transform: `scaleY(-0.5)`,
                    transformOrigin: `${p(cypressXs[cypressXs.length - 1])}px ${p(yNear)}px`,
                    animation: `med-waterwave 4.3s ease-in-out 0.3s infinite`
                  }}
                />
              </g>
            )}
          </g>
        </>
      )}

      {/* Wind whitecaps & sea glints */}
      {hasWater && (windy || (!isRain && rng() > 0.55)) && (
        <g opacity={windy ? 0.35 : 0.20}>
          {windy && (
            <rect
              x="0"
              y={p(yNear - 8)}
              width={width}
              height={p(height - (yNear - 8))}
              fill="white"
              filter={`url(#${ids.whitecap})`}
              opacity="0.08"
            />
          )}
          {/* calm glints */}
          {!windy && [0.18, 0.42, 0.66, 0.86].map((xr, i) => (
            <rect
              key={`glint-${i}`}
              x={p(width * xr) - 8}
              y={p(yNear - 2 + (i % 2) * 3)}
              width="16"
              height="1"
              fill="#ffffff"
              style={{ animation: `med-glint ${7 + i}s ${1.2 * i}s infinite` }}
              opacity="0"
            />
          ))}
        </g>
      )}

      {/* RAIN: streaks + puddles + wet sheen + lightning */}
      {isRain && (
        <g>
          {/* falling streaks */}
          <g filter={`url(#${ids.rainBlur})`} opacity={0.6}>
            {Array.from({ length: rainDrops }).map((_, i) => {
              const x = p(width * (rng() * 1));
              const y = p(yVF * 0.3 * rng());
              const len = p((8 + dropletSize * 16) * (0.6 + rng() * 0.6));
              const w = Math.max(1, Math.round(1 + dropletSize));
              const dur = (0.9 + rng() * 0.8) * (1.4 - intensity); // heavier → faster
              const delay = rng() * -4;
              return (
                <rect
                  key={`rd-${i}`}
                  x={x}
                  y={y}
                  width={w}
                  height={len}
                  fill={P.rain}
                  opacity={0.8}
                  style={{ animation: `med-rain ${dur}s linear ${delay}s infinite` }}
                  rx={w/2}
                />
              );
            })}
          </g>

          {/* wet ground sheen */}
          <rect x="0" y={p(height * 0.86)} width={width} height={p(height * 0.14)} fill={P.water} opacity={0.12 + (fx?.surfaceWetnessNow ?? intensity) * 0.22} />

          {/* puddles with ripples */}
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
                      style={{ transformOrigin: `${cx}px ${cy}px`, animation: `med-ripple ${1.4 + r * 0.3}s ease-out ${r * 0.35 + i * 0.2}s infinite` }}
                    />
                  ))}
                </g>
              );
            })}
          </g>

          {/* occasional lightning flash */}
          {showLightning && (
            <rect x="0" y="0" width={width} height={height} fill="#ffffff" style={{ animation: `med-lightning ${6 + ((rng() * 5) | 0)}s linear ${rng()*3}s infinite` }} opacity="0" />
          )}
        </g>
      )}

      {/* SNOW: flakes + drift accumulation (near ridge & roofs) + spindrift */}
      {isSnow && (
        <g>
          {/* falling flakes */}
          <g filter={`url(#${ids.snowBlur})`}>
            {Array.from({ length: snowFlakes }).map((_, i) => {
              const sx = p(width * (rng() * 1));
              const sy = p(yVF * 0.2 * rng());
              const size = 1 + Math.round(1 + flakeSize * 2 + (i % 2));
              const dur = 3.5 + (rng() * 2) + (1 - intensity) * 2; // gentle = slower
              const delay = rng() * -6;
              return (
                <circle
                  key={`sf-${i}`}
                  cx={sx} cy={sy} r={size}
                  fill={P.snow}
                  opacity={0.9}
                  style={{ animation: `med-snow ${dur}s linear ${delay}s infinite` }}
                />
              );
            })}
          </g>

          {/* accumulation along near ridge */}
          <path
            d={`
              M 0 ${p(yNear + 2)}
              C ${p(width * 0.20)} ${p(yNear - 2)}, ${p(width * 0.50)} ${p(yNear + 2)}, ${p(width * 0.80)} ${p(yNear - 2)}
              L ${width} ${p(yNear)} L ${width} ${height} L 0 ${height} Z
            `}
            fill={P.snowBlue}
            opacity={0.35 + intensity * 0.35}
          />

          {/* wind spindrift near ridge top when windy */}
          {windy && (
            <path d={`M 0 ${p(yNear - 4)} Q ${p(width * 0.5)} ${p(yNear - 10)}, ${width} ${p(yNear - 4)}`} stroke={P.snow} strokeWidth="2" opacity="0.35" fill="none" />
          )}
        </g>
      )}

      {/* Dust / Sand drift */}
      {airborne && (airborne.type === 'dust' || airborne.type === 'sand') && (
        <g opacity={clamp(airborne.density * 0.6)}>
          <rect x="0" y={yMid - 10} width={width} height={p(height - (yMid - 10))} fill={`url(#${ids.dustVertical})`} filter={`url(#${ids.dust})`} />
        </g>
      )}

      {/* Pollen drift (spring calm) */}
      {pollenDots > 0 && (
        <g opacity={0.45} filter={`url(#${ids.pollen})`}>
          {Array.from({ length: pollenDots }).map((_, i) => {
            const x = p(width * (0.05 + rng() * 0.90));
            const y = p(yMid + rng() * (height - yMid));
            const r = 1 + (i % 2);
            const dur = 6 + (i % 5);
            return (
              <circle key={`pol-${i}`} cx={x} cy={y} r={r} fill={P.pollen} style={{ animation: `med-glint ${dur}s ${rng()*2}s infinite` }} opacity="0" />
            );
          })}
        </g>
      )}

      {/* Blossoms drift (spring FX) */}
      {showBlossoms && (
        <g opacity={0.8}>
          {Array.from({ length: blossomCount }).map((_, i) => {
            const px = p(width * (0.05 + rng() * 0.90));
            const py = p(yNear - 18 - rng() * 24);
            const palette = blossoms!.palette ?? ['#F6D7E7'];
            const color = palette[i % palette.length];
            const size = (blossoms!.sizeRange?.[0] ?? 3) + rng() * ((blossoms!.sizeRange?.[1] ?? 7) - (blossoms!.sizeRange?.[0] ?? 3));
            return (
              <rect
                key={`petal-${i}`}
                x={px}
                y={py}
                width={size}
                height={size * 0.6}
                fill={color}
                opacity="0.9"
                style={{ transformOrigin: `${px}px ${py}px`, animation: `med-petal ${7 + (i % 5)}s linear ${i * 0.18}s infinite` }}
              />
            );
          })}
        </g>
      )}

      {/* Autumn leaves */}
      {showLeaves && (
        <g opacity={0.9}>
          {Array.from({ length: leafCount }).map((_, i) => {
            const px = p(width * (0.06 + rng() * 0.88));
            const py = p(yMid - 6 - rng() * 22);
            const palette = fx?.leafPalette ?? ['#C43E2F','#E07A2E','#E3A018','#9E6A3A','#7A4F2C','#B26E5D'];
            const color = palette[i % palette.length];
            const w = 4 + (i % 3);
            const h = 3 + (i % 2);
            return (
              <path
                key={`leaf-${i}`}
                d={`M ${px} ${py} q ${-w} ${h}, 0 ${2*h} q ${w} ${-h}, 0 ${-2*h} z`}
                fill={color}
                style={{ transformOrigin: `${px}px ${py}px`, animation: `med-leaf ${6 + (i % 5)}s linear ${i * 0.15}s infinite` }}
                opacity="0.95"
              />
            );
          })}
        </g>
      )}

      {/* Rare tiny bird pass */}
      {showBirds && (
        <g opacity="0.35" style={{ animation: `med-bird ${14 + ((rng() * 8) | 0)}s linear infinite` }}>
          <path d={`M ${-12} ${p(yVF - 6)} q 6 -3 12 0 q 6 3 12 0`} fill="none" stroke={P.bird} strokeWidth="1" strokeLinecap="round" />
        </g>
      )}

      {/* Rare small sailboat drifting when calm/clear */}
      {showBoat && !windy && !isFoggy && !isSnow && (
        <g opacity="0.8" style={{ transformOrigin: `${p(width * 0.5)}px ${p(yNear - 3)}px`, animation: `med-sail ${22 + ((rng() * 10) | 0)}s ease-in-out infinite alternate` }}>
          <rect x={p(width * 0.5) - 6} y={p(yNear - 5)} width="12" height="3" fill={blendHex(P.water, '#1b2a44', 0.25)} />
          <rect x={p(width * 0.5) - 1} y={p(yNear - 18)} width="2" height="13" fill={P.near} />
          <path d={`M ${p(width * 0.5) - 1} ${p(yNear - 18)} L ${p(width * 0.5) + 10} ${p(yNear - 10)} L ${p(width * 0.5) - 1} ${p(yNear - 10)} Z`} fill={blendHex('#ffffff', skyMid, 0.2)} />
        </g>
      )}

      {/* Rainbow hint */}
      {showRainbow && (
        <ellipse cx={width / 2} cy={height} rx={width * 0.7} ry={height * 0.9} fill={`url(#${ids.rainbow})`} opacity="0.35" />
      )}

      {/* Fireflies */}
      {showFireflies && (
        <g filter={`url(#${ids.glow})`}>
          {Array.from({ length: fireflyCount }).map((_, i) => {
            const x = p(width * (0.08 + rng() * 0.84));
            const y = p(yMid + rng() * (yNear - yMid));
            return (
              <circle key={`ff-${i}`} cx={x} cy={y} r="1.6" fill={P.firefly} style={{ animation: `med-firefly ${3 + (i%4)}s ease-in-out ${rng()*2}s infinite` }} opacity="0.7" />
            );
          })}
        </g>
      )}

      {/* Aurora (rare) */}
      {showAurora && (
        <g style={{ animation: `med-aurora ${18 + ((rng()*6)|0)}s ease-in-out infinite` }}>
          <path d={`M 0 ${p(yVF - 18)} C ${p(width*0.25)} ${p(yVF - 36)}, ${p(width*0.75)} ${p(yVF - 8)}, ${width} ${p(yVF - 28)} L ${width} 0 L 0 0 Z`}
                fill={`url(#${ids.aurora})`} opacity={0.35 * clamp(auroraP*2)} />
        </g>
      )}
    </svg>
  );
};

export default React.memo(MediterraneanHorizon);
