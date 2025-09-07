/**
 * BathSymbol.tsx
 * Culturally and era-specific bath/bathing fixture for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface BathSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const BathSymbol: React.FC<BathSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getBathStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { tub: '#DEB887', water: '#4682B4', style: 'pool' };
      } else if (culturalZone === 'EUROPEAN') {
        return { tub: '#A9A9A9', water: '#5F9EA0', style: 'roman' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { tub: '#8B4513', water: '#6495ED', style: 'wooden' };
      }
      return { tub: '#A9A9A9', water: '#5F9EA0', style: 'basin' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { tub: '#8B4513', water: '#4682B4', style: 'barrel' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { tub: '#F5DEB3', water: '#4682B4', style: 'hammam' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { tub: '#A0522D', water: '#87CEEB', style: 'ofuro' };
      }
      return { tub: '#8B4513', water: '#4682B4', style: 'barrel' };
    }
    
    return { tub: '#F8F8FF', water: '#B0E0E6', style: 'modern' };
  };

  const style = getBathStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {style.style === 'roman' ? (
        // Roman-style sunken bath
        <>
          <rect x={size * 0.15} y={size * 0.3} width={size * 0.7} height={size * 0.5} fill={style.tub} stroke="#696969" strokeWidth="1" />
          <rect x={size * 0.2} y={size * 0.35} width={size * 0.6} height={size * 0.4} fill={style.water} opacity="0.8" />
          {/* Steps */}
          <rect x={size * 0.15} y={size * 0.35} width={size * 0.08} height={size * 0.1} fill="#808080" />
          <rect x={size * 0.15} y={size * 0.45} width={size * 0.08} height={size * 0.1} fill="#808080" />
          {/* Decorative edge */}
          <rect x={size * 0.15} y={size * 0.28} width={size * 0.7} height={size * 0.03} fill="#D3D3D3" />
        </>
      ) : style.style === 'pool' ? (
        // MENA-style bathing pool
        <>
          <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.35} ry={size * 0.25} fill={style.tub} stroke="#B8860B" strokeWidth="1" />
          <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.3} ry={size * 0.2} fill={style.water} opacity="0.8" />
          {/* Decorative tiles */}
          <rect x={size * 0.45} y={size * 0.25} width={size * 0.1} height={size * 0.05} fill="#4169E1" opacity="0.6" />
          <rect x={size * 0.35} y={size * 0.28} width={size * 0.08} height={size * 0.04} fill="#FFD700" opacity="0.6" />
          <rect x={size * 0.57} y={size * 0.28} width={size * 0.08} height={size * 0.04} fill="#FFD700" opacity="0.6" />
        </>
      ) : style.style === 'wooden' ? (
        // East Asian wooden tub
        <>
          <rect x={size * 0.25} y={size * 0.4} width={size * 0.5} height={size * 0.4} fill={style.tub} stroke="#654321" strokeWidth="1" />
          <rect x={size * 0.3} y={size * 0.45} width={size * 0.4} height={size * 0.3} fill={style.water} opacity="0.8" />
          {/* Wood grain */}
          <line x1={size * 0.25} y1={size * 0.5} x2={size * 0.75} y2={size * 0.5} stroke="#654321" strokeWidth="0.5" />
          <line x1={size * 0.25} y1={size * 0.6} x2={size * 0.75} y2={size * 0.6} stroke="#654321" strokeWidth="0.5" />
          <line x1={size * 0.25} y1={size * 0.7} x2={size * 0.75} y2={size * 0.7} stroke="#654321" strokeWidth="0.5" />
          {/* Metal bands */}
          <rect x={size * 0.25} y={size * 0.42} width={size * 0.5} height={size * 0.02} fill="#696969" />
          <rect x={size * 0.25} y={size * 0.76} width={size * 0.5} height={size * 0.02} fill="#696969" />
        </>
      ) : style.style === 'barrel' ? (
        // Medieval barrel bath
        <>
          <ellipse cx={size * 0.5} cy={size * 0.75} rx={size * 0.25} ry={size * 0.08} fill={style.tub} stroke="#654321" strokeWidth="1" />
          <rect x={size * 0.25} y={size * 0.4} width={size * 0.5} height={size * 0.35} fill={style.tub} stroke="#654321" strokeWidth="1" />
          <ellipse cx={size * 0.5} cy={size * 0.4} rx={size * 0.25} ry={size * 0.08} fill={style.tub} stroke="#654321" strokeWidth="1" />
          <ellipse cx={size * 0.5} cy={size * 0.4} rx={size * 0.22} ry={size * 0.06} fill={style.water} opacity="0.8" />
          {/* Barrel staves */}
          <line x1={size * 0.35} y1={size * 0.4} x2={size * 0.35} y2={size * 0.75} stroke="#654321" strokeWidth="0.5" />
          <line x1={size * 0.45} y1={size * 0.4} x2={size * 0.45} y2={size * 0.75} stroke="#654321" strokeWidth="0.5" />
          <line x1={size * 0.55} y1={size * 0.4} x2={size * 0.55} y2={size * 0.75} stroke="#654321" strokeWidth="0.5" />
          <line x1={size * 0.65} y1={size * 0.4} x2={size * 0.65} y2={size * 0.75} stroke="#654321" strokeWidth="0.5" />
          {/* Metal hoops */}
          <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.26} ry={size * 0.08} fill="none" stroke="#2F4F4F" strokeWidth="1" />
          <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.26} ry={size * 0.08} fill="none" stroke="#2F4F4F" strokeWidth="1" />
        </>
      ) : style.style === 'hammam' ? (
        // MENA hammam-style bath
        <>
          <rect x={size * 0.2} y={size * 0.35} width={size * 0.6} height={size * 0.45} rx={size * 0.05} fill={style.tub} stroke="#D2B48C" strokeWidth="1" />
          <rect x={size * 0.25} y={size * 0.4} width={size * 0.5} height={size * 0.35} rx={size * 0.03} fill={style.water} opacity="0.8" />
          {/* Geometric decoration */}
          <polygon points={`${size * 0.5},${size * 0.3} ${size * 0.55},${size * 0.33} ${size * 0.5},${size * 0.36} ${size * 0.45},${size * 0.33}`} fill="#4169E1" opacity="0.6" />
          {/* Drain */}
          <circle cx={size * 0.5} cy={size * 0.7} r={size * 0.02} fill="#2F4F4F" />
        </>
      ) : style.style === 'ofuro' ? (
        // Japanese ofuro bath
        <>
          <rect x={size * 0.2} y={size * 0.35} width={size * 0.6} height={size * 0.5} fill={style.tub} stroke="#8B4513" strokeWidth="1" />
          <rect x={size * 0.25} y={size * 0.4} width={size * 0.5} height={size * 0.4} fill={style.water} opacity="0.8" />
          {/* Wooden seat inside */}
          <rect x={size * 0.3} y={size * 0.7} width={size * 0.4} height={size * 0.05} fill="#A0522D" />
          {/* Cover board */}
          <rect x={size * 0.18} y={size * 0.33} width={size * 0.64} height={size * 0.03} fill="#D2691E" />
        </>
      ) : (
        // Modern bathtub
        <>
          <rect x={size * 0.2} y={size * 0.35} width={size * 0.6} height={size * 0.4} rx={size * 0.05} fill={style.tub} stroke="#DCDCDC" strokeWidth="1" />
          <rect x={size * 0.25} y={size * 0.4} width={size * 0.5} height={size * 0.3} rx={size * 0.03} fill={style.water} opacity="0.8" />
          {/* Faucet */}
          <circle cx={size * 0.25} cy={size * 0.33} r={size * 0.03} fill="#C0C0C0" />
          <rect x={size * 0.23} y={size * 0.3} width={size * 0.04} height={size * 0.05} fill="#C0C0C0" />
        </>
      )}
    </g>
  );
};