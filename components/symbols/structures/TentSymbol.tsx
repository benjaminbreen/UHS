/**
 * components/symbols/structures/TentSymbol.tsx - Simple tent/teepee icon for player-deployed structures
 */
import React from 'react';

interface TentSymbolProps {
  x: number;
  y: number;
  size?: number;
}

const TentSymbol: React.FC<TentSymbolProps> = React.memo(({ x, y, size = 10 }) => {
  const baseColor = '#D2B48C'; // Tan/beige color
  const shadowColor = '#A0826D';
  const outlineColor = '#8B7355';

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id="tentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: shadowColor}} />
          <stop offset="50%" style={{stopColor: baseColor}} />
          <stop offset="100%" style={{stopColor: shadowColor}} />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx={0} cy={size * 0.4} rx={size * 0.7} ry={size * 0.2} fill="rgba(0,0,0,0.25)" />

      {/* Poles at top */}
      <line x1={0} y1={-size * 0.6} x2={0} y2={-size * 0.8} stroke={outlineColor} strokeWidth="1.5" strokeLinecap="round" />

      {/* Main tent cone */}
      <path
        d={`M ${-size * 0.6} ${size * 0.4} L 0 ${-size * 0.6} L ${size * 0.6} ${size * 0.4} Z`}
        fill="url(#tentGrad)"
        stroke={outlineColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Entrance flap */}
      <path
        d={`M ${-size * 0.15} ${size * 0.4} L 0 ${size * 0.05} L ${size * 0.15} ${size * 0.4} Z`}
        fill="#5C4033"
        stroke={outlineColor}
        strokeWidth="1"
      />

      {/* Decorative band */}
      <line
        x1={-size * 0.45} y1={size * 0.15}
        x2={size * 0.45} y2={size * 0.15}
        stroke="#8B4513"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
});

export default TentSymbol;
