/**
 * components/horizons/OpenOceanHorizon.tsx
 *
 * Minimalist OPEN OCEAN horizon (pixel-art style)
 * - Seamless fade into TimeAwareBackground via CSS --sky-* variables
 * - Extremely lightweight: distant haze + three swell bands + occasional pelicans
 * - Subtle animated glints and slow ripple drift
 * - Optional tiny weather touches (rain streaks / fog veil)
 */

import React, { useMemo } from "react";
import { TimeOfDay } from "../../types";
import type { WeatherState } from "../../services/weatherService";

interface OpenOceanHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
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

/* --------------------------------- utils --------------------------------- */

const blendHex = (a: string, b: string, t: number) => {
  const n1 = parseInt(a.replace("#", ""), 16);
  const n2 = parseInt(b.replace("#", ""), 16);
  const ar = (n1 >> 16) & 255, ag = (n1 >> 8) & 255, ab = n1 & 255;
  const br = (n2 >> 16) & 255, bg = (n2 >> 8) & 255, bb = n2 & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b3 = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b3).toString(16).slice(1)}`;
};
const p = (v: number) => Math.round(v);

/* ------------------------------- component -------------------------------- */

const OpenOceanHorizon: React.FC<OpenOceanHorizonProps> = ({
  timeOfDay,
  width,
  height,
  bottomPanelColor = "#0B1220",
  seed,
  weather,
  sky,
}) => {
  /* ----- rng ----- */
  const baseSeed = useMemo(() => {
    if (typeof seed === "number") return seed >>> 0;
    const s =
      (width | 0) ^
      ((height | 0) << 7) ^
      Array.from(String(timeOfDay)).reduce((a, c) => a + c.charCodeAt(0), 0);
    return (s >>> 0) || 4317;
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

  /* ----- time flags ----- */
  const isNight = timeOfDay === "Night";
  const isDawn = timeOfDay === "Dawn";
  const isDusk = timeOfDay === "Dusk";
  const isMid = timeOfDay === "Midday";

  /* ----- sky from CSS vars (or overrides) ----- */
  const SKY = useMemo(() => {
    if (sky) {
      return {
        top: sky.top,
        mid: sky.mid,
        bottom: sky.bottom,
        hazeL: sky.hazeLight ?? "#CDD7EA",
        hazeD: sky.hazeDark ?? "#A8B6D1",
        water: sky.water ?? "#4F7CA6",
      };
    }
    if (typeof window === "undefined") {
      return {
        top: "#0e1f3e",
        mid: "#274d86",
        bottom: "#9fd1ff",
        hazeL: "#cfe1f4",
        hazeD: "#a9bdd6",
        water: "#3f6ea0",
      };
    }
    const cs = getComputedStyle(document.documentElement);
    const v = (k: string, fb: string) => cs.getPropertyValue(k).trim() || fb;
    return {
      top: v("--sky-top", "#0e1f3e"),
      mid: v("--sky-mid", "#274d86"),
      bottom: v("--sky-bottom", "#9fd1ff"),
      hazeL: v("--sky-haze-light", "#cfe1f4"),
      hazeD: v("--sky-haze-dark", "#a9bdd6"),
      water: v("--sky-water", "#3f6ea0"),
    };
  }, [sky]);

  const skyInfluence =
    isNight ? 0.9 : isDusk ? 0.55 : isDawn ? 0.5 : isMid ? 0.2 : 0.3;

  /* ----- palette ----- */
  const P = useMemo(() => {
    const vivid = isNight ? SKY.water : blendHex(SKY.water, "#3dc0ff", 0.2);
    const horizon = blendHex(vivid, SKY.bottom, 0.35);
    const far = blendHex(vivid, SKY.mid, 0.15);
    const near = blendHex(vivid, "#154066", isNight ? 0.5 : 0.35);

    return {
      waterHorizon: horizon,
      waterFar: far,
      waterMid: vivid,
      waterNear: near,
      waterDeep: blendHex(near, "#081a2c", isNight ? 0.45 : 0.25),

      waveHi: blendHex(vivid, "#ffffff", isNight ? 0.25 : 0.55),
      waveLo: blendHex(vivid, "#0a1a2a", 0.35),

      haze: SKY.hazeL,
      mist: blendHex(SKY.hazeD, SKY.hazeL, 0.5),

      panel0: bottomPanelColor,
      panel1: blendHex(bottomPanelColor, vivid, 0.35),
      panel2: blendHex(bottomPanelColor, vivid, 0.18),
      starGlint: "#D9E4FF",
    };
  }, [SKY, bottomPanelColor, isNight]);

  /* ----- layout ----- */
  const horizonY = p(height * 0.16);
  const yFeather = p(height * 0.82);
  const bandH = p(height * 0.09);

  /* ----- waves (three bands) ----- */
  type Wave = { y: number; amp: number; freq: number; phase: number; w: number; col: string; thick: number; op: number };
  const waves: Wave[] = useMemo(() => {
    const makeBand = (count: number, y0: number, y1: number, amp: [number, number], freq: [number, number], thick: number, col: string, opBase: number) =>
      Array.from({ length: count }).map((_, i) => {
        const t = rng(1000 + i);
        return {
          y: p(y0 + (y1 - y0) * (i / (count - 1)) + rng(1010 + i) * (y1 - y0) * 0.06),
          amp: amp[0] + rng(1020 + i) * (amp[1] - amp[0]),
          freq: freq[0] + rng(1030 + i) * (freq[1] - freq[0]),
          phase: rng(1040 + i) * Math.PI * 2,
          w: width,
          col,
          thick,
          op: opBase + rng(1050 + i) * 0.15,
        };
      });

    return [
      ...makeBand(7, height * 0.22, height * 0.30, [1.5, 2.5], [0.018, 0.026], 1, P.waterFar, 0.22), // far
      ...makeBand(6, height * 0.34, height * 0.48, [2.0, 3.5], [0.012, 0.018], 2, P.waterMid, 0.30), // mid
      ...makeBand(4, height * 0.54, height * 0.68, [3.0, 5.0], [0.008, 0.012], 3, P.waterNear, 0.40), // near
    ];
  }, [rng, width, height, P]);

  const wavePath = (w: Wave) => {
    const steps = 56;
    let d = `M 0 ${w.y.toFixed(1)}`;
    for (let i = 1; i <= steps; i++) {
      const x = (i / steps) * w.w;
      const y = w.y + Math.sin(w.phase + x * w.freq) * w.amp;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  /* ----- pelicans (rare, tiny) ----- */
  const pelicans = useMemo(() => {
    const n = rng(2001) > 0.82 ? (rng(2002) > 0.6 ? 2 : 1) : 0;
    return Array.from({ length: n }).map((_, i) => ({
      y: p(horizonY + 6 + rng(2010 + i) * 36),
      s: 8 + rng(2020 + i) * 4,
      dur: 120 + rng(2030 + i) * 60,
      delay: rng(2040 + i) * 30,
      startX: -40 - i * 60,
    }));
  }, [rng, horizonY]);

  /* ----- ids ----- */
  const uid = useMemo(() => `ocean-${Math.random().toString(36).slice(2, 9)}`, []);
  const ids = {
    topfade: `${uid}-topfade`,
    topmask: `${uid}-topmask`,
    water: `${uid}-water`,
    haze: `${uid}-haze`,
    panel: `${uid}-panel`,
    glint: `${uid}-glint`,
  };

  /* ----- weather flags (optional) ----- */
  const isRain = weather?.precipitation === "rain" && (weather.intensity ?? 0) > 0;
  const foggy = (weather?.cloudCover ?? 0) > 0.7 || weather?.condition === "humid";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", left: 0, bottom: 0, pointerEvents: "none", imageRendering: "pixelated" }}
      shapeRendering="crispEdges"
    >
      <defs>
        {/* Top fade so the horizon melts into the background sky */}
        <linearGradient id={ids.topfade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0" />
          <stop offset="45%"  stopColor="white" stopOpacity=".22" />
          <stop offset="70%"  stopColor="white" stopOpacity=".60" />
          <stop offset="88%"  stopColor="white" stopOpacity=".90" />
          <stop offset="100%" stopColor="white" stopOpacity=".98" />
        </linearGradient>
        <mask id={ids.topmask}>
          <rect x="0" y="0" width={width} height={height} fill={`url(#${ids.topfade})`} />
          {/* slight undulation so it isn't a perfect bar */}
          <path
            d={`M 0 ${p(horizonY - height * 0.04)}
               Q ${p(width * 0.25)} ${p(horizonY - height * 0.06)}, ${p(width * 0.5)} ${p(horizonY - height * 0.04)}
               T ${width} ${p(horizonY - height * 0.04)}
               L ${width} 0 L 0 0 Z`}
            fill="white"
            opacity="0.15"
          />
        </mask>

        {/* Water gradient */}
        <linearGradient id={ids.water} x1="0" y1={horizonY} x2="0" y2={height}>
          <stop offset="0%"   stopColor={P.waterHorizon} />
          <stop offset="25%"  stopColor={P.waterFar} />
          <stop offset="55%"  stopColor={P.waterMid} />
          <stop offset="82%"  stopColor={P.waterNear} />
          <stop offset="100%" stopColor={P.waterDeep} />
        </linearGradient>

        {/* Horizon haze */}
        <linearGradient id={ids.haze} x1="0" y1={horizonY - height * 0.02} x2="0" y2={horizonY + height * 0.14}>
          <stop offset="0%" stopColor={P.haze} stopOpacity="0.4" />
          <stop offset="100%" stopColor={P.haze} stopOpacity="0" />
        </linearGradient>

        {/* Bottom feather into the panel color */}
        <linearGradient id={ids.panel} x1="0" y1={yFeather} x2="0" y2={height}>
          <stop offset="0%"   stopColor={P.panel2} />
          <stop offset="60%"  stopColor={P.panel1} />
          <stop offset="100%" stopColor={P.panel0} />
        </linearGradient>

        {/* Glint pattern (slow drift) */}
        <pattern id={ids.glint} width="40" height="18" patternUnits="userSpaceOnUse">
          <g opacity={isNight ? 0.10 : 0.18}>
            <rect x="4" y="8" width="18" height="1" fill={P.waveHi} />
            <rect x="26" y="12" width="10" height="1" fill={P.waveHi} />
            <rect x="12" y="4" width="8" height="1" fill={P.waveHi} />
          </g>
          <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="80 0" dur="48s" repeatCount="indefinite" />
        </pattern>
      </defs>

      {/* Masked group for clean top blending */}
      <g mask={`url(#${ids.topmask})`}>
        {/* Ocean fill */}
        <rect x="0" y={horizonY} width={width} height={height - horizonY} fill={`url(#${ids.water})`} />

        {/* Crisp horizon line */}
        <rect x="0" y={horizonY - 1} width={width} height="2" fill={P.waterHorizon} opacity={isNight ? 0.6 : 0.8} />

        {/* Horizon haze */}
        <rect x="0" y={horizonY - height * 0.02} width={width} height={height * 0.16} fill={`url(#${ids.haze})`} />

        {/* Slow glints in the far/mid water */}
        <rect x="0" y={p(height * 0.28)} width={width} height={p(height * 0.18)} fill={`url(#${ids.glint})`} />

        {/* Swell lines */}
        {waves.map((w, i) => (
          <g key={i} opacity={w.op}>
            <path d={wavePath(w)} stroke={w.col} strokeWidth={w.thick} fill="none" />
            {/* near-band highlight just above line */}
            {w.thick >= 3 && (
              <path
                d={wavePath({ ...w, y: w.y - 1, amp: w.amp * 0.8 })}
                stroke={P.waveHi}
                strokeWidth={1}
                fill="none"
                opacity={0.5}
              />
            )}
          </g>
        ))}

        {/* Bottom feather to panel color */}
        <rect x="0" y={yFeather} width={width} height={height - yFeather} fill={`url(#${ids.panel})`} />
      </g>

      {/* ----------------------------- Weather ----------------------------- */}
      {/* Rain: faint diagonal streaks + darkened water */}
      {isRain && (
        <g opacity={0.25 + (weather!.intensity || 0) * 0.25}>
          {Array.from({ length: 28 }).map((_, i) => {
            const x = p(rng(3000 + i) * width);
            const y1 = p(horizonY + rng(3010 + i) * (height - horizonY));
            const y2 = y1 + 14;
            return (
              <path
                key={i}
                d={`M ${x} ${y1} L ${x + 4} ${y2}`}
                stroke={blendHex(P.waveLo, "#ffffff", 0.15)}
                strokeWidth="1"
                opacity="0.85"
              />
            );
          })}
          <rect x="0" y={horizonY} width={width} height={height - horizonY} fill={P.mist} opacity="0.08" />
        </g>
      )}

      {/* Fog veil (overcast / humid) */}
      {foggy && (
        <rect x="0" y={horizonY - height * 0.03} width={width} height={height * 0.22} fill={P.mist} opacity={0.20} />
      )}

      {/* ---------------------------- Pelicans ---------------------------- */}
      {pelicans.map((b, i) => (
        <g key={i}>
          <animateTransform
            attributeName="transform"
            type="translate"
            from={`${b.startX} 0`}
            to={`${width + 40} 0`}
            dur={`${b.dur}s`}
            begin={`${b.delay}s`}
            repeatCount="indefinite"
          />
          <g transform={`translate(0, ${b.y})`} opacity={isNight ? 0.25 : 0.4}>
            {/* body */}
            <rect x="0" y="0" width={b.s} height={b.s * 0.4} fill={blendHex(P.waterNear, "#0b1220", 0.5)} />
            {/* wings */}
            <path
              d={`M 0 ${b.s * 0.2} L ${-b.s * 0.9} 0 M ${b.s} ${b.s * 0.2} L ${b.s * 1.9} 0`}
              stroke={blendHex(P.waterNear, "#0b1220", 0.55)}
              strokeWidth={Math.max(2, Math.round(b.s * 0.12))}
              strokeLinecap="square"
              fill="none"
            />
            {/* beak */}
            <rect x={b.s} y={b.s * 0.12} width={Math.max(2, Math.round(b.s * 0.25))} height={Math.max(1, Math.round(b.s * 0.10))} fill={blendHex(P.waterNear, "#000", 0.6)} />
          </g>
        </g>
      ))}
    </svg>
  );
};

export default React.memo(OpenOceanHorizon);
