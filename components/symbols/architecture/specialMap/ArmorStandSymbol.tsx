/**
 * ArmorStandSymbol.tsx
 * Culturally and era-specific armor stand symbol for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../types';

interface ArmorStandSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const ArmorStandSymbol: React.FC<ArmorStandSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getArmorStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { armor: '#CD853F', detail: '#8B4513', style: 'scale' };
      } else if (culturalZone === 'EUROPEAN') {
        return { armor: '#B87333', detail: '#8B4513', style: 'bronze' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { armor: '#8B4513', detail: '#654321', style: 'lamellar' };
      }
      return { armor: '#B87333', detail: '#8B4513', style: 'bronze' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { armor: '#708090', detail: '#2F4F4F', style: 'plate' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { armor: '#696969', detail: '#DAA520', style: 'mamluk' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { armor: '#2F4F4F', detail: '#8B0000', style: 'samurai' };
      }
      return { armor: '#708090', detail: '#2F4F4F', style: 'chain' };
    }
    
    return { armor: '#4B5563', detail: '#1F2937', style: 'modern' };
  };

  const style = getArmorStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Stand base */}
      <rect 
        x={size * 0.35} 
        y={size * 0.85} 
        width={size * 0.3} 
        height={size * 0.1}
        fill="#654321"
      />
      <rect 
        x={size * 0.48} 
        y={size * 0.7} 
        width={size * 0.04} 
        height={size * 0.2}
        fill="#8B4513"
      />
      
      {/* Armor based on style */}
      {style.style === 'samurai' ? (
        // East Asian samurai armor
        <>
          {/* Helmet */}
          <ellipse cx={size * 0.5} cy={size * 0.15} rx={size * 0.12} ry={size * 0.08} fill={style.armor} />
          <path d={`M ${size * 0.38} ${size * 0.12} Q ${size * 0.3} ${size * 0.08}, ${size * 0.28} ${size * 0.15}`} stroke={style.armor} strokeWidth="1" fill="none" />
          <path d={`M ${size * 0.62} ${size * 0.12} Q ${size * 0.7} ${size * 0.08}, ${size * 0.72} ${size * 0.15}`} stroke={style.armor} strokeWidth="1" fill="none" />
          {/* Chest plate */}
          <rect x={size * 0.35} y={size * 0.25} width={size * 0.3} height={size * 0.25} fill={style.armor} rx={size * 0.02} />
          {/* Lamellae pattern */}
          <line x1={size * 0.35} y1={size * 0.3} x2={size * 0.65} y2={size * 0.3} stroke={style.detail} strokeWidth="0.5" />
          <line x1={size * 0.35} y1={size * 0.35} x2={size * 0.65} y2={size * 0.35} stroke={style.detail} strokeWidth="0.5" />
          <line x1={size * 0.35} y1={size * 0.4} x2={size * 0.65} y2={size * 0.4} stroke={style.detail} strokeWidth="0.5" />
          <line x1={size * 0.35} y1={size * 0.45} x2={size * 0.65} y2={size * 0.45} stroke={style.detail} strokeWidth="0.5" />
          {/* Shoulder guards */}
          <rect x={size * 0.25} y={size * 0.25} width={size * 0.08} height={size * 0.15} fill={style.armor} rx={size * 0.02} />
          <rect x={size * 0.67} y={size * 0.25} width={size * 0.08} height={size * 0.15} fill={style.armor} rx={size * 0.02} />
          {/* Skirt plates */}
          <rect x={size * 0.37} y={size * 0.52} width={size * 0.26} height={size * 0.15} fill={style.armor} />
          <line x1={size * 0.42} y1={size * 0.52} x2={size * 0.42} y2={size * 0.67} stroke={style.detail} strokeWidth="0.5" />
          <line x1={size * 0.5} y1={size * 0.52} x2={size * 0.5} y2={size * 0.67} stroke={style.detail} strokeWidth="0.5" />
          <line x1={size * 0.58} y1={size * 0.52} x2={size * 0.58} y2={size * 0.67} stroke={style.detail} strokeWidth="0.5" />
        </>
      ) : style.style === 'plate' ? (
        // European plate armor
        <>
          {/* Helmet */}
          <ellipse cx={size * 0.5} cy={size * 0.15} rx={size * 0.1} ry={size * 0.12} fill={style.armor} />
          <rect x={size * 0.45} y={size * 0.12} width={size * 0.1} height={size * 0.08} fill={style.detail} />
          {/* Breastplate */}
          <path d={`M ${size * 0.35} ${size * 0.28} L ${size * 0.35} ${size * 0.48} Q ${size * 0.5} ${size * 0.52}, ${size * 0.65} ${size * 0.48} L ${size * 0.65} ${size * 0.28} Q ${size * 0.5} ${size * 0.24}, ${size * 0.35} ${size * 0.28}`} fill={style.armor} />
          <line x1={size * 0.5} y1={size * 0.28} x2={size * 0.5} y2={size * 0.48} stroke={style.detail} strokeWidth="1" />
          {/* Pauldrons */}
          <circle cx={size * 0.28} cy={size * 0.3} r={size * 0.08} fill={style.armor} />
          <circle cx={size * 0.72} cy={size * 0.3} r={size * 0.08} fill={style.armor} />
          {/* Faulds */}
          <rect x={size * 0.38} y={size * 0.52} width={size * 0.24} height={size * 0.12} fill={style.armor} />
          <line x1={size * 0.38} y1={size * 0.56} x2={size * 0.62} y2={size * 0.56} stroke={style.detail} strokeWidth="0.5" />
          <line x1={size * 0.38} y1={size * 0.6} x2={size * 0.62} y2={size * 0.6} stroke={style.detail} strokeWidth="0.5" />
        </>
      ) : style.style === 'mamluk' ? (
        // MENA Mamluk armor
        <>
          {/* Turban helmet */}
          <ellipse cx={size * 0.5} cy={size * 0.12} rx={size * 0.12} ry={size * 0.06} fill="#F5F5DC" />
          <ellipse cx={size * 0.5} cy={size * 0.15} rx={size * 0.1} ry={size * 0.08} fill={style.armor} />
          <polygon points={`${size * 0.5},${size * 0.08} ${size * 0.48},${size * 0.12} ${size * 0.52},${size * 0.12}`} fill="#DAA520" />
          {/* Chain mail */}
          <rect x={size * 0.32} y={size * 0.25} width={size * 0.36} height={size * 0.3} fill={style.armor} />
          {/* Chain pattern */}
          <circle cx={size * 0.4} cy={size * 0.3} r={size * 0.01} fill={style.detail} />
          <circle cx={size * 0.45} cy={size * 0.32} r={size * 0.01} fill={style.detail} />
          <circle cx={size * 0.5} cy={size * 0.3} r={size * 0.01} fill={style.detail} />
          <circle cx={size * 0.55} cy={size * 0.32} r={size * 0.01} fill={style.detail} />
          <circle cx={size * 0.6} cy={size * 0.3} r={size * 0.01} fill={style.detail} />
          <circle cx={size * 0.4} cy={size * 0.35} r={size * 0.01} fill={style.detail} />
          <circle cx={size * 0.45} cy={size * 0.37} r={size * 0.01} fill={style.detail} />
          <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.01} fill={style.detail} />
          <circle cx={size * 0.55} cy={size * 0.37} r={size * 0.01} fill={style.detail} />
          <circle cx={size * 0.6} cy={size * 0.35} r={size * 0.01} fill={style.detail} />
          {/* Scale plates */}
          <rect x={size * 0.35} y={size * 0.48} width={size * 0.3} height={size * 0.15} fill="#DAA520" />
          <path d={`M ${size * 0.35} ${size * 0.52} Q ${size * 0.4} ${size * 0.5}, ${size * 0.45} ${size * 0.52}`} fill={style.armor} />
          <path d={`M ${size * 0.45} ${size * 0.52} Q ${size * 0.5} ${size * 0.5}, ${size * 0.55} ${size * 0.52}`} fill={style.armor} />
          <path d={`M ${size * 0.55} ${size * 0.52} Q ${size * 0.6} ${size * 0.5}, ${size * 0.65} ${size * 0.52}`} fill={style.armor} />
        </>
      ) : style.style === 'scale' ? (
        // Ancient scale armor
        <>
          {/* Simple helmet */}
          <ellipse cx={size * 0.5} cy={size * 0.15} rx={size * 0.1} ry={size * 0.1} fill={style.armor} />
          {/* Scale vest */}
          <rect x={size * 0.35} y={size * 0.28} width={size * 0.3} height={size * 0.35} fill={style.armor} />
          {/* Scale pattern */}
          {[0.28, 0.33, 0.38, 0.43, 0.48, 0.53, 0.58].map(y => (
            <g key={y}>
              <path d={`M ${size * 0.35} ${size * y} Q ${size * 0.38} ${size * (y - 0.02)}, ${size * 0.41} ${size * y}`} fill={style.detail} />
              <path d={`M ${size * 0.41} ${size * y} Q ${size * 0.44} ${size * (y - 0.02)}, ${size * 0.47} ${size * y}`} fill={style.detail} />
              <path d={`M ${size * 0.47} ${size * y} Q ${size * 0.5} ${size * (y - 0.02)}, ${size * 0.53} ${size * y}`} fill={style.detail} />
              <path d={`M ${size * 0.53} ${size * y} Q ${size * 0.56} ${size * (y - 0.02)}, ${size * 0.59} ${size * y}`} fill={style.detail} />
              <path d={`M ${size * 0.59} ${size * y} Q ${size * 0.62} ${size * (y - 0.02)}, ${size * 0.65} ${size * y}`} fill={style.detail} />
            </g>
          ))}
        </>
      ) : (
        // Default bronze/simple armor
        <>
          {/* Helmet */}
          <ellipse cx={size * 0.5} cy={size * 0.15} rx={size * 0.1} ry={size * 0.1} fill={style.armor} />
          {/* Breastplate */}
          <rect x={size * 0.35} y={size * 0.28} width={size * 0.3} height={size * 0.25} fill={style.armor} rx={size * 0.02} />
          <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.05} fill={style.detail} />
          {/* Belt */}
          <rect x={size * 0.33} y={size * 0.52} width={size * 0.34} height={size * 0.04} fill={style.detail} />
          {/* Skirt */}
          <rect x={size * 0.37} y={size * 0.56} width={size * 0.26} height={size * 0.1} fill={style.armor} />
        </>
      )}
    </g>
  );
};