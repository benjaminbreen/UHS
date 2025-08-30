/**
 * CarpetSymbol.tsx - Decorative floor carpets
 * Stardew Valley style with rich colors and dollhouse perspective
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface CarpetSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  seed?: number;
}

export const CarpetSymbol: React.FC<CarpetSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'Europe',
  era = HistoricalEra.MEDIEVAL,
  seed = 0 
}) => {
  const zone = typeof culturalZone === 'string' ? culturalZone.toLowerCase() : culturalZone;
  
  // Common shadow for all carpets (dollhouse perspective)
  const shadow = (
    <rect
      x={x + size * 0.02}
      y={y + size * 0.02}
      width={size * 0.98}
      height={size * 0.98}
      fill="#000000"
      opacity={0.2}
    />
  );
  
  if (zone.includes('mena') || zone.includes('middle_east')) {
    // Persian carpet with rich Stardew Valley colors
    return (
      <g>
        {shadow}
        
        {/* Main carpet body */}
        <rect 
          x={x} 
          y={y} 
          width={size} 
          height={size} 
          fill="#8B1538"  // Deep burgundy
          rx={size * 0.02}
        />
        
        {/* Inner border */}
        <rect 
          x={x + size * 0.1} 
          y={y + size * 0.1} 
          width={size * 0.8} 
          height={size * 0.8} 
          fill="#B82050"  // Lighter burgundy
          stroke="#6B0F28"
          strokeWidth={1}
        />
        
        {/* Central medallion with highlight */}
        <ellipse 
          cx={x + size * 0.5} 
          cy={y + size * 0.5} 
          rx={size * 0.25} 
          ry={size * 0.2} 
          fill="#2B4C8C"  // Deep blue
        />
        <ellipse 
          cx={x + size * 0.5} 
          cy={y + size * 0.48} 
          rx={size * 0.2} 
          ry={size * 0.15} 
          fill="#3B5C9C"  // Lighter blue (highlight)
        />
        
        {/* Gold accents */}
        <circle cx={x + size * 0.5} cy={y + size * 0.5} r={size * 0.08} fill="#D4AF37" />
        <circle cx={x + size * 0.5} cy={y + size * 0.5} r={size * 0.05} fill="#F4CF57" />
        
        {/* Corner ornaments */}
        {[0.2, 0.8].map(xPos => 
          [0.2, 0.8].map(yPos => (
            <g key={`${xPos}-${yPos}`}>
              <circle 
                cx={x + size * xPos} 
                cy={y + size * yPos} 
                r={size * 0.06} 
                fill="#D4AF37"
              />
              <circle 
                cx={x + size * xPos} 
                cy={y + size * yPos} 
                r={size * 0.03} 
                fill="#8B1538"
              />
            </g>
          ))
        )}
        
        {/* Fringe with transparency */}
        <rect x={x} y={y - size * 0.05} width={size} height={size * 0.05} fill="#D4AF37" opacity={0.6} />
        <rect x={x} y={y + size} width={size} height={size * 0.05} fill="#D4AF37" opacity={0.6} />
      </g>
    );
  } else if (zone.includes('asia')) {
    // Tatami mat with Stardew Valley style
    return (
      <g>
        {shadow}
        
        {/* Main mat */}
        <rect 
          x={x} 
          y={y} 
          width={size} 
          height={size} 
          fill="#C4B5A0"  // Light bamboo
        />
        
        {/* Woven texture */}
        {[0.25, 0.5, 0.75].map(pos => (
          <line 
            key={`h-${pos}`}
            x1={x} 
            y1={y + size * pos} 
            x2={x + size} 
            y2={y + size * pos} 
            stroke="#A49580" 
            strokeWidth={1}
          />
        ))}
        {[0.25, 0.5, 0.75].map(pos => (
          <line 
            key={`v-${pos}`}
            x1={x + size * pos} 
            y1={y} 
            x2={x + size * pos} 
            y2={y + size} 
            stroke="#A49580" 
            strokeWidth={1}
          />
        ))}
        
        {/* Dark border binding */}
        <rect 
          x={x} 
          y={y} 
          width={size} 
          height={size} 
          fill="none" 
          stroke="#4A3F2A" 
          strokeWidth={2}
        />
        
        {/* Highlight on top edge */}
        <line 
          x1={x + 1} 
          y1={y + 1} 
          x2={x + size - 1} 
          y2={y + 1} 
          stroke="#E4D5C0" 
          strokeWidth={1}
        />
      </g>
    );
  } else {
    // European style rug with Stardew Valley richness
    return (
      <g>
        {shadow}
        
        {/* Main rug body */}
        <rect 
          x={x} 
          y={y} 
          width={size} 
          height={size} 
          fill="#4A7C59"  // Forest green
          rx={size * 0.05}
        />
        
        {/* Inner pattern border */}
        <rect 
          x={x + size * 0.1} 
          y={y + size * 0.1} 
          width={size * 0.8} 
          height={size * 0.8} 
          fill="#5A8C69"  // Lighter green
          stroke="#3A6C49"
          strokeWidth={1}
        />
        
        {/* Central medallion */}
        <rect 
          x={x + size * 0.3} 
          y={y + size * 0.3} 
          width={size * 0.4} 
          height={size * 0.4} 
          fill="#8B7355"  // Tan
          stroke="#6B5335"
          strokeWidth={1}
        />
        
        {/* Gold cross pattern */}
        <rect 
          x={x + size * 0.45} 
          y={y + size * 0.35} 
          width={size * 0.1} 
          height={size * 0.3} 
          fill="#D4AF37"
        />
        <rect 
          x={x + size * 0.35} 
          y={y + size * 0.45} 
          width={size * 0.3} 
          height={size * 0.1} 
          fill="#D4AF37"
        />
        
        {/* Tassels with depth */}
        {[0.15, 0.85].map(xPos => 
          [0, 1].map(yPos => (
            <g key={`tassel-${xPos}-${yPos}`}>
              <ellipse 
                cx={x + size * xPos} 
                cy={y + size * yPos} 
                rx={size * 0.03} 
                ry={size * 0.06} 
                fill="#8B7355"
              />
              <ellipse 
                cx={x + size * xPos} 
                cy={y + size * yPos - size * 0.01} 
                rx={size * 0.02} 
                ry={size * 0.04} 
                fill="#AB9375"
              />
            </g>
          ))
        )}
      </g>
    );
  }
};