/**
 * StairsUpPixel.tsx
 * Pixel art style stairs, matching classic RPG aesthetics
 * Now supports both up and down directions
 */

import React from 'react';
import { BiomeType } from '../../../../types/enums';

interface StairsUpPixelProps {
  x?: number;
  y?: number;
  size?: number;
  biome?: BiomeType; // Added to detect STAIRS_DOWN
}

export const StairsUpPixel: React.FC<StairsUpPixelProps> = ({
  x = 0,
  y = 0,
  size = 32,
  biome
}) => {
  // Detect if this is stairs down
  const isDown = biome === BiomeType.STAIRS_DOWN;

  // Create a simple pixel art stairs
  const stepHeight = size / 8;
  const stepWidth = size;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Background darker area (opening) */}
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill="#1a1a1a"
      />

      {/* Stone border/frame */}
      <rect x={0} y={0} width={size} height={2} fill="#8B7355" />
      <rect x={0} y={size-2} width={size} height={2} fill="#8B7355" />
      <rect x={0} y={0} width={2} height={size} fill="#8B7355" />
      <rect x={size-2} y={0} width={2} height={size} fill="#8B7355" />

      {/* Steps (perspective changes based on direction) */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const yPos = isDown
          ? (i + 1) * stepHeight  // Steps go down
          : size - (i + 1) * stepHeight; // Steps go up
        const darkness = isDown
          ? 0.8 - (i * 0.1) // Steps get darker as they go down
          : 0.3 + (i * 0.1); // Steps get lighter as they go up
        const stepColor = `rgba(139, 115, 85, ${darkness})`; // Brown wood color
        const edgeColor = `rgba(160, 134, 98, ${Math.min(1, darkness + 0.2)})`; // Lighter edge

        return (
          <g key={i}>
            {/* Step surface */}
            <rect
              x={4 + i * 2}
              y={yPos}
              width={size - 8 - i * 4}
              height={stepHeight - 1}
              fill={stepColor}
            />
            {/* Step edge highlight */}
            <rect
              x={4 + i * 2}
              y={yPos}
              width={size - 8 - i * 4}
              height={2}
              fill={edgeColor}
            />
            {/* Side shadows for depth */}
            {i > 0 && (
              <>
                <rect
                  x={4 + i * 2}
                  y={yPos + 2}
                  width={2}
                  height={stepHeight - 3}
                  fill="rgba(0,0,0,0.3)"
                />
                <rect
                  x={size - 6 - i * 2}
                  y={yPos + 2}
                  width={2}
                  height={stepHeight - 3}
                  fill="rgba(0,0,0,0.3)"
                />
              </>
            )}
          </g>
        );
      })}

      {/* Railings on sides */}
      <rect x={2} y={size * 0.3} width={3} height={size * 0.5} fill="#6B5D54" />
      <rect x={size - 5} y={size * 0.3} width={3} height={size * 0.5} fill="#6B5D54" />

      {/* Arrow indicating direction */}
      {isDown ? (
        // Down arrow (blue)
        <polygon
          points={`${size/2},${size * 0.85} ${size/2 - 4},${size * 0.75} ${size/2 + 4},${size * 0.75}`}
          fill="#4169E1"
          opacity="0.7"
        />
      ) : (
        // Up arrow (gold)
        <polygon
          points={`${size/2},${size * 0.15} ${size/2 - 4},${size * 0.25} ${size/2 + 4},${size * 0.25}`}
          fill="#FFD700"
          opacity="0.6"
        />
      )}
    </g>
  );
};

export default StairsUpPixel;
