/**
 * BenchNorthSouth.tsx - Bench optimized for North-South placement (vertical)
 * Beautiful Stardew Valley/FF6 pixel art style with proper seating direction
 * Designed for people to sit facing East or West
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface BenchNorthSouthProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'simple' | 'padded' | 'stone' | 'ornate';
}

export const BenchNorthSouth: React.FC<BenchNorthSouthProps> = ({ 
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
        {/* Shadow - vertical elongated */}
        <ellipse cx={size * 0.52} cy={size * 0.75} rx={size * 0.2} ry={size * 0.15} fill="#000000" opacity={0.25} />
        
        {variant === 'stone' ? (
          // Stone bench
          <g>
            {/* Stone base - tall for vertical orientation */}
            <rect x={size * 0.35} y={size * 0.2} width={size * 0.3} height={size * 0.5} fill={style.stone.base} />
            <rect x={size * 0.35} y={size * 0.2} width={size * 0.3} height={size * 0.03} fill={style.stone.light} />
            <rect x={size * 0.35} y={size * 0.67} width={size * 0.3} height={size * 0.03} fill={style.stone.dark} />
            
            {/* Stone texture */}
            <rect x={size * 0.38} y={size * 0.25} width={size * 0.005} height={size * 0.4} fill={style.stone.shadow} opacity={0.3} />
            <rect x={size * 0.45} y={size * 0.23} width={size * 0.005} height={size * 0.44} fill={style.stone.shadow} opacity={0.3} />
            <rect x={size * 0.52} y={size * 0.24} width={size * 0.005} height={size * 0.42} fill={style.stone.shadow} opacity={0.3} />
            <rect x={size * 0.59} y={size * 0.25} width={size * 0.005} height={size * 0.4} fill={style.stone.shadow} opacity={0.3} />
            
            {/* Stone supports */}
            <rect x={size * 0.3} y={size * 0.7} width={size * 0.15} height={size * 0.08} fill={style.stone.dark} />
            <rect x={size * 0.55} y={size * 0.7} width={size * 0.15} height={size * 0.08} fill={style.stone.dark} />
          </g>
        ) : (
          // Wood bench
          <g>
            {/* Legs positioned for vertical bench */}
            <rect x={size * 0.38} y={size * 0.6} width={size * 0.06} height={size * 0.15} fill={style.wood.shadow} />
            <rect x={size * 0.56} y={size * 0.6} width={size * 0.06} height={size * 0.15} fill={style.wood.shadow} />
            
            {/* Leg highlights */}
            <rect x={size * 0.38} y={size * 0.6} width={size * 0.02} height={size * 0.15} fill={style.wood.light} opacity={0.6} />
            <rect x={size * 0.56} y={size * 0.6} width={size * 0.02} height={size * 0.15} fill={style.wood.light} opacity={0.6} />
            
            {/* Main seat - narrow for vertical seating */}
            <rect x={size * 0.3} y={size * 0.2} width={size * 0.4} height={size * 0.45} fill={style.wood.base} />
            
            {/* Top surface with 3D perspective */}
            <path d={`M ${size * 0.3} ${size * 0.2} L ${size * 0.35} ${size * 0.15} L ${size * 0.75} ${size * 0.15} L ${size * 0.7} ${size * 0.2} Z`}
                  fill={style.wood.light} />
            
            {/* Right edge for depth */}
            <path d={`M ${size * 0.7} ${size * 0.2} L ${size * 0.75} ${size * 0.15} L ${size * 0.75} ${size * 0.6} L ${size * 0.7} ${size * 0.65} Z`}
                  fill={style.wood.shadow} />
            
            {/* Wood grain running vertically */}
            <rect x={size * 0.33} y={size * 0.23} width={size * 0.005} height={size * 0.39} fill={style.wood.dark} opacity={0.3} />
            <rect x={size * 0.4} y={size * 0.22} width={size * 0.005} height={size * 0.41} fill={style.wood.dark} opacity={0.3} />
            <rect x={size * 0.47} y={size * 0.24} width={size * 0.005} height={size * 0.37} fill={style.wood.dark} opacity={0.3} />
            <rect x={size * 0.54} y={size * 0.23} width={size * 0.005} height={size * 0.39} fill={style.wood.dark} opacity={0.3} />
            <rect x={size * 0.61} y={size * 0.22} width={size * 0.005} height={size * 0.41} fill={style.wood.dark} opacity={0.3} />
            <rect x={size * 0.67} y={size * 0.24} width={size * 0.005} height={size * 0.37} fill={style.wood.dark} opacity={0.3} />
          </g>
        )}
        
        {/* Side back support for comfort */}
        {variant !== 'stone' && (
          <g>
            <rect x={size * 0.25} y={size * 0.2} width={size * 0.08} height={size * 0.45} fill={style.wood.base} />
            <path d={`M ${size * 0.25} ${size * 0.2} L ${size * 0.2} ${size * 0.15} L ${size * 0.28} ${size * 0.15} L ${size * 0.33} ${size * 0.2} Z`}
                  fill={style.wood.light} />
            <path d={`M ${size * 0.25} ${size * 0.2} L ${size * 0.2} ${size * 0.15} L ${size * 0.2} ${size * 0.6} L ${size * 0.25} ${size * 0.65} Z`}
                  fill={style.wood.shadow} />
          </g>
        )}
        
        {/* Padded cushions if padded variant */}
        {variant === 'padded' && (
          <g>
            {/* Seat cushions arranged vertically */}
            <ellipse cx={size * 0.5} cy={size * 0.35} rx={size * 0.08} ry={size * 0.1} fill={style.cushion.base} opacity={0.8} />
            <ellipse cx={size * 0.5} cy={size * 0.55} rx={size * 0.08} ry={size * 0.1} fill={style.cushion.base} opacity={0.8} />
            
            {/* Side back cushion */}
            <ellipse cx={size * 0.29} cy={size * 0.45} rx={size * 0.04} ry={size * 0.15} fill={style.cushion.light} opacity={0.7} />
          </g>
        )}
        
        {/* Ornate decorations if ornate variant */}
        {variant === 'ornate' && (
          <g>
            {/* Carved details along the length */}
            <circle cx={size * 0.5} cy={size * 0.25} r={size * 0.02} fill={style.wood.light} />
            <circle cx={size * 0.5} cy={size * 0.4} r={size * 0.02} fill={style.wood.light} />
            <circle cx={size * 0.5} cy={size * 0.55} r={size * 0.02} fill={style.wood.light} />
            
            {/* Decorative edges */}
            <rect x={size * 0.29} y={size * 0.2} width={size * 0.01} height={size * 0.45} fill={style.wood.dark} />
            <rect x={size * 0.7} y={size * 0.2} width={size * 0.01} height={size * 0.45} fill={style.wood.dark} />
          </g>
        )}
        
        {/* Support struts */}
        {variant !== 'stone' && (
          <rect x={size * 0.42} y={size * 0.63} width={size * 0.16} height={size * 0.03} fill={style.wood.dark} />
        )}
      </g>
    </svg>
  );
};