import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface ShrineSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  seed?: number;
}

export const ShrineSymbol: React.FC<ShrineSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'Europe',
  era = HistoricalEra.MEDIEVAL,
  seed = 0 
}) => {
  const zone = typeof culturalZone === 'string' ? culturalZone.toLowerCase() : culturalZone;
  
  if (zone.includes('asia')) {
    // Shinto/Buddhist shrine
    return (
      <g>
        {/* Torii gate structure */}
        <rect x={x + size * 0.15} y={y + size * 0.25} width={size * 0.05} height={size * 0.5} fill="#dc143c" stroke="#8b0000" strokeWidth="0.5" />
        <rect x={x + size * 0.8} y={y + size * 0.25} width={size * 0.05} height={size * 0.5} fill="#dc143c" stroke="#8b0000" strokeWidth="0.5" />
        <rect x={x + size * 0.1} y={y + size * 0.2} width={size * 0.8} height={size * 0.06} fill="#dc143c" stroke="#8b0000" strokeWidth="0.5" />
        <rect x={x + size * 0.12} y={y + size * 0.35} width={size * 0.76} height={size * 0.04} fill="#dc143c" stroke="#8b0000" strokeWidth="0.5" />
        {/* Shrine building */}
        <rect x={x + size * 0.35} y={y + size * 0.55} width={size * 0.3} height={size * 0.25} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
        <polygon points={`${x + size * 0.3},${y + size * 0.55} ${x + size * 0.5},${y + size * 0.45} ${x + size * 0.7},${y + size * 0.55}`} fill="#696969" stroke="#404040" strokeWidth="0.5" />
        {/* Sacred rope (shimenawa) */}
        <line x1={x + size * 0.2} y1={y + size * 0.3} x2={x + size * 0.8} y2={y + size * 0.3} stroke="#d4a76a" strokeWidth="2" strokeDasharray="3,2" />
      </g>
    );
  } else if (zone.includes('mena')) {
    // Islamic shrine/tomb
    return (
      <g>
        {/* Dome structure */}
        <rect x={x + size * 0.25} y={y + size * 0.5} width={size * 0.5} height={size * 0.35} fill="#e8dcc6" stroke="#8b7566" strokeWidth="1" />
        <ellipse cx={x + size * 0.5} cy={y + size * 0.5} rx={size * 0.25} ry={size * 0.15} fill="#4a9eca" stroke="#2c5f7c" strokeWidth="0.5" />
        <circle cx={x + size * 0.5} cy={y + size * 0.35} r={size * 0.02} fill="#ffd700" />
        {/* Crescent */}
        <path d={`M ${x + size * 0.48} ${y + size * 0.3} Q ${x + size * 0.45} ${y + size * 0.25} ${x + size * 0.48} ${y + size * 0.2} Q ${x + size * 0.52} ${y + size * 0.25} ${x + size * 0.48} ${y + size * 0.3}`} 
              fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
        {/* Entrance */}
        <rect x={x + size * 0.45} y={y + size * 0.65} width={size * 0.1} height={size * 0.2} fill="#2c5f7c" />
        {/* Decorative elements */}
        <circle cx={x + size * 0.35} cy={y + size * 0.6} r={size * 0.02} fill="#ffd700" />
        <circle cx={x + size * 0.65} cy={y + size * 0.6} r={size * 0.02} fill="#ffd700" />
      </g>
    );
  } else {
    // European roadside shrine/chapel
    return (
      <g>
        {/* Small chapel structure */}
        <rect x={x + size * 0.3} y={y + size * 0.45} width={size * 0.4} height={size * 0.35} fill="#8b8680" stroke="#5a5651" strokeWidth="1" />
        {/* Roof */}
        <polygon points={`${x + size * 0.25},${y + size * 0.45} ${x + size * 0.5},${y + size * 0.25} ${x + size * 0.75},${y + size * 0.45}`} 
                 fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
        {/* Cross on top */}
        <rect x={x + size * 0.49} y={y + size * 0.15} width={size * 0.02} height={size * 0.1} fill="#404040" />
        <rect x={x + size * 0.46} y={y + size * 0.18} width={size * 0.08} height={size * 0.02} fill="#404040" />
        {/* Arched entrance */}
        <ellipse cx={x + size * 0.5} cy={y + size * 0.65} rx={size * 0.08} ry={size * 0.1} fill="#404040" />
        <rect x={x + size * 0.42} y={y + size * 0.65} width={size * 0.16} height={size * 0.15} fill="#404040" />
        {/* Niche with statue/icon */}
        <rect x={x + size * 0.45} y={y + size * 0.55} width={size * 0.1} height={size * 0.08} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
        {/* Flowers/offerings */}
        <circle cx={x + size * 0.38} cy={y + size * 0.78} r={size * 0.02} fill="#ff69b4" />
        <circle cx={x + size * 0.62} cy={y + size * 0.78} r={size * 0.02} fill="#ff69b4" />
      </g>
    );
  }
};