/**
 * CabinetSymbol.tsx
 * Culturally and era-specific cabinet/storage symbol for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../types';

interface CabinetSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const CabinetSymbol: React.FC<CabinetSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getCabinetStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { wood: '#8B4513', metal: '#CD853F', style: 'carved' };
      } else if (culturalZone === 'EUROPEAN') {
        return { wood: '#654321', metal: '#696969', style: 'simple' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { wood: '#A0522D', metal: '#B87333', style: 'lacquered' };
      }
      return { wood: '#8B4513', metal: '#696969', style: 'simple' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { wood: '#654321', metal: '#2F4F4F', style: 'ornate' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { wood: '#A0522D', metal: '#DAA520', style: 'inlaid' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { wood: '#8B4513', metal: '#B87333', style: 'tiered' };
      }
      return { wood: '#654321', metal: '#696969', style: 'ornate' };
    }
    
    return { wood: '#8B6F47', metal: '#708090', style: 'modern' };
  };

  const style = getCabinetStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Cabinet body */}
      <rect 
        x={size * 0.2} 
        y={size * 0.15} 
        width={size * 0.6} 
        height={size * 0.7}
        fill={style.wood}
        stroke="#3a2317"
        strokeWidth="1"
      />
      
      {/* Cabinet top */}
      <rect 
        x={size * 0.15} 
        y={size * 0.1} 
        width={size * 0.7} 
        height={size * 0.08}
        fill={style.wood}
        stroke="#3a2317"
        strokeWidth="1"
      />
      
      {/* Style-specific decorations */}
      {style.style === 'lacquered' ? (
        // East Asian lacquered cabinet with multiple drawers
        <>
          <rect x={size * 0.25} y={size * 0.25} width={size * 0.5} height={size * 0.15} fill="#8B0000" stroke="#3a2317" strokeWidth="0.5" />
          <rect x={size * 0.25} y={size * 0.45} width={size * 0.5} height={size * 0.15} fill="#8B0000" stroke="#3a2317" strokeWidth="0.5" />
          <rect x={size * 0.25} y={size * 0.65} width={size * 0.5} height={size * 0.15} fill="#8B0000" stroke="#3a2317" strokeWidth="0.5" />
          {/* Handles */}
          <circle cx={size * 0.5} cy={size * 0.325} r={size * 0.03} fill={style.metal} />
          <circle cx={size * 0.5} cy={size * 0.525} r={size * 0.03} fill={style.metal} />
          <circle cx={size * 0.5} cy={size * 0.725} r={size * 0.03} fill={style.metal} />
        </>
      ) : style.style === 'inlaid' ? (
        // MENA inlaid cabinet with geometric patterns
        <>
          <rect x={size * 0.25} y={size * 0.25} width={size * 0.5} height={size * 0.5} fill={style.wood} stroke="#3a2317" strokeWidth="0.5" />
          <polygon 
            points={`${size * 0.5},${size * 0.35} ${size * 0.6},${size * 0.45} ${size * 0.5},${size * 0.55} ${size * 0.4},${size * 0.45}`}
            fill="#DAA520"
            stroke="#B8860B"
            strokeWidth="0.5"
          />
          <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.05} fill="none" stroke="#DAA520" strokeWidth="0.5" />
          <rect x={size * 0.35} y={size * 0.7} width={size * 0.05} height={size * 0.08} fill={style.metal} />
          <rect x={size * 0.6} y={size * 0.7} width={size * 0.05} height={size * 0.08} fill={style.metal} />
        </>
      ) : style.style === 'ornate' ? (
        // European ornate cabinet with doors
        <>
          <rect x={size * 0.25} y={size * 0.2} width={size * 0.22} height={size * 0.55} fill={style.wood} stroke="#3a2317" strokeWidth="0.5" />
          <rect x={size * 0.53} y={size * 0.2} width={size * 0.22} height={size * 0.55} fill={style.wood} stroke="#3a2317" strokeWidth="0.5" />
          {/* Decorative panels */}
          <rect x={size * 0.28} y={size * 0.25} width={size * 0.16} height={size * 0.2} fill="none" stroke="#3a2317" strokeWidth="0.5" />
          <rect x={size * 0.56} y={size * 0.25} width={size * 0.16} height={size * 0.2} fill="none" stroke="#3a2317" strokeWidth="0.5" />
          <rect x={size * 0.28} y={size * 0.5} width={size * 0.16} height={size * 0.2} fill="none" stroke="#3a2317" strokeWidth="0.5" />
          <rect x={size * 0.56} y={size * 0.5} width={size * 0.16} height={size * 0.2} fill="none" stroke="#3a2317" strokeWidth="0.5" />
          {/* Handles */}
          <circle cx={size * 0.44} cy={size * 0.475} r={size * 0.02} fill={style.metal} />
          <circle cx={size * 0.56} cy={size * 0.475} r={size * 0.02} fill={style.metal} />
        </>
      ) : (
        // Default simple cabinet
        <>
          <rect x={size * 0.25} y={size * 0.2} width={size * 0.5} height={size * 0.25} fill="none" stroke="#3a2317" strokeWidth="0.5" />
          <rect x={size * 0.25} y={size * 0.5} width={size * 0.5} height={size * 0.25} fill="none" stroke="#3a2317" strokeWidth="0.5" />
          <circle cx={size * 0.5} cy={size * 0.325} r={size * 0.03} fill={style.metal} />
          <circle cx={size * 0.5} cy={size * 0.625} r={size * 0.03} fill={style.metal} />
        </>
      )}
      
      {/* Legs */}
      <rect x={size * 0.25} y={size * 0.85} width={size * 0.05} height={size * 0.1} fill={style.wood} />
      <rect x={size * 0.7} y={size * 0.85} width={size * 0.05} height={size * 0.1} fill={style.wood} />
    </g>
  );
};