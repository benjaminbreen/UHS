import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface PillarSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  seed?: number;
}

export const PillarSymbol: React.FC<PillarSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'Europe',
  era = HistoricalEra.MEDIEVAL,
  seed = 0 
}) => {
  const zone = typeof culturalZone === 'string' ? culturalZone.toLowerCase() : culturalZone;
  
  if (zone.includes('asia')) {
    // Asian style pillar - red with gold details
    return (
      <g>
        <rect x={x + size * 0.35} y={y + size * 0.1} width={size * 0.3} height={size * 0.8} fill="#8b0000" stroke="#5c0000" strokeWidth="1" />
        <rect x={x + size * 0.33} y={y + size * 0.08} width={size * 0.34} height={size * 0.05} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
        <rect x={x + size * 0.33} y={y + size * 0.87} width={size * 0.34} height={size * 0.05} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
        <circle cx={x + size * 0.5} cy={y + size * 0.3} r={size * 0.08} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
      </g>
    );
  } else if (zone.includes('mena')) {
    // Islamic style pillar - geometric patterns
    return (
      <g>
        <rect x={x + size * 0.38} y={y + size * 0.1} width={size * 0.24} height={size * 0.8} fill="#e8dcc6" stroke="#8b7566" strokeWidth="1" />
        <rect x={x + size * 0.36} y={y + size * 0.08} width={size * 0.28} height={size * 0.04} fill="#8b7566" />
        <rect x={x + size * 0.36} y={y + size * 0.88} width={size * 0.28} height={size * 0.04} fill="#8b7566" />
        {/* Geometric pattern */}
        <rect x={x + size * 0.42} y={y + size * 0.25} width={size * 0.16} height={size * 0.05} fill="#4a9eca" stroke="#2c5f7c" strokeWidth="0.5" />
        <rect x={x + size * 0.42} y={y + size * 0.45} width={size * 0.16} height={size * 0.05} fill="#4a9eca" stroke="#2c5f7c" strokeWidth="0.5" />
        <rect x={x + size * 0.42} y={y + size * 0.65} width={size * 0.16} height={size * 0.05} fill="#4a9eca" stroke="#2c5f7c" strokeWidth="0.5" />
      </g>
    );
  } else {
    // Classical European pillar
    return (
      <g>
        {/* Base */}
        <rect x={x + size * 0.3} y={y + size * 0.85} width={size * 0.4} height={size * 0.08} fill="#8b8680" stroke="#5a5651" strokeWidth="1" />
        {/* Shaft */}
        <rect x={x + size * 0.35} y={y + size * 0.15} width={size * 0.3} height={size * 0.7} fill="#d4d4d8" stroke="#71717a" strokeWidth="1" />
        {/* Fluting lines */}
        <line x1={x + size * 0.4} y1={y + size * 0.15} x2={x + size * 0.4} y2={y + size * 0.85} stroke="#a3a3a3" strokeWidth="0.5" />
        <line x1={x + size * 0.45} y1={y + size * 0.15} x2={x + size * 0.45} y2={y + size * 0.85} stroke="#a3a3a3" strokeWidth="0.5" />
        <line x1={x + size * 0.5} y1={y + size * 0.15} x2={x + size * 0.5} y2={y + size * 0.85} stroke="#a3a3a3" strokeWidth="0.5" />
        <line x1={x + size * 0.55} y1={y + size * 0.15} x2={x + size * 0.55} y2={y + size * 0.85} stroke="#a3a3a3" strokeWidth="0.5" />
        <line x1={x + size * 0.6} y1={y + size * 0.15} x2={x + size * 0.6} y2={y + size * 0.85} stroke="#a3a3a3" strokeWidth="0.5" />
        {/* Capital */}
        <rect x={x + size * 0.3} y={y + size * 0.07} width={size * 0.4} height={size * 0.08} fill="#8b8680" stroke="#5a5651" strokeWidth="1" />
      </g>
    );
  }
};