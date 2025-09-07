/**
 * TableVertical.tsx - Table optimized for vertical (North-South) placement
 * Beautiful Stardew Valley/FF6 pixel art style with proper 3/4 perspective
 * Designed to look natural when placed vertically in rooms
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface TableVerticalProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'dining' | 'work' | 'ceremonial' | 'altar';
}

export const TableVertical: React.FC<TableVerticalProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  culturalZone = 'EUROPEAN',
  variant = 'dining'
}) => {
  const getTableStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        return {
          wood: getPixelColors('#8B4513'), // Rich oak
          cloth: getPixelColors('#8B0000'), // Deep red cloth
          metal: MATERIAL_COLORS.metal.iron,
          accent: '#FFD700'
        };
      case 'EAST_ASIAN':
        return {
          wood: getPixelColors('#2F4F4F'), // Dark lacquered wood
          cloth: getPixelColors('#DC143C'), // Red silk
          metal: MATERIAL_COLORS.metal.brass,
          accent: '#FFD700'
        };
      case 'MENA':
        return {
          wood: getPixelColors('#DEB887'), // Light wood
          cloth: getPixelColors('#4169E1'), // Blue fabric
          metal: MATERIAL_COLORS.metal.brass,
          accent: '#FFD700'
        };
      default:
        return {
          wood: getPixelColors('#A0522D'),
          cloth: getPixelColors('#654321'),
          metal: MATERIAL_COLORS.metal.steel,
          accent: '#DAA520'
        };
    }
  };
  
  const style = getTableStyle();
  
  // Vertical table is taller than it is wide
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Shadow - elongated vertically */}
        <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.25} ry={size * 0.12} fill="#000000" opacity={0.25} />
        
        {/* Table legs - positioned for vertical stability */}
        <rect x={size * 0.25} y={size * 0.65} width={size * 0.08} height={size * 0.2} fill={style.wood.shadow} />
        <rect x={size * 0.67} y={size * 0.65} width={size * 0.08} height={size * 0.2} fill={style.wood.shadow} />
        <rect x={size * 0.25} y={size * 0.35} width={size * 0.08} height={size * 0.2} fill={style.wood.shadow} />
        <rect x={size * 0.67} y={size * 0.35} width={size * 0.08} height={size * 0.2} fill={style.wood.shadow} />
        
        {/* Leg highlights */}
        <rect x={size * 0.25} y={size * 0.65} width={size * 0.03} height={size * 0.2} fill={style.wood.light} opacity={0.6} />
        <rect x={size * 0.67} y={size * 0.65} width={size * 0.03} height={size * 0.2} fill={style.wood.light} opacity={0.6} />
        <rect x={size * 0.25} y={size * 0.35} width={size * 0.03} height={size * 0.2} fill={style.wood.light} opacity={0.6} />
        <rect x={size * 0.67} y={size * 0.35} width={size * 0.03} height={size * 0.2} fill={style.wood.light} opacity={0.6} />
        
        {/* Vertical support beams */}
        <rect x={size * 0.3} y={size * 0.45} width={size * 0.04} height={size * 0.3} fill={style.wood.dark} />
        <rect x={size * 0.66} y={size * 0.45} width={size * 0.04} height={size * 0.3} fill={style.wood.dark} />
        <rect x={size * 0.3} y={size * 0.45} width={size * 0.04} height={size * 0.28} fill={style.wood.base} />
        <rect x={size * 0.66} y={size * 0.45} width={size * 0.04} height={size * 0.28} fill={style.wood.base} />
        
        {/* Main tabletop - tall rectangle optimized for vertical placement */}
        <rect x={size * 0.2} y={size * 0.25} width={size * 0.6} height={size * 0.5} fill={style.wood.base} />
        
        {/* Top surface with proper 3/4 perspective */}
        <path d={`M ${size * 0.2} ${size * 0.25} L ${size * 0.25} ${size * 0.2} L ${size * 0.85} ${size * 0.2} L ${size * 0.8} ${size * 0.25} Z`}
              fill={style.wood.light} />
        
        {/* Right edge for 3D effect */}
        <path d={`M ${size * 0.8} ${size * 0.25} L ${size * 0.85} ${size * 0.2} L ${size * 0.85} ${size * 0.7} L ${size * 0.8} ${size * 0.75} Z`}
              fill={style.wood.shadow} />
        
        {/* Wood grain texture running vertically */}
        <rect x={size * 0.25} y={size * 0.28} width={size * 0.005} height={size * 0.44} fill={style.wood.dark} opacity={0.3} />
        <rect x={size * 0.35} y={size * 0.27} width={size * 0.005} height={size * 0.46} fill={style.wood.dark} opacity={0.3} />
        <rect x={size * 0.45} y={size * 0.29} width={size * 0.005} height={size * 0.42} fill={style.wood.dark} opacity={0.3} />
        <rect x={size * 0.55} y={size * 0.28} width={size * 0.005} height={size * 0.44} fill={style.wood.dark} opacity={0.3} />
        <rect x={size * 0.65} y={size * 0.27} width={size * 0.005} height={size * 0.46} fill={style.wood.dark} opacity={0.3} />
        <rect x={size * 0.75} y={size * 0.28} width={size * 0.005} height={size * 0.44} fill={style.wood.dark} opacity={0.3} />
        
        {/* Table items based on variant */}
        {variant === 'dining' && (
          <g>
            {/* Place settings arranged vertically */}
            <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.04} fill="#F5F5DC" opacity={0.8} />
            <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.04} fill="#F5F5DC" opacity={0.8} />
            <circle cx={size * 0.5} cy={size * 0.65} r={size * 0.04} fill="#F5F5DC" opacity={0.8} />
            {/* Centerpiece */}
            <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.06} ry={size * 0.04} fill={style.accent} opacity={0.6} />
          </g>
        )}
        
        {variant === 'work' && (
          <g>
            {/* Work items arranged vertically */}
            <rect x={size * 0.3} y={size * 0.3} width={size * 0.4} height={size * 0.15} fill="#F5F5DC" opacity={0.7} />
            <rect x={size * 0.35} y={size * 0.55} width={size * 0.3} height={size * 0.08} fill="#8B4513" />
            <circle cx={size * 0.6} cy={size * 0.65} r={size * 0.03} fill={style.metal.base} />
          </g>
        )}
        
        {variant === 'altar' && (
          <g>
            {/* Religious items arranged vertically */}
            <rect x={size * 0.45} y={size * 0.3} width={size * 0.1} height={size * 0.15} fill={style.accent} opacity={0.8} />
            <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.05} fill="#FFD700" opacity={0.7} />
            <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.08} ry={size * 0.04} fill={style.cloth.base} opacity={0.6} />
          </g>
        )}
        
        {variant === 'ceremonial' && culturalZone === 'EAST_ASIAN' && (
          <g>
            {/* Asian ceremonial items arranged vertically */}
            <circle cx={size * 0.5} cy={size * 0.35} r={size * 0.03} fill={style.accent} />
            <rect x={size * 0.45} y={size * 0.45} width={size * 0.1} height={size * 0.08} fill={style.metal.brass.base} />
            <ellipse cx={size * 0.5} cy={size * 0.62} rx={size * 0.05} ry={size * 0.03} fill={style.cloth.base} />
          </g>
        )}
        
        {/* Decorative corner elements */}
        <circle cx={size * 0.22} cy={size * 0.27} r={size * 0.01} fill={style.accent} opacity={0.6} />
        <circle cx={size * 0.78} cy={size * 0.27} r={size * 0.01} fill={style.accent} opacity={0.6} />
        
        {/* Edge banding */}
        <rect x={size * 0.2} y={size * 0.25} width={size * 0.6} height={size * 0.01} fill={style.wood.dark} />
        <rect x={size * 0.2} y={size * 0.74} width={size * 0.6} height={size * 0.01} fill={style.wood.dark} />
        <rect x={size * 0.2} y={size * 0.25} width={size * 0.01} height={size * 0.5} fill={style.wood.dark} />
        <rect x={size * 0.79} y={size * 0.25} width={size * 0.01} height={size * 0.5} fill={style.wood.dark} />
      </g>
    </svg>
  );
};