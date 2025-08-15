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

  // for sharper joins
  const snap = (n: number) => Math.round(n) + 0.5;
  const ve = 'non-scaling-stroke' as const;
  
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
    scaleFactor = 1.15;
    stories = rand() > 0.5 ? 2 : 1;
    hasBalcony = rand() > 0.6;
  } else if (tile.biome === BiomeType.LOW_DENSITY_URBAN) {
    scaleFactor = 1.05;
    stories = 1;
    hasBalcony = rand() > 0.8;
  } else {
    // Rural
    scaleFactor = 0.9 + rand() * 0.15;
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
    `hsl(15, 65%, 45%)`,
    `hsl(20, 55%, 40%)`,
    `hsl(25, 45%, 48%)`,
    `hsl(10, 60%, 42%)`
  ];
  const roofMain = roofColors[roofVariant];
  const roofDark = `hsl(15, 50%, 30%)`;
  
  // Wall colors
  const wallWhite = `hsl(45, 15%, ${92 + rand() * 6}%)`;
  const wallShadow = `hsl(45, 10%, 82%)`;
  const wallDark = `hsl(45, 8%, 75%)`;
  
  // Window and door colors
  const woodBrown = `hsl(25, 40%, 35%)`;
  const shutterBlue = rand() > 0.5 ? `hsl(200, 45%, 45%)` : woodBrown;
  
  // Helper for isometric right side
  const sideQuad = (x0: number, y0: number, w: number, h: number, d = depth) =>
    `M ${snap(x0 + w)} ${snap(y0)} L ${snap(x0 + w + d)} ${snap(y0 - d * 0.5)} L ${snap(x0 + w + d)} ${snap(y0 + h - d * 0.5)} L ${snap(x0 + w)} ${snap(y0 + h)} Z`;
  
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
      x={snap(bodyX)}
      y={snap(bodyY)}
      width={Math.round(bodyW)}
      height={Math.round(bodyH)}
      fill={`url(#wallFront-${uniqueId})`}
      stroke="rgba(0,0,0,0.2)"
      strokeWidth={0.45}
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
          x={snap(bodyX + bodyW * 0.2 - windowW / 2)}
          y={snap(windowY)}
          width={Math.round(windowW)}
          height={Math.round(windowH)}
          fill="rgba(20,25,30,0.8)"
          stroke={woodBrown}
          strokeWidth={0.4}
            />
        {/* Shutters */}
        <rect
          x={snap(bodyX + bodyW * 0.2 - windowW / 2 - windowW * 0.3)}
          y={snap(windowY)}
          width={Math.round(windowW * 0.25)}
          height={Math.round(windowH)}
          fill={shutterBlue}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.3}
            />
        <rect
          x={snap(bodyX + bodyW * 0.2 + windowW / 2 + windowW * 0.05)}
          y={snap(windowY)}
          width={Math.round(windowW * 0.25)}
          height={Math.round(windowH)}
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
          x={snap(bodyX + bodyW * 0.8 - windowW / 2)}
          y={snap(windowY)}
          width={Math.round(windowW)}
          height={Math.round(windowH)}
          fill="rgba(20,25,30,0.8)"
          stroke={woodBrown}
          strokeWidth={0.4}
            />
        {/* Shutters */}
        <rect
          x={snap(bodyX + bodyW * 0.8 - windowW / 2 - windowW * 0.3)}
          y={snap(windowY)}
          width={Math.round(windowW * 0.25)}
          height={Math.round(windowH)}
          fill={shutterBlue}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.3}
            />
        <rect
          x={snap(bodyX + bodyW * 0.8 + windowW / 2 + windowW * 0.05)}
          y={snap(windowY)}
          width={Math.round(windowW * 0.25)}
          height={Math.round(windowH)}
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
          d={`M ${snap(doorX)} ${snap(doorY + doorH)}
              L ${snap(doorX)} ${snap(doorY + doorH * 0.3)}
              Q ${snap(doorX + doorW / 2)} ${snap(doorY)}
                ${snap(doorX + doorW)} ${snap(doorY + doorH * 0.3)}
              L ${snap(doorX + doorW)} ${snap(doorY + doorH)}
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
        x={snap(doorX)}
        y={snap(doorY)}
        width={Math.round(doorW)}
        height={Math.round(doorH)}
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
          x={snap(bodyX + bodyW * 0.3)}
          y={snap(balconyY)}
          width={Math.round(bodyW * 0.4)}
          height={Math.round(adjustedSize * 0.015)}
          fill={wallShadow}
          stroke="rgba(0,0,0,0.2)"
          strokeWidth={0.3}
            />
        {/* Railing */}
        <line
          x1={snap(bodyX + bodyW * 0.3)}
          y1={snap(balconyY - adjustedSize * 0.03)}
          x2={snap(bodyX + bodyW * 0.7)}
          y2={snap(balconyY - adjustedSize * 0.03)}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={0.8}
            />
      </g>
    );
  }
  
  // Clay tile roof — **FIXED ridge join**
  const roofOverhang = adjustedSize * 0.06;
  const roofHeight = adjustedSize * 0.15;
  const roofX = bodyX - roofOverhang;
  const roofY = bodyY - roofHeight * 0.5;
  const roofW = bodyW + roofOverhang * 2;

  // Shared ridge peak for BOTH front & side surfaces
  const baseY = roofY + roofHeight;
  const peakXFront = roofX + roofW * 0.5;
  const peakY = roofY - roofHeight * 0.28;          // visible apex
  const controlY = 2 * peakY - baseY;               // makes the quadratic pass through peakY
  const peakXBack  = peakXFront + depth * 0.45;
  const peakYBack  = peakY - depth * 0.2;

  // Right roof (side in iso) – uses the *same* peak as the front
  gEls.push(
    <path
      key="roof-side"
      d={`M ${snap(roofX + roofW)} ${snap(baseY)}
          L ${snap(roofX + roofW + depth * 0.9)} ${snap(baseY - depth * 0.45)}
          L ${snap(peakXBack)} ${snap(peakYBack)}
          L ${snap(peakXFront)} ${snap(peakY)} Z`}
      fill={roofDark}
      stroke="rgba(0,0,0,0.3)"
      strokeWidth={0.45}
      opacity={0.95}
    />
  );

  // Front roof – quadratic arc that *passes through* the same peak
  gEls.push(
    <path
      key="roof-front"
      d={`M ${snap(roofX)} ${snap(baseY)}
          Q ${snap(peakXFront)} ${snap(controlY)}
            ${snap(roofX + roofW)} ${snap(baseY)}
          L ${snap(roofX)} ${snap(baseY)} Z`}
      fill={`url(#tiles-${uniqueId})`}
      stroke="rgba(0,0,0,0.3)"
      strokeWidth={0.5}
    />
  );

  // (optional) tiny highlight along the ridge for readability
  gEls.push(
    <line
      key="ridge-highlight"
      x1={snap(peakXFront)}
      y1={snap(peakY)}
      x2={snap(peakXBack)}
      y2={snap(peakYBack)}
      stroke="rgba(255,255,255,0.2)"
      strokeWidth={0.4}
    />
  );
  
  // Chimney for some buildings
  if (rand() > 0.6) {
    const chimneyX = bodyX + bodyW * (0.7 + rand() * 0.2);
    const chimneyY = roofY - adjustedSize * 0.02;
    gEls.push(
      <g key="chimney">
        <rect
          x={snap(chimneyX)}
          y={snap(chimneyY - adjustedSize * 0.06)}
          width={Math.round(adjustedSize * 0.03)}
          height={Math.round(adjustedSize * 0.08)}
          fill={wallWhite}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={0.3}
            />
        <rect
          x={snap(chimneyX - adjustedSize * 0.005)}
          y={snap(chimneyY - adjustedSize * 0.065)}
          width={Math.round(adjustedSize * 0.04)}
          height={Math.round(adjustedSize * 0.008)}
          fill={roofMain}
        />
      </g>
    );
  }
  
  // Night lighting (unchanged)
  if (nightIntensity > 0.3) {
    const windowGlow = 'rgba(255, 200, 100, 0.7)';
    for (let s = 0; s < stories; s++) {
      if (rand() > 0.4) {
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
    <g filter="url(#symbolShadow)" strokeLinejoin="miter" strokeLinecap="butt">
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
