/**
 * components/symbols/government/MandateHallSymbol.tsx - Chinese imperial and administrative buildings
 * Enhanced with traditional curved roofs and imperial banner
 */
import React from 'react';
import { Tile } from '../../../types';

interface MandateHallSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  buildingName: string;
  variant?: 'han' | 'tang' | 'ming' | 'qing' | 'indian';
}

const MandateHallSymbol: React.FC<MandateHallSymbolProps> = ({ 
  x, y, size, seed, tile, buildingName, variant = 'tang' 
}) => {
  const uniqueId = `mandate-${x}-${y}-${seed}`;
  
  // Get variant-specific colors
  const getColors = () => {
    switch (variant) {
      case 'han':
        return { roof: '#8B0000', wall: '#F4A460', accent: '#DAA520' };
      case 'ming':
        return { roof: '#FFD700', wall: '#FFFACD', accent: '#B8860B' };
      case 'qing':
        return { roof: '#4169E1', wall: '#F5DEB3', accent: '#DAA520' };
      case 'indian':
        return { roof: '#FF8C00', wall: '#DEB887', accent: '#8B4513' };
      default: // tang
        return { roof: '#cc4444', wall: '#f8e8d8', accent: '#cc3333' };
    }
  };
  
  const colors = getColors();
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={`roofGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.roof} />
          <stop offset="50%" stopColor={colors.roof} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.roof} stopOpacity="0.6" />
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
      
      {/* Main building structure */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Base platform */}
        <rect x={size * 0.2} y={size * 0.65} 
              width={size * 0.6} height={size * 0.08} 
              fill="#c8b8a8" />
        
        {/* Main building */}
        <rect x={size * 0.25} y={size * 0.45} 
              width={size * 0.5} height={size * 0.25} 
              fill={`url(#wallGrad-${uniqueId})`} />
        
        {/* Pillars */}
        {[0.3, 0.4, 0.5, 0.6, 0.7].map((xPos, i) => (
          <rect key={i} 
                x={size * xPos - size * 0.015} 
                y={size * 0.45} 
                width={size * 0.03} height={size * 0.25} 
                fill={colors.accent} />
        ))}
        
        {/* Traditional curved roof - main */}
        <path d={`M ${size * 0.18} ${size * 0.45}
                  Q ${size * 0.15} ${size * 0.38}, ${size * 0.25} ${size * 0.35}
                  L ${size * 0.75} ${size * 0.35}
                  Q ${size * 0.85} ${size * 0.38}, ${size * 0.82} ${size * 0.45}
                  Z`}
              fill={`url(#roofGrad-${uniqueId})`} />
        
        {/* Roof ridge */}
        <rect x={size * 0.25} y={size * 0.33} 
              width={size * 0.5} height={size * 0.02} 
              fill={colors.roof} opacity="0.8" />
        
        {/* Upper tier roof */}
        <path d={`M ${size * 0.3} ${size * 0.35}
                  Q ${size * 0.28} ${size * 0.3}, ${size * 0.35} ${size * 0.28}
                  L ${size * 0.65} ${size * 0.28}
                  Q ${size * 0.72} ${size * 0.3}, ${size * 0.7} ${size * 0.35}
                  Z`}
              fill={colors.roof} opacity="0.9" />
        
        {/* Decorative roof ornaments */}
        <circle cx={size * 0.18} cy={size * 0.42} r={size * 0.015} fill="#ffcc00" />
        <circle cx={size * 0.82} cy={size * 0.42} r={size * 0.015} fill="#ffcc00" />
        
        {/* Third tier for ming/qing variants */}
        {(variant === 'ming' || variant === 'qing') && (
          <g>
            <path d={`M ${size * 0.38} ${size * 0.28}
                      Q ${size * 0.36} ${size * 0.24}, ${size * 0.42} ${size * 0.22}
                      L ${size * 0.58} ${size * 0.22}
                      Q ${size * 0.64} ${size * 0.24}, ${size * 0.62} ${size * 0.28}
                      Z`}
                  fill={colors.roof} opacity="0.8" />
            <circle cx={size * 0.5} cy={size * 0.2} r={size * 0.02} fill="#ffcc00" />
          </g>
        )}
      </g>
      
      {/* Imperial banner with dynasty-specific character */}
      <g transform={`translate(${size * 0.15}, ${size * 0.5})`}>
        <rect x={0} y={0} width={size * 0.02} height={size * 0.25} 
              fill="#5a4a3a" />
        <rect x={size * 0.02} y={0} 
              width={size * 0.08} height={size * 0.12} 
              fill="#ffcc00" opacity="0.8" />
        <text x={size * 0.06} y={size * 0.06} 
              fontSize={size * 0.04} fill={colors.accent} textAnchor="middle">
          {variant === 'han' ? '漢' : 
           variant === 'tang' ? '唐' : 
           variant === 'ming' ? '明' : 
           variant === 'qing' ? '清' : 
           variant === 'indian' ? 'राज' : '令'}
        </text>
      </g>
      
      {/* Second banner for symmetry */}
      <g transform={`translate(${size * 0.75}, ${size * 0.5})`}>
        <rect x={0} y={0} width={size * 0.02} height={size * 0.25} 
              fill="#5a4a3a" />
        <rect x={size * 0.02} y={0} 
              width={size * 0.08} height={size * 0.12} 
              fill="#ffcc00" opacity="0.8" />
        <text x={size * 0.06} y={size * 0.06} 
              fontSize={size * 0.04} fill={colors.accent} textAnchor="middle">
          {variant === 'indian' ? 'सभा' : '府'}
        </text>
      </g>
      
      {/* Entrance */}
      <rect x={size * 0.47} y={size * 0.6} 
            width={size * 0.06} height={size * 0.1} 
            fill="#3a2a1a" />
      
      {/* Windows with lattice pattern */}
      {[0.35, 0.5, 0.65].map((xPos, i) => (
        <g key={`window-${i}`}>
          <rect x={size * xPos - size * 0.02} 
                y={size * 0.52} 
                width={size * 0.04} height={size * 0.05} 
                fill="#4a3a2a" opacity="0.7" />
          {/* Lattice pattern */}
          <line x1={size * xPos} y1={size * 0.52} 
                x2={size * xPos} y2={size * 0.57} 
                stroke="#6a5a4a" strokeWidth="0.5" />
          <line x1={size * xPos - size * 0.02} y1={size * 0.545} 
                x2={size * xPos + size * 0.02} y2={size * 0.545} 
                stroke="#6a5a4a" strokeWidth="0.5" />
        </g>
      ))}
      
      {/* Decorative lanterns */}
      {(variant === 'ming' || variant === 'qing') && (
        <g>
          <ellipse cx={size * 0.3} cy={size * 0.58} 
                   rx={size * 0.02} ry={size * 0.03} 
                   fill="#ff6666" opacity="0.6" />
          <ellipse cx={size * 0.7} cy={size * 0.58} 
                   rx={size * 0.02} ry={size * 0.03} 
                   fill="#ff6666" opacity="0.6" />
        </g>
      )}
      
      <title>{buildingName}</title>
    </g>
  );
};

export default React.memo(MandateHallSymbol);