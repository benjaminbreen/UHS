/**
 * BrazierSymbol.tsx
 * SNES RPG-style brazier with cultural variations
 * Standing fire bowl for lighting and warmth
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface BrazierSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra | number;
  isLit?: boolean;
  seed?: number;
}

export const BrazierSymbol: React.FC<BrazierSymbolProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  culturalZone,
  era,
  isLit = true,
  seed = 0
}) => {
  const pixelSize = size / 32;
  
  const getBrazierStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        if (era === 'MEDIEVAL' || era === 1200) {
          return {
            bowlColor: '#654321',      // Iron bowl
            standColor: '#4A4A4A',     // Iron stand
            decorColor: '#8B7355',     // Bronze details
            baseColor: '#696969',      // Stone base
            isOrnate: false
          };
        } else if (era === 'RENAISSANCE_EARLY_MODERN' || era === 1500) {
          return {
            bowlColor: '#CD7F32',      // Bronze bowl
            standColor: '#4A4A4A',     // Iron stand
            decorColor: '#DAA520',     // Gold details
            baseColor: '#8B7355',      // Marble base
            isOrnate: true
          };
        } else {
          return {
            bowlColor: '#C0C0C0',      // Steel
            standColor: '#696969',     // Modern metal
            decorColor: '#B8860B',     // Brass trim
            baseColor: '#A9A9A9',      // Concrete base
            isOrnate: false
          };
        }
        
      case 'EAST_ASIAN':
        return {
          bowlColor: '#CD7F32',        // Bronze
          standColor: '#8B4513',       // Lacquered wood
          decorColor: '#DAA520',       // Gold inlay
          baseColor: '#696969',        // Stone
          isOrnate: true,
          hasPattern: true             // Dragon motifs
        };
        
      case 'MENA':
        return {
          bowlColor: '#DAA520',        // Brass
          standColor: '#CD853F',       // Brass stand
          decorColor: '#FFD700',       // Gold
          baseColor: '#8B7355',        // Sandstone
          isOrnate: true,
          hasGeometric: true           // Islamic patterns
        };
        
      case 'SOUTH_ASIAN':
        return {
          bowlColor: '#CD7F32',        // Bronze
          standColor: '#8B4513',       // Carved wood
          decorColor: '#DAA520',       // Gold details
          baseColor: '#696969',        // Carved stone
          isOrnate: true,
          hasCarving: true
        };
        
      default:
        return {
          bowlColor: '#654321',
          standColor: '#4A4A4A',
          decorColor: '#8B7355',
          baseColor: '#696969',
          isOrnate: false
        };
    }
  };

  const style = getBrazierStyle();
  
  // Fire animation frames (simple pixel style)
  const getFireFrame = () => {
    const frame = Math.floor(Date.now() / 200) % 3;
    switch (frame) {
      case 0: return { height: 4, flicker: 0 };
      case 1: return { height: 5, flicker: 1 };
      case 2: return { height: 3, flicker: -1 };
      default: return { height: 4, flicker: 0 };
    }
  };

  const fireFrame = getFireFrame();

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
        {/* Base/platform */}
        <rect 
          x={4 * pixelSize} 
          y={12 * pixelSize} 
          width={8 * pixelSize} 
          height={4 * pixelSize} 
          fill={style.baseColor}
        />
        
        {/* Base shadow */}
        <rect 
          x={4 * pixelSize} 
          y={15 * pixelSize} 
          width={8 * pixelSize} 
          height={pixelSize} 
          fill={style.baseColor}
          opacity={0.5}
        />
        
        {/* Stand/legs */}
        <rect 
          x={5 * pixelSize} 
          y={8 * pixelSize} 
          width={2 * pixelSize} 
          height={4 * pixelSize} 
          fill={style.standColor}
        />
        <rect 
          x={9 * pixelSize} 
          y={8 * pixelSize} 
          width={2 * pixelSize} 
          height={4 * pixelSize} 
          fill={style.standColor}
        />
        
        {/* Ornate European Renaissance details */}
        {style.isOrnate && culturalZone === 'EUROPEAN' && (
          <>
            {/* Decorative bands */}
            <rect x={5 * pixelSize} y={9 * pixelSize} width={2 * pixelSize} height={pixelSize} fill={style.decorColor} opacity={0.8} />
            <rect x={9 * pixelSize} y={9 * pixelSize} width={2 * pixelSize} height={pixelSize} fill={style.decorColor} opacity={0.8} />
          </>
        )}
        
        {/* Bowl */}
        <rect 
          x={4 * pixelSize} 
          y={6 * pixelSize} 
          width={8 * pixelSize} 
          height={4 * pixelSize} 
          fill={style.bowlColor}
        />
        
        {/* Bowl rim (lighter) */}
        <rect 
          x={4 * pixelSize} 
          y={6 * pixelSize} 
          width={8 * pixelSize} 
          height={pixelSize} 
          fill={style.decorColor}
          opacity={0.7}
        />
        
        {/* Bowl interior (darker) */}
        <rect 
          x={5 * pixelSize} 
          y={7 * pixelSize} 
          width={6 * pixelSize} 
          height={2 * pixelSize} 
          fill="#2F2F2F"
        />
        
        {/* Cultural decorations */}
        {style.hasPattern && (
          <>
            {/* Asian dragon motif */}
            <rect x={6 * pixelSize} y={7.5 * pixelSize} width={4 * pixelSize} height={pixelSize} fill={style.decorColor} opacity={0.6} />
            <rect x={7 * pixelSize} y={8.5 * pixelSize} width={2 * pixelSize} height={pixelSize} fill={style.decorColor} opacity={0.6} />
          </>
        )}
        
        {style.hasGeometric && (
          <>
            {/* Islamic geometric pattern */}
            <rect x={6 * pixelSize} y={7.5 * pixelSize} width={pixelSize} height={pixelSize} fill={style.decorColor} opacity={0.5} />
            <rect x={9 * pixelSize} y={7.5 * pixelSize} width={pixelSize} height={pixelSize} fill={style.decorColor} opacity={0.5} />
            <rect x={7.5 * pixelSize} y={8 * pixelSize} width={pixelSize} height={pixelSize} fill={style.decorColor} opacity={0.5} />
          </>
        )}
        
        {style.hasCarving && (
          <>
            {/* South Asian carved details */}
            <rect x={4.5 * pixelSize} y={8 * pixelSize} width={pixelSize} height={pixelSize} fill={style.decorColor} opacity={0.4} />
            <rect x={10.5 * pixelSize} y={8 * pixelSize} width={pixelSize} height={pixelSize} fill={style.decorColor} opacity={0.4} />
          </>
        )}
        
        {/* Fire if lit */}
        {isLit && (
          <g>
            {/* Fire base */}
            <rect 
              x={6 * pixelSize} 
              y={(7 + fireFrame.flicker * 0.2) * pixelSize} 
              width={4 * pixelSize} 
              height={(fireFrame.height - 1) * pixelSize} 
              fill="#FF4500"
              opacity={0.9}
            />
            
            {/* Fire middle */}
            <rect 
              x={7 * pixelSize} 
              y={(5 + fireFrame.flicker * 0.3) * pixelSize} 
              width={2 * pixelSize} 
              height={fireFrame.height * pixelSize} 
              fill="#FF8C00"
              opacity={0.8}
            />
            
            {/* Fire tip */}
            <rect 
              x={7.5 * pixelSize} 
              y={(3 + fireFrame.flicker * 0.5) * pixelSize} 
              width={pixelSize} 
              height={(fireFrame.height - 2) * pixelSize} 
              fill="#FFD700"
              opacity={0.7}
            />
            
            {/* Sparks/embers */}
            <rect 
              x={(6 + Math.sin(Date.now() * 0.01) * 0.5) * pixelSize} 
              y={4 * pixelSize} 
              width={pixelSize * 0.5} 
              height={pixelSize * 0.5} 
              fill="#FFD700"
              opacity={0.6}
            />
            <rect 
              x={(9 + Math.cos(Date.now() * 0.015) * 0.5) * pixelSize} 
              y={3 * pixelSize} 
              width={pixelSize * 0.5} 
              height={pixelSize * 0.5} 
              fill="#FF8C00"
              opacity={0.5}
            />
          </g>
        )}
        
        {/* Unlit coals/ash */}
        {!isLit && (
          <g>
            <rect x={6 * pixelSize} y={8 * pixelSize} width={2 * pixelSize} height={pixelSize} fill="#2F2F2F" />
            <rect x={8 * pixelSize} y={7.5 * pixelSize} width={2 * pixelSize} height={pixelSize} fill="#404040" />
          </g>
        )}
        
        {/* Light glow effect if lit */}
        {isLit && (
          <circle 
            cx={8 * pixelSize} 
            cy={8 * pixelSize} 
            r={12 * pixelSize} 
            fill="#FFD700" 
            opacity={0.1}
          />
        )}
      </g>
    </svg>
  );
};