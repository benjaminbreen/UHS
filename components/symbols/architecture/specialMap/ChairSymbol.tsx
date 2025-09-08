/**
 * ChairSymbol.tsx
 * Beautiful Stardew Valley-style chair with cultural variations
 * Detailed 32x32 base for elegant pixel art aesthetic
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface ChairSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: HistoricalEra | number;
  variant?: 'simple' | 'throne' | 'cushion' | 'bench';
  rotation?: number; // 0 = facing south, 90 = east, 180 = north, 270 = west
  seed?: number;
}

export const ChairSymbol: React.FC<ChairSymbolProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  culturalZone, 
  era, 
  variant = 'simple',
  rotation = 0,
  seed = 0
}) => {
  // Make chairs bigger - scale up from base size
  const scaledSize = size * 1.5; // 50% bigger
  // Stardew/FF6 style pixel size for beautiful detail
  const pixelSize = scaledSize / 32;
  
  const getChairStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        if (era === 'ANTIQUITY' || era === -500) {
          return {
            baseColor: '#A0713A',    // Rich wood
            darkColor: '#7A5530',     // Deep shadow
            lightColor: '#C4955A',    // Highlight
            cushionColor: '#E84A4A',  // Rich red
            hasCushion: true,
            hasBack: true,
            style: 'roman'
          };
        } else if (era === 'MEDIEVAL' || era === 1200) {
          return {
            baseColor: '#7A5C3A',    // Warm oak
            darkColor: '#5A4030',     // Deep wood shadow,
            lightColor: '#8B6F47',
            cushionColor: variant === 'throne' ? '#4B0082' : null,
            hasCushion: variant === 'throne',
            hasBack: true,
            hasArms: variant === 'throne',
            style: 'medieval'
          };
        } else if (era === 'RENAISSANCE_EARLY_MODERN' || era === 1500) {
          return {
            baseColor: '#8B4513',
            darkColor: '#654321',
            lightColor: '#CD853F',
            cushionColor: '#8B0000',
            hasCushion: true,
            hasBack: true,
            hasArms: true,
            style: 'renaissance'
          };
        } else {
          return {
            baseColor: '#696969',
            darkColor: '#4A4A4A',
            lightColor: '#A9A9A9',
            cushionColor: '#4169E1',
            hasCushion: true,
            hasBack: true,
            style: 'modern'
          };
        }

      case 'EAST_ASIAN':
        if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN' || era === 1200 || era === 1500) {
          return {
            baseColor: '#8B4513',
            darkColor: '#654321',
            lightColor: '#D2691E',
            cushionColor: '#DC143C',
            hasCushion: variant === 'cushion',
            hasBack: false,
            isLow: true,
            style: 'asian-low'
          };
        } else {
          return {
            baseColor: '#2F4F4F',
            darkColor: '#1C3636',
            lightColor: '#4A6666',
            cushionColor: '#708090',
            hasCushion: true,
            hasBack: true,
            style: 'modern'
          };
        }

      case 'MENA':
        return {
          baseColor: '#8B4513',
          darkColor: '#654321',
          lightColor: '#CD853F',
          cushionColor: '#8B008B',
          hasCushion: true,
          hasBack: variant === 'bench',
          isLow: era !== 'MODERN_ERA' && era !== 1900,
          style: 'middle-eastern'
        };

      case 'SOUTH_ASIAN':
        return {
          baseColor: '#8B4513',
          darkColor: '#654321',
          lightColor: '#D2691E',
          cushionColor: '#DC143C',
          hasCushion: true,
          hasBack: era === 'MODERN_ERA' || era === 1900,
          isLow: era !== 'MODERN_ERA' && era !== 1900,
          style: 'south-asian'
        };

      case 'SUB_SAHARAN_AFRICAN':
        return {
          baseColor: '#654321',
          darkColor: '#4A3626',
          lightColor: '#8B6F47',
          cushionColor: null,
          hasCushion: false,
          hasBack: era === 'MODERN_ERA' || era === 1900,
          hasCarving: true,
          style: 'african'
        };

      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        return {
          baseColor: variant === 'throne' ? '#696969' : '#DEB887',
          darkColor: variant === 'throne' ? '#4A4A4A' : '#B8956F',
          lightColor: variant === 'throne' ? '#808080' : '#F5DEB3',
          cushionColor: null,
          hasCushion: false,
          hasBack: variant === 'throne',
          style: variant === 'throne' ? 'stone' : 'woven'
        };

      case 'OCEANIA':
        return {
          baseColor: '#D2B48C',
          darkColor: '#B8956F',
          lightColor: '#F5DEB3',
          cushionColor: null,
          hasCushion: false,
          hasBack: false,
          isLow: true,
          style: 'woven'
        };

      default:
        return {
          baseColor: '#8B4513',
          darkColor: '#654321',
          lightColor: '#A0522D',
          cushionColor: null,
          hasCushion: false,
          hasBack: true,
          style: 'simple'
        };
    }
  };

  const style = getChairStyle();

  // Apply rotation transform
  const rotationTransform = rotation !== 0 ? `rotate(${rotation} ${size/2} ${size/2})` : undefined;

  // SNES pixel art style rendering
  if (style.isLow && variant === 'cushion') {
    // Floor cushion (like in Final Fantasy 6)
    return (
      <g transform={`translate(${x}, ${y})`}>
        <g transform={rotationTransform}>
          {/* Shadow */}
          <rect 
            x={pixelSize * 2} 
            y={pixelSize * 11} 
            width={pixelSize * 12} 
            height={pixelSize * 3} 
            fill="#000000" 
            opacity={0.3}
          />
          
          {/* Main cushion body */}
          <rect 
            x={pixelSize * 3} 
            y={pixelSize * 9} 
            width={pixelSize * 10} 
            height={pixelSize * 4} 
            fill={style.cushionColor}
          />
          
          {/* Top highlight */}
          <rect 
            x={pixelSize * 3} 
            y={pixelSize * 9} 
            width={pixelSize * 10} 
            height={pixelSize} 
            fill={style.lightColor}
            opacity={0.5}
          />
          
          {/* Side shading for depth */}
          <rect 
            x={pixelSize * 3} 
            y={pixelSize * 12} 
            width={pixelSize * 10} 
            height={pixelSize} 
            fill={style.darkColor}
            opacity={0.5}
          />
          
          {/* Decorative center pattern */}
          {style.style === 'middle-eastern' && (
            <rect 
              x={pixelSize * 6} 
              y={pixelSize * 10} 
              width={pixelSize * 4} 
              height={pixelSize * 2} 
              fill="#FFD700"
              opacity={0.3}
            />
          )}
        </g>
      </g>
    );
  } else if (style.isLow && !variant) {
    // Low stool (Asian/African style)
    return (
      <g transform={`translate(${x}, ${y})`}>
        <g transform={rotationTransform}>
          {/* Shadow */}
          <rect 
            x={pixelSize * 3} 
            y={pixelSize * 12} 
            width={pixelSize * 10} 
            height={pixelSize * 2} 
            fill="#000000" 
            opacity={0.3}
          />
          
          {/* Seat */}
          <rect 
            x={pixelSize * 4} 
            y={pixelSize * 9} 
            width={pixelSize * 8} 
            height={pixelSize * 3} 
            fill={style.baseColor}
          />
          
          {/* Top surface */}
          <rect 
            x={pixelSize * 4} 
            y={pixelSize * 9} 
            width={pixelSize * 8} 
            height={pixelSize} 
            fill={style.lightColor}
            opacity={0.5}
          />
          
          {/* Legs - pixel style */}
          <rect x={pixelSize * 5} y={pixelSize * 11} width={pixelSize * 2} height={pixelSize * 2} fill={style.darkColor} />
          <rect x={pixelSize * 9} y={pixelSize * 11} width={pixelSize * 2} height={pixelSize * 2} fill={style.darkColor} />
          
          {/* Carving detail for African style */}
          {style.hasCarving && (
            <>
              <rect x={pixelSize * 6} y={pixelSize * 10} width={pixelSize} height={pixelSize} fill={style.darkColor} opacity={0.3} />
              <rect x={pixelSize * 9} y={pixelSize * 10} width={pixelSize} height={pixelSize} fill={style.darkColor} opacity={0.3} />
            </>
          )}
        </g>
      </g>
    );
  } else if (variant === 'throne') {
    // Throne - SNES RPG style (like in Chrono Trigger)
    return (
      <g transform={`translate(${x}, ${y})`}>
        <g transform={rotationTransform}>
          {/* Shadow */}
          <rect 
            x={pixelSize * 2} 
            y={pixelSize * 13} 
            width={pixelSize * 12} 
            height={pixelSize * 2} 
            fill="#000000" 
            opacity={0.3}
          />
          
          {/* High back */}
          <rect 
            x={pixelSize * 4} 
            y={pixelSize * 2} 
            width={pixelSize * 8} 
            height={pixelSize * 9} 
            fill={style.baseColor}
          />
          
          {/* Back highlight */}
          <rect 
            x={pixelSize * 4} 
            y={pixelSize * 2} 
            width={pixelSize * 8} 
            height={pixelSize} 
            fill={style.lightColor}
          />
          
          {/* Crown decoration on top */}
          <rect x={pixelSize * 5} y={pixelSize} width={pixelSize * 2} height={pixelSize * 2} fill="#FFD700" />
          <rect x={pixelSize * 7} y={pixelSize * 1.5} width={pixelSize} height={pixelSize} fill="#FFD700" />
          <rect x={pixelSize * 8} y={pixelSize} width={pixelSize * 2} height={pixelSize * 2} fill="#FFD700" />
          
          {/* Seat */}
          <rect 
            x={pixelSize * 3} 
            y={pixelSize * 10} 
            width={pixelSize * 10} 
            height={pixelSize * 3} 
            fill={style.baseColor}
          />
          
          {/* Arms - pixel blocky style */}
          <rect x={pixelSize * 2} y={pixelSize * 9} width={pixelSize * 2} height={pixelSize * 4} fill={style.baseColor} />
          <rect x={pixelSize * 12} y={pixelSize * 9} width={pixelSize * 2} height={pixelSize * 4} fill={style.baseColor} />
          
          {/* Cushion on seat */}
          {style.hasCushion && (
            <rect 
              x={pixelSize * 4} 
              y={pixelSize * 10} 
              width={pixelSize * 8} 
              height={pixelSize * 2} 
              fill={style.cushionColor}
              opacity={0.8}
            />
          )}
          
          {/* Legs */}
          <rect x={pixelSize * 4} y={pixelSize * 12} width={pixelSize * 2} height={pixelSize * 2} fill={style.darkColor} />
          <rect x={pixelSize * 10} y={pixelSize * 12} width={pixelSize * 2} height={pixelSize * 2} fill={style.darkColor} />
        </g>
      </g>
    );
  } else {
    // Standard chair - SNES pixel art style with improved 3/4 perspective
    return (
      <g transform={`translate(${x}, ${y})`}>
        <g transform={rotationTransform}>
          {/* Shadow - elliptical for realism */}
          <ellipse 
            cx={pixelSize * 8} 
            cy={pixelSize * 14.5} 
            rx={pixelSize * 5} 
            ry={pixelSize * 1.5} 
            fill="#000000" 
            opacity={0.3}
          />
          
          {/* Back legs first (3/4 perspective) */}
          {style.hasBack && (
            <>
              <rect x={pixelSize * 5.5} y={pixelSize * 5} width={pixelSize * 0.8} height={pixelSize * 7} fill={style.darkColor} />
              <rect x={pixelSize * 9.7} y={pixelSize * 5} width={pixelSize * 0.8} height={pixelSize * 7} fill={style.darkColor} />
            </>
          )}
          
          {/* Back panel (if has back) - with 3/4 perspective */}
          {style.hasBack && (
            <>
              {/* Back panel main surface */}
              <polygon 
                points={`${pixelSize * 5.5},${pixelSize * 6} ${pixelSize * 10.5},${pixelSize * 6} ${pixelSize * 11},${pixelSize * 6.5} ${pixelSize * 11},${pixelSize * 9} ${pixelSize * 10.5},${pixelSize * 8.5} ${pixelSize * 5.5},${pixelSize * 8.5}`} 
                fill={style.baseColor}
              />
              
              {/* Back panel right side (3D edge) */}
              <polygon 
                points={`${pixelSize * 10.5},${pixelSize * 6} ${pixelSize * 11},${pixelSize * 6.5} ${pixelSize * 11},${pixelSize * 9} ${pixelSize * 10.5},${pixelSize * 8.5}`} 
                fill={style.darkColor}
                opacity={0.6}
              />
              
              {/* Back panel top edge highlight */}
              <polygon 
                points={`${pixelSize * 5.5},${pixelSize * 6} ${pixelSize * 10.5},${pixelSize * 6} ${pixelSize * 11},${pixelSize * 6.5} ${pixelSize * 6},${pixelSize * 6.5}`} 
                fill={style.lightColor}
                opacity={0.7}
              />
            </>
          )}
          
          {/* Seat - 3/4 perspective with depth */}
          <polygon 
            points={`${pixelSize * 4},${pixelSize * 9.5} ${pixelSize * 12},${pixelSize * 9.5} ${pixelSize * 12.5},${pixelSize * 10} ${pixelSize * 12.5},${pixelSize * 11} ${pixelSize * 4.5},${pixelSize * 11} ${pixelSize * 4},${pixelSize * 10.5}`} 
            fill={style.baseColor}
          />
          
          {/* Seat top surface (3/4 perspective) */}
          <polygon 
            points={`${pixelSize * 4},${pixelSize * 9.5} ${pixelSize * 12},${pixelSize * 9.5} ${pixelSize * 12.5},${pixelSize * 10} ${pixelSize * 4.5},${pixelSize * 10}`} 
            fill={style.lightColor}
            opacity={0.8}
          />
          
          {/* Seat right edge (3D) */}
          <polygon 
            points={`${pixelSize * 12},${pixelSize * 9.5} ${pixelSize * 12.5},${pixelSize * 10} ${pixelSize * 12.5},${pixelSize * 11} ${pixelSize * 12},${pixelSize * 10.5}`} 
            fill={style.darkColor}
            opacity={0.6}
          />
          
          {/* Cushion (if has cushion) - with slight perspective */}
          {style.hasCushion && (
            <>
              <polygon 
                points={`${pixelSize * 5},${pixelSize * 9.8} ${pixelSize * 11},${pixelSize * 9.8} ${pixelSize * 11.3},${pixelSize * 10.2} ${pixelSize * 5.3},${pixelSize * 10.2}`} 
                fill={style.cushionColor}
                opacity={0.9}
              />
              {/* Cushion highlight */}
              <polygon 
                points={`${pixelSize * 5},${pixelSize * 9.8} ${pixelSize * 11},${pixelSize * 9.8} ${pixelSize * 11.3},${pixelSize * 10.2} ${pixelSize * 5.3},${pixelSize * 10.2}`} 
                fill="white"
                opacity={0.2}
              />
            </>
          )}
          
          {/* Arms (if has arms) - with 3/4 perspective */}
          {style.hasArms && (
            <>
              {/* Left arm */}
              <polygon 
                points={`${pixelSize * 3.5},${pixelSize * 8.5} ${pixelSize * 4.5},${pixelSize * 8.5} ${pixelSize * 5},${pixelSize * 9} ${pixelSize * 5},${pixelSize * 11} ${pixelSize * 4.5},${pixelSize * 11.5} ${pixelSize * 3.5},${pixelSize * 11.5}`} 
                fill={style.baseColor}
              />
              {/* Left arm top */}
              <polygon 
                points={`${pixelSize * 3.5},${pixelSize * 8.5} ${pixelSize * 4.5},${pixelSize * 8.5} ${pixelSize * 5},${pixelSize * 9} ${pixelSize * 4},${pixelSize * 9}`} 
                fill={style.lightColor}
                opacity={0.7}
              />
              
              {/* Right arm */}
              <polygon 
                points={`${pixelSize * 11.5},${pixelSize * 8.5} ${pixelSize * 12.5},${pixelSize * 8.5} ${pixelSize * 12.5},${pixelSize * 11.5} ${pixelSize * 12},${pixelSize * 11} ${pixelSize * 12},${pixelSize * 9} ${pixelSize * 11.5},${pixelSize * 8.5}`} 
                fill={style.baseColor}
              />
              {/* Right arm top */}
              <polygon 
                points={`${pixelSize * 11.5},${pixelSize * 8.5} ${pixelSize * 12.5},${pixelSize * 8.5} ${pixelSize * 13},${pixelSize * 9} ${pixelSize * 12},${pixelSize * 9}`} 
                fill={style.lightColor}
                opacity={0.7}
              />
            </>
          )}
          
          {/* Front legs - cleaner, more defined */}
          <rect x={pixelSize * 5} y={pixelSize * 11} width={pixelSize * 1.2} height={pixelSize * 3.5} fill={style.darkColor} />
          <rect x={pixelSize * 9.8} y={pixelSize * 11} width={pixelSize * 1.2} height={pixelSize * 3.5} fill={style.darkColor} />
          
          {/* Front leg highlights */}
          <rect x={pixelSize * 5} y={pixelSize * 11} width={pixelSize * 0.3} height={pixelSize * 3.5} fill={style.baseColor} opacity={0.4} />
          <rect x={pixelSize * 9.8} y={pixelSize * 11} width={pixelSize * 0.3} height={pixelSize * 3.5} fill={style.baseColor} opacity={0.4} />
          
          {/* Front leg bottom shadow */}
          <rect x={pixelSize * 5} y={pixelSize * 14.2} width={pixelSize * 1.2} height={pixelSize * 0.3} fill="black" opacity={0.4} />
          <rect x={pixelSize * 9.8} y={pixelSize * 14.2} width={pixelSize * 1.2} height={pixelSize * 0.3} fill="black" opacity={0.4} />
        </g>
      </g>
    );
  }
};