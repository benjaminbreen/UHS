/**
 * StairsSymbol.tsx
 * Culturally and era-specific stairs symbol for special maps
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface StairsSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra;
  direction: 'up' | 'down';
  seed?: number;
}

export const StairsSymbol: React.FC<StairsSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone,
  era,
  direction = 'up',
  seed = 0
}) => {
  const getStairsStyle = () => {
    if (era < 500) {
      if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { color: '#DEB887', accent: '#8B4513', style: 'stone_blocks' };
      } else if (culturalZone === 'EUROPEAN') {
        return { color: '#A9A9A9', accent: '#696969', style: 'stone' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { color: '#8B4513', accent: '#654321', style: 'wooden' };
      }
      return { color: '#A9A9A9', accent: '#696969', style: 'stone' };
    }
    
    if (era < 1500) {
      if (culturalZone === 'EUROPEAN') {
        return { color: '#808080', accent: '#2F4F4F', style: 'spiral' };
      } else if (culturalZone === 'MENA' || culturalZone === 'NORTH_AFRICAN') {
        return { color: '#DEB887', accent: '#CD853F', style: 'geometric' };
      } else if (culturalZone === 'EAST_ASIAN') {
        return { color: '#A0522D', accent: '#8B4513', style: 'tiered' };
      }
      return { color: '#808080', accent: '#2F4F4F', style: 'stone' };
    }
    
    return { color: '#696969', accent: '#404040', style: 'modern' };
  };

  const style = getStairsStyle();
  const isUp = direction === 'up';
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {style.style === 'spiral' ? (
        // Medieval spiral stairs (top view)
        <>
          <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.4} fill={style.color} stroke={style.accent} strokeWidth="1" />
          <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.15} fill="#2F2F2F" />
          {/* Spiral steps */}
          <path d={`M ${size * 0.5} ${size * 0.35} A ${size * 0.15} ${size * 0.15} 0 0 1 ${size * 0.65} ${size * 0.5}`} 
            fill="none" stroke={style.accent} strokeWidth="2" />
          <path d={`M ${size * 0.65} ${size * 0.5} A ${size * 0.15} ${size * 0.15} 0 0 1 ${size * 0.5} ${size * 0.65}`} 
            fill="none" stroke={style.accent} strokeWidth="2" />
          <path d={`M ${size * 0.5} ${size * 0.65} A ${size * 0.15} ${size * 0.15} 0 0 1 ${size * 0.35} ${size * 0.5}`} 
            fill="none" stroke={style.accent} strokeWidth="2" />
          <path d={`M ${size * 0.35} ${size * 0.5} A ${size * 0.15} ${size * 0.15} 0 0 1 ${size * 0.5} ${size * 0.35}`} 
            fill="none" stroke={style.accent} strokeWidth="2" />
          {/* Direction arrow */}
          {isUp ? (
            <polygon points={`${size * 0.5},${size * 0.42} ${size * 0.46},${size * 0.48} ${size * 0.54},${size * 0.48}`} fill="#FFD700" />
          ) : (
            <polygon points={`${size * 0.5},${size * 0.58} ${size * 0.46},${size * 0.52} ${size * 0.54},${size * 0.52}`} fill="#4169E1" />
          )}
        </>
      ) : style.style === 'geometric' ? (
        // Islamic geometric pattern stairs
        <>
          {/* Base */}
          <rect x={size * 0.2} y={size * 0.2} width={size * 0.6} height={size * 0.6} fill={style.color} stroke={style.accent} strokeWidth="1" />
          {/* Steps with geometric pattern */}
          {[0.25, 0.35, 0.45, 0.55, 0.65].map((y, i) => (
            <g key={i}>
              <rect x={size * 0.25} y={size * y} width={size * 0.5} height={size * 0.08} 
                fill={style.color} stroke={style.accent} strokeWidth="0.5" 
                opacity={isUp ? 1 - i * 0.15 : 0.4 + i * 0.12} />
              {i % 2 === 0 && (
                <polygon 
                  points={`${size * 0.5},${size * (y + 0.02)} ${size * 0.52},${size * (y + 0.04)} ${size * 0.5},${size * (y + 0.06)} ${size * 0.48},${size * (y + 0.04)}`}
                  fill={style.accent} opacity="0.5" />
              )}
            </g>
          ))}
          {/* Direction indicator */}
          <text x={size * 0.5} y={size * 0.9} fontSize={size * 0.15} fill={style.accent} textAnchor="middle">
            {isUp ? '↑' : '↓'}
          </text>
        </>
      ) : style.style === 'wooden' || style.style === 'tiered' ? (
        // East Asian wooden/tiered stairs
        <>
          {/* Side rails */}
          <rect x={size * 0.15} y={size * 0.1} width={size * 0.05} height={size * 0.8} fill={style.accent} />
          <rect x={size * 0.8} y={size * 0.1} width={size * 0.05} height={size * 0.8} fill={style.accent} />
          {/* Steps */}
          {[0.2, 0.32, 0.44, 0.56, 0.68, 0.8].map((y, i) => (
            <g key={i}>
              <rect x={size * 0.2} y={size * y} width={size * 0.6} height={size * 0.1} 
                fill={style.color} stroke={style.accent} strokeWidth="0.5" />
              <rect x={size * 0.2} y={size * y} width={size * 0.6} height={size * 0.02} 
                fill={style.accent} opacity="0.5" />
              {/* Wood grain */}
              <line x1={size * 0.25} y1={size * (y + 0.05)} x2={size * 0.75} y2={size * (y + 0.05)} 
                stroke={style.accent} strokeWidth="0.3" opacity="0.5" />
            </g>
          ))}
          {/* Direction lantern/marker */}
          {isUp ? (
            <circle cx={size * 0.5} cy={size * 0.15} r={size * 0.04} fill="#FFD700" opacity="0.8" />
          ) : (
            <circle cx={size * 0.5} cy={size * 0.85} r={size * 0.04} fill="#4169E1" opacity="0.8" />
          )}
        </>
      ) : (
        // Default stone stairs (side view)
        <>
          {/* Steps in perspective */}
          {[0.8, 0.68, 0.56, 0.44, 0.32, 0.2].map((y, i) => {
            const width = 0.7 - i * 0.05;
            const xOffset = (1 - width) / 2;
            return (
              <g key={i}>
                <rect 
                  x={size * xOffset} 
                  y={size * y} 
                  width={size * width} 
                  height={size * 0.1} 
                  fill={style.color} 
                  stroke={style.accent} 
                  strokeWidth="0.5"
                  opacity={isUp ? 0.4 + i * 0.1 : 1 - i * 0.1}
                />
                {/* Step edge highlight */}
                <rect 
                  x={size * xOffset} 
                  y={size * y} 
                  width={size * width} 
                  height={size * 0.02} 
                  fill={style.accent}
                  opacity="0.3"
                />
              </g>
            );
          })}
          {/* Direction arrow */}
          <g transform={`translate(${size * 0.5}, ${size * 0.5})`}>
            {isUp ? (
              <path d="M -3 3 L 0 -3 L 3 3" stroke="#FFD700" strokeWidth="2" fill="none" />
            ) : (
              <path d="M -3 -3 L 0 3 L 3 -3" stroke="#4169E1" strokeWidth="2" fill="none" />
            )}
          </g>
        </>
      )}
      
      {/* Opening/darkness to indicate depth */}
      <rect 
        x={size * 0.35} 
        y={isUp ? size * 0.1 : size * 0.75} 
        width={size * 0.3} 
        height={size * 0.1} 
        fill="#000000" 
        opacity="0.5"
      />
    </g>
  );
};