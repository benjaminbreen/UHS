/**
 * MenaDecorativeTilePanel.tsx - Cultural decoration symbol for MENA zones
 * Beautiful Stardew Valley/FF6 pixel art style Islamic geometric tile panel
 * Features traditional Islamic geometric patterns and arabesque designs
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface MenaDecorativeTilePanelProps {
  x: number;
  y: number;
  size: number;
  variant?: 'geometric' | 'arabesque' | 'calligraphic' | 'royal';
}

export const MenaDecorativeTilePanel: React.FC<MenaDecorativeTilePanelProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  variant = 'geometric'
}) => {
  const getTileStyle = () => {
    switch (variant) {
      case 'geometric':
        return {
          base: '#F0E68C', // Khaki base
          pattern: '#4169E1', // Royal blue
          accent: '#FFD700', // Gold
          border: MATERIAL_COLORS.metal.brass,
          shadow: '#8B4513' // Saddle brown
        };
      case 'arabesque':
        return {
          base: '#DEB887', // Burlywood base
          pattern: '#006400', // Dark green
          accent: '#8B0000', // Dark red
          border: MATERIAL_COLORS.metal.brass,
          shadow: '#654321' // Dark brown
        };
      case 'calligraphic':
        return {
          base: '#FFFAF0', // Floral white
          pattern: '#000080', // Navy
          accent: '#DC143C', // Crimson
          border: MATERIAL_COLORS.metal.gold,
          shadow: '#2F4F4F' // Dark slate
        };
      case 'royal':
        return {
          base: '#F5DEB3', // Wheat
          pattern: '#8B0000', // Dark red
          accent: '#FFD700', // Gold
          border: MATERIAL_COLORS.metal.gold,
          shadow: '#8B4513' // Saddle brown
        };
      default:
        return {
          base: '#F0E68C',
          pattern: '#4169E1',
          accent: '#FFD700',
          border: MATERIAL_COLORS.metal.brass,
          shadow: '#8B4513'
        };
    }
  };
  
  const style = getTileStyle();
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Wall shadow */}
        <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.3} ry={size * 0.08} fill="#000000" opacity={0.25} />
        
        {/* Main tile panel base */}
        <rect x={size * 0.2} y={size * 0.15} width={size * 0.6} height={size * 0.6} fill={style.base} />
        
        {/* Tile border with brass/gold rim */}
        <rect x={size * 0.2} y={size * 0.15} width={size * 0.6} height={size * 0.6} 
              fill="none" stroke={style.border.base} strokeWidth={size * 0.015} />
        
        {/* Inner border */}
        <rect x={size * 0.22} y={size * 0.17} width={size * 0.56} height={size * 0.56} 
              fill="none" stroke={style.border.light} strokeWidth={size * 0.008} />
        
        {/* Pattern based on variant */}
        {variant === 'geometric' && (
          <g>
            {/* 8-pointed star (Khatam) pattern */}
            <polygon points={`${size * 0.5},${size * 0.25} ${size * 0.55},${size * 0.3} ${size * 0.6},${size * 0.25}
                             ${size * 0.65},${size * 0.35} ${size * 0.6},${size * 0.45} ${size * 0.65},${size * 0.55}
                             ${size * 0.55},${size * 0.6} ${size * 0.5},${size * 0.65} ${size * 0.45},${size * 0.6}
                             ${size * 0.35},${size * 0.55} ${size * 0.4},${size * 0.45} ${size * 0.35},${size * 0.35}
                             ${size * 0.4},${size * 0.25} ${size * 0.45},${size * 0.3}`}
                    fill={style.pattern} />
            
            {/* Central octagon */}
            <polygon points={`${size * 0.45},${size * 0.35} ${size * 0.55},${size * 0.35} ${size * 0.58},${size * 0.4}
                             ${size * 0.58},${size * 0.5} ${size * 0.55},${size * 0.55} ${size * 0.45},${size * 0.55}
                             ${size * 0.42},${size * 0.5} ${size * 0.42},${size * 0.4}`}
                    fill={style.accent} />
            
            {/* Corner squares */}
            <rect x={size * 0.25} y={size * 0.2} width={size * 0.08} height={size * 0.08} fill={style.pattern} />
            <rect x={size * 0.67} y={size * 0.2} width={size * 0.08} height={size * 0.08} fill={style.pattern} />
            <rect x={size * 0.25} y={size * 0.62} width={size * 0.08} height={size * 0.08} fill={style.pattern} />
            <rect x={size * 0.67} y={size * 0.62} width={size * 0.08} height={size * 0.08} fill={style.pattern} />
          </g>
        )}
        
        {variant === 'arabesque' && (
          <g>
            {/* Flowing vine pattern */}
            <path d={`M ${size * 0.25} ${size * 0.25} Q ${size * 0.35} ${size * 0.2} ${size * 0.45} ${size * 0.3}
                      Q ${size * 0.55} ${size * 0.4} ${size * 0.65} ${size * 0.3} Q ${size * 0.75} ${size * 0.2} ${size * 0.75} ${size * 0.35}
                      Q ${size * 0.7} ${size * 0.45} ${size * 0.65} ${size * 0.55} Q ${size * 0.55} ${size * 0.65} ${size * 0.45} ${size * 0.55}
                      Q ${size * 0.35} ${size * 0.65} ${size * 0.25} ${size * 0.55} Q ${size * 0.25} ${size * 0.45} ${size * 0.25} ${size * 0.35}`}
                  fill="none" stroke={style.pattern} strokeWidth={size * 0.02} />
            
            {/* Leaf motifs */}
            <ellipse cx={size * 0.35} cy={size * 0.35} rx={size * 0.03} ry={size * 0.02} fill={style.accent} transform={`rotate(45 ${size * 0.35} ${size * 0.35})`} />
            <ellipse cx={size * 0.65} cy={size * 0.35} rx={size * 0.03} ry={size * 0.02} fill={style.accent} transform={`rotate(-45 ${size * 0.65} ${size * 0.35})`} />
            <ellipse cx={size * 0.35} cy={size * 0.55} rx={size * 0.03} ry={size * 0.02} fill={style.accent} transform={`rotate(-45 ${size * 0.35} ${size * 0.55})`} />
            <ellipse cx={size * 0.65} cy={size * 0.55} rx={size * 0.03} ry={size * 0.02} fill={style.accent} transform={`rotate(45 ${size * 0.65} ${size * 0.55})`} />
            
            {/* Central rosette */}
            <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.04} fill={style.pattern} />
            <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.025} fill={style.accent} />
          </g>
        )}
        
        {variant === 'calligraphic' && (
          <g>
            {/* Arabic calligraphy-inspired geometric forms */}
            <rect x={size * 0.3} y={size * 0.25} width={size * 0.4} height={size * 0.05} fill={style.pattern} />
            <rect x={size * 0.45} y={size * 0.2} width={size * 0.1} height={size * 0.15} fill={style.pattern} />
            
            {/* Curved elements resembling Arabic letters */}
            <path d={`M ${size * 0.3} ${size * 0.4} Q ${size * 0.4} ${size * 0.35} ${size * 0.5} ${size * 0.4}
                      Q ${size * 0.6} ${size * 0.45} ${size * 0.7} ${size * 0.4}`}
                  fill="none" stroke={style.pattern} strokeWidth={size * 0.025} />
            
            <path d={`M ${size * 0.25} ${size * 0.55} Q ${size * 0.35} ${size * 0.5} ${size * 0.45} ${size * 0.55}
                      Q ${size * 0.55} ${size * 0.6} ${size * 0.65} ${size * 0.55} Q ${size * 0.75} ${size * 0.5} ${size * 0.75} ${size * 0.6}`}
                  fill="none" stroke={style.pattern} strokeWidth={size * 0.02} />
            
            {/* Decorative dots (diacritical marks) */}
            <circle cx={size * 0.4} cy={size * 0.32} r={size * 0.01} fill={style.accent} />
            <circle cx={size * 0.6} cy={size * 0.32} r={size * 0.01} fill={style.accent} />
            <circle cx={size * 0.35} cy={size * 0.48} r={size * 0.01} fill={style.accent} />
            <circle cx={size * 0.55} cy={size * 0.48} r={size * 0.01} fill={style.accent} />
          </g>
        )}
        
        {variant === 'royal' && (
          <g>
            {/* Elaborate muqarnas-inspired pattern */}
            <polygon points={`${size * 0.5},${size * 0.2} ${size * 0.6},${size * 0.3} ${size * 0.7},${size * 0.2}
                             ${size * 0.75},${size * 0.3} ${size * 0.7},${size * 0.4} ${size * 0.6},${size * 0.5}
                             ${size * 0.7},${size * 0.6} ${size * 0.75},${size * 0.7} ${size * 0.7},${size * 0.7}
                             ${size * 0.6},${size * 0.6} ${size * 0.5},${size * 0.7} ${size * 0.4},${size * 0.6}
                             ${size * 0.3},${size * 0.7} ${size * 0.25},${size * 0.7} ${size * 0.3},${size * 0.6}
                             ${size * 0.4},${size * 0.5} ${size * 0.3},${size * 0.4} ${size * 0.25},${size * 0.3}
                             ${size * 0.3},${size * 0.2} ${size * 0.4},${size * 0.3}`}
                    fill={style.pattern} />
            
            {/* Central dome motif */}
            <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.06} fill={style.accent} />
            <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.04} fill={style.base} />
            <circle cx={size * 0.5} cy={size * 0.45} r={size * 0.02} fill={style.pattern} />
            
            {/* Corner decorative elements */}
            <path d={`M ${size * 0.22} ${size * 0.22} L ${size * 0.28} ${size * 0.17} L ${size * 0.28} ${size * 0.27} Z`} fill={style.accent} />
            <path d={`M ${size * 0.78} ${size * 0.22} L ${size * 0.72} ${size * 0.17} L ${size * 0.72} ${size * 0.27} Z`} fill={style.accent} />
            <path d={`M ${size * 0.22} ${size * 0.68} L ${size * 0.28} ${size * 0.73} L ${size * 0.28} ${size * 0.63} Z`} fill={style.accent} />
            <path d={`M ${size * 0.78} ${size * 0.68} L ${size * 0.72} ${size * 0.73} L ${size * 0.72} ${size * 0.63} Z`} fill={style.accent} />
          </g>
        )}
        
        {/* Tile depth and dimensionality */}
        <rect x={size * 0.78} y={size * 0.17} width={size * 0.02} height={size * 0.58} fill={style.shadow} opacity={0.4} />
        <rect x={size * 0.22} y={size * 0.73} width={size * 0.58} height={size * 0.02} fill={style.shadow} opacity={0.3} />
        
        {/* Grout lines */}
        <rect x={size * 0.2} y={size * 0.4} width={size * 0.6} height={size * 0.008} fill={style.border.dark} opacity={0.3} />
        <rect x={size * 0.45} y={size * 0.15} width={size * 0.008} height={size * 0.6} fill={style.border.dark} opacity={0.3} />
        
        {/* Metallic shine on border */}
        <rect x={size * 0.2} y={size * 0.15} width={size * 0.6} height={size * 0.008} fill={style.border.light} opacity={0.8} />
        <rect x={size * 0.2} y={size * 0.15} width={size * 0.008} height={size * 0.6} fill={style.border.light} opacity={0.8} />
      </g>
    </svg>
  );
};