import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface BookshelfSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  seed?: number;
}

export const BookshelfSymbol: React.FC<BookshelfSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'Europe',
  era = HistoricalEra.MEDIEVAL,
  seed = 0 
}) => {
  const zone = typeof culturalZone === 'string' ? culturalZone.toLowerCase() : culturalZone;
  
  // Books colors
  const bookColors = ['#8b4513', '#2f4f4f', '#8b0000', '#483d8b', '#556b2f', '#704214'];
  const getBookColor = (index: number) => bookColors[index % bookColors.length];
  
  return (
    <g>
      {/* Shelf frame */}
      <rect x={x + size * 0.1} y={y + size * 0.1} width={size * 0.8} height={size * 0.8} fill="#8b6914" stroke="#654321" strokeWidth="1" />
      
      {/* Top shelf */}
      <rect x={x + size * 0.15} y={y + size * 0.25} width={size * 0.7} height={size * 0.02} fill="#654321" />
      {/* Top shelf books */}
      <rect x={x + size * 0.18} y={y + size * 0.15} width={size * 0.08} height={size * 0.1} fill={getBookColor(0)} />
      <rect x={x + size * 0.27} y={y + size * 0.15} width={size * 0.06} height={size * 0.1} fill={getBookColor(1)} />
      <rect x={x + size * 0.34} y={y + size * 0.15} width={size * 0.08} height={size * 0.1} fill={getBookColor(2)} />
      <rect x={x + size * 0.43} y={y + size * 0.15} width={size * 0.05} height={size * 0.1} fill={getBookColor(3)} />
      <rect x={x + size * 0.49} y={y + size * 0.15} width={size * 0.08} height={size * 0.1} fill={getBookColor(4)} />
      <rect x={x + size * 0.58} y={y + size * 0.15} width={size * 0.06} height={size * 0.1} fill={getBookColor(5)} />
      <rect x={x + size * 0.65} y={y + size * 0.15} width={size * 0.08} height={size * 0.1} fill={getBookColor(0)} />
      <rect x={x + size * 0.74} y={y + size * 0.15} width={size * 0.06} height={size * 0.1} fill={getBookColor(1)} />
      
      {/* Middle shelf */}
      <rect x={x + size * 0.15} y={y + size * 0.5} width={size * 0.7} height={size * 0.02} fill="#654321" />
      {/* Middle shelf books */}
      <rect x={x + size * 0.18} y={y + size * 0.38} width={size * 0.07} height={size * 0.12} fill={getBookColor(2)} />
      <rect x={x + size * 0.26} y={y + size * 0.38} width={size * 0.08} height={size * 0.12} fill={getBookColor(3)} />
      <rect x={x + size * 0.35} y={y + size * 0.38} width={size * 0.06} height={size * 0.12} fill={getBookColor(4)} />
      <rect x={x + size * 0.42} y={y + size * 0.38} width={size * 0.08} height={size * 0.12} fill={getBookColor(5)} />
      <rect x={x + size * 0.51} y={y + size * 0.38} width={size * 0.07} height={size * 0.12} fill={getBookColor(0)} />
      <rect x={x + size * 0.59} y={y + size * 0.38} width={size * 0.08} height={size * 0.12} fill={getBookColor(1)} />
      <rect x={x + size * 0.68} y={y + size * 0.38} width={size * 0.06} height={size * 0.12} fill={getBookColor(2)} />
      <rect x={x + size * 0.75} y={y + size * 0.38} width={size * 0.07} height={size * 0.12} fill={getBookColor(3)} />
      
      {/* Bottom shelf */}
      <rect x={x + size * 0.15} y={y + size * 0.75} width={size * 0.7} height={size * 0.02} fill="#654321" />
      {/* Bottom shelf books and scrolls */}
      <rect x={x + size * 0.18} y={y + size * 0.63} width={size * 0.08} height={size * 0.12} fill={getBookColor(4)} />
      <rect x={x + size * 0.27} y={y + size * 0.63} width={size * 0.06} height={size * 0.12} fill={getBookColor(5)} />
      {/* Scroll */}
      <ellipse cx={x + size * 0.38} cy={y + size * 0.69} rx={size * 0.03} ry={size * 0.06} fill="#f4e4c1" stroke="#d4b896" strokeWidth="0.5" />
      <rect x={x + size * 0.43} y={y + size * 0.63} width={size * 0.08} height={size * 0.12} fill={getBookColor(0)} />
      <rect x={x + size * 0.52} y={y + size * 0.63} width={size * 0.06} height={size * 0.12} fill={getBookColor(1)} />
      <rect x={x + size * 0.59} y={y + size * 0.63} width={size * 0.08} height={size * 0.12} fill={getBookColor(2)} />
      {/* Another scroll */}
      <ellipse cx={x + size * 0.72} cy={y + size * 0.69} rx={size * 0.03} ry={size * 0.06} fill="#f4e4c1" stroke="#d4b896" strokeWidth="0.5" />
    </g>
  );
};