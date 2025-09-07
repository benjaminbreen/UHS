/**
 * ShrineOverlay.tsx - SNES RPG-style shrine overlay
 * Religious and spiritual shrines with cultural variations
 */
import React from 'react';

interface ShrineOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  rotation?: number;
}

const ShrineOverlay: React.FC<ShrineOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  rotation = 0
}) => {
  const getShrineStyle = () => {
    switch (culturalZone) {
      case 'EAST_ASIAN':
        return {
          base: '#8B0000', // Dark red
          roof: '#DC143C', // Crimson
          accent: '#FFD700', // Gold
          type: 'shinto'
        };
      case 'SOUTH_ASIAN':
        return {
          base: '#FF6347', // Tomato
          roof: '#FFD700', // Gold
          accent: '#FF69B4', // Hot pink
          type: 'hindu'
        };
      case 'MENA':
        return {
          base: '#F5DEB3', // Wheat
          roof: '#4169E1', // Royal blue
          accent: '#FFD700', // Gold
          type: 'islamic'
        };
      case 'EUROPEAN':
        return {
          base: '#808080', // Gray stone
          roof: '#A0522D', // Sienna
          accent: '#FFD700', // Gold cross
          type: 'christian'
        };
      default:
        return {
          base: '#8B7355',
          roof: '#654321',
          accent: '#DEB887',
          type: 'simple'
        };
    }
  };
  
  const style = getShrineStyle();
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation} ${size/2} ${size/2})`}>
      {/* Shadow at 45 degrees */}
      <ellipse 
        cx={size * 0.55} 
        cy={size * 0.88} 
        rx={size * 0.25} 
        ry={size * 0.08} 
        fill="#000000" 
        opacity={0.3} 
      />
      
      {/* Base structure */}
      <rect 
        x={size * 0.3} 
        y={size * 0.5} 
        width={size * 0.4} 
        height={size * 0.35} 
        fill={style.base}
        stroke="#000000"
        strokeWidth={0.5}
      />
      
      {style.type === 'shinto' ? (
        <>
          {/* Torii-style roof */}
          <rect x={size * 0.25} y={size * 0.45} width={size * 0.5} height={size * 0.05} fill={style.roof} />
          <path d={`M ${size * 0.28} ${size * 0.45} L ${size * 0.3} ${size * 0.4} L ${size * 0.7} ${size * 0.4} L ${size * 0.72} ${size * 0.45} Z`} fill={style.roof} />
          {/* Sacred rope */}
          <path d={`M ${size * 0.35} ${size * 0.48} Q ${size * 0.5} ${size * 0.46} ${size * 0.65} ${size * 0.48}`} fill="none" stroke="#F5F5DC" strokeWidth={1} />
          {/* Offering box */}
          <rect x={size * 0.42} y={size * 0.7} width={size * 0.16} height={size * 0.1} fill={style.accent} stroke="#000000" strokeWidth={0.3} />
        </>
      ) : style.type === 'hindu' ? (
        <>
          {/* Pyramid roof */}
          <path d={`M ${size * 0.35} ${size * 0.5} L ${size * 0.5} ${size * 0.35} L ${size * 0.65} ${size * 0.5} Z`} fill={style.roof} stroke="#000000" strokeWidth={0.5} />
          {/* Om symbol placeholder */}
          <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.03} fill={style.accent} />
          {/* Deity niche */}
          <rect x={size * 0.43} y={size * 0.6} width={size * 0.14} height={size * 0.15} fill="#000000" opacity={0.3} />
          {/* Offerings platform */}
          <rect x={size * 0.38} y={size * 0.78} width={size * 0.24} height={size * 0.04} fill={style.base} stroke="#000000" strokeWidth={0.3} />
        </>
      ) : style.type === 'christian' ? (
        <>
          {/* Peaked roof */}
          <path d={`M ${size * 0.3} ${size * 0.5} L ${size * 0.5} ${size * 0.38} L ${size * 0.7} ${size * 0.5} Z`} fill={style.roof} stroke="#000000" strokeWidth={0.5} />
          {/* Cross */}
          <rect x={size * 0.48} y={size * 0.28} width={size * 0.04} height={size * 0.12} fill={style.accent} />
          <rect x={size * 0.44} y={size * 0.32} width={size * 0.12} height={size * 0.04} fill={style.accent} />
          {/* Arched doorway */}
          <path d={`M ${size * 0.44} ${size * 0.75} L ${size * 0.44} ${size * 0.65} Q ${size * 0.5} ${size * 0.6} ${size * 0.56} ${size * 0.65} L ${size * 0.56} ${size * 0.75} Z`} fill="#000000" opacity={0.5} />
        </>
      ) : (
        <>
          {/* Simple roof */}
          <rect x={size * 0.28} y={size * 0.47} width={size * 0.44} height={size * 0.06} fill={style.roof} />
          {/* Icon niche */}
          <rect x={size * 0.44} y={size * 0.6} width={size * 0.12} height={size * 0.12} fill="#000000" opacity={0.3} />
          {/* Candles */}
          <circle cx={size * 0.38} cy={size * 0.78} r={size * 0.02} fill="#FFD700" />
          <circle cx={size * 0.62} cy={size * 0.78} r={size * 0.02} fill="#FFD700" />
        </>
      )}
    </g>
  );
};

export default ShrineOverlay;