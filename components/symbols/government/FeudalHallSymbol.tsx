/**
 * components/symbols/government/FeudalHallSymbol.tsx - Medieval great hall and manor house
 */
import React from 'react';
import { Tile } from '../../../types';

interface FeudalHallSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'english' | 'french' | 'germanic' | 'scandinavian';
}

const FeudalHallSymbol: React.FC<FeudalHallSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'english' 
}) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const buildingSize = size * 0.75;
  
  // Color variations by regional style
  const getColors = () => {
    switch (variant) {
      case 'french':
        return {
          base: '#C0C0C0', // Silver stone
          roof: '#8B4513', // Saddle brown
          accent: '#696969', // Dim gray
          wood: '#8B4513'
        };
      case 'germanic':
        return {
          base: '#F5DEB3', // Wheat timber
          roof: '#8B0000', // Dark red tiles
          accent: '#654321', // Dark brown
          wood: '#A0522D'
        };
      case 'scandinavian':
        return {
          base: '#DCDCDC', // Light gray stone
          roof: '#2F4F4F', // Dark slate gray
          accent: '#708090', // Slate gray
          wood: '#696969'
        };
      default: // english
        return {
          base: '#D2B48C', // Tan stone
          roof: '#8B4513', // Saddle brown thatch
          accent: '#A0522D', // Sienna
          wood: '#654321'
        };
    }
  };

  const colors = getColors();
  const elements: JSX.Element[] = [];

  // Main hall building (long rectangular)
  elements.push(
    <rect
      key="hall-base"
      x={centerX - buildingSize/2}
      y={centerY - buildingSize/4}
      width={buildingSize}
      height={buildingSize/2}
      fill={colors.base}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Steep pitched roof
  elements.push(
    <polygon
      key="main-roof"
      points={`${centerX - buildingSize/2 - 3},${centerY - buildingSize/4} ${centerX},${centerY - buildingSize/2.2} ${centerX + buildingSize/2 + 3},${centerY - buildingSize/4}`}
      fill={colors.roof}
      stroke={colors.accent}
      strokeWidth="1"
    />
  );

  // Tower (characteristic of fortified manor houses)
  const towerWidth = buildingSize * 0.25;
  const towerHeight = buildingSize * 0.6;
  elements.push(
    <rect
      key="tower"
      x={centerX + buildingSize/2 - towerWidth}
      y={centerY - buildingSize/4 - towerHeight/3}
      width={towerWidth}
      height={towerHeight}
      fill={colors.base}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Tower roof (conical)
  elements.push(
    <polygon
      key="tower-roof"
      points={`${centerX + buildingSize/2 - towerWidth},${centerY - buildingSize/4 - towerHeight/3} ${centerX + buildingSize/2 - towerWidth/2},${centerY - buildingSize/4 - towerHeight/2} ${centerX + buildingSize/2},${centerY - buildingSize/4 - towerHeight/3}`}
      fill={colors.roof}
    />
  );

  // Great hall entrance (arched doorway)
  elements.push(
    <g key="entrance">
      <rect
        x={centerX - size * 0.08}
        y={centerY - buildingSize/8}
        width={size * 0.16}
        height={buildingSize/3}
        fill={colors.accent}
      />
      {/* Arch top */}
      <path
        d={`M ${centerX - size * 0.08} ${centerY - buildingSize/8} A ${size * 0.08} ${size * 0.08} 0 0 1 ${centerX + size * 0.08} ${centerY - buildingSize/8}`}
        fill={colors.accent}
      />
    </g>
  );

  // Windows (narrow medieval style)
  const windowPositions = [
    { x: centerX - buildingSize/3, y: centerY - buildingSize/8 },
    { x: centerX + buildingSize/3, y: centerY - buildingSize/8 }
  ];

  windowPositions.forEach((pos, i) => {
    elements.push(
      <rect
        key={`window-${i}`}
        x={pos.x - 3}
        y={pos.y}
        width="6"
        height="16"
        fill={colors.wood}
        stroke={colors.accent}
        strokeWidth="1"
      />
    );
  });

  // Chimney (important for great halls)
  elements.push(
    <rect
      key="chimney"
      x={centerX - buildingSize/4}
      y={centerY - buildingSize/2.5}
      width="8"
      height="12"
      fill={colors.accent}
    />
  );

  // Courtyard wall (partial, suggesting enclosed compound)
  elements.push(
    <g key="courtyard-wall">
      <rect
        x={centerX - buildingSize/2 - 4}
        y={centerY + buildingSize/6}
        width="8"
        height="12"
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="1"
        opacity="0.7"
      />
      <rect
        x={centerX + buildingSize/2 - 4}
        y={centerY + buildingSize/6}
        width="8"
        height="12"
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="1"
        opacity="0.7"
      />
    </g>
  );

  // Banner/flag pole (symbol of lordship)
  elements.push(
    <g key="banner">
      <line
        x1={centerX + buildingSize/2 - towerWidth/2}
        y1={centerY - buildingSize/4 - towerHeight/2}
        x2={centerX + buildingSize/2 - towerWidth/2}
        y2={centerY - buildingSize/4 - towerHeight/2 - 10}
        stroke={colors.wood}
        strokeWidth="2"
      />
      <polygon
        points={`${centerX + buildingSize/2 - towerWidth/2},${centerY - buildingSize/4 - towerHeight/2 - 10} ${centerX + buildingSize/2 - towerWidth/2 + 8},${centerY - buildingSize/4 - towerHeight/2 - 8} ${centerX + buildingSize/2 - towerWidth/2},${centerY - buildingSize/4 - towerHeight/2 - 6}`}
        fill={colors.roof}
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

export default React.memo(FeudalHallSymbol);