/**
 * DeskSymbol.tsx
 * SNES RPG-style desk with cultural and historical variations
 * Pixel-perfect 16x16 base for authentic retro aesthetic
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface DeskSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra | number;
  rotation?: number; // 0 = facing south, 90 = east, 180 = north, 270 = west
  variant?: 'writing' | 'office' | 'scribal' | 'standing';
  seed?: number;
}

const DeskSymbol: React.FC<DeskSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 16, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  rotation = 0,
  variant = 'writing',
  seed = 0
}) => {
  // SNES style pixel size
  const pixelSize = size / 16;
  
  // Determine desk style based on culture and era
  const getDeskStyle = () => {
    const numericEra = typeof era === 'number' ? era : {
      'ANTIQUITY': -500,
      'MEDIEVAL': 1200,
      'RENAISSANCE_EARLY_MODERN': 1500,
      'INDUSTRIAL_ERA': 1850,
      'MODERN_ERA': 1950,
      'FUTURE_ERA': 2050
    }[era] || 1500;
    
    switch (culturalZone) {
      case 'EUROPEAN':
        if (numericEra < 500) {
          return {
            baseColor: '#8B6F47',
            darkColor: '#6B5637',
            lightColor: '#AB8F67',
            paperColor: '#F5E6D3',
            inkColor: '#1A1A1A',
            hasDrawers: false,
            hasInkwell: true,
            style: 'scribal'
          };
        } else if (numericEra < 1500) {
          return {
            baseColor: '#654321',
            darkColor: '#4A3626',
            lightColor: '#8B6F47',
            paperColor: '#FAF8F3',
            inkColor: '#000000',
            hasDrawers: false,
            hasInkwell: true,
            hasSlant: true,
            style: 'medieval'
          };
        } else if (numericEra < 1900) {
          return {
            baseColor: '#8B4513',
            darkColor: '#654321',
            lightColor: '#A0522D',
            paperColor: '#FFFAF0',
            inkColor: '#000000',
            hasDrawers: true,
            hasInkwell: true,
            style: 'bureau'
          };
        } else {
          return {
            baseColor: '#696969',
            darkColor: '#4A4A4A',
            lightColor: '#A9A9A9',
            paperColor: '#FFFFFF',
            inkColor: '#000000',
            hasDrawers: true,
            hasComputer: numericEra > 1980,
            style: 'modern'
          };
        }

      case 'EAST_ASIAN':
        return {
          baseColor: '#3A2418',
          darkColor: '#2A1408',
          lightColor: '#4A3428',
          paperColor: '#F4F0E8',
          inkColor: '#1A1A1A',
          hasDrawers: numericEra > 1500,
          hasInkStone: true,
          hasBrushes: true,
          style: 'asian'
        };

      case 'MENA':
        return {
          baseColor: '#5C3A24',
          darkColor: '#4C2A14',
          lightColor: '#7A4E32',
          paperColor: '#F8F4E0',
          inkColor: '#0A0A0A',
          hasDrawers: false,
          hasInkwell: true,
          hasScroll: true,
          style: 'middle-eastern'
        };

      case 'SOUTH_ASIAN':
        return {
          baseColor: '#4A3020',
          darkColor: '#3A2010',
          lightColor: '#5A4030',
          paperColor: '#FFF8DC',
          inkColor: '#1A0A00',
          hasDrawers: numericEra > 1800,
          hasInkwell: true,
          isLow: numericEra < 1900,
          style: 'south-asian'
        };

      case 'SUB_SAHARAN_AFRICAN':
        return {
          baseColor: '#3E2818',
          darkColor: '#2E1808',
          lightColor: '#4E3828',
          paperColor: '#F5DEB3',
          inkColor: '#000000',
          hasDrawers: numericEra > 1900,
          hasCarving: true,
          style: 'african'
        };

      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        return {
          baseColor: '#654321',
          darkColor: '#554311',
          lightColor: '#754531',
          paperColor: '#E8DCC0',
          inkColor: '#2A1A0A',
          hasDrawers: false,
          hasStone: numericEra < 1500,
          style: 'pre-columbian'
        };

      case 'OCEANIA':
        return {
          baseColor: '#4A3525',
          darkColor: '#3A2515',
          lightColor: '#5A4535',
          paperColor: '#F0E68C',
          inkColor: '#1A1A1A',
          hasDrawers: false,
          isWoven: true,
          style: 'oceanic'
        };

      default:
        return {
          baseColor: '#8B4513',
          darkColor: '#654321',
          lightColor: '#A0522D',
          paperColor: '#FAF8F3',
          inkColor: '#000000',
          hasDrawers: false,
          hasInkwell: true,
          style: 'simple'
        };
    }
  };

  const style = getDeskStyle();
  
  // Apply rotation transform
  const rotationTransform = rotation !== 0 ? `rotate(${rotation} ${size/2} ${size/2})` : undefined;

  // SNES pixel art rendering
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g transform={rotationTransform}>
        {/* Shadow */}
        <rect 
          x={pixelSize * 2} 
          y={pixelSize * 12} 
          width={pixelSize * 12} 
          height={pixelSize * 3} 
          fill="#000000" 
          opacity={0.3}
        />
        
        {/* Desk legs - back */}
        <rect x={pixelSize * 3} y={pixelSize * 10} width={pixelSize * 2} height={pixelSize * 4} fill={style.darkColor} />
        <rect x={pixelSize * 11} y={pixelSize * 10} width={pixelSize * 2} height={pixelSize * 4} fill={style.darkColor} />
        
        {/* Main desk surface */}
        <rect 
          x={pixelSize * 2} 
          y={style.hasSlant ? pixelSize * 6 : pixelSize * 7} 
          width={pixelSize * 12} 
          height={pixelSize * 4} 
          fill={style.baseColor}
        />
        
        {/* Top surface highlight */}
        <rect 
          x={pixelSize * 2} 
          y={style.hasSlant ? pixelSize * 6 : pixelSize * 7} 
          width={pixelSize * 12} 
          height={pixelSize} 
          fill={style.lightColor}
        />
        
        {/* Edge shadow for depth */}
        <rect 
          x={pixelSize * 2} 
          y={pixelSize * 10} 
          width={pixelSize * 12} 
          height={pixelSize * 0.5} 
          fill={style.darkColor}
        />
        
        {/* Slanted writing surface (medieval style) */}
        {style.hasSlant && (
          <polygon 
            points={`${pixelSize * 3},${pixelSize * 7} ${pixelSize * 13},${pixelSize * 7} ${pixelSize * 13},${pixelSize * 9} ${pixelSize * 3},${pixelSize * 9.5}`}
            fill={style.lightColor}
            opacity={0.3}
          />
        )}
        
        {/* Drawers (if has drawers) */}
        {style.hasDrawers && (
          <>
            {/* Left drawer */}
            <rect x={pixelSize * 3} y={pixelSize * 10.5} width={pixelSize * 4} height={pixelSize * 2} fill={style.darkColor} />
            <rect x={pixelSize * 3.5} y={pixelSize * 11} width={pixelSize * 3} height={pixelSize} fill={style.baseColor} />
            <rect x={pixelSize * 4.5} y={pixelSize * 11.3} width={pixelSize} height={pixelSize * 0.4} fill="#B8860B" />
            
            {/* Right drawer */}
            <rect x={pixelSize * 9} y={pixelSize * 10.5} width={pixelSize * 4} height={pixelSize * 2} fill={style.darkColor} />
            <rect x={pixelSize * 9.5} y={pixelSize * 11} width={pixelSize * 3} height={pixelSize} fill={style.baseColor} />
            <rect x={pixelSize * 10.5} y={pixelSize * 11.3} width={pixelSize} height={pixelSize * 0.4} fill="#B8860B" />
          </>
        )}
        
        {/* Paper/document on desk */}
        <rect 
          x={pixelSize * 6} 
          y={pixelSize * 8} 
          width={pixelSize * 4} 
          height={pixelSize * 2} 
          fill={style.paperColor}
        />
        
        {/* Writing lines on paper */}
        <rect x={pixelSize * 6.5} y={pixelSize * 8.5} width={pixelSize * 3} height={pixelSize * 0.2} fill={style.inkColor} opacity={0.3} />
        <rect x={pixelSize * 6.5} y={pixelSize * 9} width={pixelSize * 3} height={pixelSize * 0.2} fill={style.inkColor} opacity={0.3} />
        <rect x={pixelSize * 6.5} y={pixelSize * 9.5} width={pixelSize * 2} height={pixelSize * 0.2} fill={style.inkColor} opacity={0.3} />
        
        {/* Inkwell (if has inkwell) */}
        {style.hasInkwell && (
          <>
            <rect x={pixelSize * 11} y={pixelSize * 7.5} width={pixelSize * 2} height={pixelSize * 2} fill="#2A2A2A" />
            <rect x={pixelSize * 11.5} y={pixelSize * 8} width={pixelSize} height={pixelSize} fill={style.inkColor} />
          </>
        )}
        
        {/* Ink stone (Asian style) */}
        {style.hasInkStone && (
          <>
            <rect x={pixelSize * 11} y={pixelSize * 7.5} width={pixelSize * 2.5} height={pixelSize * 1.5} fill="#1A1A1A" />
            <rect x={pixelSize * 11.5} y={pixelSize * 8} width={pixelSize * 1.5} height={pixelSize * 0.5} fill="#0A0A0A" />
          </>
        )}
        
        {/* Brushes (Asian style) */}
        {style.hasBrushes && (
          <>
            <rect x={pixelSize * 4} y={pixelSize * 7.5} width={pixelSize * 0.3} height={pixelSize * 2} fill={style.baseColor} />
            <rect x={pixelSize * 4} y={pixelSize * 7.5} width={pixelSize * 0.3} height={pixelSize * 0.5} fill={style.inkColor} />
          </>
        )}
        
        {/* Quill pen (Western style) */}
        {style.hasInkwell && !style.hasBrushes && (
          <line 
            x1={pixelSize * 4} 
            y1={pixelSize * 9} 
            x2={pixelSize * 5.5} 
            y2={pixelSize * 7.5} 
            stroke="#F0F0F0" 
            strokeWidth={pixelSize * 0.3}
          />
        )}
        
        {/* Computer monitor (modern style) */}
        {style.hasComputer && (
          <>
            {/* Monitor base */}
            <rect x={pixelSize * 7} y={pixelSize * 6.5} width={pixelSize * 2} height={pixelSize * 0.5} fill="#4A4A4A" />
            {/* Monitor screen */}
            <rect x={pixelSize * 5} y={pixelSize * 4} width={pixelSize * 6} height={pixelSize * 3} fill="#2A2A2A" />
            <rect x={pixelSize * 5.5} y={pixelSize * 4.5} width={pixelSize * 5} height={pixelSize * 2} fill="#1A4A6A" />
            {/* Keyboard */}
            <rect x={pixelSize * 5} y={pixelSize * 8.5} width={pixelSize * 6} height={pixelSize} fill="#3A3A3A" />
          </>
        )}
        
        {/* Scroll (Middle Eastern style) */}
        {style.hasScroll && (
          <>
            <ellipse cx={pixelSize * 4} cy={pixelSize * 8} rx={pixelSize * 0.8} ry={pixelSize * 0.5} fill={style.paperColor} />
            <rect x={pixelSize * 4} y={pixelSize * 7.5} width={pixelSize * 3} height={pixelSize} fill={style.paperColor} />
            <ellipse cx={pixelSize * 7} cy={pixelSize * 8} rx={pixelSize * 0.8} ry={pixelSize * 0.5} fill={style.paperColor} />
          </>
        )}
        
        {/* Carving details (African style) */}
        {style.hasCarving && (
          <>
            <rect x={pixelSize * 5} y={pixelSize * 9} width={pixelSize * 0.5} height={pixelSize * 0.5} fill={style.darkColor} opacity={0.5} />
            <rect x={pixelSize * 7} y={pixelSize * 9} width={pixelSize * 0.5} height={pixelSize * 0.5} fill={style.darkColor} opacity={0.5} />
            <rect x={pixelSize * 9} y={pixelSize * 9} width={pixelSize * 0.5} height={pixelSize * 0.5} fill={style.darkColor} opacity={0.5} />
          </>
        )}
      </g>
    </g>
  );
};

export default DeskSymbol;