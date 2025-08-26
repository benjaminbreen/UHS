/**
 * components/symbols/FireflySymbol.tsx
 * Animated fireflies for swamps and temperate summer nights
 */
import React from 'react';
import { ValueNoise } from '../../utils/noise';

interface FireflySymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const FireflySymbol: React.FC<FireflySymbolProps> = React.memo(({ x, y, size, seed }) => {
  const noise = React.useMemo(() => new ValueNoise(seed), [seed]);
  
  // Generate multiple fireflies with different animation timings
  const fireflies = React.useMemo(() => {
    const count = 1 + Math.floor(noise.random() * 3); // 3-6 fireflies per tile
    return Array.from({ length: count }, (_, i) => {
      const offsetX = (noise.random() - 0.5) * size * 0.8;
      const offsetY = (noise.random() - 0.5) * size * 0.8;
      const duration = 3 + noise.random() * 4; // 3-7 seconds
      const delay = noise.random() * duration;
      const driftX = (noise.random() - 0.5) * size * 0.3;
      const driftY = (noise.random() - 0.5) * size * 0.3;
      const glowSize = 0.8 + noise.random() * 0.5;
      
      return {
        id: `firefly-${seed}-${i}`,
        x: x + size / 2 + offsetX,
        y: y + size / 2 + offsetY,
        duration,
        delay,
        driftX,
        driftY,
        glowSize
      };
    });
  }, [x, y, size, seed, noise]);

  return (
    <g className="fireflies-container">
      <defs>
        {fireflies.map(firefly => (
          <radialGradient key={`grad-${firefly.id}`} id={`fireflyGlow-${firefly.id}`}>
            <stop offset="0%" stopColor="#ffeb3b" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#fff59d" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fff9c4" stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      
      {fireflies.map(firefly => (
        <g key={firefly.id}>
          {/* Glowing orb */}
          <circle
            cx={firefly.x}
            cy={firefly.y}
            r={firefly.glowSize * 3}
            fill={`url(#fireflyGlow-${firefly.id})`}
            opacity="0.8"
          >
            <animate
              attributeName="opacity"
              values="0;0.8;0.3;0.9;0"
              dur={`${firefly.duration}s`}
              begin={`${firefly.delay}s`}
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0 0; ${firefly.driftX} ${firefly.driftY}; 0 0`}
              dur={`${firefly.duration * 2}s`}
              begin={`${firefly.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Bright center */}
          <circle
            cx={firefly.x}
            cy={firefly.y}
            r={firefly.glowSize * 0.5}
            fill="#fffde7"
            opacity="0.9"
          >
            <animate
              attributeName="opacity"
              values="0;0.9;0.4;1;0"
              dur={`${firefly.duration}s`}
              begin={`${firefly.delay}s`}
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0 0; ${firefly.driftX} ${firefly.driftY}; 0 0`}
              dur={`${firefly.duration * 2}s`}
              begin={`${firefly.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}
    </g>
  );
});

export default FireflySymbol;