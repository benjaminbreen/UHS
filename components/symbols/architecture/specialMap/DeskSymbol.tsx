import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface DeskSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  seed?: number;
}

export const DeskSymbol: React.FC<DeskSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'Europe',
  era = HistoricalEra.MEDIEVAL,
  seed = 0 
}) => {
  return (
    <g>
      {/* Desk surface */}
      <rect x={x + size * 0.15} y={y + size * 0.35} width={size * 0.7} height={size * 0.35} fill="#8b6914" stroke="#654321" strokeWidth="1" />
      {/* Desk top */}
      <rect x={x + size * 0.15} y={y + size * 0.35} width={size * 0.7} height={size * 0.03} fill="#a0826d" />
      {/* Legs */}
      <rect x={x + size * 0.18} y={y + size * 0.38} width={size * 0.04} height={size * 0.32} fill="#654321" />
      <rect x={x + size * 0.78} y={y + size * 0.38} width={size * 0.04} height={size * 0.32} fill="#654321" />
      {/* Drawer */}
      <rect x={x + size * 0.35} y={y + size * 0.4} width={size * 0.3} height={size * 0.08} fill="#705030" stroke="#4a3018" strokeWidth="0.5" />
      <circle cx={x + size * 0.5} cy={y + size * 0.44} r={size * 0.015} fill="#2a2a2a" />
      {/* Items on desk */}
      {/* Inkwell */}
      <circle cx={x + size * 0.25} cy={y + size * 0.33} r={size * 0.025} fill="#1a1a1a" stroke="#000000" strokeWidth="0.5" />
      {/* Quill */}
      <line x1={x + size * 0.27} y1={y + size * 0.33} x2={x + size * 0.35} y2={y + size * 0.25} stroke="#f5f5dc" strokeWidth="1" />
      {/* Paper/scroll */}
      <rect x={x + size * 0.45} y={y + size * 0.28} width={size * 0.2} height={size * 0.07} fill="#f4e4c1" stroke="#d4b896" strokeWidth="0.5" />
      {/* Book */}
      <rect x={x + size * 0.68} y={y + size * 0.3} width={size * 0.1} height={size * 0.05} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
    </g>
  );
};