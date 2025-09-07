/**
 * BookshelfAgainstEastWall.tsx - Bookshelf positioned against East wall
 * Beautiful Stardew Valley/FF6 pixel art style optimized for East wall placement
 * Accessible from West side, books face West, proper 3/4 perspective
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface BookshelfAgainstEastWallProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'scholar' | 'library' | 'merchant' | 'monastery';
}

export const BookshelfAgainstEastWall: React.FC<BookshelfAgainstEastWallProps> = ({ 
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
        <ellipse cx={size * 0.65} cy={size * 0.85} rx={size * 0.2} ry={size * 0.1} fill="#000000" opacity={0.25} />
        
        {/* Main bookshelf frame - positioned against East wall */}
        <rect x={size * 0.6} y={size * 0.15} width={size * 0.25} height={size * 0.6} fill={style.wood.base} />
        
        {/* Left surface with 3D perspective facing West */}
        <path d={`M ${size * 0.6} ${size * 0.15} L ${size * 0.55} ${size * 0.1} L ${size * 0.55} ${size * 0.7} L ${size * 0.6} ${size * 0.75} Z`}
              fill={style.wood.light} />
        
        {/* Top surface for depth */}
        <path d={`M ${size * 0.6} ${size * 0.15} L ${size * 0.55} ${size * 0.1} L ${size * 0.8} ${size * 0.1} L ${size * 0.85} ${size * 0.15} Z`}
              fill={style.wood.light} />
        
        {/* Shelf divisions - horizontal shelves */}
        <rect x={size * 0.6} y={size * 0.3} width={size * 0.25} height={size * 0.03} fill={style.wood.dark} />
        <rect x={size * 0.6} y={size * 0.45} width={size * 0.25} height={size * 0.03} fill={style.wood.dark} />
        <rect x={size * 0.6} y={size * 0.6} width={size * 0.25} height={size * 0.03} fill={style.wood.dark} />
        
        {/* Shelf depth perspective - facing West */}
        <path d={`M ${size * 0.6} ${size * 0.3} L ${size * 0.55} ${size * 0.25} L ${size * 0.8} ${size * 0.25} L ${size * 0.85} ${size * 0.3} Z`}
              fill={style.wood.light} opacity={0.6} />
        <path d={`M ${size * 0.6} ${size * 0.45} L ${size * 0.55} ${size * 0.4} L ${size * 0.8} ${size * 0.4} L ${size * 0.85} ${size * 0.45} Z`}
              fill={style.wood.light} opacity={0.6} />
        <path d={`M ${size * 0.6} ${size * 0.6} L ${size * 0.55} ${size * 0.55} L ${size * 0.8} ${size * 0.55} L ${size * 0.85} ${size * 0.6} Z`}
              fill={style.wood.light} opacity={0.6} />
        
        {/* Books on top shelf - narrow vertical spine view */}
        <g>
          <rect x={size * 0.61} y={size * 0.18} width={size * 0.02} height={size * 0.1} fill={style.bookSpines[0]} />
          <rect x={size * 0.64} y={size * 0.17} width={size * 0.015} height={size * 0.11} fill={style.bookSpines[1]} />
          <rect x={size * 0.66} y={size * 0.19} width={size * 0.018} height={size * 0.09} fill={style.bookSpines[2]} />
          <rect x={size * 0.68} y={size * 0.18} width={size * 0.02} height={size * 0.1} fill={style.bookSpines[3]} />
          <rect x={size * 0.71} y={size * 0.17} width={size * 0.015} height={size * 0.11} fill={style.bookSpines[4]} />
          <rect x={size * 0.73} y={size * 0.18} width={size * 0.018} height={size * 0.1} fill={style.bookSpines[0]} />
          <rect x={size * 0.75} y={size * 0.19} width={size * 0.02} height={size * 0.09} fill={style.bookSpines[1]} />
          <rect x={size * 0.78} y={size * 0.18} width={size * 0.015} height={size * 0.1} fill={style.bookSpines[2]} />
        </g>
        
        {/* Books on second shelf */}
        <g>
          <rect x={size * 0.62} y={size * 0.33} width={size * 0.018} height={size * 0.1} fill={style.bookSpines[2]} />
          <rect x={size * 0.64} y={size * 0.32} width={size * 0.02} height={size * 0.11} fill={style.bookSpines[4]} />
          <rect x={size * 0.67} y={size * 0.34} width={size * 0.015} height={size * 0.09} fill={style.bookSpines[1]} />
          <rect x={size * 0.69} y={size * 0.33} width={size * 0.018} height={size * 0.1} fill={style.bookSpines[3]} />
          <rect x={size * 0.71} y={size * 0.32} width={size * 0.02} height={size * 0.11} fill={style.bookSpines[0]} />
          <rect x={size * 0.74} y={size * 0.33} width={size * 0.015} height={size * 0.1} fill={style.bookSpines[4]} />
          <rect x={size * 0.76} y={size * 0.34} width={size * 0.018} height={size * 0.09} fill={style.bookSpines[2]} />
        </g>
        
        {/* Books on third shelf */}
        <g>
          <rect x={size * 0.61} y={size * 0.48} width={size * 0.02} height={size * 0.1} fill={style.bookSpines[3]} />
          <rect x={size * 0.64} y={size * 0.47} width={size * 0.015} height={size * 0.11} fill={style.bookSpines[1]} />
          <rect x={size * 0.66} y={size * 0.49} width={size * 0.018} height={size * 0.09} fill={style.bookSpines[4]} />
          <rect x={size * 0.69} y={size * 0.48} width={size * 0.02} height={size * 0.1} fill={style.bookSpines[2]} />
          <rect x={size * 0.72} y={size * 0.47} width={size * 0.015} height={size * 0.11} fill={style.bookSpines[0]} />
          <rect x={size * 0.74} y={size * 0.48} width={size * 0.018} height={size * 0.1} fill={style.bookSpines[3]} />
        </g>
        
        {/* Books on bottom shelf */}
        <g>
          <rect x={size * 0.62} y={size * 0.63} width={size * 0.015} height={size * 0.1} fill={style.bookSpines[2]} />
          <rect x={size * 0.64} y={size * 0.62} width={size * 0.02} height={size * 0.11} fill={style.bookSpines[4]} />
          <rect x={size * 0.67} y={size * 0.64} width={size * 0.018} height={size * 0.09} fill={style.bookSpines[1]} />
          <rect x={size * 0.69} y={size * 0.63} width={size * 0.015} height={size * 0.1} fill={style.bookSpines[0]} />
          <rect x={size * 0.71} y={size * 0.62} width={size * 0.02} height={size * 0.11} fill={style.bookSpines[3]} />
          <rect x={size * 0.74} y={size * 0.63} width={size * 0.018} height={size * 0.1} fill={style.bookSpines[2]} />
        </g>
        
        {/* Variant-specific additions */}
        {variant === 'library' && (
          <g>
            {/* Scrolls positioned vertically */}
            <ellipse cx={size * 0.8} cy={size * 0.23} rx={size * 0.01} ry={size * 0.04} fill={style.paper} />
            <ellipse cx={size * 0.82} cy={size * 0.38} rx={size * 0.01} ry={size * 0.04} fill={style.paper} />
            
            {/* Small reading platform extending West */}
            <rect x={size * 0.5} y={size * 0.5} width={size * 0.12} height={size * 0.02} fill={style.wood.dark} />
            <path d={`M ${size * 0.5} ${size * 0.5} L ${size * 0.45} ${size * 0.45} L ${size * 0.57} ${size * 0.45} L ${size * 0.62} ${size * 0.5} Z`}
                  fill={style.wood.light} />
          </g>
        )}
        
        {variant === 'monastery' && (
          <g>
            {/* Religious texts with distinctive bindings */}
            <rect x={size * 0.77} y={size * 0.17} width={size * 0.03} height={size * 0.11} fill="#8B0000" />
            <rect x={size * 0.78} y={size * 0.18} width={size * 0.01} height={size * 0.09} fill="#FFD700" opacity={0.8} />
            
            {/* Illuminated manuscript */}
            <rect x={size * 0.75} y={size * 0.32} width={size * 0.025} height={size * 0.11} fill="#000080" />
            <rect x={size * 0.76} y={size * 0.33} width={size * 0.005} height={size * 0.09} fill="#FFD700" opacity={0.8} />
          </g>
        )}
        
        {variant === 'merchant' && (
          <g>
            {/* Ledgers and account books */}
            <rect x={size * 0.75} y={size * 0.47} width={size * 0.04} height={size * 0.11} fill="#654321" />
            <rect x={size * 0.76} y={size * 0.48} width={size * 0.02} height={size * 0.1} fill="#8B4513" />
            
            {/* Small valuables on shelf */}
            <circle cx={size * 0.82} cy={size * 0.53} r={size * 0.01} fill="#FFD700" />
          </g>
        )}
        
        {/* Top and bottom panels */}
        <rect x={size * 0.6} y={size * 0.15} width={size * 0.25} height={size * 0.03} fill={style.wood.dark} />
        <rect x={size * 0.6} y={size * 0.72} width={size * 0.25} height={size * 0.03} fill={style.wood.dark} />
        
        {/* Base */}
        <rect x={size * 0.58} y={size * 0.72} width={size * 0.29} height={size * 0.08} fill={style.wood.shadow} />
        <rect x={size * 0.58} y={size * 0.72} width={size * 0.03} height={size * 0.08} fill={style.wood.light} opacity={0.6} />
      </g>
    </svg>
  );
};