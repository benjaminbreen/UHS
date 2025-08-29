/**
 * components/symbols/government/specialMap/WallSymbol.tsx
 * Wall symbols for special maps that vary by cultural zone and era
 */

import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface WallSymbolProps {
  culturalZone: CulturalZone;
  era: HistoricalEra;
  variant?: 'standard' | 'thick' | 'decorative';
  isGate?: boolean;
}

export const WallSymbol: React.FC<WallSymbolProps> = ({ 
  culturalZone, 
  era, 
  variant = 'standard',
  isGate = false 
}) => {
  const getWallStyle = () => {
    // Base styles by cultural zone
    switch (culturalZone) {
      case 'EUROPEAN':
        if (era === 'ANTIQUITY') {
          // Roman stone walls
          return {
            fill: '#8B7355',
            pattern: 'marble',
            thickness: variant === 'thick' ? 3 : 2
          };
        } else if (era === 'MEDIEVAL') {
          // Medieval stone walls
          return {
            fill: '#696969',
            pattern: 'stone-blocks',
            thickness: variant === 'thick' ? 4 : 2.5
          };
        } else if (era === 'RENAISSANCE_EARLY_MODERN') {
          // Renaissance brick/stone
          return {
            fill: '#8B4513',
            pattern: 'brick',
            thickness: variant === 'thick' ? 3 : 2
          };
        } else {
          // Modern concrete/steel
          return {
            fill: '#A9A9A9',
            pattern: 'concrete',
            thickness: variant === 'thick' ? 2 : 1.5
          };
        }

      case 'EAST_ASIAN':
        if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
          // Paper screens / wooden walls
          return {
            fill: '#DEB887',
            pattern: 'wood-panels',
            thickness: variant === 'thick' ? 2 : 1
          };
        } else {
          // Modern materials
          return {
            fill: '#C0C0C0',
            pattern: 'modern',
            thickness: 1.5
          };
        }

      case 'MENA':
        if (era === 'ANTIQUITY') {
          // Ancient mud brick
          return {
            fill: '#D2691E',
            pattern: 'mud-brick',
            thickness: variant === 'thick' ? 3.5 : 2.5
          };
        } else if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
          // Islamic geometric patterns
          return {
            fill: '#F5DEB3',
            pattern: 'geometric',
            thickness: variant === 'thick' ? 3 : 2
          };
        } else {
          return {
            fill: '#D3D3D3',
            pattern: 'modern',
            thickness: 2
          };
        }

      case 'SOUTH_ASIAN':
        // Red sandstone / marble
        return {
          fill: era === 'MEDIEVAL' ? '#CD5C5C' : '#FFF8DC',
          pattern: era === 'MEDIEVAL' ? 'sandstone' : 'marble-veined',
          thickness: variant === 'thick' ? 3 : 2
        };

      case 'SUB_SAHARAN_AFRICAN':
        // Mud brick / stone
        return {
          fill: '#8B4513',
          pattern: 'mud-brick',
          thickness: variant === 'thick' ? 3 : 2
        };

      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        // Stone blocks
        return {
          fill: '#808080',
          pattern: 'stone-blocks',
          thickness: variant === 'thick' ? 4 : 3
        };

      default:
        return {
          fill: '#696969',
          pattern: 'stone',
          thickness: 2
        };
    }
  };

  const style = getWallStyle();

  if (isGate) {
    // Gate opening in wall
    return (
      <g className="wall-gate-symbol">
        {/* Wall segments on sides */}
        <rect x={0} y={10} width={15} height={30} fill={style.fill} />
        <rect x={35} y={10} width={15} height={30} fill={style.fill} />
        
        {/* Gate arch */}
        <path
          d="M 15 25 Q 25 15 35 25 L 35 40 L 15 40 Z"
          fill="none"
          stroke={style.fill}
          strokeWidth={2}
        />
        
        {/* Gate details by culture */}
        {culturalZone === 'EAST_ASIAN' && (
          /* Torii-style gate */
          <>
            <rect x={18} y={15} width={2} height={25} fill="#8B4513" />
            <rect x={30} y={15} width={2} height={25} fill="#8B4513" />
            <rect x={15} y={12} width={20} height={3} fill="#DC143C" />
          </>
        )}
        
        {culturalZone === 'MENA' && (
          /* Islamic arch */
          <path
            d="M 20 20 Q 25 10 30 20"
            fill="none"
            stroke={style.fill}
            strokeWidth={1}
          />
        )}
        
        {culturalZone === 'EUROPEAN' && era === 'MEDIEVAL' && (
          /* Portcullis */
          <>
            <line x1={20} y1={20} x2={20} y2={35} stroke="#4B4B4B" strokeWidth={1} />
            <line x1={25} y1={20} x2={25} y2={35} stroke="#4B4B4B" strokeWidth={1} />
            <line x1={30} y1={20} x2={30} y2={35} stroke="#4B4B4B" strokeWidth={1} />
          </>
        )}
      </g>
    );
  }

  // Standard wall segment
  return (
    <g className="wall-symbol">
      <rect 
        x={5} 
        y={5} 
        width={40} 
        height={40} 
        fill={style.fill}
        strokeWidth={0.5}
        stroke="#000000"
        opacity={0.9}
      />
      
      {/* Pattern overlays */}
      {style.pattern === 'stone-blocks' && (
        <>
          <line x1={5} y1={15} x2={45} y2={15} stroke="#555" strokeWidth={0.5} opacity={0.3} />
          <line x1={5} y1={25} x2={45} y2={25} stroke="#555" strokeWidth={0.5} opacity={0.3} />
          <line x1={5} y1={35} x2={45} y2={35} stroke="#555" strokeWidth={0.5} opacity={0.3} />
          <line x1={15} y1={5} x2={15} y2={15} stroke="#555" strokeWidth={0.5} opacity={0.3} />
          <line x1={25} y1={15} x2={25} y2={25} stroke="#555" strokeWidth={0.5} opacity={0.3} />
          <line x1={35} y1={25} x2={35} y2={35} stroke="#555" strokeWidth={0.5} opacity={0.3} />
        </>
      )}
      
      {style.pattern === 'brick' && (
        <>
          {[10, 20, 30, 40].map(y => (
            <line key={y} x1={5} y1={y} x2={45} y2={y} stroke="#7B3F00" strokeWidth={0.3} opacity={0.4} />
          ))}
          {[10, 20, 30, 40].map(x => (
            <line key={x} x1={x} y1={5} x2={x} y2={45} stroke="#7B3F00" strokeWidth={0.3} opacity={0.4} />
          ))}
        </>
      )}
      
      {style.pattern === 'geometric' && (
        <g opacity={0.3}>
          <polygon points="25,10 35,20 25,30 15,20" fill="none" stroke="#8B7D6B" strokeWidth={0.5} />
          <polygon points="25,20 30,25 25,30 20,25" fill="none" stroke="#8B7D6B" strokeWidth={0.5} />
        </g>
      )}
      
      {style.pattern === 'wood-panels' && (
        <>
          <line x1={15} y1={5} x2={15} y2={45} stroke="#8B6914" strokeWidth={0.5} opacity={0.5} />
          <line x1={25} y1={5} x2={25} y2={45} stroke="#8B6914" strokeWidth={0.5} opacity={0.5} />
          <line x1={35} y1={5} x2={35} y2={45} stroke="#8B6914" strokeWidth={0.5} opacity={0.5} />
        </>
      )}
      
      {variant === 'decorative' && (
        /* Additional decorative elements */
        <circle cx={25} cy={25} r={3} fill="none" stroke="#FFD700" strokeWidth={0.5} opacity={0.6} />
      )}
    </g>
  );
};