/**
 * components/symbols/buildings/PolynesianHouse3D.tsx - Renders a detailed Polynesian/Pacific Islander house
 */
import React from 'react';
import { Tile, HistoricalEra } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface PolynesianHouse3DProps {
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

const PolynesianHouse3D: React.FC<PolynesianHouse3DProps> = React.memo(({ x, y, width, height, size, seed, tile, roofColor, era }) => {
  const rand = new ValueNoise(seed + tile.x * 11 + tile.y * 23).random;
  const uniqueId = `polynesian-${tile.x}-${tile.y}`;
  
  // Elevated structure on stilts
  const buildingWidth = width * 0.9;
  const buildingHeight = height * 0.6;
  const buildingX = x + (width - buildingWidth) / 2;
  const buildingY = y + height - buildingHeight;
  const stiltsHeight = size * 0.15;
  
  const bambooColor = `hsl(60, 30%, ${50 + rand() * 15}%)`;
  const bambooShadowColor = `hsl(60, 30%, 35%)`;
  const palmThatchColor = `hsl(35, 45%, ${35 + rand() * 15}%)`;
  const palmFrondColor = `hsl(80, 40%, ${30 + rand() * 15}%)`;
  const matColor = `hsl(40, 35%, ${45 + rand() * 10}%)`;

  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <linearGradient id={`bambooWall-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={bambooColor} />
          <stop offset="70%" stopColor={bambooColor} />
          <stop offset="100%" stopColor={bambooShadowColor} />
        </linearGradient>
        <pattern id={`palmThatch-${uniqueId}`} patternUnits="userSpaceOnUse" width="4" height="4">
          <path d="M 0 2 L 4 1 M 0 3.5 L 4 2.5" stroke={palmFrondColor} strokeWidth="0.5" opacity="0.8" />
          <path d="M 0 0.5 L 4 0 M 0 4 L 4 3.5" stroke={palmThatchColor} strokeWidth="0.4" opacity="0.6" />
        </pattern>
        <pattern id={`bambooFloor-${uniqueId}`} patternUnits="userSpaceOnUse" width="8" height="2">
          <rect x="0" y="0" width="8" height="1" fill={bambooColor} />
          <rect x="0" y="1" width="8" height="1" fill={bambooShadowColor} opacity="0.3" />
        </pattern>
      </defs>
      
      {/* Ground shadow */}
      <ellipse 
        cx={buildingX + buildingWidth/2} 
        cy={buildingY + buildingHeight + stiltsHeight + 1} 
        rx={buildingWidth * 0.7} 
        ry={buildingWidth * 0.2} 
        fill="rgba(0,0,0,0.2)" 
      />
      
      {/* Stilts/Posts */}
      {Array.from({ length: 6 }).map((_, i) => {
        const postX = buildingX + buildingWidth * (0.1 + i * 0.16);
        return (
          <rect
            key={`post-${i}`}
            x={postX}
            y={buildingY + buildingHeight}
            width={size * 0.02}
            height={stiltsHeight}
            fill={bambooColor}
            stroke="#4a3728"
            strokeWidth="0.2"
          />
        );
      })}
      
      {/* Floor platform */}
      <rect
        x={buildingX}
        y={buildingY + buildingHeight - size * 0.02}
        width={buildingWidth}
        height={size * 0.04}
        fill={`url(#bambooFloor-${uniqueId})`}
        stroke="#4a3728"
        strokeWidth="0.2"
      />
      
      {/* Wall structure - partial walls with open sides */}
      <rect
        x={buildingX + buildingWidth * 0.1}
        y={buildingY + buildingHeight * 0.2}
        width={buildingWidth * 0.8}
        height={buildingHeight * 0.6}
        fill={`url(#bambooWall-${uniqueId})`}
        stroke="#4a3728"
        strokeWidth="0.3"
        opacity="0.9"
      />
      
      {/* Woven mat walls */}
      <rect
        x={buildingX + buildingWidth * 0.1}
        y={buildingY + buildingHeight * 0.2}
        width={buildingWidth * 0.8}
        height={buildingHeight * 0.6}
        fill={matColor}
        opacity="0.6"
      />
      
      {/* Vertical bamboo slats pattern */}
      {Array.from({ length: 8 }).map((_, i) => {
        const slatX = buildingX + buildingWidth * (0.15 + i * 0.09);
        return (
          <rect
            key={`slat-${i}`}
            x={slatX}
            y={buildingY + buildingHeight * 0.2}
            width={size * 0.008}
            height={buildingHeight * 0.6}
            fill="#4a3728"
            opacity="0.7"
          />
        );
      })}
      
      {/* High-pitched thatched roof */}
      <path
        d={`M ${buildingX - size * 0.08} ${buildingY + buildingHeight * 0.2} 
            L ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.3} 
            L ${buildingX + buildingWidth + size * 0.08} ${buildingY + buildingHeight * 0.2} 
            Z`}
        fill={roofColor}
        stroke="#4a3728"
        strokeWidth="0.3"
      />
      
      {/* Palm thatch texture */}
      <path
        d={`M ${buildingX - size * 0.08} ${buildingY + buildingHeight * 0.2} 
            L ${buildingX + buildingWidth/2} ${buildingY - buildingHeight * 0.3} 
            L ${buildingX + buildingWidth + size * 0.08} ${buildingY + buildingHeight * 0.2} 
            Z`}
        fill={`url(#palmThatch-${uniqueId})`}
        opacity="0.8"
      />
      
      {/* Overhanging eaves */}
      <path
        d={`M ${buildingX - size * 0.08} ${buildingY + buildingHeight * 0.2} 
            L ${buildingX - size * 0.06} ${buildingY + buildingHeight * 0.25}
            L ${buildingX + buildingWidth + size * 0.06} ${buildingY + buildingHeight * 0.25}
            L ${buildingX + buildingWidth + size * 0.08} ${buildingY + buildingHeight * 0.2} 
            Z`}
        fill={palmThatchColor}
        stroke="#4a3728"
        strokeWidth="0.2"
        opacity="0.9"
      />
      
      {/* Open entrance (no door) */}
      <rect
        x={buildingX + buildingWidth * 0.4}
        y={buildingY + buildingHeight * 0.5}
        width={buildingWidth * 0.2}
        height={buildingHeight * 0.3}
        fill="rgba(0,0,0,0.6)"
      />
      
      {/* Hanging entrance mat */}
      <rect
        x={buildingX + buildingWidth * 0.42}
        y={buildingY + buildingHeight * 0.5}
        width={buildingWidth * 0.16}
        height={buildingHeight * 0.15}
        fill={matColor}
        stroke="#4a3728"
        strokeWidth="0.2"
        opacity="0.8"
      />
      
      {/* Woven pattern on mat */}
      {Array.from({ length: 3 }).map((_, i) => (
        <rect
          key={`mat-line-${i}`}
          x={buildingX + buildingWidth * 0.42}
          y={buildingY + buildingHeight * (0.52 + i * 0.04)}
          width={buildingWidth * 0.16}
          height={size * 0.005}
          fill="#4a3728"
          opacity="0.6"
        />
      ))}
      
      {/* Side openings for ventilation */}
      <rect
        x={buildingX + buildingWidth * 0.05}
        y={buildingY + buildingHeight * 0.4}
        width={size * 0.03}
        height={buildingHeight * 0.2}
        fill="rgba(0,0,0,0.4)"
        rx={size * 0.01}
      />
      <rect
        x={buildingX + buildingWidth * 0.92}
        y={buildingY + buildingHeight * 0.4}
        width={size * 0.03}
        height={buildingHeight * 0.2}
        fill="rgba(0,0,0,0.4)"
        rx={size * 0.01}
      />
      
      {/* Decorative carved posts (if higher status) */}
      {rand() > 0.6 && (
        <g>
          <circle
            cx={buildingX + buildingWidth * 0.15}
            cy={buildingY + buildingHeight * 0.4}
            r={size * 0.015}
            fill="#8B4513"
          />
          <circle
            cx={buildingX + buildingWidth * 0.85}
            cy={buildingY + buildingHeight * 0.4}
            r={size * 0.015}
            fill="#8B4513"
          />
        </g>
      )}
      
      {/* Coconut palm fronds as decoration */}
      {Array.from({ length: 2 }).map((_, i) => {
        const frondX = buildingX + buildingWidth * (0.2 + i * 0.6);
        return (
          <path
            key={`frond-${i}`}
            d={`M ${frondX} ${buildingY - buildingHeight * 0.1} 
                Q ${frondX + size * 0.04} ${buildingY - buildingHeight * 0.15} 
                ${frondX + size * 0.02} ${buildingY - buildingHeight * 0.2}`}
            fill="none"
            stroke={palmFrondColor}
            strokeWidth="1"
            opacity="0.8"
          />
        );
      })}
      
      {/* Fishing nets hanging (if coastal) */}
      {rand() > 0.5 && (
        <g>
          <path
            d={`M ${buildingX - size * 0.02} ${buildingY + buildingHeight * 0.6} 
                Q ${buildingX - size * 0.04} ${buildingY + buildingHeight * 0.7} 
                ${buildingX - size * 0.02} ${buildingY + buildingHeight * 0.8}`}
            fill="none"
            stroke="rgba(139, 69, 19, 0.6)"
            strokeWidth="0.5"
          />
          <circle cx={buildingX - size * 0.03} cy={buildingY + buildingHeight * 0.7} r={size * 0.01} fill="rgba(139, 69, 19, 0.4)" />
        </g>
      )}
    </g>
  );
});

export default PolynesianHouse3D;