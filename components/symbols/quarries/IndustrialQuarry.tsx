/**
 * components/symbols/quarries/IndustrialQuarry.tsx - Industrial era mechanized quarry
 */
import React from 'react';

interface IndustrialQuarryProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const IndustrialQuarry: React.FC<IndustrialQuarryProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.85} rx={size * 0.4} ry={size * 0.08} fill="#000" opacity="0.2" />
      
      {/* Simple stepped quarry pit - bigger and cleaner */}
      <polygon points={`${size * 0.1},${size * 0.3} ${size * 0.9},${size * 0.3} ${size * 0.8},${size * 0.5} ${size * 0.2},${size * 0.5}`} 
               fill="#A0907F" />
      <polygon points={`${size * 0.2},${size * 0.5} ${size * 0.8},${size * 0.5} ${size * 0.7},${size * 0.7} ${size * 0.3},${size * 0.7}`} 
               fill="#8B7B6A" />
      <polygon points={`${size * 0.3},${size * 0.7} ${size * 0.7},${size * 0.7} ${size * 0.6},${size * 0.85} ${size * 0.4},${size * 0.85}`} 
               fill="#766659" />
      
      {/* Large simple crane */}
      <rect x={size * 0.65} y={size * 0.15} width={size * 0.2} height={size * 0.25} fill="#5A4A3A" />
      <rect x={size * 0.72} y={size * 0.05} width={size * 0.06} height={size * 0.1} fill="#3A2A1A" />
      
      {/* Crane arm - simple diagonal line */}
      <line x1={size * 0.75} y1={size * 0.15} x2={size * 0.45} y2={size * 0.4} 
            stroke="#2A1A0A" strokeWidth={size * 0.05} strokeLinecap="round" />
      
      {/* Simple smoke puffs */}
      <circle cx={size * 0.75} cy={size * 0.02} r={size * 0.04} fill="#999" opacity="0.4" />
      
      {/* Simple rock crusher - just a box */}
      <rect x={size * 0.1} y={size * 0.4} width={size * 0.25} height={size * 0.2} fill="#6A5A4A" />
      <rect x={size * 0.15} y={size * 0.45} width={size * 0.15} height={size * 0.08} fill="#000" opacity="0.5" />
      
      {/* Stone blocks */}
      <rect x={size * 0.4} y={size * 0.75} width={size * 0.08} height={size * 0.08} fill="#9B8B7A" />
      <rect x={size * 0.5} y={size * 0.75} width={size * 0.08} height={size * 0.08} fill="#A0907F" />
      
      {/* Simple track line */}
      <line x1={size * 0.35} y1={size * 0.8} x2={size * 0.65} y2={size * 0.8} 
            stroke="#4A3426" strokeWidth={size * 0.03} />
    </g>
  );
};

export default IndustrialQuarry;