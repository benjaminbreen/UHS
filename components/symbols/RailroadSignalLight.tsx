/**
 * RailroadSignalLight.tsx - Animated railroad junction signal lights
 * Shows alternating red/green lights at railroad junctions
 */
import React from 'react';

interface RailroadSignalLightProps {
  x: number; // Pixel position
  y: number; // Pixel position
  size: number; // TILE_SIZE_PX
  seed: number; // For offset timing
}

export const RailroadSignalLight: React.FC<RailroadSignalLightProps> = ({ x, y, size, seed }) => {
  const lightSize = size * 0.15; // Small light
  const poleHeight = size * 0.4;

  // Offset animation timing based on seed for variety
  const animationDelay = (seed % 5) * 0.4; // 0-2s delay

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Signal pole (dark gray) */}
      <line
        x1={size / 2}
        y1={size / 2}
        x2={size / 2}
        y2={size / 2 - poleHeight}
        stroke="#3a3a3a"
        strokeWidth={size * 0.03}
        opacity={0.8}
      />

      {/* Signal light housing (black box) */}
      <rect
        x={size / 2 - lightSize / 2}
        y={size / 2 - poleHeight - lightSize}
        width={lightSize}
        height={lightSize * 0.9}
        fill="#1a1a1a"
        opacity={0.9}
      />

      {/* Red light (top) - blinks on/off */}
      <circle
        cx={size / 2}
        cy={size / 2 - poleHeight - lightSize * 0.7}
        r={lightSize * 0.25}
        fill="#ff3333"
        opacity={0.9}
      >
        <animate
          attributeName="opacity"
          values="0.2;0.9;0.9;0.2"
          dur="4s"
          repeatCount="indefinite"
          begin={`${animationDelay}s`}
        />
      </circle>

      {/* Green light (bottom) - blinks on/off (opposite phase) */}
      <circle
        cx={size / 2}
        cy={size / 2 - poleHeight - lightSize * 0.3}
        r={lightSize * 0.25}
        fill="#33ff33"
        opacity={0.2}
      >
        <animate
          attributeName="opacity"
          values="0.9;0.2;0.2;0.9"
          dur="4s"
          repeatCount="indefinite"
          begin={`${animationDelay}s`}
        />
      </circle>

      {/* Glow effect for active light */}
      <circle
        cx={size / 2}
        cy={size / 2 - poleHeight - lightSize * 0.7}
        r={lightSize * 0.4}
        fill="#ff3333"
        opacity={0}
      >
        <animate
          attributeName="opacity"
          values="0;0.3;0.3;0"
          dur="4s"
          repeatCount="indefinite"
          begin={`${animationDelay}s`}
        />
      </circle>

      <circle
        cx={size / 2}
        cy={size / 2 - poleHeight - lightSize * 0.3}
        r={lightSize * 0.4}
        fill="#33ff33"
        opacity={0}
      >
        <animate
          attributeName="opacity"
          values="0.3;0;0;0.3"
          dur="4s"
          repeatCount="indefinite"
          begin={`${animationDelay}s`}
        />
      </circle>
    </g>
  );
};

export default RailroadSignalLight;
