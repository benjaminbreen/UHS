/**
 * components/symbols/government/TownHallSymbol.tsx - Renaissance/Early Modern town hall and guildhall
 */
import React from 'react';
import { Tile } from '../../../types';

interface TownHallSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'flemish' | 'german' | 'italian' | 'english';
}

const TownHallSymbol: React.FC<TownHallSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'flemish' 
}) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const buildingSize = size * 0.8;
  
  // Color variations by regional Renaissance style
  const getColors = () => {
    switch (variant) {
      case 'german':
        return {
          base: '#F5DEB3', // Wheat (timber frame)
          roof: '#8B0000', // Dark red tiles
          accent: '#654321', // Dark brown timber
          details: '#FFD700' // Gold details
        };
      case 'italian':
        return {
          base: '#FFEFD5', // Papaya whip (light stone)
          roof: '#CD853F', // Peru (terracotta)
          accent: '#A0522D', // Sienna
          details: '#DAA520' // Goldenrod
        };
      case 'english':
        return {
          base: '#F5F5DC', // Beige stone
          roof: '#696969', // Dim gray slate
          accent: '#2F4F4F', // Dark slate gray
          details: '#B8860B' // Dark goldenrod
        };
      default: // flemish
        return {
          base: '#DEB887', // Burlywood (brick)
          roof: '#8B4513', // Saddle brown
          accent: '#A0522D', // Sienna
          details: '#DAA520' // Goldenrod
        };
    }
  };

  const colors = getColors();
  const elements: JSX.Element[] = [];

  // Main building (more ornate than medieval)
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

  // Elaborate stepped gable (Flemish style) or regular gable
  if (variant === 'flemish' || variant === 'german') {
    // Stepped gable
    const steps = [
      { w: buildingSize, h: 0 },
      { w: buildingSize * 0.8, h: size * 0.08 },
      { w: buildingSize * 0.6, h: size * 0.16 },
      { w: buildingSize * 0.4, h: size * 0.24 },
      { w: buildingSize * 0.2, h: size * 0.32 }
    ];
    
    steps.forEach((step, i) => {
      elements.push(
        <rect
          key={`gable-step-${i}`}
          x={centerX - step.w/2}
          y={centerY - buildingSize/3 - step.h}
          width={step.w}
          height={size * 0.08}
          fill={colors.roof}
          stroke={colors.accent}
          strokeWidth="1"
        />
      );
    });
  } else {
    // Traditional triangular gable
    elements.push(
      <polygon
        key="gable"
        points={`${centerX - buildingSize/2},${centerY - buildingSize/3} ${centerX},${centerY - buildingSize/2.2} ${centerX + buildingSize/2},${centerY - buildingSize/3}`}
        fill={colors.roof}
        stroke={colors.accent}
        strokeWidth="1"
      />
    );
  }

  // Bell tower or clock tower (civic importance)
  const towerWidth = buildingSize * 0.2;
  const towerHeight = buildingSize * 0.8;
  elements.push(
    <rect
      key="tower"
      x={centerX - towerWidth/2}
      y={centerY - buildingSize/3 - towerHeight/2}
      width={towerWidth}
      height={towerHeight}
      fill={colors.base}
      stroke={colors.accent}
      strokeWidth="2"
    />
  );

  // Tower spire
  elements.push(
    <polygon
      key="spire"
      points={`${centerX - towerWidth/2},${centerY - buildingSize/3 - towerHeight/2} ${centerX},${centerY - buildingSize/3 - towerHeight/1.5} ${centerX + towerWidth/2},${centerY - buildingSize/3 - towerHeight/2}`}
      fill={colors.roof}
    />
  );

  // Clock face on tower (Renaissance innovation)
  elements.push(
    <circle
      key="clock"
      cx={centerX}
      cy={centerY - buildingSize/3 - towerHeight/4}
      r={towerWidth/3}
      fill={colors.details}
      stroke={colors.accent}
      strokeWidth="1"
    />
  );

  // Clock hands
  elements.push(
    <g key="clock-hands">
      <line
        x1={centerX}
        y1={centerY - buildingSize/3 - towerHeight/4}
        x2={centerX}
        y2={centerY - buildingSize/3 - towerHeight/4 - towerWidth/4}
        stroke={colors.accent}
        strokeWidth="2"
      />
      <line
        x1={centerX}
        y1={centerY - buildingSize/3 - towerHeight/4}
        x2={centerX + towerWidth/6}
        y2={centerY - buildingSize/3 - towerHeight/4}
        stroke={colors.accent}
        strokeWidth="1"
      />
    </g>
  );

  // Large arched entrance (Renaissance grandeur)
  elements.push(
    <g key="entrance">
      <rect
        x={centerX - size * 0.12}
        y={centerY - buildingSize/6}
        width={size * 0.24}
        height={buildingSize/2.5}
        fill={colors.accent}
      />
      {/* Renaissance arch */}
      <ellipse
        cx={centerX}
        cy={centerY - buildingSize/6}
        rx={size * 0.12}
        ry={size * 0.06}
        fill={colors.accent}
      />
    </g>
  );

  // Multiple windows (Renaissance symmetry)
  const windowRows = [
    { y: centerY - buildingSize/4, count: 5 },
    { y: centerY, count: 5 }
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
            height="12"
            fill={colors.details}
            stroke={colors.accent}
            strokeWidth="1"
          />
        );
      }
    }
  });

  // Decorative elements (Renaissance ornamentation)
  elements.push(
    <g key="decorations">
      {/* Corner decorations */}
      <circle
        cx={centerX - buildingSize/2 + 5}
        cy={centerY - buildingSize/3 + 5}
        r="3"
        fill={colors.details}
      />
      <circle
        cx={centerX + buildingSize/2 - 5}
        cy={centerY - buildingSize/3 + 5}
        r="3"
        fill={colors.details}
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

export default React.memo(TownHallSymbol);