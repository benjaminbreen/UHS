/**
 * components/symbols/mines/PrehistoricMine.tsx - Prehistoric era mine/quarry pit
 */
import React from 'react';

interface PrehistoricMineProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const PrehistoricMine: React.FC<PrehistoricMineProps> = ({ x, y, size, seed }) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  
  // Create animated workers
  const workers = [0, 1, 2].map(i => ({
    id: i,
    delay: i * 2,
    path: i % 2 === 0
  }));

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Ground level */}
      <rect x={0} y={0} width={size} height={size * 0.3} fill="#8B7355" />
      
      {/* Pit opening */}
      <ellipse 
        cx={size/2} 
        cy={size * 0.4} 
        rx={size * 0.35} 
        ry={size * 0.15} 
        fill="#2C1810"
        stroke="#4A3426"
        strokeWidth="1"
      />
      
      {/* Inner pit shadow */}
      <ellipse 
        cx={size/2} 
        cy={size * 0.4} 
        rx={size * 0.3} 
        ry={size * 0.12} 
        fill="#1A0F08"
        opacity="0.8"
      />
      
      {/* Rock piles */}
      <circle cx={size * 0.15} cy={size * 0.35} r={size * 0.05} fill="#6B5D54" />
      <circle cx={size * 0.85} cy={size * 0.38} r={size * 0.04} fill="#6B5D54" />
      <circle cx={size * 0.8} cy={size * 0.33} r={size * 0.03} fill="#7A6B5F" />
      
      {/* Simple wooden ladder */}
      <line 
        x1={size * 0.3} y1={size * 0.3} 
        x2={size * 0.35} y2={size * 0.5} 
        stroke="#4A3426" 
        strokeWidth="2"
      />
      <line 
        x1={size * 0.35} y1={size * 0.3} 
        x2={size * 0.4} y2={size * 0.5} 
        stroke="#4A3426" 
        strokeWidth="2"
      />
      {/* Ladder rungs */}
      {[0, 1, 2].map(i => (
        <line 
          key={i}
          x1={size * (0.31 + i * 0.015)} 
          y1={size * (0.35 + i * 0.05)} 
          x2={size * (0.36 + i * 0.015)} 
          y2={size * (0.35 + i * 0.05)} 
          stroke="#4A3426" 
          strokeWidth="1"
        />
      ))}
      
      {/* Animated workers */}
      {workers.map(worker => (
        <g key={worker.id}>
          <circle r={size * 0.02} fill="#8B6F47">
            <animateMotion
              dur="8s"
              repeatCount="indefinite"
              begin={`${worker.delay}s`}
              path={worker.path 
                ? `M ${size * 0.2} ${size * 0.3} L ${size * 0.35} ${size * 0.45} L ${size * 0.5} ${size * 0.4} L ${size * 0.35} ${size * 0.45} L ${size * 0.2} ${size * 0.3}`
                : `M ${size * 0.7} ${size * 0.3} L ${size * 0.55} ${size * 0.45} L ${size * 0.5} ${size * 0.4} L ${size * 0.55} ${size * 0.45} L ${size * 0.7} ${size * 0.3}`
              }
            />
          </circle>
        </g>
      ))}
      
      {/* Stone tools */}
      <polygon 
        points={`${size * 0.12},${size * 0.45} ${size * 0.15},${size * 0.43} ${size * 0.13},${size * 0.48}`}
        fill="#5A4A3A"
      />
      <polygon 
        points={`${size * 0.88},${size * 0.42} ${size * 0.91},${size * 0.40} ${size * 0.89},${size * 0.45}`}
        fill="#5A4A3A"
      />
    </g>
  );
};

export default PrehistoricMine;