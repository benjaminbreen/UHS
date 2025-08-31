/**
 * FloorTileSymbol2D.tsx
 * Pure top-down floor tiles with rich textures and materials
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';
import { 
  getMaterialColors,
  generateWoodGrain,
  generateStoneTexture,
  lightenColor,
  CULTURAL_PALETTES 
} from './utils/Symbol2DUtils';

interface FloorTileSymbol2DProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  floorType?: 'wood' | 'stone' | 'tile' | 'marble' | 'carpet' | 'dirt';
  seed?: number;
}

export const FloorTileSymbol2D: React.FC<FloorTileSymbol2DProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  floorType,
  seed = 0
}) => {
  // Determine floor type based on culture and era if not specified
  const getDefaultFloorType = () => {
    if (floorType) return floorType;
    
    if (culturalZone === 'EAST_ASIAN' && era < 1900) {
      return 'wood'; // Tatami or wood
    } else if (culturalZone === 'MENA') {
      return era < 1000 ? 'stone' : 'tile';
    } else if (culturalZone === 'EUROPEAN') {
      if (era < 500) return 'stone';
      if (era < 1500) return 'wood';
      return 'tile';
    } else if (culturalZone === 'AFRICAN') {
      return era < 1500 ? 'dirt' : 'tile';
    }
    return 'wood';
  };
  
  const type = getDefaultFloorType();
  const palette = CULTURAL_PALETTES[culturalZone as keyof typeof CULTURAL_PALETTES] || CULTURAL_PALETTES.EUROPEAN;
  
  // Render wood floor with planks
  const renderWoodFloor = () => {
    const plankWidth = size / 4;
    const planks = [];
    
    for (let i = 0; i < 4; i++) {
      const baseColor = i % 2 === 0 ? palette.primary : palette.secondary;
      planks.push(
        <g key={`plank-${i}`}>
          <rect
            x={i * plankWidth}
            y={0}
            width={plankWidth}
            height={size}
            fill={baseColor}
          />
          {/* Wood grain lines */}
          <line
            x1={i * plankWidth + plankWidth * 0.3}
            y1={0}
            x2={i * plankWidth + plankWidth * 0.3}
            y2={size}
            stroke={palette.accent}
            strokeWidth="0.3"
            opacity="0.2"
          />
          <line
            x1={i * plankWidth + plankWidth * 0.7}
            y1={0}
            x2={i * plankWidth + plankWidth * 0.7}
            y2={size}
            stroke={palette.accent}
            strokeWidth="0.3"
            opacity="0.2"
          />
          {/* Plank ends */}
          {seed % 3 === i % 3 && (
            <>
              <line
                x1={i * plankWidth}
                y1={size * 0.3}
                x2={(i + 1) * plankWidth}
                y2={size * 0.3}
                stroke={palette.accent}
                strokeWidth="0.5"
                opacity="0.3"
              />
              <line
                x1={i * plankWidth}
                y1={size * 0.7}
                x2={(i + 1) * plankWidth}
                y2={size * 0.7}
                stroke={palette.accent}
                strokeWidth="0.5"
                opacity="0.3"
              />
            </>
          )}
        </g>
      );
    }
    
    return planks;
  };
  
  // Render stone floor - SIMPLIFIED for performance
  const renderStoneFloor = () => {
    const stoneColor = palette.stone || '#808080';
    
    return (
      <>
        {/* Base stone color */}
        <rect 
          x={0} 
          y={0} 
          width={size} 
          height={size} 
          fill={stoneColor} 
        />
        {/* Simple grid pattern for stone tiles */}
        <g opacity="0.3">
          <line x1={size * 0.33} y1={0} x2={size * 0.33} y2={size} stroke="#606060" strokeWidth="0.5" />
          <line x1={size * 0.66} y1={0} x2={size * 0.66} y2={size} stroke="#606060" strokeWidth="0.5" />
          <line x1={0} y1={size * 0.33} x2={size} y2={size * 0.33} stroke="#606060" strokeWidth="0.5" />
          <line x1={0} y1={size * 0.66} x2={size} y2={size * 0.66} stroke="#606060" strokeWidth="0.5" />
        </g>
        {/* Single subtle texture */}
        <rect 
          x={0} 
          y={0} 
          width={size} 
          height={size} 
          fill="#696969" 
          opacity="0.1"
        />
      </>
    );
  };
  
  // Render ceramic tile floor - SIMPLIFIED for performance
  const renderTileFloor = () => {
    const tileSize = size / 2;
    const tiles = [];
    
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const isPrimary = (row + col) % 2 === 0;
        tiles.push(
          <rect
            key={`tile-${row}-${col}`}
            x={col * tileSize}
            y={row * tileSize}
            width={tileSize}
            height={tileSize}
            fill={isPrimary ? palette.primary : palette.secondary}
            stroke={palette.accent}
            strokeWidth="0.3"
            opacity="0.9"
          />
        );
      }
    }
    
    return tiles;
  };
  
  // Render marble floor with veining
  const renderMarbleFloor = () => {
    return (
      <>
        <rect x={0} y={0} width={size} height={size} fill="#F5F5F5" />
        {/* Veining pattern */}
        <path
          d={`M 0 ${size * 0.3} Q ${size * 0.3} ${size * 0.4}, ${size * 0.6} ${size * 0.3} T ${size} ${size * 0.4}`}
          stroke="#E0E0E0"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
        <path
          d={`M ${size * 0.2} 0 Q ${size * 0.3} ${size * 0.3}, ${size * 0.4} ${size * 0.6} T ${size * 0.5} ${size}`}
          stroke="#E0E0E0"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
        />
        {/* Subtle gradient for depth */}
        <rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill="url(#marbleGradient)"
          opacity="0.1"
        />
      </>
    );
  };
  
  // Render carpet with textile texture
  const renderCarpetFloor = () => {
    const pattern = [];
    
    // Base carpet
    pattern.push(
      <rect
        key="base"
        x={2}
        y={2}
        width={size - 4}
        height={size - 4}
        fill={palette.fabric || '#8B0000'}
      />
    );
    
    // Border
    pattern.push(
      <rect
        key="border"
        x={2}
        y={2}
        width={size - 4}
        height={size - 4}
        fill="none"
        stroke={palette.accent}
        strokeWidth="2"
      />
    );
    
    // Inner border
    pattern.push(
      <rect
        key="inner-border"
        x={4}
        y={4}
        width={size - 8}
        height={size - 8}
        fill="none"
        stroke={palette.secondary}
        strokeWidth="1"
      />
    );
    
    // Center pattern
    if (culturalZone === 'MENA' || culturalZone === 'AFRICAN') {
      pattern.push(
        <g key="center-pattern">
          <polygon
            points={`${size/2},${size*0.3} ${size*0.65},${size/2} ${size/2},${size*0.7} ${size*0.35},${size/2}`}
            fill={palette.accent}
            opacity="0.3"
          />
        </g>
      );
    }
    
    // Fringe texture at edges
    for (let i = 0; i < 8; i++) {
      pattern.push(
        <line
          key={`fringe-top-${i}`}
          x1={4 + i * (size - 8) / 8}
          y1={2}
          x2={4 + i * (size - 8) / 8}
          y2={0}
          stroke={palette.fabric || '#8B0000'}
          strokeWidth="1"
          opacity="0.6"
        />
      );
      pattern.push(
        <line
          key={`fringe-bottom-${i}`}
          x1={4 + i * (size - 8) / 8}
          y1={size - 2}
          x2={4 + i * (size - 8) / 8}
          y2={size}
          stroke={palette.fabric || '#8B0000'}
          strokeWidth="1"
          opacity="0.6"
        />
      );
    }
    
    return pattern;
  };
  
  // Render dirt floor
  const renderDirtFloor = () => {
    return (
      <>
        <rect x={0} y={0} width={size} height={size} fill="#8B7355" />
        {/* Add texture */}
        {generateStoneTexture(size, size, '#6B5D4F', seed)}
        {/* Worn path effect */}
        <ellipse
          cx={size / 2}
          cy={size / 2}
          rx={size * 0.3}
          ry={size * 0.2}
          fill="#7B6345"
          opacity="0.3"
        />
      </>
    );
  };
  
  // Standard gray background to prevent terrain bleed
  const standardGray = '#8a8a8a';
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id="marbleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0E0E0" />
        </linearGradient>
      </defs>
      
      {/* Gray background to prevent color bleed */}
      <rect x={0} y={0} width={size} height={size} fill={standardGray} />
      
      {type === 'wood' && renderWoodFloor()}
      {type === 'stone' && renderStoneFloor()}
      {type === 'tile' && renderTileFloor()}
      {type === 'marble' && renderMarbleFloor()}
      {type === 'carpet' && renderCarpetFloor()}
      {type === 'dirt' && renderDirtFloor()}
    </g>
  );
};