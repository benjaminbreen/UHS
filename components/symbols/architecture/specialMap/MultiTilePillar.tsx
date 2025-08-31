/**
 * MultiTilePillar.tsx
 * Renders tall pillars that span multiple tiles vertically
 * Part of the multi-tile object system for special maps
 */

import React from 'react';

interface MultiTilePillarProps {
  x: number;
  y: number;
  height: number; // Number of tiles tall (2-4)
  material: 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel';
  tileWidth: number;
  tileHeight: number;
  offsetX: number;
  offsetY: number;
}

const MATERIAL_COLORS = {
  white_marble: {
    base: '#f8f8f6',
    shadow: '#d4d4d0',
    highlight: '#ffffff',
    detail: '#e8e8e4'
  },
  grey_stone: {
    base: '#8a8a8a',
    shadow: '#5a5a5a',
    highlight: '#a8a8a8',
    detail: '#7a7a7a'
  },
  red_lacquer: {
    base: '#8b2222',
    shadow: '#5b1212',
    highlight: '#ab3232',
    detail: '#7b1c1c'
  },
  sandstone: {
    base: '#c4a572',
    shadow: '#947852',
    highlight: '#d4b582',
    detail: '#b49562'
  },
  wood: {
    base: '#8b6f47',
    shadow: '#6b4f37',
    highlight: '#9b7f57',
    detail: '#7b5f37'
  },
  steel: {
    base: '#b0b0c0',
    shadow: '#808090',
    highlight: '#d0d0e0',
    detail: '#9090a0'
  }
};

export const MultiTilePillar: React.FC<MultiTilePillarProps> = ({
  x,
  y,
  height,
  material,
  tileWidth,
  tileHeight,
  offsetX,
  offsetY
}) => {
  const colors = MATERIAL_COLORS[material];
  const worldX = x * tileWidth + offsetX;
  const worldY = y * tileHeight + offsetY;
  
  // Pillar dimensions
  const pillarWidth = tileWidth * 0.7;
  const pillarDepth = tileHeight * 0.4;
  const totalHeight = tileHeight * height;
  
  // Center the pillar in the tile
  const pillarX = worldX + (tileWidth - pillarWidth) / 2;
  const pillarY = worldY - (totalHeight - tileHeight); // Extend upward
  
  // Generate decorative elements based on material
  const renderDecoration = () => {
    if (material === 'white_marble' || material === 'grey_stone') {
      // Classical fluting for stone/marble
      return (
        <>
          {/* Vertical flutes */}
          {[0, 1, 2].map(i => (
            <line
              key={`flute-${i}`}
              x1={pillarX + pillarWidth * 0.25 + i * pillarWidth * 0.25}
              y1={pillarY + totalHeight * 0.15}
              x2={pillarX + pillarWidth * 0.25 + i * pillarWidth * 0.25}
              y2={pillarY + totalHeight * 0.85}
              stroke={colors.shadow}
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
        </>
      );
    } else if (material === 'red_lacquer') {
      // Asian-style bands
      return (
        <>
          {[0.3, 0.5, 0.7].map(ratio => (
            <rect
              key={`band-${ratio}`}
              x={pillarX}
              y={pillarY + totalHeight * ratio - 2}
              width={pillarWidth}
              height="4"
              fill={colors.detail}
            />
          ))}
        </>
      );
    } else if (material === 'wood') {
      // Wood grain texture
      return (
        <>
          {[0.2, 0.4, 0.6, 0.8].map(ratio => (
            <line
              key={`grain-${ratio}`}
              x1={pillarX + 2}
              y1={pillarY + totalHeight * ratio}
              x2={pillarX + pillarWidth - 2}
              y2={pillarY + totalHeight * ratio + 3}
              stroke={colors.shadow}
              strokeWidth="0.5"
              opacity="0.2"
            />
          ))}
        </>
      );
    }
    return null;
  };
  
  return (
    <g className="multi-tile-pillar">
      {/* Base shadow */}
      <ellipse
        cx={worldX + tileWidth / 2}
        cy={worldY + tileHeight * 0.9}
        rx={pillarWidth / 2}
        ry={pillarDepth / 4}
        fill="rgba(0, 0, 0, 0.2)"
      />
      
      {/* Capital (top) */}
      <rect
        x={pillarX - pillarWidth * 0.15}
        y={pillarY}
        width={pillarWidth * 1.3}
        height={totalHeight * 0.1}
        fill={colors.base}
      />
      <rect
        x={pillarX - pillarWidth * 0.15}
        y={pillarY + totalHeight * 0.05}
        width={pillarWidth * 1.3}
        height={2}
        fill={colors.shadow}
      />
      
      {/* Main shaft */}
      <rect
        x={pillarX}
        y={pillarY + totalHeight * 0.1}
        width={pillarWidth}
        height={totalHeight * 0.8}
        fill={colors.base}
      />
      
      {/* Left edge highlight */}
      <rect
        x={pillarX}
        y={pillarY + totalHeight * 0.1}
        width={2}
        height={totalHeight * 0.8}
        fill={colors.highlight}
        opacity="0.6"
      />
      
      {/* Right edge shadow */}
      <rect
        x={pillarX + pillarWidth - 2}
        y={pillarY + totalHeight * 0.1}
        width={2}
        height={totalHeight * 0.8}
        fill={colors.shadow}
        opacity="0.6"
      />
      
      {/* Decorative elements */}
      {renderDecoration()}
      
      {/* Base */}
      <rect
        x={pillarX - pillarWidth * 0.1}
        y={pillarY + totalHeight * 0.9}
        width={pillarWidth * 1.2}
        height={totalHeight * 0.1}
        fill={colors.base}
      />
      <rect
        x={pillarX - pillarWidth * 0.1}
        y={pillarY + totalHeight * 0.9}
        width={pillarWidth * 1.2}
        height={2}
        fill={colors.highlight}
      />
    </g>
  );
};