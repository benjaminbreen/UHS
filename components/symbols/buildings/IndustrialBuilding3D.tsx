/**
 * components/symbols/buildings/IndustrialBuilding3D.tsx - Clean industrial building with proper 3D perspective
 */
import React from 'react';
import { Tile, HistoricalEra } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface IndustrialBuilding3DProps {
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
  seed: number;
  tile: Tile;
  roofColor?: string;
  era?: HistoricalEra;
  nightIntensity?: number;
}

const IndustrialBuilding3D: React.FC<IndustrialBuilding3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, roofColor, era, nightIntensity = 0 
}) => {
  const rng = new ValueNoise(seed + tile.x * 53 + tile.y * 61);
  const uniqueId = `industrial-${tile.x}-${tile.y}`;
  
  // Pre-calculate all random values to prevent re-rendering
  const rand1 = rng.random();
  const rand2 = rng.random();
  const rand3 = rng.random();
  const rand4 = rng.random();
  const rand5 = rng.random();
  
  // Cleaner design with less clutter
  const hasChimney = rand1 > 0.6; // Reduced from 0.3 to 0.6
  const buildingLevels = 1 + Math.floor(rand2 * 2); // 1-2 levels max for cleaner look
  
  // Better color palette
  const brickRed = `hsl(15, 45%, ${50 + rand3 * 8}%)`;
  const brickShadow = `hsl(15, 45%, 35%)`;
  const mortarColor = `hsl(20, 15%, 65%)`;
  const metalRoof = roofColor || `hsl(210, 8%, ${42 + rand4 * 8}%)`;
  const windowDark = 'rgba(20, 30, 40, 0.9)';
  const metalTrim = `hsl(210, 8%, 48%)`;
  
  // Cleaner proportions
  const depth = size * 0.25; // Reduced depth for cleaner look
  const buildingY = y + height * 0.15;
  const buildingHeight = height * 0.85;
  const levelHeight = buildingHeight / buildingLevels;
  
  const renderNightLighting = () => {
    if (nightIntensity < 0.2) return [];
    
    const elements = [];
    const electricLight = 'rgba(255, 240, 180, 0.9)'; // Warm electric light
    
    // Window lighting - more organized pattern
    for (let level = 0; level < buildingLevels; level++) {
      const numWindows = 3; // Consistent 3 windows per level
      for (let i = 0; i < numWindows; i++) {
        if (new ValueNoise(seed + level * 10 + i).random() > 0.3) { // 70% chance each window is lit
          const winX = x + width * (0.15 + i * 0.25);
          const winY = buildingY + level * levelHeight + levelHeight * 0.3;
          const winW = width * 0.12;
          const winH = levelHeight * 0.4;
          
          // Window glow
          elements.push(
            <g key={`light-${level}-${i}`}>
              <rect
                x={winX - winW * 0.1}
                y={winY - winH * 0.1}
                width={winW * 1.2}
                height={winH * 1.2}
                fill={electricLight}
                opacity={nightIntensity * 0.4}
                filter="blur(4px)"
              />
              <rect
                x={winX}
                y={winY}
                width={winW}
                height={winH}
                fill={electricLight}
                opacity={nightIntensity * 0.8}
              />
            </g>
          );
        }
      }
    }
    
    // Factory exterior lighting - simple street lamp
    if (new ValueNoise(seed + 200).random() > 0.7) {
      const lampX = x + width + size * 0.08;
      const lampY = buildingY + buildingHeight * 0.3;
      
      elements.push(
        <g key="street-light">
          <circle
            cx={lampX}
            cy={lampY}
            r={size * 0.12}
            fill={electricLight}
            opacity={nightIntensity * 0.3}
            filter="blur(6px)"
          />
          <circle
            cx={lampX}
            cy={lampY}
            r={size * 0.06}
            fill={electricLight}
            opacity={nightIntensity * 0.6}
            filter="blur(3px)"
          />
          {/* Simple lamp post */}
          <rect
            x={lampX - size * 0.008}
            y={lampY}
            width={size * 0.016}
            height={buildingHeight * 0.7}
            fill="#404040"
            opacity={nightIntensity * 0.8}
          />
        </g>
      );
    }
    
    return elements;
  };

  return (
    <g filter="url(#symbolShadow)">
      <defs>
        <pattern id={`cleanBrick-${uniqueId}`} patternUnits="userSpaceOnUse" width="10" height="6">
          <rect width="10" height="6" fill={mortarColor}/>
          <rect width="9.5" height="2.5" x="0.25" y="0.25" fill={brickRed}/>
          <rect width="9.5" height="2.5" x="0.25" y="3.25" fill={brickRed}/>
        </pattern>
        <linearGradient id={`roofGrad-${uniqueId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={metalRoof} />
          <stop offset="100%" stopColor={brickShadow} />
        </linearGradient>
      </defs>
      
      {/* Clean ground shadow */}
      <ellipse
        cx={x + width/2}
        cy={y + height + size * 0.02}
        rx={width * 0.6}
        ry={width * 0.15}
        fill="rgba(0,0,0,0.25)"
      />
      
      {/* Main building structure - cleaner lines */}
      <rect
        x={x}
        y={buildingY}
        width={width}
        height={buildingHeight}
        fill={`url(#cleanBrick-${uniqueId})`}
        stroke={brickShadow}
        strokeWidth="0.3"
      />
      
      {/* 3D side panel */}
      <path
        d={`M ${x + width} ${buildingY} 
            L ${x + width + depth} ${buildingY - depth * 0.4} 
            L ${x + width + depth} ${y + height - depth * 0.4} 
            L ${x + width} ${y + height} Z`}
        fill={brickShadow}
        stroke={brickShadow}
        strokeWidth="0.2"
      />
      
      {/* Clean metal roof */}
      <path
        d={`M ${x} ${buildingY} 
            L ${x + depth} ${buildingY - depth * 0.4} 
            L ${x + width + depth} ${buildingY - depth * 0.4} 
            L ${x + width} ${buildingY} Z`}
        fill={`url(#roofGrad-${uniqueId})`}
        stroke={brickShadow}
        strokeWidth="0.3"
      />
      
      {/* Organized window pattern */}
      {Array.from({ length: buildingLevels }).map((_, level) => (
        <g key={`level-${level}`}>
          {Array.from({ length: 3 }).map((_, i) => {
            const winX = x + width * (0.15 + i * 0.25);
            const winY = buildingY + level * levelHeight + levelHeight * 0.3;
            const winW = width * 0.12;
            const winH = levelHeight * 0.4;
            
            return (
              <g key={`window-${level}-${i}`}>
                <rect
                  x={winX}
                  y={winY}
                  width={winW}
                  height={winH}
                  fill={windowDark}
                  stroke={metalTrim}
                  strokeWidth="0.2"
                />
                {/* Simple cross pattern */}
                <line
                  x1={winX + winW/2}
                  y1={winY}
                  x2={winX + winW/2}
                  y2={winY + winH}
                  stroke={metalTrim}
                  strokeWidth="0.3"
                  opacity="0.7"
                />
                <line
                  x1={winX}
                  y1={winY + winH/2}
                  x2={winX + winW}
                  y2={winY + winH/2}
                  stroke={metalTrim}
                  strokeWidth="0.3"
                  opacity="0.7"
                />
              </g>
            );
          })}
        </g>
      ))}
      
      {/* Optional chimney with improved smoke */}
      {hasChimney && (
        <g>
          <rect
            x={x + width * 0.75}
            y={buildingY - size * 0.25}
            width={size * 0.08}
            height={size * 0.3}
            fill={brickRed}
            stroke={brickShadow}
            strokeWidth="0.2"
          />
          {/* Chimney cap */}
          <rect
            x={x + width * 0.75 - size * 0.01}
            y={buildingY - size * 0.26}
            width={size * 0.1}
            height={size * 0.015}
            fill={metalTrim}
            stroke={brickShadow}
            strokeWidth="0.2"
          />
          {/* Dynamic smoke plume */}
          {rand5 > 0.3 && (
            <g opacity="0.7">
              {/* Multiple smoke puffs for depth */}
              <ellipse
                cx={x + width * 0.75 + size * 0.04}
                cy={buildingY - size * 0.32}
                rx={size * 0.02}
                ry={size * 0.015}
                fill="rgba(120, 120, 120, 0.5)"
                transform={`rotate(${rand1 * 20 - 10} ${x + width * 0.75 + size * 0.04} ${buildingY - size * 0.32})`}
              />
              <ellipse
                cx={x + width * 0.75 + size * 0.04 + rand2 * size * 0.02}
                cy={buildingY - size * 0.36}
                rx={size * 0.025}
                ry={size * 0.02}
                fill="rgba(130, 130, 130, 0.4)"
                transform={`rotate(${rand2 * 15} ${x + width * 0.75 + size * 0.04} ${buildingY - size * 0.36})`}
              />
              <ellipse
                cx={x + width * 0.75 + size * 0.04 + rand3 * size * 0.03}
                cy={buildingY - size * 0.4}
                rx={size * 0.03}
                ry={size * 0.025}
                fill="rgba(140, 140, 140, 0.3)"
                transform={`rotate(${rand3 * -10} ${x + width * 0.75 + size * 0.04} ${buildingY - size * 0.4})`}
              />
              {/* Largest puff at top */}
              <ellipse
                cx={x + width * 0.75 + size * 0.04 + rand4 * size * 0.04}
                cy={buildingY - size * 0.45}
                rx={size * 0.035}
                ry={size * 0.03}
                fill="rgba(150, 150, 150, 0.25)"
                filter="blur(0.5px)"
              />
              {/* Wispy smoke trail */}
              <path
                d={`M ${x + width * 0.75 + size * 0.04} ${buildingY - size * 0.28}
                    Q ${x + width * 0.75 + size * 0.05 + rand1 * size * 0.02} ${buildingY - size * 0.35}
                      ${x + width * 0.75 + size * 0.04 + rand2 * size * 0.04} ${buildingY - size * 0.45}`}
                stroke="rgba(140, 140, 140, 0.2)"
                strokeWidth={size * 0.01}
                fill="none"
                filter="blur(0.8px)"
              />
            </g>
          )}
        </g>
      )}
      
      {/* Main entrance */}
      <rect
        x={x + width * 0.45}
        y={buildingY + buildingHeight * 0.7}
        width={width * 0.1}
        height={buildingHeight * 0.3}
        fill={windowDark}
        stroke={metalTrim}
        strokeWidth="0.2"
      />
      
      {/* Night lighting */}
      {renderNightLighting()}
    </g>
  );
});

export default IndustrialBuilding3D;