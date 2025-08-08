/**
 * components/symbols/buildings/BarkLonghouse3D.tsx - Native American bark longhouse in 2.5D isometric
 */
import React from 'react';
import { Tile, HistoricalEra, BiomeType } from '../../../types';
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
  const rand = () => rng.random();
  
  // Determine scale based on density
  let scaleFactor = 0.8;
  if (tile.biome === BiomeType.CITY_CENTER || tile.biome === BiomeType.HIGH_DENSITY_URBAN) {
    scaleFactor = 0.95;
  } else if (tile.biome === BiomeType.LOW_DENSITY_URBAN) {
    scaleFactor = 0.85;
  } else {
    scaleFactor = 0.65 + rand() * 0.15; // Rural/hamlet variation
  }
  
  // 2.5D isometric dimensions - elongated for longhouse
  const adjustedSize = size * scaleFactor;
  const buildingWidth = adjustedSize * 0.85; // Wider for longhouse
  const buildingHeight = adjustedSize * 0.35;
  const buildingDepth = adjustedSize * 0.25;
  
  // Center the building in the tile
  const buildingX = x + (size - buildingWidth) / 2;
  const buildingY = y + (size - adjustedSize) / 2 + adjustedSize * 0.4;
  
  // Colors
  const barkLight = `hsl(30, 28%, ${48 + rand() * 8}%)`;
  const barkMid = `hsl(28, 25%, ${38 + rand() * 8}%)`;
  const barkDark = `hsl(26, 22%, 28%)`;
  const frameWood = `hsl(25, 20%, 25%)`;
  const roofBark = `hsl(32, 24%, ${42 + rand() * 6}%)`;
  const roofDark = `hsl(30, 20%, 32%)`;
  
  // Helper function for isometric right side
  const sideQuad = (x0: number, y0: number, w: number, h: number, d: number = buildingDepth) =>
    `M ${x0 + w} ${y0} L ${x0 + w + d} ${y0 - d * 0.5} L ${x0 + w + d} ${y0 + h - d * 0.5} L ${x0 + w} ${y0 + h} Z`;
  
  const gEls: JSX.Element[] = [];
  
  // Ground shadow
  gEls.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={y + (size - adjustedSize) / 2 + adjustedSize * 0.88}
      rx={buildingWidth * 0.55}
      ry={buildingWidth * 0.2}
      fill="rgba(0,0,0,0.25)"
      filter={`url(#blur-${uniqueId})`}
    />
  );
  
  // Main body - right side (behind)
  gEls.push(
    <path
      key="body-side"
      d={sideQuad(buildingX, buildingY, buildingWidth, buildingHeight)}
      fill={`url(#sideGradient-${uniqueId})`}
      stroke={frameWood}
      strokeWidth={0.5}
    />
  );
  
  // Main body - front
  gEls.push(
    <rect
      key="body-front"
      x={buildingX}
      y={buildingY}
      width={buildingWidth}
      height={buildingHeight}
      fill={`url(#barkTexture-${uniqueId})`}
      stroke={frameWood}
      strokeWidth={0.6}
    />
  );
  
  // Roof - curved barrel vault in isometric
  const roofOverhang = adjustedSize * 0.08;
  const roofHeight = adjustedSize * 0.18;
  const roofX = buildingX - roofOverhang;
  const roofY = buildingY - roofHeight * 0.7;
  const roofWidth = buildingWidth + roofOverhang * 2;
  
  // Roof side (behind)
  gEls.push(
    <path
      key="roof-side"
      d={`M ${roofX + roofWidth} ${roofY + roofHeight}
          L ${roofX + roofWidth + buildingDepth} ${roofY + roofHeight - buildingDepth * 0.5}
          Q ${roofX + roofWidth + buildingDepth * 0.5} ${roofY - buildingDepth * 0.3}
            ${roofX + roofWidth * 0.5 + buildingDepth * 0.5} ${roofY - buildingDepth * 0.4}
          L ${roofX + roofWidth * 0.5} ${roofY}
          Q ${roofX + roofWidth} ${roofY - roofHeight * 0.2}
            ${roofX + roofWidth} ${roofY + roofHeight}
          Z`}
      fill={roofDark}
      stroke={frameWood}
      strokeWidth={0.4}
      opacity={0.95}
    />
  );
  
  // Roof front - curved barrel shape
  gEls.push(
    <path
      key="roof-front"
      d={`M ${roofX} ${roofY + roofHeight}
          Q ${roofX + roofWidth * 0.5} ${roofY - roofHeight * 0.3}
            ${roofX + roofWidth} ${roofY + roofHeight}
          Z`}
      fill={`url(#roofPattern-${uniqueId})`}
      stroke={frameWood}
      strokeWidth={0.6}
    />
  );
  
  // Vertical support posts (visible)
  const postWidth = adjustedSize * 0.018;
  const posts = 3;
  for (let i = 0; i < posts; i++) {
    const postX = buildingX + (buildingWidth / (posts + 1)) * (i + 1) - postWidth / 2;
    gEls.push(
      <rect
        key={`post-${i}`}
        x={postX}
        y={buildingY}
        width={postWidth}
        height={buildingHeight}
        fill={frameWood}
        opacity={0.8}
      />
    );
  }
  
  // Entrance - dark oval opening
  const doorWidth = adjustedSize * 0.08;
  const doorHeight = adjustedSize * 0.12;
  gEls.push(
    <ellipse
      key="door"
      cx={buildingX + buildingWidth * 0.15}
      cy={buildingY + buildingHeight - doorHeight / 2}
      rx={doorWidth / 2}
      ry={doorHeight / 2}
      fill="rgba(10,10,15,0.9)"
      stroke={frameWood}
      strokeWidth={0.4}
    />
  );
  
  // Smoke holes on roof
  if (rand() > 0.3) {
    const holeSize = adjustedSize * 0.02;
    gEls.push(
      <g key="smoke-holes">
        <ellipse
          cx={buildingX + buildingWidth * 0.3}
          cy={roofY + roofHeight * 0.3}
          rx={holeSize}
          ry={holeSize * 0.7}
          fill="rgba(20,20,25,0.8)"
        />
        <ellipse
          cx={buildingX + buildingWidth * 0.7}
          cy={roofY + roofHeight * 0.25}
          rx={holeSize}
          ry={holeSize * 0.7}
          fill="rgba(20,20,25,0.8)"
        />
      </g>
    );
    
    // Rising smoke
    if (rand() > 0.5) {
      gEls.push(
        <g key="smoke" opacity={0.6}>
          <circle
            cx={buildingX + buildingWidth * 0.3}
            cy={roofY + roofHeight * 0.1}
            r={adjustedSize * 0.025}
            fill="rgba(140,140,140,0.5)"
            filter={`url(#blur-${uniqueId})`}
          />
          <circle
            cx={buildingX + buildingWidth * 0.7}
            cy={roofY + roofHeight * 0.05}
            r={adjustedSize * 0.02}
            fill="rgba(140,140,140,0.4)"
            filter={`url(#blur-${uniqueId})`}
          />
        </g>
      );
    }
  }
  
  // Night torch lighting
  if (nightIntensity > 0.3 && rand() > 0.6) {
    const torchX = buildingX - adjustedSize * 0.08;
    const torchY = buildingY + buildingHeight * 0.5;
    
    gEls.push(
      <g key="torch">
        <circle
          cx={torchX}
          cy={torchY}
          r={adjustedSize * 0.1}
          fill="rgba(255, 160, 80, 0.4)"
          opacity={nightIntensity * 0.8}
          filter={`url(#blur-${uniqueId})`}
        />
        <circle
          cx={torchX}
          cy={torchY - adjustedSize * 0.02}
          r={adjustedSize * 0.03}
          fill="rgba(255, 140, 60, 0.9)"
          opacity={nightIntensity}
        />
        <rect
          x={torchX - adjustedSize * 0.008}
          y={torchY}
          width={adjustedSize * 0.016}
          height={adjustedSize * 0.08}
          fill={frameWood}
        />
      </g>
    );
  }
  
  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <clipPath id={`clip-${uniqueId}`}>
          <rect x={x} y={y} width={size} height={size} />
        </clipPath>
        
        <filter id={`blur-${uniqueId}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        
        {/* Bark texture pattern */}
        <pattern id={`barkTexture-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="12">
          <rect width="8" height="12" fill={barkMid}/>
          <rect x="0" y="3" width="8" height="1" fill={barkDark} opacity="0.5"/>
          <rect x="0" y="7" width="8" height="1" fill={barkDark} opacity="0.4"/>
          <rect x="0" y="10" width="8" height="1" fill={barkDark} opacity="0.3"/>
          <rect x="2" y="0" width="1" height="12" fill={barkLight} opacity="0.3"/>
          <rect x="5" y="0" width="1" height="12" fill={barkDark} opacity="0.3"/>
        </pattern>
        
        {/* Roof bark pattern */}
        <pattern id={`roofPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="10" height="8">
          <rect width="10" height="8" fill={roofBark}/>
          <path d="M 0 4 h 10" stroke={roofDark} strokeWidth="0.8" opacity="0.6"/>
          <rect x="3" y="0" width="1" height="8" fill={roofDark} opacity="0.3"/>
          <rect x="7" y="0" width="1" height="8" fill={roofDark} opacity="0.3"/>
        </pattern>
        
        {/* Side gradient */}
        <linearGradient id={`sideGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={barkDark} />
          <stop offset="100%" stopColor={barkMid} />
        </linearGradient>
      </defs>
      
      <g clipPath={`url(#clip-${uniqueId})`}>
        {gEls}
      </g>
    </g>
  );
});

export default BarkLonghouse3D;