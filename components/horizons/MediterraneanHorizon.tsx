/**
 * components/horizons/MediterraneanHorizon.tsx
 * Distortion-proof Mediterranean horizon:
 * - Transparent top (no sky), atmospheric haze fade
 * - Pixel-art layers with depth (coastal range, olive hills, cypress, villas)
 * - Deterministic tiling: one 320×120 “tile” scaled to strip height and repeated across width
 * - Time-of-day palettes (Dawn/Day/Midday/Dusk/Night)
 * - Subtle ambience: rare sea-glints (coastal), tiny drifting birds (day/dusk)
 */

import React, { useMemo, useRef } from 'react';
import { TimeOfDay } from '../../types';

interface MediterraneanHorizonProps {
  timeOfDay: TimeOfDay;
  width: number;
  height: number;
  hasWater?: boolean;
  hasCentralWater?: boolean;
  isUrban?: boolean;
  weather?: any;
  seed?: number;
  /** Optional: blend last few pixels to the bottom UI panel if you want a melt */
  bottomPanelColor?: string;
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

const TILE_W = 320;
const TILE_H = 120;

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MediterraneanHorizon: React.FC<MediterraneanHorizonProps> = ({
  timeOfDay,
  width,
  height,
  hasWater = true,
  hasCentralWater = false,
  isUrban = false,
  weather,
  seed,
  bottomPanelColor,
  sky,
}) => {
  // Helper to blend two hex colors
  const blendHex = (color1: string, color2: string, ratio: number): string => {
    const parseHex = (hex: string) => {
      const clean = hex.replace('#', '');
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      return { r, g, b };
    };
    
    const c1 = parseHex(color1);
    const c2 = parseHex(color2);
    const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
    const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
    const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  // ---------- RNG (stable) ----------
  const rng = useRef<() => number>(
    mulberry32(
      (seed ?? 0) ^
        (Math.floor(width) << 7) ^
        Math.floor(height) ^
        [...String(timeOfDay)].reduce((a, c) => a + c.charCodeAt(0), 0)
    )
  );

  // ---------- palette (blend with sky colors if available) ----------
  const P = useMemo(() => {
    // Get sky colors if available
    const skyTop = sky?.top || '#6e5e92';
    const skyMid = sky?.mid || '#87CEEB';
    const skyBottom = sky?.bottom || '#E6F3FF';
    
    const base = {
      // distant range (cool), mid hills, near land, accents
      vf: '#6e5e92',
      far: '#7d6aaa',
      mid1: '#a48e77',
      mid2: '#b89f84',
      near: '#8b735a',
      nearAcc: '#9f866c',
      olive: '#586b2f',
      cypress: '#2f4f3a',
      villa: '#fff6e5',
      roof: '#c15b2d',
      cliff: '#d9b791',
      cliffHi: '#f1d3ad',
      water: sky?.water || '#3a78b8',
      waterAcc: '#9bd4ff',
      hazeDark: sky?.hazeDark || '#a7b3cf',
      hazeLight: sky?.hazeLight || '#cfd8ea',
      vignette: 'rgba(0,0,0,0.18)',
      bird: '#242b3a',
      windowGlow: 'rgba(255,214,170,0.75)',
    };

    const t = String(timeOfDay).toLowerCase();
    const isNight = t.includes('night');
    const isDawn = t.includes('dawn');
    const isDusk = t.includes('dusk');
    const isTwilight = isDawn || isDusk;
    
    // Variable sky influence based on time of day
    const skyInfluence = isNight ? 0.65 : isDusk ? 0.45 : isDawn ? 0.40 : 0.20;
    
    // Apply sky tinting
    if (sky) {
      base.vf = blendHex(base.vf, skyTop, skyInfluence * 1.2);
      base.far = blendHex(base.far, skyTop, skyInfluence);
      base.mid1 = blendHex(base.mid1, skyMid, skyInfluence * 0.9);
      base.mid2 = blendHex(base.mid2, skyMid, skyInfluence * 0.9);
      base.near = blendHex(base.near, skyBottom, skyInfluence * 0.8);
      base.nearAcc = blendHex(base.nearAcc, skyBottom, skyInfluence * 0.8);
      base.olive = blendHex(base.olive, skyBottom, skyInfluence * 0.7);
      base.cypress = blendHex(base.cypress, skyBottom, skyInfluence * 0.7);
      base.cliff = blendHex(base.cliff, skyBottom, skyInfluence * 0.6);
      base.cliffHi = blendHex(base.cliffHi, skyBottom, skyInfluence * 0.5);
      base.waterAcc = blendHex(base.waterAcc, skyMid, skyInfluence * 0.4);
    }
    
    if (t.includes('night')) {
      return {
        ...base,
        vf: '#3f3563',
        far: '#4a3d74',
        mid1: '#2e2a3d',
        mid2: '#3b3648',
        near: '#2b2436',
        nearAcc: '#3a3143',
        olive: '#1b2715',
        cypress: '#162318',
        water: '#1f3861',
        waterAcc: '#6aa7ff',
      };
    }
    if (t.includes('dawn')) {
      return {
        ...base,
        vf: '#816da4',
        far: '#8e79b2',
        mid1: '#9a846f',
        mid2: '#ad957d',
        near: '#8e745d',
        nearAcc: '#a2856a',
        water: '#4786c5',
        waterAcc: '#bde0ff',
      };
    }
    if (t.includes('dusk')) {
      return {
        ...base,
        vf: '#745d9a',
        far: '#856cad',
        mid1: '#8f7a67',
        mid2: '#a18b74',
        near: '#7f6b56',
        nearAcc: '#927c63',
        water: '#3e6da6',
        waterAcc: '#a6d0ff',
      };
    }
    if (t.includes('mid')) {
      return {
        ...base,
        vf: '#a39cc2',
        far: '#b0a6cd',
        mid1: '#ad957f',
        mid2: '#bda78f',
        near: '#9f876f',
        nearAcc: '#b0957b',
        water: '#2f74b5',
        waterAcc: '#aee1ff',
      };
    }
    // Day (default)
    return base;
  }, [timeOfDay]);

  // ---------- helpers ----------
  const scale = height / TILE_H;
  const tiles = Math.max(1, Math.ceil(width / (TILE_W * scale)) + 1);

  // Periodic ridge (seamless across tiles)
  const ridgePath = (w: number, yBase: number, amp: number, k = 1, phase = 0) => {
    const steps = 16;
    let d = `M 0 ${TILE_H} L 0 ${yBase}`;
    for (let i = 1; i <= steps; i++) {
      const x = (i / steps) * w;
      const t = (i / steps) * Math.PI * 2 * k + phase;
      const dy =
        amp *
        (0.5 +
          0.28 * Math.sin(t) +
          0.08 * Math.sin(t * 2 + 1.1) +
          0.05 * Math.cos(t * 3 + 0.6));
      const y = yBase - dy;
      const cx = x - w / steps / 2;
      const cy = y + (Math.sin(t) * amp) / 12;
      d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return (d += ` L ${w} ${TILE_H} Z`);
  };

  // ---------- rare ambience gates ----------
  const showBirds = !String(timeOfDay).toLowerCase().includes('night') && rng.current() > 0.8;
  const showSeaGlints = hasWater && rng.current() > 0.5;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', left: 0, bottom: 0, pointerEvents: 'none', display: 'block' }}
      shapeRendering="crispEdges"
    >
      <defs>
        {/* Top atmospheric haze to full transparency (no sky painted) */}
        <linearGradient id="med-top-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={P.hazeLight} stopOpacity="0.4" />
          <stop offset="45%" stopColor={P.hazeDark} stopOpacity="0.1" />
          <stop offset="68%" stopColor={P.hazeDark} stopOpacity="0.04" />
          <stop offset="100%" stopColor={P.hazeDark} stopOpacity="0" />
        </linearGradient>

        {/* Optional melt into bottom panel if provided */}
        {bottomPanelColor && (
          <linearGradient id="med-bottom-melt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.near} />
            <stop offset="65%" stopColor={P.nearAcc} />
            <stop offset="100%" stopColor={bottomPanelColor} />
          </linearGradient>
        )}

        {/* light dither to sell pixel texture */}
        <pattern id="med-dither" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="1" height="1" fill="rgba(0,0,0,0.06)" />
          <rect x="1" y="1" width="1" height="1" fill="rgba(0,0,0,0.06)" />
        </pattern>

        <style>{`
          @keyframes med-bird {
            0% { transform: translateX(0) translateY(0); opacity: .0; }
            10% { opacity: .35; }
            100% { transform: translateX(${TILE_W}px) translateY(-6px); opacity: .0; }
          }
          @keyframes med-glint {
            0% { opacity: 0; }
            40% { opacity: .5; }
            100% { opacity: 0; }
          }
        `}</style>
      </defs>

      {/* Top haze overlay (transparent to background) */}
      <rect x="0" y="0" width={width} height={height} fill="url(#med-top-haze)" />

      {/* Tiled content scaled to strip height */}
      <g transform={`scale(${scale})`}>

        {Array.from({ length: tiles }).map((_, i) => {
          const xOff = i * TILE_W;
          // slight per-tile offset for olives/villas to avoid obvious repetition
          const jitter = (rng.current() - 0.5) * 6;

          return (
            <g key={i} transform={`translate(${xOff}, 0)`}>


              {/* FAR ridges & cliffs */}
              <path d={ridgePath(TILE_W, TILE_H * 0.62, TILE_H * 0.13, 1, 1.25)} fill={P.far} opacity="0.92" />

              {/* Mid hills/terraces */}
              <path
                d={`M 0 ${TILE_H * 0.72}
                   C ${TILE_W * 0.18} ${TILE_H * 0.66}, ${TILE_W * 0.38} ${TILE_H * 0.74}, ${TILE_W * 0.56} ${TILE_H * 0.66}
                   S ${TILE_W * 0.90} ${TILE_H * 0.60}, ${TILE_W} ${TILE_H * 0.74}
                   L ${TILE_W} ${TILE_H} L 0 ${TILE_H} Z`}
                fill={P.mid1}
              />
              {/* terraces */}
              {[0.22, 0.45, 0.68].map((p, t) => (
                <rect
                  key={t}
                  x={TILE_W * p - 32 + jitter}
                  y={TILE_H * (0.67 + t * 0.02)}
                  width="64"
                  height="2"
                  fill={P.mid2}
                  opacity="0.35"
                />
              ))}

              {/* Olive dots on hills */}
              {[0.12, 0.26, 0.34, 0.5, 0.64, 0.76, 0.88].map((p, idx) => (
                <g key={idx}>
                  <rect
                    x={TILE_W * p - 1 + jitter * 0.2}
                    y={TILE_H * (0.69 + Math.sin(idx * 1.7) * 0.01)}
                    width="2"
                    height="6"
                    fill={P.cypress}
                    opacity="0.5"
                  />
                  <ellipse
                    cx={TILE_W * p + jitter * 0.2}
                    cy={TILE_H * (0.68 + Math.sin(idx * 1.7) * 0.01)}
                    rx="6"
                    ry="9"
                    fill={P.olive}
                    opacity="0.85"
                  />
                </g>
              ))}

              {/* Near ground (cypress + villas) */}
              <path
                d={`M 0 ${TILE_H * 0.80}
                   C ${TILE_W * 0.12} ${TILE_H * 0.78}, ${TILE_W * 0.36} ${TILE_H * 0.82}, ${TILE_W * 0.58} ${TILE_H * 0.78}
                   S ${TILE_W * 0.86} ${TILE_H * 0.76}, ${TILE_W} ${TILE_H * 0.80}
                   L ${TILE_W} ${TILE_H} L 0 ${TILE_H} Z`}
                fill={P.near}
              />
              {[0.08, 0.20, 0.34, 0.48, 0.62, 0.76, 0.90].map((p, idx) => {
                const baseY = TILE_H * 0.80;
                const h = 20 + (idx % 3) * 3;
                return (
                  <g key={idx}>
                    {/* cypress */}
                    <rect x={TILE_W * p - 2} y={baseY - h + 4} width="4" height={Math.max(10, h - 6)} fill={P.cypress} opacity="0.9" />
                    <path
                      d={`M ${TILE_W * p} ${baseY - h}
                         L ${TILE_W * p - 6} ${baseY - h * 0.3}
                         L ${TILE_W * p - 4} ${baseY}
                         L ${TILE_W * p + 4} ${baseY}
                         L ${TILE_W * p + 6} ${baseY - h * 0.3} Z`}
                      fill={P.cypress}
                    />
                  </g>
                );
              })}
              {/* villas (only if urban) */}
              {isUrban && [0.24, 0.52, 0.82].map((p, k) => (
                <g key={k} opacity="0.95">
                  <rect x={TILE_W * p - 8 + jitter * 0.3} y={TILE_H * 0.76} width="16" height="8" fill={P.villa} />
                  <path
                    d={`M ${TILE_W * p - 10 + jitter * 0.3} ${TILE_H * 0.76}
                       L ${TILE_W * p + jitter * 0.3} ${TILE_H * 0.72}
                       L ${TILE_W * p + 10 + jitter * 0.3} ${TILE_H * 0.76} Z`}
                    fill={P.roof}
                  />
                  {/* windows */}
                  <rect x={TILE_W * p - 4 + jitter * 0.3} y={TILE_H * 0.778} width="3" height="3" fill={P.windowGlow} opacity="0.7" />
                  <rect x={TILE_W * p + 2 + jitter * 0.3} y={TILE_H * 0.778} width="3" height="3" fill={P.windowGlow} opacity="0.6" />
                </g>
              ))}

              {/* Central water for delta/lake maps */}
              {hasCentralWater && (
                <>
                  <path
                    d={`M ${TILE_W * 0.25} ${TILE_H * 0.72}
                       C ${TILE_W * 0.35} ${TILE_H * 0.70}, ${TILE_W * 0.45} ${TILE_H * 0.71}, ${TILE_W * 0.50} ${TILE_H * 0.72}
                       S ${TILE_W * 0.65} ${TILE_H * 0.71}, ${TILE_W * 0.75} ${TILE_H * 0.72}
                       L ${TILE_W * 0.75} ${TILE_H * 0.82}
                       C ${TILE_W * 0.65} ${TILE_H * 0.81}, ${TILE_W * 0.55} ${TILE_H * 0.82}, ${TILE_W * 0.50} ${TILE_H * 0.82}
                       S ${TILE_W * 0.35} ${TILE_H * 0.81}, ${TILE_W * 0.25} ${TILE_H * 0.82}
                       Z`}
                    fill={P.water}
                    opacity="0.7"
                  />
                  <path
                    d={`M ${TILE_W * 0.30} ${TILE_H * 0.75} Q ${TILE_W * 0.50} ${TILE_H * 0.74}, ${TILE_W * 0.70} ${TILE_H * 0.75}`}
                    stroke={P.waterAcc}
                    strokeWidth="1"
                    opacity="0.5"
                    fill="none"
                  />
                </>
              )}
              
              {/* Coastal water band (optional) */}
              {hasWater && !hasCentralWater && (
                <>
                  <rect x="0" y={TILE_H * 0.86} width={TILE_W} height={TILE_H * 0.14} fill={P.water} opacity="0.46" />
                  {/* shoreline highlight */}
                  <rect x="0" y={TILE_H * 0.86} width={TILE_W} height="1" fill={P.waterAcc} opacity="0.55" />
                  {/* very rare soft glints */}
                  {showSeaGlints &&
                    [32, 96, 208, 272].map((gx, gi) => (
                      <rect
                        key={gi}
                        x={gx}
                        y={TILE_H * (0.87 + (gi % 2) * 0.02)}
                        width="14"
                        height="1"
                        fill="#ffffff"
                        style={{ animation: `med-glint ${8 + gi}s ${1.5 * gi}s infinite` }}
                        opacity="0.0"
                      />
                    ))}
                </>
              )}

              {/* tiny birds (rare, subtle) */}
              {showBirds && (
                <g opacity="0.35" style={{ animation: `med-bird ${14 + ((rng.current() * 8) | 0)}s linear infinite` }}>
                  {/* “m” shaped bird */}
                  <path
                    d={`M ${-12} ${TILE_H * 0.50} q 4 -2 8 0 q 4 2 8 0`}
                    fill="none"
                    stroke={P.bird}
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Top haze again (keeps the area above land transparent + bluish) */}
      <rect x="0" y="0" width={width} height={height} fill="url(#med-top-haze)" pointerEvents="none" />

      {/* Optional bottom melt so the very last pixels blend with your bottom panel */}
      {bottomPanelColor && (
        <rect x="0" y={height * 0.90} width={width} height={height * 0.10} fill="url(#med-bottom-melt)" />
      )}
    </svg>
  );
};

export default React.memo(MediterraneanHorizon);
