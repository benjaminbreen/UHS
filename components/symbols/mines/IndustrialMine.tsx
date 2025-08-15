/**
 * components/symbols/mines/IndustrialMine.tsx - Industrial era mine with steam power
 */
import React from 'react';

interface IndustrialMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const IndustrialMine: React.FC<IndustrialMineProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.85} rx={size * 0.35} ry={size * 0.08} fill="#000" opacity="0.2" />
      
      {/* Main mine building - bigger and simpler */}
      <rect x={size * 0.2} y={size * 0.35} width={size * 0.6} height={size * 0.45} fill="#4A3A2A" />
      <rect x={size * 0.2} y={size * 0.35} width={size * 0.6} height={size * 0.45} fill="#000" opacity="0.2" />
      
      {/* Roof */}
      <polygon points={`${size * 0.15},${size * 0.35} ${size * 0.5},${size * 0.2} ${size * 0.85},${size * 0.35}`} fill="#2A1A0A" />
      
      {/* Simple headframe - cleaner A-frame design */}
      <path d={`M ${size * 0.35} ${size * 0.35} L ${size * 0.5} ${size * 0.05} L ${size * 0.65} ${size * 0.35}`} 
            stroke="#1A0A00" strokeWidth={size * 0.08} fill="none" strokeLinecap="round" />
      <line x1={size * 0.4} y1={size * 0.25} x2={size * 0.6} y2={size * 0.25} stroke="#1A0A00" strokeWidth={size * 0.04} />
      
      {/* Simple winding wheel at top */}
      <circle cx={size * 0.5} cy={size * 0.08} r={size * 0.06} fill="none" stroke="#1A0A00" strokeWidth={size * 0.03} />
      <line x1={size * 0.44} y1={size * 0.08} x2={size * 0.56} y2={size * 0.08} stroke="#1A0A00" strokeWidth={size * 0.02} />
      <line x1={size * 0.5} y1={size * 0.02} x2={size * 0.5} y2={size * 0.14} stroke="#1A0A00" strokeWidth={size * 0.02} />
      
      {/* Mine entrance - bigger and clearer */}
      <rect x={size * 0.4} y={size * 0.55} width={size * 0.2} height={size * 0.25} fill="#000" />
      <rect x={size * 0.4} y={size * 0.55} width={size * 0.2} height={size * 0.05} fill="#3A2A1A" />
      
      {/* Simple chimney with smoke */}
      <rect x={size * 0.7} y={size * 0.15} width={size * 0.08} height={size * 0.25} fill="#2A1A0A" />
      
      {/* Simplified smoke puffs */}
      <circle cx={size * 0.74} cy={size * 0.1} r={size * 0.04} fill="#999" opacity="0.4" />
      <circle cx={size * 0.76} cy={size * 0.05} r={size * 0.05} fill="#999" opacity="0.3" />
      
      {/* Simple ore pile */}
      <path d={`M ${size * 0.1} ${size * 0.8} L ${size * 0.05} ${size * 0.85} L ${size * 0.2} ${size * 0.85} Z`} fill="#2A1A0A" />
      
      {/* Simple cart track */}
      <line x1={size * 0.25} y1={size * 0.82} x2={size * 0.75} y2={size * 0.82} stroke="#3A2A1A" strokeWidth={size * 0.03} />
    </g>
  );
};

export default IndustrialMine;