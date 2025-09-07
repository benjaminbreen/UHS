/**
 * components/symbols/government/AdminCenterSymbol.tsx - Modern administrative buildings
 * Enhanced with 3D isometric perspective showing front and side
 */
import React from 'react';
import { Tile } from '../../../types';

interface AdminCenterSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'modernist' | 'brutalist' | 'contemporary' | 'communist' | 'glass' | 'postmodern';
}

const AdminCenterSymbol: React.FC<AdminCenterSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'modernist' 
}) => {
  const uniqueId = `admin-${x}-${y}-${seed}`;
  const depth = size * 0.25; // More pronounced depth for modern buildings
  
  // Color variations by modern architectural style
  const getColors = () => {
    switch (variant) {
      case 'brutalist':
        return {
          base: '#696969', // Dim gray (concrete)
          accent: '#2F4F4F', // Dark slate gray
          glass: '#87CEEB', // Sky blue (glass)
          details: '#4682B4' // Steel blue
        };
      case 'contemporary':
        return {
          base: '#F5F5DC', // Beige (light concrete/stone)
          accent: '#4682B4', // Steel blue
          glass: '#E0E0E0', // Light gray (glass)
          details: '#FF6347' // Tomato (accent colors)
        };
      case 'communist':
        return {
          base: '#CD853F', // Peru (stone)
          accent: '#8B0000', // Dark red
          glass: '#696969', // Dim gray
          details: '#FFD700' // Gold (state symbols)
        };
      case 'glass':
        return {
          base: '#4682B4', // Steel blue frame
          accent: '#2F4F4F', // Dark slate gray
          glass: '#B0E0E6', // Powder blue (glass)
          details: '#87CEEB' // Sky blue
        };
      case 'postmodern':
        return {
          base: '#DDA0DD', // Plum
          accent: '#4B0082', // Indigo
          glass: '#E6E6FA', // Lavender
          details: '#9370DB' // Medium purple
        };
      default: // modernist
        return {
          base: '#F0F0F0', // Light gray (clean modern)
          accent: '#2F4F4F', // Dark slate gray
          glass: '#87CEEB', // Sky blue (glass)
          details: '#4169E1' // Royal blue
        };
    }
  };

  const colors = getColors();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`glassGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.glass} stopOpacity="0.9" />
          <stop offset="50%" stopColor={colors.glass} stopOpacity="0.7" />
          <stop offset="100%" stopColor={colors.details} stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={`concreteGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.base} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
          <feOffset dx="2" dy="3" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shadow */}
      <ellipse cx={size * 0.55} cy={size * 0.85} 
               rx={size * 0.45} ry={size * 0.18} 
               fill="rgba(0,0,0,0.35)" />
      
      {/* Main tower building with perspective */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Front face of building */}
        <rect x={size * 0.25} y={size * 0.2} 
              width={size * 0.45} height={size * 0.55} 
              fill={variant === 'glass' ? `url(#glassGrad-${uniqueId})` : `url(#concreteGrad-${uniqueId})`} 
              stroke={colors.accent} strokeWidth="1" />
        
        {/* Right side - showing perspective */}
        <polygon points={`${size * 0.7},${size * 0.2} 
                         ${size * 0.7 + depth * 0.6},${size * 0.2 - depth * 0.3}
                         ${size * 0.7 + depth * 0.6},${size * 0.75 - depth * 0.3}
                         ${size * 0.7},${size * 0.75}`}
                 fill={colors.accent} opacity="0.9" />
        
        {/* Top face - roof/top of building */}
        <polygon points={`${size * 0.25},${size * 0.2} 
                         ${size * 0.25 + depth * 0.6},${size * 0.2 - depth * 0.3}
                         ${size * 0.7 + depth * 0.6},${size * 0.2 - depth * 0.3}
                         ${size * 0.7},${size * 0.2}`}
                 fill={colors.base} opacity="0.8" />
        
        {/* Window grid on front face */}
        {variant !== 'brutalist' && variant !== 'communist' ? (
          // Glass curtain wall effect
          Array.from({ length: 6 }, (_, row) => 
            Array.from({ length: 4 }, (_, col) => (
              <rect key={`window-${row}-${col}`}
                    x={size * 0.28 + col * size * 0.1} 
                    y={size * 0.25 + row * size * 0.07}
                    width={size * 0.08} 
                    height={size * 0.05}
                    fill={colors.glass} 
                    opacity="0.7"
                    stroke={colors.accent} 
                    strokeWidth="0.3" />
            ))
          ).flat()
        ) : (
          // Brutalist small windows
          Array.from({ length: 4 }, (_, row) => 
            Array.from({ length: 3 }, (_, col) => (
              <rect key={`window-${row}-${col}`}
                    x={size * 0.32 + col * size * 0.12} 
                    y={size * 0.3 + row * size * 0.1}
                    width={size * 0.06} 
                    height={size * 0.04}
                    fill={colors.glass} 
                    opacity="0.6" />
            ))
          ).flat()
        )}
        
        {/* Windows on visible side */}
        {Array.from({ length: 5 }, (_, row) => (
          <polygon key={`side-window-${row}`}
                   points={`${size * 0.71},${size * 0.25 + row * size * 0.09} 
                           ${size * 0.7 + depth * 0.55},${size * 0.25 + row * size * 0.09 - depth * 0.27}
                           ${size * 0.7 + depth * 0.55},${size * 0.25 + row * size * 0.09 + size * 0.06 - depth * 0.27}
                           ${size * 0.71},${size * 0.25 + row * size * 0.09 + size * 0.06}`}
                   fill={colors.glass} 
                   opacity="0.5"
                   stroke={colors.accent} 
                   strokeWidth="0.2" />
        ))}
        
        {/* Main entrance */}
        <rect x={size * 0.45} y={size * 0.65} 
              width={size * 0.08} height={size * 0.1} 
              fill="#2a2a2a" />
        
        {/* Entrance canopy with depth */}
        <polygon points={`${size * 0.42},${size * 0.65} 
                         ${size * 0.42 + depth * 0.2},${size * 0.65 - depth * 0.1}
                         ${size * 0.56 + depth * 0.2},${size * 0.65 - depth * 0.1}
                         ${size * 0.56},${size * 0.65}`}
                 fill={colors.base} 
                 opacity="0.7" />
      </g>
      
      {/* Additional architectural elements based on variant */}
      {variant === 'communist' && (
        // Red star on top
        <g transform={`translate(${size * 0.475 + depth * 0.3}, ${size * 0.15 - depth * 0.15})`}>
          <polygon points={`0,-8 2,-2 8,-2 3,2 5,8 0,4 -5,8 -3,2 -8,-2 -2,-2`}
                   fill="#cc3333" stroke="#aa2222" strokeWidth="0.5" />
        </g>
      )}
      
      {variant === 'glass' && (
        // Rooftop antenna/spire
        <g>
          <rect x={size * 0.47 + depth * 0.3} 
                y={size * 0.12 - depth * 0.15} 
                width={size * 0.01} 
                height={size * 0.08} 
                fill={colors.accent} />
          <circle cx={size * 0.475 + depth * 0.3} 
                  cy={size * 0.11 - depth * 0.15} 
                  r={size * 0.015} 
                  fill="#ff0000" opacity="0.6" />
        </g>
      )}
      
      {variant === 'postmodern' && (
        // Decorative geometric shape on top
        <polygon points={`${size * 0.45 + depth * 0.3},${size * 0.18 - depth * 0.15} 
                         ${size * 0.475 + depth * 0.3},${size * 0.14 - depth * 0.15}
                         ${size * 0.5 + depth * 0.3},${size * 0.18 - depth * 0.15}`}
                 fill={colors.details} opacity="0.8" />
      )}
      
      {/* Lower annex building for scale */}
      {(variant === 'modernist' || variant === 'contemporary') && (
        <g>
          <rect x={size * 0.12} y={size * 0.55} 
                width={size * 0.12} height={size * 0.2} 
                fill={colors.base} 
                stroke={colors.accent} 
                strokeWidth="0.5" 
                opacity="0.8" />
          <polygon points={`${size * 0.24},${size * 0.55} 
                           ${size * 0.24 + depth * 0.3},${size * 0.55 - depth * 0.15}
                           ${size * 0.24 + depth * 0.3},${size * 0.75 - depth * 0.15}
                           ${size * 0.24},${size * 0.75}`}
                   fill={colors.accent} 
                   opacity="0.6" />
        </g>
      )}
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(AdminCenterSymbol);