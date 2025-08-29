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
  
  if (zone.includes('asia')) {
    // Asian imperial throne
    return (
      <g>
        <rect x={x + size * 0.2} y={y + size * 0.3} width={size * 0.6} height={size * 0.5} fill="#8b0000" stroke="#5c0000" strokeWidth="2" />
        <rect x={x + size * 0.15} y={y + size * 0.15} width={size * 0.7} height={size * 0.2} fill="#ffd700" stroke="#daa520" strokeWidth="1" />
        <circle cx={x + size * 0.5} cy={y + size * 0.25} r={size * 0.08} fill="#ff6347" />
        <rect x={x + size * 0.3} y={y + size * 0.4} width={size * 0.4} height={size * 0.3} fill="#ffdf00" stroke="#ffc700" strokeWidth="0.5" />
      </g>
    );
  } else if (zone.includes('mena')) {
    // Middle Eastern throne
    return (
      <g>
        <rect x={x + size * 0.25} y={y + size * 0.35} width={size * 0.5} height={size * 0.45} fill="#4b0082" stroke="#2e0052" strokeWidth="2" />
        <path d={`M ${x + size * 0.2} ${y + size * 0.2} Q ${x + size * 0.5} ${y + size * 0.1} ${x + size * 0.8} ${y + size * 0.2} L ${x + size * 0.75} ${y + size * 0.4} L ${x + size * 0.25} ${y + size * 0.4} Z`} fill="#9370db" stroke="#7b68ee" strokeWidth="1" />
        <circle cx={x + size * 0.5} cy={y + size * 0.5} r={size * 0.1} fill="#ffd700" stroke="#daa520" strokeWidth="1" />
      </g>
    );
  } else {
    // European throne
    return (
      <g>
        <rect x={x + size * 0.25} y={y + size * 0.35} width={size * 0.5} height={size * 0.5} fill="#8b4513" stroke="#654321" strokeWidth="2" />
        <rect x={x + size * 0.2} y={y + size * 0.15} width={size * 0.6} height={size * 0.25} fill="#b8860b" stroke="#996515" strokeWidth="1" />
        <circle cx={x + size * 0.3} cy={y + size * 0.25} r={size * 0.04} fill="#ffd700" />
        <circle cx={x + size * 0.5} cy={y + size * 0.22} r={size * 0.05} fill="#ffd700" />
        <circle cx={x + size * 0.7} cy={y + size * 0.25} r={size * 0.04} fill="#ffd700" />
        <rect x={x + size * 0.35} y={y + size * 0.45} width={size * 0.3} height={size * 0.25} fill="#dc143c" stroke="#8b0000" strokeWidth="0.5" />
      </g>
    );
  }
};