/**
 * EastAsianDecorativeScroll.tsx - Cultural decoration symbol for East Asian zones
 * Beautiful Stardew Valley/FF6 pixel art style hanging scroll with calligraphy
 * Features traditional Chinese/Japanese hanging scroll with bamboo roller
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface EastAsianDecorativeScrollProps {
  x: number;
  y: number;
  size: number;
  variant?: 'poetry' | 'landscape' | 'calligraphy' | 'imperial';
}

export const EastAsianDecorativeScroll: React.FC<EastAsianDecorativeScrollProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  variant = 'calligraphy'
}) => {
  const getScrollStyle = () => {
    switch (variant) {
      case 'poetry':
        return {
          paper: '#FFFAF0', // Silk white
          ink: '#000000', // Black ink
          accent: '#8B0000', // Red seal
          bamboo: getPixelColors('#DEB887'), // Light bamboo
          cord: '#8B4513' // Brown cord
        };
      case 'landscape':
        return {
          paper: '#F5F5DC', // Cream
          ink: '#2F4F4F', // Dark slate
          accent: '#006400', // Green mountains
          bamboo: getPixelColors('#654321'), // Dark bamboo
          cord: '#654321' // Dark cord
        };
      case 'calligraphy':
        return {
          paper: '#FFFAF0', // Pure white
          ink: '#000000', // Pure black
          accent: '#DC143C', // Crimson seal
          bamboo: getPixelColors('#DEB887'), // Natural bamboo
          cord: '#8B4513' // Brown cord
        };
      case 'imperial':
        return {
          paper: '#FDF5E6', // Old lace
          ink: '#000080', // Navy
          accent: '#FFD700', // Gold seal
          bamboo: getPixelColors('#8B4513'), // Rich bamboo
          cord: '#FFD700' // Gold cord
        };
      default:
        return {
          paper: '#FFFAF0',
          ink: '#000000',
          accent: '#DC143C',
          bamboo: getPixelColors('#DEB887'),
          cord: '#8B4513'
        };
    }
  };
  
  const style = getScrollStyle();
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Wall shadow */}
        <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.2} ry={size * 0.08} fill="#000000" opacity={0.25} />
        
        {/* Hanging cord */}
        <rect x={size * 0.49} y={size * 0.05} width={size * 0.02} height={size * 0.15} fill={style.cord} />
        
        {/* Top bamboo roller */}
        <rect x={size * 0.25} y={size * 0.18} width={size * 0.5} height={size * 0.04} fill={style.bamboo.base} />
        <rect x={size * 0.25} y={size * 0.18} width={size * 0.5} height={size * 0.01} fill={style.bamboo.light} />
        <rect x={size * 0.25} y={size * 0.21} width={size * 0.5} height={size * 0.01} fill={style.bamboo.shadow} />
        
        {/* Bamboo segments */}
        <rect x={size * 0.35} y={size * 0.18} width={size * 0.005} height={size * 0.04} fill={style.bamboo.dark} />
        <rect x={size * 0.45} y={size * 0.18} width={size * 0.005} height={size * 0.04} fill={style.bamboo.dark} />
        <rect x={size * 0.55} y={size * 0.18} width={size * 0.005} height={size * 0.04} fill={style.bamboo.dark} />
        <rect x={size * 0.65} y={size * 0.18} width={size * 0.005} height={size * 0.04} fill={style.bamboo.dark} />
        
        {/* Main scroll paper */}
        <rect x={size * 0.28} y={size * 0.22} width={size * 0.44} height={size * 0.5} fill={style.paper} />
        
        {/* Paper texture and aging */}
        <rect x={size * 0.28} y={size * 0.22} width={size * 0.44} height={size * 0.01} fill={style.bamboo.light} opacity={0.3} />
        <rect x={size * 0.28} y={size * 0.71} width={size * 0.44} height={size * 0.01} fill={style.bamboo.shadow} opacity={0.2} />
        
        {/* Content based on variant */}
        {variant === 'poetry' && (
          <g>
            {/* Vertical text columns (representing Chinese/Japanese poetry) */}
            <rect x={size * 0.35} y={size * 0.28} width={size * 0.015} height={size * 0.35} fill={style.ink} opacity={0.8} />
            <rect x={size * 0.4} y={size * 0.26} width={size * 0.015} height={size * 0.38} fill={style.ink} opacity={0.8} />
            <rect x={size * 0.45} y={size * 0.29} width={size * 0.015} height={size * 0.32} fill={style.ink} opacity={0.8} />
            <rect x={size * 0.5} y={size * 0.27} width={size * 0.015} height={size * 0.36} fill={style.ink} opacity={0.8} />
            <rect x={size * 0.55} y={size * 0.28} width={size * 0.015} height={size * 0.34} fill={style.ink} opacity={0.8} />
            <rect x={size * 0.6} y={size * 0.26} width={size * 0.015} height={size * 0.37} fill={style.ink} opacity={0.8} />
            
            {/* Individual characters represented as small rectangles */}
            <rect x={size * 0.35} y={size * 0.3} width={size * 0.015} height={size * 0.02} fill={style.paper} />
            <rect x={size * 0.35} y={size * 0.35} width={size * 0.015} height={size * 0.02} fill={style.paper} />
            <rect x={size * 0.4} y={size * 0.32} width={size * 0.015} height={size * 0.02} fill={style.paper} />
            <rect x={size * 0.45} y={size * 0.33} width={size * 0.015} height={size * 0.02} fill={style.paper} />
          </g>
        )}
        
        {variant === 'landscape' && (
          <g>
            {/* Mountain silhouette */}
            <path d={`M ${size * 0.3} ${size * 0.45} L ${size * 0.35} ${size * 0.35} L ${size * 0.42} ${size * 0.4} 
                      L ${size * 0.48} ${size * 0.3} L ${size * 0.55} ${size * 0.38} L ${size * 0.62} ${size * 0.32}
                      L ${size * 0.68} ${size * 0.42} L ${size * 0.7} ${size * 0.45} Z`}
                  fill={style.accent} opacity={0.6} />
            
            {/* Water/river */}
            <path d={`M ${size * 0.3} ${size * 0.55} Q ${size * 0.4} ${size * 0.52} ${size * 0.5} ${size * 0.55}
                      Q ${size * 0.6} ${size * 0.58} ${size * 0.7} ${size * 0.55}`}
                  fill="none" stroke={style.ink} strokeWidth={size * 0.01} />
            
            {/* Trees */}
            <circle cx={size * 0.33} cy={size * 0.5} r={size * 0.01} fill={style.accent} />
            <circle cx={size * 0.65} cy={size * 0.48} r={size * 0.015} fill={style.accent} />
          </g>
        )}
        
        {variant === 'calligraphy' && (
          <g>
            {/* Large central character (representing virtue/wisdom) */}
            <rect x={size * 0.45} y={size * 0.3} width={size * 0.1} height={size * 0.25} fill={style.ink} opacity={0.9} />
            <rect x={size * 0.47} y={size * 0.32} width={size * 0.06} height={size * 0.21} fill={style.paper} />
            
            {/* Character strokes */}
            <rect x={size * 0.45} y={size * 0.35} width={size * 0.1} height={size * 0.015} fill={style.ink} />
            <rect x={size * 0.49} y={size * 0.3} width={size * 0.02} height={size * 0.25} fill={style.ink} />
            <rect x={size * 0.45} y={size * 0.45} width={size * 0.1} height={size * 0.015} fill={style.ink} />
            
            {/* Smaller characters */}
            <rect x={size * 0.35} y={size * 0.6} width={size * 0.02} height={size * 0.03} fill={style.ink} opacity={0.7} />
            <rect x={size * 0.38} y={size * 0.6} width={size * 0.02} height={size * 0.03} fill={style.ink} opacity={0.7} />
            <rect x={size * 0.6} y={size * 0.6} width={size * 0.02} height={size * 0.03} fill={style.ink} opacity={0.7} />
            <rect x={size * 0.63} y={size * 0.6} width={size * 0.02} height={size * 0.03} fill={style.ink} opacity={0.7} />
          </g>
        )}
        
        {variant === 'imperial' && (
          <g>
            {/* Dragon motif */}
            <path d={`M ${size * 0.32} ${size * 0.4} Q ${size * 0.4} ${size * 0.35} ${size * 0.5} ${size * 0.4}
                      Q ${size * 0.6} ${size * 0.45} ${size * 0.68} ${size * 0.4}`}
                  fill="none" stroke={style.ink} strokeWidth={size * 0.02} />
            
            {/* Dragon head */}
            <circle cx={size * 0.32} cy={size * 0.4} r={size * 0.02} fill={style.ink} />
            <circle cx={size * 0.3} cy={size * 0.39} r={size * 0.005} fill={style.accent} />
            
            {/* Dragon scales */}
            <circle cx={size * 0.42} cy={size * 0.38} r={size * 0.008} fill={style.ink} opacity={0.5} />
            <circle cx={size * 0.52} cy={size * 0.42} r={size * 0.008} fill={style.ink} opacity={0.5} />
            <circle cx={size * 0.62} cy={size * 0.43} r={size * 0.008} fill={style.ink} opacity={0.5} />
            
            {/* Imperial seal */}
            <rect x={size * 0.6} y={size * 0.58} width={size * 0.08} height={size * 0.08} fill={style.accent} opacity={0.8} />
            <rect x={size * 0.61} y={size * 0.59} width={size * 0.06} height={size * 0.06} fill={style.paper} />
          </g>
        )}
        
        {/* Red seal/stamp (common to all variants) */}
        <rect x={size * 0.32} y={size * 0.58} width={size * 0.06} height={size * 0.06} fill={style.accent} opacity={0.8} />
        <rect x={size * 0.33} y={size * 0.59} width={size * 0.04} height={size * 0.04} fill={style.paper} />
        <rect x={size * 0.34} y={size * 0.6} width={size * 0.02} height={size * 0.02} fill={style.accent} />
        
        {/* Bottom bamboo roller */}
        <rect x={size * 0.25} y={size * 0.72} width={size * 0.5} height={size * 0.04} fill={style.bamboo.base} />
        <rect x={size * 0.25} y={size * 0.72} width={size * 0.5} height={size * 0.01} fill={style.bamboo.light} />
        <rect x={size * 0.25} y={size * 0.75} width={size * 0.5} height={size * 0.01} fill={style.bamboo.shadow} />
        
        {/* Bottom bamboo segments */}
        <rect x={size * 0.35} y={size * 0.72} width={size * 0.005} height={size * 0.04} fill={style.bamboo.dark} />
        <rect x={size * 0.45} y={size * 0.72} width={size * 0.005} height={size * 0.04} fill={style.bamboo.dark} />
        <rect x={size * 0.55} y={size * 0.72} width={size * 0.005} height={size * 0.04} fill={style.bamboo.dark} />
        <rect x={size * 0.65} y={size * 0.72} width={size * 0.005} height={size * 0.04} fill={style.bamboo.dark} />
        
        {/* Scroll depth shadow */}
        <rect x={size * 0.7} y={size * 0.22} width={size * 0.02} height={size * 0.5} fill="#000000" opacity={0.2} />
        <rect x={size * 0.28} y={size * 0.7} width={size * 0.44} height={size * 0.02} fill="#000000" opacity={0.15} />
      </g>
    </svg>
  );
};