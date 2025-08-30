/**
 * KitchenSinkSymbol.tsx  
 * Culturally and era-specific kitchen sink for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../types';

interface KitchenSinkSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const KitchenSinkSymbol: React.FC<KitchenSinkSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getSinkStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { basin: '#DEB887', water: '#4682B4', style: 'clay' };
      } else if (culturalZone === 'EUROPEAN') {
        return { basin: '#A9A9A9', water: '#5F9EA0', style: 'stone' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { basin: '#8B4513', water: '#6495ED', style: 'wooden' };
      }
      return { basin: '#A9A9A9', water: '#5F9EA0', style: 'stone' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { basin: '#696969', water: '#4682B4', style: 'stone_basin' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { basin: '#F5DEB3', water: '#4682B4', style: 'ceramic' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { basin: '#A0522D', water: '#87CEEB', style: 'lacquered' };
      }
      return { basin: '#696969', water: '#4682B4', style: 'stone_basin' };
    }
    
    return { basin: '#F8F8FF', water: '#B0E0E6', style: 'modern' };
  };

  const style = getSinkStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Counter/surface */}
      <rect x={size * 0.15} y={size * 0.5} width={size * 0.7} height={size * 0.3} fill="#8B4513" stroke="#654321" strokeWidth="1" />
      
      {style.style === 'clay' ? (
        // Ancient clay basin
        <>
          <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.2} ry={size * 0.15} fill={style.basin} stroke="#8B4513" strokeWidth="1" />
          <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.17} ry={size * 0.12} fill={style.water} opacity="0.6" />
          {/* Water jug beside */}
          <ellipse cx={size * 0.75} cy={size * 0.48} rx={size * 0.06} ry={size * 0.08} fill="#CD853F" />
          <rect x={size * 0.73} y={size * 0.42} width={size * 0.04} height={size * 0.06} fill="#CD853F" />
          <path d={`M ${size * 0.72} ${size * 0.44} Q ${size * 0.7} ${size * 0.42}, ${size * 0.72} ${size * 0.4}`} stroke="#CD853F" strokeWidth="1" fill="none" />
        </>
      ) : style.style === 'stone' ? (
        // Ancient stone basin
        <>
          <rect x={size * 0.3} y={size * 0.35} width={size * 0.4} height={size * 0.25} fill={style.basin} stroke="#696969" strokeWidth="1" />
          <rect x={size * 0.35} y={size * 0.4} width={size * 0.3} height={size * 0.15} fill={style.water} opacity="0.7" />
          {/* Drainage groove */}
          <line x1={size * 0.5} y1={size * 0.55} x2={size * 0.5} y2={size * 0.6} stroke="#505050" strokeWidth="1" />
        </>
      ) : style.style === 'wooden' ? (
        // East Asian wooden bucket sink
        <>
          <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.15} ry={size * 0.05} fill={style.basin} stroke="#654321" strokeWidth="1" />
          <rect x={size * 0.35} y={size * 0.35} width={size * 0.3} height={size * 0.15} fill={style.basin} stroke="#654321" strokeWidth="1" />
          <ellipse cx={size * 0.5} cy={size * 0.35} rx={size * 0.15} ry={size * 0.05} fill={style.basin} stroke="#654321" strokeWidth="1" />
          <ellipse cx={size * 0.5} cy={size * 0.35} rx={size * 0.12} ry={size * 0.03} fill={style.water} opacity="0.7" />
          {/* Metal bands */}
          <ellipse cx={size * 0.5} cy={size * 0.38} rx={size * 0.16} ry={size * 0.05} fill="none" stroke="#696969" strokeWidth="0.5" />
          <ellipse cx={size * 0.5} cy={size * 0.47} rx={size * 0.16} ry={size * 0.05} fill="none" stroke="#696969" strokeWidth="0.5" />
        </>
      ) : style.style === 'ceramic' ? (
        // MENA ceramic basin with decorative patterns
        <>
          <rect x={size * 0.3} y={size * 0.35} width={size * 0.4} height={size * 0.2} rx={size * 0.03} fill={style.basin} stroke="#D2B48C" strokeWidth="1" />
          <rect x={size * 0.35} y={size * 0.4} width={size * 0.3} height={size * 0.1} rx={size * 0.02} fill={style.water} opacity="0.7" />
          {/* Decorative border */}
          <rect x={size * 0.3} y={size * 0.35} width={size * 0.4} height={size * 0.03} fill="#4169E1" opacity="0.5" />
          <circle cx={size * 0.35} cy={size * 0.365} r={size * 0.01} fill="#FFD700" />
          <circle cx={size * 0.5} cy={size * 0.365} r={size * 0.01} fill="#FFD700" />
          <circle cx={size * 0.65} cy={size * 0.365} r={size * 0.01} fill="#FFD700" />
          {/* Spout */}
          <rect x={size * 0.48} y={size * 0.28} width={size * 0.04} height={size * 0.07} fill="#B87333" />
          <circle cx={size * 0.5} cy={size * 0.28} r={size * 0.03} fill="#B87333" />
        </>
      ) : style.style === 'stone_basin' ? (
        // Medieval stone basin with spout
        <>
          <rect x={size * 0.28} y={size * 0.35} width={size * 0.44} height={size * 0.22} fill={style.basin} stroke="#505050" strokeWidth="1" />
          <rect x={size * 0.33} y={size * 0.4} width={size * 0.34} height={size * 0.12} fill={style.water} opacity="0.7" />
          {/* Simple spout */}
          <rect x={size * 0.48} y={size * 0.25} width={size * 0.04} height={size * 0.1} fill="#696969" />
          <path d={`M ${size * 0.48} ${size * 0.3} Q ${size * 0.5} ${size * 0.32}, ${size * 0.52} ${size * 0.3}`} stroke="#696969" strokeWidth="2" fill="none" />
        </>
      ) : style.style === 'lacquered' ? (
        // East Asian lacquered basin
        <>
          <rect x={size * 0.3} y={size * 0.35} width={size * 0.4} height={size * 0.2} rx={size * 0.02} fill={style.basin} stroke="#8B4513" strokeWidth="1" />
          <rect x={size * 0.3} y={size * 0.35} width={size * 0.4} height={size * 0.2} rx={size * 0.02} fill="#8B0000" opacity="0.2" />
          <rect x={size * 0.35} y={size * 0.4} width={size * 0.3} height={size * 0.1} rx={size * 0.01} fill={style.water} opacity="0.7" />
          {/* Bamboo water pipe */}
          <rect x={size * 0.48} y={size * 0.2} width={size * 0.04} height={size * 0.15} fill="#D2691E" />
          <line x1={size * 0.48} y1={size * 0.25} x2={size * 0.52} y2={size * 0.25} stroke="#A0522D" strokeWidth="0.5" />
          <line x1={size * 0.48} y1={size * 0.3} x2={size * 0.52} y2={size * 0.3} stroke="#A0522D" strokeWidth="0.5" />
        </>
      ) : (
        // Modern sink with faucet
        <>
          <rect x={size * 0.25} y={size * 0.35} width={size * 0.5} height={size * 0.25} rx={size * 0.03} fill={style.basin} stroke="#C0C0C0" strokeWidth="1" />
          <rect x={size * 0.3} y={size * 0.4} width={size * 0.4} height={size * 0.15} rx={size * 0.02} fill={style.water} opacity="0.7" />
          {/* Modern faucet */}
          <rect x={size * 0.49} y={size * 0.25} width={size * 0.02} height={size * 0.1} fill="#C0C0C0" />
          <path d={`M ${size * 0.45} ${size * 0.28} Q ${size * 0.5} ${size * 0.25}, ${size * 0.55} ${size * 0.28}`} stroke="#C0C0C0" strokeWidth="2" fill="none" />
          {/* Handles */}
          <circle cx={size * 0.42} cy={size * 0.32} r={size * 0.02} fill="#C0C0C0" />
          <circle cx={size * 0.58} cy={size * 0.32} r={size * 0.02} fill="#C0C0C0" />
        </>
      )}
    </g>
  );
};