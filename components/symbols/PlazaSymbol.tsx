/**
 * components/symbols/PlazaSymbol.tsx - Renders plazas with climate-specific patterns and optional statues
 */
import React, { useMemo } from 'react';
import { Tile, ClimateType } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface PlazaSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  climate: ClimateType;
}

const PlazaSymbol: React.FC<PlazaSymbolProps> = React.memo(({ x, y, size, seed, tile, climate }) => {
  const staticValues = useMemo(() => {
    const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 17 + tile.y * 19 + offset).random();
    return {
      hasStatue: localRand(0) < 0.3, // 30% chance of statue
      statueType: Math.floor(localRand(1) * 3), // 0: column, 1: monument, 2: fountain
      patternOffset: localRand(2) * 10,
      tileRotation: localRand(3) * 90,
    };
  }, [seed, tile.x, tile.y]);

  const elements: JSX.Element[] = [];

  // Climate-specific paving patterns
  const renderPavingPattern = () => {
    const patterns: JSX.Element[] = [];
    
    switch(climate) {
      case ClimateType.MEDITERRANEAN:
        // Sun-baked brick pattern
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
            const brickX = x + (col * size/4);
            const brickY = y + (row * size/4);
            patterns.push(
              <rect
                key={`brick-${row}-${col}`}
                x={brickX + 1}
                y={brickY + 1}
                width={size/4 - 2}
                height={size/4 - 2}
                fill="#d4a574"
                stroke="#b8935f"
                strokeWidth="0.5"
                opacity={0.8 + (staticValues.patternOffset % 3) * 0.05}
              />
            );
          }
        }
        break;
      
      case ClimateType.TEMPERATE:
        // Flagstone pattern
        const flagstones = [
          {x: 0, y: 0, w: 0.4, h: 0.3},
          {x: 0.4, y: 0, w: 0.3, h: 0.4},
          {x: 0.7, y: 0, w: 0.3, h: 0.25},
          {x: 0, y: 0.3, w: 0.25, h: 0.35},
          {x: 0.25, y: 0.4, w: 0.35, h: 0.3},
          {x: 0.6, y: 0.4, w: 0.4, h: 0.35},
          {x: 0, y: 0.65, w: 0.3, h: 0.35},
          {x: 0.3, y: 0.7, w: 0.4, h: 0.3},
          {x: 0.7, y: 0.75, w: 0.3, h: 0.25},
        ];
        
        flagstones.forEach((stone, i) => {
          patterns.push(
            <rect
              key={`stone-${i}`}
              x={x + stone.x * size + 1}
              y={y + stone.y * size + 1}
              width={stone.w * size - 2}
              height={stone.h * size - 2}
              fill="#a8a8a8"
              stroke="#909090"
              strokeWidth="0.5"
              opacity={0.7 + (i % 3) * 0.1}
            />
          );
        });
        break;
      
      case ClimateType.SEMITROPICAL:
      case ClimateType.TROPICAL:
        // Wavy mosaic pattern (Brazilian style)
        const wavePoints = [];
        for (let i = 0; i <= 4; i++) {
          const waveX = x + (i * size/4);
          const waveY = y + size/2 + Math.sin(i * Math.PI/2) * size/6;
          wavePoints.push(`${waveX},${waveY}`);
        }
        
        patterns.push(
          <g key="mosaic">
            <rect x={x} y={y} width={size} height={size} fill="#f0f0f0" />
            <path
              d={`M ${x} ${y + size/2} ${wavePoints.join(' ')} L ${x + size} ${y + size} L ${x} ${y + size} Z`}
              fill="#4a4a4a"
              opacity="0.6"
            />
            <path
              d={`M ${x} ${y} L ${x + size} ${y} L ${x + size} ${y + size/2} ${wavePoints.reverse().join(' ')} Z`}
              fill="#d0d0d0"
              opacity="0.7"
            />
          </g>
        );
        break;
      
      default:
        // Simple stone pattern for other climates
        patterns.push(
          <rect
            key="base"
            x={x}
            y={y}
            width={size}
            height={size}
            fill="#c0b090"
            stroke="#a09070"
            strokeWidth="1"
            opacity="0.8"
          />
        );
    }
    
    return patterns;
  };

  // Add paving pattern
  elements.push(...renderPavingPattern());

  // Add statue/monument if present
  if (staticValues.hasStatue) {
    const centerX = x + size/2;
    const centerY = y + size/2;
    
    switch(staticValues.statueType) {
      case 0: // Column/obelisk
        elements.push(
          <g key="column">
            {/* Shadow */}
            <ellipse
              cx={centerX + size * 0.02}
              cy={centerY + size * 0.15}
              rx={size * 0.08}
              ry={size * 0.04}
              fill="rgba(0,0,0,0.3)"
            />
            {/* Base */}
            <rect
              x={centerX - size * 0.08}
              y={centerY + size * 0.05}
              width={size * 0.16}
              height={size * 0.1}
              fill="#8a8a8a"
              stroke="#6a6a6a"
              strokeWidth="0.5"
            />
            {/* Column */}
            <rect
              x={centerX - size * 0.05}
              y={centerY - size * 0.2}
              width={size * 0.1}
              height={size * 0.25}
              fill="#9a9a9a"
              stroke="#7a7a7a"
              strokeWidth="0.5"
            />
            {/* Top */}
            <polygon
              points={`${centerX},${centerY - size * 0.25} ${centerX - size * 0.06},${centerY - size * 0.2} ${centerX + size * 0.06},${centerY - size * 0.2}`}
              fill="#aaaaaa"
              stroke="#8a8a8a"
              strokeWidth="0.5"
            />
          </g>
        );
        break;
      
      case 1: // Monument/statue
        elements.push(
          <g key="monument">
            {/* Shadow */}
            <ellipse
              cx={centerX + size * 0.02}
              cy={centerY + size * 0.12}
              rx={size * 0.1}
              ry={size * 0.05}
              fill="rgba(0,0,0,0.3)"
            />
            {/* Pedestal */}
            <rect
              x={centerX - size * 0.1}
              y={centerY}
              width={size * 0.2}
              height={size * 0.12}
              fill="#7a7a7a"
              stroke="#5a5a5a"
              strokeWidth="0.5"
            />
            {/* Figure (simplified) */}
            <ellipse
              cx={centerX}
              cy={centerY - size * 0.08}
              rx={size * 0.04}
              ry={size * 0.06}
              fill="#8a8a8a"
            />
            <circle
              cx={centerX}
              cy={centerY - size * 0.15}
              r={size * 0.03}
              fill="#8a8a8a"
            />
          </g>
        );
        break;
      
      case 2: // Fountain
        elements.push(
          <g key="fountain">
            {/* Basin */}
            <ellipse
              cx={centerX}
              cy={centerY}
              rx={size * 0.15}
              ry={size * 0.08}
              fill="#6a9abd"
              stroke="#5a7a8d"
              strokeWidth="0.5"
              opacity="0.8"
            />
            {/* Central spout */}
            <circle
              cx={centerX}
              cy={centerY}
              r={size * 0.04}
              fill="#8a8a8a"
              stroke="#6a6a6a"
              strokeWidth="0.5"
            />
            {/* Water effect */}
            <circle
              cx={centerX}
              cy={centerY}
              r={size * 0.12}
              fill="none"
              stroke="rgba(150, 200, 255, 0.4)"
              strokeWidth="1"
              strokeDasharray="2,3"
            />
          </g>
        );
        break;
    }
  }

  // Add decorative corners for Mediterranean/Classical style
  if (climate === ClimateType.MEDITERRANEAN || climate === ClimateType.TEMPERATE) {
    const cornerSize = size * 0.1;
    const corners = [
      {x: x, y: y},
      {x: x + size - cornerSize, y: y},
      {x: x, y: y + size - cornerSize},
      {x: x + size - cornerSize, y: y + size - cornerSize}
    ];
    
    corners.forEach((corner, i) => {
      elements.push(
        <rect
          key={`corner-${i}`}
          x={corner.x}
          y={corner.y}
          width={cornerSize}
          height={cornerSize}
          fill="#9a8a6a"
          opacity="0.3"
        />
      );
    });
  }

  return <>{elements}</>;
});

export default PlazaSymbol;