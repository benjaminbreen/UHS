/**
 * BookshelfAgainstNorthWall.tsx - Bookshelf positioned against North wall
 * Beautiful Stardew Valley/FF6 pixel art style optimized for North wall placement
 * Accessible from South side, books face South, proper 3/4 perspective
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface BookshelfAgainstNorthWallProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'scholar' | 'library' | 'merchant' | 'monastery';
}

export const BookshelfAgainstNorthWall: React.FC<BookshelfAgainstNorthWallProps> = ({ 
  x = 0,
  y = 0,
  size = 32,
  culturalZone = 'EUROPEAN',
  variant = 'scholar'
}) => {
  const getBookshelfStyle = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        return {
          wood: getPixelColors('#8B4513'), // Oak
          bookSpines: ['#8B0000', '#000080', '#006400', '#8B4513', '#4B0082'],
          metal: MATERIAL_COLORS.metal.iron,
          paper: '#F5F5DC'
        };
      case 'EAST_ASIAN':
        return {
          wood: getPixelColors('#654321'), // Dark lacquered
          bookSpines: ['#DC143C', '#FFD700', '#000000', '#8B4513', '#4169E1'],
          metal: MATERIAL_COLORS.metal.brass,
          paper: '#FFFAF0'
        };
      case 'MENA':
        return {
          wood: getPixelColors('#DEB887'), // Light wood
          bookSpines: ['#4169E1', '#FFD700', '#8B4513', '#006400', '#8B0000'],
          metal: MATERIAL_COLORS.metal.brass,
          paper: '#FDF5E6'
        };
      default:
        return {
          wood: getPixelColors('#A0522D'),
          bookSpines: ['#654321', '#2F4F4F', '#8B4513', '#000080', '#8B0000'],
          metal: MATERIAL_COLORS.metal.steel,
          paper: '#FFFFFF'
        };
    }
  };
  
  const style = getBookshelfStyle();
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g filter={PIXEL_SHADOWS.medium}>
        {/* Shadow at base */}
        <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.35} ry={size * 0.08} fill="#000000" opacity={0.25} />
        
        {/* Main bookshelf frame - positioned against North wall */}
        <rect x={size * 0.15} y={size * 0.15} width={size * 0.7} height={size * 0.6} fill={style.wood.base} />
        
        {/* Top surface with 3D perspective facing South */}
        <path d={`M ${size * 0.15} ${size * 0.15} L ${size * 0.2} ${size * 0.1} L ${size * 0.9} ${size * 0.1} L ${size * 0.85} ${size * 0.15} Z`}
              fill={style.wood.light} />
        
        {/* Right edge for depth */}
        <path d={`M ${size * 0.85} ${size * 0.15} L ${size * 0.9} ${size * 0.1} L ${size * 0.9} ${size * 0.7} L ${size * 0.85} ${size * 0.75} Z`}
              fill={style.wood.shadow} />
        
        {/* Shelf divisions - horizontal shelves */}
        <rect x={size * 0.15} y={size * 0.3} width={size * 0.7} height={size * 0.03} fill={style.wood.dark} />
        <rect x={size * 0.15} y={size * 0.45} width={size * 0.7} height={size * 0.03} fill={style.wood.dark} />
        <rect x={size * 0.15} y={size * 0.6} width={size * 0.7} height={size * 0.03} fill={style.wood.dark} />
        
        {/* Shelf depth perspective */}
        <path d={`M ${size * 0.15} ${size * 0.3} L ${size * 0.2} ${size * 0.25} L ${size * 0.9} ${size * 0.25} L ${size * 0.85} ${size * 0.3} Z`}
              fill={style.wood.light} opacity={0.6} />
        <path d={`M ${size * 0.15} ${size * 0.45} L ${size * 0.2} ${size * 0.4} L ${size * 0.9} ${size * 0.4} L ${size * 0.85} ${size * 0.45} Z`}
              fill={style.wood.light} opacity={0.6} />
        <path d={`M ${size * 0.15} ${size * 0.6} L ${size * 0.2} ${size * 0.55} L ${size * 0.9} ${size * 0.55} L ${size * 0.85} ${size * 0.6} Z`}
              fill={style.wood.light} opacity={0.6} />
        
        {/* Books on top shelf */}
        <g>
          <rect x={size * 0.18} y={size * 0.18} width={size * 0.04} height={size * 0.1} fill={style.bookSpines[0]} />
          <rect x={size * 0.23} y={size * 0.17} width={size * 0.03} height={size * 0.11} fill={style.bookSpines[1]} />
          <rect x={size * 0.27} y={size * 0.19} width={size * 0.035} height={size * 0.09} fill={style.bookSpines[2]} />
          <rect x={size * 0.31} y={size * 0.18} width={size * 0.045} height={size * 0.1} fill={style.bookSpines[3]} />
          <rect x={size * 0.36} y={size * 0.17} width={size * 0.04} height={size * 0.11} fill={style.bookSpines[4]} />
          <rect x={size * 0.41} y={size * 0.18} width={size * 0.035} height={size * 0.1} fill={style.bookSpines[0]} />
          <rect x={size * 0.45} y={size * 0.19} width={size * 0.03} height={size * 0.09} fill={style.bookSpines[1]} />
        </g>
        
        {/* Books on second shelf */}
        <g>
          <rect x={size * 0.17} y={size * 0.33} width={size * 0.045} height={size * 0.1} fill={style.bookSpines[2]} />
          <rect x={size * 0.22} y={size * 0.32} width={size * 0.04} height={size * 0.11} fill={style.bookSpines[4]} />
          <rect x={size * 0.27} y={size * 0.34} width={size * 0.035} height={size * 0.09} fill={style.bookSpines[1]} />
          <rect x={size * 0.31} y={size * 0.33} width={size * 0.03} height={size * 0.1} fill={style.bookSpines[3]} />
          <rect x={size * 0.35} y={size * 0.32} width={size * 0.045} height={size * 0.11} fill={style.bookSpines[0]} />
        </g>
        
        {/* Books on third shelf */}
        <g>
          <rect x={size * 0.19} y={size * 0.48} width={size * 0.04} height={size * 0.1} fill={style.bookSpines[3]} />
          <rect x={size * 0.24} y={size * 0.47} width={size * 0.035} height={size * 0.11} fill={style.bookSpines[1]} />
          <rect x={size * 0.28} y={size * 0.49} width={size * 0.045} height={size * 0.09} fill={style.bookSpines[4]} />
          <rect x={size * 0.33} y={size * 0.48} width={size * 0.03} height={size * 0.1} fill={style.bookSpines[2]} />
          <rect x={size * 0.37} y={size * 0.47} width={size * 0.04} height={size * 0.11} fill={style.bookSpines[0]} />
          <rect x={size * 0.42} y={size * 0.48} width={size * 0.035} height={size * 0.1} fill={style.bookSpines[3]} />
        </g>
        
        {/* Books on bottom shelf */}
        <g>
          <rect x={size * 0.16} y={size * 0.63} width={size * 0.035} height={size * 0.1} fill={style.bookSpines[2]} />
          <rect x={size * 0.2} y={size * 0.62} width={size * 0.045} height={size * 0.11} fill={style.bookSpines[4]} />
          <rect x={size * 0.25} y={size * 0.64} width={size * 0.04} height={size * 0.09} fill={style.bookSpines[1]} />
          <rect x={size * 0.3} y={size * 0.63} width={size * 0.03} height={size * 0.1} fill={style.bookSpines[0]} />
          <rect x={size * 0.34} y={size * 0.62} width={size * 0.045} height={size * 0.11} fill={style.bookSpines[3]} />
          <rect x={size * 0.39} y={size * 0.63} width={size * 0.04} height={size * 0.1} fill={style.bookSpines[2]} />
        </g>
        
        {/* Variant-specific additions */}
        {variant === 'library' && (
          <g>
            {/* Scrolls on shelves */}
            <ellipse cx={size * 0.7} cy={size * 0.23} rx={size * 0.02} ry={size * 0.06} fill={style.paper} />
            <ellipse cx={size * 0.75} cy={size * 0.38} rx={size * 0.02} ry={size * 0.06} fill={style.paper} />
            
            {/* Reading lectern attachment */}
            <rect x={size * 0.6} y={size * 0.5} width={size * 0.2} height={size * 0.02} fill={style.wood.dark} />
            <path d={`M ${size * 0.6} ${size * 0.5} L ${size * 0.65} ${size * 0.45} L ${size * 0.85} ${size * 0.45} L ${size * 0.8} ${size * 0.5} Z`}
                  fill={style.wood.light} />
          </g>
        )}
        
        {variant === 'monastery' && (
          <g>
            {/* Religious texts with distinctive bindings */}
            <rect x={size * 0.5} y={size * 0.17} width={size * 0.05} height={size * 0.11} fill="#8B0000" />
            <rect x={size * 0.51} y={size * 0.18} width={size * 0.03} height={size * 0.09} fill="#FFD700" opacity={0.8} />
            
            {/* Illuminated manuscript */}
            <rect x={size * 0.6} y={size * 0.32} width={size * 0.04} height={size * 0.11} fill="#000080" />
            <rect x={size * 0.61} y={size * 0.33} width={size * 0.02} height={size * 0.09} fill="#FFD700" opacity={0.8} />
          </g>
        )}
        
        {variant === 'merchant' && (
          <g>
            {/* Ledgers and account books */}
            <rect x={size * 0.55} y={size * 0.47} width={size * 0.06} height={size * 0.11} fill="#654321" />
            <rect x={size * 0.62} y={size * 0.48} width={size * 0.05} height={size * 0.1} fill="#8B4513" />
            
            {/* Small valuables on shelf */}
            <circle cx={size * 0.73} cy={size * 0.53} r={size * 0.015} fill="#FFD700" />
          </g>
        )}
        
        {/* Side panels */}
        <rect x={size * 0.15} y={size * 0.15} width={size * 0.03} height={size * 0.6} fill={style.wood.dark} />
        <rect x={size * 0.82} y={size * 0.15} width={size * 0.03} height={size * 0.6} fill={style.wood.dark} />
        
        {/* Base */}
        <rect x={size * 0.12} y={size * 0.72} width={size * 0.76} height={size * 0.08} fill={style.wood.shadow} />
        <rect x={size * 0.12} y={size * 0.72} width={size * 0.03} height={size * 0.08} fill={style.wood.light} opacity={0.6} />
      </g>
    </svg>
  );
};