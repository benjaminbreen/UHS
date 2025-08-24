/**
 * components/symbols/mines/DiamondMine.tsx - Diamond mine with security and processing facilities
 */
import React from 'react';

interface DiamondMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const DiamondMine: React.FC<DiamondMineProps> = ({ x, y, size, seed }) => {
  // Variants based on seed
  const isOpenPit = (seed % 3) === 0;
  const hasSecurityFence = (seed % 2) === 0;
  const hasProcessingPlant = (seed % 4) !== 0;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx={size * 0.5} cy={size * 0.88} rx={size * 0.42} ry={size * 0.08} fill="#000" opacity="0.25" />
      
      {isOpenPit ? (
        // Open pit variant (like Big Hole in Kimberley)
        <>
          {/* Pit edges */}
          <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.35} ry={size * 0.25} 
                   fill="none" stroke="#8B7355" strokeWidth={size * 0.03} strokeDasharray={`${size * 0.05} ${size * 0.02}`} />
          
          {/* Pit layers showing depth */}
          <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.3} ry={size * 0.2} fill="#6B5D4B" />
          <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.25} ry={size * 0.15} fill="#5B4D3B" />
          <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.2} ry={size * 0.1} fill="#4B3D2B" />
          <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.15} ry={size * 0.05} fill="#3B2D1B" />
          <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.1} ry={size * 0.025} fill="#000" opacity="0.8" />
          
          {/* Access road spiraling down */}
          <path d={`M ${size * 0.85} ${size * 0.5} Q ${size * 0.7} ${size * 0.45}, ${size * 0.65} ${size * 0.5} T ${size * 0.55} ${size * 0.48}`} 
                stroke="#A0826D" strokeWidth={size * 0.02} fill="none" />
          
          {/* Mining equipment at rim */}
          <rect x={size * 0.08} y={size * 0.35} width={size * 0.08} height={size * 0.06} fill="#FFD700" stroke="#B8860B" strokeWidth={size * 0.01} />
          <rect x={size * 0.1} y={size * 0.33} width={size * 0.04} height={size * 0.03} fill="#B8860B" />
          <circle cx={size * 0.09} cy={size * 0.42} r={size * 0.015} fill="#404040" />
          <circle cx={size * 0.15} cy={size * 0.42} r={size * 0.015} fill="#404040" />
        </>
      ) : (
        // Underground shaft variant
        <>
          {/* Main shaft building */}
          <rect x={size * 0.35} y={size * 0.4} width={size * 0.3} height={size * 0.25} fill="#C0C0C0" stroke="#808080" strokeWidth={size * 0.02} />
          
          {/* Corrugated metal roof */}
          <polygon points={`${size * 0.32},${size * 0.4} ${size * 0.5},${size * 0.32} ${size * 0.68},${size * 0.4}`} 
                   fill="#708090" stroke="#506070" strokeWidth={size * 0.01} />
          {[0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65].map(pos => (
            <line key={pos} x1={size * pos} y1={size * 0.4} x2={size * (pos - 0.03)} y2={size * 0.35} 
                  stroke="#506070" strokeWidth={size * 0.005} opacity="0.5" />
          ))}
          
          {/* Shaft entrance */}
          <rect x={size * 0.45} y={size * 0.55} width={size * 0.1} height={size * 0.1} fill="#000" />
          <rect x={size * 0.44} y={size * 0.54} width={size * 0.12} height={size * 0.02} fill="#606060" />
        </>
      )}
      
      {hasProcessingPlant && (
        <>
          {/* Processing building */}
          <rect x={size * 0.7} y={size * 0.5} width={size * 0.2} height={size * 0.15} fill="#B0B0B0" stroke="#808080" strokeWidth={size * 0.01} />
          <rect x={size * 0.68} y={size * 0.48} width={size * 0.24} height={size * 0.03} fill="#909090" />
          
          {/* Windows */}
          <rect x={size * 0.73} y={size * 0.53} width={size * 0.04} height={size * 0.04} fill="#87CEEB" opacity="0.6" />
          <rect x={size * 0.79} y={size * 0.53} width={size * 0.04} height={size * 0.04} fill="#87CEEB" opacity="0.6" />
          <rect x={size * 0.85} y={size * 0.53} width={size * 0.04} height={size * 0.04} fill="#87CEEB" opacity="0.6" />
          
          {/* Sorting tables visible through window */}
          <rect x={size * 0.74} y={size * 0.55} width={size * 0.02} height={size * 0.01} fill="#4169E1" opacity="0.3" />
        </>
      )}
      
      {hasSecurityFence && (
        <>
          {/* Security fence */}
          <line x1={size * 0.05} y1={size * 0.7} x2={size * 0.95} y2={size * 0.7} stroke="#606060" strokeWidth={size * 0.01} />
          <line x1={size * 0.05} y1={size * 0.73} x2={size * 0.95} y2={size * 0.73} stroke="#606060" strokeWidth={size * 0.01} />
          
          {/* Fence posts */}
          {[0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95].map(pos => (
            <rect key={pos} x={size * (pos - 0.005)} y={size * 0.68} width={size * 0.01} height={size * 0.08} fill="#505050" />
          ))}
          
          {/* Barbed wire effect */}
          <path d={`M ${size * 0.05} ${size * 0.68} L ${size * 0.95} ${size * 0.68}`} 
                stroke="#404040" strokeWidth={size * 0.005} strokeDasharray={`${size * 0.02} ${size * 0.01}`} />
          
          {/* Guard tower */}
          <rect x={size * 0.88} y={size * 0.55} width={size * 0.06} height={size * 0.15} fill="#808080" stroke="#606060" strokeWidth={size * 0.01} />
          <polygon points={`${size * 0.87},${size * 0.55} ${size * 0.91},${size * 0.52} ${size * 0.95},${size * 0.55}`} 
                   fill="#606060" />
          <rect x={size * 0.89} y={size * 0.56} width={size * 0.04} height={size * 0.03} fill="#87CEEB" opacity="0.5" />
          
          {/* Searchlight */}
          <circle cx={size * 0.91} cy={size * 0.53} r={size * 0.015} fill="#FFFF99" opacity="0.7" />
        </>
      )}
      
      {/* Gravel/ore piles */}
      <polygon points={`${size * 0.15},${size * 0.65} ${size * 0.18},${size * 0.6} ${size * 0.22},${size * 0.65}`} 
               fill="#C0B0A0" stroke="#A09080" strokeWidth={size * 0.005} />
      <polygon points={`${size * 0.2},${size * 0.65} ${size * 0.23},${size * 0.61} ${size * 0.26},${size * 0.65}`} 
               fill="#B0A090" stroke="#908070" strokeWidth={size * 0.005} />
      
      {/* Tiny sparkle to suggest diamonds */}
      <g transform={`rotate(45 ${size * 0.21} ${size * 0.62})`}>
        <rect x={size * 0.205} y={size * 0.615} width={size * 0.01} height={size * 0.01} fill="#E0FFFF" opacity="0.9" />
      </g>
      
      {/* Access road */}
      <rect x={size * 0.45} y={size * 0.75} width={size * 0.1} height={size * 0.15} fill="#A0826D" opacity="0.6" />
    </g>
  );
};

export default DiamondMine;