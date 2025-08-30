/**
 * WallBoundarySymbol2D.tsx
 * Simple boundary walls for all four sides of rooms
 * These create impassable borders with minimal visual design
 * Inspired by Stardew Valley's simple side/bottom walls
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';
import { getMaterialColors, CULTURAL_PALETTES } from './utils/Symbol2DUtils';

interface WallBoundarySymbol2DProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  side: 'north' | 'south' | 'east' | 'west';
  corner?: 'nw' | 'ne' | 'sw' | 'se';
  seed?: number;
}

export const WallBoundarySymbol2D: React.FC<WallBoundarySymbol2DProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  side,
  corner,
  seed = 0
}) => {
  const palette = CULTURAL_PALETTES[culturalZone as keyof typeof CULTURAL_PALETTES] || CULTURAL_PALETTES.EUROPEAN;
  
  // Get material colors based on culture and era
  const getMaterialType = () => {
    if (culturalZone === 'EAST_ASIAN' && era < 1500) return 'wood';
    if (culturalZone === 'MENA') return 'stone';
    if (culturalZone === 'EUROPEAN' && era < 1000) return 'stone';
    if (culturalZone === 'AFRICAN') return era < 1500 ? 'earth' : 'stone';
    return era < 1800 ? 'wood' : 'stone';
  };
  
  const material = getMaterialType();
  const colors = getMaterialColors(material, culturalZone);
  
  // Simple double-line style like Stardew Valley
  const lineThickness = 2;
  const gapSize = 2;
  const shadowOffset = 1;
  
  const renderNorthWall = () => (
    <>
      {/* Main wall lines */}
      <line
        x1={0}
        y1={size - lineThickness - gapSize}
        x2={size}
        y2={size - lineThickness - gapSize}
        stroke={colors.base}
        strokeWidth={lineThickness}
      />
      <line
        x1={0}
        y1={size - lineThickness}
        x2={size}
        y2={size - lineThickness}
        stroke={colors.shadow}
        strokeWidth={lineThickness}
      />
    </>
  );
  
  const renderSouthWall = () => (
    <>
      {/* Shadow line */}
      <line
        x1={0}
        y1={lineThickness + shadowOffset}
        x2={size}
        y2={lineThickness + shadowOffset}
        stroke={colors.shadow}
        strokeWidth={1}
        opacity="0.3"
      />
      {/* Main wall lines */}
      <line
        x1={0}
        y1={lineThickness}
        x2={size}
        y2={lineThickness}
        stroke={colors.base}
        strokeWidth={lineThickness}
      />
      <line
        x1={0}
        y1={lineThickness + gapSize}
        x2={size}
        y2={lineThickness + gapSize}
        stroke={colors.shadow}
        strokeWidth={lineThickness}
      />
    </>
  );
  
  const renderEastWall = () => (
    <>
      {/* Shadow */}
      <line
        x1={size - lineThickness - gapSize - shadowOffset}
        y1={0}
        x2={size - lineThickness - gapSize - shadowOffset}
        y2={size}
        stroke={colors.shadow}
        strokeWidth={1}
        opacity="0.3"
      />
      {/* Main wall lines */}
      <line
        x1={size - lineThickness - gapSize}
        y1={0}
        x2={size - lineThickness - gapSize}
        y2={size}
        stroke={colors.base}
        strokeWidth={lineThickness}
      />
      <line
        x1={size - lineThickness}
        y1={0}
        x2={size - lineThickness}
        y2={size}
        stroke={colors.shadow}
        strokeWidth={lineThickness}
      />
    </>
  );
  
  const renderWestWall = () => (
    <>
      {/* Main wall lines */}
      <line
        x1={lineThickness}
        y1={0}
        x2={lineThickness}
        y2={size}
        stroke={colors.base}
        strokeWidth={lineThickness}
      />
      <line
        x1={lineThickness + gapSize}
        y1={0}
        x2={lineThickness + gapSize}
        y2={size}
        stroke={colors.shadow}
        strokeWidth={lineThickness}
      />
    </>
  );
  
  const renderCorner = () => {
    const cornerSize = 6;
    const cornerX = corner?.includes('w') ? 0 : size - cornerSize;
    const cornerY = corner?.includes('n') ? 0 : size - cornerSize;
    
    return (
      <rect
        x={cornerX}
        y={cornerY}
        width={cornerSize}
        height={cornerSize}
        fill={colors.shadow}
      />
    );
  };
  
  // Add subtle texture based on material
  const renderTexture = () => {
    if (material === 'wood') {
      // Simple wood grain lines
      return (
        <g opacity="0.1">
          {side === 'north' || side === 'south' ? (
            <>
              <line x1={size * 0.3} y1={0} x2={size * 0.3} y2={size} stroke={colors.shadow} strokeWidth="0.5" />
              <line x1={size * 0.7} y1={0} x2={size * 0.7} y2={size} stroke={colors.shadow} strokeWidth="0.5" />
            </>
          ) : (
            <>
              <line x1={0} y1={size * 0.3} x2={size} y2={size * 0.3} stroke={colors.shadow} strokeWidth="0.5" />
              <line x1={0} y1={size * 0.7} x2={size} y2={size * 0.7} stroke={colors.shadow} strokeWidth="0.5" />
            </>
          )}
        </g>
      );
    }
    return null;
  };
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Base tile (mostly transparent) */}
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill="transparent"
      />
      
      {/* Render appropriate wall based on side */}
      {side === 'north' && renderNorthWall()}
      {side === 'south' && renderSouthWall()}
      {side === 'east' && renderEastWall()}
      {side === 'west' && renderWestWall()}
      
      {/* Render corner if specified */}
      {corner && renderCorner()}
      
      {/* Add subtle texture */}
      {renderTexture()}
    </g>
  );
};