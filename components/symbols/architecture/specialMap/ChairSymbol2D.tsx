/**
 * ChairSymbol2D.tsx
 * Complex 3/4 perspective chair with visible seat, backrest, and legs
 * Demonstrates handling of complex shapes in the 2.5D system
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';
import { 
  PERSPECTIVE_CONSTANTS,
  getMaterialColors,
  calculate3QuarterTransform,
  CULTURAL_PALETTES
} from './utils/Symbol2DUtils';

interface ChairSymbol2DProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  facing?: 'front' | 'back' | 'left' | 'right';
  hasCushion?: boolean;
  seed?: number;
}

export const ChairSymbol2D: React.FC<ChairSymbol2DProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  facing = 'front',
  hasCushion = false,
  seed = 0
}) => {
  const palette = CULTURAL_PALETTES[culturalZone as keyof typeof CULTURAL_PALETTES] || CULTURAL_PALETTES.EUROPEAN;
  
  // Chair dimensions based on culture
  const getChairDimensions = () => {
    if (culturalZone === 'EAST_ASIAN' && era < 1900) {
      // Low stool or floor cushion
      return {
        width: size * 0.4,
        depth: size * 0.35,
        seatHeight: size * 0.15,
        backHeight: size * 0.1, // Very low or no back
        legHeight: size * 0.1,
        legWidth: 2
      };
    } else if (culturalZone === 'MENA') {
      // Ornate chair with cushions
      return {
        width: size * 0.45,
        depth: size * 0.4,
        seatHeight: size * 0.25,
        backHeight: size * 0.35,
        legHeight: size * 0.2,
        legWidth: 3
      };
    } else if (culturalZone === 'EUROPEAN' && era < 1500) {
      // High-backed medieval chair
      return {
        width: size * 0.4,
        depth: size * 0.35,
        seatHeight: size * 0.25,
        backHeight: size * 0.45,
        legHeight: size * 0.2,
        legWidth: 3
      };
    }
    // Default modern chair
    return {
      width: size * 0.4,
      depth: size * 0.35,
      seatHeight: size * 0.25,
      backHeight: size * 0.35,
      legHeight: size * 0.2,
      legWidth: 2
    };
  };
  
  const dims = getChairDimensions();
  const chairX = (size - dims.width) / 2;
  const chairY = size * 0.4;
  
  const woodColors = getMaterialColors('wood', culturalZone);
  const fabricColors = getMaterialColors('fabric', culturalZone);
  
  // Render chair facing front
  const renderFrontFacingChair = () => {
    const transform = calculate3QuarterTransform(dims.seatHeight);
    
    return (
      <>
        {/* Shadow */}
        <ellipse
          cx={size / 2}
          cy={chairY + dims.seatHeight + dims.legHeight}
          rx={dims.width * 0.4}
          ry={dims.depth * 0.15}
          fill="#000000"
          opacity="0.15"
        />
        
        {/* Back legs (partially visible) */}
        <rect
          x={chairX + 2}
          y={chairY - dims.backHeight + dims.seatHeight}
          width={dims.legWidth}
          height={dims.backHeight + dims.legHeight}
          fill={woodColors.shadow}
          opacity="0.7"
        />
        <rect
          x={chairX + dims.width - dims.legWidth - 2}
          y={chairY - dims.backHeight + dims.seatHeight}
          width={dims.legWidth}
          height={dims.backHeight + dims.legHeight}
          fill={woodColors.shadow}
          opacity="0.7"
        />
        
        {/* Backrest */}
        <rect
          x={chairX}
          y={chairY - dims.backHeight + dims.seatHeight}
          width={dims.width}
          height={dims.backHeight}
          fill={woodColors.base}
          stroke={woodColors.shadow}
          strokeWidth="0.5"
        />
        
        {/* Backrest slats for European style */}
        {culturalZone === 'EUROPEAN' && (
          <>
            <line
              x1={chairX + dims.width * 0.25}
              y1={chairY - dims.backHeight + dims.seatHeight + 3}
              x2={chairX + dims.width * 0.25}
              y2={chairY + dims.seatHeight - 3}
              stroke={woodColors.shadow}
              strokeWidth="1"
            />
            <line
              x1={chairX + dims.width * 0.5}
              y1={chairY - dims.backHeight + dims.seatHeight + 3}
              x2={chairX + dims.width * 0.5}
              y2={chairY + dims.seatHeight - 3}
              stroke={woodColors.shadow}
              strokeWidth="1"
            />
            <line
              x1={chairX + dims.width * 0.75}
              y1={chairY - dims.backHeight + dims.seatHeight + 3}
              x2={chairX + dims.width * 0.75}
              y2={chairY + dims.seatHeight - 3}
              stroke={woodColors.shadow}
              strokeWidth="1"
            />
          </>
        )}
        
        {/* Seat (3/4 view) */}
        <polygon
          points={`${chairX},${chairY + dims.seatHeight} 
                   ${chairX + dims.width},${chairY + dims.seatHeight} 
                   ${chairX + dims.width + transform.sideOffset},${chairY + dims.seatHeight - transform.topHeight} 
                   ${chairX + transform.sideOffset},${chairY + dims.seatHeight - transform.topHeight}`}
          fill={hasCushion ? fabricColors.base : woodColors.base}
          stroke={woodColors.shadow}
          strokeWidth="0.5"
        />
        
        {/* Seat front edge */}
        <rect
          x={chairX}
          y={chairY + dims.seatHeight}
          width={dims.width}
          height={3}
          fill={woodColors.shadow}
        />
        
        {/* Cushion pattern if applicable */}
        {hasCushion && (
          <>
            <ellipse
              cx={chairX + dims.width / 2}
              cy={chairY + dims.seatHeight - transform.topHeight / 2}
              rx={dims.width * 0.3}
              ry={transform.topHeight * 0.3}
              fill={palette.fabric || fabricColors.highlight}
              opacity="0.3"
            />
            {/* Button tufting */}
            <circle
              cx={chairX + dims.width / 2}
              cy={chairY + dims.seatHeight - transform.topHeight / 2}
              r={1.5}
              fill={fabricColors.shadow}
            />
          </>
        )}
        
        {/* Front legs */}
        <rect
          x={chairX + dims.legWidth}
          y={chairY + dims.seatHeight + 3}
          width={dims.legWidth}
          height={dims.legHeight}
          fill={woodColors.shadow}
        />
        <rect
          x={chairX + dims.width - dims.legWidth * 2}
          y={chairY + dims.seatHeight + 3}
          width={dims.legWidth}
          height={dims.legHeight}
          fill={woodColors.shadow}
        />
        
        {/* Armrests for certain styles */}
        {(culturalZone === 'EUROPEAN' && era >= 1500) && (
          <>
            <rect
              x={chairX - 2}
              y={chairY}
              width={4}
              height={dims.seatHeight * 0.6}
              fill={woodColors.base}
            />
            <rect
              x={chairX + dims.width - 2}
              y={chairY}
              width={4}
              height={dims.seatHeight * 0.6}
              fill={woodColors.base}
            />
          </>
        )}
      </>
    );
  };
  
  // Render chair facing back
  const renderBackFacingChair = () => {
    return (
      <>
        {/* Shadow */}
        <ellipse
          cx={size / 2}
          cy={chairY + dims.seatHeight + dims.legHeight}
          rx={dims.width * 0.4}
          ry={dims.depth * 0.15}
          fill="#000000"
          opacity="0.15"
        />
        
        {/* Front legs */}
        <rect
          x={chairX + dims.legWidth}
          y={chairY + dims.seatHeight}
          width={dims.legWidth}
          height={dims.legHeight}
          fill={woodColors.base}
        />
        <rect
          x={chairX + dims.width - dims.legWidth * 2}
          y={chairY + dims.seatHeight}
          width={dims.legWidth}
          height={dims.legHeight}
          fill={woodColors.base}
        />
        
        {/* Seat from behind */}
        <rect
          x={chairX}
          y={chairY + dims.seatHeight - 3}
          width={dims.width}
          height={6}
          fill={woodColors.base}
        />
        
        {/* Back of backrest */}
        <rect
          x={chairX}
          y={chairY - dims.backHeight + dims.seatHeight}
          width={dims.width}
          height={dims.backHeight + 3}
          fill={woodColors.highlight}
          stroke={woodColors.shadow}
          strokeWidth="0.5"
        />
      </>
    );
  };
  
  // Render side-facing chair
  const renderSideFacingChair = () => {
    const transform = calculate3QuarterTransform(dims.seatHeight);
    const sideWidth = dims.depth;
    const sideX = (size - sideWidth) / 2;
    
    return (
      <>
        {/* Shadow */}
        <ellipse
          cx={size / 2}
          cy={chairY + dims.seatHeight + dims.legHeight}
          rx={sideWidth * 0.4}
          ry={dims.width * 0.15}
          fill="#000000"
          opacity="0.15"
        />
        
        {/* Side view of chair */}
        <polygon
          points={`${sideX},${chairY + dims.seatHeight} 
                   ${sideX + sideWidth},${chairY + dims.seatHeight} 
                   ${sideX + sideWidth},${chairY - dims.backHeight + dims.seatHeight} 
                   ${sideX},${chairY}`}
          fill={woodColors.base}
          stroke={woodColors.shadow}
          strokeWidth="0.5"
        />
        
        {/* Legs from side */}
        <rect
          x={sideX + 2}
          y={chairY + dims.seatHeight}
          width={dims.legWidth}
          height={dims.legHeight}
          fill={woodColors.shadow}
        />
        <rect
          x={sideX + sideWidth - dims.legWidth - 2}
          y={chairY + dims.seatHeight}
          width={dims.legWidth}
          height={dims.legHeight}
          fill={woodColors.shadow}
        />
      </>
    );
  };
  
  // Standard gray background to prevent terrain bleed
  const standardGray = '#8a8a8a';
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Gray background to prevent color bleed */}
      <rect x={0} y={0} width={size} height={size} fill={standardGray} />
      
      {facing === 'front' && renderFrontFacingChair()}
      {facing === 'back' && renderBackFacingChair()}
      {(facing === 'left' || facing === 'right') && renderSideFacingChair()}
    </g>
  );
};