/**
 * components/symbols/vessels/RowboatSymbol.tsx - Simple rowboat symbol
 */
import React from 'react';

interface RowboatSymbolProps {
  x: number;
  y: number;
  rotation?: number;
  size?: number;
}

const RowboatSymbol: React.FC<RowboatSymbolProps> = React.memo(({ x, y, rotation = 0, size = 9 }) => {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <defs>
        <linearGradient id="rowboatHull" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#654321'}} />
          <stop offset="50%" style={{stopColor: '#8B4513'}} />
          <stop offset="100%" style={{stopColor: '#654321'}} />
        </linearGradient>
      </defs>
      
      {/* Rowboat hull - wider than kayak, narrower than raft */}
      <ellipse 
        cx="0" 
        cy="0" 
        rx={size} 
        ry={size * 0.4} 
        fill="url(#rowboatHull)"
        stroke="#5D4037"
        strokeWidth="0.8"
      />
      
      {/* Interior */}
      <ellipse 
        cx="0" 
        cy="0" 
        rx={size * 0.8} 
        ry={size * 0.25} 
        fill="#8B7355"
        stroke="#654321"
        strokeWidth="0.5"
      />
      
      {/* Seats/benches */}
      <rect x={-size * 0.6} y={-size * 0.08} width={size * 1.2} height={size * 0.06} fill="#654321" rx="1" />
      <rect x={-size * 0.5} y={size * 0.15} width={size * 1.0} height={size * 0.06} fill="#654321" rx="1" />
      
      {/* Oars */}
      <g opacity="0.8">
        <ellipse cx={-size * 0.4} cy={-size * 0.6} rx="12" ry="3" fill="#8B4513" transform="rotate(-30)" />
        <line x1={-size * 0.4} y1={-size * 0.1} x2={-size * 0.4} y2={-size * 0.5} stroke="#654321" strokeWidth="2" />
        
        <ellipse cx={size * 0.4} cy={-size * 0.6} rx="12" ry="3" fill="#8B4513" transform="rotate(30)" />
        <line x1={size * 0.4} y1={-size * 0.1} x2={size * 0.4} y2={-size * 0.5} stroke="#654321" strokeWidth="2" />
      </g>
    </g>
  );
});

export default RowboatSymbol;