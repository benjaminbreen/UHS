/**
 * KitchenCounterSymbol.tsx
 * Culturally and era-specific kitchen counter for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../types';

interface KitchenCounterSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const KitchenCounterSymbol: React.FC<KitchenCounterSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getCounterStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { surface: '#DEB887', base: '#8B4513', style: 'stone' };
      } else if (culturalZone === 'EUROPEAN') {
        return { surface: '#A9A9A9', base: '#696969', style: 'stone' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { surface: '#8B4513', base: '#654321', style: 'wood' };
      }
      return { surface: '#A9A9A9', base: '#696969', style: 'stone' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { surface: '#8B4513', base: '#654321', style: 'wooden' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { surface: '#F5DEB3', base: '#DEB887', style: 'tiled' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { surface: '#A0522D', base: '#8B4513', style: 'lacquered' };
      }
      return { surface: '#8B4513', base: '#654321', style: 'wooden' };
    }
    
    return { surface: '#F5F5F5', base: '#D3D3D3', style: 'modern' };
  };

  const style = getCounterStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Counter base/legs */}
      <rect x={size * 0.15} y={size * 0.5} width={size * 0.7} height={size * 0.35} fill={style.base} stroke="#3a2317" strokeWidth="1" />
      
      {/* Counter top */}
      <rect x={size * 0.1} y={size * 0.45} width={size * 0.8} height={size * 0.08} fill={style.surface} stroke="#505050" strokeWidth="1" />
      
      {/* Style-specific details */}
      {style.style === 'stone' ? (
        // Ancient stone counter with rough texture
        <>
          <rect x={size * 0.15} y={size * 0.48} width={size * 0.7} height={size * 0.02} fill="#808080" opacity="0.5" />
          {/* Storage niches */}
          <rect x={size * 0.2} y={size * 0.55} width={size * 0.25} height={size * 0.2} fill="#696969" stroke="#505050" strokeWidth="0.5" />
          <rect x={size * 0.55} y={size * 0.55} width={size * 0.25} height={size * 0.2} fill="#696969" stroke="#505050" strokeWidth="0.5" />
        </>
      ) : style.style === 'wooden' ? (
        // Medieval wooden counter with shelves
        <>
          {/* Wood grain */}
          <line x1={size * 0.1} y1={size * 0.47} x2={size * 0.9} y2={size * 0.47} stroke="#654321" strokeWidth="0.5" />
          <line x1={size * 0.1} y1={size * 0.50} x2={size * 0.9} y2={size * 0.50} stroke="#654321" strokeWidth="0.5" />
          {/* Drawers */}
          <rect x={size * 0.2} y={size * 0.55} width={size * 0.25} height={size * 0.12} fill={style.base} stroke="#3a2317" strokeWidth="0.5" />
          <rect x={size * 0.55} y={size * 0.55} width={size * 0.25} height={size * 0.12} fill={style.base} stroke="#3a2317" strokeWidth="0.5" />
          <circle cx={size * 0.325} cy={size * 0.61} r={size * 0.02} fill="#2F4F4F" />
          <circle cx={size * 0.675} cy={size * 0.61} r={size * 0.02} fill="#2F4F4F" />
          {/* Lower shelf */}
          <rect x={size * 0.17} y={size * 0.72} width={size * 0.66} height={size * 0.03} fill={style.base} />
        </>
      ) : style.style === 'tiled' ? (
        // MENA tiled counter
        <>
          {/* Tile pattern on top */}
          <rect x={size * 0.2} y={size * 0.46} width={size * 0.15} height={size * 0.06} fill="#4169E1" opacity="0.3" stroke="#4169E1" strokeWidth="0.5" />
          <rect x={size * 0.35} y={size * 0.46} width={size * 0.15} height={size * 0.06} fill="#FFD700" opacity="0.3" stroke="#FFD700" strokeWidth="0.5" />
          <rect x={size * 0.5} y={size * 0.46} width={size * 0.15} height={size * 0.06} fill="#4169E1" opacity="0.3" stroke="#4169E1" strokeWidth="0.5" />
          <rect x={size * 0.65} y={size * 0.46} width={size * 0.15} height={size * 0.06} fill="#FFD700" opacity="0.3" stroke="#FFD700" strokeWidth="0.5" />
          {/* Arched storage openings */}
          <path d={`M ${size * 0.2} ${size * 0.75} L ${size * 0.2} ${size * 0.6} Q ${size * 0.275} ${size * 0.55}, ${size * 0.35} ${size * 0.6} L ${size * 0.35} ${size * 0.75}`} 
            fill="#8B7355" stroke="#654321" strokeWidth="0.5" />
          <path d={`M ${size * 0.5} ${size * 0.75} L ${size * 0.5} ${size * 0.6} Q ${size * 0.575} ${size * 0.55}, ${size * 0.65} ${size * 0.6} L ${size * 0.65} ${size * 0.75}`} 
            fill="#8B7355" stroke="#654321" strokeWidth="0.5" />
        </>
      ) : style.style === 'lacquered' ? (
        // East Asian lacquered counter
        <>
          <rect x={size * 0.1} y={size * 0.45} width={size * 0.8} height={size * 0.08} fill="#8B0000" opacity="0.3" />
          {/* Decorative edge */}
          <rect x={size * 0.1} y={size * 0.52} width={size * 0.8} height={size * 0.01} fill="#DAA520" />
          {/* Sliding panels */}
          <rect x={size * 0.2} y={size * 0.55} width={size * 0.25} height={size * 0.2} fill={style.base} stroke="#3a2317" strokeWidth="0.5" />
          <line x1={size * 0.325} y1={size * 0.55} x2={size * 0.325} y2={size * 0.75} stroke="#3a2317" strokeWidth="0.5" />
          <rect x={size * 0.55} y={size * 0.55} width={size * 0.25} height={size * 0.2} fill={style.base} stroke="#3a2317" strokeWidth="0.5" />
          <line x1={size * 0.675} y1={size * 0.55} x2={size * 0.675} y2={size * 0.75} stroke="#3a2317" strokeWidth="0.5" />
        </>
      ) : (
        // Modern counter with cabinets
        <>
          {/* Cabinet doors */}
          <rect x={size * 0.18} y={size * 0.54} width={size * 0.28} height={size * 0.25} fill={style.base} stroke="#A9A9A9" strokeWidth="0.5" />
          <rect x={size * 0.52} y={size * 0.54} width={size * 0.28} height={size * 0.25} fill={style.base} stroke="#A9A9A9" strokeWidth="0.5" />
          {/* Handles */}
          <line x1={size * 0.2} y1={size * 0.66} x2={size * 0.25} y2={size * 0.66} stroke="#808080" strokeWidth="1.5" />
          <line x1={size * 0.54} y1={size * 0.66} x2={size * 0.59} y2={size * 0.66} stroke="#808080" strokeWidth="1.5" />
        </>
      )}
      
      {/* Items on counter */}
      <circle cx={size * 0.3} cy={size * 0.42} r={size * 0.03} fill="#8B4513" opacity="0.7" />
      <rect x={size * 0.6} y={size * 0.38} width={size * 0.1} height={size * 0.07} fill="#696969" opacity="0.6" />
    </g>
  );
};