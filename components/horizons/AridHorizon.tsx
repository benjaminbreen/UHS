/**
 * components/horizons/AridHorizon.tsx
 * Pixel-art inspired ARID horizon with biome profiles + subtle weather animations.
 */

import React, { useMemo } from 'react';
import { TimeOfDay } from '../../types';
import { WeatherState } from '../../services/weatherService';

type AridBiome = 'sonoran' | 'sahara' | 'arabian' | 'australia';

interface AridHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  hasWater?: boolean;
  bottomPanelColor?: string;
  seed?: number;
  weather?: WeatherState;
  biome?: AridBiome;
  regionName?: string;
  sky?: { top: string; mid: string; bottom: string };
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

/** Infer biome from geography.ts region names */
const inferBiome = (name?: string): AridBiome => {
  const n = (name || '').toLowerCase();
  if (!n) return 'sonoran';

  const sonoran = [
    'southern california','southwest','great plains','mexico','central highlands','andes south','gran chaco','pampas'
  ];
  const sahara = [
    'nile valley','nubian corridor','maghreb','eastern desert and red sea','sahel','horn of africa','southern africa'
  ];
  const arabian = [
    'iberian peninsula','levant','anatolia','mesopotamia','arabian peninsula','persian plateau','caucasus',
    'indus valley','deccan plateau','kazakh steppes','central asian oases','xinjiang','mongolia','manchuria','north china plain'
  ];
  const australia = [
    'australia – outback and center','australia - outback and center','australia – west and desert','australia - west and desert'
  ];

  const hit = (arr: string[]) => arr.some(k => n.includes(k.toLowerCase()));
  if (hit(australia)) return 'australia';
  if (hit(sahara)) return 'sahara';
  if (hit(arabian)) return 'arabian';
  if (hit(sonoran)) return 'sonoran';
  return 'sonoran';
};

/* ------------------------------- Component ------------------------------- */

