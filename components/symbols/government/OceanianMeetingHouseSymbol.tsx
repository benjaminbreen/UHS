/**
 * components/symbols/government/OceanianMeetingHouseSymbol.tsx - Pacific Islander meeting house
 * Enhanced 3D perspective showing front and prominent side view
 */
import React from 'react';
import { Tile } from '../../../types';

interface OceanianMeetingHouseSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'polynesian' | 'micronesian' | 'melanesian' | 'maori' | 'hawaiian' | 'fijian';
}

const OceanianMeetingHouseSymbol: React.FC<OceanianMeetingHouseSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'polynesian' 
}) => {
  const uniqueId = `oceanian-${x}-${y}-${seed}`;
  const depth = size * 0.35; // Increased depth for better side visibility
  
  // Get variant-specific colors
  const getColors = () => {
    switch (variant) {
      case 'maori':
        return {
          thatch: '#8B7355', // Dark tan
          wood: '#654321', // Dark brown
          platform: '#D2B48C', // Tan
          accent: '#CC3333' // Red for carvings
        };
      case 'hawaiian':
        return {
          thatch: '#DAA520', // Goldenrod
          wood: '#8B4513', // Saddle brown
          platform: '#DEB887', // Burlywood
          accent: '#FF6347' // Tomato
        };
      case 'fijian':
        return {
          thatch: '#BC9A6A', // Camel
          wood: '#704214', // Sepia
          platform: '#CDAA7D', // Buff
          accent: '#8B4513' // Saddle brown
        };
      case 'micronesian':
        return {
          thatch: '#F4A460', // Sandy brown
          wood: '#8B4513', // Saddle brown
          platform: '#FFE4B5', // Moccasin
          accent: '#D2691E' // Chocolate
        };
      case 'melanesian':
        return {
          thatch: '#8B7D6B', // Light taupe
          wood: '#5C4033', // Dark brown
          platform: '#BC9A6A', // Camel
          accent: '#8B0000' // Dark red
        };
      default: // polynesian
        return {
          thatch: '#D2B48C', // Tan
          wood: '#8B4513', // Saddle brown
          platform: '#F4A460', // Sandy brown
          accent: '#A0522D' // Sienna
        };
    }
  };
  
  const colors = getColors();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`thatchGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.thatch} />
          <stop offset="100%" stopColor={colors.wood} />
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
      <ellipse cx={size * 0.55} cy={size * 0.8} 
               rx={size * 0.5} ry={size * 0.2} 
               fill="rgba(0,0,0,0.3)" />
      
      {/* Raised platform showing perspective */}
      <g>
        {/* Platform top */}
        <polygon points={`${size * 0.15},${size * 0.65} 
                         ${size * 0.15 + depth * 0.7},${size * 0.65 - depth * 0.35}
                         ${size * 0.85 + depth * 0.7},${size * 0.65 - depth * 0.35}
                         ${size * 0.85},${size * 0.65}`}
                 fill={colors.platform} stroke={colors.wood} strokeWidth="0.5" />
        
        {/* Platform front edge */}
        <rect x={size * 0.15} y={size * 0.65} 
              width={size * 0.7} height={size * 0.08} 
              fill={colors.wood} opacity="0.8" />
        
        {/* Platform right side */}
        <polygon points={`${size * 0.85},${size * 0.65} 
                         ${size * 0.85 + depth * 0.7},${size * 0.65 - depth * 0.35}
                         ${size * 0.85 + depth * 0.7},${size * 0.73 - depth * 0.35}
                         ${size * 0.85},${size * 0.73}`}
                 fill={colors.wood} opacity="0.7" />
      </g>
      
      {/* Support posts */}
      <rect x={size * 0.2} y={size * 0.65} 
            width={size * 0.04} height={size * 0.15} 
            fill={colors.wood} />
      <rect x={size * 0.76} y={size * 0.65} 
            width={size * 0.04} height={size * 0.15} 
            fill={colors.wood} />
      {/* Back posts visible in perspective */}
      <rect x={size * 0.2 + depth * 0.65} y={size * 0.65 - depth * 0.32} 
            width={size * 0.03} height={size * 0.12} 
            fill={colors.wood} opacity="0.7" />
      <rect x={size * 0.76 + depth * 0.65} y={size * 0.65 - depth * 0.32} 
            width={size * 0.03} height={size * 0.12} 
            fill={colors.wood} opacity="0.7" />
      
      {/* Main structure with prominent side view */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Front wall */}
        <rect x={size * 0.2} y={size * 0.35} 
              width={size * 0.55} height={size * 0.3} 
              fill={colors.wood} stroke={colors.accent} strokeWidth="0.8" />
        
        {/* Right side wall - more visible */}
        <polygon points={`${size * 0.75},${size * 0.35} 
                         ${size * 0.75 + depth * 0.65},${size * 0.35 - depth * 0.32}
                         ${size * 0.75 + depth * 0.65},${size * 0.65 - depth * 0.32}
                         ${size * 0.75},${size * 0.65}`}
                 fill={colors.wood} opacity="0.9" stroke={colors.accent} strokeWidth="0.5" />
        
        {/* Thatched roof with better 3D perspective */}
        {/* Front slope */}
        <polygon points={`${size * 0.15},${size * 0.4} 
                         ${size * 0.475},${size * 0.15}
                         ${size * 0.8},${size * 0.4}`}
                 fill={`url(#thatchGrad-${uniqueId})`} />
        
        {/* Back slope - visible in perspective */}
        <polygon points={`${size * 0.475},${size * 0.15} 
                         ${size * 0.475 + depth * 0.65},${size * 0.15 - depth * 0.32}
                         ${size * 0.8 + depth * 0.65},${size * 0.4 - depth * 0.32}
                         ${size * 0.8},${size * 0.4}`}
                 fill={colors.thatch} opacity="0.8" />
        
        {/* Ridge beam */}
        <line x1={size * 0.475} y1={size * 0.15} 
              x2={size * 0.475 + depth * 0.65} y2={size * 0.15 - depth * 0.32}
              stroke={colors.wood} strokeWidth="2" />
        
        {/* Thatch texture lines on front */}
        {[0.2, 0.25, 0.3, 0.35].map((yOffset, i) => (
          <line key={i}
                x1={size * 0.18} y1={size * yOffset} 
                x2={size * 0.77} y2={size * yOffset}
                stroke={colors.wood} strokeWidth="0.3" opacity="0.5" />
        ))}
        
        {/* Thatch texture on visible side */}
        {[0.25, 0.3, 0.35].map((yOffset, i) => (
          <line key={`side-${i}`}
                x1={size * 0.77} y1={size * yOffset} 
                x2={size * 0.77 + depth * 0.6} y2={size * yOffset - depth * 0.3}
                stroke={colors.wood} strokeWidth="0.3" opacity="0.4" />
        ))}
        
        {/* Entrance */}
        <rect x={size * 0.45} y={size * 0.5} 
              width={size * 0.08} height={size * 0.15} 
              fill="#2a2a2a" opacity="0.8" />
        
        {/* Decorative elements on front */}
        {variant === 'maori' && (
          // Maori carvings
          <g>
            <circle cx={size * 0.3} cy={size * 0.45} r={size * 0.02} 
                    fill={colors.accent} opacity="0.7" />
            <circle cx={size * 0.65} cy={size * 0.45} r={size * 0.02} 
                    fill={colors.accent} opacity="0.7" />
            <path d={`M ${size * 0.35} ${size * 0.5} Q ${size * 0.475} ${size * 0.48} ${size * 0.6} ${size * 0.5}`}
                  stroke={colors.accent} strokeWidth="1" fill="none" opacity="0.6" />
          </g>
        )}
        
        {/* Windows on side wall */}
        <polygon points={`${size * 0.76},${size * 0.45} 
                         ${size * 0.76 + depth * 0.5},${size * 0.45 - depth * 0.25}
                         ${size * 0.76 + depth * 0.5},${size * 0.52 - depth * 0.25}
                         ${size * 0.76},${size * 0.52}`}
                 fill="#2a2a2a" opacity="0.5" />
      </g>
      
      {/* Decorative posts for certain variants */}
      {(variant === 'hawaiian' || variant === 'fijian') && (
        <g>
          {/* Tiki torches */}
          <rect x={size * 0.1} y={size * 0.55} 
                width={size * 0.02} height={size * 0.15} 
                fill={colors.wood} />
          <ellipse cx={size * 0.11} cy={size * 0.53} 
                   rx={size * 0.02} ry={size * 0.03}
                   fill="#ff8800" opacity="0.8" />
          
          <rect x={size * 0.88} y={size * 0.55} 
                width={size * 0.02} height={size * 0.15} 
                fill={colors.wood} />
          <ellipse cx={size * 0.89} cy={size * 0.53} 
                   rx={size * 0.02} ry={size * 0.03}
                   fill="#ff8800" opacity="0.8" />
        </g>
      )}
      
      {/* Palm fronds decoration for tropical feel */}
      {variant === 'micronesian' && (
        <g opacity="0.6">
          <path d={`M ${size * 0.85} ${size * 0.3} 
                    Q ${size * 0.9} ${size * 0.25} ${size * 0.95} ${size * 0.3}`}
                stroke="#4a7a4a" strokeWidth="1" fill="none" />
          <path d={`M ${size * 0.85} ${size * 0.3} 
                    Q ${size * 0.88} ${size * 0.28} ${size * 0.92} ${size * 0.32}`}
                stroke="#4a7a4a" strokeWidth="1" fill="none" />
        </g>
      )}
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(OceanianMeetingHouseSymbol);