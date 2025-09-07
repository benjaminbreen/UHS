/**
 * DeskFacingSouth.tsx - Desk with chair/workspace facing South
 * Beautiful Stardew Valley/FF6 pixel art style optimized for South-facing work
 * Chair positioned on North side, work surface accessible from North
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface DeskFacingSouthProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'scholar' | 'scribe' | 'merchant' | 'clerk';
}

export const DeskFacingSouth: React.FC<DeskFacingSouthProps> = ({ 
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
          wood: getPixelColors('#8B4513'),
          metal: MATERIAL_COLORS.metal.iron,
          paper: '#F5F5DC',
          ink: '#000080'
        };
      case 'EAST_ASIAN':
        return {
          wood: getPixelColors('#2F4F4F'),
          metal: MATERIAL_COLORS.metal.brass,
          paper: '#FFFAF0',
          ink: '#000000'
        };
      case 'MENA':
        return {
          wood: getPixelColors('#DEB887'),
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
        <ellipse cx={size * 0.52} cy={size * 0.82} rx={size * 0.35} ry={size * 0.1} fill="#000000" opacity={0.25} />
        
        {/* Chair positioned on North side (top) for South-facing work */}
        <g>
          <rect x={size * 0.4} y={size * 0.15} width={size * 0.2} height={size * 0.12} fill={style.wood.base} />
          <rect x={size * 0.4} y={size * 0.25} width={size * 0.2} height={size * 0.02} fill={style.wood.light} />
          <rect x={size * 0.38} y={size * 0.25} width={size * 0.24} height={size * 0.15} fill={style.wood.base} />
          <path d={`M ${size * 0.38} ${size * 0.4} L ${size * 0.42} ${size * 0.35} L ${size * 0.66} ${size * 0.35} L ${size * 0.62} ${size * 0.4} Z`}
                fill={style.wood.light} />
          <rect x={size * 0.4} y={size * 0.12} width={size * 0.04} height={size * 0.05} fill={style.wood.shadow} />
          <rect x={size * 0.56} y={size * 0.12} width={size * 0.04} height={size * 0.05} fill={style.wood.shadow} />
        </g>
        
        {/* Desk legs */}
        <rect x={size * 0.2} y={size * 0.5} width={size * 0.08} height={size * 0.3} fill={style.wood.shadow} />
        <rect x={size * 0.72} y={size * 0.5} width={size * 0.08} height={size * 0.3} fill={style.wood.shadow} />
        <rect x={size * 0.2} y={size * 0.5} width={size * 0.03} height={size * 0.3} fill={style.wood.light} opacity={0.6} />
        <rect x={size * 0.72} y={size * 0.5} width={size * 0.03} height={size * 0.3} fill={style.wood.light} opacity={0.6} />
        
        {/* Main desktop */}
        <rect x={size * 0.15} y={size * 0.45} width={size * 0.7} height={size * 0.25} fill={style.wood.base} />
        <path d={`M ${size * 0.15} ${size * 0.45} L ${size * 0.2} ${size * 0.4} L ${size * 0.9} ${size * 0.4} L ${size * 0.85} ${size * 0.45} Z`}
              fill={style.wood.light} />
        <path d={`M ${size * 0.85} ${size * 0.45} L ${size * 0.9} ${size * 0.4} L ${size * 0.9} ${size * 0.65} L ${size * 0.85} ${size * 0.7} Z`}
              fill={style.wood.shadow} />
        
        {/* Work surface items facing South */}
        <g>
          {variant === 'scholar' && (
            <>
              <rect x={size * 0.25} y={size * 0.55} width={size * 0.25} height={size * 0.15} fill={style.paper} opacity={0.8} />
              <rect x={size * 0.27} y={size * 0.57} width={size * 0.21} height={size * 0.005} fill={style.ink} opacity={0.3} />
              <rect x={size * 0.6} y={size * 0.5} width={size * 0.15} height={size * 0.003} fill="#8B4513" />
              <circle cx={size * 0.7} cy={size * 0.54} r={size * 0.025} fill={style.ink} />
            </>
          )}
          
          {variant === 'merchant' && (
            <>
              <rect x={size * 0.3} y={size * 0.52} width={size * 0.2} height={size * 0.12} fill="#8B4513" />
              <circle cx={size * 0.6} cy={size * 0.58} r={size * 0.015} fill="#FFD700" />
              <circle cx={size * 0.63} cy={size * 0.6} r={size * 0.015} fill="#FFD700" />
            </>
          )}
        </g>
        
        {/* Drawers on user side */}
        <rect x={size * 0.25} y={size * 0.47} width={size * 0.15} height={size * 0.06} fill={style.wood.dark} />
        <rect x={size * 0.6} y={size * 0.47} width={size * 0.15} height={size * 0.06} fill={style.wood.dark} />
        <circle cx={size * 0.37} cy={size * 0.5} r={size * 0.01} fill={style.metal.base} />
        <circle cx={size * 0.675} cy={size * 0.5} r={size * 0.01} fill={style.metal.base} />
      </g>
    </svg>
  );
};