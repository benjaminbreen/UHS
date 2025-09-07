/**
 * AfricanDecorativeMask.tsx - Cultural decoration symbol for African zones
 * Beautiful Stardew Valley/FF6 pixel art style traditional African mask
 * Features traditional African mask designs with ceremonial patterns
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface AfricanDecorativeMaskProps {
  x: number;
  y: number;
  size: number;
  variant?: 'ceremonial' | 'ancestral' | 'warrior' | 'royal';
}

export const AfricanDecorativeMask: React.FC<AfricanDecorativeMaskProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  variant = 'ceremonial'
}) => {
  const getMaskStyle = () => {
    switch (variant) {
      case 'ceremonial':
        return {
          wood: getPixelColors('#8B4513'), // Saddle brown
          paint: ['#FFFFFF', '#000000', '#DC143C'], // White, black, red
          accent: '#FFD700', // Gold
          cord: '#654321' // Dark brown
        };
      case 'ancestral':
        return {
          wood: getPixelColors('#654321'), // Dark brown
          paint: ['#F5F5DC', '#8B4513', '#4B0082'], // Beige, brown, indigo
          accent: '#CD853F', // Peru
          cord: '#8B4513' // Saddle brown
        };
      case 'warrior':
        return {
          wood: getPixelColors('#A0522D'), // Sienna
          paint: ['#000000', '#DC143C', '#FFFFFF'], // Black, red, white
          accent: '#8B0000', // Dark red
          cord: '#000000' // Black
        };
      case 'royal':
        return {
          wood: getPixelColors('#DEB887'), // Burlywood
          paint: ['#FFD700', '#4B0082', '#FFFFFF'], // Gold, indigo, white
          accent: '#FFD700', // Gold
          cord: '#8B4513' // Saddle brown
        };
      default:
        return {
          wood: getPixelColors('#8B4513'),
          paint: ['#FFFFFF', '#000000', '#DC143C'],
          accent: '#FFD700',
          cord: '#654321'
        };
    }
  };
  
  const style = getMaskStyle();
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Wall shadow */}
        <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.25} ry={size * 0.08} fill="#000000" opacity={0.3} />
        
        {/* Hanging cord */}
        <rect x={size * 0.49} y={size * 0.05} width={size * 0.02} height={size * 0.1} fill={style.cord} />
        
        {/* Main mask face - elongated oval */}
        <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.15} ry={size * 0.25} fill={style.wood.base} />
        
        {/* Wood grain texture */}
        <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.13} ry={size * 0.23} fill={style.wood.light} opacity={0.3} />
        <rect x={size * 0.37} y={size * 0.25} width={size * 0.005} height={size * 0.4} fill={style.wood.dark} opacity={0.4} />
        <rect x={size * 0.45} y={size * 0.22} width={size * 0.005} height={size * 0.46} fill={style.wood.dark} opacity={0.4} />
        <rect x={size * 0.55} y={size * 0.23} width={size * 0.005} height={size * 0.44} fill={style.wood.dark} opacity={0.4} />
        <rect x={size * 0.63} y={size * 0.26} width={size * 0.005} height={size * 0.38} fill={style.wood.dark} opacity={0.4} />
        
        {/* Mask features based on variant */}
        {variant === 'ceremonial' && (
          <g>
            {/* Eyes - almond shaped */}
            <ellipse cx={size * 0.43} cy={size * 0.35} rx={size * 0.03} ry={size * 0.02} fill={style.paint[1]} />
            <ellipse cx={size * 0.57} cy={size * 0.35} rx={size * 0.03} ry={size * 0.02} fill={style.paint[1]} />
            <ellipse cx={size * 0.43} cy={size * 0.35} rx={size * 0.015} ry={size * 0.01} fill={style.paint[0]} />
            <ellipse cx={size * 0.57} cy={size * 0.35} rx={size * 0.015} ry={size * 0.01} fill={style.paint[0]} />
            
            {/* Nose - triangular */}
            <polygon points={`${size * 0.5},${size * 0.4} ${size * 0.47},${size * 0.47} ${size * 0.53},${size * 0.47}`} 
                     fill={style.wood.shadow} />
            
            {/* Mouth - rectangular */}
            <rect x={size * 0.47} y={size * 0.52} width={size * 0.06} height={size * 0.03} fill={style.paint[1]} />
            <rect x={size * 0.48} y={size * 0.53} width={size * 0.04} height={size * 0.01} fill={style.paint[2]} />
            
            {/* Forehead markings */}
            <rect x={size * 0.47} y={size * 0.25} width={size * 0.06} height={size * 0.015} fill={style.paint[0]} />
            <rect x={size * 0.48} y={size * 0.27} width={size * 0.04} height={size * 0.01} fill={style.paint[2]} />
            
            {/* Cheek patterns */}
            <circle cx={size * 0.38} cy={size * 0.45} r={size * 0.015} fill={style.paint[0]} />
            <circle cx={size * 0.62} cy={size * 0.45} r={size * 0.015} fill={style.paint[0]} />
            <circle cx={size * 0.36} cy={size * 0.48} r={size * 0.01} fill={style.paint[2]} />
            <circle cx={size * 0.64} cy={size * 0.48} r={size * 0.01} fill={style.paint[2]} />
          </g>
        )}
        
        {variant === 'ancestral' && (
          <g>
            {/* Deep-set eyes */}
            <rect x={size * 0.41} y={size * 0.33} width={size * 0.04} height={size * 0.04} fill={style.paint[1]} />
            <rect x={size * 0.55} y={size * 0.33} width={size * 0.04} height={size * 0.04} fill={style.paint[1]} />
            <circle cx={size * 0.43} cy={size * 0.35} r={size * 0.01} fill={style.paint[0]} />
            <circle cx={size * 0.57} cy={size * 0.35} r={size * 0.01} fill={style.paint[0]} />
            
            {/* Prominent nose */}
            <rect x={size * 0.48} y={size * 0.4} width={size * 0.04} height={size * 0.08} fill={style.wood.shadow} />
            <rect x={size * 0.485} y={size * 0.4} width={size * 0.03} height={size * 0.08} fill={style.wood.light} />
            
            {/* Small mouth */}
            <ellipse cx={size * 0.5} cy={size * 0.53} rx={size * 0.02} ry={size * 0.015} fill={style.paint[1]} />
            
            {/* Vertical lines on forehead */}
            <rect x={size * 0.46} y={size * 0.25} width={size * 0.01} height={size * 0.08} fill={style.paint[0]} />
            <rect x={size * 0.49} y={size * 0.24} width={size * 0.01} height={size * 0.09} fill={style.paint[0]} />
            <rect x={size * 0.52} y={size * 0.25} width={size * 0.01} height={size * 0.08} fill={style.paint[0]} />
            
            {/* Chin markings */}
            <rect x={size * 0.47} y={size * 0.58} width={size * 0.06} height={size * 0.01} fill={style.paint[2]} />
            <rect x={size * 0.48} y={size * 0.6} width={size * 0.04} height={size * 0.01} fill={style.paint[2]} />
          </g>
        )}
        
        {variant === 'warrior' && (
          <g>
            {/* Fierce angular eyes */}
            <polygon points={`${size * 0.4},${size * 0.34} ${size * 0.46},${size * 0.32} ${size * 0.46},${size * 0.38} ${size * 0.4},${size * 0.36}`}
                     fill={style.paint[0]} />
            <polygon points={`${size * 0.6},${size * 0.34} ${size * 0.54},${size * 0.32} ${size * 0.54},${size * 0.38} ${size * 0.6},${size * 0.36}`}
                     fill={style.paint[0]} />
            <circle cx={size * 0.43} cy={size * 0.35} r={size * 0.008} fill={style.paint[1]} />
            <circle cx={size * 0.57} cy={size * 0.35} r={size * 0.008} fill={style.paint[1]} />
            
            {/* Sharp nose */}
            <polygon points={`${size * 0.5},${size * 0.4} ${size * 0.46},${size * 0.48} ${size * 0.54},${size * 0.48}`} 
                     fill={style.wood.shadow} />
            
            {/* Bared teeth */}
            <rect x={size * 0.46} y={size * 0.52} width={size * 0.08} height={size * 0.04} fill={style.paint[0]} />
            <rect x={size * 0.47} y={size * 0.53} width={size * 0.01} height={size * 0.02} fill={style.paint[1]} />
            <rect x={size * 0.49} y={size * 0.53} width={size * 0.01} height={size * 0.02} fill={style.paint[1]} />
            <rect x={size * 0.51} y={size * 0.53} width={size * 0.01} height={size * 0.02} fill={style.paint[1]} />
            <rect x={size * 0.53} y={size * 0.53} width={size * 0.01} height={size * 0.02} fill={style.paint[1]} />
            
            {/* War paint stripes */}
            <rect x={size * 0.35} y={size * 0.3} width={size * 0.3} height={size * 0.015} fill={style.paint[1]} />
            <rect x={size * 0.36} y={size * 0.45} width={size * 0.28} height={size * 0.015} fill={style.paint[1]} />
            <rect x={size * 0.37} y={size * 0.6} width={size * 0.26} height={size * 0.015} fill={style.paint[1]} />
          </g>
        )}
        
        {variant === 'royal' && (
          <g>
            {/* Serene eyes */}
            <ellipse cx={size * 0.43} cy={size * 0.35} rx={size * 0.025} ry={size * 0.02} fill={style.paint[0]} />
            <ellipse cx={size * 0.57} cy={size * 0.35} rx={size * 0.025} ry={size * 0.02} fill={style.paint[0]} />
            <ellipse cx={size * 0.43} cy={size * 0.35} rx={size * 0.015} ry={size * 0.015} fill={style.paint[1]} />
            <ellipse cx={size * 0.57} cy={size * 0.35} rx={size * 0.015} ry={size * 0.015} fill={style.paint[1]} />
            
            {/* Refined nose */}
            <ellipse cx={size * 0.5} cy={size * 0.43} rx={size * 0.015} ry={size * 0.03} fill={style.wood.shadow} />
            
            {/* Gentle mouth */}
            <ellipse cx={size * 0.5} cy={size * 0.52} rx={size * 0.025} ry={size * 0.015} fill={style.paint[1]} />
            
            {/* Golden crown pattern */}
            <rect x={size * 0.4} y={size * 0.2} width={size * 0.2} height={size * 0.02} fill={style.accent} />
            <polygon points={`${size * 0.42},${size * 0.2} ${size * 0.45},${size * 0.17} ${size * 0.48},${size * 0.2}`} fill={style.accent} />
            <polygon points={`${size * 0.47},${size * 0.2} ${size * 0.5},${size * 0.15} ${size * 0.53},${size * 0.2}`} fill={style.accent} />
            <polygon points={`${size * 0.52},${size * 0.2} ${size * 0.55},${size * 0.17} ${size * 0.58},${size * 0.2}`} fill={style.accent} />
            
            {/* Royal markings */}
            <rect x={size * 0.47} y={size * 0.25} width={size * 0.06} height={size * 0.01} fill={style.paint[0]} />
            <rect x={size * 0.48} y={size * 0.27} width={size * 0.04} height={size * 0.01} fill={style.accent} />
          </g>
        )}
        
        {/* Side projections/ears */}
        <ellipse cx={size * 0.32} cy={size * 0.4} rx={size * 0.03} ry={size * 0.05} fill={style.wood.base} />
        <ellipse cx={size * 0.68} cy={size * 0.4} rx={size * 0.03} ry={size * 0.05} fill={style.wood.base} />
        
        {/* Ear decorations */}
        <circle cx={size * 0.32} cy={size * 0.38} r={size * 0.008} fill={style.accent} />
        <circle cx={size * 0.68} cy={size * 0.38} r={size * 0.008} fill={style.accent} />
        
        {/* Mask dimensionality */}
        <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.12} ry={size * 0.22} 
                 fill="none" stroke={style.wood.dark} strokeWidth={size * 0.005} opacity={0.3} />
        
        {/* Mounting hole */}
        <circle cx={size * 0.5} cy={size * 0.18} r={size * 0.015} fill={style.wood.shadow} />
        <circle cx={size * 0.5} cy={size * 0.18} r={size * 0.01} fill={style.wood.dark} />
      </g>
    </svg>
  );
};