/**
 * components/symbols/buildings/SouthAsianBuilding3D.tsx 
 * Generic South Asian building that scales from rural huts to Mughal palaces
 * Works for cultures from Indus Valley to 19th century India
 */
import React from 'react';
import { Tile, HistoricalEra, BiomeType } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface SouthAsianBuilding3DProps {
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  seed: number;
  tile: Tile;
  era: HistoricalEra;
  nightIntensity?: number;
}

const SouthAsianBuilding3D: React.FC<SouthAsianBuilding3DProps> = React.memo(({ 
  x, y, size, seed, tile, era, nightIntensity = 0 
}) => {
  const rng = new ValueNoise(seed + tile.x * 211 + tile.y * 223);
  const rand = () => rng.random();
  const uniqueId = `sa-building-${tile.x}-${tile.y}`;
  
  // Determine building type and scale based on density
  let scaleFactor = 0.8;
  let buildingType: 'hut' | 'house' | 'haveli' | 'palace' = 'house';
  let domeCount = 0;
  let hasMinaret = false;
  let roofType: 'flat' | 'triangular' | 'dome' = 'flat';
  
  if (tile.biome === BiomeType.CITY_CENTER) {
    // Mughal-style palace or grand haveli
    buildingType = 'palace';
    scaleFactor = 1.1;
    domeCount = rand() > 0.3 ? 3 : 1;
    hasMinaret = rand() > 0.4;
    roofType = 'dome';
  } else if (tile.biome === BiomeType.HIGH_DENSITY_URBAN) {
    // Urban haveli
    buildingType = 'haveli';
    scaleFactor = 0.9;
    domeCount = rand() > 0.6 ? 1 : 0;
    roofType = domeCount > 0 ? 'dome' : (rand() > 0.5 ? 'flat' : 'triangular');
  } else if (tile.biome === BiomeType.LOW_DENSITY_URBAN) {
    // Simple house
    buildingType = 'house';
    scaleFactor = 0.75 + rand() * 0.1;
    roofType = rand() > 0.4 ? 'flat' : 'triangular';
  } else {
    // Rural - mix of huts and simple houses
    if (rand() > 0.5) {
      buildingType = 'hut';
      scaleFactor = 0.45 + rand() * 0.15;
      roofType = 'triangular'; // Huts always have triangular roofs
    } else {
      buildingType = 'house';
      scaleFactor = 0.6 + rand() * 0.1;
      roofType = rand() > 0.6 ? 'flat' : 'triangular';
    }
  }
  
  const adjustedSize = size * scaleFactor;
  const depth = adjustedSize * 0.22;
  
  // Base dimensions
  const bodyW = adjustedSize * (buildingType === 'palace' ? 0.75 : 0.6);
  const bodyH = adjustedSize * (buildingType === 'hut' ? 0.35 : 0.45);
  const bodyX = x + (size - bodyW) / 2;
  const bodyY = y + size * 0.5 - bodyH * 0.3; // Properly centered
  
  // Colors based on building type
  const wallLight = buildingType === 'hut' 
    ? `hsl(35, 25%, ${65 + rand() * 10}%)` // Clay/mud
    : buildingType === 'palace'
    ? `hsl(30, 15%, ${92 + rand() * 5}%)` // White marble
    : `hsl(35, 30%, ${75 + rand() * 10}%)`; // Sandstone
    
  const wallMid = buildingType === 'hut'
    ? `hsl(35, 25%, 55%)`
    : buildingType === 'palace'
    ? `hsl(30, 15%, 85%)`
    : `hsl(35, 30%, 65%)`;
    
  const wallDark = buildingType === 'hut'
    ? `hsl(35, 25%, 45%)`
    : buildingType === 'palace'
    ? `hsl(30, 15%, 75%)`
    : `hsl(35, 30%, 55%)`;
    
  const roofColor = buildingType === 'hut'
    ? `hsl(30, 35%, 40%)` // Thatch
    : buildingType === 'palace'
    ? `hsl(200, 40%, 60%)` // Blue tiles
    : `hsl(15, 60%, 50%)`; // Terracotta

  const roofDark = buildingType === 'hut'
    ? `hsl(30, 30%, 30%)` // Darker thatch
    : buildingType === 'palace'
    ? `hsl(200, 35%, 45%)` // Darker blue tiles
    : `hsl(15, 55%, 35%)`; // Darker terracotta
    
  const accentColor = buildingType === 'palace'
    ? `hsl(350, 70%, 55%)` // Red accents
    : `hsl(30, 50%, 45%)`;
  
  // Helper for isometric right side
  const sideQuad = (x0: number, y0: number, w: number, h: number, d = depth) =>
    `M ${x0 + w} ${y0} L ${x0 + w + d} ${y0 - d * 0.5} L ${x0 + w + d} ${y0 + h - d * 0.5} L ${x0 + w} ${y0 + h} Z`;
  
  const gEls: JSX.Element[] = [];
  
  // Ground shadow
  gEls.push(
    <ellipse
      key="shadow"
      cx={x + size * 0.5}
      cy={bodyY + bodyH + adjustedSize * 0.05}
      rx={adjustedSize * 0.35}
      ry={adjustedSize * 0.12}
      fill="rgba(0,0,0,0.25)"
      filter={`url(#blur-${uniqueId})`}
    />
  );
  
  // Platform/base for non-huts
  if (buildingType !== 'hut') {
    const platH = adjustedSize * 0.06;
    const platW = bodyW * 1.1;
    const platX = x + (size - platW) / 2;
    const platY = bodyY + bodyH - platH;
    
    gEls.push(
      <path
        key="platform-side"
        d={sideQuad(platX, platY, platW, platH)}
        fill={wallDark}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={0.3}
      />
    );
    gEls.push(
      <rect
        key="platform-front"
        x={platX}
        y={platY}
        width={platW}
        height={platH}
        fill={wallMid}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={0.4}
      />
    );
  }
  
  // Main body - side
  gEls.push(
    <path
      key="body-side"
      d={sideQuad(bodyX, bodyY, bodyW, bodyH)}
      fill={`url(#wallSide-${uniqueId})`}
      stroke="rgba(0,0,0,0.3)"
      strokeWidth={0.5}
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
      stroke="rgba(0,0,0,0.3)"
      strokeWidth={0.6}
    />
  );
  
  // Arched windows/details for haveli and palace
  if (buildingType === 'haveli' || buildingType === 'palace') {
    const archCount = buildingType === 'palace' ? 3 : 2;
    const archW = bodyW / (archCount * 2);
    const archH = bodyH * 0.25;
    
    for (let i = 0; i < archCount; i++) {
      const archX = bodyX + bodyW / (archCount + 1) * (i + 1) - archW / 2;
      const archY = bodyY + bodyH * 0.3;
      
      gEls.push(
        <path
          key={`arch-${i}`}
          d={`M ${archX} ${archY + archH}
              L ${archX} ${archY + archH * 0.5}
              Q ${archX + archW / 2} ${archY}
                ${archX + archW} ${archY + archH * 0.5}
              L ${archX + archW} ${archY + archH}
              Z`}
          fill="rgba(20,20,25,0.7)"
          stroke={accentColor}
          strokeWidth={0.4}
        />
      );
    }
  }
  
  // Door
  const doorW = adjustedSize * (buildingType === 'hut' ? 0.12 : 0.08);
  const doorH = adjustedSize * (buildingType === 'hut' ? 0.15 : 0.18);
  gEls.push(
    <rect
      key="door"
      x={bodyX + bodyW / 2 - doorW / 2}
      y={bodyY + bodyH - doorH}
      width={doorW}
      height={doorH}
      fill="rgba(15,15,20,0.85)"
      stroke="rgba(0,0,0,0.5)"
      strokeWidth={0.5}
    />
  );
  
  // Roof based on type
  if (roofType === 'triangular') {
    // Triangular roof with side
    const roofY = bodyY - adjustedSize * 0.03;
    const roofPeak = adjustedSize * (buildingType === 'hut' ? 0.25 : 0.18);
    const roofOverhang = adjustedSize * 0.06;
    
    // Roof side (3D effect)
    gEls.push(
      <path
        key="roof-side"
        d={`M ${bodyX + bodyW + roofOverhang} ${roofY}
            L ${bodyX + bodyW + roofOverhang + depth * 0.8} ${roofY - depth * 0.4}
            L ${bodyX + bodyW / 2 + depth * 0.4} ${roofY - roofPeak - depth * 0.2}
            L ${bodyX + bodyW / 2} ${roofY - roofPeak}
            Z`}
        fill={buildingType === 'hut' ? roofColor : roofDark}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={0.4}
      />
    );
    
    // Roof front
    gEls.push(
      <path
        key="roof-front"
        d={`M ${bodyX - roofOverhang} ${roofY}
            L ${bodyX + bodyW / 2} ${roofY - roofPeak}
            L ${bodyX + bodyW + roofOverhang} ${roofY}
            Z`}
        fill={roofColor}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={0.5}
      />
    );
  } else if (roofType === 'flat' || roofType === 'dome') {
    // Flat roof with optional domes
    const roofY = bodyY - adjustedSize * 0.02;
    const roofOverhang = adjustedSize * 0.04;
    
    // Roof slab
    gEls.push(
      <path
        key="roof-side"
        d={sideQuad(bodyX - roofOverhang, roofY, bodyW + roofOverhang * 2, adjustedSize * 0.04)}
        fill={wallDark}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={0.4}
      />
    );
    gEls.push(
      <rect
        key="roof-front"
        x={bodyX - roofOverhang}
        y={roofY}
        width={bodyW + roofOverhang * 2}
        height={adjustedSize * 0.04}
        fill={wallMid}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={0.5}
      />
    );
    
    // Domes for palace/haveli
    if (domeCount > 0) {
      for (let i = 0; i < domeCount; i++) {
        const domeX = bodyX + bodyW / (domeCount + 1) * (i + 1);
        const domeY = roofY - adjustedSize * 0.02;
        const domeR = adjustedSize * (buildingType === 'palace' ? 0.12 : 0.08);
        
        // Dome base
        gEls.push(
          <ellipse
            key={`dome-base-${i}`}
            cx={domeX}
            cy={domeY}
            rx={domeR}
            ry={domeR * 0.3}
            fill={wallMid}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.3}
          />
        );
        
        // Dome
        gEls.push(
          <path
            key={`dome-${i}`}
            d={`M ${domeX - domeR} ${domeY}
                Q ${domeX} ${domeY - domeR * 1.2}
                  ${domeX + domeR} ${domeY}
                Z`}
            fill={buildingType === 'palace' ? roofColor : wallLight}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.4}
          />
        );
        
        // Finial
        gEls.push(
          <g key={`finial-${i}`}>
            <line
              x1={domeX}
              y1={domeY - domeR * 1.2}
              x2={domeX}
              y2={domeY - domeR * 1.5}
              stroke="hsl(45, 70%, 55%)"
              strokeWidth={1}
            />
            <circle
              cx={domeX}
              cy={domeY - domeR * 1.5}
              r={adjustedSize * 0.01}
              fill="hsl(45, 80%, 60%)"
            />
          </g>
        );
      }
    }
    
    // Minaret for palace
    if (hasMinaret) {
      const minX = bodyX + bodyW + adjustedSize * 0.05;
      const minY = bodyY;
      const minW = adjustedSize * 0.06;
      const minH = adjustedSize * 0.55;
      
      gEls.push(
        <g key="minaret">
          <rect
            x={minX}
            y={minY - minH + bodyH}
            width={minW}
            height={minH}
            fill={wallLight}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.4}
          />
          <path
            d={`M ${minX - minW * 0.2} ${minY - minH + bodyH}
                L ${minX + minW / 2} ${minY - minH + bodyH - adjustedSize * 0.08}
                L ${minX + minW * 1.2} ${minY - minH + bodyH}
                Z`}
            fill={roofColor}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.3}
          />
        </g>
      );
    }
  }
  
  // Decorative elements for palace
  if (buildingType === 'palace') {
    // Jali (lattice) patterns
    const jaliY = bodyY + bodyH * 0.15;
    gEls.push(
      <g key="jali" opacity={0.6}>
        <rect
          x={bodyX + bodyW * 0.1}
          y={jaliY}
          width={bodyW * 0.8}
          height={adjustedSize * 0.02}
          fill={accentColor}
        />
        <rect
          x={bodyX + bodyW * 0.1}
          y={jaliY + adjustedSize * 0.03}
          width={bodyW * 0.8}
          height={adjustedSize * 0.01}
          fill={accentColor}
        />
      </g>
    );
  }
  
  // Night lighting
  if (nightIntensity > 0.3 && buildingType !== 'hut') {
    const windowGlow = buildingType === 'palace' 
      ? 'rgba(255, 200, 100, 0.8)'
      : 'rgba(255, 180, 80, 0.7)';
    
    gEls.push(
      <g key="night-glow" opacity={nightIntensity}>
        <rect
          x={bodyX + bodyW * 0.3}
          y={bodyY + bodyH * 0.4}
          width={bodyW * 0.1}
          height={bodyH * 0.15}
          fill={windowGlow}
          filter={`url(#blur-${uniqueId})`}
        />
        <rect
          x={bodyX + bodyW * 0.6}
          y={bodyY + bodyH * 0.4}
          width={bodyW * 0.1}
          height={bodyH * 0.15}
          fill={windowGlow}
          filter={`url(#blur-${uniqueId})`}
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
        
        <linearGradient id={`wallFront-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wallLight} />
          <stop offset="60%" stopColor={wallMid} />
          <stop offset="100%" stopColor={wallDark} />
        </linearGradient>
        
        <linearGradient id={`wallSide-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={wallMid} />
          <stop offset="100%" stopColor={wallDark} />
        </linearGradient>
      </defs>
      
      <g clipPath={`url(#clip-${uniqueId})`}>
        {gEls}
      </g>
    </g>
  );
});

export default SouthAsianBuilding3D;