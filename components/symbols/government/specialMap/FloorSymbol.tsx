/**
 * components/symbols/government/specialMap/FloorSymbol.tsx
 * Floor tile symbols for special maps that vary by cultural zone, era, and material
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface FloorSymbolProps {
  culturalZone: CulturalZone;
  era: HistoricalEra;
  material: 'stone' | 'wood' | 'marble' | 'tile' | 'carpet';
  quality?: 'basic' | 'standard' | 'ornate';
}

export const FloorSymbol: React.FC<FloorSymbolProps> = ({ 
  culturalZone, 
  era, 
  material = 'stone',
  quality = 'standard'
}) => {
  const getFloorStyle = () => {
    const baseStyles = {
      stone: {
        fill: '#8B8682',
        pattern: 'flagstone',
        texture: 'rough'
      },
      wood: {
        fill: '#8B6F47',
        pattern: 'planks',
        texture: 'smooth'
      },
      marble: {
        fill: '#F8F8FF',
        pattern: 'veined',
        texture: 'polished'
      },
      tile: {
        fill: '#D2691E',
        pattern: 'ceramic',
        texture: 'glazed'
      },
      carpet: {
        fill: '#8B0000',
        pattern: 'woven',
        texture: 'soft'
      }
    };

    // Clone the style object to avoid modifying the original
    const style = { ...(baseStyles[material] || baseStyles.stone) };

    // Cultural modifications
    if (culturalZone === 'EAST_ASIAN') {
      if (material === 'wood') {
        style.fill = '#DEB887'; // Bamboo color
        style.pattern = 'bamboo';
      } else if (material === 'tile') {
        style.fill = '#4169E1'; // Blue porcelain
        style.pattern = 'porcelain';
      }
    } else if (culturalZone === 'MENA') {
      if (material === 'tile') {
        style.fill = '#20B2AA'; // Turquoise
        style.pattern = 'geometric-tile';
      } else if (material === 'marble') {
        style.fill = '#FAEBD7'; // Cream marble
        style.pattern = 'islamic-geometric';
      }
    } else if (culturalZone === 'SOUTH_ASIAN') {
      if (material === 'marble') {
        style.fill = '#FFF0F5'; // Pink-white marble
        style.pattern = 'inlay';
      }
    }

    // Era modifications
    if (era === 'ANTIQUITY' && material === 'tile') {
      style.pattern = 'mosaic';
    } else if (era === 'MODERN_ERA' || era === 'FUTURE_ERA') {
      if (material === 'tile') {
        style.fill = '#E6E6FA'; // Modern ceramic
        style.pattern = 'modern-tile';
      }
    }

    // Quality modifications
    if (quality === 'ornate' && style) {
      style.texture = 'decorated';
    } else if (quality === 'basic' && style) {
      style.texture = 'worn';
    }

    // Ensure we always return a valid style
    return style || {
      fill: '#8B8682',
      pattern: 'flagstone',
      texture: 'rough'
    };
  };

  const style = getFloorStyle();

  return (
    <g className="floor-symbol">
      {/* Base floor */}
      <rect 
        x={0} 
        y={0} 
        width={50} 
        height={50} 
        fill={style.fill}
        opacity={0.9}
      />
      
      {/* Pattern overlays based on material and culture */}
      {style.pattern === 'flagstone' && (
        <g opacity={0.3}>
          <polygon points="10,5 25,8 30,20 15,25 5,15" fill="none" stroke="#555" strokeWidth={0.5} />
          <polygon points="25,8 40,5 45,18 30,20" fill="none" stroke="#555" strokeWidth={0.5} />
          <polygon points="15,25 30,20 35,35 20,40 10,30" fill="none" stroke="#555" strokeWidth={0.5} />
          <polygon points="30,20 45,18 48,32 35,35" fill="none" stroke="#555" strokeWidth={0.5} />
          <polygon points="20,40 35,35 40,45 25,48" fill="none" stroke="#555" strokeWidth={0.5} />
        </g>
      )}
      
      {style.pattern === 'planks' && (
        <g opacity={0.4}>
          {[5, 15, 25, 35, 45].map(y => (
            <line key={y} x1={0} y1={y} x2={50} y2={y} stroke="#654321" strokeWidth={0.5} />
          ))}
          {/* Wood grain */}
          <path d="M 10 0 Q 15 25 10 50" stroke="#8B6914" strokeWidth={0.3} fill="none" opacity={0.3} />
          <path d="M 30 0 Q 35 25 30 50" stroke="#8B6914" strokeWidth={0.3} fill="none" opacity={0.3} />
        </g>
      )}
      
      {style.pattern === 'bamboo' && (
        <g opacity={0.4}>
          {[10, 20, 30, 40].map(x => (
            <g key={x}>
              <line x1={x} y1={0} x2={x} y2={50} stroke="#8B7355" strokeWidth={0.5} />
              {/* Bamboo nodes */}
              <circle cx={x} cy={15} r={1} fill="#8B7355" />
              <circle cx={x} cy={35} r={1} fill="#8B7355" />
            </g>
          ))}
        </g>
      )}
      
      {style.pattern === 'veined' && (
        <g opacity={0.2}>
          <path d="M 5 10 Q 25 15 45 8" stroke="#C0C0C0" strokeWidth={0.5} fill="none" />
          <path d="M 10 30 Q 20 25 35 32" stroke="#C0C0C0" strokeWidth={0.5} fill="none" />
          <path d="M 15 45 Q 25 40 40 43" stroke="#C0C0C0" strokeWidth={0.5} fill="none" />
        </g>
      )}
      
      {style.pattern === 'ceramic' && (
        <g>
          {/* Grid pattern */}
          {[10, 20, 30, 40].map(pos => (
            <g key={pos}>
              <line x1={pos} y1={0} x2={pos} y2={50} stroke="#8B7D6B" strokeWidth={0.3} opacity={0.3} />
              <line x1={0} y1={pos} x2={50} y2={pos} stroke="#8B7D6B" strokeWidth={0.3} opacity={0.3} />
            </g>
          ))}
        </g>
      )}
      
      {style.pattern === 'geometric-tile' && (
        <g opacity={0.3}>
          {/* Islamic geometric pattern */}
          <polygon points="25,10 35,20 25,30 15,20" fill="none" stroke="#2F4F4F" strokeWidth={0.5} />
          <polygon points="10,20 20,30 10,40 0,30" fill="none" stroke="#2F4F4F" strokeWidth={0.5} />
          <polygon points="40,20 50,30 40,40 30,30" fill="none" stroke="#2F4F4F" strokeWidth={0.5} />
          <polygon points="25,30 35,40 25,50 15,40" fill="none" stroke="#2F4F4F" strokeWidth={0.5} />
        </g>
      )}
      
      {style.pattern === 'mosaic' && (
        <g opacity={0.4}>
          {/* Small tessellated squares */}
          {[0, 10, 20, 30, 40].map(x => 
            [0, 10, 20, 30, 40].map(y => (
              <rect 
                key={`${x}-${y}`} 
                x={x + 1} 
                y={y + 1} 
                width={8} 
                height={8} 
                fill={(x + y) % 20 === 0 ? '#8B4513' : '#D2691E'}
                stroke="#654321"
                strokeWidth={0.2}
              />
            ))
          )}
        </g>
      )}
      
      {style.pattern === 'porcelain' && (
        <g opacity={0.3}>
          {/* Blue and white pattern */}
          <circle cx={25} cy={25} r={8} fill="none" stroke="#4169E1" strokeWidth={0.5} />
          <path d="M 20 25 Q 25 20 30 25 Q 25 30 20 25" fill="#4169E1" opacity={0.5} />
        </g>
      )}
      
      {style.pattern === 'inlay' && (
        <g opacity={0.4}>
          {/* Pietra dura style inlay */}
          <circle cx={25} cy={25} r={10} fill="none" stroke="#DC143C" strokeWidth={0.5} />
          <polygon 
            points="25,15 30,22 35,22 31,27 33,34 25,30 17,34 19,27 15,22 20,22" 
            fill="#FFD700" 
            opacity={0.6}
          />
        </g>
      )}
      
      {style.pattern === 'woven' && (
        <g opacity={0.3}>
          {/* Carpet weave pattern */}
          {[5, 15, 25, 35, 45].map(pos => (
            <g key={pos}>
              <line x1={0} y1={pos} x2={50} y2={pos} stroke="#8B0000" strokeWidth={0.3} strokeDasharray="2,2" />
              <line x1={pos} y1={0} x2={pos} y2={50} stroke="#8B0000" strokeWidth={0.3} strokeDasharray="2,2" />
            </g>
          ))}
        </g>
      )}
      
      {/* Quality overlays */}
      {quality === 'ornate' && (
        <g opacity={0.2}>
          {/* Gold trim */}
          <rect x={2} y={2} width={46} height={46} fill="none" stroke="#FFD700" strokeWidth={0.5} />
          <rect x={5} y={5} width={40} height={40} fill="none" stroke="#FFD700" strokeWidth={0.3} />
        </g>
      )}
      
      {quality === 'basic' && style.texture === 'worn' && (
        <g opacity={0.3}>
          {/* Wear marks */}
          <ellipse cx={25} cy={25} rx={12} ry={8} fill="#000" opacity={0.1} />
          <path d="M 10 10 L 15 15" stroke="#000" strokeWidth={0.5} opacity={0.2} />
          <path d="M 35 40 L 40 42" stroke="#000" strokeWidth={0.5} opacity={0.2} />
        </g>
      )}
    </g>
  );
};