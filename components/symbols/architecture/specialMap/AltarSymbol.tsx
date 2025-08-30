import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface AltarSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  seed?: number;
}

export const AltarSymbol: React.FC<AltarSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'Europe',
  era = HistoricalEra.MEDIEVAL,
  seed = 0 
}) => {
  const zone = typeof culturalZone === 'string' ? culturalZone.toLowerCase() : culturalZone;
  
  if (zone.includes('asia')) {
    // Buddhist/Hindu altar
    return (
      <g>
        {/* Base platform */}
        <rect x={x + size * 0.2} y={y + size * 0.6} width={size * 0.6} height={size * 0.25} fill="#8b4513" stroke="#654321" strokeWidth="1" />
        {/* Altar table */}
        <rect x={x + size * 0.25} y={y + size * 0.45} width={size * 0.5} height={size * 0.15} fill="#cd853f" stroke="#a0522d" strokeWidth="0.5" />
        {/* Incense burner */}
        <ellipse cx={x + size * 0.35} cy={y + size * 0.42} rx={size * 0.04} ry={size * 0.03} fill="#696969" stroke="#404040" strokeWidth="0.5" />
        {/* Smoke */}
        <path d={`M ${x + size * 0.35} ${y + size * 0.4} Q ${x + size * 0.36} ${y + size * 0.3} ${x + size * 0.34} ${y + size * 0.2}`} stroke="#d3d3d3" strokeWidth="1" fill="none" opacity="0.6" />
        {/* Offerings */}
        <circle cx={x + size * 0.5} cy={y + size * 0.43} r={size * 0.03} fill="#ffd700" />
        <circle cx={x + size * 0.65} cy={y + size * 0.43} r={size * 0.025} fill="#ff6347" />
        {/* Buddha/deity statue */}
        <ellipse cx={x + size * 0.5} cy={y + size * 0.3} rx={size * 0.08} ry={size * 0.12} fill="#daa520" stroke="#b8860b" strokeWidth="0.5" />
        <circle cx={x + size * 0.5} cy={y + size * 0.25} r={size * 0.04} fill="#daa520" stroke="#b8860b" strokeWidth="0.5" />
      </g>
    );
  } else if (zone.includes('mena')) {
    // Islamic prayer niche (mihrab representation)
    return (
      <g>
        {/* Mihrab arch */}
        <path d={`M ${x + size * 0.3} ${y + size * 0.8} L ${x + size * 0.3} ${y + size * 0.3} Q ${x + size * 0.5} ${y + size * 0.15} ${x + size * 0.7} ${y + size * 0.3} L ${x + size * 0.7} ${y + size * 0.8} Z`} 
              fill="#e8dcc6" stroke="#8b7566" strokeWidth="1" />
        {/* Inner arch */}
        <path d={`M ${x + size * 0.35} ${y + size * 0.75} L ${x + size * 0.35} ${y + size * 0.35} Q ${x + size * 0.5} ${y + size * 0.25} ${x + size * 0.65} ${y + size * 0.35} L ${x + size * 0.65} ${y + size * 0.75} Z`} 
              fill="#4a9eca" stroke="#2c5f7c" strokeWidth="0.5" />
        {/* Prayer rug */}
        <rect x={x + size * 0.35} y={y + size * 0.7} width={size * 0.3} height={size * 0.15} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
        {/* Geometric pattern */}
        <circle cx={x + size * 0.5} cy={y + size * 0.5} r={size * 0.05} fill="none" stroke="#ffd700" strokeWidth="0.5" />
        <rect x={x + size * 0.45} y={y + size * 0.45} width={size * 0.1} height={size * 0.1} fill="none" stroke="#ffd700" strokeWidth="0.5" transform={`rotate(45 ${x + size * 0.5} ${y + size * 0.5})`} />
      </g>
    );
  } else {
    // Christian altar
    return (
      <g>
        {/* Altar table */}
        <rect x={x + size * 0.2} y={y + size * 0.5} width={size * 0.6} height={size * 0.3} fill="#8b8680" stroke="#5a5651" strokeWidth="1" />
        {/* Altar cloth */}
        <rect x={x + size * 0.18} y={y + size * 0.48} width={size * 0.64} height={size * 0.05} fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5" />
        {/* Cross */}
        <rect x={x + size * 0.48} y={y + size * 0.25} width={size * 0.04} height={size * 0.25} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
        <rect x={x + size * 0.4} y={y + size * 0.32} width={size * 0.2} height={size * 0.04} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
        {/* Candles */}
        <rect x={x + size * 0.3} y={y + size * 0.42} width={size * 0.03} height={size * 0.08} fill="#fffacd" stroke="#f0e68c" strokeWidth="0.5" />
        <ellipse cx={x + size * 0.315} cy={y + size * 0.4} rx={size * 0.015} ry={size * 0.02} fill="#ff6347" />
        <rect x={x + size * 0.67} y={y + size * 0.42} width={size * 0.03} height={size * 0.08} fill="#fffacd" stroke="#f0e68c" strokeWidth="0.5" />
        <ellipse cx={x + size * 0.685} cy={y + size * 0.4} rx={size * 0.015} ry={size * 0.02} fill="#ff6347" />
        {/* Bible/book */}
        <rect x={x + size * 0.45} y={y + size * 0.45} width={size * 0.1} height={size * 0.05} fill="#8b0000" stroke="#5c0000" strokeWidth="0.5" />
      </g>
    );
  }
};