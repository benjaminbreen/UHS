/**
 * BenchSymbol.tsx
 * Culturally and era-specific bench symbol for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../types';

interface BenchSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const BenchSymbol: React.FC<BenchSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getBenchStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { seat: '#DEB887', legs: '#8B4513', style: 'stone_slab' };
      } else if (culturalZone === 'EUROPEAN') {
        return { seat: '#A9A9A9', legs: '#696969', style: 'stone' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { seat: '#8B4513', legs: '#654321', style: 'low_wooden' };
      }
      return { seat: '#8B4513', legs: '#654321', style: 'simple' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { seat: '#654321', legs: '#4B3621', style: 'wooden_back' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { seat: '#F5DEB3', legs: '#DEB887', style: 'cushioned' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { seat: '#A0522D', legs: '#8B4513', style: 'meditation' };
      }
      return { seat: '#654321', legs: '#4B3621', style: 'wooden' };
    }
    
    return { seat: '#8B6F47', legs: '#708090', style: 'modern' };
  };

  const style = getBenchStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {style.style === 'stone_slab' ? (
        // Ancient stone slab bench
        <>
          <rect x={size * 0.15} y={size * 0.55} width={size * 0.7} height={size * 0.12} fill={style.seat} stroke="#8B7355" strokeWidth="1" />
          {/* Support pillars */}
          <rect x={size * 0.2} y={size * 0.67} width={size * 0.12} height={size * 0.2} fill={style.legs} />
          <rect x={size * 0.68} y={size * 0.67} width={size * 0.12} height={size * 0.2} fill={style.legs} />
          {/* Stone texture */}
          <line x1={size * 0.15} y1={size * 0.6} x2={size * 0.85} y2={size * 0.6} stroke="#A0522D" strokeWidth="0.5" opacity="0.5" />
        </>
      ) : style.style === 'low_wooden' ? (
        // East Asian low wooden bench
        <>
          <rect x={size * 0.1} y={size * 0.6} width={size * 0.8} height={size * 0.08} fill={style.seat} stroke="#654321" strokeWidth="1" />
          {/* Short legs */}
          <rect x={size * 0.15} y={size * 0.68} width={size * 0.05} height={size * 0.12} fill={style.legs} />
          <rect x={size * 0.8} y={size * 0.68} width={size * 0.05} height={size * 0.12} fill={style.legs} />
          {/* Wood grain */}
          <line x1={size * 0.15} y1={size * 0.63} x2={size * 0.85} y2={size * 0.63} stroke="#8B4513" strokeWidth="0.3" />
          <line x1={size * 0.15} y1={size * 0.65} x2={size * 0.85} y2={size * 0.65} stroke="#8B4513" strokeWidth="0.3" />
          {/* Decorative edge */}
          <rect x={size * 0.1} y={size * 0.58} width={size * 0.8} height={size * 0.02} fill="#8B0000" opacity="0.3" />
        </>
      ) : style.style === 'wooden_back' ? (
        // Medieval wooden bench with backrest
        <>
          {/* Backrest */}
          <rect x={size * 0.15} y={size * 0.35} width={size * 0.7} height={size * 0.25} fill={style.seat} stroke="#3a2317" strokeWidth="1" />
          {/* Vertical slats */}
          <line x1={size * 0.25} y1={size * 0.35} x2={size * 0.25} y2={size * 0.6} stroke="#3a2317" strokeWidth="0.5" />
          <line x1={size * 0.35} y1={size * 0.35} x2={size * 0.35} y2={size * 0.6} stroke="#3a2317" strokeWidth="0.5" />
          <line x1={size * 0.45} y1={size * 0.35} x2={size * 0.45} y2={size * 0.6} stroke="#3a2317" strokeWidth="0.5" />
          <line x1={size * 0.55} y1={size * 0.35} x2={size * 0.55} y2={size * 0.6} stroke="#3a2317" strokeWidth="0.5" />
          <line x1={size * 0.65} y1={size * 0.35} x2={size * 0.65} y2={size * 0.6} stroke="#3a2317" strokeWidth="0.5" />
          <line x1={size * 0.75} y1={size * 0.35} x2={size * 0.75} y2={size * 0.6} stroke="#3a2317" strokeWidth="0.5" />
          {/* Seat */}
          <rect x={size * 0.15} y={size * 0.6} width={size * 0.7} height={size * 0.08} fill={style.seat} stroke="#3a2317" strokeWidth="1" />
          {/* Legs */}
          <rect x={size * 0.18} y={size * 0.68} width={size * 0.06} height={size * 0.17} fill={style.legs} />
          <rect x={size * 0.76} y={size * 0.68} width={size * 0.06} height={size * 0.17} fill={style.legs} />
          {/* Armrests */}
          <rect x={size * 0.13} y={size * 0.48} width={size * 0.03} height={size * 0.15} fill={style.seat} />
          <rect x={size * 0.84} y={size * 0.48} width={size * 0.03} height={size * 0.15} fill={style.seat} />
        </>
      ) : style.style === 'cushioned' ? (
        // MENA cushioned bench
        <>
          {/* Base */}
          <rect x={size * 0.15} y={size * 0.65} width={size * 0.7} height={size * 0.15} fill={style.legs} stroke="#B8860B" strokeWidth="1" />
          {/* Cushions */}
          <ellipse cx={size * 0.3} cy={size * 0.62} rx={size * 0.12} ry={size * 0.08} fill="#DC143C" opacity="0.8" />
          <ellipse cx={size * 0.5} cy={size * 0.62} rx={size * 0.12} ry={size * 0.08} fill="#4169E1" opacity="0.8" />
          <ellipse cx={size * 0.7} cy={size * 0.62} rx={size * 0.12} ry={size * 0.08} fill="#FFD700" opacity="0.8" />
          {/* Decorative pattern on base */}
          <polygon points={`${size * 0.3},${size * 0.7} ${size * 0.35},${size * 0.72} ${size * 0.3},${size * 0.74} ${size * 0.25},${size * 0.72}`} 
            fill="#DAA520" opacity="0.6" />
          <polygon points={`${size * 0.5},${size * 0.7} ${size * 0.55},${size * 0.72} ${size * 0.5},${size * 0.74} ${size * 0.45},${size * 0.72}`} 
            fill="#DAA520" opacity="0.6" />
          <polygon points={`${size * 0.7},${size * 0.7} ${size * 0.75},${size * 0.72} ${size * 0.7},${size * 0.74} ${size * 0.65},${size * 0.72}`} 
            fill="#DAA520" opacity="0.6" />
        </>
      ) : style.style === 'meditation' ? (
        // East Asian meditation bench
        <>
          {/* Low platform */}
          <rect x={size * 0.1} y={size * 0.65} width={size * 0.8} height={size * 0.1} fill={style.seat} stroke="#8B4513" strokeWidth="1" />
          {/* Curved legs */}
          <path d={`M ${size * 0.15} ${size * 0.75} Q ${size * 0.13} ${size * 0.82}, ${size * 0.18} ${size * 0.85}`} 
            stroke={style.legs} strokeWidth="3" fill="none" />
          <path d={`M ${size * 0.85} ${size * 0.75} Q ${size * 0.87} ${size * 0.82}, ${size * 0.82} ${size * 0.85}`} 
            stroke={style.legs} strokeWidth="3" fill="none" />
          {/* Woven mat texture */}
          <rect x={size * 0.15} y={size * 0.62} width={size * 0.7} height={size * 0.03} fill="#D2691E" opacity="0.7" />
          <line x1={size * 0.25} y1={size * 0.62} x2={size * 0.25} y2={size * 0.65} stroke="#A0522D" strokeWidth="0.5" />
          <line x1={size * 0.4} y1={size * 0.62} x2={size * 0.4} y2={size * 0.65} stroke="#A0522D" strokeWidth="0.5" />
          <line x1={size * 0.55} y1={size * 0.62} x2={size * 0.55} y2={size * 0.65} stroke="#A0522D" strokeWidth="0.5" />
          <line x1={size * 0.7} y1={size * 0.62} x2={size * 0.7} y2={size * 0.65} stroke="#A0522D" strokeWidth="0.5" />
        </>
      ) : (
        // Default simple bench
        <>
          <rect x={size * 0.15} y={size * 0.6} width={size * 0.7} height={size * 0.08} fill={style.seat} stroke="#505050" strokeWidth="1" />
          {/* Legs */}
          <rect x={size * 0.2} y={size * 0.68} width={size * 0.05} height={size * 0.15} fill={style.legs} />
          <rect x={size * 0.75} y={size * 0.68} width={size * 0.05} height={size * 0.15} fill={style.legs} />
          {/* Support bar */}
          <rect x={size * 0.2} y={size * 0.75} width={size * 0.6} height={size * 0.02} fill={style.legs} />
        </>
      )}
    </g>
  );
};