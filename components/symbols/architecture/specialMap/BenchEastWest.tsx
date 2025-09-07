/**
 * BenchEastWest.tsx - Bench optimized for East-West placement (horizontal)
 * Beautiful Stardew Valley/FF6 pixel art style with proper seating direction
 * Designed for people to sit facing North or South
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface BenchEastWestProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'simple' | 'padded' | 'stone' | 'ornate';
}

export const BenchEastWest: React.FC<BenchEastWestProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  culturalZone = 'EUROPEAN',
  variant = 'simple'
}) => {
  const getBenchStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        return {
          wood: getPixelColors('#8B4513'), // Oak
          cushion: getPixelColors('#8B0000'), // Deep red
          metal: MATERIAL_COLORS.metal.iron,
          stone: MATERIAL_COLORS.stone.granite
        };
      case 'EAST_ASIAN':
        return {
          wood: getPixelColors('#654321'), // Dark wood
          cushion: getPixelColors('#DC143C'), // Red silk
          metal: MATERIAL_COLORS.metal.brass,
          stone: MATERIAL_COLORS.stone.marble
        };
      case 'MENA':
        return {
          wood: getPixelColors('#DEB887'), // Light wood
          cushion: getPixelColors('#4169E1'), // Blue fabric
          metal: MATERIAL_COLORS.metal.brass,
          stone: MATERIAL_COLORS.stone.sandstone
        };
      default:
        return {
          wood: getPixelColors('#A0522D'),
          cushion: getPixelColors('#654321'),
          metal: MATERIAL_COLORS.metal.steel,
          stone: MATERIAL_COLORS.stone.limestone
        };
    }
  };
  
  const style = getBenchStyle();
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Shadow - wide horizontal */}
        <ellipse cx={size * 0.52} cy={size * 0.75} rx={size * 0.35} ry={size * 0.08} fill="#000000" opacity={0.25} />
        
        {variant === 'stone' ? (
          // Stone bench
          <g>
            {/* Stone base */}
            <rect x={size * 0.15} y={size * 0.5} width={size * 0.7} height={size * 0.2} fill={style.stone.base} />
            <rect x={size * 0.15} y={size * 0.5} width={size * 0.7} height={size * 0.03} fill={style.stone.light} />
            <rect x={size * 0.15} y={size * 0.67} width={size * 0.7} height={size * 0.03} fill={style.stone.dark} />
            
            {/* Stone texture */}
            <rect x={size * 0.2} y={size * 0.55} width={size * 0.6} height={size * 0.005} fill={style.stone.shadow} opacity={0.3} />
            <rect x={size * 0.18} y={size * 0.6} width={size * 0.64} height={size * 0.005} fill={style.stone.shadow} opacity={0.3} />
            
            {/* Stone supports */}
            <rect x={size * 0.2} y={size * 0.7} width={size * 0.12} height={size * 0.08} fill={style.stone.dark} />
            <rect x={size * 0.68} y={size * 0.7} width={size * 0.12} height={size * 0.08} fill={style.stone.dark} />
          </g>
        ) : (
          // Wood bench
          <g>
            {/* Legs positioned for horizontal bench */}
            <rect x={size * 0.2} y={size * 0.6} width={size * 0.06} height={size * 0.15} fill={style.wood.shadow} />
            <rect x={size * 0.74} y={size * 0.6} width={size * 0.06} height={size * 0.15} fill={style.wood.shadow} />
            
            {/* Leg highlights */}
            <rect x={size * 0.2} y={size * 0.6} width={size * 0.02} height={size * 0.15} fill={style.wood.light} opacity={0.6} />
            <rect x={size * 0.74} y={size * 0.6} width={size * 0.02} height={size * 0.15} fill={style.wood.light} opacity={0.6} />
            
            {/* Main seat - wide for horizontal seating */}
            <rect x={size * 0.15} y={size * 0.45} width={size * 0.7} height={size * 0.2} fill={style.wood.base} />
            
            {/* Top surface with 3D perspective */}
            <path d={`M ${size * 0.15} ${size * 0.45} L ${size * 0.2} ${size * 0.4} L ${size * 0.9} ${size * 0.4} L ${size * 0.85} ${size * 0.45} Z`}
                  fill={style.wood.light} />
            
            {/* Right edge for depth */}
            <path d={`M ${size * 0.85} ${size * 0.45} L ${size * 0.9} ${size * 0.4} L ${size * 0.9} ${size * 0.6} L ${size * 0.85} ${size * 0.65} Z`}
                  fill={style.wood.shadow} />
            
            {/* Wood grain running horizontally */}
            <rect x={size * 0.17} y={size * 0.48} width={size * 0.66} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
            <rect x={size * 0.16} y={size * 0.54} width={size * 0.68} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
            <rect x={size * 0.18} y={size * 0.6} width={size * 0.64} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
          </g>
        )}
        
        {/* Back support for sitting comfort */}
        {variant !== 'stone' && (
          <g>
            <rect x={size * 0.15} y={size * 0.35} width={size * 0.7} height={size * 0.12} fill={style.wood.base} />
            <path d={`M ${size * 0.15} ${size * 0.35} L ${size * 0.2} ${size * 0.3} L ${size * 0.9} ${size * 0.3} L ${size * 0.85} ${size * 0.35} Z`}
                  fill={style.wood.light} />
            <path d={`M ${size * 0.85} ${size * 0.35} L ${size * 0.9} ${size * 0.3} L ${size * 0.9} ${size * 0.42} L ${size * 0.85} ${size * 0.47} Z`}
                  fill={style.wood.shadow} />
          </g>
        )}
        
        {/* Padded cushions if padded variant */}
        {variant === 'padded' && (
          <g>
            {/* Seat cushion */}
            <ellipse cx={size * 0.35} cy={size * 0.52} rx={size * 0.12} ry={size * 0.08} fill={style.cushion.base} opacity={0.8} />
            <ellipse cx={size * 0.65} cy={size * 0.52} rx={size * 0.12} ry={size * 0.08} fill={style.cushion.base} opacity={0.8} />
            
            {/* Back cushions */}
            <ellipse cx={size * 0.35} cy={size * 0.41} rx={size * 0.1} ry={size * 0.06} fill={style.cushion.light} opacity={0.7} />
            <ellipse cx={size * 0.65} cy={size * 0.41} rx={size * 0.1} ry={size * 0.06} fill={style.cushion.light} opacity={0.7} />
          </g>
        )}
        
        {/* Ornate decorations if ornate variant */}
        {variant === 'ornate' && (
          <g>
            {/* Carved details along the length */}
            <circle cx={size * 0.25} cy={size * 0.4} r={size * 0.02} fill={style.wood.light} />
            <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.02} fill={style.wood.light} />
            <circle cx={size * 0.75} cy={size * 0.4} r={size * 0.02} fill={style.wood.light} />
            
            {/* Decorative edge */}
            <rect x={size * 0.15} y={size * 0.44} width={size * 0.7} height={size * 0.01} fill={style.wood.dark} />
          </g>
        )}
        
        {/* Support struts */}
        {variant !== 'stone' && (
          <rect x={size * 0.25} y={size * 0.63} width={size * 0.5} height={size * 0.03} fill={style.wood.dark} />
        )}
      </g>
    </svg>
  );
};