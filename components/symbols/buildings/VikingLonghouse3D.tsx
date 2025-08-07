/**
 * components/symbols/buildings/VikingLonghouse3D.tsx - Renders a detailed Nordic/Viking longhouse
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
  roofColor: string;
  era: HistoricalEra;
}

const VikingLonghouse3D: React.FC<VikingLonghouse3DProps> = React.memo(({ x, y, width, height, size, seed, tile, roofColor, era }) => {
  const rng = new ValueNoise(seed + tile.x * 13 + tile.y * 17);
  const uniqueId = `longhouse-${tile.x}-${tile.y}`;
  
  // Pre-calculate all random values to prevent re-rendering
  const rand1 = rng.random();
  const rand2 = rng.random();
  const rand3 = rng.random();
  const rand4 = rng.random();
  const rand5 = rng.random();
  
  // Make it longer than tall
  const buildingWidth = width * 1.4;
  const buildingHeight = height * 0.7;
  const buildingX = x - buildingWidth * 0.2;
  const buildingY = y + height - buildingHeight;
  
  const wallColor = `hsl(30, 25%, ${45 + rand1 * 15}%)`;
  const wallShadowColor = `hsl(30, 25%, 35%)`;
  const thatchColor = `hsl(35, 40%, ${40 + rand2 * 10}%)`;
  const woodTrimColor = '#654321';
  const smokeColor = 'rgba(150, 150, 150, 0.7)';

  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <linearGradient id={`wallGradient-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={wallColor} />
          <stop offset="60%" stopColor={wallColor} />
          <stop offset="100%" stopColor={wallShadowColor} />
        </linearGradient>
        <pattern id={`thatchPattern-${uniqueId}`} patternUnits="userSpaceOnUse" width="3" height="3">
          <path d="M 0 1.5 L 3 1.5" stroke={thatchColor} strokeWidth="0.4" />
          <path d="M 0 3 L 3 3" stroke={thatchColor} strokeWidth="0.3" opacity="0.6"/>
        </pattern>
      </defs>
      
      {/* Ground shadow */}
      <ellipse 
        cx={buildingX + buildingWidth/2} 
        cy={buildingY + buildingHeight + 2} 
        rx={buildingWidth * 0.6} 
        ry={buildingWidth * 0.15} 
        fill="rgba(0,0,0,0.25)" 
      />
      
      {/* Main wall structure */}
      <rect
        x={buildingX}
        y={buildingY}
        width={buildingWidth}
        height={buildingHeight}
        fill={`url(#wallGradient-${uniqueId})`}
        stroke={woodTrimColor}
        strokeWidth="0.3"
      />
      
      {/* Wooden support beams */}
      {Array.from({ length: 4 }).map((_, i) => {
        const beamX = buildingX + buildingWidth * (0.2 + i * 0.2);
        return (
          <rect
            key={`beam-${i}`}
            x={beamX}
            y={buildingY}
            width={size * 0.015}
            height={buildingHeight}
            fill={woodTrimColor}
          />
        );
      })}
      
      {/* Curved roof (thatched) */}
      <path
        d={`M ${buildingX - size * 0.05} ${buildingY} 
            Q ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.4} 
            ${buildingX + buildingWidth + size * 0.05} ${buildingY}
            L ${buildingX + buildingWidth} ${buildingY + size * 0.02}
            Q ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.35}
            ${buildingX} ${buildingY + size * 0.02} Z`}
        fill={roofColor}
        stroke={woodTrimColor}
        strokeWidth="0.3"
      />
      
      {/* Thatch texture */}
      <path
        d={`M ${buildingX - size * 0.05} ${buildingY} 
            Q ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.4} 
            ${buildingX + buildingWidth + size * 0.05} ${buildingY}
            L ${buildingX + buildingWidth} ${buildingY + size * 0.02}
            Q ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.35}
            ${buildingX} ${buildingY + size * 0.02} Z`}
        fill={`url(#thatchPattern-${uniqueId})`}
        opacity="0.6"
      />
      
      {/* Main entrance (larger door) */}
      <rect
        x={buildingX + buildingWidth * 0.45}
        y={buildingY + buildingHeight * 0.3}
        width={buildingWidth * 0.1}
        height={buildingHeight * 0.7}
        fill="#2d1810"
        stroke={woodTrimColor}
        strokeWidth="0.2"
        rx={size * 0.01}
      />
      
      {/* Door reinforcement bands */}
      <rect
        x={buildingX + buildingWidth * 0.45}
        y={buildingY + buildingHeight * 0.5}
        width={buildingWidth * 0.1}
        height={size * 0.01}
        fill={woodTrimColor}
      />
      <rect
        x={buildingX + buildingWidth * 0.45}
        y={buildingY + buildingHeight * 0.7}
        width={buildingWidth * 0.1}
        height={size * 0.01}
        fill={woodTrimColor}
      />
      
      {/* Small windows */}
      {Array.from({ length: 2 }).map((_, i) => {
        const windowX = buildingX + buildingWidth * (0.15 + i * 0.6);
        return (
          <rect
            key={`window-${i}`}
            x={windowX}
            y={buildingY + buildingHeight * 0.4}
            width={size * 0.04}
            height={size * 0.03}
            fill="rgba(0,0,0,0.8)"
            stroke={woodTrimColor}
            strokeWidth="0.2"
          />
        );
      })}
      
      {/* Smoke from central hearth */}
      <circle
        cx={buildingX + buildingWidth/2}
        cy={buildingY - buildingHeight * 0.3}
        r={size * 0.015}
        fill={smokeColor}
        opacity={0.8}
      />
      <circle
        cx={buildingX + buildingWidth/2 + (rand3 - 0.5) * size * 0.03}
        cy={buildingY - buildingHeight * 0.5}
        r={size * 0.012}
        fill={smokeColor}
        opacity={0.6}
      />
      <circle
        cx={buildingX + buildingWidth/2 + (rand4 - 0.5) * size * 0.05}
        cy={buildingY - buildingHeight * 0.7}
        r={size * 0.008}
        fill={smokeColor}
        opacity={0.4}
      />
      
      {/* Decorative dragon head on roof ends (if high-status) */}
      {rand5 > 0.7 && (
        <g>
          {/* Left dragon head */}
          <path
            d={`M ${buildingX - size * 0.02} ${buildingY - size * 0.01} 
                L ${buildingX - size * 0.04} ${buildingY - size * 0.02}
                L ${buildingX - size * 0.03} ${buildingY + size * 0.01}
                Z`}
            fill={woodTrimColor}
          />
          {/* Right dragon head */}
          <path
            d={`M ${buildingX + buildingWidth + size * 0.02} ${buildingY - size * 0.01} 
                L ${buildingX + buildingWidth + size * 0.04} ${buildingY - size * 0.02}
                L ${buildingX + buildingWidth + size * 0.03} ${buildingY + size * 0.01}
                Z`}
            fill={woodTrimColor}
          />
        </g>
      )}
      
      {/* Foundation stones */}
      {Array.from({ length: Math.floor(buildingWidth / (size * 0.1)) }).map((_, i) => (
        <rect
          key={`stone-${i}`}
          x={buildingX + i * size * 0.1}
          y={buildingY + buildingHeight - size * 0.02}
          width={size * 0.08}
          height={size * 0.04}
          fill="#555555"
          opacity="0.8"
        />
      ))}
    </g>
  );
});

export default VikingLonghouse3D;