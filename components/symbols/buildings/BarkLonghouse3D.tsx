/**
 * components/symbols/buildings/BarkLonghouse3D.tsx - Native American bark longhouse
 */
import React from 'react';
import { Tile, HistoricalEra } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface BarkLonghouse3DProps {
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

const BarkLonghouse3D: React.FC<BarkLonghouse3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, era, nightIntensity = 0 
}) => {
  const rng = new ValueNoise(seed + tile.x * 17 + tile.y * 29);
  const uniqueId = `bark-longhouse-${tile.x}-${tile.y}`;
  
  // Pre-calculate all random values to prevent re-rendering
  const rand1 = rng.random();
  const rand2 = rng.random();
  const rand3 = rng.random();
  const rand4 = rng.random();
  const rand5 = rng.random();
  
  // Bark longhouse is elongated
  const buildingWidth = width * 1.6;
  const buildingHeight = height * 0.7;
  const buildingX = x - buildingWidth * 0.3;
  const buildingY = y + height - buildingHeight;
  
  const barkBrown = `hsl(30, 35%, ${40 + rand1 * 12}%)`;
  const barkShadow = `hsl(30, 35%, 25%)`;
  const frameWood = `hsl(25, 30%, ${35 + rand2 * 10}%)`;
  const smokeGray = 'rgba(120, 120, 120, 0.7)';
  
  const renderTorchLighting = () => {
    if (nightIntensity < 0.2 || rand3 < 0.7) return null; // 30% chance
    
    const torchX = buildingX - size * 0.08;
    const torchY = buildingY + buildingHeight * 0.5;
    const fireColor = 'rgba(255, 140, 60, 0.9)';
    const glowColor = 'rgba(255, 160, 80, 0.6)';
    
    return (
      <g>
        <circle
          cx={torchX}
          cy={torchY}
          r={size * 0.1}
          fill={glowColor}
          opacity={nightIntensity * 0.8}
          filter="blur(5px)"
        />
        <circle
          cx={torchX}
          cy={torchY}
          r={size * 0.05}
          fill={fireColor}
          opacity={nightIntensity}
          filter="blur(2px)"
        />
        <rect
          x={torchX - size * 0.008}
          y={torchY}
          width={size * 0.016}
          height={size * 0.12}
          fill={frameWood}
          opacity={nightIntensity * 0.8}
        />
      </g>
    );
  };

  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <pattern id={`barkTexture-${uniqueId}`} patternUnits="userSpaceOnUse" width="6" height="8">
          <rect width="6" height="8" fill={barkBrown}/>
          <rect x="0" y="2" width="6" height="1" fill={barkShadow} opacity="0.4"/>
          <rect x="0" y="5" width="6" height="1" fill={barkShadow} opacity="0.3"/>
          <rect x="1" y="0" width="1" height="8" fill={barkShadow} opacity="0.2"/>
          <rect x="4" y="0" width="1" height="8" fill={barkShadow} opacity="0.2"/>
        </pattern>
        <linearGradient id={`barkGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={barkBrown} />
          <stop offset="100%" stopColor={barkShadow} />
        </linearGradient>
      </defs>
      
      {/* Ground shadow */}
      <ellipse
        cx={buildingX + buildingWidth/2}
        cy={buildingY + buildingHeight + size * 0.02}
        rx={buildingWidth * 0.7}
        ry={buildingWidth * 0.15}
        fill="rgba(0,0,0,0.2)"
      />
      
      {/* Main structure - curved barrel shape */}
      <path
        d={`M ${buildingX} ${buildingY + buildingHeight} 
            Q ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.1} 
            ${buildingX + buildingWidth} ${buildingY + buildingHeight} 
            Z`}
        fill={`url(#barkTexture-${uniqueId})`}
        stroke={barkShadow}
        strokeWidth="0.3"
      />
      
      {/* Side wall for 3D effect */}
      <path
        d={`M ${buildingX + buildingWidth} ${buildingY + buildingHeight} 
            Q ${buildingX + buildingWidth + size * 0.15} ${buildingY - buildingHeight * 0.05} 
            ${buildingX + buildingWidth + size * 0.15} ${buildingY + buildingHeight * 0.8}
            Q ${buildingX + buildingWidth} ${buildingY + buildingHeight * 0.9}
            ${buildingX + buildingWidth} ${buildingY + buildingHeight}
            Z`}
        fill={barkShadow}
        stroke={barkShadow}
        strokeWidth="0.2"
      />
      
      {/* Vertical bark strips */}
      {Array.from({ length: Math.floor(buildingWidth / (size * 0.08)) }).map((_, i) => {
        const stripX = buildingX + i * size * 0.08;
        const stripHeight = buildingHeight * (0.6 + Math.sin(i) * 0.2);
        return (
          <rect
            key={`strip-${i}`}
            x={stripX}
            y={buildingY + buildingHeight - stripHeight}
            width={size * 0.02}
            height={stripHeight}
            fill={frameWood}
            opacity="0.6"
          />
        );
      })}
      
      {/* Entrance opening */}
      <ellipse
        cx={buildingX + buildingWidth * 0.15}
        cy={buildingY + buildingHeight * 0.8}
        rx={size * 0.04}
        ry={size * 0.06}
        fill="rgba(0,0,0,0.8)"
      />
      
      {/* Smoke holes */}
      <circle
        cx={buildingX + buildingWidth * 0.3}
        cy={buildingY + buildingHeight * 0.2}
        r={size * 0.02}
        fill="rgba(0,0,0,0.6)"
      />
      <circle
        cx={buildingX + buildingWidth * 0.7}
        cy={buildingY + buildingHeight * 0.15}
        r={size * 0.02}
        fill="rgba(0,0,0,0.6)"
      />
      
      {/* Smoke from hearths */}
      {rand4 > 0.4 && (
        <g>
          <circle
            cx={buildingX + buildingWidth * 0.3}
            cy={buildingY + buildingHeight * 0.1}
            r={size * 0.015}
            fill={smokeGray}
            opacity="0.6"
          />
          <circle
            cx={buildingX + buildingWidth * 0.7 + (rand5 - 0.5) * size * 0.03}
            cy={buildingY + buildingHeight * 0.05}
            r={size * 0.01}
            fill={smokeGray}
            opacity="0.4"
          />
        </g>
      )}
      
      {/* Wooden frame posts */}
      <rect
        x={buildingX + size * 0.02}
        y={buildingY + buildingHeight * 0.2}
        width={size * 0.02}
        height={buildingHeight * 0.6}
        fill={frameWood}
      />
      <rect
        x={buildingX + buildingWidth - size * 0.04}
        y={buildingY + buildingHeight * 0.2}
        width={size * 0.02}
        height={buildingHeight * 0.6}
        fill={frameWood}
      />
      
      {/* Torch lighting */}
      {renderTorchLighting()}
    </g>
  );
});

export default BarkLonghouse3D;