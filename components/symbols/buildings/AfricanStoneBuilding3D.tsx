/**
 * components/symbols/buildings/AfricanStoneBuilding3D.tsx - Renders advanced Sub-Saharan African stone architecture (Great Zimbabwe style)
 */
import React from 'react';
import { Tile, HistoricalEra } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface AfricanStoneBuilding3DProps {
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  seed: number;
  tile: Tile;
  roofColor: string;
  era: HistoricalEra;
}

const AfricanStoneBuilding3D: React.FC<AfricanStoneBuilding3DProps> = React.memo(({ x, y, width, height, size, seed, tile, roofColor, era }) => {
  const rng = new ValueNoise(seed + tile.x * 19 + tile.y * 31);
  const uniqueId = `african-stone-${tile.x}-${tile.y}`;
  
  // Pre-calculate all random values to prevent re-rendering changes
  const stoneColorVariation = rng.random();
  const mortarColorVariation = rng.random();
  const graniteColorVariation = rng.random();
  const decorativeChance1 = rng.random();
  const decorativeChance2 = rng.random();
  const decorativeChance3 = rng.random();
  
  // Keep compatibility with existing rand() calls
  const rand = rng.random;
  
  // Imposing stone structure
  const buildingWidth = width * 0.85;
  const buildingHeight = height * 0.8;
  const buildingX = x + (width - buildingWidth) / 2;
  const buildingY = y + height - buildingHeight;
  
  const stoneColor = `hsl(40, 20%, ${50 + stoneColorVariation * 15}%)`;
  const stoneShadowColor = `hsl(40, 20%, 35%)`;
  const mortarColor = `hsl(35, 15%, ${40 + mortarColorVariation * 10}%)`;
  const graniteColor = `hsl(0, 0%, ${45 + graniteColorVariation * 10}%)`;
  const goldAccentColor = '#DAA520';

  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <linearGradient id={`stoneWall-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={stoneColor} />
          <stop offset="50%" stopColor={stoneColor} />
          <stop offset="100%" stopColor={stoneShadowColor} />
        </linearGradient>
        <pattern id={`stonePattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="4">
          <rect x="0" y="0" width="5.8" height="1.8" fill={stoneColor} stroke={mortarColor} strokeWidth="0.2" />
          <rect x="0" y="2" width="5.8" height="1.8" fill={stoneColor} stroke={mortarColor} strokeWidth="0.2" />
        </pattern>
        <pattern id={`graniteBlocks-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="6">
          <rect x="0" y="0" width="7.5" height="2.8" fill={graniteColor} stroke={mortarColor} strokeWidth="0.3" />
          <rect x="0" y="3" width="7.5" height="2.8" fill={graniteColor} stroke={mortarColor} strokeWidth="0.3" />
        </pattern>
      </defs>
      
      {/* Ground shadow */}
      <ellipse 
        cx={buildingX + buildingWidth/2} 
        cy={buildingY + buildingHeight + 2} 
        rx={buildingWidth * 0.8} 
        ry={buildingWidth * 0.2} 
        fill="rgba(0,0,0,0.3)" 
      />
      
      {/* Foundation - larger granite blocks */}
      <rect
        x={buildingX - size * 0.03}
        y={buildingY + buildingHeight * 0.8}
        width={buildingWidth + size * 0.06}
        height={buildingHeight * 0.2 + size * 0.02}
        fill={`url(#graniteBlocks-${uniqueId})`}
        stroke={mortarColor}
        strokeWidth="0.4"
      />
      
      {/* Main wall structure - fitted stone construction */}
      <rect
        x={buildingX}
        y={buildingY}
        width={buildingWidth}
        height={buildingHeight * 0.8}
        fill={`url(#stoneWall-${uniqueId})`}
        stroke={mortarColor}
        strokeWidth="0.3"
      />
      
      {/* Detailed stone block pattern */}
      <rect
        x={buildingX}
        y={buildingY}
        width={buildingWidth}
        height={buildingHeight * 0.8}
        fill={`url(#stonePattern-${uniqueId})`}
        opacity="0.9"
      />
      
      {/* Curved wall sections (characteristic of Great Zimbabwe) */}
      <path
        d={`M ${buildingX} ${buildingY + buildingHeight * 0.4} 
            Q ${buildingX - size * 0.03} ${buildingY + buildingHeight * 0.5} 
            ${buildingX} ${buildingY + buildingHeight * 0.6}`}
        fill={stoneShadowColor}
        stroke={mortarColor}
        strokeWidth="0.3"
      />
      <path
        d={`M ${buildingX + buildingWidth} ${buildingY + buildingHeight * 0.4} 
            Q ${buildingX + buildingWidth + size * 0.03} ${buildingY + buildingHeight * 0.5} 
            ${buildingX + buildingWidth} ${buildingY + buildingHeight * 0.6}`}
        fill={stoneShadowColor}
        stroke={mortarColor}
        strokeWidth="0.3"
      />
      
      {/* Buttress supports */}
      <rect
        x={buildingX - size * 0.02}
        y={buildingY + buildingHeight * 0.3}
        width={size * 0.04}
        height={buildingHeight * 0.5}
        fill={graniteColor}
        stroke={mortarColor}
        strokeWidth="0.2"
      />
      <rect
        x={buildingX + buildingWidth - size * 0.02}
        y={buildingY + buildingHeight * 0.3}
        width={size * 0.04}
        height={buildingHeight * 0.5}
        fill={graniteColor}
        stroke={mortarColor}
        strokeWidth="0.2"
      />
      
      {/* Conical tower (characteristic feature) */}
      <path
        d={`M ${buildingX + buildingWidth * 0.7} ${buildingY + buildingHeight * 0.8} 
            L ${buildingX + buildingWidth * 0.75} ${buildingY - buildingHeight * 0.2} 
            L ${buildingX + buildingWidth * 0.95} ${buildingY + buildingHeight * 0.8} 
            Z`}
        fill={stoneColor}
        stroke={mortarColor}
        strokeWidth="0.3"
      />
      
      {/* Tower stone pattern */}
      {Array.from({ length: 8 }).map((_, i) => {
        const levelY = buildingY + buildingHeight * (0.75 - i * 0.12);
        const levelWidth = size * (0.08 - i * 0.008);
        return (
          <rect
            key={`tower-level-${i}`}
            x={buildingX + buildingWidth * 0.75 - levelWidth/2}
            y={levelY}
            width={levelWidth}
            height={size * 0.015}
            fill={graniteColor}
            stroke={mortarColor}
            strokeWidth="0.1"
          />
        );
      })}
      
      {/* Entrance portal */}
      <rect
        x={buildingX + buildingWidth * 0.35}
        y={buildingY + buildingHeight * 0.4}
        width={buildingWidth * 0.15}
        height={buildingHeight * 0.4}
        fill="rgba(0,0,0,0.8)"
        stroke={mortarColor}
        strokeWidth="0.3"
      />
      
      {/* Entrance lintel */}
      <rect
        x={buildingX + buildingWidth * 0.32}
        y={buildingY + buildingHeight * 0.4}
        width={buildingWidth * 0.21}
        height={size * 0.03}
        fill={graniteColor}
        stroke={mortarColor}
        strokeWidth="0.2"
      />
      
      {/* Gold decorative elements (if wealthy) */}
      {decorativeChance1 > 0.6 && (
        <g>
          <circle
            cx={buildingX + buildingWidth * 0.425}
            cy={buildingY + buildingHeight * 0.2}
            r={size * 0.02}
            fill={goldAccentColor}
            stroke={mortarColor}
            strokeWidth="0.2"
          />
          <rect
            x={buildingX + buildingWidth * 0.1}
            y={buildingY + buildingHeight * 0.15}
            width={buildingWidth * 0.6}
            height={size * 0.01}
            fill={goldAccentColor}
            opacity="0.8"
          />
        </g>
      )}
      
      {/* Narrow defensive windows */}
      {Array.from({ length: 3 }).map((_, i) => {
        const windowX = buildingX + buildingWidth * (0.15 + i * 0.25);
        return (
          <rect
            key={`window-${i}`}
            x={windowX}
            y={buildingY + buildingHeight * 0.25}
            width={size * 0.01}
            height={size * 0.08}
            fill="rgba(0,0,0,0.9)"
            stroke={mortarColor}
            strokeWidth="0.1"
          />
        );
      })}
      
      {/* Bird motifs (soapstone bird was symbol of Great Zimbabwe) */}
      {decorativeChance2 > 0.7 && (
        <g>
          <circle
            cx={buildingX + buildingWidth * 0.8}
            cy={buildingY + buildingHeight * 0.15}
            r={size * 0.015}
            fill={goldAccentColor}
          />
          <path
            d={`M ${buildingX + buildingWidth * 0.78} ${buildingY + buildingHeight * 0.15} 
                L ${buildingX + buildingWidth * 0.82} ${buildingY + buildingHeight * 0.13}
                L ${buildingX + buildingWidth * 0.82} ${buildingY + buildingHeight * 0.17}
                Z`}
            fill={goldAccentColor}
            opacity="0.8"
          />
        </g>
      )}
      
      {/* Terraced garden walls */}
      <rect
        x={buildingX - size * 0.06}
        y={buildingY + buildingHeight * 0.9}
        width={buildingWidth + size * 0.12}
        height={size * 0.02}
        fill={stoneColor}
        stroke={mortarColor}
        strokeWidth="0.2"
        opacity="0.8"
      />
      
      {/* Daga (clay and gravel) platform base */}
      <ellipse
        cx={buildingX + buildingWidth/2}
        cy={buildingY + buildingHeight + size * 0.01}
        rx={buildingWidth * 0.6}
        ry={size * 0.03}
        fill={mortarColor}
        opacity="0.6"
      />
      
      {/* Ritual/ceremonial area markings */}
      {decorativeChance3 > 0.5 && (
        <g>
          <circle
            cx={buildingX - size * 0.08}
            cy={buildingY + buildingHeight * 0.95}
            r={size * 0.04}
            fill="none"
            stroke={goldAccentColor}
            strokeWidth="0.5"
            opacity="0.6"
          />
          <circle
            cx={buildingX - size * 0.08}
            cy={buildingY + buildingHeight * 0.95}
            r={size * 0.02}
            fill={goldAccentColor}
            opacity="0.4"
          />
        </g>
      )}
    </g>
  );
});

export default AfricanStoneBuilding3D;