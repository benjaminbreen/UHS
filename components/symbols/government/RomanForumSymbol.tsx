/**
 * components/symbols/government/RomanForumSymbol.tsx - Roman Forum and civic center building
 */
import React from 'react';
import { Tile } from '../../../types';

interface RomanForumSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'roman' | 'persian' | 'greek';
}

const RomanForumSymbol: React.FC<RomanForumSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'roman' 
}) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const buildingSize = size * 0.7;
  
  // Color variations by culture
  const getColors = () => {
    switch (variant) {
      case 'persian':
        return {
          base: '#D4A574', // Sandy stone
          accent: '#B8860B', // Dark goldenrod
          columns: '#F5DEB3' // Wheat
        };
      case 'greek':
        return {
          base: '#F5F5DC', // Beige
          accent: '#CD853F', // Peru
          columns: '#FFFACD' // Lemon chiffon
        };
      default: // roman
        return {
          base: '#D2B48C', // Tan
          accent: '#A0522D', // Sienna
          columns: '#F5DEB3' // Wheat
        };
    }
  };

  const colors = getColors();
  
  const elements: JSX.Element[] = [];

  // Main building base (rectangular)
  elements.push(
    <rect
      key="forum-base"
      x={centerX - buildingSize/2}
      y={centerY - buildingSize/3}
      width={buildingSize}
      height={buildingSize/1.5}
      fill={colors.base}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Colonnade (row of columns across the front)
  const numColumns = 5;
  const columnSpacing = buildingSize / (numColumns + 1);
  for (let i = 1; i <= numColumns; i++) {
    const columnX = centerX - buildingSize/2 + (i * columnSpacing);
    const columnY = centerY - buildingSize/3;
    
    elements.push(
      <g key={`column-${i}`}>
        {/* Column shaft */}
        <rect
          x={columnX - 3}
          y={columnY}
          width="6"
          height={buildingSize/1.5}
          fill={colors.columns}
        />
        {/* Capital (top) */}
        <rect
          x={columnX - 5}
          y={columnY}
          width="10"
          height="4"
          fill={colors.accent}
        />
      </g>
    );
  }

  // Triangular pediment (roof)
  const roofY = centerY - buildingSize/3;
  elements.push(
    <polygon
      key="pediment"
      points={`${centerX - buildingSize/2 - 5},${roofY} ${centerX},${roofY - size * 0.15} ${centerX + buildingSize/2 + 5},${roofY}`}
      fill={colors.accent}
      stroke={colors.base}
      strokeWidth="1"
    />
  );

  // Steps leading up to the building
  elements.push(
    <rect
      key="steps"
      x={centerX - buildingSize/2 - 2}
      y={centerY + buildingSize/6}
      width={buildingSize + 4}
      height="4"
      fill={colors.accent}
      opacity="0.7"
    />
  );

  // Central doorway
  elements.push(
    <rect
      key="doorway"
      x={centerX - size * 0.08}
      y={centerY - buildingSize/6}
      width={size * 0.16}
      height={buildingSize/3}
      fill={colors.accent}
      opacity="0.8"
    />
  );

  // Side wings (for larger forums)
  if (buildingSize > size * 0.6) {
    // Left wing
    elements.push(
      <rect
        key="left-wing"
        x={centerX - buildingSize/2 - size * 0.12}
        y={centerY - buildingSize/6}
        width={size * 0.12}
        height={buildingSize/2}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="1"
        opacity="0.9"
      />
    );
    
    // Right wing
    elements.push(
      <rect
        key="right-wing"
        x={centerX + buildingSize/2}
        y={centerY - buildingSize/6}
        width={size * 0.12}
        height={buildingSize/2}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="1"
        opacity="0.9"
      />
    );
  }

  return (
    <g>
      {elements}
      {/* Building label for debugging/tooltips */}
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(RomanForumSymbol);