/**
 * PersianRugSymbol.tsx - SNES RPG-style Persian rug floor tiles
 * Rich, authentic Persian carpet patterns for MENA sacred spaces
 */
import React from 'react';

interface PersianRugSymbolProps {
  x: number;
  y: number;
  size: number;
  variant?: 'center' | 'border' | 'corner';
  colorScheme?: 'red' | 'blue' | 'green';
}

const PersianRugSymbol: React.FC<PersianRugSymbolProps> = ({ 
  x, 
  y, 
  size,
  variant = 'center',
  colorScheme = 'red'
}) => {
  const getColors = () => {
    switch (colorScheme) {
      case 'red':
        return {
          primary: '#8B0000',    // Dark red
          secondary: '#DC143C',   // Crimson
          accent: '#FFD700',      // Gold
          detail: '#4B0082',      // Indigo
          background: '#2F4F4F'   // Dark slate gray
        };
      case 'blue':
        return {
          primary: '#191970',    // Midnight blue
          secondary: '#4169E1',   // Royal blue
          accent: '#F0E68C',      // Khaki
          detail: '#8B4513',      // Saddle brown
          background: '#2F4F4F'
        };
      case 'green':
        return {
          primary: '#006400',    // Dark green
          secondary: '#228B22',   // Forest green
          accent: '#FFD700',      // Gold
          detail: '#8B0000',      // Dark red
          background: '#2F4F4F'
        };
      default:
        return {
          primary: '#8B0000',
          secondary: '#DC143C',
          accent: '#FFD700',
          detail: '#4B0082',
          background: '#2F4F4F'
        };
    }
  };
  
  const colors = getColors();
  
  if (variant === 'border') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Border pattern with intricate design */}
        <rect x={0} y={0} width={size} height={size} fill={colors.primary} />
        
        {/* Geometric border pattern */}
        <rect x={2} y={2} width={size - 4} height={size - 4} fill={colors.secondary} />
        <rect x={4} y={4} width={size - 8} height={size - 8} fill={colors.primary} />
        
        {/* Diamond motifs along edges */}
        <polygon points={`${size/2},6 ${size/2+3},9 ${size/2},12 ${size/2-3},9`} fill={colors.accent} />
        <polygon points={`${size/2},${size-12} ${size/2+3},${size-9} ${size/2},${size-6} ${size/2-3},${size-9}`} fill={colors.accent} />
        <polygon points={`6,${size/2} 9,${size/2+3} 12,${size/2} 9,${size/2-3}`} fill={colors.accent} />
        <polygon points={`${size-12},${size/2} ${size-9},${size/2+3} ${size-6},${size/2} ${size-9},${size/2-3}`} fill={colors.accent} />
        
        {/* Corner details */}
        <rect x={6} y={6} width={3} height={3} fill={colors.detail} />
        <rect x={size - 9} y={6} width={3} height={3} fill={colors.detail} />
        <rect x={6} y={size - 9} width={3} height={3} fill={colors.detail} />
        <rect x={size - 9} y={size - 9} width={3} height={3} fill={colors.detail} />
      </g>
    );
  }
  
  if (variant === 'corner') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Corner piece with medallion */}
        <rect x={0} y={0} width={size} height={size} fill={colors.primary} />
        
        {/* Corner medallion */}
        <circle cx={size * 0.3} cy={size * 0.3} r={size * 0.25} fill={colors.secondary} />
        <circle cx={size * 0.3} cy={size * 0.3} r={size * 0.2} fill={colors.primary} />
        <circle cx={size * 0.3} cy={size * 0.3} r={size * 0.15} fill={colors.accent} />
        <circle cx={size * 0.3} cy={size * 0.3} r={size * 0.1} fill={colors.detail} />
        
        {/* Radiating pattern */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
          const rad = angle * Math.PI / 180;
          const x1 = size * 0.3 + Math.cos(rad) * size * 0.1;
          const y1 = size * 0.3 + Math.sin(rad) * size * 0.1;
          const x2 = size * 0.3 + Math.cos(rad) * size * 0.2;
          const y2 = size * 0.3 + Math.sin(rad) * size * 0.2;
          return (
            <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.accent} strokeWidth={1} />
          );
        })}
        
        {/* Border continuation */}
        <rect x={0} y={size - 6} width={size} height={6} fill={colors.secondary} />
        <rect x={size - 6} y={0} width={6} height={size} fill={colors.secondary} />
        <rect x={1} y={size - 5} width={size - 2} height={4} fill={colors.primary} />
        <rect x={size - 5} y={1} width={4} height={size - 2} fill={colors.primary} />
      </g>
    );
  }
  
  // Center pattern (default)
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Base color */}
      <rect x={0} y={0} width={size} height={size} fill={colors.primary} />
      
      {/* Central medallion pattern */}
      <rect x={size * 0.25} y={size * 0.25} width={size * 0.5} height={size * 0.5} fill={colors.secondary} />
      <polygon 
        points={`${size/2},${size*0.3} ${size*0.7},${size/2} ${size/2},${size*0.7} ${size*0.3},${size/2}`} 
        fill={colors.accent} 
      />
      
      {/* Inner star pattern */}
      <polygon 
        points={`${size/2},${size*0.4} ${size*0.6},${size/2} ${size/2},${size*0.6} ${size*0.4},${size/2}`} 
        fill={colors.detail} 
      />
      
      {/* Corner ornaments */}
      <circle cx={size * 0.2} cy={size * 0.2} r={3} fill={colors.accent} />
      <circle cx={size * 0.8} cy={size * 0.2} r={3} fill={colors.accent} />
      <circle cx={size * 0.2} cy={size * 0.8} r={3} fill={colors.accent} />
      <circle cx={size * 0.8} cy={size * 0.8} r={3} fill={colors.accent} />
      
      {/* Fine detail lines */}
      <line x1={0} y1={size * 0.15} x2={size} y2={size * 0.15} stroke={colors.detail} strokeWidth={0.5} opacity={0.5} />
      <line x1={0} y1={size * 0.85} x2={size} y2={size * 0.85} stroke={colors.detail} strokeWidth={0.5} opacity={0.5} />
      <line x1={size * 0.15} y1={0} x2={size * 0.15} y2={size} stroke={colors.detail} strokeWidth={0.5} opacity={0.5} />
      <line x1={size * 0.85} y1={0} x2={size * 0.85} y2={size} stroke={colors.detail} strokeWidth={0.5} opacity={0.5} />
      
      {/* Tiny flower motifs */}
      <circle cx={size * 0.5} cy={size * 0.15} r={2} fill={colors.accent} />
      <circle cx={size * 0.5} cy={size * 0.85} r={2} fill={colors.accent} />
      <circle cx={size * 0.15} cy={size * 0.5} r={2} fill={colors.accent} />
      <circle cx={size * 0.85} cy={size * 0.5} r={2} fill={colors.accent} />
    </g>
  );
};

export default PersianRugSymbol;