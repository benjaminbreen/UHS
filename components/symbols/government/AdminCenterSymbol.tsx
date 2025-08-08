/**
 * components/symbols/government/AdminCenterSymbol.tsx - Modern administrative buildings
 */
import React from 'react';
import { Tile } from '../../../types';

interface AdminCenterSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'modernist' | 'brutalist' | 'contemporary' | 'communist' | 'modern';
}

const AdminCenterSymbol: React.FC<AdminCenterSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'modernist' 
}) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const buildingSize = size * 0.9;
  
  // Color variations by modern architectural style
  const getColors = () => {
    switch (variant) {
      case 'brutalist':
        return {
          base: '#696969', // Dim gray (concrete)
          accent: '#2F4F4F', // Dark slate gray
          glass: '#87CEEB', // Sky blue (glass)
          details: '#4682B4' // Steel blue
        };
      case 'contemporary':
        return {
          base: '#F5F5DC', // Beige (light concrete/stone)
          accent: '#4682B4', // Steel blue
          glass: '#E0E0E0', // Light gray (glass)
          details: '#FF6347' // Tomato (accent colors)
        };
      case 'communist':
        return {
          base: '#CD853F', // Peru (stone)
          accent: '#8B0000', // Dark red
          glass: '#696969', // Dim gray
          details: '#FFD700' // Gold (state symbols)
        };
      default: // modernist
        return {
          base: '#F0F0F0', // Light gray (clean modern)
          accent: '#2F4F4F', // Dark slate gray
          glass: '#87CEEB', // Sky blue (glass)
          details: '#4169E1' // Royal blue
        };
    }
  };

  const colors = getColors();
  const elements: JSX.Element[] = [];

  if (variant === 'brutalist' || variant === 'communist') {
    // Massive, imposing concrete structure
    elements.push(
      <rect
        key="main-block"
        x={centerX - buildingSize/2}
        y={centerY - buildingSize/2.5}
        width={buildingSize}
        height={buildingSize/1.2}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="3"
      />
    );

    // Stepped/terraced upper levels (brutalist style)
    elements.push(
      <rect
        key="upper-terrace"
        x={centerX - buildingSize/3}
        y={centerY - buildingSize/2.5 - buildingSize/8}
        width={buildingSize * 2/3}
        height={buildingSize/8}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="2"
      />
    );

    // Repetitive window grid (institutional)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        const windowX = centerX - buildingSize/2 + 8 + (col * ((buildingSize - 16) / 8));
        const windowY = centerY - buildingSize/2.5 + 8 + (row * ((buildingSize/1.2 - 16) / 6));
        
        elements.push(
          <rect
            key={`window-${row}-${col}`}
            x={windowX}
            y={windowY}
            width="8"
            height="6"
            fill={colors.glass}
            stroke={colors.accent}
            strokeWidth="0.5"
          />
        );
      }
    }

    // State symbol/emblem for communist variant
    if (variant === 'communist') {
      elements.push(
        <g key="state-emblem">
          <circle
            cx={centerX}
            cy={centerY - buildingSize/3}
            r="12"
            fill={colors.details}
            stroke={colors.accent}
            strokeWidth="2"
          />
          {/* Star symbol */}
          <polygon
            points={`${centerX},${centerY - buildingSize/3 - 8} ${centerX + 3},${centerY - buildingSize/3 - 2} ${centerX + 8},${centerY - buildingSize/3 - 2} ${centerX + 4},${centerY - buildingSize/3 + 2} ${centerX + 6},${centerY - buildingSize/3 + 8} ${centerX},${centerY - buildingSize/3 + 5} ${centerX - 6},${centerY - buildingSize/3 + 8} ${centerX - 4},${centerY - buildingSize/3 + 2} ${centerX - 8},${centerY - buildingSize/3 - 2} ${centerX - 3},${centerY - buildingSize/3 - 2}`}
            fill={colors.accent}
          />
        </g>
      );
    }

  } else {
    // Modern glass and steel construction
    
    // Main structure (more transparent)
    elements.push(
      <rect
        key="main-structure"
        x={centerX - buildingSize/2}
        y={centerY - buildingSize/3}
        width={buildingSize}
        height={buildingSize/1.3}
        fill={colors.base}
        stroke={colors.accent}
        strokeWidth="2"
        opacity="0.9"
      />
    );

    // Glass curtain wall system
    const glassRows = 8;
    const glassCols = 10;
    
    for (let row = 0; row < glassRows; row++) {
      for (let col = 0; col < glassCols; col++) {
        const glassX = centerX - buildingSize/2 + 2 + (col * ((buildingSize - 4) / glassCols));
        const glassY = centerY - buildingSize/3 + 2 + (row * ((buildingSize/1.3 - 4) / glassRows));
        
        elements.push(
          <rect
            key={`glass-panel-${row}-${col}`}
            x={glassX}
            y={glassY}
            width={(buildingSize - 4) / glassCols - 1}
            height={(buildingSize/1.3 - 4) / glassRows - 1}
            fill={colors.glass}
            stroke={colors.accent}
            strokeWidth="0.2"
            opacity="0.7"
          />
        );
      }
    }

    // Modern entrance (glass and steel)
    elements.push(
      <g key="modern-entrance">
        <rect
          x={centerX - size * 0.15}
          y={centerY + buildingSize/8}
          width={size * 0.3}
          height={buildingSize/4}
          fill={colors.glass}
          stroke={colors.details}
          strokeWidth="3"
        />
        {/* Revolving door indicator */}
        <circle
          cx={centerX}
          cy={centerY + buildingSize/5}
          r="8"
          fill="none"
          stroke={colors.details}
          strokeWidth="2"
        />
        <line x1={centerX - 6} y1={centerY + buildingSize/5 - 6} x2={centerX + 6} y2={centerY + buildingSize/5 + 6} stroke={colors.details} strokeWidth="1" />
        <line x1={centerX + 6} y1={centerY + buildingSize/5 - 6} x2={centerX - 6} y2={centerY + buildingSize/5 + 6} stroke={colors.details} strokeWidth="1" />
      </g>
    );

    // Modern plaza/forecourt
    elements.push(
      <rect
        key="plaza"
        x={centerX - buildingSize/2 - 4}
        y={centerY + buildingSize/2.8}
        width={buildingSize + 8}
        height="6"
        fill={colors.accent}
        opacity="0.3"
      />
    );
  }

  // Communications array/antennas on roof (modern government)
  elements.push(
    <g key="communications">
      <rect
        x={centerX - buildingSize/4}
        y={centerY - buildingSize/2.5 - 4}
        width="2"
        height="8"
        fill={colors.accent}
      />
      <rect
        x={centerX + buildingSize/4}
        y={centerY - buildingSize/2.5 - 6}
        width="2"
        height="10"
        fill={colors.accent}
      />
      {/* Satellite dish */}
      <ellipse
        cx={centerX}
        cy={centerY - buildingSize/2.5 - 2}
        rx="4"
        ry="2"
        fill={colors.glass}
        stroke={colors.accent}
        strokeWidth="1"
      />
    </g>
  );

  // Modern lighting (LED strips or modern fixtures)
  if (variant !== 'brutalist' && variant !== 'communist') {
    elements.push(
      <g key="modern-lighting">
        {/* LED strip lighting along building edge */}
        <rect
          x={centerX - buildingSize/2}
          y={centerY - buildingSize/3 - 1}
          width={buildingSize}
          height="1"
          fill={colors.details}
          opacity="0.8"
        />
        <rect
          x={centerX - buildingSize/2}
          y={centerY + buildingSize/2.6}
          width={buildingSize}
          height="1"
          fill={colors.details}
          opacity="0.8"
        />
      </g>
    );
  }

  // Flag or national symbol
  elements.push(
    <g key="flag-display">
      <rect
        x={centerX + buildingSize/3}
        y={centerY - buildingSize/2}
        width="2"
        height={buildingSize * 0.8}
        fill={colors.accent}
      />
      <rect
        x={centerX + buildingSize/3 + 2}
        y={centerY - buildingSize/2 + 4}
        width="12"
        height="8"
        fill={colors.details}
      />
    </g>
  );

  // Security/access control elements (modern government)
  elements.push(
    <g key="security-elements">
      {/* Security barriers */}
      <rect
        x={centerX - buildingSize/2 - 6}
        y={centerY + buildingSize/4}
        width="4"
        height="8"
        fill={colors.accent}
        opacity="0.6"
      />
      <rect
        x={centerX + buildingSize/2 + 2}
        y={centerY + buildingSize/4}
        width="4"
        height="8"
        fill={colors.accent}
        opacity="0.6"
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

export default React.memo(AdminCenterSymbol);