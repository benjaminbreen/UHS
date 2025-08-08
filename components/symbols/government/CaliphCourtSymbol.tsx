/**
 * components/symbols/government/CaliphCourtSymbol.tsx - Islamic court and administrative buildings
 */
import React from 'react';
import { Tile } from '../../../types';

interface CaliphCourtSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'abbasid' | 'ottoman' | 'mughal' | 'mamluk';
}

const CaliphCourtSymbol: React.FC<CaliphCourtSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'abbasid' 
}) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const buildingSize = size * 0.8;
  
  // Color variations by Islamic architectural tradition
  const getColors = () => {
    switch (variant) {
      case 'ottoman':
        return {
          base: '#F5F5DC', // Beige stone
          dome: '#4682B4', // Steel blue
          accent: '#DAA520', // Goldenrod
          details: '#FF6347' // Tomato (Ottoman red)
        };
      case 'mughal':
        return {
          base: '#FFFACD', // Lemon chiffon (white marble)
          dome: '#FFB6C1', // Light pink
          accent: '#DAA520', // Goldenrod
          details: '#8A2BE2' // Blue violet
        };
      case 'mamluk':
        return {
          base: '#DEB887', // Burlywood (sandstone)
          dome: '#20B2AA', // Light sea green
          accent: '#B8860B', // Dark goldenrod
          details: '#DC143C' // Crimson
        };
      default: // abbasid
        return {
          base: '#F4A460', // Sandy brown
          dome: '#4169E1', // Royal blue
          accent: '#DAA520', // Goldenrod
          details: '#8B4513' // Saddle brown
        };
    }
  };

  const colors = getColors();
  const elements: JSX.Element[] = [];

  // Main courtyard building (rectangular)
  elements.push(
    <rect
      key="main-court"
      x={centerX - buildingSize/2}
      y={centerY - buildingSize/4}
      width={buildingSize}
      height={buildingSize/2}
      fill={colors.base}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Central dome (characteristic of Islamic architecture)
  elements.push(
    <ellipse
      key="main-dome"
      cx={centerX}
      cy={centerY - buildingSize/4}
      rx={buildingSize/4}
      ry={buildingSize/6}
      fill={colors.dome}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Crescent moon finial on dome
  elements.push(
    <g key="crescent" transform={`translate(${centerX}, ${centerY - buildingSize/4 - buildingSize/6})`}>
      <circle
        cx="0"
        cy="-2"
        r="4"
        fill="none"
        stroke={colors.details}
        strokeWidth="2"
      />
      <circle
        cx="2"
        cy="-2"
        r="3"
        fill={colors.base}
      />
    </g>
  );

  // Minarets (two flanking towers)
  const minaretHeight = buildingSize * 0.7;
  [-1, 1].forEach((side, i) => {
    const minaretX = centerX + side * buildingSize/3;
    
    // Minaret shaft
    elements.push(
      <rect
        key={`minaret-${i}`}
        x={minaretX - 6}
        y={centerY - buildingSize/4 - minaretHeight/2}
        width="12"
        height={minaretHeight}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="2"
      />
    );
    
    // Minaret dome
    elements.push(
      <ellipse
        key={`minaret-dome-${i}`}
        cx={minaretX}
        cy={centerY - buildingSize/4 - minaretHeight/2}
        rx="8"
        ry="6"
        fill={colors.dome}
        stroke={colors.accent}
        strokeWidth="1"
      />
    );
    
    // Minaret crescent
    elements.push(
      <g key={`minaret-crescent-${i}`} transform={`translate(${minaretX}, ${centerY - buildingSize/4 - minaretHeight/2 - 6})`}>
        <circle
          cx="0"
          cy="0"
          r="2"
          fill="none"
          stroke={colors.details}
          strokeWidth="1"
        />
        <circle
          cx="1"
          cy="0"
          r="1.5"
          fill={colors.base}
        />
      </g>
    );
  });

  // Horseshoe arch entrance (characteristic Islamic form)
  elements.push(
    <g key="entrance">
      <rect
        x={centerX - size * 0.1}
        y={centerY - buildingSize/8}
        width={size * 0.2}
        height={buildingSize/3}
        fill={colors.accent}
      />
      {/* Horseshoe arch */}
      <path
        d={`M ${centerX - size * 0.1} ${centerY - buildingSize/8} 
            Q ${centerX - size * 0.12} ${centerY - buildingSize/6} ${centerX} ${centerY - buildingSize/6} 
            Q ${centerX + size * 0.12} ${centerY - buildingSize/6} ${centerX + size * 0.1} ${centerY - buildingSize/8}`}
        fill={colors.accent}
        stroke={colors.details}
        strokeWidth="2"
      />
    </g>
  );

  // Geometric patterns on facade (Islamic geometric art)
  const patternPositions = [
    { x: centerX - buildingSize/3, y: centerY - buildingSize/6 },
    { x: centerX + buildingSize/3, y: centerY - buildingSize/6 },
    { x: centerX - buildingSize/4, y: centerY },
    { x: centerX + buildingSize/4, y: centerY }
  ];

  patternPositions.forEach((pos, i) => {
    elements.push(
      <g key={`pattern-${i}`}>
        {/* Star pattern */}
        <polygon
          points={`${pos.x},${pos.y-4} ${pos.x+3},${pos.y-1} ${pos.x+3},${pos.y+1} ${pos.x},${pos.y+4} ${pos.x-3},${pos.y+1} ${pos.x-3},${pos.y-1}`}
          fill={colors.details}
          stroke={colors.accent}
          strokeWidth="0.5"
        />
      </g>
    );
  });

  // Courtyard walls (suggesting enclosed complex)
  elements.push(
    <g key="courtyard-walls">
      {/* Side walls with smaller arches */}
      <rect
        x={centerX - buildingSize/2 - 8}
        y={centerY - buildingSize/6}
        width="8"
        height={buildingSize/3}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="1"
        opacity="0.8"
      />
      <rect
        x={centerX + buildingSize/2}
        y={centerY - buildingSize/6}
        width="8"
        height={buildingSize/3}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="1"
        opacity="0.8"
      />
    </g>
  );

  // Decorative calligraphy band (represented as decorative stripe)
  elements.push(
    <rect
      key="calligraphy-band"
      x={centerX - buildingSize/2}
      y={centerY - buildingSize/8}
      width={buildingSize}
      height="4"
      fill={colors.details}
      opacity="0.7"
    />
  );

  return (
    <g>
      {elements}
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(CaliphCourtSymbol);