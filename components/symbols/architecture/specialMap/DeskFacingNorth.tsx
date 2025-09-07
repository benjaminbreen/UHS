/**
 * DeskFacingNorth.tsx - Desk with chair/workspace facing North
 * Beautiful Stardew Valley/FF6 pixel art style optimized for North-facing work
 * Chair positioned on South side, work surface accessible from South
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface DeskFacingNorthProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'scholar' | 'scribe' | 'merchant' | 'clerk';
}

export const DeskFacingNorth: React.FC<DeskFacingNorthProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  culturalZone = 'EUROPEAN',
  variant = 'scholar'
}) => {
  const getDeskStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        return {
          wood: getPixelColors('#8B4513'), // Rich oak
          metal: MATERIAL_COLORS.metal.iron,
          paper: '#F5F5DC',
          ink: '#000080'
        };
      case 'EAST_ASIAN':
        return {
          wood: getPixelColors('#2F4F4F'), // Dark lacquered
          metal: MATERIAL_COLORS.metal.brass,
          paper: '#FFFAF0',
          ink: '#000000'
        };
      case 'MENA':
        return {
          wood: getPixelColors('#DEB887'), // Light wood
          metal: MATERIAL_COLORS.metal.brass,
          paper: '#FDF5E6',
          ink: '#8B4513'
        };
      default:
        return {
          wood: getPixelColors('#A0522D'),
          metal: MATERIAL_COLORS.metal.steel,
          paper: '#FFFFFF',
          ink: '#000000'
        };
    }
  };
  
  const style = getDeskStyle();
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Shadow */}
        <ellipse cx={size * 0.52} cy={size * 0.82} rx={size * 0.35} ry={size * 0.1} fill="#000000" opacity={0.25} />
        
        {/* Desk legs */}
        <rect x={size * 0.2} y={size * 0.5} width={size * 0.08} height={size * 0.3} fill={style.wood.shadow} />
        <rect x={size * 0.72} y={size * 0.5} width={size * 0.08} height={size * 0.3} fill={style.wood.shadow} />
        
        {/* Leg highlights */}
        <rect x={size * 0.2} y={size * 0.5} width={size * 0.03} height={size * 0.3} fill={style.wood.light} opacity={0.6} />
        <rect x={size * 0.72} y={size * 0.5} width={size * 0.03} height={size * 0.3} fill={style.wood.light} opacity={0.6} />
        
        {/* Main desktop surface */}
        <rect x={size * 0.15} y={size * 0.3} width={size * 0.7} height={size * 0.25} fill={style.wood.base} />
        
        {/* Desktop top with 3D perspective */}
        <path d={`M ${size * 0.15} ${size * 0.3} L ${size * 0.2} ${size * 0.25} L ${size * 0.9} ${size * 0.25} L ${size * 0.85} ${size * 0.3} Z`}
              fill={style.wood.light} />
        
        {/* Right edge for depth */}
        <path d={`M ${size * 0.85} ${size * 0.3} L ${size * 0.9} ${size * 0.25} L ${size * 0.9} ${size * 0.5} L ${size * 0.85} ${size * 0.55} Z`}
              fill={style.wood.shadow} />
        
        {/* Work surface items facing North */}
        <g>
          {variant === 'scholar' && (
            <>
              {/* Open book on North side */}
              <rect x={size * 0.25} y={size * 0.32} width={size * 0.25} height={size * 0.15} fill={style.paper} opacity={0.8} />
              <rect x={size * 0.27} y={size * 0.34} width={size * 0.21} height={size * 0.005} fill={style.ink} opacity={0.3} />
              <rect x={size * 0.27} y={size * 0.36} width={size * 0.18} height={size * 0.005} fill={style.ink} opacity={0.3} />
              <rect x={size * 0.27} y={size * 0.38} width={size * 0.2} height={size * 0.005} fill={style.ink} opacity={0.3} />
              
              {/* Quill and inkwell */}
              <rect x={size * 0.6} y={size * 0.38} width={size * 0.15} height={size * 0.003} fill="#8B4513" />
              <circle cx={size * 0.7} cy={size * 0.42} r={size * 0.025} fill={style.ink} />
            </>
          )}
          
          {variant === 'scribe' && (
            <>
              {/* Scroll on North side */}
              <ellipse cx={size * 0.4} cy={size * 0.38} rx={size * 0.08} ry={size * 0.06} fill={style.paper} />
              {/* Writing implements */}
              <rect x={size * 0.55} y={size * 0.35} width={size * 0.12} height={size * 0.002} fill="#654321" />
              <rect x={size * 0.55} y={size * 0.4} width={size * 0.1} height={size * 0.002} fill="#654321" />
            </>
          )}
          
          {variant === 'merchant' && (
            <>
              {/* Ledger book facing North */}
              <rect x={size * 0.3} y={size * 0.34} width={size * 0.2} height={size * 0.12} fill="#8B4513" />
              <rect x={size * 0.32} y={size * 0.36} width={size * 0.16} height={size * 0.08} fill={style.paper} opacity={0.9} />
              
              {/* Coins */}
              <circle cx={size * 0.6} cy={size * 0.4} r={size * 0.015} fill="#FFD700" />
              <circle cx={size * 0.63} cy={size * 0.42} r={size * 0.015} fill="#FFD700" />
              <circle cx={size * 0.57} cy={size * 0.43} r={size * 0.015} fill="#C0C0C0" />
            </>
          )}
          
          {variant === 'clerk' && (
            <>
              {/* Papers and documents facing North */}
              <rect x={size * 0.25} y={size * 0.33} width={size * 0.15} height={size * 0.12} fill={style.paper} opacity={0.8} />
              <rect x={size * 0.45} y={size * 0.35} width={size * 0.12} height={size * 0.1} fill={style.paper} opacity={0.7} />
              
              {/* Seal/stamp */}
              <circle cx={size * 0.65} cy={size * 0.4} r={size * 0.02} fill="#8B0000" />
            </>
          )}
        </g>
        
        {/* Chair positioned on South side (bottom) for North-facing work */}
        <g>
          {/* Chair back */}
          <rect x={size * 0.4} y={size * 0.6} width={size * 0.2} height={size * 0.12} fill={style.wood.base} />
          <rect x={size * 0.4} y={size * 0.6} width={size * 0.2} height={size * 0.02} fill={style.wood.light} />
          
          {/* Chair seat */}
          <rect x={size * 0.38} y={size * 0.7} width={size * 0.24} height={size * 0.15} fill={style.wood.base} />
          <path d={`M ${size * 0.38} ${size * 0.7} L ${size * 0.42} ${size * 0.65} L ${size * 0.66} ${size * 0.65} L ${size * 0.62} ${size * 0.7} Z`}
                fill={style.wood.light} />
          
          {/* Chair legs */}
          <rect x={size * 0.4} y={size * 0.83} width={size * 0.04} height={size * 0.05} fill={style.wood.shadow} />
          <rect x={size * 0.56} y={size * 0.83} width={size * 0.04} height={size * 0.05} fill={style.wood.shadow} />
        </g>
        
        {/* Desk drawers on user side */}
        <rect x={size * 0.25} y={size * 0.52} width={size * 0.15} height={size * 0.06} fill={style.wood.dark} />
        <rect x={size * 0.6} y={size * 0.52} width={size * 0.15} height={size * 0.06} fill={style.wood.dark} />
        
        {/* Drawer handles */}
        <circle cx={size * 0.37} cy={size * 0.55} r={size * 0.01} fill={style.metal.base} />
        <circle cx={size * 0.675} cy={size * 0.55} r={size * 0.01} fill={style.metal.base} />
        
        {/* Wood grain */}
        <rect x={size * 0.17} y={size * 0.33} width={size * 0.66} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
        <rect x={size * 0.18} y={size * 0.4} width={size * 0.64} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
        <rect x={size * 0.16} y={size * 0.47} width={size * 0.68} height={size * 0.005} fill={style.wood.dark} opacity={0.3} />
      </g>
    </svg>
  );
};