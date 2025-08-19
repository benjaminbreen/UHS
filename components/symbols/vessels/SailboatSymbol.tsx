/**
 * components/symbols/vessels/SailboatSymbol.tsx - Small sailboat symbol
 */
import React from 'react';

interface SailboatSymbolProps {
  x: number;
  y: number;
  rotation?: number;
  size?: number;
}

const SailboatSymbol: React.FC<SailboatSymbolProps> = React.memo(({ x, y, rotation = 0, size = 10 }) => {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <defs>
        <linearGradient id="sailboatHull" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#654321'}} />
          <stop offset="50%" style={{stopColor: '#8B4513'}} />
          <stop offset="100%" style={{stopColor: '#654321'}} />
        </linearGradient>
        
        <linearGradient id="smallSail" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#ffffff'}} />
          <stop offset="50%" style={{stopColor: '#f8f8f8'}} />
          <stop offset="100%" style={{stopColor: '#f0f0f0'}} />
        </linearGradient>
      </defs>
      
      {/* Small boat hull */}
      <ellipse 
        cx="0" 
        cy={size * 0.1} 
        rx={size * 0.8} 
        ry={size * 0.2} 
        fill="url(#sailboatHull)"
        stroke="#5D4037"
        strokeWidth="0.8"
      />
      
      {/* Mast */}
      <line 
        x1="0" 
        y1={-size * 0.8} 
        x2="0" 
        y2={size * 0.25} 
        stroke="#8B4513" 
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Main sail - triangular */}
      <path 
        d={`M 0,${-size * 0.8} L ${size * 0.6},${size * 0.1} L 0,${size * 0.1} Z`}
        fill="url(#smallSail)"
        stroke="#e0e0e0"
        strokeWidth="0.6"
        opacity="0.95"
      />
      
      {/* Small jib sail */}
      <path 
        d={`M 0,${-size * 0.6} L ${-size * 0.3},${-size * 0.2} L 0,${-size * 0.1} Z`}
        fill="url(#smallSail)"
        stroke="#e0e0e0"
        strokeWidth="0.5"
        opacity="0.9"
      />
      
      {/* Boom */}
      <line 
        x1="0" 
        y1={size * 0.05} 
        x2={size * 0.55} 
        y2={size * 0.08} 
        stroke="#654321" 
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
});

export default SailboatSymbol;