/**
 * components/horizons/SemitropicalHorizon.tsx
 *
 * Semitropical horizon — clearer bands, readable greenery, distant purple hills.
 * - Stronger silhouettes (near & mid) with pixel rim-lights
 * - Far violet mountain band (semi-translucent) to suggest depth
 * - User-space fade mask for seamless blend into TimeAwareBackground
 * - Panel seam feather; optional water sheen + a few sky-tinted puddles
 * - Pixel-art friendly (crisp edges, dithers, chunky shapes)
 */

import React, { useMemo } from "react";
import { TimeOfDay } from "../../types";

type WeatherLite =
  | null
  | {
      precipitation: "none" | "rain" | "snow" | "sleet" | "hail";
      cloudCover?: number; // 0..1
      intensity?: number;  // 0..1
    };

interface SemitropicalHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  hasWater?: boolean;
  bottomPanelColor?: string;
  seed?: number;
  weather?: WeatherLite;
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

/* ------------------------------- Utils ------------------------------- */
const clamp = (n: number, a = 0, b = 255) => Math.min(b, Math.max(a, n));
const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const rgbToHex = (r: number, g: number, b: number) =>
  `#${((1 << 24) + ((clamp(r) << 16) | (clamp(g) << 8) | clamp(b))).toString(16).slice(1)}`;
const blendHex = (a: string, b: string, t: number) => {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(
    Math.round(ar + (br - ar) * t),
    Math.round(ag + (bg - ag) * t),
    Math.round(ab + (bb - ab) * t)
  );
};

// mulberry-ish RNG
const makeRng = (seed: number) => {
  let t = seed >>> 0;
  return (bump = 1) => {
    t += 0x6d2b79f5 + bump;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), 1 | x);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

