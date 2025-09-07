/**
 * DeskFacingWest.tsx - Desk with chair/workspace facing West
 * Beautiful Stardew Valley/FF6 pixel art style optimized for West-facing work
 * Chair positioned on East side, work surface accessible from East
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface DeskFacingWestProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'scholar' | 'scribe' | 'merchant' | 'clerk';
}

export const DeskFacingWest: React.FC<DeskFacingWestProps> = ({ 
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
        
        {/* Chair positioned on East side (right) for West-facing work */}
        <g>
          <rect x={size * 0.83} y={size * 0.4} width={size * 0.12} height={size * 0.2} fill={style.wood.base} />
          <rect x={size * 0.83} y={size * 0.4} width={size * 0.02} height={size * 0.2} fill={style.wood.light} />
          <rect x={size * 0.7} y={size * 0.38} width={size * 0.15} height={size * 0.24} fill={style.wood.base} />
          <path d={`M ${size * 0.7} ${size * 0.38} L ${size * 0.75} ${size * 0.42} L ${size * 0.75} ${size * 0.66} L ${size * 0.7} ${size * 0.62} Z`}
                fill={style.wood.light} />
          <rect x={size * 0.93} y={size * 0.4} width={size * 0.05} height={size * 0.04} fill={style.wood.shadow} />
          <rect x={size * 0.93} y={size * 0.56} width={size * 0.05} height={size * 0.04} fill={style.wood.shadow} />
        </g>
        
        {/* Desk legs */}
        <rect x={size * 0.12} y={size * 0.6} width={size * 0.08} height={size * 0.2} fill={style.wood.shadow} />
        <rect x={size * 0.52} y={size * 0.6} width={size * 0.08} height={size * 0.2} fill={style.wood.shadow} />
        <rect x={size * 0.12} y={size * 0.6} width={size * 0.03} height={size * 0.2} fill={style.wood.light} opacity={0.6} />
        <rect x={size * 0.52} y={size * 0.6} width={size * 0.03} height={size * 0.2} fill={style.wood.light} opacity={0.6} />
        
        {/* Main desktop - oriented for West-facing work */}
        <rect x={size * 0.15} y={size * 0.35} width={size * 0.5} height={size * 0.3} fill={style.wood.base} />
        <path d={`M ${size * 0.15} ${size * 0.35} L ${size * 0.1} ${size * 0.3} L ${size * 0.6} ${size * 0.3} L ${size * 0.65} ${size * 0.35} Z`}
              fill={style.wood.light} />
        <path d={`M ${size * 0.65} ${size * 0.35} L ${size * 0.6} ${size * 0.3} L ${size * 0.6} ${size * 0.6} L ${size * 0.65} ${size * 0.65} Z`}
              fill={style.wood.shadow} />
        
        {/* Work surface items oriented West */}
        <g>
          {variant === 'scholar' && (
            <>
              <rect x={size * 0.2} y={size * 0.4} width={size * 0.2} height={size * 0.2} fill={style.paper} opacity={0.8} />
              <rect x={size * 0.22} y={size * 0.42} width={size * 0.16} height={size * 0.005} fill={style.ink} opacity={0.3} />
              <rect x={size * 0.45} y={size * 0.5} width={size * 0.1} height={size * 0.003} fill="#8B4513" />
              <circle cx={size * 0.58} cy={size * 0.45} r={size * 0.02} fill={style.ink} />
            </>
          )}
          
          {variant === 'merchant' && (
            <>
              <rect x={size * 0.3} y={size * 0.42} width={size * 0.15} height={size * 0.16} fill="#8B4513" />
              <circle cx={size * 0.55} cy={size * 0.5} r={size * 0.015} fill="#FFD700" />
              <circle cx={size * 0.53} cy={size * 0.53} r={size * 0.015} fill="#C0C0C0" />
            </>
          )}
        </g>
        
        {/* Drawers on user side */}
        <rect x={size * 0.57} y={size * 0.45} width={size * 0.06} height={size * 0.12} fill={style.wood.dark} />
        <rect x={size * 0.57} y={size * 0.58} width={size * 0.06} height={size * 0.1} fill={style.wood.dark} />
        <circle cx={size * 0.6} cy={size * 0.51} r={size * 0.008} fill={style.metal.base} />
        <circle cx={size * 0.6} cy={size * 0.63} r={size * 0.008} fill={style.metal.base} />
      </g>
    </svg>
  );
};