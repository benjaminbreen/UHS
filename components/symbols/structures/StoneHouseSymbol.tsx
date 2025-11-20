/**
 * components/symbols/structures/StoneHouseSymbol.tsx - Simple stone house icon for player-deployed structures
 */
import React from 'react';

interface StoneHouseSymbolProps {
  x: number;
  y: number;
  size?: number;
}

const StoneHouseSymbol: React.FC<StoneHouseSymbolProps> = React.memo(({ x, y, size = 10 }) => {
  const stoneColor = '#8B8680'; // Gray stone
  const roofColor = '#654321'; // Brown roof
  const doorColor = '#3B2F2F';
  const outlineColor = '#4A4A4A';

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id="stoneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#6B6660'}} />
          <stop offset="50%" style={{stopColor: stoneColor}} />
          <stop offset="100%" style={{stopColor: '#6B6660'}} />
        </linearGradient>
        <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: roofColor}} />
          <stop offset="100%" style={{stopColor: '#4A3218'}} />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx={0} cy={size * 0.5} rx={size * 0.8} ry={size * 0.25} fill="rgba(0,0,0,0.25)" />

      {/* Stone walls */}
      <rect
        x={-size * 0.6}
        y={-size * 0.15}
        width={size * 1.2}
        height={size * 0.65}
        fill="url(#stoneGrad)"
        stroke={outlineColor}
        strokeWidth="1.5"
        rx="1"
      />

      {/* Stone texture details */}
      <line x1={-size * 0.3} y1={-size * 0.05} x2={size * 0.2} y2={-size * 0.05} stroke="#7A7570" strokeWidth="0.8" />
      <line x1={-size * 0.5} y1={size * 0.15} x2={size * 0.3} y2={size * 0.15} stroke="#7A7570" strokeWidth="0.8" />
      <line x1={-size * 0.4} y1={size * 0.35} x2={size * 0.4} y2={size * 0.35} stroke="#7A7570" strokeWidth="0.8" />

      {/* Roof */}
      <path
        d={`M ${-size * 0.75} ${-size * 0.15} L 0 ${-size * 0.7} L ${size * 0.75} ${-size * 0.15} Z`}
        fill="url(#roofGrad)"
        stroke={outlineColor}
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />

      {/* Door */}
      <rect
        x={-size * 0.2}
        y={size * 0.15}
        width={size * 0.4}
        height={size * 0.35}
        fill={doorColor}
        stroke={outlineColor}
        strokeWidth="1"
        rx="1.5"
      />

      {/* Door handle */}
      <circle cx={size * 0.05} cy={size * 0.32} r="1" fill="#BDB76B" />

      {/* Window */}
      <rect
        x={size * 0.25}
        y={size * 0.05}
        width={size * 0.25}
        height={size * 0.25}
        fill="#4A6572"
        stroke={outlineColor}
        strokeWidth="0.8"
      />

      {/* Window cross */}
      <line x1={size * 0.375} y1={size * 0.05} x2={size * 0.375} y2={size * 0.3} stroke={outlineColor} strokeWidth="0.8" />
      <line x1={size * 0.25} y1={size * 0.175} x2={size * 0.5} y2={size * 0.175} stroke={outlineColor} strokeWidth="0.8" />
    </g>
  );
});

export default StoneHouseSymbol;