/* -------------------------------- Component ------------------------------- */
const SemitropicalHorizon: React.FC<SemitropicalHorizonProps> = ({
  timeOfDay,
  width,
  height,
  hasWater = false,
  bottomPanelColor = "#1f2937",
  seed,
  weather = null,
  sky,
}) => {
  /* ---- IDs / RNG ---- */
  const uid = useMemo(() => `semi-${Math.random().toString(36).slice(2, 9)}`, []);
  const baseSeed = useMemo(() => {
    if (typeof seed === "number") return seed >>> 0;
    const s =
      (width | 0) ^
      ((height | 0) << 7) ^
      Array.from(String(timeOfDay)).reduce((a, c) => a + c.charCodeAt(0), 0);
    return (s >>> 0) || 8129;
  }, [seed, width, height, timeOfDay]);
  const rng = useMemo(() => makeRng(baseSeed), [baseSeed]);

  /* ---- time flags ---- */
  const tod = String(timeOfDay).toLowerCase();
  const isNight = tod.includes("night");
  const isDawn = tod.includes("dawn");
  const isDusk = tod.includes("dusk") || tod.includes("even");

  /* ---- palette derived from sky (but with stronger land contrast) ---- */
  const P = useMemo(() => {
    const sTop = sky?.top || "#5AA7E6";
    const sMid = sky?.mid || "#8CCBF3";
    const sBot = sky?.bottom || "#DDEFFF";
    const hazeL = sky?.hazeLight || "#CFE0F2";
    const hazeD = sky?.hazeDark || "#98A9C6";
    const sWater = sky?.water || "#4F7CA6";
    const skyInfluence = isNight ? 0.65 : isDusk ? 0.35 : isDawn ? 0.32 : 0.18;

    // land bands: keep GREEN and saturated enough to read over water/sky
    const farGreen   = blendHex("#6AA58C", sTop, skyInfluence * 0.5);
    const midGreen   = blendHex("#42856F", sMid, skyInfluence * 0.45);
    const nearGreen  = blendHex("#2F6F5E", sBot, skyInfluence * 0.35);
    const nearDark   = blendHex("#1E4E45", sBot, skyInfluence * 0.25);

    // distant violet range (semi-translucent)
    const violetBase = "#6e5aa8";
    const farViolet  = blendHex(violetBase, sTop, 0.35); // hint of sky

    const water      = isNight ? blendHex(sWater, "#0B2035", 0.35) : sWater;
    const waterHi    = blendHex(sWater, "#FFFFFF", isNight ? 0.3 : 0.55);

    return {
      farViolet,
      far: farGreen,
      mid: midGreen,
      near: nearGreen,
      nearDark,
      trunk: blendHex("#5A4230", sBot, skyInfluence * 0.2),
      leafD: blendHex("#206949", sBot, skyInfluence * 0.2),
      leafL: blendHex("#2E8C6B", sBot, skyInfluence * 0.15),
      reed: blendHex("#47A07A", sBot, skyInfluence * 0.1),
      moss: blendHex("#8EB7A4", sMid, 0.15),
      haze1: hazeL,
      haze2: blendHex(hazeD, hazeL, 0.6),
      water,
      waterHi,
      rim: blendHex(hazeL, "#FFFFFF", 0.6),
      band0: bottomPanelColor,
      band1: blendHex(bottomPanelColor, sWater, 0.18),
      band2: blendHex(bottomPanelColor, sWater, 0.35),
      vign: "rgba(0,0,0,0.18)",
    };
  }, [sky, bottomPanelColor, isNight, isDawn, isDusk]);

  /* ---- layout ---- */
  const bandH = Math.max(14, height * 0.085);
  const yBand0 = height - bandH;
  const yBand1 = height - bandH * 2;
  const yBand2 = height - bandH * 3;

  const yVF  = height * 0.14; // very far violet range
  const yFar = height * 0.25;
  const yMid = height * 0.40;
  const yNear = height * 0.58;
  const yTree = height * 0.70;
  const yFG = height * 0.78;

  /* ---- builders ---- */
  const ridgePath = (yBase: number, amp: number, anchors = 12, phase = 0) => {
    const xs: number[] = [];
    for (let i = 0; i < anchors; i++) xs.push((i / (anchors - 1)) * width);
    const pts = xs.map((x, i) => {
      const swing = 0.65 + (rng(50 + i + phase) - 0.5) * 0.9;
      const y = Math.max(0, yBase - amp * swing);
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

  /* ---- plant stamps ---- */
  const Palmetto: React.FC<{ x: number; baseY: number; h: number; dark?: boolean }> = ({ x, baseY, h, dark }) => {
    const stem = dark ? P.nearDark : P.trunk;
    const leaf = dark ? P.nearDark : P.leafD;
    const cy = baseY - h * 0.06;
    const r = h * 0.22;
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - h * 0.02} y={baseY - h * 0.25} width={h * 0.04} height={h * 0.25} fill={stem} />
        {[-40, -20, 0, 20, 40].map((a, i) => {
          const rad = (a * Math.PI) / 180;
          return (
            <line key={i} x1={x} y1={cy} x2={x + Math.cos(rad) * r} y2={cy - Math.sin(rad) * r} stroke={leaf} strokeWidth={dark ? 3 : 2} />
          );
        })}
      </g>
    );
  };

  const Banana: React.FC<{ x: number; baseY: number; h: number; dark?: boolean }> = ({ x, baseY, h, dark }) => {
    const stem = dark ? P.nearDark : P.trunk;
    const leaf = dark ? P.nearDark : P.leafL;
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - h * 0.015} y={baseY - h * 0.30} width={h * 0.03} height={h * 0.30} fill={stem} />
        {[-24, -12, 0, 12, 24].map((ang, i) => (
          <path
            key={i}
            d={`M ${x} ${baseY - h * 0.25}
               L ${x + Math.cos((ang*Math.PI)/180) * h * 0.26}
                 ${baseY - h * 0.25 - Math.sin((ang*Math.PI)/180) * h * 0.18}
               L ${x + Math.cos((ang*Math.PI)/180) * h * 0.16}
                 ${baseY - h * 0.25 - Math.sin((ang*Math.PI)/180) * h * 0.10} Z`}
            fill={leaf}
          />
        ))}
      </g>
    );
  };

  const Yucca: React.FC<{ x: number; baseY: number; h: number; dark?: boolean }> = ({ x, baseY, h, dark }) => {
    const stem = dark ? P.nearDark : P.trunk;
    const blade = dark ? P.nearDark : P.leafD;
    const blades = 7;
    return (
      <g shapeRendering="crispEdges">
        <rect x={x - h * 0.01} y={baseY - h * 0.10} width={h * 0.02} height={h * 0.10} fill={stem} />
        {Array.from({ length: blades }).map((_, i) => {
          const a = -50 + (100 / (blades - 1)) * i;
          const rad = (a * Math.PI) / 180;
          const len = h * (0.26 + (i % 2 ? 0.04 : 0));
          return (
            <line key={i} x1={x} y1={baseY - h * 0.10} x2={x + Math.cos(rad) * len} y2={baseY - h * 0.10 - Math.sin(rad) * len} stroke={blade} strokeWidth={dark ? 3 : 2} />
          );
        })}
      </g>
    );
  };

  /* ---- placements ---- */
  const midPlants = useMemo(() => {
    const n = 20 + ((rng(900) * 8) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.02 + rng(901 + i) * 0.96),
      h: height * (0.16 + rng(902 + i) * 0.12),
      t: rng(903 + i),
    }));
  }, [rng, width, height]);

  const fgPlants = useMemo(() => {
    const n = 12 + ((rng(950) * 6) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.03 + (i / (n - 1)) * 0.94) + (rng(951 + i) - 0.5) * 10,
      h: height * (0.22 + rng(952 + i) * 0.16),
      t: rng(953 + i),
    }));
  }, [rng, width, height]);

  const puddles = useMemo(() => {
    const wetness = Math.max(
      0,
      Math.min(1, (weather?.intensity ?? 0) * (weather?.precipitation === "rain" ? 1.0 : 0.4))
    );
    const n = 6 + ((rng(1001) * 6) | 0);
    return Array.from({ length: n }).map((_, i) => ({
      x: width * (0.06 + rng(1002 + i) * 0.88),
      y: height * (0.83 + rng(1003 + i) * 0.10),
      rx: 10 + rng(1004 + i) * (14 + wetness * 16),
      ry: 3 + rng(1005 + i) * (4 + wetness * 3),
      o: 0.14 + wetness * 0.30,
    }));
  }, [rng, width, height, weather]);

  /* ---- ids ---- */
  const ids = {
    topfade: `${uid}-topfade`,
    topmask: `${uid}-topmask`,
    haze1: `${uid}-h1`,
    haze2: `${uid}-h2`,
    dither: `${uid}-dith`,
    band1: `${uid}-b1`,
    band2: `${uid}-b2`,
    band3: `${uid}-b3`,
    panelFeather: `${uid}-panelFeather`,
    water: `${uid}-water`,
    rimHL: `${uid}-rimHL`,
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
      <style>{`
        @keyframes ${ids.rimHL} { 0% { opacity:.2 } 50% { opacity:.42 } 100% { opacity:.2 } }
      `}</style>

      <defs>
        {/* USER-SPACE top fade for real sky merge */}
        <linearGradient id={ids.topfade} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={height}>
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="40%" stopColor="white" stopOpacity="0.12" />
          <stop offset="65%" stopColor="white" stopOpacity="0.45" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </linearGradient>

        {/* luminance mask; small carve so the very top isn't a slab */}
        <mask id={ids.topmask} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style={{ maskType: "luminance" } as any}>
          <rect x="0" y="0" width={width} height={height} fill={`url(#${ids.topfade})`} />
          <path d={ridgePath(height * 0.18, height * 0.08, 11, 222)} fill="black" opacity="0.22" />
        </mask>

        {/* haze banks */}
        <linearGradient id={ids.haze1} gradientUnits="userSpaceOnUse" x1="0" y1={yFar - height * 0.04} x2="0" y2={yFar + height * 0.08}>
          <stop offset="0%" stopColor={P.haze1} stopOpacity="0.22" />
          <stop offset="100%" stopColor={P.haze1} stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id={ids.haze2} gradientUnits="userSpaceOnUse" x1="0" y1={yMid - height * 0.04} x2="0" y2={yMid + height * 0.08}>
          <stop offset="0%" stopColor={P.haze2} stopOpacity="0.18" />
          <stop offset="100%" stopColor={P.haze2} stopOpacity="0.03" />
        </linearGradient>

        {/* subtle dither */}
        <pattern id={ids.dither} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="transparent" />
          <rect x="2" y="1" width="1" height="1" fill="#000" opacity="0.05" />
        </pattern>

        {/* panel blends (low alpha to avoid slabs) */}
        <linearGradient id={ids.band1} gradientUnits="userSpaceOnUse" x1="0" y1={yBand0} x2="0" y2={height}>
          <stop offset="0%" stopColor={P.band2} stopOpacity="0.55" />
          <stop offset="100%" stopColor={P.band0} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={ids.band2} gradientUnits="userSpaceOnUse" x1="0" y1={yBand1} x2="0" y2={yBand0}>
          <stop offset="0%" stopColor={P.band1} stopOpacity="0.45" />
          <stop offset="100%" stopColor={P.band2} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={ids.band3} gradientUnits="userSpaceOnUse" x1="0" y1={yBand2} x2="0" y2={yBand1}>
          <stop offset="0%" stopColor={P.band1} stopOpacity="0.35" />
          <stop offset="100%" stopColor={P.band1} stopOpacity="0.45" />
        </linearGradient>

        {/* panel feather */}
        <linearGradient id={ids.panelFeather} gradientUnits="userSpaceOnUse" x1="0" y1={height - bandH * 2.8} x2="0" y2={height}>
          <stop offset="0%" stopColor={`${P.band0}00`} />
          <stop offset="60%" stopColor={`${P.band0}22`} />
          <stop offset="100%" stopColor={`${P.band0}55`} />
        </linearGradient>

        {/* water sheen */}
        <linearGradient id={ids.water} gradientUnits="userSpaceOnUse" x1="0" y1={height - bandH * 0.7} x2="0" y2={height}>
          <stop offset="0%" stopColor={P.water} stopOpacity="0.18" />
          <stop offset="100%" stopColor={P.water} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* fade into sky */}
      <g mask={`url(#${ids.topmask})`}>
        {/* bottom blends */}
        <rect x="0" y={yBand0} width={width} height={height - yBand0} fill={`url(#${ids.band1})`} />
        <rect x="0" y={yBand1} width={width} height={bandH} fill={`url(#${ids.band2})`} />
        <rect x="0" y={yBand2} width={width} height={bandH} fill={`url(#${ids.band3})`} />

        {/* VERY FAR violet hills — semi translucent so sky reads behind */}
        <g opacity={isNight ? 0.55 : 0.6}>
          <path d={ridgePath(yVF, height * 0.11, 10, 7)} fill={P.farViolet} />
          <rect x="0" y="0" width={width} height={yVF - 2} fill={`url(#${ids.dither})`} opacity={0.35} />
        </g>

        {/* Haze between very-far and far green ridge */}
        <rect x="0" y={yVF - height * 0.02} width={width} height={height * 0.07} fill={`url(#${ids.haze1})`} />

        {/* FAR green ridge (readable) */}
        <g opacity={0.9}>
          <path d={ridgePath(yFar, height * 0.20, 11, 17)} fill={P.far} />
          {/* tiny clumps */}
          {Array.from({ length: 12 }).map((_, i) => {
            const cx = ((i + 0.5) / 12) * width + (rng(210 + i) - 0.5) * 8;
            const w = 14 + rng(220 + i) * 10;
            const h = 8 + rng(230 + i) * 6;
            return <rect key={i} x={cx - w / 2} y={yFar - 4 - h} width={w} height={h} fill={blendHex(P.far, "#1b1b1b", 0.1)} />;
          })}
        </g>

        {/* Haze band */}
        <rect x="0" y={yFar - height * 0.03} width={width} height={height * 0.08} fill={`url(#${ids.haze1})`} />

        {/* MID ridge */}
        <g opacity={0.95}>
          <path d={ridgePath(yMid, height * 0.18, 12, 29)} fill={P.mid} />
          {/* reeds & mangrove blocks */}
          {Array.from({ length: 18 }).map((_, i) => {
            const cx = width * (0.02 + rng(310 + i) * 0.96);
            if (rng(320 + i) < 0.4) {
              return <rect key={i} x={cx} y={yMid - 2} width={2} height={10 + rng(330 + i) * 10} fill={P.reed} />;
            }
            const w = 18 + rng(340 + i) * 18;
            const h = 10 + rng(350 + i) * 12;
            return <rect key={i} x={cx - w / 2} y={yMid - 5 - h} width={w} height={h} fill={blendHex(P.mid, "#15251f", 0.12)} />;
          })}
        </g>

        {/* Haze between mid/near */}
        <rect x="0" y={yMid - height * 0.03} width={width} height={height * 0.07} fill={`url(#${ids.haze2})`} />

        {/* NEAR ridge with pixel rim highlight */}
        <g opacity={0.98}>
          <path d={ridgePath(yNear, height * 0.15, 13, 41)} fill={P.near} />
          <path
            d={ridgePath(yNear - 1, height * 0.15, 13, 41)}
            fill="none"
            stroke={P.rim}
            strokeWidth={1}
            opacity={isNight ? 0.22 : 0.32}
            style={{ animation: `${ids.rimHL} ${14 + (rng(2) * 6).toFixed(2)}s ease-in-out infinite` }}
          />
        </g>

        {/* Treeline shelf */}
        <path d={ridgePath(yTree, height * 0.10, 40, 51)} fill={P.nearDark} />

        {/* Mid layer plants (readable silhouettes) */}
        {midPlants.map((p, i) => {
          if (p.t < 0.34) return <Palmetto key={`m-p-${i}`} x={p.x} baseY={yTree} h={p.h} />;
          if (p.t < 0.67) return <Banana key={`m-b-${i}`} x={p.x} baseY={yTree} h={p.h} />;
          return <Yucca key={`m-y-${i}`} x={p.x} baseY={yTree} h={p.h * 0.92} />;
        })}

        {/* Foreground silhouettes (dark) */}
        <g opacity={0.96}>
          <path d={ridgePath(yFG, height * 0.08, 42, 77)} fill={P.nearDark} />
          {fgPlants.map((p, i) => {
            if (p.t < 0.33) return <Palmetto key={`f-p-${i}`} x={p.x} baseY={yFG} h={p.h} dark />;
            if (p.t < 0.66) return <Banana key={`f-b-${i}`} x={p.x} baseY={yFG} h={p.h * 0.92} dark />;
            return <Yucca key={`f-y-${i}`} x={p.x} baseY={yFG} h={p.h * 0.86} dark />;
          })}
        </g>

        {/* Few sky-tinted puddles (kept subtle for readability) */}
        <g style={{ mixBlendMode: "screen" as any }}>
          {puddles.map((p, i) => (
            <g key={i} opacity={p.o}>
              <ellipse cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={blendHex(P.water, P.rim, 0.25)} />
              <ellipse cx={p.x} cy={p.y} rx={Math.max(1, p.rx - 2)} ry={Math.max(1, p.ry - 1)} fill="none" stroke={P.waterHi} strokeWidth={0.7} />
            </g>
          ))}
        </g>

        {/* Optional water sheen near panel */}
        {hasWater && (
          <g opacity={0.75}>
            <rect x="0" y={height - bandH * 0.7} width={width} height={bandH * 0.7} fill={`url(#${ids.water})`} />
            {[0.86, 0.90].map((yy, i) => (
              <path
                key={i}
                d={`M 0 ${height * yy}
                    Q ${width * 0.25} ${height * (yy - 0.010)}, ${width * 0.5} ${height * yy}
                    T ${width} ${height * yy}`}
                stroke={P.waterHi}
                strokeWidth={i === 0 ? 1.2 : 1}
                opacity={0.26}
                fill="none"
              />
            ))}
          </g>
        )}
      </g>

      {/* panel feather (outside mask) */}
      <rect x="0" y={height - bandH * 2.8} width={width} height={bandH * 2.8} fill={`url(#${ids.panelFeather})`} />
    </svg>
  );
};

export default React.memo(SemitropicalHorizon);
