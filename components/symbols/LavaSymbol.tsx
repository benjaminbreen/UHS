/**
 * components/symbols/LavaSymbol.tsx
 * Realistic, tile-seamless lava with convection cells, cooling rim, cracks, bloom, and embers.
 */
import React, { useMemo } from 'react';
import { ValueNoise } from '../../utils/noise';

interface LavaSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  /** Optional: approximate flow angle in degrees (helps align bands across tiles) */
  flowAngleDeg?: number;
}

const LavaSymbol: React.FC<LavaSymbolProps> = React.memo(
  ({ x, y, size, seed, flowAngleDeg = 20 }) => {
    const id = useMemo(() => `lava-${Math.round(x)}-${Math.round(y)}-${seed}`, [x, y, seed]);
    const rng = useMemo(() => new ValueNoise(seed), [seed]);

    // A couple of organic crack polylines
    const crackPaths = useMemo(() => {
      const cracks: string[] = [];
      const n = 2 + (seed % 2);
      for (let c = 0; c < n; c++) {
        const y0 = size * (0.25 + 0.5 * rng.random());
        const segs = 10;
        let d = `M 0 ${y0}`;
        for (let i = 1; i <= segs; i++) {
          const px = (size / segs) * i;
          const amp = size * 0.08;
          const py = y0 + (rng.random() - 0.5) * amp * (1 + 0.3 * Math.sin((i + c) * 0.9));
          d += ` Q ${px - size / segs / 2} ${py}, ${px} ${py}`;
        }
        cracks.push(d);
      }
      return cracks;
    }, [size, rng, seed]);

    return (
      <g transform={`translate(${x}, ${y})`} pointerEvents="none">
        <defs>
          {/* --- Thermal color ramp (subtle flicker) --- */}
          <linearGradient id={`lava-ramp-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="5%" stopColor="#fff7d1">
              <animate attributeName="stop-color" values="#fff7d1;#ffe8a6;#fff7d1" dur="4.5s" repeatCount="indefinite" />
            </stop>
            <stop offset="35%" stopColor="#ffd04a">
              <animate attributeName="stop-color" values="#ffd04a;#ffbf3b;#ffd04a" dur="5.2s" repeatCount="indefinite" />
            </stop>
            <stop offset="70%" stopColor="#ff6a1a">
              <animate attributeName="stop-color" values="#ff6a1a;#ff5313;#ff6a1a" dur="5.8s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#7f0a06" />
          </linearGradient>

          {/* --- Cooling rim gradient used as a stroke --- */}
          <linearGradient id={`rim-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a0b0a" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
          </linearGradient>

          {/* --- Subtle flow bands (pāhoehoe sheen) --- */}
          <linearGradient id={`band-grad-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={size} y2="0" gradientTransform={`rotate(${flowAngleDeg})`}>
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
            <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to={`${size} 0`} dur="7s" repeatCount="indefinite" />
          </linearGradient>

          {/* --- Roiling convection + distortion --- */}
          <filter id={`roil-${id}`} x={-size * 0.2} y={-size * 0.2} width={size * 1.4} height={size * 1.4} filterUnits="userSpaceOnUse">
            {/* large slow cells */}
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="2" seed={seed} stitchTiles="stitch" result="n1">
              <animate attributeName="baseFrequency" values="0.02 0.03;0.017 0.028;0.02 0.03" dur="8s" repeatCount="indefinite" />
            </feTurbulence>
            {/* fine ripples */}
            <feTurbulence type="fractalNoise" baseFrequency="0.08 0.10" numOctaves="1" seed={seed + 7} stitchTiles="stitch" result="n2">
              <animate attributeName="baseFrequency" values="0.08 0.10;0.06 0.08;0.08 0.10" dur="4.5s" repeatCount="indefinite" />
            </feTurbulence>
            <feBlend in="n1" in2="n2" mode="multiply" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G">
              <animate attributeName="scale" values="8;12;8" dur="6s" repeatCount="indefinite" />
            </feDisplacementMap>
          </filter>

          {/* --- Crack mask: thin lines that open/close via morphology --- */}
          <filter id={`crack-filter-${id}`} x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation="0.6" result="b" />
            <feColorMatrix in="b" type="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 25 -12" result="alpha" />
          </filter>

          {/* --- Soft emissive bloom --- */}
          <filter id={`bloom-${id}`} x={-size * 0.45} y={-size * 0.45} width={size * 1.9} height={size * 1.9} filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix type="matrix" values="
                1 0 0 0 0
                0 0.55 0 0 0
                0 0 0.2 0 0
                0 0 0 1 0" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base molten field with roiling distortion & color ramp */}
        <g filter={`url(#roil-${id})`}>
          <rect width={size} height={size} fill={`url(#lava-ramp-${id})`} />
        </g>

        {/* Flow sheen bands (very subtle) */}
        <rect width={size} height={size} fill={`url(#band-grad-${id})`} style={{ mixBlendMode: 'screen' as any }} opacity={0.35} />

  
        {/* Crack network (animated “breathing” width) */}
        <g filter={`url(#crack-filter-${id})`} opacity={0.9}>
          {crackPaths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#200a07"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <animate attributeName="stroke-width" values="1.2;2.0;1.2" dur={`${4 + i * 0.7}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;1;0.85" dur={`${5 + i * 0.6}s`} repeatCount="indefinite" />
            </path>
          ))}
        </g>

        {/* Occasional bright fissure pulses (thin hot lines) */}
        {crackPaths.slice(0, 1).map((d, i) => (
          <path key={`hot-${i}`} d={d} fill="none" stroke="#ffd24a" strokeWidth={0.8} opacity="0">
            <animate attributeName="opacity" values="0;0;0.8;0" dur="6.5s" repeatCount="indefinite" />
          </path>
        ))}

        {/* Soft bloom over the whole tile (no hard square stroke) */}
        <g filter={`url(#bloom-${id})`} opacity={0.95}>
          <rect width={size} height={size} fill="transparent" />
        </g>

        {/* Rising embers */}
        {[0, 1, 2].map((i) => {
          const ex = size * (0.25 + 0.5 * rng.random());
          const ey = size * (0.55 + 0.15 * rng.random());
          const r = 0.8 + rng.random() * 1.4;
          const d = 3.5 + i * 0.6;
          return (
            <circle key={`ember-${i}`} cx={ex} cy={ey} r={r} fill="#ffeaa0" opacity="0.0">
              <animate attributeName="cy" values={`${ey};${ey - size * 0.35};${ey - size * 0.45}`} dur={`${d}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.8;0" dur={`${d}s`} repeatCount="indefinite" />
              <animate attributeName="r" values={`${r};${r * 0.6};${r}`} dur={`${d}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </g>
    );
  }
);

export default LavaSymbol;
