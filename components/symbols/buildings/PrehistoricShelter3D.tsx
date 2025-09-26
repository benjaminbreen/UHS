/**
 * components/symbols/buildings/PrehistoricShelter3D.tsx - Simple prehistoric shelter
 */
import React from 'react';
import { Tile, HistoricalEra } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface PrehistoricShelter3DProps {
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  seed: number;
  tile: Tile;
  roofColor: string;
  era: HistoricalEra;
  nightIntensity?: number;
}

const PrehistoricShelter3D: React.FC<PrehistoricShelter3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, era, nightIntensity = 0 
}) => {
  const rand = new ValueNoise(seed + tile.x * 7 + tile.y * 11).random;
  const uniqueId = `prehistoric-${tile.x}-${tile.y}`;
  
  const buildingWidth = width * 0.8;
  const buildingHeight = height * 0.6;
  const buildingX = x + (width - buildingWidth) / 2;
  const buildingY = y + height - buildingHeight;
  
  const hideColor = `hsl(35, 30%, ${45 + rand() * 12}%)`;
  const hideShadow = `hsl(35, 30%, 30%)`;
  const poleWood = `hsl(25, 25%, ${35 + rand() * 8}%)`;
  const fireColor = 'rgba(255, 120, 40, 0.9)';
  const emberColor = 'rgba(255, 160, 80, 0.7)';
  
  // Fire pit outside shelter (50% chance at night)
  const renderFirePit = () => {
    if (nightIntensity < 0.2 || rand() < 0.5) return null;
    
    const fireX = buildingX + buildingWidth + size * 0.08;
    const fireY = buildingY + buildingHeight - size * 0.02;
    
    return (
      <g>
        {/* Fire glow */}
        <circle
          cx={fireX}
          cy={fireY}
          r={size * 0.12}
          fill={emberColor}
          opacity={nightIntensity * 0.7}
          filter="blur(6px)"
        />
        <circle
          cx={fireX}
          cy={fireY}
          r={size * 0.06}
          fill={fireColor}
          opacity={nightIntensity * 0.9}
          filter="blur(3px)"
        />
        {/* Fire pit stones */}
        <ellipse
          cx={fireX}
          cy={fireY + size * 0.03}
          rx={size * 0.05}
          ry={size * 0.02}
          fill="#666"
          opacity={nightIntensity * 0.8}
        />
      </g>
    );
  };

  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <pattern id={`hideTexture-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill={hideColor}/>
          <circle cx="1" cy="1" r="0.3" fill={hideShadow} opacity="0.3"/>
          <circle cx="3" cy="3" r="0.2" fill={hideShadow} opacity="0.2"/>
        </pattern>
      </defs>
      
      {/* Ground shadow */}
      <ellipse
        cx={buildingX + buildingWidth/2}
        cy={buildingY + buildingHeight + size * 0.02}
        rx={buildingWidth * 0.8}
        ry={buildingWidth * 0.2}
        fill="rgba(0,0,0,0.15)"
      />
      
      {/* Simple A-frame shelter */}
      <path
        d={`M ${buildingX} ${buildingY + buildingHeight} 
            L ${buildingX + buildingWidth/2} ${buildingY} 
            L ${buildingX + buildingWidth} ${buildingY + buildingHeight} 
            Z`}
        fill={`url(#hideTexture-${uniqueId})`}
        stroke={hideShadow}
        strokeWidth="0.3"
      />
      
      {/* 3D depth side - fixed ratios */}
      <path
        d={`M ${buildingX + buildingWidth} ${buildingY + buildingHeight}
            L ${buildingX + buildingWidth/2} ${buildingY}
            L ${buildingX + buildingWidth/2 + size * 0.08} ${buildingY - size * 0.08}
            L ${buildingX + buildingWidth + size * 0.08} ${buildingY + buildingHeight - size * 0.08}
            Z`}
        fill={hideShadow}
        stroke={hideShadow}
        strokeWidth="0.2"
      />
      
      {/* Support poles */}
      <rect
        x={buildingX + buildingWidth/2 - size * 0.01}
        y={buildingY}
        width={size * 0.02}
        height={buildingHeight}
        fill={poleWood}
      />
      
      {/* Side support */}
      <rect
        x={buildingX + buildingWidth * 0.2}
        y={buildingY + buildingHeight * 0.7}
        width={size * 0.015}
        height={buildingHeight * 0.3}
        fill={poleWood}
      />
      <rect
        x={buildingX + buildingWidth * 0.8}
        y={buildingY + buildingHeight * 0.7}
        width={size * 0.015}
        height={buildingHeight * 0.3}
        fill={poleWood}
      />
      
      {/* Opening/entrance with 3D depth */}
      <path
        d={`M ${buildingX + buildingWidth * 0.4} ${buildingY + buildingHeight}
            L ${buildingX + buildingWidth/2} ${buildingY + buildingHeight * 0.4}
            L ${buildingX + buildingWidth * 0.6} ${buildingY + buildingHeight}
            Z`}
        fill="rgba(0,0,0,0.7)"
      />
      {/* Entrance depth shadow */}
      <path
        d={`M ${buildingX + buildingWidth * 0.6} ${buildingY + buildingHeight}
            L ${buildingX + buildingWidth/2 + size * 0.04} ${buildingY + buildingHeight * 0.4 - size * 0.04}
            L ${buildingX + buildingWidth * 0.6 + size * 0.04} ${buildingY + buildingHeight - size * 0.04}
            Z`}
        fill="rgba(0,0,0,0.5)"
      />
      
      {/* Hide texture details - patches and seams */}
      <path
        d={`M ${buildingX + buildingWidth * 0.3} ${buildingY + buildingHeight * 0.6} 
            L ${buildingX + buildingWidth * 0.7} ${buildingY + buildingHeight * 0.6}`}
        stroke={hideShadow}
        strokeWidth="0.4"
        opacity="0.5"
      />
      <path
        d={`M ${buildingX + buildingWidth/2} ${buildingY + buildingHeight * 0.2} 
            L ${buildingX + buildingWidth/2} ${buildingY + buildingHeight * 0.8}`}
        stroke={hideShadow}
        strokeWidth="0.3"
        opacity="0.4"
      />
      
      {/* Simple tools leaning against shelter - fixed positioning */}
      {rand() > 0.6 && (
        <g>
          <line
            x1={buildingX + size * 0.02}
            y1={buildingY + buildingHeight}
            x2={buildingX + size * 0.06}
            y2={buildingY + buildingHeight * 0.7}
            stroke={poleWood}
            strokeWidth="0.8"
          />
          <circle
            cx={buildingX + size * 0.055}
            cy={buildingY + buildingHeight * 0.72}
            r={size * 0.015}
            fill="#666"
          />
        </g>
      )}
      
      {/* Fire pit */}
      {renderFirePit()}
    </g>
  );
});

export default PrehistoricShelter3D;