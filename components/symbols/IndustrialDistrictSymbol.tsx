/**
 * components/symbols/IndustrialDistrictSymbol.tsx - Industrial districts with proper isometric 3D rendering
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
  nightIntensity?: number;
}

const IndustrialDistrictSymbol: React.FC<IndustrialDistrictSymbolProps> = React.memo(({ 
  x, y, size, seed, tile, era, culturalStyle, nightIntensity = 0 
}) => {
  const rng = new ValueNoise(seed + tile.x * 41 + tile.y * 43);
  const uniqueId = `industrial-district-${tile.x}-${tile.y}`;
  
  // Pre-calculate random values
  const staticValues = useMemo(() => {
    const localRand = (offset = 0) => new ValueNoise(seed + tile.x * 41 + tile.y * 43 + offset).random();
    return {
      chimneyCount: era === HistoricalEra.INDUSTRIAL_ERA ? 2 + Math.floor(localRand(0) * 2) : 1, // 2-3 for industrial, 1 for modern
      hasCog: localRand(1) < 0.6 && era === HistoricalEra.INDUSTRIAL_ERA, // 60% chance for industrial era
      cogRotation: localRand(2) * 360,
      smokeOffset1: localRand(3) * 10 - 5,
      smokeOffset2: localRand(4) * 10 - 5,
      windowPattern: Math.floor(localRand(5) * 3),
      buildingHeight: 0.5 + localRand(6) * 0.2, // Height variation
      roofVariant: Math.floor(localRand(7) * 2),
    };
  }, [seed, tile.x, tile.y, era]);

  const isModern = era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA;
  const isIndustrial = era === HistoricalEra.INDUSTRIAL_ERA;
  
  // Color schemes based on era
  const colors = isModern ? {
    building: '#9a9a9a',      // Gray concrete
    buildingDark: '#707070',
    buildingShadow: '#505050',
    roof: '#606060',
    roofDark: '#404040',
    window: 'rgba(100, 150, 200, 0.8)',
    windowDark: 'rgba(20, 30, 40, 0.9)',
    chimney: '#808080',
    chimneyDark: '#606060',
    smoke: 'rgba(200, 200, 200, 0.3)',
    trim: '#b0b0b0',
    ground: '#787878'
  } : {
    building: `hsl(15, 45%, ${50 + rng.random() * 8}%)`,  // Red brick
    buildingDark: 'hsl(15, 45%, 35%)',
    buildingShadow: 'hsl(15, 45%, 28%)',
    roof: 'hsl(210, 8%, 42%)',
    roofDark: 'hsl(210, 8%, 32%)',
    window: 'rgba(20, 30, 40, 0.9)',
    windowDark: 'rgba(10, 15, 20, 0.95)',
    chimney: 'hsl(15, 35%, 40%)',
    chimneyDark: 'hsl(15, 35%, 30%)',
    smoke: 'rgba(60, 60, 60, 0.6)',
    trim: 'hsl(20, 15%, 65%)',
    ground: '#7a6a5a'
  };

  // Isometric dimensions matching IndustrialBuilding3D
  const depth = size * 0.3;
  const buildingWidth = size * 0.7;
  const buildingHeight = size * staticValues.buildingHeight;
  const buildingX = x + size * 0.15;
  const buildingY = y + size * 0.2;

  return (
    <g filter="url(#symbolShadow)">
      <defs>
        {/* Brick pattern for industrial era */}
        {!isModern && (
          <pattern id={`brick-${uniqueId}`} patternUnits="userSpaceOnUse" width="12" height="6">
            <rect width="12" height="6" fill={colors.trim}/>
            <rect width="11.5" height="2.5" x="0.25" y="0.25" fill={colors.building}/>
            <rect width="11.5" height="2.5" x="0.25" y="3.25" fill={colors.building}/>
          </pattern>
        )}
        
        {/* Gradient for roof */}
        <linearGradient id={`roofGrad-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.roof} />
          <stop offset="100%" stopColor={colors.roofDark} />
        </linearGradient>

        {/* Animated smoke */}
        <filter id={`smoke-${uniqueId}`}>
          <feTurbulence baseFrequency="0.02" numOctaves="2" result="turbulence" seed={seed}>
            <animate attributeName="baseFrequency" 
              values="0.02;0.025;0.02" 
              dur="4s" 
              repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" />
        </filter>

        {/* Animated cog/wheel - much smaller */}
        {staticValues.hasCog && (
          <g id={`cog-${uniqueId}`}>
            <circle r="3" fill="none" stroke={colors.buildingDark} strokeWidth="0.8"/>
            {[0, 60, 120, 180, 240, 300].map(angle => (
              <rect
                key={angle}
                x="-0.8"
                y="-4"
                width="1.6"
                height="8"
                fill={colors.buildingDark}
                transform={`rotate(${angle})`}
              />
            ))}
            <circle r="1.2" fill={colors.buildingShadow}/>
          </g>
        )}
      </defs>

      {/* Ground shadow */}
      <ellipse
        cx={x + size/2}
        cy={y + size - size * 0.05}
        rx={size * 0.45}
        ry={size * 0.12}
        fill="rgba(0,0,0,0.3)"
      />

      {/* Main building - front face */}
      <rect
        x={buildingX}
        y={buildingY}
        width={buildingWidth}
        height={buildingHeight}
        fill={isModern ? colors.building : `url(#brick-${uniqueId})`}
        stroke={colors.buildingShadow}
        strokeWidth="0.5"
      />

      {/* 3D right side */}
      <path
        d={`M ${buildingX + buildingWidth} ${buildingY}
            L ${buildingX + buildingWidth + depth} ${buildingY - depth * 0.4}
            L ${buildingX + buildingWidth + depth} ${buildingY + buildingHeight - depth * 0.4}
            L ${buildingX + buildingWidth} ${buildingY + buildingHeight} Z`}
        fill={colors.buildingDark}
        stroke={colors.buildingShadow}
        strokeWidth="0.3"
      />

      {/* 3D roof */}
      <path
        d={`M ${buildingX} ${buildingY}
            L ${buildingX + depth} ${buildingY - depth * 0.4}
            L ${buildingX + buildingWidth + depth} ${buildingY - depth * 0.4}
            L ${buildingX + buildingWidth} ${buildingY} Z`}
        fill={`url(#roofGrad-${uniqueId})`}
        stroke={colors.roofDark}
        strokeWidth="0.5"
      />

      {/* Industrial windows in organized rows */}
      {[0, 1].map(row => (
        <g key={`window-row-${row}`}>
          {[0, 1, 2, 3].map(col => {
            const winX = buildingX + buildingWidth * (0.12 + col * 0.2);
            const winY = buildingY + buildingHeight * (0.25 + row * 0.4);
            const winW = buildingWidth * 0.12;
            const winH = buildingHeight * 0.25;
            
            return (
              <g key={`window-${row}-${col}`}>
                <rect
                  x={winX}
                  y={winY}
                  width={winW}
                  height={winH}
                  fill={colors.window}
                  stroke={colors.trim}
                  strokeWidth="0.3"
                />
                {/* Window panes */}
                <line x1={winX + winW/2} y1={winY} x2={winX + winW/2} y2={winY + winH}
                  stroke={colors.trim} strokeWidth="0.3" opacity="0.7"/>
                <line x1={winX} y1={winY + winH/2} x2={winX + winW} y2={winY + winH/2}
                  stroke={colors.trim} strokeWidth="0.3" opacity="0.7"/>
              </g>
            );
          })}
        </g>
      ))}

      {/* Smokestacks with proper 3D */}
      {Array.from({ length: staticValues.chimneyCount }).map((_, i) => {
        const chimneyX = buildingX + buildingWidth * (0.25 + i * 0.3);
        const chimneyY = buildingY - size * 0.15;
        const chimneyWidth = isModern ? size * 0.06 : size * 0.1;
        const chimneyHeight = size * 0.35;
        
        return (
          <g key={`chimney-${i}`}>
            {/* Chimney body */}
            <rect
              x={chimneyX}
              y={chimneyY}
              width={chimneyWidth}
              height={chimneyHeight}
              fill={colors.chimney}
              stroke={colors.chimneyDark}
              strokeWidth="0.5"
            />
            {/* Chimney 3D side */}
            <path
              d={`M ${chimneyX + chimneyWidth} ${chimneyY}
                  L ${chimneyX + chimneyWidth + chimneyWidth * 0.3} ${chimneyY - chimneyWidth * 0.2}
                  L ${chimneyX + chimneyWidth + chimneyWidth * 0.3} ${chimneyY + chimneyHeight - chimneyWidth * 0.2}
                  L ${chimneyX + chimneyWidth} ${chimneyY + chimneyHeight} Z`}
              fill={colors.chimneyDark}
            />
            {/* Chimney top */}
            <path
              d={`M ${chimneyX} ${chimneyY}
                  L ${chimneyX + chimneyWidth * 0.3} ${chimneyY - chimneyWidth * 0.2}
                  L ${chimneyX + chimneyWidth + chimneyWidth * 0.3} ${chimneyY - chimneyWidth * 0.2}
                  L ${chimneyX + chimneyWidth} ${chimneyY} Z`}
              fill={colors.chimneyDark}
            />
            
            {/* Animated smoke plumes - factory style */}
            {[0, 1, 2].map((j) => (
              <circle
                key={`smoke-${i}-${j}`}
                cx={chimneyX + chimneyWidth/2}
                cy={chimneyY - size * 0.02}
                r={size * 0.03}
                fill={colors.smoke}
              >
                <animate attributeName="cy" 
                  values={`${chimneyY - size * 0.02};${chimneyY - size * 0.12};${chimneyY - size * 0.25}`}
                  dur={`${4 + j * 0.8}s`}
                  begin={`${j * 0.5}s`}
                  repeatCount="indefinite" />
                <animate attributeName="r" 
                  values={`${size * 0.03};${size * 0.06};${size * 0.09}`}
                  dur={`${4 + j * 0.8}s`}
                  begin={`${j * 0.5}s`}
                  repeatCount="indefinite" />
                <animate attributeName="opacity" 
                  values="0.7;0.4;0"
                  dur={`${4 + j * 0.8}s`}
                  begin={`${j * 0.5}s`}
                  repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        );
      })}

      {/* Animated cog/wheel on industrial era buildings - smaller and better positioned */}
      {staticValues.hasCog && isIndustrial && (
        <g transform={`translate(${buildingX + buildingWidth * 0.85}, ${buildingY + buildingHeight * 0.3})`}>
          <use href={`#cog-${uniqueId}`}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 0 0"
              to="360 0 0"
              dur="12s"
              repeatCount="indefinite"/>
          </use>
        </g>
      )}

      {/* Industrial fence around perimeter */}
      <g>
        {/* Fence posts */}
        {[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((offset, idx) => {
          const postX = buildingX - size * 0.05 + (buildingWidth + size * 0.1) * offset;
          return (
            <rect
              key={`fence-post-${idx}`}
              x={postX}
              y={buildingY + buildingHeight - size * 0.02}
              width={size * 0.015}
              height={size * 0.08}
              fill={colors.buildingDark}
            />
          );
        })}
        {/* Horizontal fence rails */}
        <rect
          x={buildingX - size * 0.05}
          y={buildingY + buildingHeight}
          width={buildingWidth + size * 0.1}
          height={size * 0.008}
          fill={colors.buildingDark}
          opacity="0.8"
        />
        <rect
          x={buildingX - size * 0.05}
          y={buildingY + buildingHeight + size * 0.03}
          width={buildingWidth + size * 0.1}
          height={size * 0.008}
          fill={colors.buildingDark}
          opacity="0.8"
        />
        {/* Fence gate */}
        <rect
          x={buildingX + buildingWidth * 0.35}
          y={buildingY + buildingHeight - size * 0.02}
          width={buildingWidth * 0.3}
          height={size * 0.08}
          fill="none"
          stroke={colors.buildingDark}
          strokeWidth="1"
          strokeDasharray="3,2"
        />
      </g>
      
      {/* Factory entrance */}
      <rect
        x={buildingX + buildingWidth * 0.4}
        y={buildingY + buildingHeight * 0.65}
        width={buildingWidth * 0.2}
        height={buildingHeight * 0.35}
        fill={colors.windowDark}
        stroke={colors.buildingDark}
        strokeWidth="0.5"
      />

      {/* Loading dock on side */}
      <rect
        x={buildingX + buildingWidth}
        y={buildingY + buildingHeight * 0.7}
        width={depth * 0.8}
        height={buildingHeight * 0.2}
        fill={colors.buildingDark}
        stroke={colors.buildingShadow}
        strokeWidth="0.3"
      />

      {/* Night lighting for modern era */}
      {nightIntensity > 0.2 && isModern && (
        <>
          {/* Window lights */}
          {[0, 1].map(row => 
            [0, 1, 2, 3].map(col => {
              if (new ValueNoise(seed + row * 10 + col).random() > 0.4) {
                const winX = buildingX + buildingWidth * (0.12 + col * 0.2);
                const winY = buildingY + buildingHeight * (0.25 + row * 0.4);
                const winW = buildingWidth * 0.12;
                const winH = buildingHeight * 0.25;
                
                return (
                  <rect
                    key={`light-${row}-${col}`}
                    x={winX}
                    y={winY}
                    width={winW}
                    height={winH}
                    fill="rgba(255, 240, 180, 0.8)"
                    opacity={nightIntensity * 0.7}
                  />
                );
              }
              return null;
            })
          )}
          {/* Street light */}
          <circle
            cx={buildingX - size * 0.1}
            cy={buildingY + buildingHeight * 0.3}
            r={size * 0.08}
            fill="rgba(255, 240, 180, 0.4)"
            opacity={nightIntensity * 0.5}
            filter="blur(4px)"
          />
        </>
      )}
    </g>
  );
});

export default IndustrialDistrictSymbol;