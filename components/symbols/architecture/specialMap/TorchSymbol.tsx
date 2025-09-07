/**
 * TorchSymbol.tsx - Wall-mounted torches and braziers as overlay objects
 * SNES RPG style with proper pixel art proportions
 * Designed to work as overlay sprites like desk accessories
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface TorchSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra | number;
  type?: 'torch' | 'brazier';
  lit?: boolean;
  variant?: 'wall' | 'standing' | 'sconce';
  seed?: number;
}

export const TorchSymbol: React.FC<TorchSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 16,
  culturalZone = 'EUROPEAN',
  era = 1500,
  type = 'torch',
  lit = true,
  variant = 'wall',
  seed = 0
}) => {
  // SNES style pixel size - consistent with desk and chair
  const pixelSize = size / 16;
  
  // Determine style based on culture and era
  const getStyle = () => {
    const numericEra = typeof era === 'number' ? era : {
      'ANTIQUITY': -500,
      'MEDIEVAL': 1200,
      'RENAISSANCE_EARLY_MODERN': 1500,
      'INDUSTRIAL_ERA': 1850,
      'MODERN_ERA': 1950,
      'FUTURE_ERA': 2050
    }[era] || 1500;
    
    switch (culturalZone) {
      case 'EAST_ASIAN':
        return {
          handleColor: '#2A1A0A',
          metalColor: '#3A3A3A',
          clothColor: '#1A1A1A',
          hasLantern: numericEra > 1000,
          style: 'asian'
        };
      case 'MENA':
        return {
          handleColor: '#5C3A24',
          metalColor: '#4A3F2A',
          clothColor: '#2A1416',
          hasOrnament: true,
          style: 'middle-eastern'
        };
      case 'EUROPEAN':
      default:
        if (numericEra < 500) {
          return {
            handleColor: '#6B4A31',
            metalColor: '#3A3A3A',
            clothColor: '#2A2416',
            style: 'ancient'
          };
        } else if (numericEra < 1500) {
          return {
            handleColor: '#654321',
            metalColor: '#4A3F2A',
            clothColor: '#2A1416',
            hasIronWork: true,
            style: 'medieval'
          };
        } else if (numericEra < 1900) {
          return {
            handleColor: '#8B4513',
            metalColor: '#4A4A4A',
            clothColor: '#1A1A1A',
            hasCandle: numericEra > 1600,
            style: 'early-modern'
          };
        } else {
          return {
            handleColor: '#696969',
            metalColor: '#5A5A5A',
            clothColor: '#1A1A1A',
            hasElectric: numericEra > 1880,
            style: 'modern'
          };
        }
    }
  };
  
  const style = getStyle();
  
  if (type === 'brazier') {
    // Standing brazier - SNES pixel art style
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Shadow beneath brazier */}
        <ellipse
          cx={pixelSize * 8}
          cy={pixelSize * 14.5}
          rx={pixelSize * 4}
          ry={pixelSize * 1.2}
          fill="#000000"
          opacity={0.3}
        />
        
        {/* Tripod legs - pixel style */}
        <rect x={pixelSize * 5.5} y={pixelSize * 11} width={pixelSize * 0.8} height={pixelSize * 3.5} fill={style.metalColor} />
        <rect x={pixelSize * 9.7} y={pixelSize * 11} width={pixelSize * 0.8} height={pixelSize * 3.5} fill={style.metalColor} />
        <rect x={pixelSize * 7.6} y={pixelSize * 11.5} width={pixelSize * 0.8} height={pixelSize * 3} fill={style.metalColor} />
        
        {/* Leg highlights */}
        <rect x={pixelSize * 5.5} y={pixelSize * 11} width={pixelSize * 0.2} height={pixelSize * 3.5} fill="#6A6A6A" opacity={0.5} />
        <rect x={pixelSize * 9.7} y={pixelSize * 11} width={pixelSize * 0.2} height={pixelSize * 3.5} fill="#6A6A6A" opacity={0.5} />
        
        {/* Metal bowl - 3/4 perspective */}
        <ellipse
          cx={pixelSize * 8}
          cy={pixelSize * 8.5}
          rx={pixelSize * 3.2}
          ry={pixelSize * 1.8}
          fill={style.metalColor}
        />
        
        {/* Bowl rim highlight */}
        <ellipse
          cx={pixelSize * 8}
          cy={pixelSize * 8.2}
          rx={pixelSize * 2.8}
          ry={pixelSize * 1.5}
          fill="none"
          stroke="#6A6A6A"
          strokeWidth={pixelSize * 0.2}
        />
        
        {/* Inner bowl */}
        <ellipse
          cx={pixelSize * 8}
          cy={pixelSize * 8.5}
          rx={pixelSize * 2.5}
          ry={pixelSize * 1.2}
          fill="#1A1A1A"
        />
        
        {lit && (
          <>
            {/* Coals/embers */}
            <ellipse
              cx={pixelSize * 8}
              cy={pixelSize * 8.8}
              rx={pixelSize * 2.2}
              ry={pixelSize * 0.8}
              fill="#8B2500"
            />
            
            {/* Hot spots */}
            <circle cx={pixelSize * 7} cy={pixelSize * 8.7} r={pixelSize * 0.3} fill="#FF4500" />
            <circle cx={pixelSize * 8.5} cy={pixelSize * 8.9} r={pixelSize * 0.4} fill="#FF6B35" />
            <circle cx={pixelSize * 9} cy={pixelSize * 8.6} r={pixelSize * 0.2} fill="#FF8C00" />
            
            {/* Fire glow */}
            <ellipse
              cx={pixelSize * 8}
              cy={pixelSize * 6.5}
              rx={pixelSize * 3}
              ry={pixelSize * 2.2}
              fill="#FF4500"
              opacity={0.4}
            />
            
            {/* Main flames - pixel art style */}
            <ellipse
              cx={pixelSize * 7.5}
              cy={pixelSize * 7.2}
              rx={pixelSize * 1.2}
              ry={pixelSize * 2.5}
              fill="#FF6B35"
            />
            <ellipse
              cx={pixelSize * 8.5}
              cy={pixelSize * 7}
              rx={pixelSize * 1}
              ry={pixelSize * 2.8}
              fill="#FFD700"
            />
            
            {/* Flame cores */}
            <ellipse
              cx={pixelSize * 7.8}
              cy={pixelSize * 7.5}
              rx={pixelSize * 0.6}
              ry={pixelSize * 1.8}
              fill="#FFD700"
            />
            <ellipse
              cx={pixelSize * 8.2}
              cy={pixelSize * 7.2}
              rx={pixelSize * 0.4}
              ry={pixelSize * 2}
              fill="#FFFACD"
            />
            
            {/* Flame tips */}
            <circle cx={pixelSize * 7.6} cy={pixelSize * 5.2} r={pixelSize * 0.6} fill="#FFF8DC" />
            <circle cx={pixelSize * 8.4} cy={pixelSize * 4.8} r={pixelSize * 0.4} fill="#FFFACD" />
          </>
        )}
        
        {/* Cultural decorations */}
        {style.hasOrnament && (
          <g opacity={0.7}>
            <circle cx={pixelSize * 6.5} cy={pixelSize * 9} r={pixelSize * 0.3} fill="#D4AF37" />
            <circle cx={pixelSize * 9.5} cy={pixelSize * 9} r={pixelSize * 0.3} fill="#D4AF37" />
          </g>
        )}
      </g>
    );
  } else {
    // Wall-mounted torch - SNES pixel art style
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Shadow on wall/ground */}
        <ellipse
          cx={pixelSize * 8}
          cy={pixelSize * 14}
          rx={pixelSize * 2}
          ry={pixelSize * 0.8}
          fill="#000000"
          opacity={0.2}
        />
        
        {/* Wall mount bracket - pixel style */}
        <rect
          x={pixelSize * 6}
          y={pixelSize * 10}
          width={pixelSize * 4}
          height={pixelSize * 1.2}
          fill={style.metalColor}
        />
        
        {/* Bracket highlight */}
        <rect
          x={pixelSize * 6}
          y={pixelSize * 10}
          width={pixelSize * 4}
          height={pixelSize * 0.3}
          fill="#6A6A6A"
          opacity={0.5}
        />
        
        {/* Torch handle - cleaner pixel art */}
        <rect
          x={pixelSize * 7}
          y={pixelSize * 6}
          width={pixelSize * 2}
          height={pixelSize * 5}
          fill={style.handleColor}
        />
        
        {/* Handle highlight */}
        <rect
          x={pixelSize * 7}
          y={pixelSize * 6}
          width={pixelSize * 0.4}
          height={pixelSize * 5}
          fill={style.handleColor}
          opacity={0.3}
          filter="brightness(1.3)"
        />
        
        {/* Wrapped cloth/pitch head */}
        <ellipse
          cx={pixelSize * 8}
          cy={pixelSize * 6}
          rx={pixelSize * 1.4}
          ry={pixelSize * 1.2}
          fill={style.clothColor}
        />
        
        {/* Cloth binding details */}
        <rect x={pixelSize * 7.2} y={pixelSize * 5.5} width={pixelSize * 1.6} height={pixelSize * 0.2} fill="#3A2A1A" opacity={0.6} />
        <rect x={pixelSize * 7.2} y={pixelSize * 6.3} width={pixelSize * 1.6} height={pixelSize * 0.2} fill="#3A2A1A" opacity={0.6} />
        
        {lit && !style.hasElectric && (
          <>
            {/* Flame glow */}
            <ellipse
              cx={pixelSize * 8}
              cy={pixelSize * 4.5}
              rx={pixelSize * 2.2}
              ry={pixelSize * 1.8}
              fill="#FF6B35"
              opacity={0.3}
            />
            
            {/* Main flame - pixel art style */}
            <ellipse
              cx={pixelSize * 8}
              cy={pixelSize * 4.8}
              rx={pixelSize * 1}
              ry={pixelSize * 2}
              fill="#FF6B35"
            />
            
            {/* Flame core */}
            <ellipse
              cx={pixelSize * 8}
              cy={pixelSize * 5.2}
              rx={pixelSize * 0.6}
              ry={pixelSize * 1.4}
              fill="#FFD700"
            />
            
            {/* Flame tip */}
            <ellipse
              cx={pixelSize * 8}
              cy={pixelSize * 3.8}
              rx={pixelSize * 0.4}
              ry={pixelSize * 1}
              fill="#FFF8DC"
            />
            
            {/* Flickering effects */}
            <circle cx={pixelSize * 7.4} cy={pixelSize * 4.2} r={pixelSize * 0.3} fill="#FFD700" opacity={0.7} />
            <circle cx={pixelSize * 8.6} cy={pixelSize * 4.6} r={pixelSize * 0.2} fill="#FFFACD" opacity={0.8} />
          </>
        )}
        
        {/* Electric light (modern era) */}
        {style.hasElectric && lit && (
          <>
            <ellipse
              cx={pixelSize * 8}
              cy={pixelSize * 4.5}
              rx={pixelSize * 1.5}
              ry={pixelSize * 1.5}
              fill="#FFFFCC"
              opacity={0.6}
            />
            <circle cx={pixelSize * 8} cy={pixelSize * 5} r={pixelSize * 0.8} fill="#FFFACD" />
            <circle cx={pixelSize * 8} cy={pixelSize * 5} r={pixelSize * 0.4} fill="#FFF8DC" />
          </>
        )}
        
        {/* Candle (early modern) */}
        {style.hasCandle && !lit && (
          <>
            <rect x={pixelSize * 7.6} y={pixelSize * 4.5} width={pixelSize * 0.8} height={pixelSize * 2.5} fill="#F5DEB3" />
            <ellipse cx={pixelSize * 8} cy={pixelSize * 4.5} rx={pixelSize * 0.4} ry={pixelSize * 0.2} fill="#F5DEB3" />
            <line x1={pixelSize * 8} y1={pixelSize * 4.3} x2={pixelSize * 8} y2={pixelSize * 3.8} stroke="#2A2A2A" strokeWidth={pixelSize * 0.1} />
          </>
        )}
        
        {/* Iron work decoration (medieval) */}
        {style.hasIronWork && (
          <g opacity={0.6}>
            <rect x={pixelSize * 6.2} y={pixelSize * 10.5} width={pixelSize * 0.3} height={pixelSize * 0.3} fill={style.metalColor} />
            <rect x={pixelSize * 9.5} y={pixelSize * 10.5} width={pixelSize * 0.3} height={pixelSize * 0.3} fill={style.metalColor} />
          </g>
        )}
      </g>
    );
  }
};