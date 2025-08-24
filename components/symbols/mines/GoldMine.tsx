/**
 * components/symbols/mines/GoldMine.tsx - Gold mine with sluice boxes and prospecting equipment
 */
import React from 'react';

interface GoldMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const GoldMine: React.FC<GoldMineProps> = ({ x, y, size, seed }) => {
  // Determine variant based on seed
  const isRiverPanning = (seed % 3) === 0;
  const hasNugget = (seed % 5) === 0;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.85} rx={size * 0.4} ry={size * 0.1} fill="#000" opacity="0.25" />
      
      {isRiverPanning ? (
        // River panning variant
        <>
          {/* River/stream */}
          <path d={`M ${size * 0.1} ${size * 0.6} Q ${size * 0.3} ${size * 0.65}, ${size * 0.5} ${size * 0.6} T ${size * 0.9} ${size * 0.65}`} 
                stroke="#4A90E2" strokeWidth={size * 0.08} fill="none" opacity="0.7" />
          
          {/* Sluice box */}
          <rect x={size * 0.35} y={size * 0.5} width={size * 0.3} height={size * 0.08} fill="#8B4513" stroke="#654321" strokeWidth={size * 0.01} />
          <line x1={size * 0.36} y1={size * 0.52} x2={size * 0.64} y2={size * 0.52} stroke="#654321" strokeWidth={size * 0.005} />
          <line x1={size * 0.36} y1={size * 0.54} x2={size * 0.64} y2={size * 0.54} stroke="#654321" strokeWidth={size * 0.005} />
          <line x1={size * 0.36} y1={size * 0.56} x2={size * 0.64} y2={size * 0.56} stroke="#654321" strokeWidth={size * 0.005} />
          
          {/* Prospector's tent */}
          <polygon points={`${size * 0.2},${size * 0.45} ${size * 0.1},${size * 0.35} ${size * 0.3},${size * 0.35}`} 
                   fill="#D2B48C" stroke="#A0826D" strokeWidth={size * 0.01} />
          <polygon points={`${size * 0.1},${size * 0.35} ${size * 0.2},${size * 0.45} ${size * 0.15},${size * 0.45}`} 
                   fill="#8B7355" />
          
          {/* Gold pan */}
          <ellipse cx={size * 0.75} cy={size * 0.7} rx={size * 0.06} ry={size * 0.03} fill="#4A4A4A" stroke="#303030" strokeWidth={size * 0.01} />
          {hasNugget && <circle cx={size * 0.75} cy={size * 0.7} r={size * 0.01} fill="#FFD700" />}
          
          {/* Pickaxe and shovel */}
          <line x1={size * 0.8} y1={size * 0.75} x2={size * 0.85} y2={size * 0.65} stroke="#8B4513" strokeWidth={size * 0.02} />
          <polygon points={`${size * 0.84},${size * 0.65} ${size * 0.86},${size * 0.63} ${size * 0.87},${size * 0.67}`} fill="#808080" />
          
          <line x1={size * 0.82} y1={size * 0.75} x2={size * 0.87} y2={size * 0.65} stroke="#8B4513" strokeWidth={size * 0.02} />
          <rect x={size * 0.86} y={size * 0.63} width={size * 0.03} height={size * 0.04} rx={size * 0.005} fill="#606060" />
        </>
      ) : (
        // Hard rock mining variant
        <>
          {/* Mine entrance in hillside */}
          <path d={`M ${size * 0.2} ${size * 0.7} L ${size * 0.2} ${size * 0.4} L ${size * 0.5} ${size * 0.3} L ${size * 0.8} ${size * 0.4} L ${size * 0.8} ${size * 0.7} Z`} 
                fill="#8B7355" stroke="#6B5345" strokeWidth={size * 0.02} />
          
          {/* Mine entrance */}
          <rect x={size * 0.4} y={size * 0.5} width={size * 0.2} height={size * 0.2} fill="#000" />
          <path d={`M ${size * 0.4} ${size * 0.5} L ${size * 0.5} ${size * 0.45} L ${size * 0.6} ${size * 0.5}`} 
                fill="#6B5345" />
          
          {/* Support beams */}
          <rect x={size * 0.39} y={size * 0.5} width={size * 0.02} height={size * 0.2} fill="#654321" />
          <rect x={size * 0.59} y={size * 0.5} width={size * 0.02} height={size * 0.2} fill="#654321" />
          <rect x={size * 0.4} y={size * 0.49} width={size * 0.2} height={size * 0.02} fill="#654321" />
          
          {/* Ore cart on tracks */}
          <line x1={size * 0.25} y1={size * 0.72} x2={size * 0.75} y2={size * 0.72} stroke="#606060" strokeWidth={size * 0.015} />
          <line x1={size * 0.25} y1={size * 0.74} x2={size * 0.75} y2={size * 0.74} stroke="#606060" strokeWidth={size * 0.015} />
          
          <rect x={size * 0.65} y={size * 0.68} width={size * 0.1} height={size * 0.06} fill="#505050" stroke="#303030" strokeWidth={size * 0.01} />
          <circle cx={size * 0.67} cy={size * 0.75} r={size * 0.015} fill="#404040" />
          <circle cx={size * 0.73} cy={size * 0.75} r={size * 0.015} fill="#404040" />
          
          {/* Gold ore pile */}
          <polygon points={`${size * 0.68},${size * 0.7} ${size * 0.7},${size * 0.66} ${size * 0.72},${size * 0.7}`} 
                   fill="#8B7D6B" stroke="#6B5D4B" strokeWidth={size * 0.005} />
          {hasNugget && (
            <>
              <circle cx={size * 0.69} cy={size * 0.68} r={size * 0.008} fill="#FFD700" />
              <circle cx={size * 0.71} cy={size * 0.69} r={size * 0.006} fill="#FFD700" />
            </>
          )}
          
          {/* Storage shed */}
          <rect x={size * 0.1} y={size * 0.55} width={size * 0.15} height={size * 0.15} fill="#A0826D" stroke="#806050" strokeWidth={size * 0.01} />
          <polygon points={`${size * 0.08},${size * 0.55} ${size * 0.175},${size * 0.48} ${size * 0.27},${size * 0.55}`} 
                   fill="#8B7355" stroke="#6B5345" strokeWidth={size * 0.01} />
          
          {/* Assay office sign */}
          <rect x={size * 0.12} y={size * 0.58} width={size * 0.11} height={size * 0.04} fill="#F5DEB3" stroke="#8B7355" strokeWidth={size * 0.005} />
          <text x={size * 0.175} y={size * 0.605} fontSize={size * 0.02} fill="#654321" textAnchor="middle" fontFamily="serif">ASSAY</text>
        </>
      )}
    </g>
  );
};

export default GoldMine;