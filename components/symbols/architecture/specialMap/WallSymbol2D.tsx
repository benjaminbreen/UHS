/**
 * WallSymbol2D.tsx
 * Decorative back wall design for 2.5D special maps
 * Creates detailed north-facing walls with textures, decorations, windows, and paintings
 * Works in conjunction with WallBoundarySymbol2D for complete room enclosure
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';
import { 
  PERSPECTIVE_CONSTANTS, 
  getMaterialColors, 
  generateStoneTexture,
  CULTURAL_PALETTES 
} from './utils/Symbol2DUtils';

interface WallSymbol2DProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  wallPosition?: 'north' | 'corner_left' | 'corner_right';
  hasWindow?: boolean;
  hasPainting?: boolean;
  hasBookshelf?: boolean;
  hasTorch?: boolean;
  seed?: number;
}

export const WallSymbol2D: React.FC<WallSymbol2DProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  wallPosition = 'north',
  hasWindow = false,
  hasPainting = false,
  hasBookshelf = false,
  hasTorch = false,
  seed = 0
}) => {
  const wallHeight = PERSPECTIVE_CONSTANTS.WALL_HEIGHT;
  const baseboardHeight = 3;
  
  // Get wall style based on culture and era
  const getWallStyle = () => {
    if (culturalZone === 'EAST_ASIAN' && era < 1900) {
      return {
        material: 'paper',
        baseColor: '#FFF8DC',
        accentColor: '#8B4513',
        texture: 'grid'
      };
    } else if (culturalZone === 'MENA') {
      return {
        material: 'plaster',
        baseColor: CULTURAL_PALETTES.MENA.primary,
        accentColor: CULTURAL_PALETTES.MENA.accent,
        texture: 'smooth'
      };
    } else if (culturalZone === 'EUROPEAN' && era < 1500) {
      return {
        material: 'stone',
        baseColor: CULTURAL_PALETTES.EUROPEAN.stone,
        accentColor: CULTURAL_PALETTES.EUROPEAN.accent,
        texture: 'blocks'
      };
    }
    
    // Default: wooden panels
    return {
      material: 'wood',
      baseColor: CULTURAL_PALETTES[culturalZone as keyof typeof CULTURAL_PALETTES]?.secondary || '#8B4513',
      accentColor: CULTURAL_PALETTES[culturalZone as keyof typeof CULTURAL_PALETTES]?.primary || '#654321',
      texture: 'panels'
    };
  };
  
  const wallStyle = getWallStyle();
  
  // Render stone block texture
  const renderStoneBlocks = () => {
    const blocks = [];
    const blockWidth = size / 4;
    const blockHeight = wallHeight / 3;
    
    for (let row = 0; row < 3; row++) {
      const offset = row % 2 === 0 ? 0 : blockWidth / 2;
      for (let col = 0; col < 5; col++) {
        const x = col * blockWidth - offset;
        if (x < 0 || x + blockWidth > size) continue;
        
        blocks.push(
          <rect
            key={`block-${row}-${col}`}
            x={x}
            y={row * blockHeight}
            width={blockWidth}
            height={blockHeight}
            fill={wallStyle.baseColor}
            stroke={wallStyle.accentColor}
            strokeWidth="0.5"
            opacity="0.9"
          />
        );
      }
    }
    return blocks;
  };
  
  // Render wood panel texture
  const renderWoodPanels = () => {
    const panels = [];
    const panelWidth = size / 3;
    
    for (let i = 0; i < 3; i++) {
      panels.push(
        <g key={`panel-${i}`}>
          <rect
            x={i * panelWidth}
            y={baseboardHeight}
            width={panelWidth}
            height={wallHeight - baseboardHeight}
            fill={wallStyle.baseColor}
            stroke={wallStyle.accentColor}
            strokeWidth="0.5"
          />
          {/* Wood grain */}
          <line
            x1={i * panelWidth + panelWidth * 0.3}
            y1={baseboardHeight + 2}
            x2={i * panelWidth + panelWidth * 0.3}
            y2={wallHeight - 2}
            stroke={wallStyle.accentColor}
            strokeWidth="0.3"
            opacity="0.3"
          />
          <line
            x1={i * panelWidth + panelWidth * 0.7}
            y1={baseboardHeight + 2}
            x2={i * panelWidth + panelWidth * 0.7}
            y2={wallHeight - 2}
            stroke={wallStyle.accentColor}
            strokeWidth="0.3"
            opacity="0.3"
          />
        </g>
      );
    }
    return panels;
  };
  
  // Render paper/screen texture for East Asian style
  const renderPaperScreen = () => {
    const gridSize = size / 6;
    const lines = [];
    
    // Vertical lines
    for (let i = 1; i < 6; i++) {
      lines.push(
        <line
          key={`v-${i}`}
          x1={i * gridSize}
          y1={0}
          x2={i * gridSize}
          y2={wallHeight}
          stroke={wallStyle.accentColor}
          strokeWidth="1"
        />
      );
    }
    
    // Horizontal lines
    for (let i = 1; i < 3; i++) {
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * (wallHeight / 3)}
          x2={size}
          y2={i * (wallHeight / 3)}
          stroke={wallStyle.accentColor}
          strokeWidth="1"
        />
      );
    }
    
    return (
      <>
        <rect
          x={0}
          y={0}
          width={size}
          height={wallHeight}
          fill={wallStyle.baseColor}
          opacity="0.9"
        />
        {lines}
      </>
    );
  };
  
  // Render window if present
  const renderWindow = () => {
    if (!hasWindow) return null;
    
    const windowWidth = size * 0.3;
    const windowHeight = wallHeight * 0.6;
    const windowX = (size - windowWidth) / 2;
    const windowY = wallHeight * 0.2;
    
    return (
      <g>
        {/* Window frame */}
        <rect
          x={windowX - 2}
          y={windowY - 2}
          width={windowWidth + 4}
          height={windowHeight + 4}
          fill={wallStyle.accentColor}
        />
        {/* Window glass */}
        <rect
          x={windowX}
          y={windowY}
          width={windowWidth}
          height={windowHeight}
          fill="#87CEEB"
          opacity="0.6"
        />
        {/* Window cross */}
        <line
          x1={windowX + windowWidth / 2}
          y1={windowY}
          x2={windowX + windowWidth / 2}
          y2={windowY + windowHeight}
          stroke={wallStyle.accentColor}
          strokeWidth="1"
        />
        <line
          x1={windowX}
          y1={windowY + windowHeight / 2}
          x2={windowX + windowWidth}
          y2={windowY + windowHeight / 2}
          stroke={wallStyle.accentColor}
          strokeWidth="1"
        />
      </g>
    );
  };
  
  // Standard gray background to prevent terrain bleed
  const standardGray = '#8a8a8a';
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Gray background to prevent color bleed */}
      <rect x={0} y={0} width={size} height={size} fill={standardGray} />
      
      {/* Position wall at the top of the tile (back wall effect) */}
      <g transform={`translate(0, ${size - wallHeight})`}>
        {/* Main wall surface */}
        {wallStyle.texture === 'blocks' && renderStoneBlocks()}
        {wallStyle.texture === 'panels' && renderWoodPanels()}
        {wallStyle.texture === 'grid' && renderPaperScreen()}
        {wallStyle.texture === 'smooth' && (
          <rect
            x={0}
            y={0}
            width={size}
            height={wallHeight}
            fill={wallStyle.baseColor}
          />
        )}
        
        {/* Baseboard */}
        <rect
          x={0}
          y={wallHeight - baseboardHeight}
          width={size}
          height={baseboardHeight}
          fill={wallStyle.accentColor}
          opacity="0.8"
        />
        
        {/* Top edge highlight */}
        <line
          x1={0}
          y1={0}
          x2={size}
          y2={0}
          stroke={wallStyle.accentColor}
          strokeWidth="1"
          opacity="0.5"
        />
        
        {/* Window */}
        {renderWindow()}
        
        {/* Painting */}
        {hasPainting && (
          <g>
            <rect
              x={size * 0.6}
              y={wallHeight * 0.3}
              width={size * 0.25}
              height={wallHeight * 0.4}
              fill="#654321"
              stroke="#432818"
              strokeWidth="2"
            />
            <rect
              x={size * 0.62}
              y={wallHeight * 0.32}
              width={size * 0.21}
              height={wallHeight * 0.36}
              fill={culturalZone === 'EUROPEAN' ? '#2E5090' : '#8B4513'}
            />
            {/* Simple abstract art */}
            <circle
              cx={size * 0.725}
              cy={wallHeight * 0.5}
              r={3}
              fill={culturalZone === 'EUROPEAN' ? '#FFD700' : '#FF6347'}
            />
          </g>
        )}
        
        {/* Bookshelf inset */}
        {hasBookshelf && (
          <g>
            <rect
              x={size * 0.1}
              y={wallHeight * 0.2}
              width={size * 0.3}
              height={wallHeight * 0.6}
              fill="#4A3828"
              stroke="#2A1818"
              strokeWidth="1"
            />
            {/* Shelf lines */}
            <line x1={size * 0.1} y1={wallHeight * 0.4} x2={size * 0.4} y2={wallHeight * 0.4} stroke="#2A1818" strokeWidth="1" />
            <line x1={size * 0.1} y1={wallHeight * 0.6} x2={size * 0.4} y2={wallHeight * 0.6} stroke="#2A1818" strokeWidth="1" />
            {/* Books on shelves */}
            <rect x={size * 0.12} y={wallHeight * 0.22} width={4} height={wallHeight * 0.16} fill="#8B0000" />
            <rect x={size * 0.17} y={wallHeight * 0.23} width={3} height={wallHeight * 0.15} fill="#004B8B" />
            <rect x={size * 0.21} y={wallHeight * 0.22} width={4} height={wallHeight * 0.16} fill="#2E7D32" />
            <rect x={size * 0.26} y={wallHeight * 0.24} width={3} height={wallHeight * 0.14} fill="#8B4513" />
          </g>
        )}
        
        {/* Wall torch */}
        {hasTorch && (
          <g>
            {/* Torch holder */}
            <rect
              x={size * 0.85}
              y={wallHeight * 0.4}
              width={3}
              height={2}
              fill="#2F2F2F"
            />
            {/* Torch handle */}
            <rect
              x={size * 0.855}
              y={wallHeight * 0.25}
              width={2}
              height={wallHeight * 0.2}
              fill="#654321"
            />
            {/* Flame */}
            <ellipse
              cx={size * 0.865}
              cy={wallHeight * 0.22}
              rx={2}
              ry={3}
              fill="#FF4500"
              opacity="0.8"
            />
            <ellipse
              cx={size * 0.865}
              cy={wallHeight * 0.23}
              rx={1}
              ry={2}
              fill="#FFD700"
              opacity="0.9"
            />
          </g>
        )}
        
        {/* Corner variations */}
        {wallPosition === 'corner_left' && (
          <polygon
            points={`0,0 ${wallHeight},0 ${wallHeight},${wallHeight} 0,${wallHeight}`}
            fill={wallStyle.baseColor}
            stroke={wallStyle.accentColor}
            strokeWidth="1"
            opacity="0.7"
          />
        )}
        {wallPosition === 'corner_right' && (
          <polygon
            points={`${size},0 ${size - wallHeight},0 ${size - wallHeight},${wallHeight} ${size},${wallHeight}`}
            fill={wallStyle.baseColor}
            stroke={wallStyle.accentColor}
            strokeWidth="1"
            opacity="0.7"
          />
        )}
      </g>
    </g>
  );
};