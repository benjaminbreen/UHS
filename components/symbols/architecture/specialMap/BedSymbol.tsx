/**
 * BedSymbol.tsx - High-quality 32x32 pixel art RPG-style bed
 * Fills the whole tile with rich detail and cultural variations
 * Inspired by classic SNES RPGs and modern pixel art games
 */
import React from 'react';

interface BedSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  seed?: number;
}

const BedSymbol: React.FC<BedSymbolProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  era = 1500,
  seed = 0 
}) => {
  const zone = culturalZone?.toUpperCase();
  
  // Get colors based on culture and era
  const getColors = () => {
    switch (zone) {
      case 'EAST_ASIAN':
        return {
          // Dark lacquered wood frame
          frame: '#3a2818',
          frameLight: '#4a3828',
          frameDark: '#2a1808',
          frameAccent: '#cd853f',
          // Tatami/silk bedding
          mattress: '#e8dcc6',
          mattressLight: '#f0e4ce',
          mattressDark: '#d0c4ae',
          mattressEdge: '#c0b49e',
          // Silk pillows
          pillow: '#f5f0e8',
          pillowLight: '#fffaf2',
          pillowDark: '#e5e0d8',
          // Red silk blanket
          blanket: '#b22222',
          blanketLight: '#c83333',
          blanketDark: '#921212',
          blanketPattern: '#d4af37'
        };
      
      case 'MENA':
      case 'NORTH_AFRICAN':
        return {
          // Cedar/ornate wood
          frame: '#8b6f47',
          frameLight: '#9b7f57',
          frameDark: '#7b5f37',
          frameAccent: '#daa520',
          // Rich fabrics
          mattress: '#f0e4ce',
          mattressLight: '#f8ece6',
          mattressDark: '#e0d4be',
          mattressEdge: '#d0c4ae',
          // White silk pillows
          pillow: '#ffffff',
          pillowLight: '#ffffff',
          pillowDark: '#f0f0f0',
          // Purple/gold blanket
          blanket: '#4b0082',
          blanketLight: '#5b1092',
          blanketDark: '#3b0072',
          blanketPattern: '#ffd700'
        };
      
      case 'SOUTH_ASIAN':
        return {
          // Teak wood
          frame: '#5d4e37',
          frameLight: '#6d5e47',
          frameDark: '#4d3e27',
          frameAccent: '#ff8c00',
          // Cotton bedding
          mattress: '#faebd7',
          mattressLight: '#fff8dc',
          mattressDark: '#ead5c0',
          mattressEdge: '#dac5b0',
          // Pink pillows
          pillow: '#ffe4e1',
          pillowLight: '#fff4f1',
          pillowDark: '#ffd4d1',
          // Orange/red blanket
          blanket: '#ff6347',
          blanketLight: '#ff7357',
          blanketDark: '#ef5337',
          blanketPattern: '#ffd700'
        };
      
      default: // EUROPEAN
        return {
          // Oak wood frame
          frame: '#654321',
          frameLight: '#755331',
          frameDark: '#553311',
          frameAccent: '#8b6914',
          // Linen bedding
          mattress: '#faf0e6',
          mattressLight: '#fffaf0',
          mattressDark: '#eae0d6',
          mattressEdge: '#dad0c6',
          // White pillows
          pillow: '#ffffff',
          pillowLight: '#ffffff',
          pillowDark: '#f0f0f0',
          // Blue blanket
          blanket: '#4169e1',
          blanketLight: '#5179f1',
          blanketDark: '#3159d1',
          blanketPattern: '#6495ed'
        };
    }
  };
  
  const colors = getColors();
  
  return (
    <svg 
      x={x} 
      y={y} 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      <g>
        {/* Shadow */}
        <ellipse 
          cx={size * 0.5} 
          cy={size * 0.9} 
          rx={size * 0.45} 
          ry={size * 0.12} 
          fill="black" 
          opacity={0.25} 
        />
        
        {/* Headboard (back) */}
        <rect 
          x={size * 0.1} 
          y={size * 0.05} 
          width={size * 0.8} 
          height={size * 0.25} 
          fill={colors.frameDark}
        />
        <rect 
          x={size * 0.12} 
          y={size * 0.07} 
          width={size * 0.76} 
          height={size * 0.21} 
          fill={colors.frame}
        />
        <rect 
          x={size * 0.14} 
          y={size * 0.09} 
          width={size * 0.72} 
          height={size * 0.17} 
          fill={colors.frameLight}
        />
        
        {/* Headboard decoration */}
        {(zone === 'EUROPEAN' || zone === 'MENA') && (
          <>
            <circle cx={size * 0.25} cy={size * 0.17} r={size * 0.03} fill={colors.frameAccent} opacity={0.7} />
            <circle cx={size * 0.5} cy={size * 0.17} r={size * 0.04} fill={colors.frameAccent} opacity={0.7} />
            <circle cx={size * 0.75} cy={size * 0.17} r={size * 0.03} fill={colors.frameAccent} opacity={0.7} />
          </>
        )}
        
        {/* Bed frame base (3D perspective) */}
        <polygon
          points={`
            ${size * 0.08},${size * 0.28}
            ${size * 0.92},${size * 0.28}
            ${size * 0.94},${size * 0.32}
            ${size * 0.94},${size * 0.78}
            ${size * 0.92},${size * 0.82}
            ${size * 0.08},${size * 0.82}
            ${size * 0.06},${size * 0.78}
            ${size * 0.06},${size * 0.32}
          `}
          fill={colors.frameDark}
        />
        
        {/* Frame top surface */}
        <polygon
          points={`
            ${size * 0.08},${size * 0.28}
            ${size * 0.92},${size * 0.28}
            ${size * 0.94},${size * 0.32}
            ${size * 0.06},${size * 0.32}
          `}
          fill={colors.frame}
        />
        
        {/* Frame right side (3D) */}
        <polygon
          points={`
            ${size * 0.92},${size * 0.28}
            ${size * 0.94},${size * 0.32}
            ${size * 0.94},${size * 0.78}
            ${size * 0.92},${size * 0.82}
          `}
          fill={colors.frameLight}
          opacity={0.8}
        />
        
        {/* Mattress */}
        <polygon
          points={`
            ${size * 0.1},${size * 0.26}
            ${size * 0.9},${size * 0.26}
            ${size * 0.91},${size * 0.28}
            ${size * 0.91},${size * 0.72}
            ${size * 0.9},${size * 0.74}
            ${size * 0.1},${size * 0.74}
            ${size * 0.09},${size * 0.72}
            ${size * 0.09},${size * 0.28}
          `}
          fill={colors.mattressDark}
        />
        
        {/* Mattress top */}
        <polygon
          points={`
            ${size * 0.1},${size * 0.26}
            ${size * 0.9},${size * 0.26}
            ${size * 0.91},${size * 0.28}
            ${size * 0.09},${size * 0.28}
          `}
          fill={colors.mattress}
        />
        
        {/* Mattress edge highlight */}
        <line 
          x1={size * 0.1} y1={size * 0.26} 
          x2={size * 0.9} y2={size * 0.26} 
          stroke={colors.mattressLight} 
          strokeWidth={size * 0.01}
        />
        
        {/* Pillows (two) */}
        <g>
          {/* Left pillow */}
          <ellipse 
            cx={size * 0.28} 
            cy={size * 0.38} 
            rx={size * 0.13} 
            ry={size * 0.08} 
            fill={colors.pillowDark}
          />
          <ellipse 
            cx={size * 0.28} 
            cy={size * 0.36} 
            rx={size * 0.13} 
            ry={size * 0.08} 
            fill={colors.pillow}
          />
          <ellipse 
            cx={size * 0.28} 
            cy={size * 0.35} 
            rx={size * 0.11} 
            ry={size * 0.06} 
            fill={colors.pillowLight}
            opacity={0.7}
          />
          
          {/* Right pillow */}
          <ellipse 
            cx={size * 0.72} 
            cy={size * 0.38} 
            rx={size * 0.13} 
            ry={size * 0.08} 
            fill={colors.pillowDark}
          />
          <ellipse 
            cx={size * 0.72} 
            cy={size * 0.36} 
            rx={size * 0.13} 
            ry={size * 0.08} 
            fill={colors.pillow}
          />
          <ellipse 
            cx={size * 0.72} 
            cy={size * 0.35} 
            rx={size * 0.11} 
            ry={size * 0.06} 
            fill={colors.pillowLight}
            opacity={0.7}
          />
        </g>
        
        {/* Blanket with folds */}
        <polygon
          points={`
            ${size * 0.12},${size * 0.45}
            ${size * 0.88},${size * 0.45}
            ${size * 0.89},${size * 0.47}
            ${size * 0.89},${size * 0.68}
            ${size * 0.88},${size * 0.7}
            ${size * 0.12},${size * 0.7}
            ${size * 0.11},${size * 0.68}
            ${size * 0.11},${size * 0.47}
          `}
          fill={colors.blanketDark}
        />
        
        {/* Blanket top surface */}
        <polygon
          points={`
            ${size * 0.12},${size * 0.45}
            ${size * 0.88},${size * 0.45}
            ${size * 0.89},${size * 0.47}
            ${size * 0.11},${size * 0.47}
          `}
          fill={colors.blanket}
        />
        
        {/* Blanket fold/wrinkle lines for texture */}
        <line 
          x1={size * 0.15} y1={size * 0.48} 
          x2={size * 0.85} y2={size * 0.48} 
          stroke={colors.blanketLight} 
          strokeWidth={size * 0.015}
          opacity={0.5}
        />
        <path 
          d={`M ${size * 0.2} ${size * 0.55} Q ${size * 0.5} ${size * 0.53} ${size * 0.8} ${size * 0.55}`}
          stroke={colors.blanketDark} 
          strokeWidth={size * 0.01}
          fill="none"
          opacity={0.3}
        />
        <path 
          d={`M ${size * 0.2} ${size * 0.62} Q ${size * 0.5} ${size * 0.6} ${size * 0.8} ${size * 0.62}`}
          stroke={colors.blanketDark} 
          strokeWidth={size * 0.01}
          fill="none"
          opacity={0.3}
        />
        
        {/* Cultural blanket patterns */}
        {zone === 'MENA' || zone === 'NORTH_AFRICAN' ? (
          // Geometric pattern
          <g opacity={0.4}>
            <rect x={size * 0.45} y={size * 0.52} width={size * 0.1} height={size * 0.1} 
                  fill={colors.blanketPattern} />
            <rect x={size * 0.4} y={size * 0.57} width={size * 0.2} height={size * 0.02} 
                  fill={colors.blanketPattern} />
            <rect x={size * 0.48} y={size * 0.5} width={size * 0.04} height={size * 0.15} 
                  fill={colors.blanketPattern} />
          </g>
        ) : zone === 'EAST_ASIAN' ? (
          // Wave pattern
          <g opacity={0.3}>
            <path d={`M ${size * 0.2} ${size * 0.58} Q ${size * 0.35} ${size * 0.56} ${size * 0.5} ${size * 0.58} T ${size * 0.8} ${size * 0.58}`}
                  stroke={colors.blanketPattern} strokeWidth={size * 0.02} fill="none" />
          </g>
        ) : zone === 'SOUTH_ASIAN' ? (
          // Paisley dots
          <g opacity={0.3}>
            <circle cx={size * 0.3} cy={size * 0.58} r={size * 0.02} fill={colors.blanketPattern} />
            <circle cx={size * 0.5} cy={size * 0.55} r={size * 0.02} fill={colors.blanketPattern} />
            <circle cx={size * 0.7} cy={size * 0.58} r={size * 0.02} fill={colors.blanketPattern} />
          </g>
        ) : (
          // European stripes
          <g opacity={0.2}>
            <line x1={size * 0.2} y1={size * 0.5} x2={size * 0.2} y2={size * 0.65} 
                  stroke={colors.blanketPattern} strokeWidth={size * 0.02} />
            <line x1={size * 0.5} y1={size * 0.5} x2={size * 0.5} y2={size * 0.65} 
                  stroke={colors.blanketPattern} strokeWidth={size * 0.02} />
            <line x1={size * 0.8} y1={size * 0.5} x2={size * 0.8} y2={size * 0.65} 
                  stroke={colors.blanketPattern} strokeWidth={size * 0.02} />
          </g>
        )}
        
        {/* Footboard */}
        <rect 
          x={size * 0.08} 
          y={size * 0.72} 
          width={size * 0.84} 
          height={size * 0.12} 
          fill={colors.frameDark}
        />
        <rect 
          x={size * 0.1} 
          y={size * 0.73} 
          width={size * 0.8} 
          height={size * 0.09} 
          fill={colors.frame}
        />
        <rect 
          x={size * 0.12} 
          y={size * 0.74} 
          width={size * 0.76} 
          height={size * 0.06} 
          fill={colors.frameLight}
          opacity={0.7}
        />
        
        {/* Bed legs (visible at corners) */}
        <rect x={size * 0.1} y={size * 0.82} width={size * 0.08} height={size * 0.1} fill={colors.frameDark} />
        <rect x={size * 0.11} y={size * 0.82} width={size * 0.06} height={size * 0.08} fill={colors.frame} />
        
        <rect x={size * 0.82} y={size * 0.82} width={size * 0.08} height={size * 0.1} fill={colors.frameDark} />
        <rect x={size * 0.83} y={size * 0.82} width={size * 0.06} height={size * 0.08} fill={colors.frame} />
      </g>
    </svg>
  );
};

export default BedSymbol;