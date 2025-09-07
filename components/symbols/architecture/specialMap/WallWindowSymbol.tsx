/**
 * WallWindowSymbol.tsx
 * Wall with window opening for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface WallWindowSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const WallWindowSymbol: React.FC<WallWindowSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getWallStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { wall: '#DEB887', frame: '#8B4513', style: 'arched' };
      } else if (culturalZone === 'EUROPEAN') {
        return { wall: '#A9A9A9', frame: '#696969', style: 'small' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { wall: '#8B7355', frame: '#654321', style: 'lattice' };
      }
      return { wall: '#A9A9A9', frame: '#696969', style: 'small' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { wall: '#808080', frame: '#4B3621', style: 'gothic' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { wall: '#DEB887', frame: '#8B4513', style: 'geometric' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { wall: '#8B7355', frame: '#654321', style: 'paper' };
      }
      return { wall: '#808080', frame: '#4B3621', style: 'arched' };
    }
    
    return { wall: '#696969', frame: '#2F4F4F', style: 'modern' };
  };

  const style = getWallStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Wall background */}
      <rect 
        x={0} 
        y={0} 
        width={size} 
        height={size}
        fill={style.wall}
      />
      
      {/* Window opening based on style */}
      {style.style === 'gothic' ? (
        // Gothic pointed window
        <>
          <path 
            d={`M ${size * 0.35} ${size * 0.5} 
                L ${size * 0.35} ${size * 0.35}
                Q ${size * 0.4} ${size * 0.25}, ${size * 0.5} ${size * 0.2}
                Q ${size * 0.6} ${size * 0.25}, ${size * 0.65} ${size * 0.35}
                L ${size * 0.65} ${size * 0.5}
                Z`}
            fill="#87CEEB"
            opacity="0.7"
            stroke={style.frame}
            strokeWidth="2"
          />
          <line x1={size * 0.5} y1={size * 0.2} x2={size * 0.5} y2={size * 0.5} stroke={style.frame} strokeWidth="1" />
        </>
      ) : style.style === 'arched' ? (
        // Arched window
        <>
          <ellipse 
            cx={size * 0.5} 
            cy={size * 0.35} 
            rx={size * 0.15} 
            ry={size * 0.15}
            fill="#87CEEB"
            opacity="0.7"
            stroke={style.frame}
            strokeWidth="2"
          />
          <rect 
            x={size * 0.35} 
            y={size * 0.35} 
            width={size * 0.3} 
            height={size * 0.15}
            fill="#87CEEB"
            opacity="0.7"
          />
          <rect 
            x={size * 0.35} 
            y={size * 0.35} 
            width={size * 0.3} 
            height={size * 0.15}
            fill="none"
            stroke={style.frame}
            strokeWidth="2"
          />
        </>
      ) : style.style === 'lattice' ? (
        // East Asian lattice window
        <>
          <rect 
            x={size * 0.3} 
            y={size * 0.25} 
            width={size * 0.4} 
            height={size * 0.35}
            fill="#F5DEB3"
            opacity="0.8"
            stroke={style.frame}
            strokeWidth="2"
          />
          {/* Lattice pattern */}
          <line x1={size * 0.4} y1={size * 0.25} x2={size * 0.4} y2={size * 0.6} stroke={style.frame} strokeWidth="0.5" />
          <line x1={size * 0.5} y1={size * 0.25} x2={size * 0.5} y2={size * 0.6} stroke={style.frame} strokeWidth="0.5" />
          <line x1={size * 0.6} y1={size * 0.25} x2={size * 0.6} y2={size * 0.6} stroke={style.frame} strokeWidth="0.5" />
          <line x1={size * 0.3} y1={size * 0.35} x2={size * 0.7} y2={size * 0.35} stroke={style.frame} strokeWidth="0.5" />
          <line x1={size * 0.3} y1={size * 0.45} x2={size * 0.7} y2={size * 0.45} stroke={style.frame} strokeWidth="0.5" />
        </>
      ) : style.style === 'geometric' ? (
        // Islamic geometric window
        <>
          <polygon 
            points={`${size * 0.5},${size * 0.2} ${size * 0.65},${size * 0.35} ${size * 0.65},${size * 0.55} ${size * 0.5},${size * 0.7} ${size * 0.35},${size * 0.55} ${size * 0.35},${size * 0.35}`}
            fill="#87CEEB"
            opacity="0.7"
            stroke={style.frame}
            strokeWidth="2"
          />
          <polygon 
            points={`${size * 0.5},${size * 0.35} ${size * 0.55},${size * 0.4} ${size * 0.55},${size * 0.5} ${size * 0.5},${size * 0.55} ${size * 0.45},${size * 0.5} ${size * 0.45},${size * 0.4}`}
            fill="none"
            stroke={style.frame}
            strokeWidth="1"
          />
        </>
      ) : style.style === 'paper' ? (
        // East Asian paper window
        <>
          <rect 
            x={size * 0.25} 
            y={size * 0.2} 
            width={size * 0.5} 
            height={size * 0.45}
            fill="#FFF8DC"
            opacity="0.9"
            stroke={style.frame}
            strokeWidth="2"
          />
          <line x1={size * 0.25} y1={size * 0.425} x2={size * 0.75} y2={size * 0.425} stroke={style.frame} strokeWidth="1" />
          <line x1={size * 0.5} y1={size * 0.2} x2={size * 0.5} y2={size * 0.65} stroke={style.frame} strokeWidth="1" />
        </>
      ) : (
        // Default/modern rectangular window
        <>
          <rect 
            x={size * 0.3} 
            y={size * 0.25} 
            width={size * 0.4} 
            height={size * 0.35}
            fill="#87CEEB"
            opacity="0.8"
            stroke={style.frame}
            strokeWidth="2"
          />
          <line x1={size * 0.5} y1={size * 0.25} x2={size * 0.5} y2={size * 0.6} stroke={style.frame} strokeWidth="1" />
          <line x1={size * 0.3} y1={size * 0.425} x2={size * 0.7} y2={size * 0.425} stroke={style.frame} strokeWidth="1" />
        </>
      )}
      
      {/* Window sill */}
      <rect 
        x={size * 0.25} 
        y={size * 0.6} 
        width={size * 0.5} 
        height={size * 0.05}
        fill={style.frame}
      />
    </g>
  );
};