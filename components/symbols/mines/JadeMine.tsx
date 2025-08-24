/**
 * components/symbols/mines/JadeMine.tsx - Jade quarry with Asian architectural elements
 */
import React from 'react';

interface JadeMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const JadeMine: React.FC<JadeMineProps> = ({ x, y, size, seed }) => {
  // Variants based on seed
  const hasTemple = (seed % 3) === 0;
  const hasWaterWheel = (seed % 4) !== 0;
  const hasCarvingStation = (seed % 2) === 0;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.85} rx={size * 0.4} ry={size * 0.08} fill="#000" opacity="0.2" />
      
      {/* Rocky outcrop with jade veins */}
      <path d={`M ${size * 0.2} ${size * 0.6} L ${size * 0.15} ${size * 0.4} L ${size * 0.35} ${size * 0.35} L ${size * 0.5} ${size * 0.3} L ${size * 0.7} ${size * 0.38} L ${size * 0.85} ${size * 0.45} L ${size * 0.8} ${size * 0.6} Z`} 
            fill="#8B7D6B" stroke="#6B5D4B" strokeWidth={size * 0.02} />
      
      {/* Jade veins in rock */}
      <path d={`M ${size * 0.3} ${size * 0.45} Q ${size * 0.4} ${size * 0.42}, ${size * 0.5} ${size * 0.45}`} 
            stroke="#2E8B57" strokeWidth={size * 0.015} fill="none" opacity="0.7" />
      <path d={`M ${size * 0.45} ${size * 0.38} Q ${size * 0.55} ${size * 0.4}, ${size * 0.65} ${size * 0.42}`} 
            stroke="#3CB371" strokeWidth={size * 0.012} fill="none" opacity="0.6" />
      <path d={`M ${size * 0.25} ${size * 0.5} L ${size * 0.35} ${size * 0.48}`} 
            stroke="#2E8B57" strokeWidth={size * 0.01} opacity="0.5" />
      
      {/* Quarry cut into rock */}
      <rect x={size * 0.4} y={size * 0.45} width={size * 0.15} height={size * 0.15} fill="#000" opacity="0.7" />
      <rect x={size * 0.4} y={size * 0.45} width={size * 0.15} height={size * 0.02} fill="#6B5D4B" />
      
      {/* Extracted jade blocks */}
      <rect x={size * 0.6} y={size * 0.58} width={size * 0.08} height={size * 0.06} fill="#2E8B57" stroke="#1F5F3F" strokeWidth={size * 0.01} opacity="0.9" />
      <rect x={size * 0.65} y={size * 0.54} width={size * 0.06} height={size * 0.05} fill="#3CB371" stroke="#2E8B57" strokeWidth={size * 0.008} opacity="0.85" />
      <rect x={size * 0.62} y={size * 0.51} width={size * 0.05} height={size * 0.04} fill="#2E8B57" stroke="#1F5F3F" strokeWidth={size * 0.006} opacity="0.8" />
      
      {hasTemple && (
        <>
          {/* Small shrine/temple structure */}
          <rect x={size * 0.08} y={size * 0.45} width={size * 0.12} height={size * 0.1} fill="#8B4513" stroke="#654321" strokeWidth={size * 0.01} />
          
          {/* Pagoda-style roof */}
          <polygon points={`${size * 0.04},${size * 0.45} ${size * 0.14},${size * 0.38} ${size * 0.24},${size * 0.45}`} 
                   fill="#D2691E" stroke="#A0522D" strokeWidth={size * 0.01} />
          <path d={`M ${size * 0.06} ${size * 0.42} Q ${size * 0.14} ${size * 0.4}, ${size * 0.22} ${size * 0.42}`} 
                stroke="#A0522D" strokeWidth={size * 0.008} fill="none" />
          
          {/* Decorative upturned eaves */}
          <path d={`M ${size * 0.04} ${size * 0.45} Q ${size * 0.03} ${size * 0.44}, ${size * 0.035} ${size * 0.43}`} 
                stroke="#D2691E" strokeWidth={size * 0.01} fill="none" strokeLinecap="round" />
          <path d={`M ${size * 0.24} ${size * 0.45} Q ${size * 0.25} ${size * 0.44}, ${size * 0.245} ${size * 0.43}`} 
                stroke="#D2691E" strokeWidth={size * 0.01} fill="none" strokeLinecap="round" />
          
          {/* Entrance */}
          <rect x={size * 0.12} y={size * 0.48} width={size * 0.04} height={size * 0.07} fill="#4A3A2A" />
        </>
      )}
      
      {hasWaterWheel && (
        <>
          {/* Water channel for cutting */}
          <rect x={size * 0.3} y={size * 0.65} width={size * 0.4} height={size * 0.03} fill="#4A90E2" opacity="0.6" />
          
          {/* Water wheel */}
          <circle cx={size * 0.75} cy={size * 0.65} r={size * 0.08} fill="none" stroke="#8B4513" strokeWidth={size * 0.015} />
          
          {/* Wheel spokes */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
            const rad = (angle * Math.PI) / 180;
            const x1 = size * 0.75 + Math.cos(rad) * size * 0.02;
            const y1 = size * 0.65 + Math.sin(rad) * size * 0.02;
            const x2 = size * 0.75 + Math.cos(rad) * size * 0.07;
            const y2 = size * 0.65 + Math.sin(rad) * size * 0.07;
            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#654321" strokeWidth={size * 0.008} />;
          })}
          
          {/* Axle */}
          <circle cx={size * 0.75} cy={size * 0.65} r={size * 0.02} fill="#4A3A2A" />
        </>
      )}
      
      {hasCarvingStation && (
        <>
          {/* Workshop shelter */}
          <rect x={size * 0.25} y={size * 0.7} width={size * 0.2} height={size * 0.08} fill="#A0826D" stroke="#806050" strokeWidth={size * 0.01} />
          <polygon points={`${size * 0.23},${size * 0.7} ${size * 0.35},${size * 0.65} ${size * 0.47},${size * 0.7}`} 
                   fill="#8B7355" stroke="#6B5345" strokeWidth={size * 0.01} />
          
          {/* Work bench */}
          <rect x={size * 0.28} y={size * 0.74} width={size * 0.14} height={size * 0.02} fill="#654321" />
          <rect x={size * 0.29} y={size * 0.76} width={size * 0.02} height={size * 0.03} fill="#4A3A2A" />
          <rect x={size * 0.39} y={size * 0.76} width={size * 0.02} height={size * 0.03} fill="#4A3A2A" />
          
          {/* Small jade piece being carved */}
          <ellipse cx={size * 0.35} cy={size * 0.73} rx={size * 0.02} ry={size * 0.015} fill="#2E8B57" opacity="0.9" />
          
          {/* Carving tools */}
          <line x1={size * 0.31} y1={size * 0.73} x2={size * 0.33} y2={size * 0.735} stroke="#606060" strokeWidth={size * 0.005} />
          <line x1={size * 0.37} y1={size * 0.73} x2={size * 0.38} y2={size * 0.74} stroke="#606060" strokeWidth={size * 0.005} />
        </>
      )}
      
      {/* Stone cutting tools */}
      <line x1={size * 0.5} y1={size * 0.68} x2={size * 0.55} y2={size * 0.62} stroke="#606060" strokeWidth={size * 0.02} />
      <polygon points={`${size * 0.54},${size * 0.62} ${size * 0.56},${size * 0.6} ${size * 0.57},${size * 0.64}`} 
               fill="#404040" />
      
      {/* Bamboo scaffolding */}
      <line x1={size * 0.35} y1={size * 0.6} x2={size * 0.35} y2={size * 0.35} stroke="#D2B48C" strokeWidth={size * 0.01} />
      <line x1={size * 0.45} y1={size * 0.6} x2={size * 0.45} y2={size * 0.38} stroke="#D2B48C" strokeWidth={size * 0.01} />
      <line x1={size * 0.33} y1={size * 0.42} x2={size * 0.47} y2={size * 0.42} stroke="#D2B48C" strokeWidth={size * 0.008} />
      <line x1={size * 0.33} y1={size * 0.5} x2={size * 0.47} y2={size * 0.5} stroke="#D2B48C" strokeWidth={size * 0.008} />
    </g>
  );
};

export default JadeMine;