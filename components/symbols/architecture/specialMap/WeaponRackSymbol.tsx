/**
 * WeaponRackSymbol.tsx
 * Culturally and era-specific weapon rack symbol for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../types';

interface WeaponRackSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const WeaponRackSymbol: React.FC<WeaponRackSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getWeaponStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { wood: '#8B4513', metal: '#CD853F', weapons: 'spears_curved' };
      } else if (culturalZone === 'EUROPEAN') {
        return { wood: '#654321', metal: '#696969', weapons: 'spears_shields' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { wood: '#A0522D', metal: '#B87333', weapons: 'polearms' };
      }
      return { wood: '#8B4513', metal: '#696969', weapons: 'spears_shields' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { wood: '#654321', metal: '#2F4F4F', weapons: 'swords_shields' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { wood: '#A0522D', metal: '#DAA520', weapons: 'scimitars' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { wood: '#8B4513', metal: '#B87333', weapons: 'katanas' };
      }
      return { wood: '#654321', metal: '#696969', weapons: 'swords_shields' };
    }
    
    return { wood: '#8B6F47', metal: '#708090', weapons: 'modern' };
  };

  const style = getWeaponStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Rack frame */}
      <rect 
        x={size * 0.1} 
        y={size * 0.15} 
        width={size * 0.8} 
        height={size * 0.05}
        fill={style.wood}
        stroke="#3a2317"
        strokeWidth="1"
      />
      <rect 
        x={size * 0.15} 
        y={size * 0.2} 
        width={size * 0.05} 
        height={size * 0.7}
        fill={style.wood}
      />
      <rect 
        x={size * 0.8} 
        y={size * 0.2} 
        width={size * 0.05} 
        height={size * 0.7}
        fill={style.wood}
      />
      
      {/* Weapons based on style */}
      {style.weapons === 'katanas' ? (
        // East Asian katanas
        <>
          <line x1={size * 0.25} y1={size * 0.2} x2={size * 0.35} y2={size * 0.8} stroke={style.metal} strokeWidth="2" />
          <path d={`M ${size * 0.34} ${size * 0.75} Q ${size * 0.36} ${size * 0.78}, ${size * 0.35} ${size * 0.8}`} stroke="#8B0000" strokeWidth="3" fill="none" />
          <line x1={size * 0.45} y1={size * 0.2} x2={size * 0.55} y2={size * 0.8} stroke={style.metal} strokeWidth="2" />
          <path d={`M ${size * 0.54} ${size * 0.75} Q ${size * 0.56} ${size * 0.78}, ${size * 0.55} ${size * 0.8}`} stroke="#8B0000" strokeWidth="3" fill="none" />
          <line x1={size * 0.65} y1={size * 0.2} x2={size * 0.75} y2={size * 0.8} stroke={style.metal} strokeWidth="2" />
          <path d={`M ${size * 0.74} ${size * 0.75} Q ${size * 0.76} ${size * 0.78}, ${size * 0.75} ${size * 0.8}`} stroke="#8B0000" strokeWidth="3" fill="none" />
        </>
      ) : style.weapons === 'scimitars' ? (
        // MENA curved swords
        <>
          <path d={`M ${size * 0.3} ${size * 0.2} Q ${size * 0.32} ${size * 0.5}, ${size * 0.35} ${size * 0.8}`} stroke={style.metal} strokeWidth="2" fill="none" />
          <ellipse cx={size * 0.3} cy={size * 0.18} rx={size * 0.03} ry={size * 0.02} fill="#DAA520" />
          <path d={`M ${size * 0.5} ${size * 0.2} Q ${size * 0.52} ${size * 0.5}, ${size * 0.55} ${size * 0.8}`} stroke={style.metal} strokeWidth="2" fill="none" />
          <ellipse cx={size * 0.5} cy={size * 0.18} rx={size * 0.03} ry={size * 0.02} fill="#DAA520" />
          <path d={`M ${size * 0.7} ${size * 0.2} Q ${size * 0.72} ${size * 0.5}, ${size * 0.75} ${size * 0.8}`} stroke={style.metal} strokeWidth="2" fill="none" />
          <ellipse cx={size * 0.7} cy={size * 0.18} rx={size * 0.03} ry={size * 0.02} fill="#DAA520" />
        </>
      ) : style.weapons === 'swords_shields' ? (
        // European swords and shields
        <>
          <line x1={size * 0.3} y1={size * 0.2} x2={size * 0.3} y2={size * 0.75} stroke={style.metal} strokeWidth="2" />
          <rect x={size * 0.27} y={size * 0.18} width={size * 0.06} height={size * 0.08} fill="#8B4513" />
          <line x1={size * 0.5} y1={size * 0.2} x2={size * 0.5} y2={size * 0.75} stroke={style.metal} strokeWidth="2" />
          <rect x={size * 0.47} y={size * 0.18} width={size * 0.06} height={size * 0.08} fill="#8B4513" />
          {/* Shield */}
          <ellipse cx={size * 0.7} cy={size * 0.45} rx={size * 0.12} ry={size * 0.18} fill="#696969" stroke="#404040" strokeWidth="1" />
          <circle cx={size * 0.7} cy={size * 0.45} r={size * 0.04} fill="#2F4F4F" />
        </>
      ) : style.weapons === 'polearms' ? (
        // East Asian polearms
        <>
          <line x1={size * 0.3} y1={size * 0.15} x2={size * 0.3} y2={size * 0.85} stroke={style.wood} strokeWidth="2" />
          <polygon points={`${size * 0.3},${size * 0.1} ${size * 0.27},${size * 0.15} ${size * 0.3},${size * 0.2} ${size * 0.33},${size * 0.15}`} fill={style.metal} />
          <line x1={size * 0.5} y1={size * 0.15} x2={size * 0.5} y2={size * 0.85} stroke={style.wood} strokeWidth="2" />
          <path d={`M ${size * 0.47} ${size * 0.1} Q ${size * 0.5} ${size * 0.08}, ${size * 0.53} ${size * 0.1} L ${size * 0.5} ${size * 0.18} Z`} fill={style.metal} />
          <line x1={size * 0.7} y1={size * 0.15} x2={size * 0.7} y2={size * 0.85} stroke={style.wood} strokeWidth="2" />
          <polygon points={`${size * 0.7},${size * 0.1} ${size * 0.67},${size * 0.15} ${size * 0.7},${size * 0.2} ${size * 0.73},${size * 0.15}`} fill={style.metal} />
        </>
      ) : (
        // Default spears and shields
        <>
          <line x1={size * 0.3} y1={size * 0.15} x2={size * 0.3} y2={size * 0.85} stroke={style.wood} strokeWidth="1.5" />
          <polygon points={`${size * 0.3},${size * 0.1} ${size * 0.28},${size * 0.15} ${size * 0.32},${size * 0.15}`} fill={style.metal} />
          <line x1={size * 0.5} y1={size * 0.15} x2={size * 0.5} y2={size * 0.85} stroke={style.wood} strokeWidth="1.5" />
          <polygon points={`${size * 0.5},${size * 0.1} ${size * 0.48},${size * 0.15} ${size * 0.52},${size * 0.15}`} fill={style.metal} />
          <circle cx={size * 0.7} cy={size * 0.45} r={size * 0.15} fill="#8B4513" stroke="#654321" strokeWidth="1" />
          <circle cx={size * 0.7} cy={size * 0.45} r={size * 0.05} fill={style.metal} />
        </>
      )}
    </g>
  );
};