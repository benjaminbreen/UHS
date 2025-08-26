/**
 * components/horizons/ShoalsHorizon.tsx
 *
 * Shallow-water (shoals) horizon with a crisp waterline.
 * - Pixel-art style, crisp edges
 * - Subtle sky merge at top via user-space mask
 * - Clear 1px waterline + foam highlight + gentle shimmer
 * - Shoals/sandbars + sparse rocks + seagrass
 */

import React, { useMemo } from "react";
import { TimeOfDay } from "../../types";

interface ShoalsHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  bottomPanelColor?: string;
  seed?: number;
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

const ShoalsHorizon: React.FC<ShoalsHorizonProps> = ({
  timeOfDay,
  width,
  height,
  bottomPanelColor = "#1a202c",
  seed,
  sky,
}) => {
  /* ---------- RNG ---------- */
  const baseSeed = useMemo(() => {
    if (typeof seed === "number") return seed >>> 0;
    const s = (width | 0) ^ ((height | 0) << 7) ^ Array.from(String(timeOfDay)).reduce((a, c) => a + c.charCodeAt(0), 0);
    return (s >>> 0) || 2025;
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

  /* ---------- helpers ---------- */
  const uid = useMemo(() => `shoals-${Math.random().toString(36).slice(2, 9)}`, []);
  const tod = String(timeOfDay).toLowerCase();
  const isNight = tod.includes("night");

  const blendHex = (a: string, b: string, t: number) => {
    const parse = (h: string) => {
      const n = parseInt(h.replace("#", ""), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
    };
    const [ar, ag, ab] = parse(a);
    const [br, bg, bb] = parse(b);
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const b2 = Math.round(ab + (bb - ab) * t);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b2).toString(16).slice(1)}`;
  };

  /* ---------- palette (single variable "P" used everywhere) ---------- */
  const P = useMemo(() => {
    const sTop = sky?.top || "#4A90E2";
    const sMid = sky?.mid || "#87CEEB";
    const sBot = sky?.bottom || "#E6F3FF";
    const hazeL = sky?.hazeLight || "#CDD7EA";
    const hazeD = sky?.hazeDark || "#A8B6D1";
    const sWater = sky?.water || "#4F7CA6";

    const vivid = isNight ? sWater : blendHex(sWater, "#40e0d0", 0.35);

    return {
      // water ramp
      horizonWater: blendHex(vivid, sBot, 0.35),
      shallowWater: blendHex(vivid, "#7dd3c0", isNight ? 0.2 : 0.5),
      midWater: vivid,
      deepWater: blendHex(vivid, "#1c4c66", 0.45),

      // shoreline accents
      waterLineDark: blendHex(vivid, "#0b1e2f", isNight ? 0.65 : 0.5),
      waterLineFoam: blendHex(hazeL, "#ffffff", 0.75),
      waterLineShimmer: blendHex(vivid, "#ffffff", 0.55),

      // underwater bits
      sandbar: isNight ? "#2a3a4a" : blendHex("#d4a373", sWater, 0.35),
      seagrass: isNight ? "#1a3a3a" : blendHex("#2d5a4a", sWater, 0.3),

      // atmosphere
      haze: hazeL,
      mist: blendHex(hazeD, hazeL, 0.55),

      // panel bands
      band0: bottomPanelColor,
      band1: blendHex(bottomPanelColor, vivid, 0.2),
      band2: blendHex(bottomPanelColor, vivid, 0.4),
    };
  }, [sky, bottomPanelColor, isNight]);

  /* ---------- layout ---------- */
  const bandH = height * 0.08;
  const horizonY = Math.max(6, height * 0.16);
  const shallow1 = height * 0.32;
  const shallow2 = height * 0.52;

  /* ---------- geo ---------- */
  const rocks = useMemo(() => {
    const n = 2 + ((rng(100) * 3) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.15 + rng(110 + i) * 0.7),
      y: horizonY + (height * 0.5 - horizonY) * rng(120 + i),
      w: 8 + rng(130 + i) * 18,
      h: 6 + rng(140 + i) * 12,
    }));
  }, [rng, width, height, horizonY]);

  const shoals = useMemo(() => {
    const n = 3 + ((rng(200) * 3) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.05 + rng(210 + i) * 0.9),
      y: shallow1 + (height * 0.55 - shallow1) * rng(220 + i),
      w: 50 + rng(230 + i) * 100,
      h: 16 + rng(240 + i) * 26,
    }));
  }, [rng, width, height, shallow1]);

  const seagrass = useMemo(() => {
    const n = 8 + ((rng(300) * 8) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * rng(310 + i),
      y: shallow2 + (height - bandH * 2 - shallow2) * rng(320 + i),
      h: 6 + rng(330 + i) * 10,
    }));
  }, [rng, width, height, shallow2, bandH]);

  /* ---------- ids ---------- */
  const ids = {
    topfade: `${uid}-topfade`,
    topmask: `${uid}-topmask`,
    water: `${uid}-water`,
    haze: `${uid}-haze`,
    dots: `${uid}-dots`,
    band1: `${uid}-band1`,
    band2: `${uid}-band2`,
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMax meet"
      style={{ position: "absolute", left: 0, bottom: 0, pointerEvents: "none", imageRendering: "pixelated" }}
      shapeRendering="crispEdges"
    >
      <defs>
        {/* Top fade: user-space so it always lines up with the sky */}
        <linearGradient id={ids.topfade} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={height}>
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="45%" stopColor="white" stopOpacity="0.15" />
          <stop offset="70%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id={ids.topmask} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style={{ maskType: "luminance" } as any}>
          <rect x="0" y="0" width={width} height={height} fill={`url(#${ids.topfade})`} />
        </mask>

        {/* Water column */}
        <linearGradient id={ids.water} gradientUnits="userSpaceOnUse" x1="0" y1={horizonY} x2="0" y2={height}>
          <stop offset="0%" stopColor={P.horizonWater} />
          <stop offset="28%" stopColor={P.shallowWater} />
          <stop offset="60%" stopColor={P.midWater} />
          <stop offset="100%" stopColor={P.deepWater} />
        </linearGradient>

        {/* Atmospheric haze at horizon */}
        <linearGradient id={ids.haze} gradientUnits="userSpaceOnUse" x1="0" y1={horizonY} x2="0" y2={horizonY + height * 0.14}>
          <stop offset="0%" stopColor={P.haze} stopOpacity="0.35" />
          <stop offset="100%" stopColor={P.haze} stopOpacity="0" />
        </linearGradient>

        {/* Underwater visibility dots */}
        <pattern id={ids.dots} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="transparent" />
          <rect x="1" y="1" width="1" height="1" fill={P.shallowWater} opacity="0.18" />
          <rect x="3" y="3" width="1" height="1" fill={P.shallowWater} opacity="0.14" />
        </pattern>

        {/* Bottom bands to merge with panel */}
        <linearGradient id={ids.band1} gradientUnits="userSpaceOnUse" x1="0" y1={height - bandH * 2} x2="0" y2={height - bandH}>
          <stop offset="0%" stopColor={P.band2} />
          <stop offset="100%" stopColor={P.band1} />
        </linearGradient>
        <linearGradient id={ids.band2} gradientUnits="userSpaceOnUse" x1="0" y1={height - bandH} x2="0" y2={height}>
          <stop offset="0%" stopColor={P.band1} />
          <stop offset="100%" stopColor={P.band0} />
        </linearGradient>
      </defs>

      {/* Everything below softly fades into the sky */}
      <g mask={`url(#${ids.topmask})`}>
        {/* Water body */}
        <rect x="0" y={horizonY} width={width} height={height - horizonY} fill={`url(#${ids.water})`} />

        {/* Underwater visibility band */}
        <rect x="0" y={horizonY + 8} width={width} height={shallow2 - (horizonY + 8)} fill={`url(#${ids.dots})`} opacity="0.6" />

        {/* CRISP WATERLINE */}
        {/* 1) thin dark line for contrast */}
        <rect x="0" y={Math.floor(horizonY) - 1} width={width} height="1" fill={P.waterLineDark} opacity="0.9" />
        {/* 2) foam highlight just above */}
        <rect x="0" y={Math.floor(horizonY) - 2} width={width} height="1" fill={P.waterLineFoam} opacity="0.85" />
        {/* 3) gentle shimmer line just below */}
        <path
          d={`M 0 ${horizonY + 1}
              Q ${width * 0.25} ${horizonY + 0.2}, ${width * 0.5} ${horizonY + 1}
              T ${width} ${horizonY + 1}`}
          stroke={P.waterLineShimmer}
          strokeWidth={1}
          opacity={0.45}
          fill="none"
        />

        {/* Shoals / sandbars */}
        {shoals.map((s, i) => (
          <ellipse
            key={`shoal-${i}`}
            cx={s.x}
            cy={s.y}
            rx={s.w / 2}
            ry={s.h / 2}
            fill={P.sandbar}
            opacity={0.28 + (i % 3) * 0.08}
          />
        ))}

        {/* Seagrass patches (chunky, pixel lines) */}
        {seagrass.map((g, i) => (
          <g key={`grass-${i}`} opacity="0.6">
            <rect x={g.x} y={g.y - g.h} width="1" height={g.h} fill={P.seagrass} />
            <rect x={g.x + 2} y={g.y - g.h + 2} width="1" height={g.h - 2} fill={P.seagrass} />
            <rect x={g.x + 4} y={g.y - g.h + 1} width="1" height={g.h - 1} fill={P.seagrass} />
          </g>
        ))}

        {/* Sparse rocks (low contrast) */}
        {rocks.map((r, i) => (
          <g key={`rock-${i}`} opacity="0.7">
            <ellipse cx={r.x} cy={r.y - r.h / 4} rx={r.w / 2} ry={r.h / 2} fill={blendHex(P.midWater, "#0e2133", 0.25)} />
            <rect x={r.x - r.w / 8} y={r.y - r.h / 1.8} width={r.w / 4} height="2" fill={blendHex(P.midWater, "#ffffff", 0.2)} />
            {/* foam ring */}
            <ellipse cx={r.x} cy={r.y - 1} rx={(r.w * 0.7) | 0} ry="2" fill={P.waterLineFoam} opacity="0.35" />
          </g>
        ))}

        {/* Haze at the horizon line */}
        <rect x="0" y={horizonY} width={width} height={height * 0.14} fill={`url(#${ids.haze})`} />

        {/* Bottom bands to merge into panel */}
        <rect x="0" y={height - bandH * 2} width={width} height={bandH} fill={`url(#${ids.band1})`} />
        <rect x="0" y={height - bandH} width={width} height={bandH} fill={`url(#${ids.band2})`} />
      </g>
    </svg>
  );
};

export default React.memo(ShoalsHorizon);
