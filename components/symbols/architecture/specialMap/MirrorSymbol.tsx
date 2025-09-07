/**
 * MirrorSymbol.tsx
 * Culturally and era-specific mirror symbol for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface MirrorSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const MirrorSymbol: React.FC<MirrorSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getMirrorStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { frame: '#CD853F', glass: '#F0E68C', style: 'bronze' };
      } else if (culturalZone === 'EUROPEAN') {
        return { frame: '#B87333', glass: '#F5DEB3', style: 'polished' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { frame: '#8B4513', glass: '#FAFAD2', style: 'bronze' };
      }
      return { frame: '#B87333', glass: '#F5DEB3', style: 'polished' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { frame: '#8B4513', glass: '#E6E6FA', style: 'ornate' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { frame: '#DAA520', glass: '#F0F8FF', style: 'geometric' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { frame: '#A0522D', glass: '#F8F8FF', style: 'round' };
      }
      return { frame: '#8B4513', glass: '#E6E6FA', style: 'simple' };
    }
    
    return { frame: '#C0C0C0', glass: '#F0FFFF', style: 'modern' };
  };

  const style = getMirrorStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {style.style === 'bronze' ? (
        // Ancient bronze mirror (handheld style)
        <>
          <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.2} fill={style.frame} stroke="#8B4513" strokeWidth="1" />
          <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.17} fill={style.glass} opacity="0.9" />
          {/* Reflection effect */}
          <ellipse cx={size * 0.45} cy={size * 0.35} rx={size * 0.05} ry={size * 0.08} fill="#FFFFFF" opacity="0.4" />
          {/* Handle */}
          <rect x={size * 0.47} y={size * 0.6} width={size * 0.06} height={size * 0.25} fill={style.frame} />
          <ellipse cx={size * 0.5} cy={size * 0.85} rx={size * 0.05} ry={size * 0.03} fill={style.frame} />
        </>
      ) : style.style === 'ornate' ? (
        // Medieval ornate wall mirror
        <>
          <rect x={size * 0.3} y={size * 0.15} width={size * 0.4} height={size * 0.6} fill={style.frame} stroke="#654321" strokeWidth="1" />
          <rect x={size * 0.35} y={size * 0.2} width={size * 0.3} height={size * 0.5} fill={style.glass} />
          {/* Decorative corners */}
          <circle cx={size * 0.3} cy={size * 0.15} r={size * 0.03} fill="#DAA520" />
          <circle cx={size * 0.7} cy={size * 0.15} r={size * 0.03} fill="#DAA520" />
          <circle cx={size * 0.3} cy={size * 0.75} r={size * 0.03} fill="#DAA520" />
          <circle cx={size * 0.7} cy={size * 0.75} r={size * 0.03} fill="#DAA520" />
          {/* Reflection */}
          <rect x={size * 0.38} y={size * 0.25} width={size * 0.08} height={size * 0.35} fill="#FFFFFF" opacity="0.3" />
        </>
      ) : style.style === 'geometric' ? (
        // Islamic geometric mirror
        <>
          <polygon 
            points={`${size * 0.5},${size * 0.1} ${size * 0.75},${size * 0.35} ${size * 0.75},${size * 0.65} ${size * 0.5},${size * 0.9} ${size * 0.25},${size * 0.65} ${size * 0.25},${size * 0.35}`}
            fill={style.frame}
            stroke="#B8860B"
            strokeWidth="1"
          />
          <polygon 
            points={`${size * 0.5},${size * 0.2} ${size * 0.65},${size * 0.35} ${size * 0.65},${size * 0.65} ${size * 0.5},${size * 0.8} ${size * 0.35},${size * 0.65} ${size * 0.35},${size * 0.35}`}
            fill={style.glass}
          />
          {/* Inner pattern */}
          <polygon 
            points={`${size * 0.5},${size * 0.4} ${size * 0.55},${size * 0.45} ${size * 0.55},${size * 0.55} ${size * 0.5},${size * 0.6} ${size * 0.45},${size * 0.55} ${size * 0.45},${size * 0.45}`}
            fill="none"
            stroke="#DAA520"
            strokeWidth="0.5"
          />
          {/* Reflection */}
          <ellipse cx={size * 0.47} cy={size * 0.4} rx={size * 0.04} ry={size * 0.08} fill="#FFFFFF" opacity="0.4" />
        </>
      ) : style.style === 'round' ? (
        // East Asian round mirror
        <>
          <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.25} fill={style.frame} stroke="#654321" strokeWidth="1" />
          <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.2} fill={style.glass} />
          {/* Traditional pattern on frame */}
          <circle cx={size * 0.5} cy={size * 0.25} r={size * 0.02} fill="#8B0000" />
          <circle cx={size * 0.5} cy={size * 0.65} r={size * 0.02} fill="#8B0000" />
          <circle cx={size * 0.3} cy={size * 0.45} r={size * 0.02} fill="#8B0000" />
          <circle cx={size * 0.7} cy={size * 0.45} r={size * 0.02} fill="#8B0000" />
          {/* Stand */}
          <rect x={size * 0.48} y={size * 0.7} width={size * 0.04} height={size * 0.15} fill={style.frame} />
          <rect x={size * 0.4} y={size * 0.85} width={size * 0.2} height={size * 0.03} fill={style.frame} />
          {/* Reflection */}
          <ellipse cx={size * 0.45} cy={size * 0.4} rx={size * 0.05} ry={size * 0.1} fill="#FFFFFF" opacity="0.3" />
        </>
      ) : style.style === 'polished' ? (
        // Ancient polished metal mirror
        <>
          <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.18} ry={size * 0.25} fill={style.frame} stroke="#8B4513" strokeWidth="1" />
          <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.14} ry={size * 0.2} fill={style.glass} opacity="0.95" />
          {/* Distorted reflection effect */}
          <path d={`M ${size * 0.42} ${size * 0.35} Q ${size * 0.45} ${size * 0.4}, ${size * 0.42} ${size * 0.5}`} stroke="#FFFFFF" strokeWidth="2" opacity="0.3" fill="none" />
          {/* Simple handle */}
          <rect x={size * 0.48} y={size * 0.7} width={size * 0.04} height={size * 0.15} fill={style.frame} />
        </>
      ) : (
        // Modern rectangular mirror
        <>
          <rect x={size * 0.3} y={size * 0.15} width={size * 0.4} height={size * 0.7} fill={style.frame} stroke="#A9A9A9" strokeWidth="1" />
          <rect x={size * 0.33} y={size * 0.18} width={size * 0.34} height={size * 0.64} fill={style.glass} />
          {/* Clean reflection */}
          <rect x={size * 0.35} y={size * 0.2} width={size * 0.06} height={size * 0.5} fill="#FFFFFF" opacity="0.25" />
          <rect x={size * 0.43} y={size * 0.25} width={size * 0.03} height={size * 0.3} fill="#FFFFFF" opacity="0.15" />
        </>
      )}
    </g>
  );
};