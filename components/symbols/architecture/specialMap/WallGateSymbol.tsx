/**
 * WallGateSymbol.tsx
 * Wall with gate opening for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../types';

interface WallGateSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  seed?: number;
}

export const WallGateSymbol: React.FC<WallGateSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  const getWallStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { wall: '#DEB887', mortar: '#D2B48C', gate: '#8B4513' };
      } else if (culturalZone === 'EUROPEAN') {
        return { wall: '#A9A9A9', mortar: '#808080', gate: '#654321' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { wall: '#8B7355', mortar: '#A0522D', gate: '#8B4513' };
      }
      return { wall: '#A9A9A9', mortar: '#808080', gate: '#654321' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { wall: '#808080', mortar: '#696969', gate: '#4B3621' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { wall: '#DEB887', mortar: '#D2B48C', gate: '#8B4513' };
      }
      return { wall: '#808080', mortar: '#696969', gate: '#654321' };
    }
    
    return { wall: '#696969', mortar: '#595959', gate: '#8B6F47' };
  };

  const style = getWallStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Left wall section */}
      <rect 
        x={0} 
        y={0} 
        width={size * 0.3} 
        height={size}
        fill={style.wall}
      />
      
      {/* Right wall section */}
      <rect 
        x={size * 0.7} 
        y={0} 
        width={size * 0.3} 
        height={size}
        fill={style.wall}
      />
      
      {/* Gate frame */}
      <rect 
        x={size * 0.25} 
        y={0} 
        width={size * 0.5} 
        height={size * 0.15}
        fill={style.wall}
      />
      
      {/* Gate bars/portcullis */}
      <line x1={size * 0.35} y1={size * 0.15} x2={size * 0.35} y2={size * 0.9} stroke={style.gate} strokeWidth="2" />
      <line x1={size * 0.45} y1={size * 0.15} x2={size * 0.45} y2={size * 0.9} stroke={style.gate} strokeWidth="2" />
      <line x1={size * 0.55} y1={size * 0.15} x2={size * 0.55} y2={size * 0.9} stroke={style.gate} strokeWidth="2" />
      <line x1={size * 0.65} y1={size * 0.15} x2={size * 0.65} y2={size * 0.9} stroke={style.gate} strokeWidth="2" />
      
      {/* Horizontal bars */}
      <line x1={size * 0.3} y1={size * 0.3} x2={size * 0.7} y2={size * 0.3} stroke={style.gate} strokeWidth="1" />
      <line x1={size * 0.3} y1={size * 0.5} x2={size * 0.7} y2={size * 0.5} stroke={style.gate} strokeWidth="1" />
      <line x1={size * 0.3} y1={size * 0.7} x2={size * 0.7} y2={size * 0.7} stroke={style.gate} strokeWidth="1" />
      
      {/* Mortar lines */}
      <line x1={0} y1={size * 0.33} x2={size * 0.3} y2={size * 0.33} stroke={style.mortar} strokeWidth="0.5" />
      <line x1={0} y1={size * 0.66} x2={size * 0.3} y2={size * 0.66} stroke={style.mortar} strokeWidth="0.5" />
      <line x1={size * 0.7} y1={size * 0.33} x2={size} y2={size * 0.33} stroke={style.mortar} strokeWidth="0.5" />
      <line x1={size * 0.7} y1={size * 0.66} x2={size} y2={size * 0.66} stroke={style.mortar} strokeWidth="0.5" />
    </g>
  );
};