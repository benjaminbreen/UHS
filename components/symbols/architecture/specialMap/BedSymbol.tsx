import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface BedSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  seed?: number;
}

export const BedSymbol: React.FC<BedSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'Europe',
  era = HistoricalEra.MEDIEVAL,
  seed = 0 
}) => {
  // Determine bed style based on culture and era
  const getBedStyle = () => {
    const zone = typeof culturalZone === 'string' ? culturalZone.toLowerCase() : culturalZone;
    
    if (zone.includes('asia')) {
      // Asian style - low platform bed or futon
      return 'asian';
    } else if (zone.includes('mena') || zone.includes('middle_east')) {
      // Middle Eastern - cushions and rugs
      return 'middle_eastern';
    } else if (era >= HistoricalEra.MODERN) {
      // Modern bed
      return 'modern';
    } else if (era >= HistoricalEra.RENAISSANCE) {
      // Four-poster bed
      return 'fourposter';
    } else {
      // Simple medieval bed
      return 'medieval';
    }
  };
  
  const style = getBedStyle();
  
  switch(style) {
    case 'asian':
      return (
        <g>
          {/* Tatami mat / low platform */}
          <rect
            x={x + size * 0.15}
            y={y + size * 0.25}
            width={size * 0.7}
            height={size * 0.5}
            fill="#d4c5b0"
            stroke="#8b7355"
            strokeWidth="1"
          />
          {/* Futon/mattress */}
          <rect
            x={x + size * 0.2}
            y={y + size * 0.3}
            width={size * 0.6}
            height={size * 0.4}
            fill="#f5f5dc"
            stroke="#c0b090"
            strokeWidth="0.5"
            rx="2"
          />
          {/* Pillow */}
          <rect
            x={x + size * 0.25}
            y={y + size * 0.32}
            width={size * 0.15}
            height={size * 0.08}
            fill="#e8e8d0"
            stroke="#b0a080"
            strokeWidth="0.5"
            rx="1"
          />
        </g>
      );
      
    case 'middle_eastern':
      return (
        <g>
          {/* Ornate rug base */}
          <rect
            x={x + size * 0.1}
            y={y + size * 0.2}
            width={size * 0.8}
            height={size * 0.6}
            fill="#8b4513"
            stroke="#654321"
            strokeWidth="1"
          />
          {/* Decorative pattern */}
          <rect
            x={x + size * 0.15}
            y={y + size * 0.25}
            width={size * 0.7}
            height={size * 0.5}
            fill="#c19a6b"
            stroke="#8b7355"
            strokeWidth="0.5"
          />
          {/* Cushions */}
          <ellipse cx={x + size * 0.3} cy={y + size * 0.35} rx={size * 0.12} ry={size * 0.08} fill="#d2691e" stroke="#a0522d" strokeWidth="0.5" />
          <ellipse cx={x + size * 0.5} cy={y + size * 0.38} rx={size * 0.15} ry={size * 0.1} fill="#cd853f" stroke="#a0522d" strokeWidth="0.5" />
          <ellipse cx={x + size * 0.7} cy={y + size * 0.35} rx={size * 0.12} ry={size * 0.08} fill="#daa520" stroke="#b8860b" strokeWidth="0.5" />
        </g>
      );
      
    case 'modern':
      return (
        <g>
          {/* Modern bed frame */}
          <rect
            x={x + size * 0.15}
            y={y + size * 0.25}
            width={size * 0.7}
            height={size * 0.5}
            fill="#404040"
            stroke="#202020"
            strokeWidth="1"
          />
          {/* Mattress */}
          <rect
            x={x + size * 0.18}
            y={y + size * 0.28}
            width={size * 0.64}
            height={size * 0.44}
            fill="#f0f0f0"
            stroke="#d0d0d0"
            strokeWidth="0.5"
          />
          {/* Pillows */}
          <rect x={x + size * 0.22} y={y + size * 0.3} width={size * 0.12} height={size * 0.08} fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5" rx="1" />
          <rect x={x + size * 0.36} y={y + size * 0.3} width={size * 0.12} height={size * 0.08} fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5" rx="1" />
          {/* Headboard */}
          <rect
            x={x + size * 0.15}
            y={y + size * 0.18}
            width={size * 0.7}
            height={size * 0.08}
            fill="#505050"
            stroke="#303030"
            strokeWidth="1"
          />
        </g>
      );
      
    case 'fourposter':
      return (
        <g>
          {/* Bed frame */}
          <rect
            x={x + size * 0.2}
            y={y + size * 0.3}
            width={size * 0.6}
            height={size * 0.45}
            fill="#8b4513"
            stroke="#654321"
            strokeWidth="1"
          />
          {/* Mattress and bedding */}
          <rect
            x={x + size * 0.23}
            y={y + size * 0.32}
            width={size * 0.54}
            height={size * 0.4}
            fill="#8b0000"
            stroke="#660000"
            strokeWidth="0.5"
          />
          {/* Posts */}
          <rect x={x + size * 0.18} y={y + size * 0.15} width={size * 0.04} height={size * 0.6} fill="#654321" stroke="#4a3018" strokeWidth="0.5" />
          <rect x={x + size * 0.78} y={y + size * 0.15} width={size * 0.04} height={size * 0.6} fill="#654321" stroke="#4a3018" strokeWidth="0.5" />
          <rect x={x + size * 0.18} y={y + size * 0.73} width={size * 0.04} height={size * 0.12} fill="#654321" stroke="#4a3018" strokeWidth="0.5" />
          <rect x={x + size * 0.78} y={y + size * 0.73} width={size * 0.04} height={size * 0.12} fill="#654321" stroke="#4a3018" strokeWidth="0.5" />
          {/* Canopy */}
          <rect
            x={x + size * 0.15}
            y={y + size * 0.15}
            width={size * 0.7}
            height={size * 0.05}
            fill="#4a0e0e"
            stroke="#2a0606"
            strokeWidth="1"
          />
          {/* Pillows */}
          <ellipse cx={x + size * 0.35} cy={y + size * 0.36} rx={size * 0.08} ry={size * 0.05} fill="#faebd7" stroke="#d2b48c" strokeWidth="0.5" />
          <ellipse cx={x + size * 0.5} cy={y + size * 0.36} rx={size * 0.08} ry={size * 0.05} fill="#faebd7" stroke="#d2b48c" strokeWidth="0.5" />
        </g>
      );
      
    default: // medieval
      return (
        <g>
          {/* Simple wooden frame */}
          <rect
            x={x + size * 0.2}
            y={y + size * 0.25}
            width={size * 0.6}
            height={size * 0.5}
            fill="#8b6914"
            stroke="#654321"
            strokeWidth="1"
          />
          {/* Straw mattress */}
          <rect
            x={x + size * 0.23}
            y={y + size * 0.28}
            width={size * 0.54}
            height={size * 0.44}
            fill="#d2b48c"
            stroke="#a0826d"
            strokeWidth="0.5"
          />
          {/* Simple pillow */}
          <rect
            x={x + size * 0.25}
            y={y + size * 0.3}
            width={size * 0.2}
            height={size * 0.08}
            fill="#f5deb3"
            stroke="#d2b48c"
            strokeWidth="0.5"
            rx="1"
          />
          {/* Blanket */}
          <path
            d={`M ${x + size * 0.25} ${y + size * 0.4} 
                L ${x + size * 0.75} ${y + size * 0.4}
                L ${x + size * 0.77} ${y + size * 0.7}
                L ${x + size * 0.23} ${y + size * 0.7}
                Z`}
            fill="#696969"
            stroke="#4a4a4a"
            strokeWidth="0.5"
            opacity="0.7"
          />
        </g>
      );
  }
};