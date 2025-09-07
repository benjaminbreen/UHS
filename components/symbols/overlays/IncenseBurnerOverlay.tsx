/**
 * IncenseBurnerOverlay.tsx - SNES RPG-style incense burner overlay
 * Censers, thuribles, and incense holders with cultural variations
 */
import React from 'react';

interface IncenseBurnerOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  rotation?: number;
}

const IncenseBurnerOverlay: React.FC<IncenseBurnerOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  rotation = 0
}) => {
  const getBurnerStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        return {
          metal: '#C0C0C0', // Silver
          chain: '#696969', // Dim gray
          smoke: '#E0E0E0',
          type: 'thurible'
        };
      case 'EAST_ASIAN':
        return {
          metal: '#CD7F32', // Bronze
          chain: '#8B4513', // Saddle brown
          smoke: '#F5F5DC',
          type: 'tripod'
        };
      case 'MENA':
      case 'SOUTH_ASIAN':
        return {
          metal: '#B8860B', // Dark goldenrod
          chain: '#DAA520', // Goldenrod
          smoke: '#F0E68C',
          type: 'hanging'
        };
      default:
        return {
          metal: '#808080',
          chain: '#696969',
          smoke: '#D3D3D3',
          type: 'simple'
        };
    }
  };
  
  const style = getBurnerStyle();
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation} ${size/2} ${size/2})`}>
      {/* Shadow */}
      <ellipse 
        cx={size * 0.52} 
        cy={size * 0.82} 
        rx={size * 0.12} 
        ry={size * 0.04} 
        fill="#000000" 
        opacity={0.2} 
      />
      
      {style.type === 'thurible' ? (
        <>
          {/* European thurible/censer with chains */}
          {/* Chains */}
          <line x1={size * 0.5} y1={size * 0.3} x2={size * 0.45} y2={size * 0.55} stroke={style.chain} strokeWidth={1} />
          <line x1={size * 0.5} y1={size * 0.3} x2={size * 0.55} y2={size * 0.55} stroke={style.chain} strokeWidth={1} />
          <line x1={size * 0.5} y1={size * 0.3} x2={size * 0.5} y2={size * 0.55} stroke={style.chain} strokeWidth={1} />
          
          {/* Top cap */}
          <circle cx={size * 0.5} cy={size * 0.3} r={size * 0.02} fill={style.metal} />
          
          {/* Main vessel - ornate design */}
          <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.12} ry={size * 0.15} fill={style.metal} stroke="#000000" strokeWidth={0.5} />
          
          {/* Decorative holes */}
          <circle cx={size * 0.45} cy={size * 0.6} r={size * 0.01} fill="#000000" />
          <circle cx={size * 0.55} cy={size * 0.6} r={size * 0.01} fill="#000000" />
          <circle cx={size * 0.5} cy={size * 0.62} r={size * 0.01} fill="#000000" />
          <circle cx={size * 0.45} cy={size * 0.65} r={size * 0.01} fill="#000000" />
          <circle cx={size * 0.55} cy={size * 0.65} r={size * 0.01} fill="#000000" />
          
          {/* Lid */}
          <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.1} ry={size * 0.03} fill={style.metal} stroke="#000000" strokeWidth={0.5} />
          
          {/* Smoke wisps */}
          <path 
            d={`M ${size * 0.48} ${size * 0.52}
                Q ${size * 0.46} ${size * 0.45} ${size * 0.48} ${size * 0.38}
                Q ${size * 0.5} ${size * 0.32} ${size * 0.48} ${size * 0.25}`}
            fill="none"
            stroke={style.smoke}
            strokeWidth={2}
            opacity={0.4}
          />
          <path 
            d={`M ${size * 0.52} ${size * 0.52}
                Q ${size * 0.54} ${size * 0.45} ${size * 0.52} ${size * 0.38}
                Q ${size * 0.5} ${size * 0.32} ${size * 0.52} ${size * 0.25}`}
            fill="none"
            stroke={style.smoke}
            strokeWidth={2}
            opacity={0.3}
          />
        </>
      ) : style.type === 'tripod' ? (
        <>
          {/* East Asian tripod incense burner */}
          {/* Legs */}
          <line x1={size * 0.45} y1={size * 0.7} x2={size * 0.42} y2={size * 0.78} stroke={style.metal} strokeWidth={2} />
          <line x1={size * 0.55} y1={size * 0.7} x2={size * 0.58} y2={size * 0.78} stroke={style.metal} strokeWidth={2} />
          <line x1={size * 0.5} y1={size * 0.72} x2={size * 0.5} y2={size * 0.78} stroke={style.metal} strokeWidth={2} />
          
          {/* Bowl */}
          <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.15} ry={size * 0.08} fill={style.metal} stroke="#000000" strokeWidth={0.5} />
          
          {/* Handles */}
          <circle cx={size * 0.35} cy={size * 0.63} r={size * 0.02} fill="none" stroke={style.metal} strokeWidth={1} />
          <circle cx={size * 0.65} cy={size * 0.63} r={size * 0.02} fill="none" stroke={style.metal} strokeWidth={1} />
          
          {/* Ash/incense surface */}
          <ellipse cx={size * 0.5} cy={size * 0.63} rx={size * 0.12} ry={size * 0.05} fill="#808080" opacity={0.5} />
          
          {/* Incense sticks */}
          <line x1={size * 0.45} y1={size * 0.62} x2={size * 0.45} y2={size * 0.5} stroke="#8B4513" strokeWidth={1} />
          <line x1={size * 0.5} y1={size * 0.62} x2={size * 0.5} y2={size * 0.48} stroke="#8B4513" strokeWidth={1} />
          <line x1={size * 0.55} y1={size * 0.62} x2={size * 0.55} y2={size * 0.5} stroke="#8B4513" strokeWidth={1} />
          
          {/* Smoke */}
          <circle cx={size * 0.45} cy={size * 0.48} r={size * 0.015} fill={style.smoke} opacity={0.3} />
          <circle cx={size * 0.5} cy={size * 0.46} r={size * 0.015} fill={style.smoke} opacity={0.3} />
          <circle cx={size * 0.55} cy={size * 0.48} r={size * 0.015} fill={style.smoke} opacity={0.3} />
        </>
      ) : style.type === 'hanging' ? (
        <>
          {/* Middle Eastern hanging incense burner */}
          {/* Chain */}
          <line x1={size * 0.5} y1={size * 0.35} x2={size * 0.5} y2={size * 0.5} stroke={style.chain} strokeWidth={1} />
          
          {/* Ornate vessel */}
          <path 
            d={`M ${size * 0.4} ${size * 0.55}
                L ${size * 0.4} ${size * 0.65}
                Q ${size * 0.4} ${size * 0.7} ${size * 0.5} ${size * 0.7}
                Q ${size * 0.6} ${size * 0.7} ${size * 0.6} ${size * 0.65}
                L ${size * 0.6} ${size * 0.55} Z`}
            fill={style.metal}
            stroke="#000000"
            strokeWidth={0.5}
          />
          
          {/* Decorative top */}
          <path 
            d={`M ${size * 0.42} ${size * 0.55}
                Q ${size * 0.5} ${size * 0.5} ${size * 0.58} ${size * 0.55}`}
            fill={style.metal}
            stroke="#000000"
            strokeWidth={0.5}
          />
          
          {/* Perforations */}
          <circle cx={size * 0.45} cy={size * 0.58} r={size * 0.008} fill="#000000" />
          <circle cx={size * 0.5} cy={size * 0.58} r={size * 0.008} fill="#000000" />
          <circle cx={size * 0.55} cy={size * 0.58} r={size * 0.008} fill="#000000" />
          <circle cx={size * 0.45} cy={size * 0.62} r={size * 0.008} fill="#000000" />
          <circle cx={size * 0.55} cy={size * 0.62} r={size * 0.008} fill="#000000" />
          
          {/* Smoke */}
          <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.08} ry={size * 0.12} fill={style.smoke} opacity={0.2} />
        </>
      ) : (
        <>
          {/* Simple burner */}
          <rect x={size * 0.4} y={size * 0.65} width={size * 0.2} height={size * 0.1} fill={style.metal} stroke="#000000" strokeWidth={0.5} />
          <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.08} ry={size * 0.03} fill="#808080" />
          <circle cx={size * 0.5} cy={size * 0.6} r={size * 0.02} fill={style.smoke} opacity={0.3} />
        </>
      )}
    </g>
  );
};

export default IncenseBurnerOverlay;