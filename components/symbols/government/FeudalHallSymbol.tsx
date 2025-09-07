/**
 * components/symbols/government/FeudalHallSymbol.tsx - Medieval great hall and manor house
 * Rendered in 2.5D isometric perspective to match mill and fortress symbols
 */
import React from 'react';
import { Tile } from '../../../types';

interface FeudalHallSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'english' | 'french' | 'germanic' | 'scandinavian';
}

const FeudalHallSymbol: React.FC<FeudalHallSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'english' 
}) => {
  const uniqueId = `feudal-hall-${x}-${y}-${seed}`;
  const depth = size * 0.3; // Increased for more prominent 3D effect
  
  // Color variations by regional style with enhanced contrast
  const getColors = () => {
    switch (variant) {
      case 'french':
        return {
          base: '#E5E5E5', // Lighter stone for better contrast
          roof: '#6B3410', // Darker brown
          accent: '#4A4A4A', // Darker gray
          wood: '#5A2C10',
          highlight: '#F5F5F5' // For stone highlights
        };
      case 'germanic':
        return {
          base: '#F5DEB3', // Wheat timber
          roof: '#6B0000', // Darker red tiles
          accent: '#4A3021', // Darker brown
          wood: '#7A3D1D',
          highlight: '#FFF8DC' // Cornsilk highlight
        };
      case 'scandinavian':
        return {
          base: '#DCDCDC', // Light gray stone
          roof: '#1C2C2C', // Very dark slate
          accent: '#4A5A6A', // Darker slate
          wood: '#3A3A3A',
          highlight: '#F0F0F0'
        };
      default: // english
        return {
          base: '#D2B48C', // Tan stone
          roof: '#5B2C0D', // Darker brown thatch
          accent: '#7A3D1D', // Darker sienna
          wood: '#3A2010',
          highlight: '#E5D4B1' // Light tan highlight
        };
    }
  };

  const colors = getColors();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`stoneGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="30%" stopColor={colors.base} />
          <stop offset="100%" stopColor={colors.accent} />
        </linearGradient>
        <linearGradient id={`roofGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.roof} />
          <stop offset="100%" stopColor={colors.wood} />
        </linearGradient>
        <filter id={`shadow-${uniqueId}`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="3" dy="4" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <pattern id={`timberPattern-${uniqueId}`} x="0" y="0" width="4" height="20" patternUnits="userSpaceOnUse">
          <rect width="4" height="20" fill={colors.wood}/>
          <line x1="0" y1="0" x2="0" y2="20" stroke={colors.accent} strokeWidth="0.5"/>
          <line x1="4" y1="0" x2="4" y2="20" stroke={colors.accent} strokeWidth="0.5"/>
        </pattern>
      </defs>
      
      {/* Enhanced shadow with gradient */}
      <ellipse cx={size * 0.55} cy={size * 0.85} 
               rx={size * 0.55} ry={size * 0.25} 
               fill="rgba(0,0,0,0.4)" 
               filter="blur(3px)" />
      
      {/* Main hall building in isometric 3D with enhanced perspective */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Front face with timber frame pattern for Germanic variant */}
        <rect x={size * 0.2} y={size * 0.4} 
              width={size * 0.6} height={size * 0.35} 
              fill={variant === 'germanic' ? `url(#timberPattern-${uniqueId})` : `url(#stoneGrad-${uniqueId})`} 
              stroke={colors.accent} strokeWidth="1.5" />
        
        {/* Right side - Enhanced 3D depth with proper shading */}
        <path d={`M ${size * 0.8} ${size * 0.4}
                  L ${size * 0.8 + depth * 0.7} ${size * 0.4 - depth * 0.35}
                  L ${size * 0.8 + depth * 0.7} ${size * 0.75 - depth * 0.35}
                  L ${size * 0.8} ${size * 0.75} Z`}
              fill={colors.accent} 
              stroke={colors.wood} 
              strokeWidth="0.8" 
              opacity="0.85" />
        
        {/* Steep pitched roof with clearer definition */}
        <polygon points={`${size * 0.18},${size * 0.4} ${size * 0.5},${size * 0.18} ${size * 0.82},${size * 0.4}`}
                 fill={`url(#roofGrad-${uniqueId})`} 
                 stroke={colors.wood} 
                 strokeWidth="1.2" />
        
        {/* Roof 3D depth with better shading */}
        <path d={`M ${size * 0.82} ${size * 0.4}
                  L ${size * 0.5} ${size * 0.18}
                  L ${size * 0.5 + depth * 0.7} ${size * 0.18 - depth * 0.35}
                  L ${size * 0.82 + depth * 0.7} ${size * 0.4 - depth * 0.35} Z`}
              fill={colors.wood} 
              stroke={colors.accent} 
              strokeWidth="0.8" 
              opacity="0.9" />
        
        {/* Roof ridge beam - more prominent */}
        <line x1={size * 0.5} y1={size * 0.18} 
              x2={size * 0.5 + depth * 0.7} y2={size * 0.18 - depth * 0.35}
              stroke={colors.wood} 
              strokeWidth="2" 
              strokeLinecap="round" />
        
        {/* Roof texture lines for thatch/tiles */}
        {variant !== 'germanic' && [0.25, 0.3, 0.35].map((yPos, i) => (
          <line key={`roof-line-${i}`}
                x1={size * 0.22} y1={size * yPos}
                x2={size * 0.78} y2={size * yPos}
                stroke={colors.wood} 
                strokeWidth="0.3" 
                opacity="0.5" />
        ))}
      </g>
      
      {/* Tower with enhanced 3D depth and shading */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Tower front with gradient */}
        <rect x={size * 0.65} y={size * 0.25} 
              width={size * 0.15} height={size * 0.5} 
              fill={`url(#stoneGrad-${uniqueId})`} 
              stroke={colors.accent} 
              strokeWidth="1.3" />
        
        {/* Tower right side with better shading */}
        <path d={`M ${size * 0.8} ${size * 0.25}
                  L ${size * 0.8 + depth * 0.5} ${size * 0.25 - depth * 0.25}
                  L ${size * 0.8 + depth * 0.5} ${size * 0.75 - depth * 0.25}
                  L ${size * 0.8} ${size * 0.75} Z`}
              fill={colors.accent} 
              stroke={colors.wood} 
              strokeWidth="0.8" 
              opacity="0.85" />
        
        {/* Tower roof - sharper conical shape */}
        <polygon points={`${size * 0.63},${size * 0.25} ${size * 0.725},${size * 0.12} ${size * 0.82},${size * 0.25}`}
                 fill={colors.roof} 
                 stroke={colors.wood} 
                 strokeWidth="1" />
        
        {/* Tower roof 3D with enhanced depth */}
        <path d={`M ${size * 0.82} ${size * 0.25}
                  L ${size * 0.725} ${size * 0.12}
                  L ${size * 0.725 + depth * 0.5} ${size * 0.12 - depth * 0.25}
                  L ${size * 0.82 + depth * 0.5} ${size * 0.25 - depth * 0.25} Z`}
              fill={colors.wood} 
              stroke={colors.accent} 
              strokeWidth="0.6" 
              opacity="0.9" />
        
        {/* Tower windows with depth effect */}
        <g>
          <rect x={size * 0.71} y={size * 0.35} 
                width={size * 0.03} height={size * 0.05} 
                fill="#1a1a1a" 
                stroke={colors.accent} 
                strokeWidth="0.5" />
          <rect x={size * 0.71} y={size * 0.5} 
                width={size * 0.03} height={size * 0.05} 
                fill="#1a1a1a" 
                stroke={colors.accent} 
                strokeWidth="0.5" />
          <rect x={size * 0.71} y={size * 0.65} 
                width={size * 0.03} height={size * 0.05} 
                fill="#1a1a1a" 
                stroke={colors.accent} 
                strokeWidth="0.5" />
        </g>
        
        {/* Tower top crenellations */}
        {[0.66, 0.69, 0.72, 0.75, 0.78].map((xPos, i) => (
          <rect key={`cren-${i}`}
                x={size * xPos} 
                y={size * 0.23} 
                width={size * 0.02} 
                height={size * 0.02} 
                fill={colors.base} 
                stroke={colors.accent} 
                strokeWidth="0.3" />
        ))}
      </g>
      
      {/* Main entrance with proper depth */}
      <g>
        <rect x={size * 0.47} y={size * 0.6} 
              width={size * 0.06} height={size * 0.15} 
              fill={colors.wood} stroke="#3a2a1a" strokeWidth="0.8" />
        
        {/* Door arch */}
        <path d={`M ${size * 0.47} ${size * 0.6}
                  Q ${size * 0.5} ${size * 0.56}
                  ${size * 0.53} ${size * 0.6}`}
              fill={colors.accent} stroke={colors.wood} strokeWidth="0.5" />
        
        {/* Door depth */}
        <path d={`M ${size * 0.53} ${size * 0.6}
                  L ${size * 0.53 + 2} ${size * 0.6 - 1}
                  L ${size * 0.53 + 2} ${size * 0.75 - 1}
                  L ${size * 0.53} ${size * 0.75} Z`}
              fill="#2a1a0a" strokeWidth="0.3" />
      </g>
      
      {/* Windows on main hall */}
      {[0.3, 0.4, 0.6, 0.7].map((xPos, i) => (
        <g key={`window-${i}`}>
          <rect x={size * xPos - 3} y={size * 0.48} 
                width="6" height="10" 
                fill="#3a3a3a" stroke={colors.accent} strokeWidth="0.5" />
          {/* Window cross */}
          <line x1={size * xPos} y1={size * 0.48} 
                x2={size * xPos} y2={size * 0.58} 
                stroke={colors.accent} strokeWidth="0.3" />
          <line x1={size * xPos - 3} y1={size * 0.53} 
                x2={size * xPos + 3} y2={size * 0.53} 
                stroke={colors.accent} strokeWidth="0.3" />
        </g>
      ))}
      
      {/* Chimney */}
      <g>
        <rect x={size * 0.35} y={size * 0.28} 
              width={size * 0.04} height={size * 0.12} 
              fill={colors.base} stroke={colors.accent} strokeWidth="0.5" />
        <rect x={size * 0.34} y={size * 0.26} 
              width={size * 0.06} height={size * 0.02} 
              fill={colors.accent} />
        
        {/* Smoke animation */}
        <ellipse cx={size * 0.37} cy={size * 0.24} 
                 rx="3" ry="2" 
                 fill="rgba(80,80,80,0.3)">
          <animate attributeName="cy" 
                   values={`${size * 0.24};${size * 0.20};${size * 0.24}`}
                   dur="4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" 
                   values="0.3;0.1;0.3"
                   dur="4s" repeatCount="indefinite"/>
        </ellipse>
      </g>
      
      {/* Banner/flag on tower */}
      <g>
        <line x1={size * 0.725} y1={size * 0.15} 
              x2={size * 0.725} y2={size * 0.08} 
              stroke={colors.wood} strokeWidth="0.8" />
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={`0 ${size * 0.725} ${size * 0.1};3 ${size * 0.725} ${size * 0.1};0 ${size * 0.725} ${size * 0.1}`}
            dur="3s"
            repeatCount="indefinite"/>
          <polygon points={`${size * 0.725},${size * 0.08} ${size * 0.78},${size * 0.09} ${size * 0.78},${size * 0.12} ${size * 0.725},${size * 0.11}`}
                   fill={variant === 'french' ? '#4169E1' : variant === 'germanic' ? '#FFD700' : '#DC143C'} 
                   opacity="0.8" />
        </g>
      </g>
      
      {/* Small outbuilding/stable */}
      <g>
        <rect x={size * 0.08} y={size * 0.6} 
              width={size * 0.08} height={size * 0.12} 
              fill={colors.wood} stroke={colors.accent} strokeWidth="0.5" />
        <polygon points={`${size * 0.06},${size * 0.6} ${size * 0.12},${size * 0.54} ${size * 0.18},${size * 0.6}`}
                 fill={colors.roof} stroke={colors.wood} strokeWidth="0.3" />
      </g>
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(FeudalHallSymbol);