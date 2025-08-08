/**
 * components/symbols/government/CityHallSymbol.tsx - Industrial era municipal buildings
 */
import React from 'react';
import { Tile } from '../../../types';

interface CityHallSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'victorian' | 'neoclassical' | 'colonial' | 'beaux_arts';
}

const CityHallSymbol: React.FC<CityHallSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'victorian' 
}) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const buildingSize = size * 0.85;
  
  // Color variations by architectural style
  const getColors = () => {
    switch (variant) {
      case 'neoclassical':
        return {
          base: '#FFFACD', // Lemon chiffon (white stone)
          roof: '#696969', // Dim gray
          accent: '#2F4F4F', // Dark slate gray
          details: '#DAA520' // Goldenrod
        };
      case 'colonial':
        return {
          base: '#DEB887', // Burlywood (red brick)
          roof: '#8B0000', // Dark red
          accent: '#F5F5DC', // Beige (white trim)
          details: '#4169E1' // Royal blue
        };
      case 'beaux_arts':
        return {
          base: '#F5F5DC', // Beige (limestone)
          roof: '#2F4F4F', // Dark slate gray
          accent: '#DAA520', // Goldenrod
          details: '#8B4513' // Saddle brown
        };
      default: // victorian
        return {
          base: '#DEB887', // Burlywood (brick)
          roof: '#696969', // Dim gray (slate)
          accent: '#F5DEB3', // Wheat (stone trim)
          details: '#B8860B' // Dark goldenrod
        };
    }
  };

  const colors = getColors();
  const elements: JSX.Element[] = [];

  // Main building (larger and more imposing than earlier eras)
  elements.push(
    <rect
      key="main-building"
      x={centerX - buildingSize/2}
      y={centerY - buildingSize/3}
      width={buildingSize}
      height={buildingSize/1.4}
      fill={colors.base}
      stroke={colors.accent}
      strokeWidth="3"
    />
  );

  // Prominent dome (characteristic of civic architecture)
  elements.push(
    <ellipse
      key="civic-dome"
      cx={centerX}
      cy={centerY - buildingSize/3}
      rx={buildingSize/3}
      ry={buildingSize/5}
      fill={colors.roof}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Cupola on top of dome
  elements.push(
    <rect
      key="cupola"
      x={centerX - buildingSize/12}
      y={centerY - buildingSize/3 - buildingSize/5 - 8}
      width={buildingSize/6}
      height="8"
      fill={colors.base}
      stroke={colors.accent}
      strokeWidth="1"
    />
  );

  // Weather vane or civic symbol on cupola
  elements.push(
    <g key="weather-vane">
      <line
        x1={centerX}
        y1={centerY - buildingSize/3 - buildingSize/5 - 8}
        x2={centerX}
        y2={centerY - buildingSize/3 - buildingSize/5 - 12}
        stroke={colors.details}
        strokeWidth="2"
      />
      <polygon
        points={`${centerX - 3},${centerY - buildingSize/3 - buildingSize/5 - 12} ${centerX + 6},${centerY - buildingSize/3 - buildingSize/5 - 10} ${centerX - 3},${centerY - buildingSize/3 - buildingSize/5 - 8}`}
        fill={colors.details}
      />
    </g>
  );

  // Grand columned entrance (neoclassical influence)
  const numColumns = 6;
  const columnSpacing = buildingSize * 0.6 / (numColumns - 1);
  
  // Entrance portico
  elements.push(
    <rect
      key="portico-base"
      x={centerX - buildingSize * 0.3}
      y={centerY + buildingSize/8}
      width={buildingSize * 0.6}
      height={buildingSize/6}
      fill={colors.base}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Columns
  for (let i = 0; i < numColumns; i++) {
    const columnX = centerX - buildingSize * 0.3 + (i * columnSpacing);
    elements.push(
      <g key={`column-${i}`}>
        <rect
          x={columnX - 3}
          y={centerY - buildingSize/6}
          width="6"
          height={buildingSize/3}
          fill={colors.accent}
        />
        {/* Column capital */}
        <rect
          x={columnX - 5}
          y={centerY - buildingSize/6}
          width="10"
          height="4"
          fill={colors.details}
        />
        {/* Column base */}
        <rect
          x={columnX - 4}
          y={centerY + buildingSize/6}
          width="8"
          height="3"
          fill={colors.details}
        />
      </g>
    );
  }

  // Triangular pediment above columns
  elements.push(
    <polygon
      key="pediment"
      points={`${centerX - buildingSize * 0.35},${centerY - buildingSize/6} ${centerX},${centerY - buildingSize/4} ${centerX + buildingSize * 0.35},${centerY - buildingSize/6}`}
      fill={colors.details}
      stroke={colors.accent}
      strokeWidth="1"
    />
  );

  // Central doorway
  elements.push(
    <rect
      key="main-entrance"
      x={centerX - size * 0.08}
      y={centerY}
      width={size * 0.16}
      height={buildingSize/4}
      fill={colors.accent}
      stroke={colors.details}
      strokeWidth="2"
    />
  );

  // Steps leading to entrance
  elements.push(
    <g key="entrance-steps">
      <rect
        x={centerX - buildingSize * 0.32}
        y={centerY + buildingSize/4}
        width={buildingSize * 0.64}
        height="3"
        fill={colors.accent}
        opacity="0.8"
      />
      <rect
        x={centerX - buildingSize * 0.34}
        y={centerY + buildingSize/4 + 3}
        width={buildingSize * 0.68}
        height="3"
        fill={colors.accent}
        opacity="0.6"
      />
    </g>
  );

  // Multiple rows of windows (industrial era standardization)
  const windowRows = [
    { y: centerY - buildingSize/4 + 8, count: 8 },
    { y: centerY - buildingSize/8, count: 8 },
    { y: centerY + buildingSize/16, count: 6 } // Fewer on ground floor due to entrance
  ];

  windowRows.forEach((row, rowIndex) => {
    for (let i = 0; i < row.count; i++) {
      const windowX = centerX - buildingSize/2 + 8 + (i * ((buildingSize - 16) / row.count));
      if (rowIndex === 2 && Math.abs(windowX - centerX) < size * 0.12) {
        // Skip entrance area on ground floor
        continue;
      }
      elements.push(
        <rect
          key={`window-${rowIndex}-${i}`}
          x={windowX - 5}
          y={row.y}
          width="10"
          height="16"
          fill={colors.details}
          stroke={colors.accent}
          strokeWidth="1"
        />
      );
      // Window cross (Victorian detail)
      if (variant === 'victorian') {
        elements.push(
          <g key={`window-cross-${rowIndex}-${i}`}>
            <line x1={windowX} y1={row.y} x2={windowX} y2={row.y + 16} stroke={colors.accent} strokeWidth="1" />
            <line x1={windowX - 5} y1={row.y + 8} x2={windowX + 5} y2={row.y + 8} stroke={colors.accent} strokeWidth="1" />
          </g>
        );
      }
    }
  });

  // Clock on facade (municipal importance)
  elements.push(
    <g key="municipal-clock">
      <circle
        cx={centerX}
        cy={centerY - buildingSize/8}
        r="8"
        fill={colors.details}
        stroke={colors.accent}
        strokeWidth="2"
      />
      {/* Clock hands */}
      <line x1={centerX} y1={centerY - buildingSize/8} x2={centerX} y2={centerY - buildingSize/8 - 6} stroke={colors.accent} strokeWidth="2" />
      <line x1={centerX} y1={centerY - buildingSize/8} x2={centerX + 4} y2={centerY - buildingSize/8} stroke={colors.accent} strokeWidth="1" />
    </g>
  );

  // Side wings (administrative expansion)
  elements.push(
    <g key="side-wings">
      <rect
        x={centerX - buildingSize/2 - size * 0.12}
        y={centerY - buildingSize/6}
        width={size * 0.12}
        height={buildingSize/2.5}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="2"
        opacity="0.9"
      />
      <rect
        x={centerX + buildingSize/2}
        y={centerY - buildingSize/6}
        width={size * 0.12}
        height={buildingSize/2.5}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="2"
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

export default React.memo(CityHallSymbol);