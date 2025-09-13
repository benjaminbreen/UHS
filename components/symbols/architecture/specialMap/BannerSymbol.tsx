/**
 * BannerSymbol.tsx
 * Culturally-specific hanging banners for throne rooms and halls
 */

import React from 'react';
import { CulturalZone } from '../../../../types';

interface BannerSymbolProps {
  x?: number;
  y?: number;
  size?: number;
  culturalZone: CulturalZone | string;
  era: number;
  seed?: number;
}

export const BannerSymbol: React.FC<BannerSymbolProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  culturalZone,
  era,
  seed = 0
}) => {
  // Get banner style based on culture
  const getBannerStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        if (era < 500) {
          // Roman standards
          return {
            mainColor: '#8B0000',    // Deep red
            accentColor: '#FFD700',  // Gold
            symbol: 'eagle',
            shape: 'rectangular'
          };
        } else if (era < 1500) {
          // Medieval heraldic
          return {
            mainColor: '#4169E1',    // Royal blue
            accentColor: '#FFD700',  // Gold
            symbol: 'lion',
            shape: 'shield'
          };
        } else {
          // Renaissance/Modern
          return {
            mainColor: '#800080',    // Purple
            accentColor: '#C0C0C0',  // Silver
            symbol: 'crown',
            shape: 'rectangular'
          };
        }
        
      case 'EAST_ASIAN':
        return {
          mainColor: '#DC143C',      // Crimson
          accentColor: '#FFD700',    // Gold
          symbol: 'dragon',
          shape: 'vertical'
        };
        
      case 'MENA':
        return {
          mainColor: '#006400',      // Dark green
          accentColor: '#FFD700',    // Gold
          symbol: 'crescent',
          shape: 'triangular'
        };
        
      case 'SUB_SAHARAN_AFRICAN':
        return {
          mainColor: '#8B4513',      // Saddle brown
          accentColor: '#FF8C00',    // Dark orange
          symbol: 'geometric',
          shape: 'rectangular'
        };
        
      case 'SOUTH_ASIAN':
        return {
          mainColor: '#FF4500',      // Orange red
          accentColor: '#FFD700',    // Gold
          symbol: 'wheel',
          shape: 'rectangular'
        };
        
      case 'AMERICAS':
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
        return {
          mainColor: '#B22222',      // Firebrick
          accentColor: '#F0E68C',    // Khaki
          symbol: 'bird',
          shape: 'rectangular'
        };
        
      case 'OCEANIA':
      case 'OCEANIC':
        return {
          mainColor: '#8B4513',      // Brown
          accentColor: '#F4A460',    // Sandy brown
          symbol: 'wave',
          shape: 'rectangular'
        };
        
      default:
        return {
          mainColor: '#800000',      // Maroon
          accentColor: '#C0C0C0',    // Silver
          symbol: 'star',
          shape: 'rectangular'
        };
    }
  };
  
  const style = getBannerStyle();
  const bannerWidth = size * 0.8;
  const bannerHeight = size * 0.9;
  const poleWidth = size * 0.05;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Mounting pole */}
      <rect
        x={size * 0.1}
        y={0}
        width={bannerWidth}
        height={poleWidth}
        fill="#654321"
      />
      
      {/* Pole end caps */}
      <circle cx={size * 0.08} cy={poleWidth / 2} r={poleWidth * 0.8} fill="#8B7355" />
      <circle cx={size * 0.92} cy={poleWidth / 2} r={poleWidth * 0.8} fill="#8B7355" />
      
      {/* Main banner fabric */}
      {style.shape === 'shield' ? (
        // Shield shape for medieval European
        <path
          d={`M ${size * 0.1} ${poleWidth}
              L ${size * 0.9} ${poleWidth}
              L ${size * 0.9} ${bannerHeight * 0.7}
              L ${size * 0.5} ${bannerHeight}
              L ${size * 0.1} ${bannerHeight * 0.7}
              Z`}
          fill={style.mainColor}
        />
      ) : style.shape === 'triangular' ? (
        // Triangular pennant
        <path
          d={`M ${size * 0.1} ${poleWidth}
              L ${size * 0.9} ${poleWidth}
              L ${size * 0.5} ${bannerHeight}
              Z`}
          fill={style.mainColor}
        />
      ) : style.shape === 'vertical' ? (
        // Vertical scroll for East Asian
        <rect
          x={size * 0.35}
          y={poleWidth}
          width={size * 0.3}
          height={bannerHeight}
          fill={style.mainColor}
        />
      ) : (
        // Standard rectangular
        <rect
          x={size * 0.1}
          y={poleWidth}
          width={bannerWidth}
          height={bannerHeight * 0.8}
          fill={style.mainColor}
        />
      )}
      
      {/* Border/trim */}
      {style.shape === 'rectangular' && (
        <rect
          x={size * 0.15}
          y={poleWidth + size * 0.05}
          width={bannerWidth - size * 0.1}
          height={bannerHeight * 0.7}
          fill="none"
          stroke={style.accentColor}
          strokeWidth={2}
        />
      )}
      
      {/* Central symbol/emblem */}
      <g transform={`translate(${size * 0.5}, ${poleWidth + bannerHeight * 0.4})`}>
        {style.symbol === 'lion' && (
          // Simplified lion rampant
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={style.accentColor}
            fontSize={size * 0.3}
            fontWeight="bold"
          >
            ♔
          </text>
        )}
        {style.symbol === 'eagle' && (
          // Roman eagle
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={style.accentColor}
            fontSize={size * 0.3}
          >
            ⚜
          </text>
        )}
        {style.symbol === 'dragon' && (
          // Chinese dragon (simplified)
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={style.accentColor}
            fontSize={size * 0.25}
          >
            龍
          </text>
        )}
        {style.symbol === 'crescent' && (
          // Islamic crescent
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={style.accentColor}
            fontSize={size * 0.3}
          >
            ☪
          </text>
        )}
        {style.symbol === 'geometric' && (
          // African geometric pattern
          <>
            <rect x={-size * 0.1} y={-size * 0.1} width={size * 0.2} height={size * 0.2} 
                  fill="none" stroke={style.accentColor} strokeWidth={2} />
            <circle cx={0} cy={0} r={size * 0.05} fill={style.accentColor} />
          </>
        )}
        {style.symbol === 'wheel' && (
          // Dharma wheel for South Asian
          <circle cx={0} cy={0} r={size * 0.12} fill="none" 
                  stroke={style.accentColor} strokeWidth={2} />
        )}
        {style.symbol === 'bird' && (
          // Simplified bird for Americas
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={style.accentColor}
            fontSize={size * 0.25}
          >
            🦅
          </text>
        )}
        {style.symbol === 'wave' && (
          // Wave pattern for Oceania
          <path
            d={`M ${-size * 0.15} 0 Q ${-size * 0.075} ${-size * 0.05} 0 0 T ${size * 0.15} 0`}
            fill="none"
            stroke={style.accentColor}
            strokeWidth={2}
          />
        )}
        {style.symbol === 'star' && (
          // Default star
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={style.accentColor}
            fontSize={size * 0.3}
          >
            ★
          </text>
        )}
        {style.symbol === 'crown' && (
          // Crown for modern European
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={style.accentColor}
            fontSize={size * 0.3}
          >
            👑
          </text>
        )}
      </g>
      
      {/* Tassels/fringe at bottom */}
      {style.shape === 'rectangular' && (
        <>
          {[0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((offset, i) => (
            <line
              key={i}
              x1={size * offset}
              y1={poleWidth + bannerHeight * 0.8}
              x2={size * offset}
              y2={poleWidth + bannerHeight * 0.85}
              stroke={style.accentColor}
              strokeWidth={1}
            />
          ))}
        </>
      )}
      
      {/* Shadow for depth */}
      <rect
        x={size * 0.1}
        y={poleWidth}
        width={bannerWidth}
        height={2}
        fill="#000000"
        opacity={0.2}
      />
    </g>
  );
};

export default BannerSymbol;