/**
 * components/symbols/government/TribalCouncilSymbol.tsx
 * Opaque earthen mound + flames drawn in front of the central pole
 */
import React from 'react';
import { Tile } from '../../../types';

interface TribalCouncilSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'native_american' | 'african' | 'polynesian' | 'aboriginal' | 'advanced' | 'kingdom';
}

const TribalCouncilSymbol: React.FC<TribalCouncilSymbolProps> = ({
  x, y, size, seed, tile, buildingName, variant = 'native_american'
}) => {
  const uniqueId = `tribal-${x}-${y}-${seed}`;

  const cx = size * 0.5;
  const moundCy = size * 0.7;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        {/* Fire gradient & glow */}
        <radialGradient id={`fireGrad-${uniqueId}`} cx="50%" cy="80%">
          <stop offset="0%" stopColor="#fff59a" />
          <stop offset="28%" stopColor="#ffd24d" />
          <stop offset="60%" stopColor="#ff7a1a" />
          <stop offset="100%" stopColor="#cc3300" />
        </radialGradient>
        <filter id={`glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Opaque earthen mound gradients */}
        <radialGradient id={`moundFill-${uniqueId}`} cx="50%" cy="40%" r="70%">
          {/* top highlight -> mid earth -> darker base */}
          <stop offset="0%" stopColor="#d7b48a" />
          <stop offset="45%" stopColor="#b98f64" />
          <stop offset="100%" stopColor="#825c3a" />
        </radialGradient>
        {/* subtle rim highlight for a "raised" hill/fort edge */}
        <linearGradient id={`rimGrad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ead2b8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#a77951" stopOpacity="0.0" />
        </linearGradient>

        {/* Soft blur for shadows */}
        <filter id={`softBlur-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>

      {/* --- MOUND / GROUND: now opaque with earthy gradient --- */}
      {/* Main mound */}
      <ellipse
        cx={cx}
        cy={moundCy}
        rx={size * 0.46}
        ry={size * 0.22}
        fill={`url(#moundFill-${uniqueId})`}
      />
      {/* Base shadow to seat the mound */}
      <ellipse
        cx={cx}
        cy={moundCy + size * 0.02}
        rx={size * 0.42}
        ry={size * 0.14}
        fill="#000"
        opacity={0.18}
        filter={`url(#softBlur-${uniqueId})`}
      />
      {/* Rim highlight to suggest raised edge */}
      <ellipse
        cx={cx}
        cy={moundCy - size * 0.02}
        rx={size * 0.43}
        ry={size * 0.18}
        fill={`url(#rimGrad-${uniqueId})`}
        opacity={0.65}
      />

      {/* Stone circle for council */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const stoneX = cx + Math.cos(angle) * size * 0.35;
        const stoneY = size * 0.6 + Math.sin(angle) * size * 0.2;
        return (
          <ellipse
            key={i}
            cx={stoneX}
            cy={stoneY}
            rx={size * 0.04}
            ry={size * 0.03}
            fill="#8a7a6a"
            stroke="#6a5a4a"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Fire pit (darker bowl + hot rim) */}
      <ellipse cx={cx} cy={size * 0.6} rx={size * 0.09} ry={size * 0.055} fill="#3c2a1c" />
      <ellipse cx={cx} cy={size * 0.6} rx={size * 0.09} ry={size * 0.055} fill="#000" opacity={0.25} />
      <ellipse cx={cx} cy={size * 0.598} rx={size * 0.07} ry={size * 0.04} fill="#6e4b32" opacity={0.6} />

      {/* --- CENTRAL POLE (drawn BEFORE fire so flames appear in FRONT) --- */}
      <g>
        <rect
          x={cx - size * 0.02}
          y={size * 0.35}
          width={size * 0.04}
          height={size * 0.25}
          fill="#6a4a2a"
          stroke="#4a2a0a"
          strokeWidth={0.5}
        />
        {/* Carved details */}
        <circle cx={cx} cy={size * 0.40} r={size * 0.015} fill="#8a6a4a" />
        <rect x={cx - size * 0.015} y={size * 0.43} width={size * 0.03} height={size * 0.02} fill="#7a5a3a" />
        <circle cx={cx} cy={size * 0.48} r={size * 0.012} fill="#8a6a4a" />
      </g>

      {/* --- FIRE (now drawn AFTER the pole so it sits IN FRONT of the pole) --- */}
      <g filter={`url(#glow-${uniqueId})`} transform={`translate(${cx}, ${size * 0.58})`}>
        {/* Flame 1 */}
        <ellipse
          cx={-size * 0.02}
          cy={0}
          rx={size * 0.03}
          ry={size * 0.05}
          fill={`url(#fireGrad-${uniqueId})`}
        >
          <animate attributeName="ry" values={`${size * 0.05};${size * 0.07};${size * 0.05}`} dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="rx" values={`${size * 0.03};${size * 0.025};${size * 0.03}`} dur="0.8s" repeatCount="indefinite" />
        </ellipse>
        {/* Flame 2 */}
        <ellipse
          cx={size * 0.02}
          cy={0}
          rx={size * 0.025}
          ry={size * 0.045}
          fill={`url(#fireGrad-${uniqueId})`}
        >
          <animate attributeName="ry" values={`${size * 0.045};${size * 0.065};${size * 0.045}`} dur="1s" repeatCount="indefinite" />
        </ellipse>
        {/* Central tall flame */}
        <ellipse
          cx={0}
          cy={-size * 0.01}
          rx={size * 0.035}
          ry={size * 0.06}
          fill={`url(#fireGrad-${uniqueId})`}
        >
          <animate attributeName="ry" values={`${size * 0.06};${size * 0.08};${size * 0.06}`} dur="1.2s" repeatCount="indefinite" />
        </ellipse>
      </g>

      {/* Smoke (origin slightly above flames) */}
      <g opacity="0.42">
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={cx} cy={size * 0.53} r={size * 0.02} fill="#8c8c8c">
            <animate attributeName="cy" values={`${size * 0.53};${size * 0.33};${size * 0.15}`} dur={`${2.8 + i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="cx" values={`${cx};${cx + size * 0.03};${cx + size * 0.05}`} dur={`${2.8 + i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="r" values={`${size * 0.02};${size * 0.038};${size * 0.055}`} dur={`${2.8 + i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.42;0.28;0" dur={`${2.8 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>

      {/* Variant-specific decorations (unchanged) */}
      {variant === 'african' && (
        <g>
          <ellipse cx={size * 0.3} cy={size * 0.65} rx={size * 0.04} ry={size * 0.03} fill="#8a6a4a" stroke="#6a4a2a" strokeWidth={0.5} />
          <ellipse cx={size * 0.7} cy={size * 0.65} rx={size * 0.04} ry={size * 0.03} fill="#8a6a4a" stroke="#6a4a2a" strokeWidth={0.5} />
        </g>
      )}

      {variant === 'polynesian' && (
        <g>
          <rect x={size * 0.25} y={size * 0.5} width={size * 0.02} height={size * 0.15} fill="#6a4a2a" />
          <ellipse cx={size * 0.26} cy={size * 0.48} rx={size * 0.02} ry={size * 0.03} fill="#ff8800" opacity={0.8} />
          <rect x={size * 0.73} y={size * 0.5} width={size * 0.02} height={size * 0.15} fill="#6a4a2a" />
          <ellipse cx={size * 0.74} cy={size * 0.48} rx={size * 0.02} ry={size * 0.03} fill="#ff8800" opacity={0.8} />
        </g>
      )}

      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(TribalCouncilSymbol);
