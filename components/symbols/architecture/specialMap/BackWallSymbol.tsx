/**
 * BackWallSymbol.tsx
 * SNES RPG-style back wall with 3/4 perspective depth
 * Creates the illusion of room depth like in Final Fantasy 6
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface BackWallSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra | number;
  variant?: 'plain' | 'window' | 'door';
  seed?: number;
}

export const BackWallSymbol: React.FC<BackWallSymbolProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  culturalZone,
  era,
  variant = 'plain',
  seed = 0
}) => {
  // Stardew/FF6 style uses 32x32 for beautiful detail
  const pixelSize = size / 32;
  
  // Get wall colors based on culture and era
  const getWallStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        if (era === 'MEDIEVAL' || era === 1200) {
          return {
            baseColor: '#9A8B7A',     // Warm stone
            darkColor: '#6B5D52',      // Deep shadow
            lightColor: '#C4B5A0',     // Highlighted stone
            accentColor: '#8B7A69',     // Mid tone
            mortarColor: '#7A6B5A'     // Mortar lines
          };
        } else if (era === 'RENAISSANCE_EARLY_MODERN' || era === 1500) {
          return {
            baseColor: '#B5A895',     // Refined plaster
            darkColor: '#8B7A69',      // Elegant shadow
            lightColor: '#D4C8B8',     // Creamy highlight
            accentColor: '#A0855A',     // Rich wood trim
            mortarColor: '#9B8A79'     // Subtle lines
          };
        } else {
          return {
            baseColor: '#E8E8E8',     // Clean modern
            darkColor: '#B8B8B8',      // Soft shadow
            lightColor: '#F8F8F8',     // Bright highlight
            accentColor: '#D0D0D0',     // Subtle accent
            mortarColor: '#C8C8C8'     // Modern lines
          };
        }
      case 'EAST_ASIAN':
        return {
          baseColor: '#E6D4B7',       // Elegant paper
          darkColor: '#A0724A',        // Rich wood
          lightColor: '#F8F0E3',       // Soft paper
          accentColor: '#D4A574',      // Bamboo frame
          mortarColor: '#B8956A'       // Wood joints
        };
      case 'MENA':
        return {
          baseColor: '#F0E0C0',       // Warm sandstone
          darkColor: '#C8A882',        // Desert shadow
          lightColor: '#F8F0E0',       // Sun-bleached stone
          accentColor: '#E6C878',      // Brass accent
          mortarColor: '#D4B896'       // Mortar detail
        };
      default:
        return {
          baseColor: '#B8B8B8',
          darkColor: '#888888',
          lightColor: '#E0E0E0',
          accentColor: '#A8A8A8',
          mortarColor: '#989898'
        };
    }
  };

  const style = getWallStyle();

  return (
    <svg 
      x={x} 
      y={y} 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      <g>
        {/* Main wall face - takes up top 2/3 of tile for perspective */}
        <rect 
          x={0} 
          y={0} 
          width={size} 
          height={size * 0.667} 
          fill={style.baseColor}
        />
        
        {/* Stone block pattern for medieval walls */}
        {(culturalZone === 'EUROPEAN' && (era === 'MEDIEVAL' || era === 1200)) && (
          <g>
            {/* Individual stone blocks */}
            <rect x={0} y={2 * pixelSize} width={16 * pixelSize} height={6 * pixelSize} fill={style.baseColor} stroke={style.mortarColor} strokeWidth={pixelSize * 0.5} />
            <rect x={16 * pixelSize} y={2 * pixelSize} width={16 * pixelSize} height={6 * pixelSize} fill={style.baseColor} stroke={style.mortarColor} strokeWidth={pixelSize * 0.5} />
            <rect x={8 * pixelSize} y={8 * pixelSize} width={16 * pixelSize} height={6 * pixelSize} fill={style.baseColor} stroke={style.mortarColor} strokeWidth={pixelSize * 0.5} />
            <rect x={0} y={14 * pixelSize} width={12 * pixelSize} height={6 * pixelSize} fill={style.baseColor} stroke={style.mortarColor} strokeWidth={pixelSize * 0.5} />
            <rect x={20 * pixelSize} y={14 * pixelSize} width={12 * pixelSize} height={6 * pixelSize} fill={style.baseColor} stroke={style.mortarColor} strokeWidth={pixelSize * 0.5} />
          </g>
        )}
        
        {/* Top edge highlight for depth - thicker for 32x32 */}
        <rect 
          x={0} 
          y={0} 
          width={size} 
          height={2 * pixelSize} 
          fill={style.lightColor}
        />
        
        {/* Bottom shadow where wall meets floor - thicker */}
        <rect 
          x={0} 
          y={size * 0.667 - 2 * pixelSize} 
          width={size} 
          height={2 * pixelSize} 
          fill={style.darkColor}
        />
        
        {/* Side pilaster/column detail for depth - wider for 32x32 */}
        <rect 
          x={0} 
          y={2 * pixelSize} 
          width={3 * pixelSize} 
          height={size * 0.667 - 4 * pixelSize} 
          fill={style.darkColor}
          opacity={0.4}
        />
        <rect 
          x={size - 3 * pixelSize} 
          y={2 * pixelSize} 
          width={3 * pixelSize} 
          height={size * 0.667 - 4 * pixelSize} 
          fill={style.darkColor}
          opacity={0.4}
        />
      
      {/* Window variant */}
      {variant === 'window' && (
        <g>
          {/* Window frame */}
          <rect 
            x={size * 0.25} 
            y={size * 0.15} 
            width={size * 0.5} 
            height={size * 0.35} 
            fill={style.accentColor}
            stroke={style.darkColor}
            strokeWidth={pixelSize * 0.5}
          />
          {/* Window panes - SNES style simple */}
          <rect 
            x={size * 0.3} 
            y={size * 0.2} 
            width={size * 0.18} 
            height={size * 0.12} 
            fill="#87CEEB"
            opacity={0.7}
          />
          <rect 
            x={size * 0.52} 
            y={size * 0.2} 
            width={size * 0.18} 
            height={size * 0.12} 
            fill="#87CEEB"
            opacity={0.7}
          />
          <rect 
            x={size * 0.3} 
            y={size * 0.35} 
            width={size * 0.18} 
            height={size * 0.12} 
            fill="#87CEEB"
            opacity={0.7}
          />
          <rect 
            x={size * 0.52} 
            y={size * 0.35} 
            width={size * 0.18} 
            height={size * 0.12} 
            fill="#87CEEB"
            opacity={0.7}
          />
          {/* Window cross */}
          <rect 
            x={size * 0.48} 
            y={size * 0.15} 
            width={pixelSize * 0.5} 
            height={size * 0.35} 
            fill={style.darkColor}
          />
          <rect 
            x={size * 0.25} 
            y={size * 0.325} 
            width={size * 0.5} 
            height={pixelSize * 0.5} 
            fill={style.darkColor}
          />
        </g>
      )}
      
      {/* Door variant */}
      {variant === 'door' && (
        <g>
          {/* Door frame */}
          <rect 
            x={size * 0.3} 
            y={size * 0.2} 
            width={size * 0.4} 
            height={size * 0.467} 
            fill={style.accentColor}
            stroke={style.darkColor}
            strokeWidth={pixelSize * 0.5}
          />
          {/* Door panels - simple SNES style */}
          <rect 
            x={size * 0.35} 
            y={size * 0.25} 
            width={size * 0.15} 
            height={size * 0.15} 
            fill={style.darkColor}
            opacity={0.3}
          />
          <rect 
            x={size * 0.5} 
            y={size * 0.25} 
            width={size * 0.15} 
            height={size * 0.15} 
            fill={style.darkColor}
            opacity={0.3}
          />
          <rect 
            x={size * 0.35} 
            y={size * 0.42} 
            width={size * 0.15} 
            height={size * 0.2} 
            fill={style.darkColor}
            opacity={0.3}
          />
          <rect 
            x={size * 0.5} 
            y={size * 0.42} 
            width={size * 0.15} 
            height={size * 0.2} 
            fill={style.darkColor}
            opacity={0.3}
          />
          {/* Door handle */}
          <circle 
            cx={size * 0.6} 
            cy={size * 0.45} 
            r={pixelSize * 0.5} 
            fill="#CD7F32"
          />
        </g>
      )}
      
      {/* Subtle texture overlay for all variants */}
      <rect 
        x={0} 
        y={0} 
        width={size} 
        height={size * 0.667} 
        fill="url(#wallTexture)"
        opacity={0.1}
      />
      
      {/* Define texture pattern */}
      <defs>
        <pattern id="wallTexture" x="0" y="0" width={pixelSize * 4} height={pixelSize * 4} patternUnits="userSpaceOnUse">
          <rect x={0} y={0} width={pixelSize} height={pixelSize} fill={style.darkColor} opacity={0.2} />
          <rect x={pixelSize * 2} y={pixelSize * 2} width={pixelSize} height={pixelSize} fill={style.darkColor} opacity={0.2} />
        </pattern>
      </defs>
      </g>
    </svg>
  );
};