/**
 * components/symbols/LavaSymbolStatic.tsx
 * Static ASCII-style lava pattern with minimal animation for performance
 */
import React, { useMemo } from 'react';

interface LavaSymbolStaticProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const LavaSymbolStatic: React.FC<LavaSymbolStaticProps> = React.memo(
  ({ x, y, size, seed }) => {
    // Generate a static pattern based on position
    const pattern = useMemo(() => {
      // Create a simple lava pattern based on seed
      const chars = ['▓', '▒', '░', '█'];
      const index = (seed + x + y) % chars.length;
      return chars[index];
    }, [x, y, seed]);

    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Background glow */}
        <rect 
          x={0} 
          y={0} 
          width={size} 
          height={size} 
          fill="#ff2200" 
          opacity={0.3}
        />
        
        {/* Lava texture */}
        <rect 
          x={0} 
          y={0} 
          width={size} 
          height={size} 
          fill="url(#lavaGradient)" 
          opacity={0.8}
        />
        
        {/* ASCII pattern overlay */}
        <text 
          x={size / 2} 
          y={size / 2} 
          textAnchor="middle" 
          dominantBaseline="middle"
          fontSize={size * 0.8}
          fill="#ff6600"
          opacity={0.9}
        >
          {pattern}
        </text>
        
        {/* Define gradient */}
        <defs>
          <radialGradient id="lavaGradient">
            <stop offset="0%" stopColor="#ffaa00" />
            <stop offset="50%" stopColor="#ff4400" />
            <stop offset="100%" stopColor="#cc0000" />
          </radialGradient>
        </defs>
      </g>
    );
  }
);

export default LavaSymbolStatic;