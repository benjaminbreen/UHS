/**
 * components/symbols/SnowSymbol.tsx
 * Animated snow effects for snow terrain tiles
 */
import React, { useMemo } from 'react';

interface SnowSymbolProps {
  x: number;
  y: number;
  size: number;
  seed?: number;
  gameTime?: number; // For animation
}

const SnowSymbol: React.FC<SnowSymbolProps> = ({ x, y, size, seed = 0, gameTime = 0 }) => {
  // Generate static snow texture patterns
  const snowTexture = useMemo(() => {
    const rng = (s: number) => {
      let x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    
    // Create subtle drifts and shadows
    const drifts = [];
    const numDrifts = 2 + Math.floor(rng(seed) * 2);
    
    for (let i = 0; i < numDrifts; i++) {
      const driftSeed = seed + i * 97;
      const cx = size * rng(driftSeed);
      const cy = size * rng(driftSeed + 1);
      const rx = size * (0.3 + rng(driftSeed + 2) * 0.4);
      const ry = size * (0.2 + rng(driftSeed + 3) * 0.3);
      
      drifts.push({
        cx,
        cy,
        rx,
        ry,
        opacity: 0.05 + rng(driftSeed + 4) * 0.05
      });
    }
    
    return drifts;
  }, [seed, size]);
  
  
  
  // Generate sparkle points for ice crystals (only 10% of tiles)
  const sparkles = useMemo(() => {
    const rng = (s: number) => {
      let x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    
    const points = [];
    // Only 10% of tiles have sparkles
    if (rng(seed + 199) > 0.1) return points;
    
    const numSparkles = 1 + Math.floor(rng(seed + 200) * 2); // Reduced from 3
    
    for (let i = 0; i < numSparkles; i++) {
      const sparkleSeed = seed + i * 10;
      points.push({
        x: size * rng(sparkleSeed),
        y: size * rng(sparkleSeed + 1),
        size: 0.5 + rng(sparkleSeed + 2),
        delay: rng(sparkleSeed + 3) * 5
      });
    }
    
    return points;
  }, [seed, size]);
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Base snow coverage */}
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill="rgba(250, 250, 255, 0.3)"
      />
      
      {/* Snow drifts for texture */}
      {snowTexture.map((drift, i) => (
        <ellipse
          key={`drift-${i}`}
          cx={drift.cx}
          cy={drift.cy}
          rx={drift.rx}
          ry={drift.ry}
          fill={`rgba(230, 240, 255, ${drift.opacity})`}
        />
      ))}
      
      
      
      {/* Ice crystal sparkles */}
      {sparkles.map((sparkle, i) => (
        <g key={`sparkle-${i}`} transform={`translate(${sparkle.x}, ${sparkle.y})`}>
          <circle
            r={sparkle.size}
            fill="rgba(255, 255, 255, 0.9)"
          >
            <animate
              attributeName="opacity"
              values="0;0.9;0"
              dur="2s"
              repeatCount="indefinite"
              begin={`${sparkle.delay}s`}
            />
          </circle>
          {/* Cross pattern for sparkle */}
          <line
            x1={-sparkle.size * 2}
            y1={0}
            x2={sparkle.size * 2}
            y2={0}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="0.2"
          >
            <animate
              attributeName="opacity"
              values="0;0.5;0"
              dur="2s"
              repeatCount="indefinite"
              begin={`${sparkle.delay}s`}
            />
          </line>
          <line
            x1={0}
            y1={-sparkle.size * 2}
            x2={0}
            y2={sparkle.size * 2}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="0.2"
          >
            <animate
              attributeName="opacity"
              values="0;0.5;0"
              dur="2s"
              repeatCount="indefinite"
              begin={`${sparkle.delay}s`}
            />
          </line>
        </g>
      ))}
      
      {/* Subtle footprint depressions */}
      {useMemo(() => {
        const rng = (s: number) => {
          let x = Math.sin(s) * 10000;
          return x - Math.floor(x);
        };
        
        if (rng(seed + 300) > 0.7) { // Only 30% of tiles have footprints
          const trackX = size * (0.2 + rng(seed + 301) * 0.6);
          const trackY = size * (0.2 + rng(seed + 302) * 0.6);
          const trackAngle = rng(seed + 303) * 360;
          
          return (
            <g transform={`translate(${trackX}, ${trackY}) rotate(${trackAngle})`}>
              <ellipse
                cx={0}
                cy={0}
                rx={2}
                ry={3}
                fill="rgba(200, 210, 220, 0.2)"
              />
              <ellipse
                cx={0}
                cy={-4}
                rx={1.5}
                ry={2}
                fill="rgba(200, 210, 220, 0.15)"
              />
            </g>
          );
        }
        return null;
      }, [seed, size])}
    </g>
  );
};

export default React.memo(SnowSymbol);