/**
 * TableSymbol2D.tsx
 * 3/4 perspective table with visible top surface, front face, and legs
 * Demonstrates the core furniture perspective system
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';
import { 
  PERSPECTIVE_CONSTANTS,
  getMaterialColors,
  generateWoodGrain,
  calculate3QuarterTransform,
  createDropShadow,
  lightenColor,
  darkenColor,
  CULTURAL_PALETTES
} from './utils/Symbol2DUtils';

interface TableSymbol2DProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  hasItems?: boolean;
  seed?: number;
}

export const TableSymbol2D: React.FC<TableSymbol2DProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  hasItems = false,
  seed = 0
}) => {
  const palette = CULTURAL_PALETTES[culturalZone as keyof typeof CULTURAL_PALETTES] || CULTURAL_PALETTES.EUROPEAN;
  
  // Table dimensions based on culture
  const getTableDimensions = () => {
    if (culturalZone === 'EAST_ASIAN' && era < 1900) {
      // Low table for floor seating
      return {
        width: size * 0.8,
        depth: size * 0.6,
        height: size * 0.25,
        legHeight: size * 0.15,
        topThickness: 3
      };
    } else if (culturalZone === 'MENA') {
      // Ornate table with decorative edges
      return {
        width: size * 0.75,
        depth: size * 0.55,
        height: size * 0.4,
        legHeight: size * 0.3,
        topThickness: 4
      };
    }
    // Default European style
    return {
      width: size * 0.7,
      depth: size * 0.5,
      height: size * 0.45,
      legHeight: size * 0.35,
      topThickness: 3
    };
  };
  
  const dims = getTableDimensions();
  const transform = calculate3QuarterTransform(dims.height);
  
  // Calculate positions for better SNES perspective
  const tableX = (size - dims.width) / 2;
  const tableY = size * 0.35; // Position in upper portion of tile for 3/4 view
  
  // Wood colors based on culture with richer shading
  const woodColors = getMaterialColors('wood', culturalZone);
  const darkWood = darkenColor(woodColors.shadow, 0.7);
  const lightWood = lightenColor(woodColors.base, 1.3);
  
  // Render table legs with better SNES-style shading
  const renderLegs = () => {
    const legWidth = 4;
    const legs = [];
    
    // Front left leg with gradient shading
    legs.push(
      <g key="leg-fl">
        <rect
          x={tableX + legWidth}
          y={tableY + transform.frontHeight}
          width={legWidth}
          height={dims.legHeight}
          fill={darkWood}
        />
        {/* Highlight on left edge */}
        <rect
          x={tableX + legWidth}
          y={tableY + transform.frontHeight}
          width={1}
          height={dims.legHeight}
          fill={lightWood}
          opacity="0.5"
        />
      </g>
    );
    
    // Front right leg with gradient shading
    legs.push(
      <g key="leg-fr">
        <rect
          x={tableX + dims.width - legWidth * 2}
          y={tableY + transform.frontHeight}
          width={legWidth}
          height={dims.legHeight}
          fill={darkWood}
        />
        {/* Highlight on left edge */}
        <rect
          x={tableX + dims.width - legWidth * 2}
          y={tableY + transform.frontHeight}
          width={1}
          height={dims.legHeight}
          fill={lightWood}
          opacity="0.5"
        />
      </g>
    );
    
    // Back legs (partially visible) with depth shading
    legs.push(
      <g key="leg-bl">
        <rect
          x={tableX + legWidth + transform.sideOffset}
          y={tableY + dims.topThickness}
          width={legWidth}
          height={dims.legHeight * 0.7}
          fill={darkWood}
          opacity="0.8"
        />
      </g>
    );
    
    legs.push(
      <g key="leg-br">
        <rect
          x={tableX + dims.width - legWidth * 2 + transform.sideOffset}
          y={tableY + dims.topThickness}
          width={legWidth}
          height={dims.legHeight * 0.7}
          fill={darkWood}
          opacity="0.8"
        />
      </g>
    );
    
    return legs;
  };
  
  // Render items on table
  const renderTableItems = () => {
    if (!hasItems) return null;
    
    const items = [];
    
    // Book
    items.push(
      <g key="book">
        <rect
          x={tableX + dims.width * 0.2}
          y={tableY - 2}
          width={dims.width * 0.15}
          height={dims.depth * 0.2}
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="0.5"
        />
        <line
          x1={tableX + dims.width * 0.275}
          y1={tableY - 2}
          x2={tableX + dims.width * 0.275}
          y2={tableY + dims.depth * 0.18}
          stroke="#654321"
          strokeWidth="0.5"
        />
      </g>
    );
    
    // Candle
    if (culturalZone === 'EUROPEAN' || culturalZone === 'MENA') {
      items.push(
        <g key="candle">
          <ellipse
            cx={tableX + dims.width * 0.7}
            cy={tableY + dims.depth * 0.15}
            rx={3}
            ry={1}
            fill="#F5DEB3"
          />
          <rect
            x={tableX + dims.width * 0.7 - 1}
            y={tableY - 4}
            width={2}
            height={6}
            fill="#F5DEB3"
          />
          <ellipse
            cx={tableX + dims.width * 0.7}
            cy={tableY - 5}
            rx={1.5}
            ry={2}
            fill="#FFA500"
            opacity="0.8"
          />
        </g>
      );
    }
    
    // Scroll for East Asian
    if (culturalZone === 'EAST_ASIAN') {
      items.push(
        <g key="scroll">
          <ellipse
            cx={tableX + dims.width * 0.5}
            cy={tableY + dims.depth * 0.2}
            rx={dims.width * 0.2}
            ry={3}
            fill="#FFF8DC"
            stroke="#8B4513"
            strokeWidth="0.5"
          />
        </g>
      );
    }
    
    return items;
  };
  
  // Render decorative patterns for MENA style
  const renderDecorativePattern = () => {
    if (culturalZone !== 'MENA') return null;
    
    return (
      <g opacity="0.3">
        <polygon
          points={`${tableX + dims.width * 0.5},${tableY + 2} 
                   ${tableX + dims.width * 0.6},${tableY + dims.depth * 0.2} 
                   ${tableX + dims.width * 0.5},${tableY + dims.depth * 0.4} 
                   ${tableX + dims.width * 0.4},${tableY + dims.depth * 0.2}`}
          fill="none"
          stroke={palette.accent}
          strokeWidth="0.5"
        />
      </g>
    );
  };
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        {createDropShadow('tableShadow')}
      </defs>
      
      {/* Shadow beneath table */}
      <ellipse
        cx={size / 2}
        cy={tableY + dims.height + dims.legHeight - 2}
        rx={dims.width * 0.45}
        ry={dims.depth * 0.2}
        fill="#000000"
        opacity="0.2"
      />
      
      {/* Table legs (rendered first, behind table body) */}
      {renderLegs()}
      
      {/* Table front face */}
      <rect
        x={tableX}
        y={tableY + dims.topThickness}
        width={dims.width}
        height={transform.frontHeight - dims.topThickness}
        fill={woodColors.shadow}
      />
      
      {/* Table side face (visible in 3/4 view) */}
      <polygon
        points={`${tableX + dims.width},${tableY + dims.topThickness} 
                 ${tableX + dims.width + transform.sideOffset},${tableY} 
                 ${tableX + dims.width + transform.sideOffset},${tableY + transform.frontHeight - dims.topThickness} 
                 ${tableX + dims.width},${tableY + transform.frontHeight}`}
        fill={woodColors.shadow}
        opacity="0.8"
      />
      
      {/* Table top surface with enhanced depth */}
      <g>
        {/* Main table top */}
        <polygon
          points={`${tableX},${tableY} 
                   ${tableX + dims.width},${tableY} 
                   ${tableX + dims.width + transform.sideOffset},${tableY - transform.topHeight} 
                   ${tableX + transform.sideOffset},${tableY - transform.topHeight}`}
          fill={woodColors.base}
          stroke={darkWood}
          strokeWidth="0.8"
        />
        
        {/* Inner border for depth */}
        <polygon
          points={`${tableX + 2},${tableY - 1} 
                   ${tableX + dims.width - 2},${tableY - 1} 
                   ${tableX + dims.width + transform.sideOffset - 2},${tableY - transform.topHeight + 1} 
                   ${tableX + transform.sideOffset + 2},${tableY - transform.topHeight + 1}`}
          fill="none"
          stroke={lightWood}
          strokeWidth="0.5"
          opacity="0.4"
        />
        
        {/* Gradient overlay for polished effect */}
        <defs>
          <linearGradient id={`tableGrad-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        <polygon
          points={`${tableX},${tableY} 
                   ${tableX + dims.width},${tableY} 
                   ${tableX + dims.width + transform.sideOffset},${tableY - transform.topHeight} 
                   ${tableX + transform.sideOffset},${tableY - transform.topHeight}`}
          fill={`url(#tableGrad-${seed})`}
        />
      </g>
      
      {/* Enhanced wood grain pattern */}
      <g opacity="0.25">
        {/* Main grain lines */}
        <line
          x1={tableX + dims.width * 0.15}
          y1={tableY}
          x2={tableX + dims.width * 0.15 + transform.sideOffset}
          y2={tableY - transform.topHeight}
          stroke={darkWood}
          strokeWidth="0.4"
        />
        <line
          x1={tableX + dims.width * 0.35}
          y1={tableY}
          x2={tableX + dims.width * 0.35 + transform.sideOffset}
          y2={tableY - transform.topHeight}
          stroke={darkWood}
          strokeWidth="0.3"
        />
        <line
          x1={tableX + dims.width * 0.6}
          y1={tableY}
          x2={tableX + dims.width * 0.6 + transform.sideOffset}
          y2={tableY - transform.topHeight}
          stroke={darkWood}
          strokeWidth="0.4"
        />
        <line
          x1={tableX + dims.width * 0.85}
          y1={tableY}
          x2={tableX + dims.width * 0.85 + transform.sideOffset}
          y2={tableY - transform.topHeight}
          stroke={darkWood}
          strokeWidth="0.3"
        />
        
        {/* Cross grain for texture */}
        <line
          x1={tableX + dims.width * 0.1}
          y1={tableY - transform.topHeight * 0.3}
          x2={tableX + dims.width * 0.9}
          y2={tableY - transform.topHeight * 0.3}
          stroke={darkWood}
          strokeWidth="0.2"
        />
        <line
          x1={tableX + dims.width * 0.1}
          y1={tableY - transform.topHeight * 0.7}
          x2={tableX + dims.width * 0.9}
          y2={tableY - transform.topHeight * 0.7}
          stroke={darkWood}
          strokeWidth="0.2"
        />
      </g>
      
      {/* Top edge highlight */}
      <line
        x1={tableX}
        y1={tableY}
        x2={tableX + dims.width}
        y2={tableY}
        stroke={woodColors.highlight}
        strokeWidth="1"
        opacity="0.5"
      />
      
      {/* Decorative patterns */}
      {renderDecorativePattern()}
      
      {/* Items on table */}
      {renderTableItems()}
    </g>
  );
};