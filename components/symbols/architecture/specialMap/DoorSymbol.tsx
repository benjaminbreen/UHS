/**
 * DoorSymbol.tsx
 * Culturally and era-specific door symbol for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface DoorSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  isLocked?: boolean;
  seed?: number;
}

export const DoorSymbol: React.FC<DoorSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  isLocked = false,
  seed = 0
}) => {
  const getDoorStyle = () => {
    // Ancient era doors
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { wood: '#8B4513', metal: '#CD853F', style: 'ancient' };
      } else if (culturalZone === 'EUROPEAN') {
        return { wood: '#654321', metal: '#696969', style: 'ancient' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { wood: '#A0522D', metal: '#B87333', style: 'sliding' };
      }
      return { wood: '#8B4513', metal: '#696969', style: 'ancient' };
    }
    
    // Medieval era doors
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { wood: '#654321', metal: '#2F4F4F', style: 'reinforced' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { wood: '#A0522D', metal: '#DAA520', style: 'geometric' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { wood: '#8B4513', metal: '#B87333', style: 'lattice' };
      }
      return { wood: '#654321', metal: '#696969', style: 'reinforced' };
    }
    
    // Modern era doors
    return { wood: '#8B6F47', metal: '#708090', style: 'modern' };
  };

  const doorStyle = getDoorStyle();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Door frame */}
      <rect 
        x={size * 0.15} 
        y={size * 0.1} 
        width={size * 0.7} 
        height={size * 0.85}
        fill="none"
        stroke={doorStyle.metal}
        strokeWidth="2"
      />
      
      {/* Door panel based on style */}
      {doorStyle.style === 'sliding' ? (
        // East Asian sliding door with lattice
        <>
          <rect 
            x={size * 0.2} 
            y={size * 0.15} 
            width={size * 0.6} 
            height={size * 0.75}
            fill={doorStyle.wood}
            opacity="0.9"
          />
          {/* Lattice pattern */}
          <line x1={size * 0.35} y1={size * 0.15} x2={size * 0.35} y2={size * 0.9} stroke={doorStyle.metal} strokeWidth="1" />
          <line x1={size * 0.5} y1={size * 0.15} x2={size * 0.5} y2={size * 0.9} stroke={doorStyle.metal} strokeWidth="1" />
          <line x1={size * 0.65} y1={size * 0.15} x2={size * 0.65} y2={size * 0.9} stroke={doorStyle.metal} strokeWidth="1" />
          <line x1={size * 0.2} y1={size * 0.4} x2={size * 0.8} y2={size * 0.4} stroke={doorStyle.metal} strokeWidth="1" />
          <line x1={size * 0.2} y1={size * 0.65} x2={size * 0.8} y2={size * 0.65} stroke={doorStyle.metal} strokeWidth="1" />
        </>
      ) : doorStyle.style === 'geometric' ? (
        // MENA geometric carved door
        <>
          <rect 
            x={size * 0.2} 
            y={size * 0.15} 
            width={size * 0.6} 
            height={size * 0.75}
            fill={doorStyle.wood}
          />
          {/* Geometric pattern */}
          <polygon 
            points={`${size * 0.5},${size * 0.25} ${size * 0.65},${size * 0.4} ${size * 0.5},${size * 0.55} ${size * 0.35},${size * 0.4}`}
            fill="none" 
            stroke={doorStyle.metal} 
            strokeWidth="1"
          />
          <circle cx={size * 0.5} cy={size * 0.7} r={size * 0.08} fill="none" stroke={doorStyle.metal} strokeWidth="1" />
        </>
      ) : doorStyle.style === 'reinforced' ? (
        // Medieval reinforced door
        <>
          <rect 
            x={size * 0.2} 
            y={size * 0.15} 
            width={size * 0.6} 
            height={size * 0.75}
            fill={doorStyle.wood}
          />
          {/* Metal reinforcements */}
          <line x1={size * 0.2} y1={size * 0.3} x2={size * 0.8} y2={size * 0.3} stroke={doorStyle.metal} strokeWidth="2" />
          <line x1={size * 0.2} y1={size * 0.5} x2={size * 0.8} y2={size * 0.5} stroke={doorStyle.metal} strokeWidth="2" />
          <line x1={size * 0.2} y1={size * 0.7} x2={size * 0.8} y2={size * 0.7} stroke={doorStyle.metal} strokeWidth="2" />
          {/* Studs */}
          <circle cx={size * 0.3} cy={size * 0.4} r={size * 0.02} fill={doorStyle.metal} />
          <circle cx={size * 0.7} cy={size * 0.4} r={size * 0.02} fill={doorStyle.metal} />
          <circle cx={size * 0.3} cy={size * 0.6} r={size * 0.02} fill={doorStyle.metal} />
          <circle cx={size * 0.7} cy={size * 0.6} r={size * 0.02} fill={doorStyle.metal} />
        </>
      ) : (
        // Default/ancient simple door
        <rect 
          x={size * 0.2} 
          y={size * 0.15} 
          width={size * 0.6} 
          height={size * 0.75}
          fill={doorStyle.wood}
        />
      )}
      
      {/* Door handle/knob */}
      <circle 
        cx={size * 0.7} 
        cy={size * 0.5} 
        r={size * 0.04} 
        fill={doorStyle.metal}
      />
      
      {/* Lock indicator if locked */}
      {isLocked && (
        <g>
          <rect 
            x={size * 0.42} 
            y={size * 0.52} 
            width={size * 0.16} 
            height={size * 0.12} 
            fill="#2F4F4F"
            stroke="#1C1C1C"
            strokeWidth="1"
          />
          <path 
            d={`M ${size * 0.45} ${size * 0.52} L ${size * 0.45} ${size * 0.48} A ${size * 0.05} ${size * 0.05} 0 0 1 ${size * 0.55} ${size * 0.48} L ${size * 0.55} ${size * 0.52}`}
            fill="none"
            stroke="#2F4F4F"
            strokeWidth="2"
          />
        </g>
      )}
    </g>
  );
};