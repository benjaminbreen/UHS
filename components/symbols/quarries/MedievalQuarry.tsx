/**
 * components/symbols/quarries/MedievalQuarry.tsx - Medieval stone quarry
 */
import React from 'react';

interface MedievalQuarryProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const MedievalQuarry: React.FC<MedievalQuarryProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.85} rx={size * 0.4} ry={size * 0.08} fill="#000" opacity="0.2" />
      
      {/* Simple stepped quarry face - bigger and cleaner */}
      <rect x={size * 0.1} y={size * 0.2} width={size * 0.8} height={size * 0.15} fill="#D4C5B0" />
      <rect x={size * 0.15} y={size * 0.35} width={size * 0.7} height={size * 0.15} fill="#C4B5A0" />
      <rect x={size * 0.2} y={size * 0.5} width={size * 0.6} height={size * 0.15} fill="#B4A590" />
      <rect x={size * 0.25} y={size * 0.65} width={size * 0.5} height={size * 0.15} fill="#A49580" />
      
      {/* Large stone blocks */}
      <rect x={size * 0.65} y={size * 0.7} width={size * 0.15} height={size * 0.1} fill="#D4C5B0" stroke="#8B7355" strokeWidth={size * 0.02} />
      <rect x={size * 0.2} y={size * 0.72} width={size * 0.15} height={size * 0.1} fill="#D0C1AC" stroke="#8B7355" strokeWidth={size * 0.02} />
      <rect x={size * 0.42} y={size * 0.74} width={size * 0.15} height={size * 0.1} fill="#D2C3AE" stroke="#8B7355" strokeWidth={size * 0.02} />
      
      {/* Simple wooden crane/scaffold - A-frame design */}
      <path d={`M ${size * 0.35} ${size * 0.65} L ${size * 0.45} ${size * 0.25} L ${size * 0.55} ${size * 0.65}`} 
            stroke="#6B5641" strokeWidth={size * 0.05} fill="none" strokeLinecap="round" />
      <line x1={size * 0.38} y1={size * 0.5} x2={size * 0.52} y2={size * 0.5} stroke="#6B5641" strokeWidth={size * 0.03} />
      
      {/* Simple pulley at top */}
      <circle cx={size * 0.45} cy={size * 0.25} r={size * 0.04} fill="none" stroke="#4A3C2A" strokeWidth={size * 0.02} />
      
      {/* Rope with stone block */}
      <line x1={size * 0.45} y1={size * 0.29} x2={size * 0.45} y2={size * 0.55} stroke="#8B7355" strokeWidth={size * 0.02} />
      <rect x={size * 0.4} y={size * 0.55} width={size * 0.1} height={size * 0.08} fill="#C4B5A0" stroke="#8B7355" strokeWidth={size * 0.01} />
      
      {/* Simple cart */}
      <rect x={size * 0.05} y={size * 0.45} width={size * 0.12} height={size * 0.06} fill="#6B5641" />
      <circle cx={size * 0.08} cy={size * 0.52} r={size * 0.025} fill="#4A3C2A" />
      <circle cx={size * 0.14} cy={size * 0.52} r={size * 0.025} fill="#4A3C2A" />
    </g>
  );
};

export default MedievalQuarry;