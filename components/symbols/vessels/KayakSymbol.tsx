/**
 * components/symbols/vessels/KayakSymbol.tsx - Simple kayak/canoe symbol
 */
import React from 'react';

interface KayakSymbolProps {
  x: number;
  y: number;
  rotation?: number;
  size?: number;
}

const KayakSymbol: React.FC<KayakSymbolProps> = React.memo(({ x, y, rotation = 0, size = 8 }) => {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <defs>
        <linearGradient id="kayakHull" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#8B4513'}} />
          <stop offset="50%" style={{stopColor: '#A0522D'}} />
          <stop offset="100%" style={{stopColor: '#8B4513'}} />
        </linearGradient>
      </defs>
      
      {/* Simple kayak hull - narrow and streamlined */}
      <ellipse 
        cx="0" 
        cy="0" 
        rx={size * 1.2} 
        ry={size * 0.3} 
        fill="url(#kayakHull)"
        stroke="#654321"
        strokeWidth="0.8"
      />
      
      {/* Cockpit opening */}
      <ellipse 
        cx="0" 
        cy="0" 
        rx={size * 0.4} 
        ry={size * 0.15} 
        fill="#2D1810"
        stroke="#654321"
        strokeWidth="0.4"
      />
      
      {/* Bow and stern points */}
      <circle cx={-size * 1.1} cy="0" r="1.5" fill="#654321" />
      <circle cx={size * 1.1} cy="0" r="1.5" fill="#654321" />
    </g>
  );
});

export default KayakSymbol;