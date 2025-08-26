/**
 * components/horizons/TropicalHorizon.tsx
 *
 * High-quality pixel-art inspired tropical horizon with strong depth cues:
 * - Progressive bottom banding that blends into the bottom panel slate
 * - Very-far hazy islands → far jungle ridges → mid canopy → near treeline
 * - Foreground palms + understory silhouettes (seeded + stable)
 * - Multiple fog/haze banks between layers (time-of-day colored)
 * - Night palette drifts into deep blues and purples
 * - Optional water glints/ripples near the bottom
 */

import React, { useMemo } from "react";
import { TimeOfDay } from "../../types";
import { WeatherState } from '../../services/weatherService';

interface TropicalHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  hasWater?: boolean;
  hasVolcano?: boolean;
  bottomPanelColor?: string;
  seed?: number;
  weather?: WeatherState;
  sky?: {
    top: string;
    mid: string;
    bottom: string;
    hazeDark: string;
    hazeLight: string;
    water: string;
    fog: string;
    mountainFar: string;
    mountainMid: string;
    mountainNear: string;
  };
}

const TropicalHorizon: React.FC<TropicalHorizonProps> = ({
  timeOfDay,
  width,
  height,
  hasWater = false,
  hasVolcano = false,
  bottomPanelColor = "#1a202c", // slate-ish
  seed,
  weather,
  sky,
}) => {
  // ---------- ids / rng ----------
  const uid = useMemo(() => `trop-${Math.random().toString(36).slice(2, 9)}`, []);
  const baseSeed = useMemo(() => {
    if (typeof seed === "number") return seed >>> 0;
    const s =
      (width | 0) ^
      ((height | 0) << 7) ^
      Array.from(String(timeOfDay)).reduce((a, c) => a + c.charCodeAt(0), 0);
    return (s >>> 0) || 2025;
  }, [seed, width, height, timeOfDay]);

  // Mulberry32 PRNG
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

  const tod = String(timeOfDay).toLowerCase();
  const isNight = tod.includes("night");
  const isDawn = tod.includes("dawn");
  const isDusk = tod.includes("dusk") || tod.includes("even");

  // Helper to blend hex colors
  const blendHex = (a: string, b: string, t: number) => {
    const parseHex = (h: string) => {
      const n = parseInt(h.replace('#',''), 16);
      return [(n>>16)&255, (n>>8)&255, n&255] as const;
    };
    const [ar, ag, ab] = parseHex(a);
    const [br, bg, bb] = parseHex(b);
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const b2 = Math.round(ab + (bb - ab) * t);
    return `#${((1<<24)+(r<<16)+(g<<8)+b2).toString(16).slice(1)}`;
  };
  
  // Helper to round numbers for cleaner SVG paths
  const p = (n: number) => Math.round(n * 100) / 100;

  // ---------- palettes derived from sky colors ----------
  const P = useMemo(() => {
    // Use sky colors if available, otherwise fall back to defaults
    const skyTop = sky?.top || '#4A90E2';
    const skyMid = sky?.mid || '#87CEEB';
    const skyBottom = sky?.bottom || '#E6F3FF';
    const skyHazeDark = sky?.hazeDark || '#A8B6D1';
    const skyHazeLight = sky?.hazeLight || '#CDD7EA';
    const skyWater = sky?.water || '#4F7CA6';
    const skyMountainFar = sky?.mountainFar || '#6B7280';
    const skyMountainMid = sky?.mountainMid || '#4B5563';
    const skyMountainNear = sky?.mountainNear || '#374151';

    // Base tropical colors - greens and dark vegetation
    const tropicalBase = {
      veryFar: '#6B8FA3',
      far: '#5E8B7E',
      far2: '#4A7A6F',
      mid: '#3A6B5C',
      mid2: '#2D5A4B',
      near: '#1F4A3A',
      near2: '#163A2B',
      palmDark: '#0f2f22',
      palmMid: '#16402f',
      understory: '#153a2b',
    };

    // Time-based sky influence
    const skyInfluence = isNight ? 0.85 : isDusk ? 0.50 : isDawn ? 0.45 : 0.20;

    const base = {
      // bands - blend from bottom panel to sky
      band0: bottomPanelColor,
      band1: blendHex(bottomPanelColor, skyMountainNear, 0.3),
      band2: blendHex(bottomPanelColor, skyMountainNear, 0.5),
      band3: blendHex(bottomPanelColor, skyMountainMid, 0.6),

      // layer fills - blend base tropical colors with sky
      veryFar: blendHex(tropicalBase.veryFar, skyTop, skyInfluence),
      far: blendHex(tropicalBase.far, skyTop, skyInfluence * 0.9),
      far2: blendHex(tropicalBase.far2, skyMid, skyInfluence * 0.85),
      mid: blendHex(tropicalBase.mid, skyMid, skyInfluence * 0.8),
      mid2: blendHex(tropicalBase.mid2, skyMid, skyInfluence * 0.75),
      near: blendHex(tropicalBase.near, skyBottom, skyInfluence * 0.7),
      near2: blendHex(tropicalBase.near2, skyBottom, skyInfluence * 0.65),

      // vegetation - less sky influence to keep them dark
      palmDark: blendHex(tropicalBase.palmDark, skyBottom, skyInfluence * 0.5),
      palmMid: blendHex(tropicalBase.palmMid, skyBottom, skyInfluence * 0.45),
      understory: blendHex(tropicalBase.understory, skyBottom, skyInfluence * 0.4),

      // haze / fog
      fogSoft: skyHazeLight,
      fogDense: skyHazeDark,

      // water
      water: skyWater,
      waterHi: blendHex(skyWater, '#ffffff', 0.3),

      // extras
      vignette: "rgba(0,0,0,0.18)",
      volcano: blendHex(skyMountainNear, '#2b3134', 0.7),
      glow: isNight ? "rgba(100,120,180,0.18)" : "rgba(255,160,96,0.22)",
    };

    return base;
  }, [bottomPanelColor, sky, isNight]);

  // ---------- layout ----------
  const bandH = height * 0.09;
  const yBand0 = height - bandH;
  const yBand1 = height - bandH * 2;
  const yBand2 = height - bandH * 3;

  const yVeryFar = height * 0.18;
  const yFar     = height * 0.32;
  const yMid     = height * 0.48;
  const yNear    = height * 0.66;
  const yFG      = height * 0.72;

  // ---------- silhouette builders ----------
  const ridgePath = (yBase: number, amp: number, anchors = 9, phase = 0) => {
    const xs: number[] = [];
    for (let i = 0; i < anchors; i++) xs.push((i / (anchors - 1)) * width);
    const pts = xs.map((x, i) => {
      const swing = 0.5 + (rng(50 + i + phase) - 0.5) * 0.9;
      const valleyBias = i === 0 || i === anchors - 1 ? 0.35 : 0.6 + rng(75 + i + phase) * 0.3;
      const y = yBase - amp * swing * valleyBias;
      return { x, y };
    });
    let d = `M 0 ${height} L 0 ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], c = pts[i];
      const cx = (p.x + c.x) / 2;
      const cy = (p.y + c.y) / 2 + (rng(100 + i + phase) - 0.5) * amp * 0.16;
      d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)}, ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
    }
    d += ` L ${width} ${height} Z`;
    return d;
  };

  const canopyPath = (yBase: number, amp: number, bumps = 40, phase = 0) => {
    const step = width / bumps;
    let d = `M 0 ${height} L 0 ${(yBase - rng(3 + phase) * amp).toFixed(1)}`;
    for (let i = 1; i <= bumps; i++) {
      const x = i * step;
      const tall = rng(200 + i + phase) > 0.82 ? amp * (1.35 + rng(201 + i + phase) * 0.55) : 0;
      const y = yBase - (rng(2 + i + phase) * amp + tall * rng(5 + i + phase));
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    d += ` L ${width} ${height} Z`;
    return d;
  };

  // ---------- stamps ----------
  const TinyPalm: React.FC<{ x: number; baseY: number; h: number }> = ({ x, baseY, h }) => {
    const w = Math.max(1.5, h * 0.08);
    const tipX = x + h * 0.08 * (rng(Math.floor(x)) - 0.5);
    const tipY = baseY - h;
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - w / 2} y={baseY - h} width={w} height={h} fill={P.palmMid} />
        {[-1.6, -0.8, 0, 0.8, 1.6].map((a, i) => (
          <path
            key={i}
            d={`M ${tipX} ${tipY} L ${tipX + a * h * 0.28} ${tipY + h * 0.18}`}
            stroke={P.palmMid}
            strokeWidth={Math.max(1, h * 0.03)}
            strokeLinecap="square"
          />
        ))}
      </g>
    );
  };

  const Palm: React.FC<{ x: number; baseY: number; h: number; lean?: number }> = ({
    x,
    baseY,
    h,
    lean = (rng(700 + Math.floor(x)) - 0.5) * 1.2,
  }) => {
    const w = Math.max(2, h * 0.10);
    const tipX = x + h * 0.12 + lean * h * 0.1;
    const tipY = baseY - h;
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - w / 2} y={baseY - h} width={w} height={h} fill={P.palmDark} />
        {/* fronds as chunky strokes for pixel vibe */}
        {[-2.1, -1.2, -0.3, 0.6, 1.5].map((a, i) => (
          <path
            key={i}
            d={`M ${tipX} ${tipY} Q ${tipX + a * h * 0.20} ${tipY + h * 0.10}, ${tipX + a * h * 0.36} ${
              tipY + h * 0.22
            }`}
            stroke={P.palmMid}
            strokeWidth={Math.max(2, h * 0.04)}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </g>
    );
  };

  const BroadleafClump: React.FC<{ x: number; baseY: number; s: number }> = ({ x, baseY, s }) => (
    <g shapeRendering="crispEdges">
      <rect x={x - 6 * s} y={baseY - 8 * s} width={12 * s} height={8 * s} fill={P.understory} />
      <rect x={x - 10 * s} y={baseY - 6 * s} width={8 * s} height={6 * s} fill={P.understory} />
      <rect x={x + 2 * s} y={baseY - 6 * s} width={8 * s} height={6 * s} fill={P.understory} />
    </g>
  );

  // ---------- seeded placements ----------
  const farPalms = useMemo(() => {
    const n = 10 + ((rng(1000) * 6) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.04 + (i / (n - 1)) * 0.92 + (rng(1010 + i) - 0.5) * 0.02),
      h: height * (0.04 + rng(1020 + i) * 0.02),
    }));
  }, [rng, width, height]);

  const midClumps = useMemo(() => {
    const n = 8 + ((rng(1100) * 6) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.06 + rng(1110 + i) * 0.88),
      s: 1 + rng(1120 + i) * 0.7,
    }));
  }, [rng, width]);

  const fgPalms = useMemo(() => {
    const count = 1 + (rng(1200) > 0.35 ? 1 : 0) + (rng(1201) > 0.8 ? 1 : 0);
    const xs: number[] = [];
    for (let i = 0; i < 30; i++) {
      const x = width * (0.08 + rng(1210 + i) * 0.84);
      if (xs.every((px) => Math.abs(px - x) > width * 0.18)) xs.push(x);
      if (xs.length >= count) break;
    }
    return xs.map((x, i) => ({
      x,
      h: height * (0.22 + rng(1220 + i) * 0.1),
    }));
  }, [rng, width, height]);

  const nearRowPalms = useMemo(() => {
    const n = 8 + ((rng(1300) * 6) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.06 + (i / (n - 1)) * 0.88 + (rng(1310 + i) - 0.5) * 0.02),
      h: height * (0.10 + rng(1320 + i) * 0.06),
    }));
  }, [rng, width, height]);

  const volcano = useMemo(() => {
    if (!hasVolcano) return null;
    const x = width * (0.18 + rng(1400) * 0.64);
    const w = width * (0.08 + rng(1401) * 0.05);
    const h = height * (0.16 + rng(1402) * 0.05);
    return { x, w, h };
  }, [rng, width, height, hasVolcano]);

  // ---------- ids ----------
  const ids = {
    band1: `${uid}-b1`,
    band2: `${uid}-b2`,
    band3: `${uid}-b3`,
    fog1: `${uid}-fog1`,
    fog2: `${uid}-fog2`,
    fog3: `${uid}-fog3`,
    vignL: `${uid}-vigl`,
    vignR: `${uid}-vigr`,
    dither: `${uid}-dith`,
    water: `${uid}-water`,
    topfade: `${uid}-topfade`,
    topmask: `${uid}-topmask`,
    panelFeather: `${uid}-panelFeather`,
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMax meet"
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        pointerEvents: "none",
        imageRendering: "pixelated",
      }}
      shapeRendering="crispEdges"
    >
      <defs>
        {/* Top fade gradient for smooth transition to background */}
        <linearGradient id={ids.topfade} x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%"   stopColor="white" stopOpacity="0" />
  <stop offset="45%"  stopColor="white" stopOpacity=".3" />     {/* keep top ~45% invisible */}
  <stop offset="70%"  stopColor="white" stopOpacity="0.58" />  {/* barely reveal */}
  <stop offset="85%"  stopColor="white" stopOpacity="0.92" />
  <stop offset="100%" stopColor="white" stopOpacity="0.99" />
</linearGradient>

{/* Mask for jagged top transition (pushed down + weakened) */}
<mask id={ids.topmask}>
  <rect x="0" y="0" width={width} height={height} fill={`url(#${ids.topfade})`} />
  {/* Lower the ridge and reduce its influence so top bands vanish */}
  <path d={ridgePath(height * 0.36, height * 0.06, 12, 999)} fill="white" opacity="0.25" />
</mask>

        {/* progressive bottom bands that merge into the panel */}
        <linearGradient id={ids.band1} x1="0" y1={yBand0} x2="0" y2={height}>
          <stop offset="0%" stopColor={P.band1} />
          <stop offset="100%" stopColor={P.band0} />
        </linearGradient>
        <linearGradient id={ids.band2} x1="0" y1={yBand1} x2="0" y2={yBand0}>
          <stop offset="0%" stopColor={P.band2} />
          <stop offset="100%" stopColor={P.band1} />
        </linearGradient>
        <linearGradient id={ids.band3} x1="0" y1={yBand2} x2="0" y2={yBand1}>
          <stop offset="0%" stopColor={P.band3} />
          <stop offset="100%" stopColor={P.band2} />
        </linearGradient>

        {/* panel feather to kill seams */}
        <linearGradient id={ids.panelFeather} x1="0" y1={height - bandH * 2.8} x2="0" y2={height}>
          <stop offset="0%" stopColor={`${P.band0}00`} />
          <stop offset="60%" stopColor={`${P.band0}22`} />
          <stop offset="100%" stopColor={`${P.band0}55`} />
        </linearGradient>

        {/* fog banks */}
        <linearGradient id={ids.fog1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.fogSoft} stopOpacity="0.35" />
          <stop offset="100%" stopColor={P.fogSoft} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.fog2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.fogDense} stopOpacity="0.45" />
          <stop offset="100%" stopColor={P.fogDense} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.fog3} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.fogSoft} stopOpacity="0.28" />
          <stop offset="100%" stopColor={P.fogSoft} stopOpacity="0" />
        </linearGradient>

        {/* edge vignettes */}
        <linearGradient id={ids.vignL} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={P.vignette} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <linearGradient id={ids.vignR} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={P.vignette} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>

        {/* faint dither to sell distance */}
        <pattern id={ids.dither} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="transparent" />
          <rect x="2" y="1" width="1" height="1" fill="#000" opacity="0.04" />
        </pattern>

        {/* water sheen near the bottom */}
        <linearGradient id={ids.water} x1="0" y1={height - bandH * 0.6} x2="0" y2={height}>
          <stop offset="0%" stopColor={P.water} stopOpacity="0.18" />
          <stop offset="100%" stopColor={P.water} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Masked group to softly fade into the sky */}
      <g mask={`url(#${ids.topmask})`}>
        {/* edge vignettes */}
        <rect x="0" y="0" width={Math.max(24, width * 0.04)} height={height} fill={`url(#${ids.vignL})`} />
        <rect
          x={width - Math.max(24, width * 0.04)}
          y="0"
          width={Math.max(24, width * 0.04)}
          height={height}
          fill={`url(#${ids.vignR})`}
        />

        {/* bottom bands */}
        <rect x="0" y={yBand0} width={width} height={height - yBand0} fill={`url(#${ids.band1})`} />
        <rect x="0" y={yBand1} width={width} height={bandH} fill={`url(#${ids.band2})`} />
        <rect x="0" y={yBand2} width={width} height={bandH} fill={`url(#${ids.band3})`} />

        {/* VERY FAR hazy islands / ridge */}
        <g opacity={0.95}>
          <path d={ridgePath(yVeryFar, height * 0.15, 9 + ((rng(41) * 3) | 0), 0)} fill={P.veryFar} />
          <rect x="0" y="0" width={width} height={yVeryFar} fill={`url(#${ids.dither})`} opacity={0.3} />
        </g>

        {/* Fog bank between very-far and far */}
        <rect x="0" y={yVeryFar - height * 0.06} width={width} height={height * 0.10} fill={`url(#${ids.fog1})`} />

        {/* FAR jungle ridges (two hues) */}
        <g>
          <path d={ridgePath(yFar, height * 0.13, 9 + ((rng(42) * 3) | 0), 5)} fill={P.far} />
          <path d={ridgePath(yFar + 3, height * 0.11, 10 + ((rng(43) * 2) | 0), 8)} fill={P.far2} opacity={0.85} />
        </g>

        {/* tiny palms sprinkled on far ridge */}
        <g opacity={0.9}>
          {farPalms.map((p, i) => (
            <TinyPalm key={i} x={p.x} baseY={yFar - 2} h={p.h} />
          ))}
        </g>

        {/* Fog band between far and mid */}
        <rect x="0" y={yFar - height * 0.05} width={width} height={height * 0.09} fill={`url(#${ids.fog2})`} />

        {/* MID canopy swell (two layers) */}
        <g>
          <path d={canopyPath(yMid, height * 0.08, 42, 10)} fill={P.mid} />
          <path d={canopyPath(yMid + 3, height * 0.07, 44, 11)} fill={P.mid2} opacity={0.9} />
        </g>

        {/* subtle mist over mid */}
        <rect x="0" y={yMid - height * 0.04} width={width} height={height * 0.08} fill={`url(#${ids.fog3})`} />

        {/* NEAR treeline shelf */}
        <path d={canopyPath(yNear, height * 0.06, 46, 17)} fill={P.near} opacity={0.98} />

        {/* row of small/medium palms on the near shelf */}
        <g opacity={0.98}>
          {nearRowPalms.map((p, i) => (
            <Palm key={i} x={p.x} baseY={yNear} h={p.h} />
          ))}
        </g>

        {/* VOLCANO (optional, tucked into the mid distance) */}
        {volcano && (
          <g opacity={0.9}>
            <path
              d={[
                `M ${volcano.x - volcano.w * 0.5} ${yMid}`,
                `L ${volcano.x} ${yMid - volcano.h}`,
                `L ${volcano.x + volcano.w * 0.5} ${yMid}`,
                "Z",
              ].join(" ")}
              fill={P.volcano}
            />
            {(isNight || isDawn || isDusk) && (
              <circle cx={volcano.x} cy={yMid - volcano.h} r={volcano.w * 0.14} fill={P.glow} />
            )}
          </g>
        )}

        {/* FOREGROUND understory clumps for added depth */}
        <g>
          {midClumps.map((c, i) => (
            <BroadleafClump key={i} x={c.x} baseY={yFG} s={c.s} />
          ))}
        </g>

        {/* FOREGROUND feature palms (1–3 larger silhouettes) */}
        <g opacity={0.98}>
          {fgPalms.map((p, i) => (
            <Palm key={i} x={p.x} baseY={yFG} h={p.h} />
          ))}
        </g>

        {/* Optional water sheen + glints near the bottom */}
        {hasWater && (
          <g opacity={0.7}>
            <rect x="0" y={height - bandH * 0.6} width={width} height={bandH * 0.6} fill={`url(#${ids.water})`} />
            {[0.84, 0.87, 0.90].map((yy, i) => (
              <path
                key={i}
                d={`M 0 ${height * yy}
                    Q ${width * 0.25} ${height * (yy - 0.01)}, ${width * 0.5} ${height * yy}
                    T ${width} ${height * yy}`}
                stroke={P.waterHi}
                strokeWidth={1}
                opacity={0.32}
                fill="none"
              />
            ))}
          </g>
        )}
      </g>

      {/* Water on sides for island/bay/peninsula maps - BEFORE panel feather */}
      {hasWater && (
        <>
          {/* Left water - tropical lagoon style - more defined */}
          <g>
            {/* Darker water base */}
            <path
              d={`
                M 0 ${p(height * 0.65)}
                C ${p(width * 0.12)} ${p(height * 0.62)}, ${p(width * 0.18)} ${p(height * 0.68)}, ${p(width * 0.22)} ${p(height * 0.70)}
                L ${p(width * 0.22)} ${height}
                L 0 ${height} Z
              `}
              fill={blendHex(P.water, '#1a4d6b', 0.3)}
              opacity="0.95"
            />
            {/* Lighter water overlay */}
            <path
              d={`
                M 0 ${p(height * 0.70)}
                C ${p(width * 0.10)} ${p(height * 0.68)}, ${p(width * 0.16)} ${p(height * 0.72)}, ${p(width * 0.20)} ${p(height * 0.74)}
                L ${p(width * 0.20)} ${height}
                L 0 ${height} Z
              `}
              fill={P.water}
              opacity="0.85"
            />
            {/* Tropical water shimmer */}
            <path
              d={`M 0 ${p(height * 0.73)} Q ${p(width * 0.11)} ${p(height * 0.72)}, ${p(width * 0.19)} ${p(height * 0.73)}`}
              stroke={P.waterHi}
              strokeWidth="2"
              opacity="0.6"
              fill="none"
            />
            <path
              d={`M ${p(width * 0.03)} ${p(height * 0.77)} Q ${p(width * 0.10)} ${p(height * 0.76)}, ${p(width * 0.17)} ${p(height * 0.77)}`}
              stroke={P.waterHi}
              strokeWidth="1.5"
              opacity="0.4"
              fill="none"
            />
            <path
              d={`M ${p(width * 0.05)} ${p(height * 0.81)} Q ${p(width * 0.12)} ${p(height * 0.80)}, ${p(width * 0.18)} ${p(height * 0.81)}`}
              stroke={blendHex(P.waterHi, '#ffffff', 0.3)}
              strokeWidth="1"
              opacity="0.3"
              fill="none"
            />
          </g>
          
          {/* Right water - more visible and defined */}
          <g>
            {/* Darker water base */}
            <path
              d={`
                M ${width} ${p(height * 0.65)}
                C ${p(width * 0.88)} ${p(height * 0.62)}, ${p(width * 0.82)} ${p(height * 0.68)}, ${p(width * 0.78)} ${p(height * 0.70)}
                L ${p(width * 0.78)} ${height}
                L ${width} ${height} Z
              `}
              fill={blendHex(P.water, '#1a4d6b', 0.3)}
              opacity="0.95"
            />
            {/* Lighter water overlay */}
            <path
              d={`
                M ${width} ${p(height * 0.70)}
                C ${p(width * 0.90)} ${p(height * 0.68)}, ${p(width * 0.84)} ${p(height * 0.72)}, ${p(width * 0.80)} ${p(height * 0.74)}
                L ${p(width * 0.80)} ${height}
                L ${width} ${height} Z
              `}
              fill={P.water}
              opacity="0.85"
            />
            {/* Tropical water shimmer */}
            <path
              d={`M ${width} ${p(height * 0.73)} Q ${p(width * 0.89)} ${p(height * 0.72)}, ${p(width * 0.81)} ${p(height * 0.73)}`}
              stroke={P.waterHi}
              strokeWidth="2"
              opacity="0.6"
              fill="none"
            />
            <path
              d={`M ${p(width * 0.97)} ${p(height * 0.77)} Q ${p(width * 0.90)} ${p(height * 0.76)}, ${p(width * 0.83)} ${p(height * 0.77)}`}
              stroke={P.waterHi}
              strokeWidth="1.5"
              opacity="0.4"
              fill="none"
            />
            <path
              d={`M ${p(width * 0.95)} ${p(height * 0.81)} Q ${p(width * 0.88)} ${p(height * 0.80)}, ${p(width * 0.82)} ${p(height * 0.81)}`}
              stroke={blendHex(P.waterHi, '#ffffff', 0.3)}
              strokeWidth="1"
              opacity="0.3"
              fill="none"
            />
          </g>
        </>
      )}

      {/* Feather panel color upward to erase any seam */}
      <rect x="0" y={height - bandH * 2.8} width={width} height={bandH * 2.8} fill={`url(#${ids.panelFeather})`} opacity="0.7" />

      {/* Weather effects overlay */}
      {weather && weather.precipitation === 'rain' && weather.intensity > 0 && (
        <g opacity={0.4 + weather.intensity * 0.4}>
          {/* Tropical rain puddles - larger and more numerous */}
          {[...Array(12)].map((_, i) => {
            const x = (i + 1) / 13;
            const pudX = p(width * x + Math.sin(i * 17.3) * 15);
            const pudY = p(height * (0.83 + Math.sin(i * 9.7) * 0.04));
            const pudW = p(12 + weather.intensity * 12 + (i % 3) * 6);
            const pudH = p(3 + weather.intensity * 3);
            
            return (
              <ellipse
                key={`tropical-pud-${i}`}
                cx={pudX}
                cy={pudY}
                rx={pudW}
                ry={pudH}
                fill={P.water}
                opacity={0.6 + weather.intensity * 0.3}
              />
            );
          })}
          
          {/* Wet jungle floor */}
          <rect 
            x="0" 
            y={p(height * 0.78)} 
            width={width} 
            height={p(height * 0.22)} 
            fill={P.water} 
            opacity={0.2 + weather.intensity * 0.25}
          />
          
          {/* Rain streaks on palms - disabled until palm data is available */}
          {/* TODO: Add palm tree foreground data structure for rain effects */}
        </g>
      )}

      {/* Snow overlay - very rare in tropics but possible at elevation */}
      {weather && weather.precipitation === 'snow' && weather.intensity > 0 && hasVolcano && (
        <g opacity={0.3 + weather.intensity * 0.2}>
          {/* Light frost on volcano peaks only */}
          <path
            d={`
              M ${p(width * 0.4)} ${p(height * 0.45)}
              L ${p(width * 0.5)} ${p(height * 0.30)}
              L ${p(width * 0.6)} ${p(height * 0.45)}
              Z
            `}
            fill="#F9FAFB"
            opacity={0.5 + weather.intensity * 0.4}
          />
        </g>
      )}
    </svg>
  );
};

export default React.memo(TropicalHorizon);
