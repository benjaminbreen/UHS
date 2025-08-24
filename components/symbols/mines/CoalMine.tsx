/**
 * components/symbols/mines/CoalMine.tsx - Industrial coal mine with pithead and railway
 */
import React from 'react';

interface CoalMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const CoalMine: React.FC<CoalMineProps> = ({ x, y, size, seed }) => {
  // Variants based on seed
  const hasSmoke = (seed % 2) === 0;
  const hasCoalPile = (seed % 3) !== 0;
  const isDeepShaft = (seed % 4) === 0;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.9} rx={size * 0.45} ry={size * 0.1} fill="#000" opacity="0.3" />
      
      {/* Main pithead building */}
      <rect x={size * 0.3} y={size * 0.35} width={size * 0.4} height={size * 0.35} fill="#606060" stroke="#404040" strokeWidth={size * 0.02} />
      
      {/* Windows */}
      <rect x={size * 0.35} y={size * 0.4} width={size * 0.06} height={size * 0.08} fill="#87CEEB" opacity="0.5" />
      <rect x={size * 0.45} y={size * 0.4} width={size * 0.06} height={size * 0.08} fill="#87CEEB" opacity="0.5" />
      <rect x={size * 0.55} y={size * 0.4} width={size * 0.06} height={size * 0.08} fill="#87CEEB" opacity="0.5" />
      
      {/* Roof */}
      <polygon points={`${size * 0.28},${size * 0.35} ${size * 0.5},${size * 0.25} ${size * 0.72},${size * 0.35}`} 
               fill="#505050" stroke="#303030" strokeWidth={size * 0.01} />
      
      {/* Winding tower (pithead frame) */}
      <path d={`M ${size * 0.4} ${size * 0.35} L ${size * 0.42} ${size * 0.1} L ${size * 0.58} ${size * 0.1} L ${size * 0.6} ${size * 0.35}`} 
            stroke="#303030" strokeWidth={size * 0.04} fill="none" strokeLinecap="round" />
      <line x1={size * 0.42} y1={size * 0.25} x2={size * 0.58} y2={size * 0.25} stroke="#303030" strokeWidth={size * 0.02} />
      <line x1={size * 0.43} y1={size * 0.2} x2={size * 0.57} y2={size * 0.2} stroke="#303030" strokeWidth={size * 0.02} />
      
      {/* Winding wheels */}
      <circle cx={size * 0.5} cy={size * 0.15} r={size * 0.06} fill="none" stroke="#202020" strokeWidth={size * 0.02} />
      <line x1={size * 0.44} y1={size * 0.15} x2={size * 0.56} y2={size * 0.15} stroke="#202020" strokeWidth={size * 0.01} />
      <line x1={size * 0.5} y1={size * 0.09} x2={size * 0.5} y2={size * 0.21} stroke="#202020" strokeWidth={size * 0.01} />
      
      {/* Mine shaft entrance */}
      <rect x={size * 0.45} y={size * 0.6} width={size * 0.1} height={size * 0.1} fill="#000" />
      <rect x={size * 0.44} y={size * 0.59} width={size * 0.12} height={size * 0.02} fill="#404040" />
      
      {/* Railway tracks */}
      <line x1={size * 0.1} y1={size * 0.75} x2={size * 0.9} y2={size * 0.75} stroke="#606060" strokeWidth={size * 0.02} />
      <line x1={size * 0.1} y1={size * 0.78} x2={size * 0.9} y2={size * 0.78} stroke="#606060" strokeWidth={size * 0.02} />
      
      {/* Railway sleepers */}
      {[0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85].map(pos => (
        <rect key={pos} x={size * pos} y={size * 0.74} width={size * 0.03} height={size * 0.05} fill="#4A3A2A" />
      ))}
      
      {/* Coal wagons */}
      <rect x={size * 0.2} y={size * 0.68} width={size * 0.12} height={size * 0.08} fill="#404040" stroke="#202020" strokeWidth={size * 0.01} />
      <circle cx={size * 0.23} cy={size * 0.77} r={size * 0.02} fill="#303030" />
      <circle cx={size * 0.29} cy={size * 0.77} r={size * 0.02} fill="#303030" />
      
      {/* Coal in wagon */}
      <polygon points={`${size * 0.21},${size * 0.72} ${size * 0.26},${size * 0.66} ${size * 0.31},${size * 0.72}`} 
               fill="#1A1A1A" />
      
      {hasCoalPile && (
        <>
          {/* Large coal pile */}
          <polygon points={`${size * 0.7},${size * 0.7} ${size * 0.75},${size * 0.55} ${size * 0.85},${size * 0.6} ${size * 0.9},${size * 0.7}`} 
                   fill="#1A1A1A" stroke="#0A0A0A" strokeWidth={size * 0.01} />
          <polygon points={`${size * 0.72},${size * 0.65} ${size * 0.78},${size * 0.58} ${size * 0.82},${size * 0.65}`} 
                   fill="#2A2A2A" />
        </>
      )}
      
      {isDeepShaft && (
        <>
          {/* Ventilation shaft */}
          <rect x={size * 0.75} y={size * 0.45} width={size * 0.08} height={size * 0.15} fill="#707070" stroke="#505050" strokeWidth={size * 0.01} />
          <rect x={size * 0.77} y={size * 0.43} width={size * 0.04} height={size * 0.03} fill="#505050" />
        </>
      )}
      
      {/* Chimney with smoke */}
      <rect x={size * 0.12} y={size * 0.3} width={size * 0.06} height={size * 0.25} fill="#8B4513" stroke="#654321" strokeWidth={size * 0.01} />
      <rect x={size * 0.11} y={size * 0.29} width={size * 0.08} height={size * 0.03} fill="#654321" />
      
      {hasSmoke && (
        <>
          {/* Animated smoke effect */}
          <ellipse cx={size * 0.15} cy={size * 0.25} rx={size * 0.03} ry={size * 0.02} fill="#808080" opacity="0.4" />
          <ellipse cx={size * 0.16} cy={size * 0.22} rx={size * 0.04} ry={size * 0.025} fill="#808080" opacity="0.3" />
          <ellipse cx={size * 0.14} cy={size * 0.18} rx={size * 0.05} ry={size * 0.03} fill="#808080" opacity="0.2" />
        </>
      )}
      
      {/* Lamp post */}
      <rect x={size * 0.08} y={size * 0.6} width={size * 0.01} height={size * 0.1} fill="#404040" />
      <circle cx={size * 0.085} cy={size * 0.58} r={size * 0.02} fill="#FFFF99" opacity="0.6" />
    </g>
  );
};

export default CoalMine;