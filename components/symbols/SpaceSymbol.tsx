/**
 * SpaceSymbol.tsx - Renders outer space tiles with stars and cosmic darkness
 */

import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface SpaceSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const SpaceSymbol: React.FC<SpaceSymbolProps> = React.memo(({ x, y, size, seed }) => {
  // Use position-based seed for stability (not the map seed)
  const tileSeed = x * 137 + y * 149 + 12345;
  const noise = new ValueNoise(tileSeed);

  // Generate more realistic star distribution with varying sizes
  const stars = [];

  // Layer 1: Distant dim stars (many small dots)
  const dimStarCount = 8 + Math.floor(noise.random() * 6);
  for (let i = 0; i < dimStarCount; i++) {
    const starX = x + noise.random() * size;
    const starY = y + noise.random() * size;
    const starSize = 0.2 + noise.random() * 0.3;
    const opacity = 0.2 + noise.random() * 0.3;

    stars.push(
      <circle
        key={`dim-${i}`}
        cx={starX}
        cy={starY}
        r={starSize}
        fill="white"
        opacity={opacity}
      />
    );
  }

  // Layer 2: Medium brightness stars
  const mediumStarCount = 3 + Math.floor(noise.random() * 4);
  for (let i = 0; i < mediumStarCount; i++) {
    const starX = x + noise.random() * size;
    const starY = y + noise.random() * size;
    const starSize = 0.4 + noise.random() * 0.6;
    const opacity = 0.5 + noise.random() * 0.3;

    stars.push(
      <circle
        key={`med-${i}`}
        cx={starX}
        cy={starY}
        r={starSize}
        fill="white"
        opacity={opacity}
      />
    );
  }

  // Layer 3: Bright stars with occasional twinkling
  const brightStarCount = 1 + Math.floor(noise.random() * 2);
  for (let i = 0; i < brightStarCount; i++) {
    const starX = x + noise.random() * size;
    const starY = y + noise.random() * size;
    const starSize = 0.7 + noise.random() * 0.8;
    const opacity = 0.8 + noise.random() * 0.2;

    // 1 in 20 chance for animated twinkling star
    const shouldTwinkle = noise.random() < 0.05;

    if (shouldTwinkle) {
      stars.push(
        <g key={`bright-${i}`}>
          <circle
            cx={starX}
            cy={starY}
            r={starSize}
            fill="white"
            opacity={opacity}
          >
            <animate
              attributeName="opacity"
              values={`${opacity};${opacity * 0.3};${opacity}`}
              dur={`${2 + noise.random() * 2}s`}
              repeatCount="indefinite"
            />
          </circle>
          {/* Subtle glow for twinkling stars */}
          <circle
            cx={starX}
            cy={starY}
            r={starSize * 2.5}
            fill="white"
            opacity={0.15}
          >
            <animate
              attributeName="opacity"
              values="0.15;0.05;0.15"
              dur={`${2 + noise.random() * 2}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      );
    } else {
      stars.push(
        <circle
          key={`bright-${i}`}
          cx={starX}
          cy={starY}
          r={starSize}
          fill="white"
          opacity={opacity}
        />
      );
    }
  }

  // Add occasional colored stars (blue/red giants)
  if (noise.random() < 0.3) {
    const coloredX = x + noise.random() * size;
    const coloredY = y + noise.random() * size;
    const isBlue = noise.random() < 0.5;
    const color = isBlue ? '#aaccff' : '#ffaaaa';

    stars.push(
      <circle
        key="colored"
        cx={coloredX}
        cy={coloredY}
        r={1}
        fill={color}
        opacity={0.7}
      />
    );
  }

  return (
    <g>
      {/* Deep space black background */}
      <rect x={x} y={y} width={size} height={size} fill="#000000" />

      {/* Very subtle nebula effect - more performant */}
      {noise.random() < 0.2 && (
        <rect
          x={x}
          y={y}
          width={size}
          height={size}
          fill={`url(#space-gradient-${x}-${y})`}
          opacity={0.06}
        />
      )}

      {/* Stars */}
      {stars}

      {/* Define gradients with unique IDs */}
      <defs>
        <radialGradient id={`space-gradient-${x}-${y}`}>
          <stop offset="0%" stopColor="#1a0033" />
          <stop offset="70%" stopColor="#000011" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
      </defs>
    </g>
  );
}, (prevProps, nextProps) => {
  // Only re-render if position actually changes
  return prevProps.x === nextProps.x &&
         prevProps.y === nextProps.y &&
         prevProps.size === nextProps.size;
});

SpaceSymbol.displayName = 'SpaceSymbol';

export default SpaceSymbol;