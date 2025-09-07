/**
 * TableHorizontal.tsx - Table optimized for horizontal (East-West) placement
 * Beautiful Stardew Valley/FF6 pixel art style with proper 3/4 perspective
 * Designed to look natural when placed horizontally in rooms
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface TableHorizontalProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'dining' | 'work' | 'ceremonial' | 'feast';
}

export const TableHorizontal: React.FC<TableHorizontalProps> = ({ 
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
  
  // Horizontal table is wider than it is tall
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Shadow - elongated horizontally */}
        <ellipse cx={size * 0.52} cy={size * 0.82} rx={size * 0.4} ry={size * 0.1} fill="#000000" opacity={0.25} />
        
        {/* Table legs - positioned for horizontal stability */}
        <rect x={size * 0.15} y={size * 0.6} width={size * 0.08} height={size * 0.2} fill={style.wood.shadow} />
        <rect x={size * 0.77} y={size * 0.6} width={size * 0.08} height={size * 0.2} fill={style.wood.shadow} />
        <rect x={size * 0.15} y={size * 0.45} width={size * 0.08} height={size * 0.2} fill={style.wood.shadow} />
        <rect x={size * 0.77} y={size * 0.45} width={size * 0.08} height={size * 0.2} fill={style.wood.shadow} />
        
        {/* Leg highlights */}
        <rect x={size * 0.15} y={size * 0.6} width={size * 0.03} height={size * 0.2} fill={style.wood.light} opacity={0.6} />
        <rect x={size * 0.77} y={size * 0.6} width={size * 0.03} height={size * 0.2} fill={style.wood.light} opacity={0.6} />
        <rect x={size * 0.15} y={size * 0.45} width={size * 0.03} height={size * 0.2} fill={style.wood.light} opacity={0.6} />
        <rect x={size * 0.77} y={size * 0.45} width={size * 0.03} height={size * 0.2} fill={style.wood.light} opacity={0.6} />
        
        {/* Horizontal support beam */}
        <rect x={size * 0.2} y={size * 0.7} width={size * 0.6} height={size * 0.04} fill={style.wood.dark} />
        <rect x={size * 0.2} y={size * 0.7} width={size * 0.6} height={size * 0.02} fill={style.wood.base} />
        
        {/* Main tabletop - wide rectangle optimized for horizontal placement */}
        <rect x={size * 0.1} y={size * 0.4} width={size * 0.8} height={size * 0.25} fill={style.wood.base} />
        
        {/* Top surface with proper 3/4 perspective */}
        <path d={`M ${size * 0.1} ${size * 0.4} L ${size * 0.15} ${size * 0.35} L ${size * 0.95} ${size * 0.35} L ${size * 0.9} ${size * 0.4} Z`}
              fill={style.wood.light} />
        
        {/* Right edge for 3D effect */}
        <path d={`M ${size * 0.9} ${size * 0.4} L ${size * 0.95} ${size * 0.35} L ${size * 0.95} ${size * 0.6} L ${size * 0.9} ${size * 0.65} Z`}
              fill={style.wood.shadow} />
        
        {/* Wood grain texture running horizontally */}
        <rect x={size * 0.12} y={size * 0.42} width={size * 0.76} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
        <rect x={size * 0.14} y={size * 0.48} width={size * 0.72} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
        <rect x={size * 0.11} y={size * 0.54} width={size * 0.78} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
        <rect x={size * 0.13} y={size * 0.6} width={size * 0.74} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
        
        {/* Table items based on variant */}
        {variant === 'dining' && (
          <g>
            {/* Place settings along the length */}
            <circle cx={size * 0.25} cy={size * 0.5} r={size * 0.04} fill="#F5F5DC" opacity={0.8} />
            <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.04} fill="#F5F5DC" opacity={0.8} />
            <circle cx={size * 0.75} cy={size * 0.5} r={size * 0.04} fill="#F5F5DC" opacity={0.8} />
            {/* Candlestick in center */}
            <rect x={size * 0.495} y={size * 0.45} width={size * 0.01} height={size * 0.08} fill={style.metal.base} />
            <ellipse cx={size * 0.5} cy={size * 0.44} rx={size * 0.02} ry={size * 0.015} fill="#FFED4E" opacity={0.7} />
          </g>
        )}
        
        {variant === 'work' && (
          <g>
            {/* Scattered tools and papers */}
            <rect x={size * 0.2} y={size * 0.47} width={size * 0.15} height={size * 0.08} fill="#F5F5DC" opacity={0.7} />
            <rect x={size * 0.6} y={size * 0.45} width={size * 0.12} height={size * 0.06} fill="#8B4513" />
            <circle cx={size * 0.7} cy={size * 0.52} r={size * 0.02} fill={style.metal.base} />
          </g>
        )}
        
        {variant === 'feast' && (
          <g>
            {/* Long feast items */}
            <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.25} ry={size * 0.08} fill="#CD853F" opacity={0.6} />
            <ellipse cx={size * 0.3} cy={size * 0.48} rx={size * 0.06} ry={size * 0.04} fill="#8B0000" opacity={0.7} />
            <ellipse cx={size * 0.7} cy={size * 0.52} rx={size * 0.06} ry={size * 0.04} fill="#228B22" opacity={0.7} />
          </g>
        )}
        
        {variant === 'ceremonial' && culturalZone === 'EAST_ASIAN' && (
          <g>
            {/* Tea ceremony items arranged horizontally */}
            <ellipse cx={size * 0.35} cy={size * 0.5} rx={size * 0.03} ry={size * 0.025} fill={style.accent} />
            <ellipse cx={size * 0.5} cy={size * 0.5} rx={size * 0.04} ry={size * 0.03} fill={style.metal.brass.base} />
            <ellipse cx={size * 0.65} cy={size * 0.5} rx={size * 0.03} ry={size * 0.025} fill={style.accent} />
          </g>
        )}
        
        {/* Corner decorative elements */}
        <circle cx={size * 0.12} cy={size * 0.42} r={size * 0.01} fill={style.accent} opacity={0.6} />
        <circle cx={size * 0.88} cy={size * 0.42} r={size * 0.01} fill={style.accent} opacity={0.6} />
        
        {/* Edge banding */}
        <rect x={size * 0.1} y={size * 0.4} width={size * 0.8} height={size * 0.01} fill={style.wood.dark} />
        <rect x={size * 0.1} y={size * 0.64} width={size * 0.8} height={size * 0.01} fill={style.wood.dark} />
      </g>
    </svg>
  );
};