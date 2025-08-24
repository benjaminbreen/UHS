/**
 * components/symbols/mines/SaltMine.tsx - Salt evaporation ponds or underground salt mine
 */
import React from 'react';

interface SaltMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const SaltMine: React.FC<SaltMineProps> = ({ x, y, size, seed }) => {
  // Determine if evaporation ponds or underground based on seed
  const isEvaporationPonds = (seed % 3) !== 0;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.85} rx={size * 0.35} ry={size * 0.08} fill="#000" opacity="0.2" />
      
      {isEvaporationPonds ? (
        // Salt evaporation ponds variant
        <>
          {/* Multiple shallow ponds */}
          <rect x={size * 0.1} y={size * 0.4} width={size * 0.25} height={size * 0.15} fill="#B0E0E6" stroke="#8A8A8A" strokeWidth={size * 0.02} />
          <rect x={size * 0.4} y={size * 0.35} width={size * 0.25} height={size * 0.15} fill="#B0E0E6" stroke="#8A8A8A" strokeWidth={size * 0.02} />
          <rect x={size * 0.7} y={size * 0.4} width={size * 0.2} height={size * 0.15} fill="#B0E0E6" stroke="#8A8A8A" strokeWidth={size * 0.02} />
          
          {/* Salt crystals in ponds */}
          <rect x={size * 0.15} y={size * 0.45} width={size * 0.03} height={size * 0.03} fill="#FFFFFF" opacity="0.9" />
          <rect x={size * 0.25} y={size * 0.47} width={size * 0.03} height={size * 0.03} fill="#FFFFFF" opacity="0.9" />
          <rect x={size * 0.45} y={size * 0.4} width={size * 0.03} height={size * 0.03} fill="#FFFFFF" opacity="0.9" />
          <rect x={size * 0.75} y={size * 0.45} width={size * 0.03} height={size * 0.03} fill="#FFFFFF" opacity="0.9" />
          
          {/* Salt pyramid */}
          <polygon points={`${size * 0.25},${size * 0.7} ${size * 0.35},${size * 0.55} ${size * 0.45},${size * 0.7}`} fill="#F0F0F0" stroke="#C0C0C0" strokeWidth={size * 0.01} />
          
          {/* Simple shelter */}
          <rect x={size * 0.5} y={size * 0.6} width={size * 0.25} height={size * 0.2} fill="#A0826D" stroke="#806050" strokeWidth={size * 0.01} />
          <polygon points={`${size * 0.48},${size * 0.6} ${size * 0.625},${size * 0.5} ${size * 0.77},${size * 0.6}`} fill="#8B7355" />
          
          {/* Raking tools */}
          <line x1={size * 0.8} y1={size * 0.75} x2={size * 0.85} y2={size * 0.65} stroke="#8B4513" strokeWidth={size * 0.02} />
          <line x1={size * 0.82} y1={size * 0.65} x2={size * 0.88} y2={size * 0.65} stroke="#8B4513" strokeWidth={size * 0.01} />
        </>
      ) : (
        // Underground salt mine variant
        <>
          {/* Mine entrance structure */}
          <rect x={size * 0.3} y={size * 0.4} width={size * 0.4} height={size * 0.4} fill="#C0C0C0" stroke="#808080" strokeWidth={size * 0.02} />
          
          {/* Mine entrance */}
          <rect x={size * 0.4} y={size * 0.55} width={size * 0.2} height={size * 0.25} fill="#000" />
          <rect x={size * 0.4} y={size * 0.55} width={size * 0.2} height={size * 0.05} fill="#808080" />
          
          {/* Headframe */}
          <path d={`M ${size * 0.35} ${size * 0.4} L ${size * 0.5} ${size * 0.2} L ${size * 0.65} ${size * 0.4}`} 
                stroke="#606060" strokeWidth={size * 0.06} fill="none" strokeLinecap="round" />
          
          {/* Winding wheel */}
          <circle cx={size * 0.5} cy={size * 0.25} r={size * 0.05} fill="none" stroke="#404040" strokeWidth={size * 0.02} />
          
          {/* Salt pile (white) */}
          <path d={`M ${size * 0.1} ${size * 0.8} L ${size * 0.05} ${size * 0.7} L ${size * 0.2} ${size * 0.7} Z`} fill="#F0F0F0" stroke="#C0C0C0" strokeWidth={size * 0.01} />
          
          {/* Cart track */}
          <line x1={size * 0.2} y1={size * 0.82} x2={size * 0.8} y2={size * 0.82} stroke="#606060" strokeWidth={size * 0.02} />
        </>
      )}
    </g>
  );
};

export default SaltMine;