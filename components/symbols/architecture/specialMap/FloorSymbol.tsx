/**
 * FloorSymbol.tsx - Floor tiles for special maps
 * Simple, performant tiles with climate-appropriate defaults
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface FloorSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  floorType?: 'wood' | 'stone' | 'marble' | 'tile' | 'carpet' | 'dirt';
  climate?: 'tropical' | 'arid' | 'temperate' | 'cold' | 'mediterranean' | 'semitropical';
  seed?: number;
}

export const FloorSymbol: React.FC<FloorSymbolProps> = ({ 
  x,
  y,
  size,
  culturalZone = 'EUROPEAN',
  era = HistoricalEra.MEDIEVAL,
  floorType,
  climate = 'temperate',
  seed = 0
}) => {
  // Standard gray floor color that matches object borders
  const standardGray = '#8a8a8a';
  const darkGray = '#6a6a6a';
  const lightGray = '#9a9a9a';
  
  // Determine floor type based on input or climate default
  const getFloorType = () => {
    if (floorType) return floorType;
    
    // Climate-based defaults
    if (climate === 'tropical') return 'wood';
    if (climate === 'arid' || climate === 'mediterranean' || climate === 'semitropical') return 'tile'; // terracotta
    return 'stone'; // temperate and cold default to stone
  };
  
  const actualFloorType = getFloorType();
  
  // Render based on floor type
  switch (actualFloorType) {
    case 'wood':
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Gray background to prevent bleed */}
          <rect x={0} y={0} width={size} height={size} fill={standardGray} />
          
          {/* Simple wood planks */}
          <rect x={0} y={0} width={size} height={size} fill="#8B6341" />
          {[0.25, 0.5, 0.75].map(pos => (
            <line 
              key={pos}
              x1={pos * size} 
              y1={0} 
              x2={pos * size} 
              y2={size} 
              stroke="#6B4A31" 
              strokeWidth={1} 
              opacity={0.5}
            />
          ))}
        </g>
      );
      
    case 'tile':
      // Terracotta tiles for warm climates
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Gray background */}
          <rect x={0} y={0} width={size} height={size} fill={standardGray} />
          
          {/* Terracotta base */}
          <rect x={0} y={0} width={size} height={size} fill="#C67146" />
          
          {/* Simple tile grid */}
          <line x1={size/2} y1={0} x2={size/2} y2={size} stroke="#A65136" strokeWidth={1} opacity={0.3} />
          <line x1={0} y1={size/2} x2={size} y2={size/2} stroke="#A65136" strokeWidth={1} opacity={0.3} />
        </g>
      );
      
    case 'marble':
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Gray background */}
          <rect x={0} y={0} width={size} height={size} fill={standardGray} />
          
          {/* Marble with subtle veining */}
          <rect x={0} y={0} width={size} height={size} fill="#E8E8E8" />
          <path 
            d={`M ${size*0.1} ${size*0.2} Q ${size*0.5} ${size*0.5} ${size*0.9} ${size*0.3}`} 
            stroke="#D0D0D0" 
            strokeWidth={0.5} 
            fill="none" 
            opacity={0.5}
          />
        </g>
      );
      
    case 'carpet':
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Gray background */}
          <rect x={0} y={0} width={size} height={size} fill={standardGray} />
          
          {/* Simple carpet texture */}
          <rect x={0} y={0} width={size} height={size} fill="#704030" />
          <rect x={2} y={2} width={size-4} height={size-4} fill="#805040" />
        </g>
      );
      
    case 'dirt':
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Gray background */}
          <rect x={0} y={0} width={size} height={size} fill={standardGray} />
          
          {/* Dirt floor */}
          <rect x={0} y={0} width={size} height={size} fill="#8B7D6B" />
        </g>
      );
      
    default: // stone
      // Simple gray stone - the default
      return (
        <g transform={`translate(${x}, ${y})`}>
          {/* Standard gray stone floor */}
          <rect x={0} y={0} width={size} height={size} fill={standardGray} />
          
          {/* Subtle stone texture */}
          <rect x={1} y={1} width={size-2} height={size-2} fill={lightGray} opacity={0.3} />
          
          {/* Stone seams */}
          <line x1={0} y1={size/2} x2={size} y2={size/2} stroke={darkGray} strokeWidth={0.5} opacity={0.3} />
          <line x1={size/2} y1={0} x2={size/2} y2={size} stroke={darkGray} strokeWidth={0.5} opacity={0.3} />
        </g>
      );
  }
};