/**
 * components/symbols/LavaSymbolPattern.tsx
 * Pattern-based lava that mimics ASCII look without performance issues
 */
import React from 'react';

interface LavaSymbolPatternProps {
  x: number;
  y: number;
  size: number;
  seed: number;
}

const LavaSymbolPattern: React.FC<LavaSymbolPatternProps> = React.memo(
  ({ x, y, size, seed }) => {
    const patternId = `lava-pattern-${seed % 100}`;
    const maskId = `lava-mask-${seed % 100}`;
    
    return (
      <g transform={`translate(${x}, ${y})`}>
        <defs>
          {/* Create ASCII-like texture pattern */}
          <pattern 
            id={patternId} 
            width="8" 
            height="8" 
            patternUnits="userSpaceOnUse"
          >
            {/* Background volcanic rock */}
            <rect width="8" height="8" fill="#4a4a4a" />
            
            {/* Sparse dots to simulate ASCII characters */}
            <circle cx="2" cy="2" r="0.8" fill="#ff6633" opacity="0.7" />
            <circle cx="6" cy="4" r="0.6" fill="#cc3311" opacity="0.5" />
            <circle cx="3" cy="6" r="0.7" fill="#ff8533" opacity="0.6" />
            <circle cx="7" cy="7" r="0.5" fill="#aa2211" opacity="0.4" />
          </pattern>
          
          {/* Animated mask for flowing effect */}
          <mask id={maskId}>
            <rect width={size} height={size} fill="white">
              <animate
                attributeName="x"
                values="0;-8;0"
                dur="4s"
                repeatCount="indefinite"
              />
            </rect>
          </mask>
        </defs>
        
        {/* Base volcanic rock */}
        <rect width={size} height={size} fill="#4a4a4a" />
        
        {/* Pattern overlay with mask */}
        <rect 
          width={size} 
          height={size} 
          fill={`url(#${patternId})`}
          mask={`url(#${maskId})`}
          opacity="0.9"
        />
        
        {/* Subtle glow overlay */}
        <rect 
          width={size} 
          height={size} 
          fill="radial-gradient(circle, rgba(255,102,51,0.2) 0%, transparent 70%)"
          opacity="0.5"
        />
      </g>
    );
  }
);

export default LavaSymbolPattern;