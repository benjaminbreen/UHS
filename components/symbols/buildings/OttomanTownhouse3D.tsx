/**
 * components/symbols/buildings/OttomanTownhouse3D.tsx - Clean Ottoman/Mediterranean townhouse with proper perspective
 */
import React from 'react';
import { Tile } from '../../../types';
import { ValueNoise } from '../../../utils/noise';

interface OttomanTownhouse3DProps {
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  size: number; 
  seed: number; 
  tile: Tile;
  nightIntensity?: number;
}

const OttomanTownhouse3D: React.FC<OttomanTownhouse3DProps> = React.memo(({ 
  x, y, width, height, size, seed, tile, nightIntensity = 0 
}) => {
  const rng = new ValueNoise(seed + tile.x * 127 + tile.y * 131);
  const uniqueId = `ottoman-${tile.x}-${tile.y}`;

  // Random variations
  const colorVariation = rng.random();
  const hasArches = rng.random() > 0.3;
  const hasBalcony = rng.random() > 0.5;
  const windowColumns = Math.floor(rng.random() * 2) + 2; // 2 or 3 columns
  const roofColorVariant = Math.floor(rng.random() * 4); // More roof color variety

  // Clean dimensions
  const houseWidth = width * 0.98;
  const houseHeight = height * 0.92;
  const houseX = x + (width - houseWidth) / 2;
  const houseY = y + height * 0.38;

  // Proper 3D perspective
  const depthX = width * 0.1;
  const depthY = height * 0.06;
  
  // Lower roof pitch (more Mediterranean)
  const roofHeight = houseHeight * 0.15; // Lower than before
  const peakX = houseX + houseWidth * 0.5;
  const peakY = houseY - roofHeight;

  // Wall colors
  const wallColor = `hsl(30, 18%, ${84 + colorVariation * 6}%)`;
  const wallDark = `hsl(30, 20%, ${72 + colorVariation * 4}%)`;
  const wallAccent = `hsl(30, 15%, 90%)`;
  
  // Varied roof colors
  const roofColors = [
    { main: `hsl(15, 55%, 45%)`, dark: `hsl(12, 50%, 35%)` }, // Mediterranean red
    { main: `hsl(20, 35%, 40%)`, dark: `hsl(18, 30%, 30%)` }, // Brown
    { main: `hsl(25, 20%, 45%)`, dark: `hsl(22, 15%, 35%)` }, // Gray-brown
    { main: `hsl(10, 45%, 50%)`, dark: `hsl(8, 40%, 38%)` },  // Terracotta
  ];
  const roofColor = roofColors[roofColorVariant].main;
  const roofDark = roofColors[roofColorVariant].dark;
  
  const woodColor = '#6B5443';
  const windowDark = '#1C1815';

  // Thin, clean lines
  const strokeWidth = 0.4;

  return (
    <g>
      {/* Proper shadow */}
      <ellipse
        cx={houseX + houseWidth/2 + depthX/2}
        cy={houseY + houseHeight + 3}
        rx={houseWidth * 0.6}
        ry={houseHeight * 0.1}
        fill="rgba(0,0,0,0.22)"
      />

      {/* Side wall (3D depth) */}
      <path
        d={`M ${houseX + houseWidth} ${houseY}
           L ${houseX + houseWidth + depthX} ${houseY - depthY}
           L ${houseX + houseWidth + depthX} ${houseY + houseHeight - depthY}
           L ${houseX + houseWidth} ${houseY + houseHeight} Z`}
        fill={wallDark}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={strokeWidth}
      />

      {/* Main front wall */}
      <rect
        x={houseX}
        y={houseY}
        width={houseWidth}
        height={houseHeight}
        fill={wallColor}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth={strokeWidth}
      />

      {/* Wall texture - horizontal bands */}
      <rect
        x={houseX}
        y={houseY + houseHeight * 0.35}
        width={houseWidth}
        height={1}
        fill={wallDark}
        opacity={0.3}
      />

      {/* Filled triangular gable (not see-through) */}
      <polygon
        points={`${houseX},${houseY} ${peakX},${peakY} ${houseX + houseWidth},${houseY}`}
        fill={wallAccent}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth={strokeWidth}
      />

      {/* Windows - properly positioned */}
      {[...Array(windowColumns)].map((_, i) => {
        const xPos = (i + 1) / (windowColumns + 1);
        const winW = houseWidth * 0.12;
        const winH = houseHeight * 0.15;
        const winX = houseX + houseWidth * xPos - winW / 2;
        const upperY = houseY + houseHeight * 0.2;
        const lowerY = houseY + houseHeight * 0.55;

        return (
          <g key={`window-${i}`}>
            {/* Upper window */}
            {hasArches ? (
              <g>
                <path
                  d={`M ${winX} ${upperY + winH}
                     L ${winX} ${upperY + winH * 0.4}
                     Q ${winX + winW/2} ${upperY}
                       ${winX + winW} ${upperY + winH * 0.4}
                     L ${winX + winW} ${upperY + winH} Z`}
                  fill={windowDark}
                  stroke={woodColor}
                  strokeWidth={strokeWidth}
                />
                {/* Window cross */}
                <line x1={winX + winW/2} y1={upperY} x2={winX + winW/2} y2={upperY + winH} 
                      stroke={woodColor} strokeWidth={strokeWidth * 0.7} />
              </g>
            ) : (
              <g>
                <rect
                  x={winX}
                  y={upperY}
                  width={winW}
                  height={winH}
                  fill={windowDark}
                  stroke={woodColor}
                  strokeWidth={strokeWidth}
                />
                {/* Window cross */}
                <line x1={winX + winW/2} y1={upperY} x2={winX + winW/2} y2={upperY + winH} 
                      stroke={woodColor} strokeWidth={strokeWidth * 0.7} />
                <line x1={winX} y1={upperY + winH/2} x2={winX + winW} y2={upperY + winH/2} 
                      stroke={woodColor} strokeWidth={strokeWidth * 0.7} />
              </g>
            )}

            {/* Lower window */}
            <rect
              x={winX}
              y={lowerY}
              width={winW}
              height={winH * 1.2}
              fill={windowDark}
              stroke={woodColor}
              strokeWidth={strokeWidth}
            />
            {/* Window cross */}
            <line x1={winX + winW/2} y1={lowerY} x2={winX + winW/2} y2={lowerY + winH * 1.2} 
                  stroke={woodColor} strokeWidth={strokeWidth * 0.7} />
            <line x1={winX} y1={lowerY + winH * 0.6} x2={winX + winW} y2={lowerY + winH * 0.6} 
                  stroke={woodColor} strokeWidth={strokeWidth * 0.7} />
          </g>
        );
      })}

      {/* Door - properly centered and sized */}
      <rect
        x={houseX + houseWidth * 0.43}
        y={houseY + houseHeight * 0.7}
        width={houseWidth * 0.14}
        height={houseHeight * 0.3}
        fill={windowDark}
        stroke={woodColor}
        strokeWidth={strokeWidth * 1.2}
      />
      {/* Door panel detail */}
      <rect
        x={houseX + houseWidth * 0.45}
        y={houseY + houseHeight * 0.75}
        width={houseWidth * 0.1}
        height={houseHeight * 0.1}
        fill="none"
        stroke={woodColor}
        strokeWidth={strokeWidth * 0.6}
      />

      {/* Balcony */}
      {hasBalcony && (
        <g>
          <rect
            x={houseX + houseWidth * 0.15}
            y={houseY + houseHeight * 0.48}
            width={houseWidth * 0.7}
            height={2}
            fill={woodColor}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={strokeWidth}
          />
          {/* Balcony railing */}
          <line
            x1={houseX + houseWidth * 0.15}
            y1={houseY + houseHeight * 0.45}
            x2={houseX + houseWidth * 0.85}
            y2={houseY + houseHeight * 0.45}
            stroke={woodColor}
            strokeWidth={strokeWidth}
          />
          {/* Balcony posts */}
          {[0.15, 0.85].map((p, i) => (
            <rect
              key={`post-${i}`}
              x={houseX + houseWidth * p - 1}
              y={houseY + houseHeight * 0.45}
              width={2}
              height={5}
              fill={woodColor}
            />
          ))}
        </g>
      )}

      {/* Roof - lower pitch, cleaner geometry */}
      {/* Left roof plane */}
      <path
        d={`M ${houseX} ${houseY}
           L ${peakX} ${peakY}
           L ${peakX + depthX} ${peakY - depthY}
           L ${houseX + depthX} ${houseY - depthY} Z`}
        fill={roofColor}
        stroke={roofDark}
        strokeWidth={strokeWidth}
      />
      {/* Right roof plane */}
      <path
        d={`M ${houseX + houseWidth} ${houseY}
           L ${houseX + houseWidth + depthX} ${houseY - depthY}
           L ${peakX + depthX} ${peakY - depthY}
           L ${peakX} ${peakY} Z`}
        fill={roofDark}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={strokeWidth}
      />
      
      {/* Roof tiles texture */}
      {[0.3, 0.5, 0.7].map((yPos, i) => (
        <line 
          key={`tile-${i}`}
          x1={houseX + houseWidth * 0.1} 
          y1={houseY - roofHeight * yPos}
          x2={houseX + houseWidth * 0.9} 
          y2={houseY - roofHeight * yPos}
          stroke={roofDark}
          strokeWidth={strokeWidth * 0.5}
          opacity={0.3}
        />
      ))}

      {/* Ridge line */}
      <line
        x1={peakX}
        y1={peakY}
        x2={peakX + depthX}
        y2={peakY - depthY}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={strokeWidth}
      />

      {/* Small chimney */}
      <rect
        x={houseX + houseWidth * 0.7}
        y={peakY + roofHeight * 0.3}
        width={3}
        height={roofHeight * 0.5}
        fill={roofColor}
        stroke={roofDark}
        strokeWidth={strokeWidth}
      />

      {/* Night lighting */}
      {nightIntensity > 0 && (
        <g opacity={nightIntensity}>
          {/* Window glows */}
          {[...Array(windowColumns)].map((_, i) => {
            const xPos = (i + 1) / (windowColumns + 1);
            const winW = houseWidth * 0.12;
            const winX = houseX + houseWidth * xPos - winW / 2;
            const upperY = houseY + houseHeight * 0.2;
            return (
              <rect
                key={`glow-${i}`}
                x={winX}
                y={upperY}
                width={winW}
                height={houseHeight * 0.15}
                fill="rgba(255, 200, 100, 0.6)"
              />
            );
          })}
          {/* Door glow */}
          <rect
            x={houseX + houseWidth * 0.43}
            y={houseY + houseHeight * 0.7}
            width={houseWidth * 0.14}
            height={houseHeight * 0.3}
            fill="rgba(255, 180, 80, 0.5)"
          />
        </g>
      )}
    </g>
  );
});

export default OttomanTownhouse3D;