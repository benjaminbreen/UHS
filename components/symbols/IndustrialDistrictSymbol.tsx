/**
 * components/symbols/IndustrialDistrictSymbol.tsx - Renders industrial districts with era-specific factories
 */
import React, { useMemo } from 'react';
import { Tile, HistoricalEra } from '../../types';
import { ValueNoise } from '../../utils/noise';

interface IndustrialDistrictSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  era?: HistoricalEra;
  culturalStyle?: string;
}

const IndustrialDistrictSymbol: React.FC<IndustrialDistrictSymbolProps> = React.memo(({ 
  x, y, size, seed, tile, era, culturalStyle 
}) => {
  const staticValues = useMemo(() => {
    const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 41 + tile.y * 43 + offset).random();
    return {
      chimneyCount: Math.floor(localRand(0) * 3) + 1, // 1-3 chimneys
      buildingArrangement: Math.floor(localRand(1) * 3), // layout pattern
      hasRailway: localRand(2) < 0.6 && era !== HistoricalEra.MEDIEVAL_ERA, // 60% chance if post-medieval
      hasTanks: localRand(3) < 0.4 && (era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA),
      smokeIntensity: localRand(4) * 0.5 + 0.3, // 0.3-0.8 opacity
      windowPattern: Math.floor(localRand(5) * 3),
    };
  }, [seed, tile.x, tile.y, era]);

  const elements: JSX.Element[] = [];

  // Base ground
  elements.push(
    <rect
      key="base"
      x={x}
      y={y}
      width={size}
      height={size}
      fill="#7a6a5a"
      opacity="0.9"
    />
  );

  const renderIndustrialFeatures = () => {
    const features: JSX.Element[] = [];
    
    if (era === HistoricalEra.MEDIEVAL_ERA || era === HistoricalEra.RENAISSANCE_ERA) {
      // Early industrial - workshops, mills, forges
      
      // Workshop buildings
      for (let i = 0; i < 2; i++) {
        const bldgX = x + size * (0.15 + i * 0.4);
        const bldgY = y + size * 0.3;
        
        features.push(
          <g key={`workshop-${i}`}>
            {/* Building base */}
            <rect
              x={bldgX}
              y={bldgY}
              width={size * 0.3}
              height={size * 0.4}
              fill="#b09070"
              stroke="#907050"
              strokeWidth="1"
            />
            {/* Roof */}
            <polygon
              points={`${bldgX},${bldgY} ${bldgX + size * 0.15},${bldgY - size * 0.08} ${bldgX + size * 0.3},${bldgY}`}
              fill="#6a5040"
              stroke="#4a3020"
              strokeWidth="0.5"
            />
            {/* Workshop door */}
            <rect
              x={bldgX + size * 0.12}
              y={bldgY + size * 0.25}
              width={size * 0.06}
              height={size * 0.15}
              fill="#4a3020"
            />
            {/* Forge chimney (if first building) */}
            {i === 0 && (
              <>
                <rect
                  x={bldgX + size * 0.25}
                  y={bldgY - size * 0.12}
                  width={size * 0.03}
                  height={size * 0.12}
                  fill="#5a4a3a"
                />
                {/* Smoke */}
                <ellipse
                  cx={bldgX + size * 0.265}
                  cy={bldgY - size * 0.15}
                  rx={size * 0.02}
                  ry={size * 0.03}
                  fill="#808080"
                  opacity="0.4"
                />
              </>
            )}
          </g>
        );
      }
      
      // Water wheel (for mills)
      if (culturalStyle === 'european') {
        features.push(
          <g key="waterwheel">
            <circle
              cx={x + size * 0.85}
              cy={y + size * 0.5}
              r={size * 0.08}
              fill="none"
              stroke="#6a4a2a"
              strokeWidth="2"
            />
            {/* Wheel spokes */}
            {[0, 45, 90, 135].map(angle => {
              const rad = (angle * Math.PI) / 180;
              return (
                <line
                  key={`spoke-${angle}`}
                  x1={x + size * 0.85}
                  y1={y + size * 0.5}
                  x2={x + size * 0.85 + Math.cos(rad) * size * 0.08}
                  y2={y + size * 0.5 + Math.sin(rad) * size * 0.08}
                  stroke="#6a4a2a"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        );
      }
      
    } else if (era === HistoricalEra.INDUSTRIAL_ERA) {
      // Classic industrial revolution - brick factories with smokestacks
      
      // Main factory building
      const factoryX = x + size * 0.1;
      const factoryY = y + size * 0.3;
      
      features.push(
        <g key="main-factory">
          {/* Factory base */}
          <rect
            x={factoryX}
            y={factoryY}
            width={size * 0.5}
            height={size * 0.4}
            fill="#8a5040"
            stroke="#6a3020"
            strokeWidth="1"
          />
          {/* Brick pattern */}
          {[0, 0.1, 0.2, 0.3].map((yOff, i) => (
            <line
              key={`brick-h-${i}`}
              x1={factoryX}
              y1={factoryY + size * yOff}
              x2={factoryX + size * 0.5}
              y2={factoryY + size * yOff}
              stroke="#6a3020"
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}
          {[0, 0.125, 0.25, 0.375].map((xOff, i) => (
            <line
              key={`brick-v-${i}`}
              x1={factoryX + size * xOff}
              y1={factoryY}
              x2={factoryX + size * xOff}
              y2={factoryY + size * 0.4}
              stroke="#6a3020"
              strokeWidth="0.5"
              opacity="0.2"
            />
          ))}
          {/* Saw-tooth roof */}
          {[0, 0.1, 0.2, 0.3, 0.4].map((xOff, i) => (
            <polygon
              key={`roof-${i}`}
              points={`${factoryX + size * xOff},${factoryY} ${factoryX + size * (xOff + 0.05)},${factoryY - size * 0.05} ${factoryX + size * (xOff + 0.1)},${factoryY}`}
              fill="#4a3a2a"
              stroke="#2a1a0a"
              strokeWidth="0.5"
            />
          ))}
          {/* Windows */}
          {[0.05, 0.15, 0.25, 0.35, 0.45].map((xOff, i) => (
            <rect
              key={`window-${i}`}
              x={factoryX + size * xOff}
              y={factoryY + size * 0.1}
              width={size * 0.04}
              height={size * 0.08}
              fill="#404040"
              opacity="0.7"
            />
          ))}
        </g>
      );
      
      // Smokestacks with heavy smoke
      for (let i = 0; i < staticValues.chimneyCount; i++) {
        const chimneyX = x + size * (0.2 + i * 0.25);
        const chimneyY = y + size * 0.15;
        
        features.push(
          <g key={`chimney-${i}`}>
            {/* Chimney */}
            <rect
              x={chimneyX - size * 0.03}
              y={chimneyY}
              width={size * 0.06}
              height={size * 0.25}
              fill="#5a4030"
              stroke="#3a2010"
              strokeWidth="1"
            />
            {/* Chimney top */}
            <rect
              x={chimneyX - size * 0.035}
              y={chimneyY}
              width={size * 0.07}
              height={size * 0.02}
              fill="#3a2010"
            />
            {/* Heavy industrial smoke */}
            <ellipse
              cx={chimneyX}
              cy={chimneyY - size * 0.05}
              rx={size * 0.04}
              ry={size * 0.06}
              fill="#2a2a2a"
              opacity={staticValues.smokeIntensity}
            />
            <ellipse
              cx={chimneyX + size * 0.02}
              cy={chimneyY - size * 0.1}
              rx={size * 0.05}
              ry={size * 0.08}
              fill="#3a3a3a"
              opacity={staticValues.smokeIntensity * 0.7}
            />
            <ellipse
              cx={chimneyX + size * 0.04}
              cy={chimneyY - size * 0.18}
              rx={size * 0.06}
              ry={size * 0.1}
              fill="#4a4a4a"
              opacity={staticValues.smokeIntensity * 0.5}
            />
          </g>
        );
      }
      
      // Railway siding
      if (staticValues.hasRailway) {
        features.push(
          <g key="railway">
            <line x1={x} y1={y + size * 0.85} x2={x + size} y2={y + size * 0.85} stroke="#404040" strokeWidth="2" />
            <line x1={x} y1={y + size * 0.9} x2={x + size} y2={y + size * 0.9} stroke="#404040" strokeWidth="2" />
            {/* Rail ties */}
            {[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((xOff, i) => (
              <line
                key={`tie-${i}`}
                x1={x + size * xOff}
                y1={y + size * 0.83}
                x2={x + size * xOff}
                y2={y + size * 0.92}
                stroke="#5a3a1a"
                strokeWidth="1"
              />
            ))}
          </g>
        );
      }
      
      // Storage tanks
      if (staticValues.hasTanks) {
        features.push(
          <g key="tanks">
            {[0.7, 0.82].map((xOff, i) => (
              <g key={`tank-${i}`}>
                <ellipse
                  cx={x + size * xOff}
                  cy={y + size * 0.6}
                  rx={size * 0.05}
                  ry={size * 0.08}
                  fill="#6a6a6a"
                  stroke="#4a4a4a"
                  strokeWidth="1"
                />
                <ellipse
                  cx={x + size * xOff}
                  cy={y + size * 0.52}
                  rx={size * 0.05}
                  ry={size * 0.02}
                  fill="#7a7a7a"
                />
              </g>
            ))}
          </g>
        );
      }
      
    } else {
      // Modern/Future era - cleaner factories, tech industry
      
      // Modern factory complex
      features.push(
        <g key="modern-factory">
          {/* Main building */}
          <rect
            x={x + size * 0.1}
            y={y + size * 0.3}
            width={size * 0.6}
            height={size * 0.35}
            fill="#c0c0c0"
            stroke="#909090"
            strokeWidth="1"
          />
          {/* Glass facade */}
          {[0.15, 0.25, 0.35, 0.45, 0.55].map((xOff, i) => (
            <rect
              key={`glass-${i}`}
              x={x + size * xOff}
              y={y + size * 0.35}
              width={size * 0.08}
              height={size * 0.25}
              fill="#6bb6ff"
              opacity="0.6"
            />
          ))}
          {/* Modern flat roof */}
          <rect
            x={x + size * 0.1}
            y={y + size * 0.28}
            width={size * 0.6}
            height={size * 0.02}
            fill="#a0a0a0"
          />
          {/* Solar panels on roof (future era) */}
          {era === HistoricalEra.FUTURE_ERA && (
            <>
              {[0.15, 0.25, 0.35, 0.45, 0.55].map((xOff, i) => (
                <rect
                  key={`solar-${i}`}
                  x={x + size * xOff}
                  y={y + size * 0.26}
                  width={size * 0.08}
                  height={size * 0.02}
                  fill="#1a237e"
                  opacity="0.8"
                />
              ))}
            </>
          )}
        </g>
      );
      
      // Clean smokestacks (fewer, less smoke)
      if (staticValues.chimneyCount > 0 && era !== HistoricalEra.FUTURE_ERA) {
        const chimneyX = x + size * 0.75;
        features.push(
          <g key="modern-chimney">
            <rect
              x={chimneyX - size * 0.02}
              y={y + size * 0.1}
              width={size * 0.04}
              height={size * 0.2}
              fill="#909090"
              stroke="#707070"
              strokeWidth="1"
            />
            {/* Minimal smoke */}
            <ellipse
              cx={chimneyX}
              cy={y + size * 0.08}
              rx={size * 0.02}
              ry={size * 0.03}
              fill="#e0e0e0"
              opacity="0.3"
            />
          </g>
        );
      }
      
      // Parking lot
      features.push(
        <g key="parking">
          <rect
            x={x + size * 0.1}
            y={y + size * 0.7}
            width={size * 0.4}
            height={size * 0.2}
            fill="#505050"
            stroke="#303030"
            strokeWidth="0.5"
          />
          {/* Parking lines */}
          {[0.15, 0.25, 0.35].map((xOff, i) => (
            <line
              key={`parking-${i}`}
              x1={x + size * xOff}
              y1={y + size * 0.7}
              x2={x + size * xOff}
              y2={y + size * 0.9}
              stroke="#f0f0f0"
              strokeWidth="0.5"
            />
          ))}
        </g>
      );
      
      // Loading dock
      features.push(
        <rect
          key="loading-dock"
          x={x + size * 0.52}
          y={y + size * 0.75}
          width={size * 0.15}
          height={size * 0.1}
          fill="#808080"
          stroke="#606060"
          strokeWidth="0.5"
        />
      );
    }
    
    return features;
  };

  // Add industrial features
  elements.push(...renderIndustrialFeatures());

  return <>{elements}</>;
});

export default IndustrialDistrictSymbol;