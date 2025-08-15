/**
 * components/symbols/mines/MedievalMine.tsx - Medieval mine with wooden supports
 */
import React from 'react';

interface MedievalMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const MedievalMine: React.FC<MedievalMineProps> = ({ x, y, size, seed }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.85} rx={size * 0.35} ry={size * 0.08} fill="#000" opacity="0.2" />
      
      {/* Simple hillside - bigger and cleaner */}
      <path 
        d={`M ${size * 0.1} ${size * 0.7} Q ${size * 0.5} ${size * 0.2} ${size * 0.9} ${size * 0.7} L ${size * 0.9} ${size * 0.9} L ${size * 0.1} ${size * 0.9} Z`}
        fill="#8B7355"
      />
      
      {/* Large mine entrance */}
      <rect x={size * 0.35} y={size * 0.45} width={size * 0.3} height={size * 0.35} fill="#000" />
      
      {/* Simple wooden frame - thicker lines */}
      <rect x={size * 0.32} y={size * 0.42} width={size * 0.36} height={size * 0.06} fill="#5A4A3A" />
      <rect x={size * 0.32} y={size * 0.42} width={size * 0.06} height={size * 0.38} fill="#5A4A3A" />
      <rect x={size * 0.62} y={size * 0.42} width={size * 0.06} height={size * 0.38} fill="#5A4A3A" />
      
      {/* Simple water wheel - bigger and cleaner */}
      <circle cx={size * 0.2} cy={size * 0.6} r={size * 0.12} fill="none" stroke="#4A3426" strokeWidth={size * 0.04} />
      {/* Just 4 spokes for simplicity */}
      <line x1={size * 0.08} y1={size * 0.6} x2={size * 0.32} y2={size * 0.6} stroke="#4A3426" strokeWidth={size * 0.03} />
      <line x1={size * 0.2} y1={size * 0.48} x2={size * 0.2} y2={size * 0.72} stroke="#4A3426" strokeWidth={size * 0.03} />
      
      {/* Simple ore pile */}
      <path d={`M ${size * 0.7} ${size * 0.75} L ${size * 0.65} ${size * 0.85} L ${size * 0.8} ${size * 0.85} Z`} fill="#3A2A1A" />
      
      {/* Simple torch glow effect */}
      <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.05} fill="#FFA500" opacity="0.6" />
      
      {/* Bellows for ventilation */}
      <path 
        d={`M ${size * 0.75} ${size * 0.4} L ${size * 0.85} ${size * 0.42} L ${size * 0.85} ${size * 0.48} L ${size * 0.75} ${size * 0.5} Z`}
        fill="#8B7355"
        stroke="#4A3426"
        strokeWidth="1"
      >
        <animate
          attributeName="d"
          values={`M ${size * 0.75} ${size * 0.4} L ${size * 0.85} ${size * 0.42} L ${size * 0.85} ${size * 0.48} L ${size * 0.75} ${size * 0.5} Z;
                   M ${size * 0.75} ${size * 0.42} L ${size * 0.82} ${size * 0.43} L ${size * 0.82} ${size * 0.47} L ${size * 0.75} ${size * 0.48} Z;
                   M ${size * 0.75} ${size * 0.4} L ${size * 0.85} ${size * 0.42} L ${size * 0.85} ${size * 0.48} L ${size * 0.75} ${size * 0.5} Z`}
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
    </g>
  );
};

export default MedievalMine;