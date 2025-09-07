/**
 * components/symbols/government/CaliphCourtSymbol.tsx - Islamic court and administrative buildings
 * Enhanced with minaret, dome, and crescent moon in isometric 3D perspective
 */
import React from 'react';
import { Tile } from '../../../types';

interface CaliphCourtSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'abbasid' | 'ottoman' | 'mughal' | 'mamluk';
}

const CaliphCourtSymbol: React.FC<CaliphCourtSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'abbasid' 
}) => {
  const uniqueId = `caliph-${x}-${y}-${seed}`;
  
  // Get variant-specific colors
  const getColors = () => {
    switch (variant) {
      case 'ottoman':
        return { 
          dome: '#4682B4', 
          wall: '#F5F5DC', 
          accent: '#DAA520',
          moonstar: '#FFD700'
        };
      case 'mughal':
        return { 
          dome: '#FFB6C1', 
          wall: '#FFFACD', 
          accent: '#8A2BE2',
          moonstar: '#FFD700'
        };
      case 'mamluk':
        return { 
          dome: '#20B2AA', 
          wall: '#DEB887', 
          accent: '#B8860B',
          moonstar: '#FFCC00'
        };
      default: // abbasid
        return { 
          dome: '#4488cc', 
          wall: '#f8e8d0', 
          accent: '#3377bb',
          moonstar: '#ffcc00'
        };
    }
  };
  
  const colors = getColors();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`domeGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.dome} />
          <stop offset="50%" stopColor={colors.accent} />
          <stop offset="100%" stopColor={colors.dome} stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={`wallGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.wall} />
          <stop offset="100%" stopColor={colors.wall} stopOpacity="0.8" />
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
      <ellipse 
        cx={size * 0.52} 
        cy={size * 0.75} 
        rx={size * 0.4} 
        ry={size * 0.15} 
        fill="rgba(0,0,0,0.25)"
        filter="blur(2px)"
      />
      
      {/* Main building */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Main structure */}
        <rect x={size * 0.25} y={size * 0.45} 
              width={size * 0.5} height={size * 0.3} 
              fill={`url(#wallGrad-${uniqueId})`} />
        
        {/* Central dome */}
        <ellipse cx={size * 0.5} cy={size * 0.45} 
                 rx={size * 0.15} ry={size * 0.12} 
                 fill={`url(#domeGrad-${uniqueId})`} />
        
        {/* Dome top */}
        <ellipse cx={size * 0.5} cy={size * 0.42} 
                 rx={size * 0.12} ry={size * 0.08} 
                 fill={colors.dome} opacity="0.9" />
        
        {/* Minaret */}
        <rect x={size * 0.75} y={size * 0.25} 
              width={size * 0.06} height={size * 0.35} 
              fill={colors.wall} stroke={colors.accent} strokeWidth="0.5" />
        
        {/* Minaret top */}
        <polygon points={`${size * 0.75},${size * 0.25} ${size * 0.78},${size * 0.2} ${size * 0.81},${size * 0.25}`}
                 fill={colors.dome} />
        
        {/* Crescent moon on minaret */}
        <g transform={`translate(${size * 0.78}, ${size * 0.18})`}>
          <path d={`M 0,${-size * 0.02} 
                    A ${size * 0.02} ${size * 0.02} 0 1 1 0,${size * 0.02}
                    A ${size * 0.015} ${size * 0.015} 0 1 0 0,${-size * 0.02}`}
                fill={colors.moonstar} />
        </g>
        
        {/* Arched entrance */}
        <path d={`M ${size * 0.45} ${size * 0.75}
                  L ${size * 0.45} ${size * 0.6}
                  Q ${size * 0.5} ${size * 0.55}, ${size * 0.55} ${size * 0.6}
                  L ${size * 0.55} ${size * 0.75}
                  Z`}
              fill="#3a2a1a" />
        
        {/* Arched windows */}
        {[0.35, 0.65].map((xPos, i) => (
          <path key={i}
                d={`M ${size * xPos} ${size * 0.55}
                    Q ${size * (xPos + 0.025)} ${size * 0.52}, ${size * (xPos + 0.05)} ${size * 0.55}
                    L ${size * (xPos + 0.05)} ${size * 0.6}
                    L ${size * xPos} ${size * 0.6}
                    Z`}
                fill="#4a7a9a" opacity="0.7" />
        ))}
        
        {/* Secondary minaret for ottoman/mughal variants */}
        {(variant === 'ottoman' || variant === 'mughal') && (
          <g>
            <rect x={size * 0.19} y={size * 0.3} 
                  width={size * 0.05} height={size * 0.3} 
                  fill={colors.wall} stroke={colors.accent} strokeWidth="0.5" />
            <polygon points={`${size * 0.19},${size * 0.3} ${size * 0.215},${size * 0.26} ${size * 0.24},${size * 0.3}`}
                     fill={colors.dome} />
            <g transform={`translate(${size * 0.215}, ${size * 0.24})`}>
              <path d={`M 0,${-size * 0.015} 
                        A ${size * 0.015} ${size * 0.015} 0 1 1 0,${size * 0.015}
                        A ${size * 0.01} ${size * 0.01} 0 1 0 0,${-size * 0.015}`}
                    fill={colors.moonstar} />
            </g>
          </g>
        )}
        
        {/* Geometric patterns on facade */}
        {[0.3, 0.4, 0.6, 0.7].map((xPos, i) => (
          <g key={`pattern-${i}`}>
            <polygon
              points={`${size * xPos},${size * 0.5} ${size * (xPos + 0.015)},${size * 0.51} ${size * xPos},${size * 0.52} ${size * (xPos - 0.015)},${size * 0.51}`}
              fill={colors.accent} 
              stroke={colors.dome} 
              strokeWidth="0.3"
              opacity="0.6"
            />
          </g>
        ))}
        
        {/* Decorative band */}
        <rect x={size * 0.25} y={size * 0.52} 
              width={size * 0.5} height={size * 0.015} 
              fill={colors.accent} opacity="0.7" />
      </g>
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(CaliphCourtSymbol);