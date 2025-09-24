/**
 * UnderseaSymbol.tsx - Renders underwater tiles with bubbles, light rays, and oceanic atmosphere
 */

import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface UnderseaSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile?: any;
}

const UnderseaSymbol: React.FC<UnderseaSymbolProps> = React.memo(({ x, y, size, seed, tile }) => {
  // Use position-based seed for stability
  const tileSeed = x * 137 + y * 149 + 12345;
  const noise = new ValueNoise(tileSeed);

  // Generate bubbles
  const bubbles = [];
  const bubbleCount = 2 + Math.floor(noise.random() * 3); // 2-4 bubbles

  for (let i = 0; i < bubbleCount; i++) {
    const bubbleX = x + size * 0.2 + noise.random() * size * 0.6;
    const bubbleY = y + size * 0.1 + noise.random() * size * 0.8;
    const bubbleSize = 1.5 + noise.random() * 2.5;
    const opacity = 0.2 + noise.random() * 0.3;

    bubbles.push(
      <g key={`bubble-${i}`}>
        {/* Bubble with highlight */}
        <circle
          cx={bubbleX}
          cy={bubbleY}
          r={bubbleSize}
          fill="none"
          stroke={`rgba(255,255,255,${opacity})`}
          strokeWidth="0.5"
        />
        <circle
          cx={bubbleX - bubbleSize * 0.3}
          cy={bubbleY - bubbleSize * 0.3}
          r={bubbleSize * 0.2}
          fill={`rgba(255,255,255,${opacity * 0.5})`}
        />
      </g>
    );
  }

  // Generate seaweed/kelp
  const seaweed = [];
  if (noise.random() < 0.3) {
    const kelps = 1 + Math.floor(noise.random() * 2);
    for (let i = 0; i < kelps; i++) {
      const kelpX = x + noise.random() * size;
      const kelpHeight = size * 0.3 + noise.random() * size * 0.4;
      const swayOffset = Math.sin(noise.random() * Math.PI) * 3;

      seaweed.push(
        <path
          key={`kelp-${i}`}
          d={`M ${kelpX} ${y + size}
              Q ${kelpX + swayOffset} ${y + size - kelpHeight / 2}
                ${kelpX + swayOffset * 0.5} ${y + size - kelpHeight}`}
          stroke="rgba(34, 139, 34, 0.4)"
          strokeWidth="2"
          fill="none"
        />
      );
    }
  }

  // Generate light rays from surface
  const lightRays = [];
  const rayCount = 2 + Math.floor(noise.random() * 2);
  for (let i = 0; i < rayCount; i++) {
    const rayX = x + noise.random() * size;
    const rayWidth = 10 + noise.random() * 20;
    const opacity = 0.05 + noise.random() * 0.1;

    lightRays.push(
      <polygon
        key={`ray-${i}`}
        points={`${rayX},${y} ${rayX + rayWidth},${y} ${rayX + rayWidth * 0.3},${y + size} ${rayX - rayWidth * 0.3},${y + size}`}
        fill={`rgba(135, 206, 235, ${opacity})`}
      />
    );
  }

  // Occasional fish silhouette
  const fish = [];
  if (noise.random() < 0.15) {
    const fishX = x + size * 0.2 + noise.random() * size * 0.6;
    const fishY = y + size * 0.3 + noise.random() * size * 0.4;
    const fishSize = 3 + noise.random() * 3;

    fish.push(
      <g key="fish" opacity={0.3}>
        {/* Simple fish shape */}
        <ellipse
          cx={fishX}
          cy={fishY}
          rx={fishSize}
          ry={fishSize * 0.4}
          fill="rgba(0, 50, 100, 0.5)"
        />
        <polygon
          points={`${fishX + fishSize * 0.8},${fishY} ${fishX + fishSize * 1.3},${fishY - fishSize * 0.3} ${fishX + fishSize * 1.3},${fishY + fishSize * 0.3}`}
          fill="rgba(0, 50, 100, 0.5)"
        />
      </g>
    );
  }

  return (
    <g>
      {/* Deep ocean blue background with depth gradient */}
      <rect x={x} y={y} width={size} height={size} fill="url(#oceanDepthGradient)" />

      {/* Light rays from surface */}
      {lightRays}

      {/* Seaweed/kelp */}
      {seaweed}

      {/* Water caustics effect overlay */}
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill="url(#causticsPattern)"
        opacity={0.15}
      />

      {/* Bubbles */}
      {bubbles}

      {/* Fish */}
      {fish}

      {/* Define gradients and patterns */}
      <defs>
        <linearGradient id="oceanDepthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>

        <pattern id="causticsPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="3" fill="rgba(100, 200, 255, 0.2)" />
          <circle cx="2" cy="8" r="2" fill="rgba(100, 200, 255, 0.15)" />
          <circle cx="8" cy="2" r="2.5" fill="rgba(100, 200, 255, 0.18)" />
        </pattern>
      </defs>
    </g>
  );
}, (prevProps, nextProps) => {
  // Only re-render if position actually changes
  return prevProps.x === nextProps.x &&
         prevProps.y === nextProps.y &&
         prevProps.size === nextProps.size;
});

UnderseaSymbol.displayName = 'UnderseaSymbol';

export default UnderseaSymbol;