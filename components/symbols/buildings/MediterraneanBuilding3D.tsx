/**
 * components/symbols/buildings/MediterraneanBuilding3D.tsx
 * Mediterranean-style buildings with whitewashed walls and red clay tile roofs
 * Works for Mediterranean Europe, parts of MENA, colonial/modern Latin America
 */
import React from 'react';
import { Tile, HistoricalEra, BiomeType } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface MediterraneanBuilding3DProps {
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  seed: number;
  tile: Tile;
  era: HistoricalEra;
  roofColor?: string;
  nightIntensity?: number;
}

const MediterraneanBuilding3D: React.FC<MediterraneanBuilding3DProps> = React.memo(({ 
  x, y, size, seed, tile, era, nightIntensity = 0 
}) => {
  const rng = new ValueNoise(seed + tile.x * 173 + tile.y * 179);
  const rand = () => rng.random();
  const uniqueId = `med-building-${tile.x}-${tile.y}`;
  
  // Determine scale based on density
  let scaleFactor = 0.8;
  let stories = 1;
  let hasBalcony = false;
  let hasArches = false;
  
  if (tile.biome === BiomeType.CITY_CENTER) {
    scaleFactor = 0.95;
    stories = rand() > 0.3 ? 3 : 2;
    hasBalcony = rand() > 0.4;
    hasArches = rand() > 0.5;
  } else if (tile.biome === BiomeType.HIGH_DENSITY_URBAN) {
    scaleFactor = 0.85;
    stories = rand() > 0.5 ? 2 : 1;
    hasBalcony = rand() > 0.6;
  } else if (tile.biome === BiomeType.LOW_DENSITY_URBAN) {
    scaleFactor = 0.75;
    stories = 1;
    hasBalcony = rand() > 0.8;
  } else {
    // Rural
    scaleFactor = 0.6 + rand() * 0.15;
    stories = 1;
  }
  
  const adjustedSize = size * scaleFactor;
  const depth = adjustedSize * 0.2;
  
  // Building dimensions
  const bodyW = adjustedSize * 0.55;
  const bodyH = adjustedSize * (0.3 + stories * 0.12);
  const bodyX = x + (size - bodyW) / 2;
  const bodyY = y + size * 0.5 - bodyH * 0.2;
  
  // Roof color variations - different shades of red/terracotta
  const roofVariant = Math.floor(rand() * 4);
  const roofColors = [
    `hsl(15, 65%, 45%)`,  // Rich red
    `hsl(20, 55%, 40%)`,  // Brick red
    `hsl(25, 45%, 48%)`,  // Tan-brown-red
    `hsl(10, 60%, 42%)`   // Deep terracotta
  ];
  const roofMain = roofColors[roofVariant];
  const roofDark = `hsl(15, 50%, 30%)`;
  
  // Wall colors - whitewashed with slight variations
  const wallWhite = `hsl(45, 15%, ${92 + rand() * 6}%)`;
  const wallShadow = `hsl(45, 10%, 82%)`;
  const wallDark = `hsl(45, 8%, 75%)`;
  
  // Window and door colors
  const woodBrown = `hsl(25, 40%, 35%)`;
  const shutterBlue = rand() > 0.5 ? `hsl(200, 45%, 45%)` : woodBrown;
  
  // Helper for isometric right side
  const sideQuad = (x0: number, y0: number, w: number, h: number, d = depth) =>
    `M ${x0 + w} ${y0} L ${x0 + w + d} ${y0 - d * 0.5} L ${x0 + w + d} ${y0 + h - d * 0.5} L ${x0 + w} ${y0 + h} Z`;
  
  const gEls: JSX.Element[] = [];
  
  // Ground shadow
  gEls.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={bodyY + bodyH + adjustedSize * 0.08}
      rx={adjustedSize * 0.32}
      ry={adjustedSize * 0.1}
      fill="rgba(0,0,0,0.22)"
      filter={`url(#blur-${uniqueId})`}
    />
  );
  
  // Main body - side
  gEls.push(
    <path
      key="body-side"
      d={sideQuad(bodyX, bodyY, bodyW, bodyH)}
      fill={`url(#wallSide-${uniqueId})`}
      stroke="rgba(0,0,0,0.2)"
      strokeWidth={0.4}
    />
  );
  
  // Main body - front
  gEls.push(
    <rect
      key="body-front"
      x={bodyX}
      y={bodyY}
      width={bodyW}
      height={bodyH}
      fill={`url(#wallFront-${uniqueId})`}
      stroke="rgba(0,0,0,0.2)"
      strokeWidth={0.5}
    />
  );
  
  // Windows for each story
  const windowW = adjustedSize * 0.06;
  const windowH = adjustedSize * 0.08;
  const storyHeight = bodyH / stories;
  
  for (let s = 0; s < stories; s++) {
    const windowY = bodyY + storyHeight * s + storyHeight * 0.3;
    
    // Left window
    gEls.push(
      <g key={`window-left-${s}`}>
        <rect
          x={bodyX + bodyW * 0.2 - windowW / 2}
          y={windowY}
          width={windowW}
          height={windowH}
          fill="rgba(20,25,30,0.8)"
          stroke={woodBrown}
          strokeWidth={0.4}
        />
        {/* Shutters */}
        <rect
          x={bodyX + bodyW * 0.2 - windowW / 2 - windowW * 0.3}
          y={windowY}
          width={windowW * 0.25}
          height={windowH}
          fill={shutterBlue}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.3}
        />
        <rect
          x={bodyX + bodyW * 0.2 + windowW / 2 + windowW * 0.05}
          y={windowY}
          width={windowW * 0.25}
          height={windowH}
          fill={shutterBlue}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.3}
        />
      </g>
    );
    
    // Right window
    gEls.push(
      <g key={`window-right-${s}`}>
        <rect
          x={bodyX + bodyW * 0.8 - windowW / 2}
          y={windowY}
          width={windowW}
          height={windowH}
          fill="rgba(20,25,30,0.8)"
          stroke={woodBrown}
          strokeWidth={0.4}
        />
        {/* Shutters */}
        <rect
          x={bodyX + bodyW * 0.8 - windowW / 2 - windowW * 0.3}
          y={windowY}
          width={windowW * 0.25}
          height={windowH}
          fill={shutterBlue}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.3}
        />
        <rect
          x={bodyX + bodyW * 0.8 + windowW / 2 + windowW * 0.05}
          y={windowY}
          width={windowW * 0.25}
          height={windowH}
          fill={shutterBlue}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.3}
        />
      </g>
    );
  }
  
  // Door (with arch if hasArches)
  const doorW = adjustedSize * 0.08;
  const doorH = adjustedSize * 0.14;
  const doorX = bodyX + bodyW / 2 - doorW / 2;
  const doorY = bodyY + bodyH - doorH;
  
  if (hasArches) {
    gEls.push(
      <g key="door-arch">
        <path
          d={`M ${doorX} ${doorY + doorH}
              L ${doorX} ${doorY + doorH * 0.3}
              Q ${doorX + doorW / 2} ${doorY}
                ${doorX + doorW} ${doorY + doorH * 0.3}
              L ${doorX + doorW} ${doorY + doorH}
              Z`}
          fill="rgba(15,15,20,0.85)"
          stroke={woodBrown}
          strokeWidth={0.5}
        />
      </g>
    );
  } else {
    gEls.push(
      <rect
        key="door"
        x={doorX}
        y={doorY}
        width={doorW}
        height={doorH}
        fill="rgba(15,15,20,0.85)"
        stroke={woodBrown}
        strokeWidth={0.5}
      />
    );
  }
  
  // Balcony for upper floors
  if (hasBalcony && stories > 1) {
    const balconyY = bodyY + storyHeight + storyHeight * 0.2;
    gEls.push(
      <g key="balcony">
        <rect
          x={bodyX + bodyW * 0.3}
          y={balconyY}
          width={bodyW * 0.4}
          height={adjustedSize * 0.015}
          fill={wallShadow}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth={0.3}
        />
        {/* Railing */}
        <line
          x1={bodyX + bodyW * 0.3}
          y1={balconyY - adjustedSize * 0.03}
          x2={bodyX + bodyW * 0.7}
          y2={balconyY - adjustedSize * 0.03}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={0.8}
        />
      </g>
    );
  }
  
  // Clay tile roof - hipped style typical of Mediterranean
  const roofOverhang = adjustedSize * 0.06;
  const roofHeight = adjustedSize * 0.15;
  const roofX = bodyX - roofOverhang;
  const roofY = bodyY - roofHeight * 0.5;
  const roofW = bodyW + roofOverhang * 2;
  
  // Roof side (3D effect)
  gEls.push(
    <path
      key="roof-side"
      d={`M ${roofX + roofW} ${roofY + roofHeight}
          L ${roofX + roofW + depth * 0.9} ${roofY + roofHeight - depth * 0.45}
          L ${roofX + roofW / 2 + depth * 0.45} ${roofY - depth * 0.2}
          L ${roofX + roofW / 2} ${roofY}
          Z`}
      fill={roofDark}
      stroke="rgba(0,0,0,0.3)"
      strokeWidth={0.4}
      opacity={0.95}
    />
  );
  
  // Roof front - hipped with gentle slope
  gEls.push(
    <path
      key="roof-front"
      d={`M ${roofX} ${roofY + roofHeight}
          Q ${roofX + roofW * 0.5} ${roofY - roofHeight * 0.3}
            ${roofX + roofW} ${roofY + roofHeight}
          Z`}
      fill={`url(#tiles-${uniqueId})`}
      stroke="rgba(0,0,0,0.3)"
      strokeWidth={0.5}
    />
  );
  
  // Chimney for some buildings
  if (rand() > 0.6) {
    const chimneyX = bodyX + bodyW * (0.7 + rand() * 0.2);
    const chimneyY = roofY - adjustedSize * 0.02;
    gEls.push(
      <g key="chimney">
        <rect
          x={chimneyX}
          y={chimneyY - adjustedSize * 0.06}
          width={adjustedSize * 0.03}
          height={adjustedSize * 0.08}
          fill={wallWhite}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.3}
        />
        <rect
          x={chimneyX - adjustedSize * 0.005}
          y={chimneyY - adjustedSize * 0.065}
          width={adjustedSize * 0.04}
          height={adjustedSize * 0.008}
          fill={roofMain}
        />
      </g>
    );
  }
  
  // Night lighting
  if (nightIntensity > 0.3) {
    const windowGlow = 'rgba(255, 200, 100, 0.7)';
    
    for (let s = 0; s < stories; s++) {
      if (rand() > 0.4) { // Some windows are lit
        const windowY = bodyY + storyHeight * s + storyHeight * 0.3;
        gEls.push(
          <g key={`night-glow-${s}`} opacity={nightIntensity}>
            <rect
              x={bodyX + bodyW * 0.2 - windowW / 2}
              y={windowY}
              width={windowW}
              height={windowH}
              fill={windowGlow}
              filter={`url(#blur-${uniqueId})`}
            />
          </g>
        );
      }
    }
  }
  
  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <clipPath id={`clip-${uniqueId}`}>
          <rect x={x} y={y} width={size} height={size} />
        </clipPath>
        
        <filter id={`blur-${uniqueId}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        
        {/* Wall gradients */}
        <linearGradient id={`wallFront-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wallWhite} />
          <stop offset="100%" stopColor={wallShadow} />
        </linearGradient>
        
        <linearGradient id={`wallSide-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={wallShadow} />
          <stop offset="100%" stopColor={wallDark} />
        </linearGradient>
        
        {/* Clay tile pattern */}
        <pattern id={`tiles-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="6">
          <rect width="8" height="6" fill={roofMain} />
          <path d="M 0 2 Q 4 1 8 2" stroke={roofDark} strokeWidth="0.5" fill="none" opacity="0.6"/>
          <path d="M 0 4 Q 4 3 8 4" stroke={roofDark} strokeWidth="0.5" fill="none" opacity="0.5"/>
          <rect x="2" y="0" width="0.5" height="6" fill={roofDark} opacity="0.3"/>
          <rect x="5" y="0" width="0.5" height="6" fill={roofDark} opacity="0.3"/>
        </pattern>
      </defs>
      
      <g clipPath={`url(#clip-${uniqueId})`}>
        {gEls}
      </g>
    </g>
  );
});

export default MediterraneanBuilding3D;