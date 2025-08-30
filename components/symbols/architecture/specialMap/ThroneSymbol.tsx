/**
 * ThroneSymbol.tsx - Royal thrones
 * Stardew Valley style with dollhouse perspective and rich shadows
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface ThroneSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  seed?: number;
}

export const ThroneSymbol: React.FC<ThroneSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'Europe',
  era = HistoricalEra.MEDIEVAL,
  seed = 0 
}) => {
  const zone = typeof culturalZone === 'string' ? culturalZone.toLowerCase() : culturalZone;
  
  // Common shadow (dollhouse perspective shows throne from above-front)
  const shadow = (
    <ellipse
      cx={x + size * 0.5}
      cy={y + size * 0.85}
      rx={size * 0.3}
      ry={size * 0.08}
      fill="#000000"
      opacity={0.3}
    />
  );
  
  if (zone.includes('asia')) {
    // Asian imperial throne with rich lacquer finish
    return (
      <g>
        {shadow}
        
        {/* Throne back (tall, visible from dollhouse angle) */}
        <rect 
          x={x + size * 0.25} 
          y={y + size * 0.1} 
          width={size * 0.5} 
          height={size * 0.6} 
          fill="#8B1538"  // Deep red lacquer
          rx={size * 0.02}
        />
        
        {/* Back highlight */}
        <rect 
          x={x + size * 0.27} 
          y={y + size * 0.12} 
          width={size * 0.46} 
          height={size * 0.03} 
          fill="#CB2558"  // Lighter red highlight
        />
        
        {/* Gold dragon emblem */}
        <circle 
          cx={x + size * 0.5} 
          cy={y + size * 0.3} 
          r={size * 0.12} 
          fill="#D4AF37"
        />
        <circle 
          cx={x + size * 0.5} 
          cy={y + size * 0.3} 
          r={size * 0.08} 
          fill="#F4CF57"
        />
        <circle 
          cx={x + size * 0.5} 
          cy={y + size * 0.3} 
          r={size * 0.04} 
          fill="#8B1538"
        />
        
        {/* Seat (visible from above) */}
        <rect 
          x={x + size * 0.2} 
          y={y + size * 0.55} 
          width={size * 0.6} 
          height={size * 0.25} 
          fill="#AB2548"  // Seat cushion
        />
        
        {/* Seat highlight */}
        <rect 
          x={x + size * 0.22} 
          y={y + size * 0.57} 
          width={size * 0.56} 
          height={size * 0.03} 
          fill="#DB3568"
        />
        
        {/* Armrests */}
        <rect 
          x={x + size * 0.15} 
          y={y + size * 0.6} 
          width={size * 0.08} 
          height={size * 0.15} 
          fill="#6B0F28"
        />
        <rect 
          x={x + size * 0.77} 
          y={y + size * 0.6} 
          width={size * 0.08} 
          height={size * 0.15} 
          fill="#6B0F28"
        />
        
        {/* Gold trim */}
        <rect 
          x={x + size * 0.25} 
          y={y + size * 0.68} 
          width={size * 0.5} 
          height={size * 0.02} 
          fill="#D4AF37"
        />
      </g>
    );
  } else if (zone.includes('mena')) {
    // Middle Eastern throne with ornate cushions
    return (
      <g>
        {shadow}
        
        {/* Throne back with arch shape */}
        <path 
          d={`M ${x + size * 0.3} ${y + size * 0.7} 
              L ${x + size * 0.3} ${y + size * 0.3}
              Q ${x + size * 0.5} ${y + size * 0.1} ${x + size * 0.7} ${y + size * 0.3}
              L ${x + size * 0.7} ${y + size * 0.7}
              Z`}
          fill="#4B2C8C"  // Royal purple
        />
        
        {/* Back ornament */}
        <path 
          d={`M ${x + size * 0.35} ${y + size * 0.35}
              Q ${x + size * 0.5} ${y + size * 0.2} ${x + size * 0.65} ${y + size * 0.35}`}
          fill="none"
          stroke="#D4AF37"
          strokeWidth={2}
        />
        
        {/* Cushioned seat */}
        <ellipse 
          cx={x + size * 0.5} 
          cy={y + size * 0.65} 
          rx={size * 0.28} 
          ry={size * 0.15} 
          fill="#6B3CAC"  // Lighter purple
        />
        
        {/* Seat highlight */}
        <ellipse 
          cx={x + size * 0.5} 
          cy={y + size * 0.63} 
          rx={size * 0.24} 
          ry={size * 0.1} 
          fill="#8B5CBC"
        />
        
        {/* Gold star pattern */}
        <polygon 
          points={`${x + size * 0.5},${y + size * 0.35} 
                   ${x + size * 0.52},${y + size * 0.4} 
                   ${x + size * 0.57},${y + size * 0.4} 
                   ${x + size * 0.53},${y + size * 0.44} 
                   ${x + size * 0.55},${y + size * 0.49} 
                   ${x + size * 0.5},${y + size * 0.46} 
                   ${x + size * 0.45},${y + size * 0.49} 
                   ${x + size * 0.47},${y + size * 0.44} 
                   ${x + size * 0.43},${y + size * 0.4} 
                   ${x + size * 0.48},${y + size * 0.4}`}
          fill="#D4AF37"
        />
        
        {/* Armrest cushions */}
        <ellipse 
          cx={x + size * 0.2} 
          cy={y + size * 0.65} 
          rx={size * 0.08} 
          ry={size * 0.06} 
          fill="#8B5CBC"
        />
        <ellipse 
          cx={x + size * 0.8} 
          cy={y + size * 0.65} 
          rx={size * 0.08} 
          ry={size * 0.06} 
          fill="#8B5CBC"
        />
      </g>
    );
  } else {
    // European throne with wood and velvet
    return (
      <g>
        {shadow}
        
        {/* Wooden throne back */}
        <rect 
          x={x + size * 0.25} 
          y={y + size * 0.15} 
          width={size * 0.5} 
          height={size * 0.55} 
          fill="#6B4A31"  // Dark wood
          rx={size * 0.02}
        />
        
        {/* Back panel highlight */}
        <rect 
          x={x + size * 0.27} 
          y={y + size * 0.17} 
          width={size * 0.46} 
          height={size * 0.03} 
          fill="#8B6A51"  // Wood highlight
        />
        
        {/* Crown decoration on back */}
        <g transform={`translate(${x + size * 0.5}, ${y + size * 0.3})`}>
          {/* Crown base */}
          <rect 
            x={-size * 0.12} 
            y={0} 
            width={size * 0.24} 
            height={size * 0.06} 
            fill="#D4AF37"
          />
          {/* Crown points */}
          <polygon 
            points={`${-size * 0.1},0 ${-size * 0.08},-${size * 0.08} ${-size * 0.04},0 
                     0,-${size * 0.1} ${size * 0.04},0 ${size * 0.08},-${size * 0.08} ${size * 0.1},0`}
            fill="#D4AF37"
          />
          {/* Jewels */}
          <circle cx={0} cy={-size * 0.05} r={size * 0.02} fill="#DC143C" />
          <circle cx={-size * 0.06} cy={0} r={size * 0.015} fill="#4169E1" />
          <circle cx={size * 0.06} cy={0} r={size * 0.015} fill="#4169E1" />
        </g>
        
        {/* Velvet seat */}
        <rect 
          x={x + size * 0.2} 
          y={y + size * 0.6} 
          width={size * 0.6} 
          height={size * 0.2} 
          fill="#8B1538"  // Royal red velvet
        />
        
        {/* Seat highlight */}
        <rect 
          x={x + size * 0.22} 
          y={y + size * 0.62} 
          width={size * 0.56} 
          height={size * 0.03} 
          fill="#AB2548"
        />
        
        {/* Wooden armrests */}
        <rect 
          x={x + size * 0.15} 
          y={y + size * 0.62} 
          width={size * 0.1} 
          height={size * 0.18} 
          fill="#6B4A31"
        />
        <rect 
          x={x + size * 0.75} 
          y={y + size * 0.62} 
          width={size * 0.1} 
          height={size * 0.18} 
          fill="#6B4A31"
        />
        
        {/* Armrest highlights */}
        <rect 
          x={x + size * 0.16} 
          y={y + size * 0.62} 
          width={size * 0.08} 
          height={size * 0.02} 
          fill="#8B6A51"
        />
        <rect 
          x={x + size * 0.76} 
          y={y + size * 0.62} 
          width={size * 0.08} 
          height={size * 0.02} 
          fill="#8B6A51"
        />
        
        {/* Decorative studs */}
        <circle cx={x + size * 0.3} cy={y + size * 0.5} r={size * 0.015} fill="#D4AF37" />
        <circle cx={x + size * 0.7} cy={y + size * 0.5} r={size * 0.015} fill="#D4AF37" />
      </g>
    );
  }
};