const AridHorizon: React.FC<AridHorizonProps> = ({
  timeOfDay,
  width,
  height,
  hasWater = false,
  bottomPanelColor = '#0B1220',
  seed,
  weather,
  biome: biomeProp,
  regionName,
  sky,
}) => {
  /* -------- rng -------- */
  const baseSeed = useMemo(() => {
    if (typeof seed === 'number') return seed >>> 0;
    const s =
      (width | 0) ^
      ((height | 0) << 7) ^
      Array.from(String(timeOfDay)).reduce((a, c) => a + c.charCodeAt(0), 0);
    return (s >>> 0) || 5517;
  }, [seed, width, height, timeOfDay]);

  const rng = useMemo(() => {
    let t = baseSeed >>> 0;
    return (bump = 1) => {
      t += 0x6d2b79f5 + bump;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), 1 | x);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }, [baseSeed]);

  /* -------- time of day + sky vars -------- */
  const isNight = timeOfDay === 'Night';
  const isDawn = timeOfDay === 'Dawn';
  const isDusk = timeOfDay === 'Dusk';
  const isMid = timeOfDay === 'Midday';

  const getSky = () => {
    if (sky) return { skyTop: sky.top, skyMid: sky.mid, skyBottom: sky.bottom };
    if (typeof window === 'undefined') {
      return { skyTop: '#0a0e27', skyMid: '#1a1a3e', skyBottom: '#16213e' };
    }
    const root = getComputedStyle(document.documentElement);
    const skyTop = root.getPropertyValue('--sky-top').trim() || '#87CEEB';
    const skyMid = root.getPropertyValue('--sky-mid').trim() || '#E6F3FF';
    const skyBottom = root.getPropertyValue('--sky-bottom').trim() || '#FFF4E6';
    return { skyTop, skyMid, skyBottom };
  };
  const { skyTop, skyMid, skyBottom } = getSky();

  const skyInfluence =
    isNight ? 0.95 :
    isDusk  ? 0.50 :
    isDawn  ? 0.45 :
    isMid   ? 0.15 : 0.25;

  const hazeInfluence = isNight ? 0.85 : (isDawn || isDusk) ? 0.50 : 0.25;

  /* -------- biome selection -------- */
  const biome: AridBiome = biomeProp ?? inferBiome(regionName);

  /* -------- palette by biome -------- */
  const P = useMemo(() => {
    const baseByBiome = {
      sonoran: {
        vf: '#6E5A7F', far: '#8A6D66', mesa1: '#A06C44', mesa2: '#B97A4A',
        dune: '#D4B78C', dune2: '#C8A77A', rock: '#7A5B47', vegDark: '#3F5A3F', vegLight: '#557A57',
      },
      sahara: {
        vf: '#726388', far: '#8C7A6D', mesa1: '#997A58', mesa2: '#B08A62',
        dune: '#E1CF9E', dune2: '#D6C18C', rock: '#7A6B57', vegDark: '#42573A', vegLight: '#5E7A56',
      },
      arabian: {
        vf: '#6C5D86', far: '#8C7266', mesa1: '#9C6F53', mesa2: '#B17B5C',
        dune: '#D8C098', dune2: '#CDB186', rock: '#6F5D4A', vegDark: '#3E5638', vegLight: '#567A52',
      },
      australia: {
        vf: '#6B5780', far: '#806A63', mesa1: '#9B6A4C', mesa2: '#B27354',
        dune: '#C0713C', dune2: '#B16535', rock: '#7A5A45', vegDark: '#2E4A32', vegLight: '#4F6A42',
      },
    }[biome];

    const tintFar  = (c: string) => blendHex(c, skyTop,    skyInfluence * 1.10);
    const tintMid  = (c: string) => blendHex(c, skyMid,    skyInfluence * 0.85);
    const tintNear = (c: string) => blendHex(c, skyBottom, skyInfluence * 0.70);

    const hazeLight = blendHex(skyMid,    '#FFFFFF', 1 - hazeInfluence);
    const hazeDark  = blendHex(skyBottom, '#FFFFFF', 1 - (hazeInfluence * 0.85));

    const water = blendHex('#4678A8', skyBottom, 0.35);
    const waterHiDay = blendHex('#A8D8FF', skyMid, 0.35);
    const waterHiNight = blendHex(waterHiDay, '#DDE3FF', 0.6);

    return {
      sky1: 'rgba(0,0,0,0)',
      sky2: `${skyMid}33`,
      sky3: `${skyBottom}99`,

      vf: tintFar(baseByBiome.vf),
      far: tintFar(baseByBiome.far),
      mesa1: tintMid(baseByBiome.mesa1),
      mesa2: tintMid(baseByBiome.mesa2),
      dune: tintNear(baseByBiome.dune),
      dune2: tintNear(baseByBiome.dune2),
      rock: tintNear(baseByBiome.rock),

      vegDark: tintNear(baseByBiome.vegDark),
      vegLight: blendHex(baseByBiome.vegLight, skyBottom, skyInfluence * 0.5),

      hazeLight,
      hazeDark,

      panel0: bottomPanelColor,
      panel1: blendHex(bottomPanelColor, tintNear(baseByBiome.dune2), 0.55),
      panel2: blendHex(bottomPanelColor, tintNear(baseByBiome.dune),  0.35),

      water,
      waterHi: isNight ? waterHiNight : waterHiDay,

      snow: '#F3F4F6',
      snowBright: '#F9FAFB',
      dustTint: `${blendHex(baseByBiome.dune, skyBottom, 0.2)}33`,
    };
  }, [biome, bottomPanelColor, skyTop, skyMid, skyBottom, skyInfluence, hazeInfluence, isNight]);

  /* -------- compact composition for very short strips -------- */
  const compact = height < 110;

  /* -------- layout -------- */
  const yVF   = p(height * (compact ? 0.36 : 0.30));
  const yFar  = p(height * (compact ? 0.50 : 0.44));
  const yMid  = p(height * (compact ? 0.62 : 0.56));
  const yNear = p(height * (compact ? 0.72 : 0.70));
  const yFeather = p(height * 0.82);

  /* -------- path builders -------- */
  const ridgePath = (yBase: number, amp: number, kinks = 9, phase = 0) => {
    const xs = Array.from({ length: kinks }, (_, i) => (i / (kinks - 1)) * width);
    let d = `M 0 ${height} L 0 ${yBase}`;
    for (let i = 1; i < xs.length; i++) {
      const x0 = xs[i - 1];
      const x1 = xs[i];
      const cx = (x0 + x1) / 2;
      const cy = yBase - (amp * (0.4 + rng(100 + i + phase) * 0.6)) + (rng(200 + i + phase) - 0.5) * amp * 0.15;
      d += ` Q ${p(cx)} ${p(cy)}, ${p(x1)} ${p(yBase - amp * (0.35 + rng(300 + i + phase) * 0.65))}`;
    }
    d += ` L ${width} ${height} Z`;
    return d;
  };

  /* -------- dither pattern (distance cue) -------- */
  const ditherSVG = (opacity = 0.06) =>
    `<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'>
       <rect x='0' y='0' width='1' height='1' fill='white' fill-opacity='${opacity}' />
       <rect x='2' y='2' width='1' height='1' fill='white' fill-opacity='${opacity}' />
     </svg>`;

  /* -------- groundforms -------- */
  type Mesa = { x: number; w: number; h: number; top: number };
  const mesas: Mesa[] = useMemo(() => {
    if (biome === 'australia' || biome === 'sahara' || compact) return [];
    const out: Mesa[] = [];
    const cnt = 3 + ((rng(60) * 3) | 0);
    for (let i = 0; i < cnt; i++) {
      const w = width * (0.08 + rng(300 + i) * 0.10);
      const x = width * (0.06 + rng(310 + i) * 0.88 - w * 0.5);
      const h = height * (0.10 + rng(320 + i) * 0.06);
      out.push({ x, w, h, top: yMid - h });
    }
    return out;
  }, [rng, width, height, yMid, biome, compact]);

  /* -------- plant stamps -------- */

  const Saguaro: React.FC<{ x: number; baseY: number; h: number; arms?: boolean }> = ({ x, baseY, h, arms = true }) => {
    const w = Math.max(2, h * 0.10);
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - w / 2} y={baseY - h} width={w} height={h} fill={P.vegDark} />
        <rect x={x - w / 2 + 2} y={baseY - h} width={1} height={h} fill="#000" opacity={0.18} />
        <rect x={x + w / 2 - 3} y={baseY - h} width={1} height={h} fill="#000" opacity={0.18} />
        <rect x={x + w / 2 - 1} y={baseY - h + 2} width={1} height={h - 4} fill={P.vegLight} opacity={isNight ? 0.38 : 0.18} />
        {arms && (
          <>
            <rect x={x - w * 1.6} y={baseY - h * 0.62} width={w * 0.9} height={w * 0.5} fill={P.vegDark} />
            <rect x={x - w * 1.6} y={baseY - h * 0.62} width={w * 0.5} height={h * 0.33} fill={P.vegDark} />
            <rect x={x + w * 0.7} y={baseY - h * 0.70} width={w * 0.9} height={w * 0.5} fill={P.vegDark} />
            <rect x={x + w * 1.45} y={baseY - h * 0.70} width={w * 0.5} height={h * 0.35} fill={P.vegDark} />
          </>
        )}
      </g>
    );
  };
  const PricklyPear: React.FC<{ x: number; baseY: number; s: number }> = ({ x, baseY, s }) => {
    const rx = width * 0.016 * s;
    const ry = height * 0.020 * s;
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - rx} y={baseY - ry * 1.1} width={rx * 2} height={ry * 1.6} fill={P.vegDark} />
        <rect x={x - rx * 1.65} y={baseY - ry * 2.0} width={rx * 1.6} height={ry * 1.4} fill={P.vegLight} />
        <rect x={x + rx * 0.3} y={baseY - ry * 1.9} width={rx * 1.5} height={ry * 1.3} fill={P.vegLight} />
      </g>
    );
  };

  const UmbrellaAcacia: React.FC<{ x: number; baseY: number; h: number }> = ({ x, baseY, h }) => {
    const w = Math.max(2, h * 0.08);
    const crownW = h * 0.9;
    const crownH = h * 0.25;
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - w / 2} y={baseY - h * 0.35} width={w} height={h * 0.35} fill={P.vegDark} />
        <rect x={x - crownW * 0.55} y={baseY - h * 0.70} width={crownW * 1.1} height={crownH} fill={P.vegDark} />
        <rect x={x - crownW * 0.45} y={baseY - h * 0.62} width={crownW * 0.9} height={crownH * 0.7} fill={P.vegLight} />
      </g>
    );
  };

  const SpinifexHummock: React.FC<{ x: number; baseY: number; s: number }> = ({ x, baseY, s }) => {
    const w = 10 * s;
    const h = 8 * s;
    const straw = blendHex(P.dune, '#FFF4C7', 0.15);
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - w * 0.6} y={baseY - h} width={w * 1.2} height={h * 0.6} fill={P.vegDark} />
        <rect x={x - w * 0.5} y={baseY - h * 0.7} width={w} height={h * 0.5} fill={straw} opacity={0.8} />
      </g>
    );
  };
  const MulgaClump: React.FC<{ x: number; baseY: number; h: number }> = ({ x, baseY, h }) => {
    const trunkW = Math.max(1, h * 0.05);
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - trunkW / 2} y={baseY - h * 0.35} width={trunkW} height={h * 0.35} fill={P.vegDark} />
        <rect x={x - h * 0.35} y={baseY - h * 0.70} width={h * 0.70} height={h * 0.28} fill={P.vegDark} />
        <rect x={x - h * 0.28} y={baseY - h * 0.62} width={h * 0.56} height={h * 0.22} fill={P.vegLight} />
      </g>
    );
  };
  const TermiteMound: React.FC<{ x: number; baseY: number; h: number }> = ({ x, baseY, h }) => {
    const w = Math.max(3, h * 0.28);
    const ochre = blendHex(P.dune2, '#B56A3A', 0.4);
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - w * 0.5} y={baseY - h} width={w} height={h} fill={ochre} />
        <rect x={x - w * 0.4} y={baseY - h * 0.85} width={w * 0.8} height={h * 0.1} fill="#000" opacity={0.12} />
      </g>
    );
  };

  /* -------- placements -------- */

  const fgObjects = useMemo(() => {
    const xs: number[] = [];
    const target = biome === 'australia' ? 3 : (biome === 'sahara' || biome === 'arabian' ? 2 : 2);
    for (let i = 0; i < 30; i++) {
      const x = width * (0.08 + rng(1210 + i) * 0.84);
      if (xs.every(px => Math.abs(px - x) > width * 0.18)) xs.push(x);
      if (xs.length >= target) break;
    }
    return xs.map((x, i) => {
      if (biome === 'sonoran') {
        const isSag = rng(1500 + i) > 0.55;
        return { type: isSag ? 'saguaro' : 'pear', x, h: height * (0.22 + rng(1220 + i) * 0.1), s: 1 + rng(1330 + i) * 0.4, arms: rng(1400 + i) > 0.5 } as const;
      }
      if (biome === 'australia') {
        const pick = rng(1500 + i);
        if (pick > 0.66) return { type: 'mulga', x, h: height * (0.18 + rng(1220 + i) * 0.08) } as const;
        if (pick > 0.33) return { type: 'spinifex', x, s: 1 + rng(1600 + i) * 0.5 } as const;
        return { type: 'mound', x, h: height * (0.10 + rng(1700 + i) * 0.06) } as const;
      }
      return { type: 'acacia', x, h: height * (0.18 + rng(1220 + i) * 0.08) } as const;
    });
  }, [rng, width, height, biome]);

  const midSprigs = useMemo(() => {
    const n = 18 + ((rng(1000) * 8) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.04 + (i / (n - 1)) * 0.92 + (rng(1010 + i) - 0.5) * 0.02),
      s: 0.8 + rng(1030 + i) * 0.6,
      cactus: biome === 'sonoran' ? rng(1020 + i) > 0.78 : false,
    }));
  }, [rng, width, biome]);

  /* -------- ids & weather flags -------- */
  const uid = useMemo(() => `arid-${Math.random().toString(36).slice(2, 9)}`, []);
  const ids = {
    topfade: `${uid}-topfade`,
    topmask: `${uid}-topmask`,
    hazeL: `${uid}-hazeL`,
    hazeD: `${uid}-hazeD`,
    panel: `${uid}-panel`,
    dithL: `${uid}-dithL`,
    dithM: `${uid}-dithM`,
    heat: `${uid}-heat`,
    rainbow: `${uid}-rainbow`,
    spindriftClip: `${uid}-spindrift-clip`,
    dustClip: `${uid}-dust-clip`,
  };

  const intensity = weather?.intensity ?? 0;
  const isRain = weather?.precipitation === 'rain' && intensity > 0;
  const isSnow = weather?.precipitation === 'snow' && intensity > 0;
  const windy = (weather?.windSpeed ?? 0) >= 18;
  const isHotStrict =
    (weather?.fx?.heatShimmer ?? 0) > 0.2 ||
    weather?.special === 'heatwave' ||
    weather?.condition === 'hot';
  const heatOpacity = Math.min(0.12 + (weather?.fx?.heatShimmer ?? 0) * 0.55, 0.6);

  const showRainbow = (weather?.fx?.rainbowProbability ?? 0) > 0.4 && isRain && !isNight;
  const showLightning = (weather?.fx?.lightningProbability ?? 0) > 0.18 && isRain;
  const airborne = weather?.fx?.airborneParticles;
  const showSandSheet = !!airborne && (airborne.type === 'sand' || airborne.type === 'dust') &&
                        (airborne.density ?? 0) > 0.4 && !isRain && !isSnow;

  const scrubSwayDir = Math.cos(((weather?.windDirection ?? 0) * Math.PI) / 180) >= 0 ? 1 : -1;

  /* --------------------------------- Render --------------------------------- */

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', left: 0, bottom: 0, pointerEvents: 'none', imageRendering: 'pixelated' }}
      shapeRendering="crispEdges"
    >
      {/* ----------- local CSS animations ----------- */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .anim, .ripple, .plop, .sway, .flash, .bolt, .ddrift, .twinkle, .drift-breathe { animation: none !important; }
        }
        @keyframes rippleGrow {
          0%   { transform: scale(0.25); opacity: 0.6; }
          70%  { opacity: 0.25; }
          100% { transform: scale(1); opacity: 0; }
        }
        .ripple {
          transform-origin: center;
          transform-box: fill-box;
          vector-effect: non-scaling-stroke;
          animation: rippleGrow var(--rippleDur, 1.6s) ease-out var(--rippleDelay, 0s) infinite;
        }
        @keyframes plopFlash {
          0% { opacity: 0; }
          40% { opacity: 0.85; }
          100% { opacity: 0; }
        }
        .plop { animation: plopFlash 120ms ease-out var(--plopDelay, 0s) both; }

        @keyframes sway {
          0%,100% { transform: translateX(calc(var(--swayDir, 1) * -1px)); }
          50%     { transform: translateX(calc(var(--swayDir, 1) *  1px)); }
        }
        .sway { animation: sway var(--swayDur, 2.6s) ease-in-out infinite; }

        @keyframes lightningFlash {
          0%, 82%, 100% { opacity: 0; }
          84% { opacity: 0.35; }
          86% { opacity: 0; }
          88% { opacity: 0.15; }
          92% { opacity: 0; }
        }
        .flash { animation: lightningFlash var(--flashDur, 5s) linear infinite; }

        @keyframes boltGlow {
          0%, 90%, 100% { opacity: 0; }
          92% { opacity: 0.6; }
          96% { opacity: 0.0; }
        }
        .bolt { animation: boltGlow var(--flashDur, 5s) linear infinite; }

        @keyframes ddrift {
          0% { transform: translateX(-12%); }
          100% { transform: translateX(112%); }
        }
        .ddrift { animation: ddrift var(--ddur, 10s) linear infinite; }

        @keyframes twinkle {
          0%,100% { opacity: 0.25; }
          50%     { opacity: 1; }
        }
        .twinkle { animation: twinkle var(--tdur, 2.8s) ease-in-out var(--tdelay, 0s) infinite; }

        @keyframes driftBreath {
          0%,100% { transform: scaleY(1); }
          50%     { transform: scaleY(1.03); }
        }
        .drift-breathe { transform-origin: bottom; animation: driftBreath 3.6s ease-in-out infinite; }
      `}</style>

      <defs>
        {/* Top fade gradient for smooth transition into TimeAwareBackground */}
        <linearGradient id={ids.topfade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0" />
          <stop offset="40%"  stopColor="white" stopOpacity=".20" />
          <stop offset="65%"  stopColor="white" stopOpacity=".48" />
          <stop offset="82%"  stopColor="white" stopOpacity=".82" />
          <stop offset="100%" stopColor="white" stopOpacity=".98" />
        </linearGradient>
        <mask id={ids.topmask}>
          <rect x="0" y="0" width={width} height={height} fill={`url(#${ids.topfade})`} />
          <path d={ridgePath(height * 0.30, height * 0.05, 12, 999)} fill="white" opacity="0.18" />
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

        {/* Bottom feather into panel color */}
        <linearGradient id={ids.panel} x1="0" y1={yFeather} x2="0" y2={height}>
          <stop offset="0%" stopColor={P.panel2} />
          <stop offset="55%" stopColor={P.panel1} />
          <stop offset="100%" stopColor={P.panel0} />
        </linearGradient>

        {/* Dither fills */}
        <pattern id={ids.dithL} width="4" height="4" patternUnits="userSpaceOnUse">
          <image href={`data:image/svg+xml;utf8,${encodeURIComponent((`<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'><rect x='0' y='0' width='1' height='1' fill='white' fill-opacity='0.04'/><rect x='2' y='2' width='1' height='1' fill='white' fill-opacity='0.04'/></svg>`))}`} width="4" height="4" />
        </pattern>
        <pattern id={ids.dithM} width="4" height="4" patternUnits="userSpaceOnUse">
          <image href={`data:image/svg+xml;utf8,${encodeURIComponent((`<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'><rect x='0' y='0' width='1' height='1' fill='white' fill-opacity='0.07'/><rect x='2' y='2' width='1' height='1' fill='white' fill-opacity='0.07'/></svg>`))}`} width="4" height="4" />
        </pattern>

        {/* Heat shimmer filter: slightly stronger than before */}
        <filter id={ids.heat}>
          <feTurbulence baseFrequency="0.028 0.012" numOctaves="2" result="turb" />
          <feDisplacementMap in="SourceGraphic" in2="turb" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* Rainbow stroke gradient */}
        <linearGradient id={ids.rainbow} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FF3B30" />
          <stop offset="16%"  stopColor="#FF9500" />
          <stop offset="33%"  stopColor="#FFCC00" />
          <stop offset="50%"  stopColor="#34C759" />
          <stop offset="66%"  stopColor="#007AFF" />
          <stop offset="83%"  stopColor="#5856D6" />
          <stop offset="100%" stopColor="#AF52DE" />
        </linearGradient>

        {/* Snow spindrift clip along near ground */}
        <clipPath id={ids.spindriftClip}>
          <rect x="0" y={p(height * 0.82)} width={width} height={p(height * 0.18)} />
        </clipPath>

        {/* Dust sheet clip over mid ground */}
        <clipPath id={ids.dustClip}>
          <rect x="0" y={p(yFar)} width={width} height={p(yNear - yFar)} />
        </clipPath>
      </defs>

      {/* Masked group allows top to fade into background sky */}
      <g mask={`url(#${ids.topmask})`}>
        {/* VERY FAR violet ridges */}
        <g opacity={isNight ? 0.22 : 0.30}>
          <path d={ridgePath(yVF, p(height * 0.12), 10)} fill={P.vf} />
          <rect x="0" y="0" width={width} height={yVF} fill={`url(#${ids.dithL})`} opacity="0.45" />
        </g>

        {/* Night star twinkle band (clear nights) */}
        {isNight && (weather?.cloudCover ?? 0) < 0.2 && (
          <g>
            {Array.from({ length: 8 + ((rng(500) * 4) | 0) }).map((_, i) => {
              const x = p(width * (0.08 + rng(510 + i) * 0.84));
              const y = p(yVF * (0.35 + rng(520 + i) * 0.45));
              const d = 2 + ((rng(530 + i) * 2) | 0);
              const dur = 2.2 + rng(540 + i) * 2.2;
              const delay = rng(550 + i) * 2.5;
              return (
                <rect
                  key={`tw-${i}`}
                  x={x}
                  y={y}
                  width={d}
                  height={d}
                  fill="#DDE3FF"
                  opacity={0.8}
                  className="twinkle"
                  style={{ ['--tdur' as any]: `${dur}s`, ['--tdelay' as any]: `${delay}s` } as React.CSSProperties}
                />
              );
            })}
          </g>
        )}

        {/* Haze between vf/far */}
        <rect x="0" y={p(yVF - height * 0.02)} width={width} height={p(height * 0.07)} fill={`url(#${ids.hazeD})`} />

        {/* FAR ridges (lower amplitude for plains) */}
        <g opacity={isNight ? 0.32 : 0.50}>
          <path d={ridgePath(yFar, p(height * (biome === 'australia' ? 0.06 : 0.10)), 9)} fill={P.far} />
          <rect x="0" y={yVF} width={width} height={p(yFar - yVF)} fill={`url(#${ids.dithM})`} opacity="0.25" />
        </g>

        {/* Haze between far/mid */}
        <rect x="0" y={p(yFar - height * 0.01)} width={width} height={p(height * 0.06)} fill={`url(#${ids.hazeL})`} />

        {/* MID groundforms */}
        <g opacity={isNight ? 0.80 : 0.96}>
          {mesas.length > 0 ? (
            <>
              {mesas.map((m, i) => (
                <g key={i} shapeRendering="crispEdges">
                  <rect x={p(m.x)}             y={p(m.top + m.h * 0.74)} width={p(m.w)}         height={p(m.h * 0.26)} fill={P.mesa1} />
                  <rect x={p(m.x + m.w * 0.08)} y={p(m.top + m.h * 0.50)} width={p(m.w * 0.84)} height={p(m.h * 0.24)} fill={P.mesa1} />
                  <rect x={p(m.x + m.w * 0.16)} y={p(m.top + m.h * 0.28)} width={p(m.w * 0.68)} height={p(m.h * 0.22)} fill={P.mesa2} />
                  <rect x={p(m.x + m.w * 0.22)} y={p(m.top)}             width={p(m.w * 0.56)} height={p(m.h * 0.28)} fill={P.mesa2} />
                  <rect x={p(m.x)}             y={p(m.top + m.h * 0.62)} width={p(m.w)}         height={1}              fill="#000" opacity={0.12} />
                  <rect x={p(m.x)}             y={p(m.top + m.h * 0.42)} width={p(m.w)}         height={1}              fill="#000" opacity={0.10} />
                </g>
              ))}
              {/* long dune shelf under mesas */}
              <path
                d={`
                  M 0 ${p(yMid + 4)}
                  C ${p(width * 0.22)} ${p(yMid - 8)}, ${p(width * 0.44)} ${p(yMid + 2)}, ${p(width * 0.66)} ${p(yMid - 6)}
                  S ${p(width * 0.92)} ${p(yMid - 10)}, ${width} ${p(yMid + 2)}
                  L ${width} ${height} L 0 ${height} Z
                `}
                fill={P.dune}
              />
            </>
          ) : (
            <>
              <path
                d={`
                  M 0 ${p(yMid + 6)}
                  C ${p(width * 0.20)} ${p(yMid - (biome === 'australia' ? 2 : 6))},
                    ${p(width * 0.55)} ${p(yMid + (biome === 'australia' ? 2 : 0))},
                    ${width} ${p(yMid - (biome === 'australia' ? 2 : 4))}
                  L ${width} ${height} L 0 ${height} Z
                `}
                fill={P.dune}
              />
              {biome !== 'australia' && (
                <>
                  {[0,1,2].map(i => (
                    <path
                      key={i}
                      d={`M 0 ${p(yMid - 6 + i * 5)} Q ${p(width * 0.25)} ${p(yMid - 8 + i * 5)}, ${p(width * 0.5)} ${p(yMid - 6 + i * 5)} T ${width} ${p(yMid - 6 + i * 5)}`}
                      stroke={P.dustTint}
                      strokeWidth={1}
                      fill="none"
                    />
                  ))}
                </>
              )}
            </>
          )}
        </g>

        {/* Haze above mid */}
        <rect x="0" y={p(yMid - height * 0.02)} width={width} height={p(height * 0.06)} fill={`url(#${ids.hazeL})`} />

        {/* NEAR scrub strip with tiny posts */}
        <g className={windy ? 'sway' : ''} style={{ ['--swayDir' as any]: scrubSwayDir, ['--swayDur' as any]: `${Math.max(1.6, 2.6 - Math.min((weather?.windSpeed ?? 0), 32)/20)}s` } as React.CSSProperties}>
          {/* scrub baseline */}
          {(() => {
            const bumps = 56;
            const step = width / bumps;
            let d = `M 0 ${height} L 0 ${p(yNear - 2)}`;
            const amp = biome === 'australia' ? height * 0.028 : height * 0.038;
            for (let i = 1; i <= bumps; i++) {
              const x = i * step;
              const t = 0.3 + rng(150 + i) * 0.7;
              d += ` L ${p(x)} ${p(yNear - amp * t)}`;
            }
            d += ` L ${width} ${height} Z`;
            return <path d={d} fill={P.vegDark} opacity={isNight ? 0.78 : 0.96} />;
          })()}
          {/* sprinkle posts / micro vegetation */}
          {midSprigs.map((s, i) =>
            s.cactus ? (
              <rect key={i} x={p(s.x) - 1} y={p(yNear - height * 0.03 * s.s)} width={2} height={p(height * 0.03 * s.s)} fill={P.vegDark} />
            ) : (
              <rect key={i} x={p(s.x) - 1.5} y={p(yNear - height * 0.02 * s.s)} width={3} height={p(height * 0.02 * s.s)} fill={P.vegLight} />
            )
          )}
        </g>

        {/* FOREGROUND near edge + rocks */}
        <g>
          <path
            d={`M 0 ${p(yNear + 8)} C ${p(width * 0.28)} ${p(yNear + 2)}, ${p(width * 0.62)} ${p(yNear + 9)}, ${width} ${p(yNear + 4)}`}
            stroke={isNight ? blendHex(P.vegLight, '#AEB8E5', 0.6) : blendHex(P.dune2, '#FFD8A0', 0.35)}
            strokeWidth={1.5}
            fill="none"
            opacity={isNight ? 0.22 : 0.30}
          />
          {Array.from({ length: biome === 'australia' ? 4 : 7 }).map((_, i) => {
            const x = p(width * (0.06 + rng(1100 + i) * 0.88));
            const rx = p(width * (0.010 + rng(1110 + i) * 0.018));
            const ry = p(height * (0.008 + rng(1120 + i) * 0.012));
            return <ellipse key={i} cx={x} cy={p(yNear + 8)} rx={rx} ry={ry} fill={P.rock} opacity={isNight ? 0.45 : 0.75} />;
          })}
        </g>

        {/* FOREGROUND feature silhouettes (biome-specific) */}
        <g opacity={isNight ? 0.82 : 0.98} className={windy ? 'sway' : ''} style={{ ['--swayDir' as any]: scrubSwayDir, ['--swayDur' as any]: `${Math.max(1.5, 2.2 - Math.min((weather?.windSpeed ?? 0), 32)/24)}s` } as React.CSSProperties}>
          {fgObjects.map((o, i) => {
            const baseY = yNear + 8;
            if (o.type === 'saguaro') return <Saguaro key={i} x={o.x} baseY={baseY} h={(o as any).h} arms={(o as any).arms} />;
            if (o.type === 'pear')    return <PricklyPear key={i} x={o.x} baseY={baseY} s={(o as any).s} />;
            if (o.type === 'acacia')  return <UmbrellaAcacia key={i} x={o.x} baseY={baseY} h={(o as any).h} />;
            if (o.type === 'mulga')   return <MulgaClump key={i} x={o.x} baseY={baseY} h={(o as any).h} />;
            if (o.type === 'spinifex')return <SpinifexHummock key={i} x={o.x} baseY={baseY} s={(o as any).s} />;
            if (o.type === 'mound')   return <TermiteMound key={i} x={o.x} baseY={baseY} h={(o as any).h} />;
            return null;
          })}
        </g>

        {/* Bottom feather into the panel color */}
        <rect x="0" y={yFeather} width={width} height={height - yFeather} fill={`url(#${ids.panel})`} />
      </g>

      {/* Left/right coastal water */}
      {hasWater && (
        <>
          {/* Left */}
          <g opacity="0.85">
            <path
              d={`
                M 0 ${p(height * 0.70)}
                C ${p(width * 0.08)} ${p(height * 0.68)}, ${p(width * 0.12)} ${p(height * 0.73)}, ${p(width * 0.14)} ${p(height * 0.76)}
                L ${p(width * 0.14)} ${height} L 0 ${height} Z
              `}
              fill={P.water}
            />
            <path
              d={`M 0 ${p(height * 0.76)} Q ${p(width * 0.07)} ${p(height * 0.75)}, ${p(width * 0.13)} ${p(height * 0.76)}`}
              stroke={P.waterHi}
              strokeWidth="1.5"
              opacity="0.45"
              fill="none"
            />
          </g>
          {/* Right */}
          <g opacity="0.85">
            <path
              d={`
                M ${width} ${p(height * 0.70)}
                C ${p(width * 0.92)} ${p(height * 0.68)}, ${p(width * 0.88)} ${p(height * 0.73)}, ${p(width * 0.86)} ${p(height * 0.76)}
                L ${p(width * 0.86)} ${height} L ${width} ${height} Z
              `}
              fill={P.water}
            />
            <path
              d={`M ${width} ${p(height * 0.76)} Q ${p(width * 0.93)} ${p(height * 0.75)}, ${p(width * 0.87)} ${p(height * 0.76)}`}
              stroke={P.waterHi}
              strokeWidth="1.5"
              opacity="0.45"
              fill="none"
            />
          </g>
        </>
      )}

      {/* ---------------------------- Weather overlays ---------------------------- */}

      {/* Heat shimmer */}
      {isHotStrict && !isRain && !isSnow && (
        <g opacity={heatOpacity} filter={`url(#${ids.heat})`}>
          <rect x="0" y={p(yMid - height * 0.01)} width={width} height={p(height * 0.12)} fill={`url(#${ids.hazeL})`} />
        </g>
      )}

      {/* Dust/sand sheet drifting across mid */}
      {showSandSheet && (
        <g clipPath={`url(#${ids.dustClip})`} opacity={(airborne!.density ?? 0) * 0.6}>
          <rect className="ddrift" x={-width} y={p(yFar)} width={width * 2} height={p(yNear - yFar)} fill={P.dustTint}
                style={{ ['--ddur' as any]: `${8 + (3 - Math.min(3, (weather?.windSpeed ?? 0) / 8))}s` } as React.CSSProperties} />
        </g>
      )}

      {/* Rain puddles + wet sheen + plink ripples */}
      {isRain && (
        <g opacity={0.35 + intensity * 0.35}>
          {Array.from({ length: biome === 'australia' ? 6 : 8 }).map((_, i) => {
            const xfrac = (i + 1) / (biome === 'australia' ? 7 : 9);
            const pudX = p(width * xfrac + Math.sin(i * 13.7) * 20);
            const pudY = p(height * (0.86 + Math.sin(i * 7.3) * 0.03));
            const pudW = p(12 + intensity * 12 + (i % 3) * 5);
            const pudH = p(3 + intensity * 2);

            const r1Delay = (i * 0.37) % 1.8;
            const r2Delay = ((i * 0.37) + 0.6) % 1.8;

            return (
              <g key={`arid-pud-${i}`}>
                <ellipse cx={pudX} cy={pudY} rx={pudW} ry={pudH} fill={P.water} opacity={0.55 + intensity * 0.3} />
                {/* specular line */}
                <path d={`M ${p(pudX - pudW * 0.6)} ${p(pudY)} L ${p(pudX + pudW * 0.6)} ${p(pudY)}`} stroke={P.waterHi} strokeWidth="1" opacity="0.35" />
                {/* ripple rings */}
                <circle cx={pudX} cy={pudY} r={Math.max(1, pudH - 1)} fill="none" stroke={P.waterHi} strokeWidth="1" className="ripple"
                        style={{ ['--rippleDur' as any]: `${1.6 + rng(800 + i) * 0.8}s`, ['--rippleDelay' as any]: `${r1Delay}s` } as React.CSSProperties} />
                <circle cx={pudX} cy={pudY} r={Math.max(1, pudH - 1)} fill="none" stroke={P.waterHi} strokeWidth="1" className="ripple"
                        style={{ ['--rippleDur' as any]: `${1.6 + rng(900 + i) * 0.8}s`, ['--rippleDelay' as any]: `${r2Delay}s` } as React.CSSProperties} />
                {/* plink highlight */}
                <circle cx={pudX} cy={pudY - 2} r="1.5" fill={P.waterHi} className="plop" style={{ ['--plopDelay' as any]: `${r1Delay + 0.1}s` } as React.CSSProperties} />
              </g>
            );
          })}
          {/* Wet ground sheen */}
          <rect x="0" y={p(height * 0.82)} width={width} height={p(height * 0.18)} fill={P.water} opacity={0.12 + intensity * 0.18} />
        </g>
      )}

      {/* Snowdrifts + spindrift */}
      {isSnow && (
        <g opacity={0.45 + intensity * 0.35}>
          {/* primary drift along near ground */}
          <path
            className="drift-breathe"
            d={`
              M 0 ${p(height * 0.86)}
              C ${p(width * 0.20)} ${p(height * (0.85 - intensity * 0.015))},
                ${p(width * 0.50)} ${p(height * 0.87)},
                ${p(width * 0.80)} ${p(height * (0.86 - intensity * 0.015))}
              L ${width} ${p(height * 0.86)}
              L ${width} ${height} L 0 ${height} Z
            `}
            fill={P.snow}
            opacity={0.7}
          />
          {/* lighter crest highlight */}
          <path
            d={`M 0 ${p(height * 0.86)} Q ${p(width * 0.45)} ${p(height * (0.85 - intensity * 0.008))}, ${width} ${p(height * 0.86)}`}
            stroke={P.snowBright}
            strokeWidth={1}
            opacity={0.55}
            fill="none"
          />
          {/* caps on mesa tops (if any) */}
          {mesas.map((m, i) => (
            <rect
              key={`mesa-snow-${i}`}
              x={p(m.x + m.w * 0.18)}
              y={p(m.top)}
              width={p(m.w * 0.64)}
              height={p(2 + intensity * 2)}
              fill={P.snowBright}
              opacity={0.75}
            />
          ))}
          {/* simple caps on feature objects */}
          {fgObjects.map((o, i) => {
            const baseY = yNear + 8;
            if (o.type === 'saguaro') {
              const w = (o as any).h * 0.10;
              return <rect key={`cap-${i}`} x={p((o as any).x - w / 2)} y={p(baseY - (o as any).h - 2)} width={p(w)} height={2} fill={P.snowBright} opacity={0.8} />;
            }
            if (o.type === 'pear') {
              return <ellipse key={`cap-${i}`} cx={p((o as any).x)} cy={p(baseY - height * 0.020 * (o as any).s)} rx={p(width * 0.012 * (o as any).s)} ry={2} fill={P.snowBright} opacity={0.8} />;
            }
            if (o.type === 'acacia' || o.type === 'mulga') {
              return <rect key={`cap-${i}`} x={p((o as any).x - 4)} y={p(baseY - (o as any).h * 0.70 - 2)} width={8} height={2} fill={P.snowBright} opacity={0.75} />;
            }
            if (o.type === 'mound') {
              return <rect key={`cap-${i}`} x={p((o as any).x - ((o as any).h * 0.28) * 0.5)} y={p(baseY - (o as any).h - 1)} width={p((o as any).h * 0.28)} height={1} fill={P.snowBright} opacity={0.8} />;
            }
            return null;
          })}

          {/* spindrift: lateral flutter near ground */}
          <g clipPath={`url(#${ids.spindriftClip})`} opacity={0.35 + intensity * 0.25}>
            <rect className="ddrift" x={-width} y={p(height * 0.83)} width={width * 2} height={p(height * 0.04)} fill={P.snowBright}
                  style={{ ['--ddur' as any]: `${10 - Math.min(6, (weather?.windSpeed ?? 0) / 4)}s` } as React.CSSProperties} />
          </g>
        </g>
      )}

      {/* Lightning (flash wash + simple bolt) */}
      {showLightning && (
        <>
          <rect x="0" y="0" width={width} height={height} fill="#FFFFFF" opacity={0.0} className="flash"
                style={{ ['--flashDur' as any]: `${4.5 + rng(777) * 2}s` } as React.CSSProperties} />
          <g className="bolt" opacity={0.0} style={{ ['--flashDur' as any]: `${4.5 + rng(778) * 2}s` } as React.CSSProperties}>
            {/* stylized zig bolt */}
            <path
              d={`
                M ${p(width * 0.72)} ${p(yVF * 0.4)}
                L ${p(width * 0.66)} ${p(yFar * 0.8)}
                L ${p(width * 0.76)} ${p(yMid * 0.7)}
                L ${p(width * 0.62)} ${p(yNear * 0.92)}
              `}
              stroke="#EAF0FF"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="miter"
            />
          </g>
        </>
      )}

      {/* Rainbow (rare) */}
      {showRainbow && (
        <path
          d={`M ${p(width * 0.05)} ${p(yFar * 0.9)} Q ${p(width * 0.5)} ${p(yVF * 0.5)}, ${p(width * 0.95)} ${p(yFar * 0.9)}`}
          stroke={`url(#${ids.rainbow})`}
          strokeWidth="2"
          fill="none"
          opacity="0.35"
        />
      )}
    </svg>
  );
};

export default React.memo(AridHorizon);
