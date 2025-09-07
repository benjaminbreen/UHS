/**
 * ArchwaySymbol.tsx
 * Culturally and era-specific archway symbol for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface ArchwaySymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const ArchwaySymbol: React.FC<ArchwaySymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getArchStyle = () => {
    // Ancient era arches
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { color: '#DEB887', style: 'rounded', decoration: 'simple' };
      } else if (culturalZone === 'EUROPEAN') {
        return { color: '#A9A9A9', style: 'rounded', decoration: 'roman' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { color: '#8B4513', style: 'squared', decoration: 'beam' };
      }
      return { color: '#A9A9A9', style: 'rounded', decoration: 'simple' };
    }
    
    // Medieval era arches
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { color: '#808080', style: 'pointed', decoration: 'gothic' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { color: '#DEB887', style: 'horseshoe', decoration: 'geometric' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { color: '#A0522D', style: 'squared', decoration: 'ornate' };
      }
      return { color: '#808080', style: 'pointed', decoration: 'simple' };
    }
    
    // Modern era arches
    return { color: '#696969', style: 'rounded', decoration: 'modern' };
  };

  const archStyle = getArchStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Arch pillars */}
      <rect 
        x={size * 0.1} 
        y={size * 0.3} 
        width={size * 0.15} 
        height={size * 0.7}
        fill={archStyle.color}
      />
      <rect 
        x={size * 0.75} 
        y={size * 0.3} 
        width={size * 0.15} 
        height={size * 0.7}
        fill={archStyle.color}
      />
      
      {/* Arch top based on style */}
      {archStyle.style === 'pointed' ? (
        // Gothic pointed arch
        <>
          <path 
            d={`M ${size * 0.25} ${size * 0.3} 
                Q ${size * 0.35} ${size * 0.15}, ${size * 0.5} ${size * 0.05}
                Q ${size * 0.65} ${size * 0.15}, ${size * 0.75} ${size * 0.3}`}
            fill={archStyle.color}
          />
          {archStyle.decoration === 'gothic' && (
            <>
              <line x1={size * 0.3} y1={size * 0.25} x2={size * 0.5} y2={size * 0.1} stroke="#606060" strokeWidth="1" />
              <line x1={size * 0.7} y1={size * 0.25} x2={size * 0.5} y2={size * 0.1} stroke="#606060" strokeWidth="1" />
            </>
          )}
        </>
      ) : archStyle.style === 'horseshoe' ? (
        // Islamic horseshoe arch
        <>
          <path 
            d={`M ${size * 0.25} ${size * 0.35} 
                Q ${size * 0.2} ${size * 0.2}, ${size * 0.3} ${size * 0.1}
                Q ${size * 0.4} ${size * 0.05}, ${size * 0.5} ${size * 0.05}
                Q ${size * 0.6} ${size * 0.05}, ${size * 0.7} ${size * 0.1}
                Q ${size * 0.8} ${size * 0.2}, ${size * 0.75} ${size * 0.35}`}
            fill={archStyle.color}
          />
          {archStyle.decoration === 'geometric' && (
            <>
              <polygon 
                points={`${size * 0.5},${size * 0.15} ${size * 0.55},${size * 0.2} ${size * 0.5},${size * 0.25} ${size * 0.45},${size * 0.2}`}
                fill="none" 
                stroke="#B8860B" 
                strokeWidth="0.5"
              />
            </>
          )}
        </>
      ) : archStyle.style === 'squared' ? (
        // East Asian squared arch/gate
        <>
          <rect 
            x={size * 0.1} 
            y={size * 0.05} 
            width={size * 0.8} 
            height={size * 0.25}
            fill={archStyle.color}
          />
          {archStyle.decoration === 'beam' && (
            <>
              <rect x={size * 0.05} y={size * 0.02} width={size * 0.9} height={size * 0.06} fill="#654321" />
              <rect x={size * 0.08} y={size * 0.28} width={size * 0.84} height={size * 0.04} fill="#654321" />
            </>
          )}
          {archStyle.decoration === 'ornate' && (
            <>
              <rect x={size * 0.45} y={size * 0.1} width={size * 0.1} height={size * 0.15} fill="#8B0000" />
              <line x1={size * 0.3} y1={size * 0.15} x2={size * 0.7} y2={size * 0.15} stroke="#8B0000" strokeWidth="1" />
            </>
          )}
        </>
      ) : (
        // Default rounded arch (Roman style)
        <>
          <ellipse 
            cx={size * 0.5} 
            cy={size * 0.3} 
            rx={size * 0.25} 
            ry={size * 0.25}
            fill={archStyle.color}
          />
          <rect 
            x={size * 0.25} 
            y={size * 0.3} 
            width={size * 0.5} 
            height={size * 0.1}
            fill={archStyle.color}
          />
          {archStyle.decoration === 'roman' && (
            <>
              <circle cx={size * 0.35} cy={size * 0.2} r={size * 0.02} fill="#808080" />
              <circle cx={size * 0.5} cy={size * 0.15} r={size * 0.02} fill="#808080" />
              <circle cx={size * 0.65} cy={size * 0.2} r={size * 0.02} fill="#808080" />
            </>
          )}
        </>
      )}
      
      {/* Floor threshold */}
      <rect 
        x={size * 0.25} 
        y={size * 0.95} 
        width={size * 0.5} 
        height={size * 0.05}
        fill="#696969"
        opacity="0.5"
      />
    </g>
  );
};