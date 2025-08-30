import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface FountainSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  seed?: number;
}

export const FountainSymbol: React.FC<FountainSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'Europe',
  era = HistoricalEra.MEDIEVAL,
  seed = 0 
}) => {
  // Determine fountain style based on culture and era
  const getFountainStyle = () => {
    const zone = typeof culturalZone === 'string' ? culturalZone.toLowerCase() : culturalZone;
    
    if (zone.includes('mena') || zone.includes('middle_east')) {
      // Islamic fountain - geometric, with water channels
      return 'islamic';
    } else if (zone.includes('asia')) {
      // Asian fountain - natural, zen-like
      return 'asian';
    } else if (era >= HistoricalEra.RENAISSANCE) {
      // European baroque fountain - ornate
      return 'baroque';
    } else {
      // Simple medieval well/fountain
      return 'medieval';
    }
  };
  
  const style = getFountainStyle();
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  
  switch(style) {
    case 'islamic':
      return (
        <g>
          {/* Islamic geometric fountain with star pattern */}
          <rect
            x={x + size * 0.1}
            y={y + size * 0.1}
            width={size * 0.8}
            height={size * 0.8}
            fill="#e8dcc6"
            stroke="#8b7566"
            strokeWidth="1"
          />
          {/* Star pattern basin */}
          <polygon
            points={`
              ${centerX},${y + size * 0.25}
              ${x + size * 0.35},${y + size * 0.35}
              ${x + size * 0.25},${centerY}
              ${x + size * 0.35},${y + size * 0.65}
              ${centerX},${y + size * 0.75}
              ${x + size * 0.65},${y + size * 0.65}
              ${x + size * 0.75},${centerY}
              ${x + size * 0.65},${y + size * 0.35}
            `}
            fill="#4a9eca"
            stroke="#2c5f7c"
            strokeWidth="1"
          />
          {/* Central jet */}
          <circle cx={centerX} cy={centerY} r={size * 0.05} fill="#87ceeb" />
          <line 
            x1={centerX} 
            y1={centerY - size * 0.05}
            x2={centerX}
            y2={centerY - size * 0.15}
            stroke="#87ceeb"
            strokeWidth="2"
            opacity="0.7"
          />
        </g>
      );
      
    case 'asian':
      return (
        <g>
          {/* Natural stone basin */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={size * 0.35}
            ry={size * 0.3}
            fill="#8b8680"
            stroke="#5a5651"
            strokeWidth="1"
          />
          {/* Water */}
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={size * 0.3}
            ry={size * 0.25}
            fill="#6b9bd1"
            opacity="0.8"
          />
          {/* Bamboo spout */}
          <rect
            x={x + size * 0.15}
            y={centerY - size * 0.02}
            width={size * 0.25}
            height={size * 0.04}
            fill="#c4b5a0"
            stroke="#8b7355"
            strokeWidth="0.5"
            transform={`rotate(-15 ${x + size * 0.15} ${centerY})`}
          />
          {/* Water drops */}
          <circle cx={x + size * 0.35} cy={centerY + size * 0.05} r={size * 0.015} fill="#87ceeb" opacity="0.6" />
          <circle cx={x + size * 0.37} cy={centerY + size * 0.08} r={size * 0.01} fill="#87ceeb" opacity="0.5" />
        </g>
      );
      
    case 'baroque':
      return (
        <g>
          {/* Ornate circular basin */}
          <circle
            cx={centerX}
            cy={centerY}
            r={size * 0.4}
            fill="#d4d4d8"
            stroke="#71717a"
            strokeWidth="2"
          />
          {/* Inner basin */}
          <circle
            cx={centerX}
            cy={centerY}
            r={size * 0.35}
            fill="#4a9eca"
            stroke="#2563eb"
            strokeWidth="1"
          />
          {/* Central pedestal */}
          <rect
            x={centerX - size * 0.08}
            y={centerY - size * 0.1}
            width={size * 0.16}
            height={size * 0.2}
            fill="#e5e5e5"
            stroke="#a3a3a3"
            strokeWidth="1"
          />
          {/* Top tier */}
          <ellipse
            cx={centerX}
            cy={centerY - size * 0.08}
            rx={size * 0.12}
            ry={size * 0.04}
            fill="#d4d4d8"
            stroke="#71717a"
            strokeWidth="1"
          />
          {/* Water jets */}
          <line x1={centerX} y1={centerY - size * 0.1} x2={centerX} y2={centerY - size * 0.25} stroke="#87ceeb" strokeWidth="2" opacity="0.6" />
          <line x1={centerX - size * 0.05} y1={centerY - size * 0.08} x2={centerX - size * 0.1} y2={centerY - size * 0.15} stroke="#87ceeb" strokeWidth="1.5" opacity="0.5" />
          <line x1={centerX + size * 0.05} y1={centerY - size * 0.08} x2={centerX + size * 0.1} y2={centerY - size * 0.15} stroke="#87ceeb" strokeWidth="1.5" opacity="0.5" />
        </g>
      );
      
    default: // medieval
      return (
        <g>
          {/* Simple stone well/fountain */}
          <circle
            cx={centerX}
            cy={centerY}
            r={size * 0.35}
            fill="#8b8680"
            stroke="#5a5651"
            strokeWidth="2"
          />
          {/* Water */}
          <circle
            cx={centerX}
            cy={centerY}
            r={size * 0.28}
            fill="#4a9eca"
            opacity="0.8"
          />
          {/* Center post */}
          <rect
            x={centerX - size * 0.03}
            y={centerY - size * 0.15}
            width={size * 0.06}
            height={size * 0.3}
            fill="#71717a"
            stroke="#404040"
            strokeWidth="1"
          />
          {/* Simple water spout */}
          <circle cx={centerX} cy={centerY - size * 0.12} r={size * 0.025} fill="#404040" />
          <line x1={centerX} y1={centerY - size * 0.1} x2={centerX} y2={centerY} stroke="#87ceeb" strokeWidth="1.5" opacity="0.6" />
        </g>
      );
  }
};