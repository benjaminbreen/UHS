/**
 * BedHorizontal.tsx - Bed optimized for East-West placement (horizontal)
 * Beautiful Stardew Valley/FF6 pixel art style with proper sleeping orientation
 * Wide bed for horizontal rooms, sleeper faces North or South
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface BedHorizontalProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'simple' | 'luxury' | 'royal' | 'peasant';
}

export const BedHorizontal: React.FC<BedHorizontalProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  culturalZone = 'EUROPEAN',
  variant = 'simple'
}) => {
  const getBedStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        return {
          wood: getPixelColors('#8B4513'), // Oak
          fabric: getPixelColors('#8B0000'), // Deep red
          pillow: getPixelColors('#F5F5DC'), // Cream
          metal: MATERIAL_COLORS.metal.iron
        };
      case 'EAST_ASIAN':
        return {
          wood: getPixelColors('#654321'), // Dark wood
          fabric: getPixelColors('#DC143C'), // Silk red
          pillow: getPixelColors('#FFFAF0'), // Silk white
          metal: MATERIAL_COLORS.metal.brass
        };
      case 'MENA':
        return {
          wood: getPixelColors('#DEB887'), // Light wood
          fabric: getPixelColors('#4169E1'), // Blue fabric
          pillow: getPixelColors('#F0E68C'), // Gold
          metal: MATERIAL_COLORS.metal.brass
        };
      default:
        return {
          wood: getPixelColors('#A0522D'),
          fabric: getPixelColors('#654321'),
          pillow: getPixelColors('#FFFFFF'),
          metal: MATERIAL_COLORS.metal.steel
        };
    }
  };
  
  const style = getBedStyle();
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Shadow - wide horizontal */}
        <ellipse cx={size * 0.52} cy={size * 0.75} rx={size * 0.35} ry={size * 0.1} fill="#000000" opacity={0.25} />
        
        {/* Bed frame legs positioned for horizontal bed */}
        <rect x={size * 0.15} y={size * 0.6} width={size * 0.06} height={size * 0.15} fill={style.wood.shadow} />
        <rect x={size * 0.79} y={size * 0.6} width={size * 0.06} height={size * 0.15} fill={style.wood.shadow} />
        <rect x={size * 0.15} y={size * 0.35} width={size * 0.06} height={size * 0.15} fill={style.wood.shadow} />
        <rect x={size * 0.79} y={size * 0.35} width={size * 0.06} height={size * 0.15} fill={style.wood.shadow} />
        
        {/* Leg highlights */}
        <rect x={size * 0.15} y={size * 0.6} width={size * 0.02} height={size * 0.15} fill={style.wood.light} opacity={0.6} />
        <rect x={size * 0.79} y={size * 0.6} width={size * 0.02} height={size * 0.15} fill={style.wood.light} opacity={0.6} />
        
        {/* Main mattress area - wide for horizontal placement */}
        <rect x={size * 0.2} y={size * 0.35} width={size * 0.6} height={size * 0.3} fill={style.fabric.base} />
        
        {/* Mattress top with 3D perspective */}
        <path d={`M ${size * 0.2} ${size * 0.35} L ${size * 0.25} ${size * 0.3} L ${size * 0.85} ${size * 0.3} L ${size * 0.8} ${size * 0.35} Z`}
              fill={style.fabric.light} />
        
        {/* Right edge for depth */}
        <path d={`M ${size * 0.8} ${size * 0.35} L ${size * 0.85} ${size * 0.3} L ${size * 0.85} ${size * 0.6} L ${size * 0.8} ${size * 0.65} Z`}
              fill={style.fabric.shadow} />
        
        {/* Pillow positioned at head of bed (West end for horizontal bed) */}
        <ellipse cx={size * 0.3} cy={size * 0.4} rx={size * 0.08} ry={size * 0.06} fill={style.pillow.base} opacity={0.9} />
        <ellipse cx={size * 0.28} cy={size * 0.38} rx={size * 0.06} ry={size * 0.04} fill={style.pillow.light} opacity={0.7} />
        
        {/* Headboard for horizontal bed */}
        <rect x={size * 0.15} y={size * 0.25} width={size * 0.1} height={size * 0.35} fill={style.wood.base} />
        <path d={`M ${size * 0.15} ${size * 0.25} L ${size * 0.1} ${size * 0.2} L ${size * 0.2} ${size * 0.2} L ${size * 0.25} ${size * 0.25} Z`}
              fill={style.wood.light} />
        <path d={`M ${size * 0.25} ${size * 0.25} L ${size * 0.2} ${size * 0.2} L ${size * 0.2} ${size * 0.55} L ${size * 0.25} ${size * 0.6} Z`}
              fill={style.wood.shadow} />
        
        {/* Blanket - positioned horizontally across the bed */}
        <rect x={size * 0.4} y={size * 0.4} width={size * 0.35} height={size * 0.2} fill={style.fabric.dark} opacity={0.8} />
        <path d={`M ${size * 0.4} ${size * 0.4} L ${size * 0.45} ${size * 0.35} L ${size * 0.8} ${size * 0.35} L ${size * 0.75} ${size * 0.4} Z`}
              fill={style.fabric.light} opacity={0.6} />
        
        {/* Variant-specific decorations */}
        {variant === 'luxury' && (
          <g>
            {/* Decorative bed frame details */}
            <rect x={size * 0.17} y={size * 0.3} width={size * 0.06} height={size * 0.005} fill={style.metal.base} />
            <rect x={size * 0.17} y={size * 0.45} width={size * 0.06} height={size * 0.005} fill={style.metal.base} />
            <rect x={size * 0.17} y={size * 0.55} width={size * 0.06} height={size * 0.005} fill={style.metal.base} />
            
            {/* Extra pillow */}
            <ellipse cx={size * 0.42} cy={size * 0.42} rx={size * 0.06} ry={size * 0.04} fill={style.pillow.light} opacity={0.8} />
          </g>
        )}
        
        {variant === 'royal' && (
          <g>
            {/* Ornate headboard carvings */}
            <circle cx={size * 0.2} cy={size * 0.3} r={size * 0.015} fill={style.wood.light} />
            <circle cx={size * 0.2} cy={size * 0.4} r={size * 0.015} fill={style.wood.light} />
            <circle cx={size * 0.2} cy={size * 0.5} r={size * 0.015} fill={style.wood.light} />
            
            {/* Canopy supports */}
            <rect x={size * 0.12} y={size * 0.15} width={size * 0.02} height={size * 0.15} fill={style.wood.dark} />
            <rect x={size * 0.86} y={size * 0.15} width={size * 0.02} height={size * 0.15} fill={style.wood.dark} />
            
            {/* Rich fabric draping */}
            <path d={`M ${size * 0.12} ${size * 0.15} Q ${size * 0.5} ${size * 0.1} ${size * 0.88} ${size * 0.15}`} 
                  fill={style.fabric.base} opacity={0.3} />
          </g>
        )}
        
        {variant === 'peasant' && (
          <g>
            {/* Simple straw mattress texture */}
            <rect x={size * 0.22} y={size * 0.42} width={size * 0.56} height={size * 0.005} fill={style.fabric.dark} opacity={0.4} />
            <rect x={size * 0.23} y={size * 0.48} width={size * 0.54} height={size * 0.005} fill={style.fabric.dark} opacity={0.4} />
            <rect x={size * 0.21} y={size * 0.54} width={size * 0.58} height={size * 0.005} fill={style.fabric.dark} opacity={0.4} />
          </g>
        )}
        
        {/* Bed frame rails */}
        <rect x={size * 0.2} y={size * 0.32} width={size * 0.6} height={size * 0.03} fill={style.wood.dark} />
        <rect x={size * 0.2} y={size * 0.65} width={size * 0.6} height={size * 0.03} fill={style.wood.dark} />
      </g>
    </svg>
  );
};