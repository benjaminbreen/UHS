/**
 * components/symbols/RoadSymbol.tsx - Enhanced road rendering with realistic features
 */
import React, { useMemo } from 'react';
import { Tile, ClimateType, HistoricalEra } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface RoadSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  climate: ClimateType;
  era?: HistoricalEra;
  neighboringRoads?: { north: boolean; south: boolean; east: boolean; west: boolean };
}

const RoadSymbol: React.FC<RoadSymbolProps> = React.memo(({ 
  x, 
  y, 
  size, 
  seed, 
  tile, 
  climate, 
  era = HistoricalEra.MEDIEVAL,
  neighboringRoads = { north: false, south: false, east: false, west: false }
}) => {
  const staticValues = useMemo(() => {
    const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 17 + tile.y * 19 + offset).random();
    return {
      edgeVariation1: localRand(0) * 2 - 1, // -1 to 1
      edgeVariation2: localRand(1) * 2 - 1,
      edgeVariation3: localRand(2) * 2 - 1,
      edgeVariation4: localRand(3) * 2 - 1,
      hasManhole: era === HistoricalEra.MODERN_ERA && localRand(4) < 0.15, // 15% chance in modern era
      hasPothole: localRand(5) < 0.1, // 10% chance of wear
      centerLineOffset: localRand(6) * 2 - 1,
    };
  }, [seed, tile.x, tile.y, era]);

  const elements: JSX.Element[] = [];

  // Determine road color and texture based on era
  const getRoadStyle = () => {
    switch(era) {
      case HistoricalEra.ANTIQUITY:
        return {
          mainColor: '#8a7055', // Roman road stone color
          edgeColor: '#6a5040',
          texture: 'cobblestone',
          hasCenter: false,
          hasDitches: true
        };
      case HistoricalEra.MEDIEVAL:
      case (HistoricalEra as any).MEDIEVAL_ERA:
      case HistoricalEra.RENAISSANCE_EARLY_MODERN:
      case (HistoricalEra as any).RENAISSANCE_ERA:
        return {
          mainColor: '#7a6550', // Dirt/packed earth
          edgeColor: '#5a4530',
          texture: 'dirt',
          hasCenter: false,
          hasDitches: true
        };
      case HistoricalEra.INDUSTRIAL_ERA:
      case (HistoricalEra as any).INDUSTRIAL_ERA:
        return {
          mainColor: '#606060', // Early paved roads
          edgeColor: '#404040',
          texture: 'gravel',
          hasCenter: false,
          hasDitches: true
        };
      case HistoricalEra.MODERN_ERA:
      case (HistoricalEra as any).MODERN_ERA:
      case HistoricalEra.FUTURE_ERA:
      case (HistoricalEra as any).FUTURE_ERA:
        return {
          mainColor: '#3a3a3a', // Asphalt
          edgeColor: '#2a2a2a',
          texture: 'asphalt',
          hasCenter: true,
          hasDitches: true
        };
      default:
        return {
          mainColor: '#6a5a4a',
          edgeColor: '#4a3a2a',
          texture: 'dirt',
          hasCenter: false,
          hasDitches: true
        };
    }
  };

  const roadStyle = getRoadStyle();
  const roadWidth = size * 0.7; // Road takes up 70% of tile width
  const ditchWidth = size * 0.05; // Ditches are 5% on each side
  const edgeVariation = size * 0.02; // Small edge variation

  // Main road surface with irregular edges
  const leftEdge = x + (size - roadWidth) / 2 + staticValues.edgeVariation1 * edgeVariation;
  const rightEdge = x + (size + roadWidth) / 2 + staticValues.edgeVariation2 * edgeVariation;
  const topEdge = y + (size - roadWidth) / 2 + staticValues.edgeVariation3 * edgeVariation;
  const bottomEdge = y + (size + roadWidth) / 2 + staticValues.edgeVariation4 * edgeVariation;

  // Draw ditches first (beneath road)
  if (roadStyle.hasDitches) {
    // Left ditch
    elements.push(
      <rect
        key="left-ditch"
        x={leftEdge - ditchWidth}
        y={y}
        width={ditchWidth}
        height={size}
        fill={roadStyle.edgeColor}
        opacity="0.6"
      />
    );
    // Right ditch
    elements.push(
      <rect
        key="right-ditch"
        x={rightEdge}
        y={y}
        width={ditchWidth}
        height={size}
        fill={roadStyle.edgeColor}
        opacity="0.6"
      />
    );
  }

  // Main road surface
  elements.push(
    <path
      key="road-surface"
      d={`
        M ${leftEdge} ${y}
        L ${rightEdge} ${y}
        L ${rightEdge + staticValues.edgeVariation2 * edgeVariation * 0.5} ${y + size}
        L ${leftEdge + staticValues.edgeVariation1 * edgeVariation * 0.5} ${y + size}
        Z
      `}
      fill={roadStyle.mainColor}
    />
  );

  // Add texture based on road type
  if (roadStyle.texture === 'cobblestone') {
    // Cobblestone pattern for ancient roads
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const stoneX = leftEdge + col * (roadWidth / 3) + 2;
        const stoneY = y + row * (size / 4) + 2;
        elements.push(
          <rect
            key={`stone-${row}-${col}`}
            x={stoneX}
            y={stoneY}
            width={roadWidth / 3 - 4}
            height={size / 4 - 4}
            fill={roadStyle.mainColor}
            stroke={roadStyle.edgeColor}
            strokeWidth="0.5"
            opacity="0.3"
            rx="2"
          />
        );
      }
    }
  } else if (roadStyle.texture === 'asphalt' && roadStyle.hasCenter) {
    // Center line for modern roads
    const centerX = x + size / 2 + staticValues.centerLineOffset * 2;
    elements.push(
      <g key="center-line">
        {[0, 1, 2].map(i => (
          <rect
            key={`dash-${i}`}
            x={centerX - 1}
            y={y + i * size / 3 + size / 12}
            width={2}
            height={size / 6}
            fill="#ffd700"
            opacity="0.6"
          />
        ))}
      </g>
    );
  }

  // Add wear and tear
  if (staticValues.hasPothole && roadStyle.texture !== 'cobblestone') {
    const potholeX = x + size / 2 + staticValues.edgeVariation1 * 10;
    const potholeY = y + size / 2 + staticValues.edgeVariation2 * 10;
    elements.push(
      <ellipse
        key="pothole"
        cx={potholeX}
        cy={potholeY}
        rx={size * 0.08}
        ry={size * 0.06}
        fill={roadStyle.edgeColor}
        opacity="0.7"
      />
    );
  }

  // Modern manhole cover
  if (staticValues.hasManhole) {
    const manholeX = x + size / 2;
    const manholeY = y + size / 2 + staticValues.edgeVariation3 * 5;
    elements.push(
      <g key="manhole">
        <circle
          cx={manholeX}
          cy={manholeY}
          r={size * 0.06}
          fill="#4a4a4a"
          stroke="#2a2a2a"
          strokeWidth="1"
        />
        <circle
          cx={manholeX}
          cy={manholeY}
          r={size * 0.04}
          fill="none"
          stroke="#3a3a3a"
          strokeWidth="0.5"
        />
      </g>
    );
  }

  // Connection indicators for neighboring roads (subtle gradients at edges)
  if (neighboringRoads.north) {
    elements.push(
      <rect
        key="north-connection"
        x={leftEdge}
        y={y}
        width={roadWidth}
        height={size * 0.1}
        fill={roadStyle.mainColor}
        opacity="0.3"
      />
    );
  }
  if (neighboringRoads.south) {
    elements.push(
      <rect
        key="south-connection"
        x={leftEdge}
        y={y + size * 0.9}
        width={roadWidth}
        height={size * 0.1}
        fill={roadStyle.mainColor}
        opacity="0.3"
      />
    );
  }

  return <>{elements}</>;
});

export default RoadSymbol;