/**
 * components/symbols/government/TownHallSymbol.tsx - Renaissance/Early Modern town hall and guildhall
 * Enhanced with 3D isometric perspective and cultural variants
 */
import React from 'react';
import { Tile } from '../../../types';

interface TownHallSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'flemish' | 'german' | 'italian' | 'english' | 'hanseatic' | 'iberian';
}

const TownHallSymbol: React.FC<TownHallSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'flemish' 
}) => {
  const uniqueId = `townhall-${x}-${y}-${seed}`;
  const depth = size * 0.15;
  
  // Get variant-specific architectural details
  const getDetails = () => {
    switch (variant) {
      case 'german':
        return {
          wall: '#F5DEB3', // Wheat (timber frame)
          roof: '#8B0000', // Dark red tiles
          accent: '#654321', // Dark brown timber
          window: '#6a8a9a',
          steppedGable: true,
          arcades: false
        };
      case 'italian':
        return {
          wall: '#FFEFD5', // Papaya whip (light stone)
          roof: '#CD853F', // Peru (terracotta)
          accent: '#A0522D', // Sienna
          window: '#4a7a9a',
          steppedGable: false,
          arcades: true
        };
      case 'english':
        return {
          wall: '#F5F5DC', // Beige stone
          roof: '#696969', // Dim gray slate
          accent: '#2F4F4F', // Dark slate gray
          window: '#87CEEB',
          steppedGable: false,
          arcades: false
        };
      case 'hanseatic':
        return {
          wall: '#DEB887', // Burlywood (brick)
          roof: '#2F4F4F', // Dark slate
          accent: '#8B4513', // Saddle brown
          window: '#5a8a9a',
          steppedGable: true,
          arcades: false
        };
      case 'iberian':
        return {
          wall: '#F4E4C1', // Light sandstone
          roof: '#CC6633', // Terracotta
          accent: '#8B4513', // Dark brown
          window: '#4a6a8a',
          steppedGable: false,
          arcades: true
        };
      default: // flemish
        return {
          wall: '#DEB887', // Burlywood (brick)
          roof: '#696969', // Gray slate
          accent: '#8B4513', // Saddle brown
          window: '#4a7a9a',
          steppedGable: true,
          arcades: false
        };
    }
  };

  const details = getDetails();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`townGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={details.wall} />
          <stop offset="100%" stopColor={details.accent} />
        </linearGradient>
        <linearGradient id={`roofGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={details.roof} />
          <stop offset="100%" stopColor={details.accent} stopOpacity="0.8" />
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
      <ellipse cx={size * 0.52} cy={size * 0.8} 
               rx={size * 0.45} ry={size * 0.18} 
               fill="rgba(0,0,0,0.3)" />
      
      {/* Main building in isometric 3D */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Front facade */}
        <rect x={size * 0.2} y={size * 0.35} 
              width={size * 0.6} height={size * 0.4} 
              fill={`url(#townGrad-${uniqueId})`} 
              stroke={details.accent} strokeWidth="1" />
        
        {/* Right side - 3D depth */}
        <path d={`M ${size * 0.8} ${size * 0.35}
                  L ${size * 0.8 + depth * 0.7} ${size * 0.35 - depth * 0.35}
                  L ${size * 0.8 + depth * 0.7} ${size * 0.75 - depth * 0.35}
                  L ${size * 0.8} ${size * 0.75} Z`}
              fill={details.accent} stroke={details.roof} strokeWidth="0.5" />
        
        {/* Stepped gable for Flemish/German/Hanseatic */}
        {details.steppedGable ? (
          <g>
            {/* Stepped facade */}
            <polygon points={`${size * 0.2},${size * 0.35} 
                             ${size * 0.3},${size * 0.3}
                             ${size * 0.3},${size * 0.25}
                             ${size * 0.4},${size * 0.25}
                             ${size * 0.4},${size * 0.2}
                             ${size * 0.5},${size * 0.15}
                             ${size * 0.6},${size * 0.2}
                             ${size * 0.6},${size * 0.25}
                             ${size * 0.7},${size * 0.25}
                             ${size * 0.7},${size * 0.3}
                             ${size * 0.8},${size * 0.35}`}
                     fill={details.wall} stroke={details.accent} strokeWidth="0.8" />
            
            {/* 3D depth for stepped gable */}
            <path d={`M ${size * 0.5} ${size * 0.15}
                      L ${size * 0.5 + depth * 0.5} ${size * 0.15 - depth * 0.25}
                      L ${size * 0.6 + depth * 0.5} ${size * 0.2 - depth * 0.25}
                      L ${size * 0.6} ${size * 0.2} Z`}
                  fill={details.accent} opacity="0.8" />
          </g>
        ) : (
          // Simple triangular roof for other variants
          <polygon points={`${size * 0.18},${size * 0.35} ${size * 0.5},${size * 0.2} ${size * 0.82},${size * 0.35}`}
                   fill={`url(#roofGrad-${uniqueId})`} 
                   stroke={details.accent} strokeWidth="0.8" />
        )}
        
        {/* Arcades for Italian/Iberian variants */}
        {details.arcades && (
          <g>
            {[0.3, 0.4, 0.5, 0.6, 0.7].map((xPos, i) => (
              <g key={i}>
                <path d={`M ${size * xPos - size * 0.03} ${size * 0.75}
                          L ${size * xPos - size * 0.03} ${size * 0.65}
                          Q ${size * xPos} ${size * 0.62}, ${size * xPos + size * 0.03} ${size * 0.65}
                          L ${size * xPos + size * 0.03} ${size * 0.75}`}
                      fill="#2a2a2a" opacity="0.6" />
              </g>
            ))}
          </g>
        )}
        
        {/* Windows - culturally specific styles */}
        {variant === 'german' || variant === 'hanseatic' ? (
          // Half-timbered style windows
          [0.35, 0.5, 0.65].map((xPos, i) => (
            <g key={i}>
              <rect x={size * xPos - size * 0.03} 
                    y={size * 0.45} 
                    width={size * 0.06} height={size * 0.08} 
                    fill={details.window} opacity="0.7" 
                    stroke={details.accent} strokeWidth="0.5" />
              {/* Cross-beam pattern */}
              <line x1={size * xPos} y1={size * 0.45} 
                    x2={size * xPos} y2={size * 0.53} 
                    stroke={details.accent} strokeWidth="0.8" />
              <line x1={size * xPos - size * 0.03} y1={size * 0.49} 
                    x2={size * xPos + size * 0.03} y2={size * 0.49} 
                    stroke={details.accent} strokeWidth="0.8" />
            </g>
          ))
        ) : variant === 'italian' || variant === 'iberian' ? (
          // Arched Renaissance windows
          [0.32, 0.5, 0.68].map((xPos, i) => (
            <g key={i}>
              <rect x={size * xPos - size * 0.025} 
                    y={size * 0.42} 
                    width={size * 0.05} height={size * 0.08} 
                    fill={details.window} opacity="0.7" />
              <path d={`M ${size * xPos - size * 0.025} ${size * 0.42}
                        Q ${size * xPos} ${size * 0.39}, ${size * xPos + size * 0.025} ${size * 0.42}`}
                    fill={details.window} opacity="0.7" />
            </g>
          ))
        ) : variant === 'flemish' ? (
          // Tall narrow Flemish windows
          [0.3, 0.4, 0.5, 0.6, 0.7].map((xPos, i) => (
            <rect key={i}
                  x={size * xPos - size * 0.02} 
                  y={size * 0.42} 
                  width={size * 0.04} height={size * 0.1} 
                  fill={details.window} opacity="0.7" 
                  stroke={details.accent} strokeWidth="0.3" />
          ))
        ) : (
          // English mullioned windows
          [0.35, 0.5, 0.65].map((xPos, i) => (
            <g key={i}>
              <rect x={size * xPos - size * 0.04} 
                    y={size * 0.45} 
                    width={size * 0.08} height={size * 0.06} 
                    fill={details.window} opacity="0.7" />
              {/* Mullions */}
              <line x1={size * xPos - size * 0.013} y1={size * 0.45} 
                    x2={size * xPos - size * 0.013} y2={size * 0.51} 
                    stroke={details.accent} strokeWidth="0.3" />
              <line x1={size * xPos + size * 0.013} y1={size * 0.45} 
                    x2={size * xPos + size * 0.013} y2={size * 0.51} 
                    stroke={details.accent} strokeWidth="0.3" />
            </g>
          ))
        )}
        
        {/* Main entrance */}
        <rect x={size * 0.47} y={size * 0.63} 
              width={size * 0.06} height={size * 0.12} 
              fill="#3a2a1a" stroke={details.accent} strokeWidth="0.8" />
        
        {/* Entrance arch for certain variants */}
        {(variant === 'italian' || variant === 'iberian' || variant === 'flemish') && (
          <path d={`M ${size * 0.47} ${size * 0.63}
                    Q ${size * 0.5} ${size * 0.59}, ${size * 0.53} ${size * 0.63}`}
                fill={details.accent} stroke={details.roof} strokeWidth="0.5" />
        )}
        
        {/* Decorative elements */}
        {variant === 'german' && (
          // Timber frame pattern
          <g>
            <line x1={size * 0.2} y1={size * 0.55} 
                  x2={size * 0.8} y2={size * 0.55} 
                  stroke={details.accent} strokeWidth="2" />
            <line x1={size * 0.2} y1={size * 0.4} 
                  x2={size * 0.8} y2={size * 0.4} 
                  stroke={details.accent} strokeWidth="2" />
            {/* Diagonal braces */}
            <line x1={size * 0.25} y1={size * 0.4} 
                  x2={size * 0.35} y2={size * 0.55} 
                  stroke={details.accent} strokeWidth="1.5" />
            <line x1={size * 0.75} y1={size * 0.4} 
                  x2={size * 0.65} y2={size * 0.55} 
                  stroke={details.accent} strokeWidth="1.5" />
          </g>
        )}
        
        {variant === 'hanseatic' && (
          // Decorative brick patterns
          <g>
            <rect x={size * 0.45} y={size * 0.25} 
                  width={size * 0.1} height={size * 0.03} 
                  fill={details.accent} opacity="0.6" />
            <rect x={size * 0.43} y={size * 0.29} 
                  width={size * 0.14} height={size * 0.02} 
                  fill={details.accent} opacity="0.5" />
          </g>
        )}
      </g>
      
      {/* Bell tower for certain variants */}
      {(variant === 'italian' || variant === 'iberian') && (
        <g>
          <rect x={size * 0.75} y={size * 0.25} 
                width={size * 0.08} height={size * 0.35} 
                fill={details.wall} stroke={details.accent} strokeWidth="0.5" />
          <polygon points={`${size * 0.74},${size * 0.25} ${size * 0.79},${size * 0.18} ${size * 0.84},${size * 0.25}`}
                   fill={details.roof} />
          {/* Bell opening */}
          <rect x={size * 0.77} y={size * 0.3} 
                width={size * 0.04} height={size * 0.05} 
                fill="#2a2a2a" opacity="0.6" />
        </g>
      )}
      
      {/* Market stall canopies for merchant towns */}
      {(variant === 'flemish' || variant === 'hanseatic') && (
        <g opacity="0.7">
          <rect x={size * 0.12} y={size * 0.7} 
                width={size * 0.06} height={size * 0.08} 
                fill={details.accent} />
          <polygon points={`${size * 0.1},${size * 0.7} ${size * 0.15},${size * 0.66} ${size * 0.2},${size * 0.7}`}
                   fill={details.roof} opacity="0.8" />
        </g>
      )}
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(TownHallSymbol);