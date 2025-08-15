/**
 * components/symbols/buildings/VikingLonghouse3D.tsx - Renders a detailed Nordic/Viking longhouse in 2.5D isometric
 */
import React from 'react';
import { Tile, HistoricalEra } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface VikingLonghouse3DProps {
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  seed: number;
  tile: Tile;
  roofColor?: string;
  era?: HistoricalEra;
}

const VikingLonghouse3D: React.FC<VikingLonghouse3DProps> = React.memo(({ x, y, width, height, size, seed, tile, roofColor, era }) => {
  const rng = new ValueNoise(seed + tile.x * 13 + tile.y * 17);
  const uniqueId = `longhouse-${tile.x}-${tile.y}`;
  
  // Pre-calculate all random values to prevent re-rendering
  const rand1 = rng.random();
  const rand2 = rng.random();
  const rand3 = rng.random();
  
  // 2.5D Isometric dimensions - make it longer and more prominent
  const buildingWidth = width * 0.8;
  const buildingHeight = height * 0.7;
  const buildingDepth = width * 0.4; // Depth for 3D effect
  const buildingX = x - buildingWidth * 0.4;
  const buildingY = y + height * 0.1;
  
  // Colors
  const wallColor = `hsl(30, 25%, ${45 + rand1 * 15}%)`;
  const wallShadowColor = `hsl(30, 25%, 35%)`;
  const thatchColor = roofColor || `hsl(35, 40%, ${40 + rand2 * 10}%)`;
  const thatchDarkColor = `hsl(35, 40%, ${30 + rand2 * 10}%)`;
  const woodTrimColor = '#654321';
  const doorColor = '#2d1810';

  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <linearGradient id={`wallGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={wallColor} />
          <stop offset="60%" stopColor={wallColor} />
          <stop offset="100%" stopColor={wallShadowColor} />
        </linearGradient>
        <pattern id={`thatchPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height="3">
          <path d="M 0 1.5 L 4 1.5" stroke={thatchDarkColor} strokeWidth="0.5" />
          <path d="M 0 3 L 4 3" stroke={thatchDarkColor} strokeWidth="0.3" opacity="0.6"/>
          <circle cx="2" cy="2" r="0.3" fill={thatchDarkColor} opacity="0.3"/>
        </pattern>
      </defs>
      
      {/* Ground shadow for 3D effect */}
      <path 
        d={`M ${buildingX} ${buildingY + buildingHeight} 
           L ${buildingX + buildingWidth} ${buildingY + buildingHeight}
           L ${buildingX + buildingWidth + buildingDepth * 0.5} ${buildingY + buildingHeight + buildingDepth * 0.3}
           L ${buildingX + buildingDepth * 0.5} ${buildingY + buildingHeight + buildingDepth * 0.3} Z`}
        fill="rgba(0,0,0,0.25)" 
      />
      
      {/* Main wall structure - front face */}
      <rect
        x={buildingX}
        y={buildingY + buildingHeight * 0.3}
        width={buildingWidth}
        height={buildingHeight * 0.7}
        fill={`url(#wallGradient-${uniqueId})`}
        stroke={woodTrimColor}
        strokeWidth="0.5"
      />
      
      {/* Side wall - 3D effect */}
      <path
        d={`M ${buildingX + buildingWidth} ${buildingY + buildingHeight * 0.3}
           L ${buildingX + buildingWidth + buildingDepth * 0.5} ${buildingY + buildingHeight * 0.3 - buildingDepth * 0.25}
           L ${buildingX + buildingWidth + buildingDepth * 0.5} ${buildingY + buildingHeight - buildingDepth * 0.25}
           L ${buildingX + buildingWidth} ${buildingY + buildingHeight} Z`}
        fill={wallShadowColor}
        stroke={woodTrimColor}
        strokeWidth="0.5"
      />
      
      {/* Wooden support beams on front */}
      {Array.from({ length: 5 }).map((_, i) => {
        const beamX = buildingX + buildingWidth * (0.1 + i * 0.2);
        return (
          <rect
            key={`beam-${i}`}
            x={beamX}
            y={buildingY + buildingHeight * 0.3}
            width={buildingWidth * 0.03}
            height={buildingHeight * 0.7}
            fill={woodTrimColor}
          />
        );
      })}
      
      {/* Curved thatched roof - front face */}
      <path
        d={`M ${buildingX - buildingWidth * 0.1} ${buildingY + buildingHeight * 0.35} 
            Q ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.2} 
            ${buildingX + buildingWidth + buildingWidth * 0.1} ${buildingY + buildingHeight * 0.35}
            L ${buildingX + buildingWidth} ${buildingY + buildingHeight * 0.4}
            Q ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.15}
            ${buildingX} ${buildingY + buildingHeight * 0.4} Z`}
        fill={thatchColor}
        stroke={woodTrimColor}
        strokeWidth="0.5"
      />
      
      {/* Curved thatched roof - side face for 3D */}
      <path
        d={`M ${buildingX + buildingWidth + buildingWidth * 0.1} ${buildingY + buildingHeight * 0.35}
            Q ${buildingX + buildingWidth + buildingDepth * 0.5} ${buildingY - buildingHeight * 0.1 - buildingDepth * 0.2}
            ${buildingX + buildingWidth + buildingDepth * 0.5} ${buildingY + buildingHeight * 0.35 - buildingDepth * 0.25}
            L ${buildingX + buildingWidth} ${buildingY + buildingHeight * 0.4} Z`}
        fill={thatchDarkColor}
        stroke={woodTrimColor}
        strokeWidth="0.5"
      />
      
      {/* Thatch texture overlay */}
      <path
        d={`M ${buildingX - buildingWidth * 0.1} ${buildingY + buildingHeight * 0.35} 
            Q ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.2} 
            ${buildingX + buildingWidth + buildingWidth * 0.1} ${buildingY + buildingHeight * 0.35}
            L ${buildingX + buildingWidth} ${buildingY + buildingHeight * 0.4}
            Q ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.15}
            ${buildingX} ${buildingY + buildingHeight * 0.4} Z`}
        fill={`url(#thatchPattern-${uniqueId})`}
        opacity="0.5"
      />
      
      {/* Main entrance door */}
      <rect
        x={buildingX + buildingWidth * 0.45}
        y={buildingY + buildingHeight * 0.6}
        width={buildingWidth * 0.1}
        height={buildingHeight * 0.4}
        fill={doorColor}
        stroke={woodTrimColor}
        strokeWidth="0.5"
        rx={buildingWidth * 0.01}
      />
      
      {/* Door details - Viking style metal bands */}
      <rect
        x={buildingX + buildingWidth * 0.45}
        y={buildingY + buildingHeight * 0.7}
        width={buildingWidth * 0.1}
        height={buildingHeight * 0.02}
        fill="#4a4a4a"
      />
      <rect
        x={buildingX + buildingWidth * 0.45}
        y={buildingY + buildingHeight * 0.85}
        width={buildingWidth * 0.1}
        height={buildingHeight * 0.02}
        fill="#4a4a4a"
      />
      
      {/* Small windows with shutters */}
      {Array.from({ length: 3 }).map((_, i) => {
        const windowX = buildingX + buildingWidth * (0.15 + i * 0.25);
        return (
          <g key={`window-${i}`}>
            <rect
              x={windowX}
              y={buildingY + buildingHeight * 0.5}
              width={buildingWidth * 0.06}
              height={buildingHeight * 0.08}
              fill="rgba(0,0,0,0.8)"
              stroke={woodTrimColor}
              strokeWidth="0.3"
            />
            {/* Window cross bars */}
            <line
              x1={windowX + buildingWidth * 0.03}
              y1={buildingY + buildingHeight * 0.5}
              x2={windowX + buildingWidth * 0.03}
              y2={buildingY + buildingHeight * 0.58}
              stroke={woodTrimColor}
              strokeWidth="0.2"
            />
          </g>
        );
      })}
      
      {/* Smoke from chimney hole */}
      {rand3 > 0.3 && (
        <g opacity="0.6">
          <ellipse
            cx={buildingX + buildingWidth * 0.7}
            cy={buildingY}
            rx={buildingWidth * 0.03}
            ry={buildingHeight * 0.02}
            fill="rgba(100,100,100,0.3)"
          />
          <path
            d={`M ${buildingX + buildingWidth * 0.7} ${buildingY}
               Q ${buildingX + buildingWidth * 0.72} ${buildingY - buildingHeight * 0.1}
               ${buildingX + buildingWidth * 0.68} ${buildingY - buildingHeight * 0.2}`}
            stroke="rgba(150,150,150,0.4)"
            strokeWidth="2"
            fill="none"
          />
        </g>
      )}
      
      {/* Decorative Viking elements - dragon head post */}
      <path
        d={`M ${buildingX - buildingWidth * 0.08} ${buildingY + buildingHeight * 0.3}
           Q ${buildingX - buildingWidth * 0.1} ${buildingY + buildingHeight * 0.25}
           ${buildingX - buildingWidth * 0.08} ${buildingY + buildingHeight * 0.2}
           L ${buildingX - buildingWidth * 0.06} ${buildingY + buildingHeight * 0.22}`}
        fill={woodTrimColor}
        stroke={wallShadowColor}
        strokeWidth="0.3"
      />
    </g>
  );
});

export default VikingLonghouse3D;