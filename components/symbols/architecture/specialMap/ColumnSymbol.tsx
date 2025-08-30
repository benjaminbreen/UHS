/**
 * ColumnSymbol.tsx
 * Culturally and era-specific column/pillar symbol for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../types';

interface ColumnSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const ColumnSymbol: React.FC<ColumnSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getColumnStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { color: '#DEB887', capital: 'lotus', style: 'tapered' };
      } else if (culturalZone === 'EUROPEAN') {
        return { color: '#D3D3D3', capital: 'doric', style: 'fluted' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { color: '#8B4513', capital: 'bracket', style: 'wooden' };
      }
      return { color: '#D3D3D3', capital: 'simple', style: 'plain' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { color: '#A9A9A9', capital: 'gothic', style: 'bundled' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { color: '#DEB887', capital: 'horseshoe', style: 'twisted' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { color: '#A0522D', capital: 'pagoda', style: 'tiered' };
      }
      return { color: '#A9A9A9', capital: 'simple', style: 'plain' };
    }
    
    return { color: '#696969', capital: 'modern', style: 'cylindrical' };
  };

  const style = getColumnStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Base */}
      <rect 
        x={size * 0.3} 
        y={size * 0.85} 
        width={size * 0.4} 
        height={size * 0.1}
        fill={style.color}
        stroke="#505050"
        strokeWidth="0.5"
      />
      
      {/* Column shaft based on style */}
      {style.style === 'fluted' ? (
        // Classical fluted column
        <>
          <rect x={size * 0.35} y={size * 0.2} width={size * 0.3} height={size * 0.65} fill={style.color} />
          <line x1={size * 0.38} y1={size * 0.2} x2={size * 0.38} y2={size * 0.85} stroke="#BEBEBE" strokeWidth="0.5" />
          <line x1={size * 0.42} y1={size * 0.2} x2={size * 0.42} y2={size * 0.85} stroke="#BEBEBE" strokeWidth="0.5" />
          <line x1={size * 0.46} y1={size * 0.2} x2={size * 0.46} y2={size * 0.85} stroke="#BEBEBE" strokeWidth="0.5" />
          <line x1={size * 0.50} y1={size * 0.2} x2={size * 0.50} y2={size * 0.85} stroke="#BEBEBE" strokeWidth="0.5" />
          <line x1={size * 0.54} y1={size * 0.2} x2={size * 0.54} y2={size * 0.85} stroke="#BEBEBE" strokeWidth="0.5" />
          <line x1={size * 0.58} y1={size * 0.2} x2={size * 0.58} y2={size * 0.85} stroke="#BEBEBE" strokeWidth="0.5" />
          <line x1={size * 0.62} y1={size * 0.2} x2={size * 0.62} y2={size * 0.85} stroke="#BEBEBE" strokeWidth="0.5" />
        </>
      ) : style.style === 'bundled' ? (
        // Gothic bundled columns
        <>
          <ellipse cx={size * 0.42} cy={size * 0.5} rx={size * 0.05} ry={size * 0.35} fill={style.color} />
          <ellipse cx={size * 0.58} cy={size * 0.5} rx={size * 0.05} ry={size * 0.35} fill={style.color} />
          <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.06} ry={size * 0.36} fill={style.color} />
        </>
      ) : style.style === 'wooden' ? (
        // East Asian wooden column
        <>
          <rect x={size * 0.38} y={size * 0.2} width={size * 0.24} height={size * 0.65} fill={style.color} />
          <rect x={size * 0.36} y={size * 0.25} width={size * 0.28} height={size * 0.03} fill="#654321" />
          <rect x={size * 0.36} y={size * 0.45} width={size * 0.28} height={size * 0.03} fill="#654321" />
          <rect x={size * 0.36} y={size * 0.65} width={size * 0.28} height={size * 0.03} fill="#654321" />
        </>
      ) : style.style === 'twisted' ? (
        // Islamic twisted column
        <>
          <path 
            d={`M ${size * 0.4} ${size * 0.2} 
                Q ${size * 0.45} ${size * 0.35}, ${size * 0.4} ${size * 0.5}
                Q ${size * 0.35} ${size * 0.65}, ${size * 0.4} ${size * 0.85}`}
            fill="none"
            stroke={style.color}
            strokeWidth={size * 0.15}
          />
          <path 
            d={`M ${size * 0.6} ${size * 0.2} 
                Q ${size * 0.55} ${size * 0.35}, ${size * 0.6} ${size * 0.5}
                Q ${size * 0.65} ${size * 0.65}, ${size * 0.6} ${size * 0.85}`}
            fill="none"
            stroke={style.color}
            strokeWidth={size * 0.15}
          />
        </>
      ) : style.style === 'tapered' ? (
        // Ancient Egyptian tapered column
        <>
          <polygon 
            points={`${size * 0.38},${size * 0.85} ${size * 0.62},${size * 0.85} ${size * 0.58},${size * 0.2} ${size * 0.42},${size * 0.2}`}
            fill={style.color}
          />
        </>
      ) : (
        // Default cylindrical column
        <rect x={size * 0.38} y={size * 0.2} width={size * 0.24} height={size * 0.65} fill={style.color} />
      )}
      
      {/* Capital based on style */}
      {style.capital === 'doric' ? (
        // Doric capital
        <>
          <rect x={size * 0.32} y={size * 0.15} width={size * 0.36} height={size * 0.05} fill={style.color} />
          <rect x={size * 0.3} y={size * 0.1} width={size * 0.4} height={size * 0.05} fill={style.color} />
        </>
      ) : style.capital === 'gothic' ? (
        // Gothic capital with decoration
        <>
          <rect x={size * 0.32} y={size * 0.15} width={size * 0.36} height={size * 0.05} fill={style.color} />
          <polygon 
            points={`${size * 0.35},${size * 0.15} ${size * 0.4},${size * 0.1} ${size * 0.45},${size * 0.15}`}
            fill={style.color}
          />
          <polygon 
            points={`${size * 0.55},${size * 0.15} ${size * 0.6},${size * 0.1} ${size * 0.65},${size * 0.15}`}
            fill={style.color}
          />
        </>
      ) : style.capital === 'lotus' ? (
        // Egyptian lotus capital
        <>
          <ellipse cx={size * 0.5} cy={size * 0.15} rx={size * 0.2} ry={size * 0.08} fill={style.color} />
          <path 
            d={`M ${size * 0.35} ${size * 0.15} Q ${size * 0.3} ${size * 0.1}, ${size * 0.35} ${size * 0.05}`}
            fill="none"
            stroke={style.color}
            strokeWidth="2"
          />
          <path 
            d={`M ${size * 0.65} ${size * 0.15} Q ${size * 0.7} ${size * 0.1}, ${size * 0.65} ${size * 0.05}`}
            fill="none"
            stroke={style.color}
            strokeWidth="2"
          />
        </>
      ) : style.capital === 'bracket' ? (
        // East Asian bracket capital
        <>
          <rect x={size * 0.3} y={size * 0.18} width={size * 0.4} height={size * 0.04} fill="#654321" />
          <polygon 
            points={`${size * 0.25},${size * 0.18} ${size * 0.3},${size * 0.14} ${size * 0.3},${size * 0.18}`}
            fill="#654321"
          />
          <polygon 
            points={`${size * 0.7},${size * 0.18} ${size * 0.7},${size * 0.14} ${size * 0.75},${size * 0.18}`}
            fill="#654321"
          />
        </>
      ) : style.capital === 'horseshoe' ? (
        // Islamic horseshoe arch capital
        <>
          <path 
            d={`M ${size * 0.35} ${size * 0.2} 
                Q ${size * 0.3} ${size * 0.15}, ${size * 0.35} ${size * 0.1}
                Q ${size * 0.42} ${size * 0.08}, ${size * 0.5} ${size * 0.08}
                Q ${size * 0.58} ${size * 0.08}, ${size * 0.65} ${size * 0.1}
                Q ${size * 0.7} ${size * 0.15}, ${size * 0.65} ${size * 0.2}`}
            fill={style.color}
          />
        </>
      ) : (
        // Default simple capital
        <rect x={size * 0.32} y={size * 0.15} width={size * 0.36} height={size * 0.05} fill={style.color} />
      )}
    </g>
  );
};