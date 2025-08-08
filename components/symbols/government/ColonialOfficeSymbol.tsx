/**
 * components/symbols/government/ColonialOfficeSymbol.tsx - Colonial administrative buildings
 */
import React from 'react';
import { Tile } from '../../../types';

interface ColonialOfficeSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'british' | 'spanish' | 'dutch' | 'french' | 'portuguese' | 'raj' | 'eastern' | 'australian' | 'pacific' | 'coastal';
}

const ColonialOfficeSymbol: React.FC<ColonialOfficeSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'british' 
}) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const buildingSize = size * 0.8;
  
  // Color variations by colonial power and region
  const getColors = () => {
    switch (variant) {
      case 'spanish':
        return {
          base: '#F5DEB3', // Wheat (adobe/stucco)
          roof: '#CD853F', // Peru (terracotta tiles)
          accent: '#A0522D', // Sienna
          details: '#DAA520' // Goldenrod
        };
      case 'dutch':
        return {
          base: '#DEB887', // Burlywood (brick)
          roof: '#8B0000', // Dark red tiles
          accent: '#654321', // Dark brown
          details: '#FF4500' // Orange red
        };
      case 'french':
        return {
          base: '#F5F5DC', // Beige
          roof: '#696969', // Dim gray (slate)
          accent: '#2F4F4F', // Dark slate gray
          details: '#4169E1' // Royal blue
        };
      case 'portuguese':
        return {
          base: '#FFFACD', // Lemon chiffon
          roof: '#CD853F', // Peru
          accent: '#B8860B', // Dark goldenrod
          details: '#228B22' // Forest green
        };
      case 'raj':
        return {
          base: '#FFFACD', // Lemon chiffon (white stone)
          roof: '#8B0000', // Dark red
          accent: '#DAA520', // Goldenrod
          details: '#4169E1' // Royal blue
        };
      case 'eastern':
        return {
          base: '#F0E68C', // Khaki
          roof: '#8B4513', // Saddle brown
          accent: '#A0522D', // Sienna
          details: '#DC143C' // Crimson
        };
      default: // british
        return {
          base: '#F5F5DC', // Beige (limestone)
          roof: '#696969', // Dim gray (slate)
          accent: '#2F4F4F', // Dark slate gray
          details: '#B8860B' // Dark goldenrod
        };
    }
  };

  const colors = getColors();
  const elements: JSX.Element[] = [];

  // Main colonial building (formal European style with adaptations)
  elements.push(
    <rect
      key="main-building"
      x={centerX - buildingSize/2}
      y={centerY - buildingSize/3}
      width={buildingSize}
      height={buildingSize/1.5}
      fill={colors.base}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Colonial style roof (varies by region)
  if (variant === 'spanish' || variant === 'portuguese') {
    // Red tile roof with slight curve
    elements.push(
      <path
        key="tile-roof"
        d={`M ${centerX - buildingSize/2 - 2} ${centerY - buildingSize/3}
            Q ${centerX} ${centerY - buildingSize/2.5}
            ${centerX + buildingSize/2 + 2} ${centerY - buildingSize/3}`}
        fill={colors.roof}
        stroke={colors.accent}
        strokeWidth="1"
      />
    );
  } else {
    // Standard European gabled roof
    elements.push(
      <polygon
        key="gabled-roof"
        points={`${centerX - buildingSize/2 - 2},${centerY - buildingSize/3} ${centerX},${centerY - buildingSize/2.2} ${centerX + buildingSize/2 + 2},${centerY - buildingSize/3}`}
        fill={colors.roof}
        stroke={colors.accent}
        strokeWidth="1"
      />
    );
  }

  // Colonial portico or veranda (tropical adaptation)
  if (variant === 'raj' || variant === 'eastern' || variant === 'australian' || variant === 'pacific') {
    elements.push(
      <g key="veranda">
        <rect
          x={centerX - buildingSize/2 - 4}
          y={centerY + buildingSize/6}
          width={buildingSize + 8}
          height="6"
          fill={colors.base}
          stroke={colors.accent}
          strokeWidth="1"
          opacity="0.8"
        />
        {/* Veranda columns */}
        {[-2, -1, 0, 1, 2].map(i => (
          <rect
            key={`veranda-col-${i}`}
            x={centerX + i * (buildingSize/5) - 2}
            y={centerY - buildingSize/6}
            width="4"
            height={buildingSize/2.5}
            fill={colors.accent}
          />
        ))}
      </g>
    );
  }

  // Flag pole (colonial authority symbol)
  elements.push(
    <g key="flagpole">
      <rect
        x={centerX + buildingSize/3}
        y={centerY - buildingSize/2}
        width="2"
        height={buildingSize}
        fill={colors.accent}
      />
      {/* Flag - different colors by colonial power */}
      <rect
        x={centerX + buildingSize/3 + 2}
        y={centerY - buildingSize/2 + 5}
        width="12"
        height="8"
        fill={variant === 'british' ? '#FF0000' : 
              variant === 'spanish' ? '#FFD700' :
              variant === 'dutch' ? '#FF4500' :
              variant === 'french' ? '#0000FF' :
              variant === 'portuguese' ? '#228B22' : '#FF0000'}
      />
    </g>
  );

  // Grand entrance with colonial details
  elements.push(
    <g key="entrance">
      <rect
        x={centerX - size * 0.12}
        y={centerY - buildingSize/8}
        width={size * 0.24}
        height={buildingSize/2.5}
        fill={colors.accent}
      />
      {/* Classical pediment over doorway */}
      <polygon
        points={`${centerX - size * 0.12},${centerY - buildingSize/8} ${centerX},${centerY - buildingSize/6} ${centerX + size * 0.12},${centerY - buildingSize/8}`}
        fill={colors.details}
        opacity="0.8"
      />
    </g>
  );

  // Symmetrical windows (European colonial order)
  const windowRows = [
    { y: centerY - buildingSize/5, count: 6 },
    { y: centerY + buildingSize/20, count: 6 }
  ];

  windowRows.forEach((row, rowIndex) => {
    for (let i = 0; i < row.count; i++) {
      const windowX = centerX - buildingSize/2 + (i + 1) * (buildingSize / (row.count + 1));
      if (Math.abs(windowX - centerX) > size * 0.12) { // Skip entrance area
        elements.push(
          <rect
            key={`window-${rowIndex}-${i}`}
            x={windowX - 4}
            y={row.y}
            width="8"
            height="14"
            fill={colors.details}
            stroke={colors.accent}
            strokeWidth="1"
          />
        );
        // Window shutters (tropical adaptation)
        if (variant === 'raj' || variant === 'eastern' || variant === 'pacific') {
          elements.push(
            <g key={`shutters-${rowIndex}-${i}`}>
              <rect x={windowX - 6} y={row.y} width="2" height="14" fill={colors.accent} />
              <rect x={windowX + 4} y={row.y} width="2" height="14" fill={colors.accent} />
            </g>
          );
        }
      }
    }
  });

  // Colonial coat of arms or administrative seal
  elements.push(
    <g key="colonial-seal">
      <circle
        cx={centerX}
        cy={centerY - buildingSize/4}
        r="6"
        fill={colors.details}
        stroke={colors.accent}
        strokeWidth="1"
      />
      {/* Crown symbol for monarchy or republican symbol */}
      <polygon
        points={`${centerX-3},${centerY - buildingSize/4} ${centerX},${centerY - buildingSize/4 - 3} ${centerX+3},${centerY - buildingSize/4}`}
        fill={colors.accent}
      />
    </g>
  );

  // Side administrative wings
  elements.push(
    <g key="admin-wings">
      <rect
        x={centerX - buildingSize/2 - size * 0.08}
        y={centerY - buildingSize/6}
        width={size * 0.08}
        height={buildingSize/3}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="1"
        opacity="0.9"
      />
      <rect
        x={centerX + buildingSize/2}
        y={centerY - buildingSize/6}
        width={size * 0.08}
        height={buildingSize/3}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="1"
        opacity="0.9"
      />
    </g>
  );

  return (
    <g>
      {elements}
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(ColonialOfficeSymbol);