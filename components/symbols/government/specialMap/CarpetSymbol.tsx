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
  
  if (zone.includes('mena') || zone.includes('middle_east')) {
    // Persian/Islamic carpet with intricate patterns
    return (
      <g>
        <rect x={x + size * 0.1} y={y + size * 0.15} width={size * 0.8} height={size * 0.7} fill="#8b4513" stroke="#654321" strokeWidth="1" />
        <rect x={x + size * 0.15} y={y + size * 0.2} width={size * 0.7} height={size * 0.6} fill="#cd853f" stroke="#a0522d" strokeWidth="0.5" />
        {/* Central medallion */}
        <ellipse cx={x + size * 0.5} cy={y + size * 0.5} rx={size * 0.15} ry={size * 0.12} fill="#4b0082" stroke="#2e0052" strokeWidth="0.5" />
        <ellipse cx={x + size * 0.5} cy={y + size * 0.5} rx={size * 0.1} ry={size * 0.08} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
        {/* Corner decorations */}
        <circle cx={x + size * 0.25} cy={y + size * 0.3} r={size * 0.04} fill="#dc143c" />
        <circle cx={x + size * 0.75} cy={y + size * 0.3} r={size * 0.04} fill="#dc143c" />
        <circle cx={x + size * 0.25} cy={y + size * 0.7} r={size * 0.04} fill="#dc143c" />
        <circle cx={x + size * 0.75} cy={y + size * 0.7} r={size * 0.04} fill="#dc143c" />
        {/* Fringe */}
        <rect x={x + size * 0.1} y={y + size * 0.12} width={size * 0.8} height={size * 0.03} fill="#daa520" opacity="0.7" />
        <rect x={x + size * 0.1} y={y + size * 0.85} width={size * 0.8} height={size * 0.03} fill="#daa520" opacity="0.7" />
      </g>
    );
  } else if (zone.includes('asia')) {
    // Asian tatami mat or simple carpet
    return (
      <g>
        <rect x={x + size * 0.05} y={y + size * 0.2} width={size * 0.9} height={size * 0.6} fill="#d4c5b0" stroke="#8b7355" strokeWidth="1" />
        {/* Tatami pattern */}
        <line x1={x + size * 0.05} y1={y + size * 0.5} x2={x + size * 0.95} y2={y + size * 0.5} stroke="#8b7355" strokeWidth="0.5" />
        <line x1={x + size * 0.5} y1={y + size * 0.2} x2={x + size * 0.5} y2={y + size * 0.8} stroke="#8b7355" strokeWidth="0.5" />
        {/* Border */}
        <rect x={x + size * 0.05} y={y + size * 0.2} width={size * 0.9} height={size * 0.6} fill="none" stroke="#654321" strokeWidth="2" strokeDasharray="3,2" />
      </g>
    );
  } else {
    // European style rug
    return (
      <g>
        <rect x={x + size * 0.15} y={y + size * 0.2} width={size * 0.7} height={size * 0.6} fill="#8b0000" stroke="#5c0000" strokeWidth="1" />
        <rect x={x + size * 0.2} y={y + size * 0.25} width={size * 0.6} height={size * 0.5} fill="#a52a2a" stroke="#8b0000" strokeWidth="0.5" />
        {/* Simple pattern */}
        <rect x={x + size * 0.35} y={y + size * 0.4} width={size * 0.3} height={size * 0.2} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
        <circle cx={x + size * 0.5} cy={y + size * 0.5} r={size * 0.05} fill="#8b0000" />
        {/* Tassels */}
        <ellipse cx={x + size * 0.2} cy={y + size * 0.18} rx={size * 0.02} ry={size * 0.03} fill="#8b0000" />
        <ellipse cx={x + size * 0.8} cy={y + size * 0.18} rx={size * 0.02} ry={size * 0.03} fill="#8b0000" />
        <ellipse cx={x + size * 0.2} cy={y + size * 0.82} rx={size * 0.02} ry={size * 0.03} fill="#8b0000" />
        <ellipse cx={x + size * 0.8} cy={y + size * 0.82} rx={size * 0.02} ry={size * 0.03} fill="#8b0000" />
      </g>
    );
  }
};