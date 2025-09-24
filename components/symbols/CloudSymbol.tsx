/**
 * CloudSymbol.tsx - Renders ethereal cloud tiles for heaven/dream realms
 */

import React from 'react';
import { ValueNoise } from '../../utils/noise';
import { ClimateType } from '../../types';

interface CloudSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  climate?: ClimateType;
}

const CloudSymbol: React.FC<CloudSymbolProps> = React.memo(({ x, y, size, seed, climate }) => {
  // Use position-based seed for stability
  const tileSeed = x * 137 + y * 149 + 12345;
  const noise = new ValueNoise(tileSeed);

  // For heaven/ether - beautiful fluffy white clouds
  // Simplified and optimized for performance
  const clouds = [];

  // Create 2-3 fluffy cloud shapes using overlapping circles
  // This is more performant than many small puffs
  const cloudGroups = 2 + Math.floor(noise.random() * 2);

  for (let g = 0; g < cloudGroups; g++) {
    const groupX = x + (g + 0.5) * (size / cloudGroups);
    const groupY = y + size * 0.3 + noise.random() * size * 0.4;

    // Each cloud is made of 3 overlapping circles for a fluffy effect
    const baseRadius = size * 0.15 + noise.random() * size * 0.1;

    // Bottom layer - largest, softest
    clouds.push(
      <ellipse
        key={`cloud-${g}-base`}
        cx={groupX}
        cy={groupY + baseRadius * 0.3}
        rx={baseRadius * 1.4}
        ry={baseRadius * 0.8}
        fill="rgba(255, 255, 255, 0.4)"
      />
    );

    // Middle layer
    clouds.push(
      <ellipse
        key={`cloud-${g}-mid`}
        cx={groupX}
        cy={groupY}
        rx={baseRadius * 1.2}
        ry={baseRadius * 0.9}
        fill="rgba(255, 255, 255, 0.7)"
      />
    );

    // Top layer - smallest, brightest
    clouds.push(
      <ellipse
        key={`cloud-${g}-top`}
        cx={groupX + noise.random() * baseRadius * 0.3 - baseRadius * 0.15}
        cy={groupY - baseRadius * 0.2}
        rx={baseRadius * 0.9}
        ry={baseRadius * 0.7}
        fill="rgba(255, 255, 255, 0.9)"
      />
    );
  }

  // Add subtle wisps at edges for ethereal effect
  const wisps = [];
  if (noise.random() < 0.5) {
    const wispX = x + noise.random() * size;
    const wispY = y + size * 0.7 + noise.random() * size * 0.2;
    wisps.push(
      <ellipse
        key="wisp"
        cx={wispX}
        cy={wispY}
        rx={size * 0.25}
        ry={size * 0.08}
        fill="rgba(255, 255, 255, 0.2)"
      />
    );
  }

  return (
    <g>
      {/* Beautiful light blue sky background */}
      <rect x={x} y={y} width={size} height={size} fill="#e0f2fe" />

      {/* Subtle gradient overlay for depth */}
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={`url(#sky-gradient-${x}-${y})`}
        opacity={0.3}
      />

      {/* Fluffy clouds */}
      {clouds}

      {/* Wisps for ethereal effect */}
      {wisps}

      {/* Define gradients with unique IDs */}
      <defs>
        <linearGradient id={`sky-gradient-${x}-${y}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>
      </defs>
    </g>
  );
}, (prevProps, nextProps) => {
  // Only re-render if position actually changes
  return prevProps.x === nextProps.x &&
         prevProps.y === nextProps.y &&
         prevProps.size === nextProps.size;
});

CloudSymbol.displayName = 'CloudSymbol';

export default CloudSymbol;