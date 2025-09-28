/**
 * components/symbols/RiverSymbol.tsx - Enhanced river rendering with gradients and depth variation
 */
import React, { useMemo } from 'react';
import { Tile, ClimateType, BiomeType } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface RiverSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  climate: ClimateType;
  distanceFromOcean?: number; // 0 = at ocean, 1 = at source
  neighboringWater?: { north: boolean; south: boolean; east: boolean; west: boolean };
  isTributary?: boolean;
}

const RiverSymbol: React.FC<RiverSymbolProps> = React.memo(({ 
  x, 
  y, 
  size, 
  seed, 
  tile, 
  climate,
  distanceFromOcean = 0.5,
  neighboringWater = { north: false, south: false, east: false, west: false },
  isTributary = false
}) => {
  const staticValues = useMemo(() => {
    const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 23 + tile.y * 29 + offset).random();
    return {
      flowDirection: localRand(0) * Math.PI * 2, // Random flow angle
      meander1: localRand(1) * 0.3 - 0.15, // -0.15 to 0.15 for river meandering
      meander2: localRand(2) * 0.3 - 0.15,
      hasRapids: localRand(3) < 0.15 && distanceFromOcean > 0.6, // Rapids in upper reaches
      hasSandbar: localRand(4) < 0.1 && distanceFromOcean < 0.3, // Sandbars near ocean
      foamIntensity: localRand(5) * 0.5 + 0.5, // 0.5 to 1.0
      sedimentLevel: localRand(6),
    };
  }, [seed, tile.x, tile.y, distanceFromOcean]);

  const elements: JSX.Element[] = [];

  // Calculate river width based on type and distance from ocean
  const baseWidth = isTributary ? 0.6 : (tile.biome === BiomeType.MAJOR_RIVER ? 0.9 : 0.75);
  const widthMultiplier = 0.5 + (1 - distanceFromOcean) * 0.5; // Wider near ocean
  const riverWidth = size * baseWidth * widthMultiplier;

  // Calculate river color based on distance from ocean and climate
  const getRiverColor = () => {
    const baseColors = {
      [ClimateType.TROPICAL]: { r: 20, g: 120, b: 180 },
      [ClimateType.SEMITROPICAL]: { r: 30, g: 110, b: 170 },
      [ClimateType.TEMPERATE]: { r: 40, g: 100, b: 160 },
      [ClimateType.MEDITERRANEAN]: { r: 45, g: 105, b: 165 },
      [ClimateType.ARID]: { r: 60, g: 90, b: 120 },
      [ClimateType.COLD]: { r: 50, g: 95, b: 150 },
    };

    const oceanColors = {
      [ClimateType.TROPICAL]: { r: 10, g: 80, b: 140 },
      [ClimateType.SEMITROPICAL]: { r: 15, g: 85, b: 145 },
      [ClimateType.TEMPERATE]: { r: 20, g: 70, b: 130 },
      [ClimateType.MEDITERRANEAN]: { r: 25, g: 75, b: 135 },
      [ClimateType.ARID]: { r: 40, g: 70, b: 100 },
      [ClimateType.COLD]: { r: 30, g: 65, b: 120 },
    };

    const sourceColor = baseColors[climate] || baseColors[ClimateType.TEMPERATE];
    const mouthColor = oceanColors[climate] || oceanColors[ClimateType.TEMPERATE];

    // Interpolate between source and ocean colors
    const r = Math.round(sourceColor.r + (mouthColor.r - sourceColor.r) * (1 - distanceFromOcean));
    const g = Math.round(sourceColor.g + (mouthColor.g - sourceColor.g) * (1 - distanceFromOcean));
    const b = Math.round(sourceColor.b + (mouthColor.b - sourceColor.b) * (1 - distanceFromOcean));

    // Add sediment tint for lower reaches
    const sedimentFactor = distanceFromOcean < 0.4 ? (0.4 - distanceFromOcean) * staticValues.sedimentLevel * 0.3 : 0;
    const finalR = Math.min(255, r + sedimentFactor * 40);
    const finalG = Math.min(255, g + sedimentFactor * 30);
    const finalB = Math.max(0, b - sedimentFactor * 20);

    return `rgb(${finalR}, ${finalG}, ${finalB})`;
  };

  const riverColor = getRiverColor();
  const centerX = x + size / 2;
  const centerY = y + size / 2;

  // Create meandering river path
  const riverPath = useMemo(() => {
    const leftEdge = centerX - riverWidth / 2;
    const rightEdge = centerX + riverWidth / 2;
    
    // Add meander based on static values
    const meander = staticValues.meander1 * size;
    const controlPoint1X = centerX + meander;
    const controlPoint1Y = y + size * 0.3;
    const controlPoint2X = centerX - meander * 0.7;
    const controlPoint2Y = y + size * 0.7;

    return `
      M ${leftEdge + meander * 0.5} ${y}
      Q ${controlPoint1X - riverWidth/2} ${controlPoint1Y}
        ${leftEdge} ${centerY}
      Q ${controlPoint2X - riverWidth/2} ${controlPoint2Y}
        ${leftEdge - meander * 0.5} ${y + size}
      L ${rightEdge - meander * 0.5} ${y + size}
      Q ${controlPoint2X + riverWidth/2} ${controlPoint2Y}
        ${rightEdge} ${centerY}
      Q ${controlPoint1X + riverWidth/2} ${controlPoint1Y}
        ${rightEdge + meander * 0.5} ${y}
      Z
    `;
  }, [centerX, y, size, riverWidth, staticValues.meander1]);

  // Main river body with gradient for depth
  const riverGradientId = `river-gradient-${tile.x}-${tile.y}`;
  elements.push(
    <defs key="river-gradient-def">
      <linearGradient id={riverGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={riverColor} stopOpacity="0.7" />
        <stop offset="50%" stopColor={riverColor} stopOpacity="1" />
        <stop offset="100%" stopColor={riverColor} stopOpacity="0.7" />
      </linearGradient>
    </defs>
  );

  // River shadow/depth
  elements.push(
    <path
      key="river-shadow"
      d={riverPath}
      fill="rgba(0, 0, 0, 0.2)"
      transform={`translate(1, 1)`}
    />
  );

  // Main river
  elements.push(
    <path
      key="river-main"
      d={riverPath}
      fill={`url(#${riverGradientId})`}
    />
  );

  // Add flow lines for current
  const flowLines = 3;
  for (let i = 0; i < flowLines; i++) {
    const flowY = y + (i + 1) * (size / (flowLines + 1));
    const flowX = centerX + Math.sin(flowY * 0.1 + staticValues.flowDirection) * riverWidth * 0.3;
    
    elements.push(
      <path
        key={`flow-${i}`}
        d={`M ${flowX - riverWidth * 0.2} ${flowY} 
            Q ${flowX} ${flowY + 2} 
              ${flowX + riverWidth * 0.2} ${flowY}`}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="0.5"
        fill="none"
      />
    );
  }

  // Rapids in upper reaches
  if (staticValues.hasRapids) {
    for (let i = 0; i < 5; i++) {
      const rapidX = centerX + (Math.random() - 0.5) * riverWidth * 0.6;
      const rapidY = centerY + (Math.random() - 0.5) * size * 0.3;
      
      elements.push(
        <g key={`rapid-${i}`}>
          <ellipse
            cx={rapidX}
            cy={rapidY}
            rx={size * 0.02}
            ry={size * 0.01}
            fill="rgba(255, 255, 255, 0.4)"
          />
          <ellipse
            cx={rapidX + 1}
            cy={rapidY + 1}
            rx={size * 0.015}
            ry={size * 0.008}
            fill="rgba(255, 255, 255, 0.6)"
          />
        </g>
      );
    }
  }

  // Sandbars in lower reaches
  if (staticValues.hasSandbar) {
    const sandbarX = centerX + staticValues.meander2 * riverWidth * 0.5;
    const sandbarY = centerY;
    
    elements.push(
      <ellipse
        key="sandbar"
        cx={sandbarX}
        cy={sandbarY}
        rx={riverWidth * 0.15}
        ry={size * 0.08}
        fill="rgba(220, 200, 160, 0.5)"
      />
    );
  }

  // Ripples and surface detail
  for (let i = 0; i < 8; i++) {
    const rippleX = x + Math.random() * size;
    const rippleY = y + Math.random() * size;
    const rippleSize = 2 + Math.random() * 3;
    
    elements.push(
      <circle
        key={`ripple-${i}`}
        cx={rippleX}
        cy={rippleY}
        r={rippleSize}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="0.3"
      />
    );
  }

  // Bank vegetation shadows (subtle)
  if (!isTributary) {
    elements.push(
      <g key="bank-shadows">
        <rect
          x={x}
          y={y}
          width={Math.max(0, (size - riverWidth) / 2 - 2)}
          height={size}
          fill="rgba(0, 0, 0, 0.05)"
        />
        <rect
          x={x + size - (size - riverWidth) / 2 + 2}
          y={y}
          width={Math.max(0, (size - riverWidth) / 2 - 2)}
          height={size}
          fill="rgba(0, 0, 0, 0.05)"
        />
      </g>
    );
  }

  return <>{elements}</>;
});

export default RiverSymbol;