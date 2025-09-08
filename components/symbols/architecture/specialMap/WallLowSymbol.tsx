/**
 * WallLowSymbol.tsx
 * Low walls for tribal structures, courtyards, and barriers
 */

import React from 'react';
import { BiomeType } from '../../../../types';

interface WallLowSymbolProps {
  biome: BiomeType;
  x: number;
  y: number;
  tileSize: number;
  materialSubtype?: string;
  zoom?: number;
}

const WallLowSymbol: React.FC<WallLowSymbolProps> = ({ 
  biome, 
  x, 
  y, 
  tileSize,
  materialSubtype = 'stone',
  zoom = 1
}) => {
  // Scale wall height based on zoom
  const wallHeight = tileSize * 0.4; // Lower than full walls
  
  // Determine material colors based on subtype
  const getMaterialColors = () => {
    switch (materialSubtype) {
      case 'wooden_palisade':
        return {
          main: '#8B4513',
          dark: '#654321',
          light: '#A0522D',
          top: '#6B3410'
        };
      case 'stone_circle':
        return {
          main: '#8B8680',
          dark: '#696963',
          light: '#A09E97',
          top: '#7A7670'
        };
      case 'mud_brick':
        return {
          main: '#C19A6B',
          dark: '#A67C52',
          light: '#D4AF8C',
          top: '#B8885A'
        };
      case 'office_partition':
        return {
          main: '#E8E8E8',
          dark: '#CCCCCC',
          light: '#F5F5F5',
          top: '#DDDDDD'
        };
      case 'wooden_rail':
        return {
          main: '#8B6F47',
          dark: '#6B5637',
          light: '#9B7F57',
          top: '#7B5F37'
        };
      default: // stone
        return {
          main: '#9E9E9E',
          dark: '#7E7E7E',
          light: '#BEBEBE',
          top: '#8E8E8E'
        };
    }
  };
  
  const colors = getMaterialColors();
  
  return (
    <g transform={`translate(${x * tileSize}, ${y * tileSize})`}>
      {/* Base/ground level */}
      <rect
        x={0}
        y={tileSize - wallHeight}
        width={tileSize}
        height={wallHeight}
        fill={colors.main}
      />
      
      {/* Top edge */}
      <rect
        x={0}
        y={tileSize - wallHeight}
        width={tileSize}
        height={wallHeight * 0.2}
        fill={colors.top}
      />
      
      {/* Light edge (left) */}
      <rect
        x={0}
        y={tileSize - wallHeight}
        width={2}
        height={wallHeight}
        fill={colors.light}
        opacity={0.6}
      />
      
      {/* Dark edge (right) */}
      <rect
        x={tileSize - 2}
        y={tileSize - wallHeight}
        width={2}
        height={wallHeight}
        fill={colors.dark}
        opacity={0.6}
      />
      
      {/* Add texture for certain materials */}
      {materialSubtype === 'wooden_palisade' && (
        <>
          {/* Vertical wood planks */}
          {[0, 0.25, 0.5, 0.75].map((offset, i) => (
            <line
              key={i}
              x1={tileSize * offset}
              y1={tileSize - wallHeight}
              x2={tileSize * offset}
              y2={tileSize}
              stroke={colors.dark}
              strokeWidth={1}
              opacity={0.3}
            />
          ))}
        </>
      )}
      
      {materialSubtype === 'stone_circle' && (
        <>
          {/* Stone texture */}
          <rect
            x={tileSize * 0.2}
            y={tileSize - wallHeight + 2}
            width={tileSize * 0.3}
            height={wallHeight * 0.4}
            fill={colors.dark}
            opacity={0.2}
          />
          <rect
            x={tileSize * 0.6}
            y={tileSize - wallHeight + wallHeight * 0.5}
            width={tileSize * 0.25}
            height={wallHeight * 0.3}
            fill={colors.light}
            opacity={0.2}
          />
        </>
      )}
    </g>
  );
};

export default WallLowSymbol;