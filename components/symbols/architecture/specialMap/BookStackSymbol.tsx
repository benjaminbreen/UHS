/**
 * BookStackSymbol.tsx - Rich Stardew Valley/FF6 style stack of books/tomes
 * Detailed spines, cultural variations, realistic perspective
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface BookStackSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'neat' | 'messy' | 'single' | 'library';
}

export const BookStackSymbol: React.FC<BookStackSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone = 'EUROPEAN',
  variant = 'neat'
}) => {
  const getBookColors = () => {
    // Return array of book colors based on culture
    switch (culturalZone) {
      case 'EUROPEAN':
        return [
          getPixelColors('#8B0000'), // Deep red leather
          getPixelColors('#2F4F4F'), // Dark green
          getPixelColors('#4B0082'), // Indigo
          getPixelColors('#8B4513')  // Brown leather
        ];
      case 'EAST_ASIAN':
        return [
          getPixelColors('#DC143C'), // Crimson silk
          getPixelColors('#000080'), // Navy blue
          getPixelColors('#FFD700'), // Gold
          getPixelColors('#2F4F4F')  // Dark jade
        ];
      case 'MENA':
        return [
          getPixelColors('#4169E1'), // Royal blue
          getPixelColors('#DAA520'), // Goldenrod
          getPixelColors('#8B0000'), // Dark red
          getPixelColors('#228B22')  // Forest green
        ];
      default:
        return [
          getPixelColors('#654321'),
          getPixelColors('#8B7355'),
          getPixelColors('#A0522D'),
          getPixelColors('#8B4513')
        ];
    }
  };
  
  const bookColors = getBookColors();
  
  const renderNeatStack = () => (
    <g filter={PIXEL_SHADOWS.medium}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.25} ry={size * 0.08} fill="#000000" opacity={0.25} />
      
      {/* Bottom book - largest */}
      <g>
        <rect x={size * 0.25} y={size * 0.65} width={size * 0.5} height={size * 0.15} fill={bookColors[0].base} />
        <rect x={size * 0.25} y={size * 0.65} width={size * 0.5} height={size * 0.02} fill={bookColors[0].light} />
        <rect x={size * 0.25} y={size * 0.78} width={size * 0.5} height={size * 0.02} fill={bookColors[0].dark} />
        {/* Spine decoration */}
        <rect x={size * 0.25} y={size * 0.65} width={size * 0.03} height={size * 0.15} fill={bookColors[0].shadow} />
        <rect x={size * 0.45} y={size * 0.68} width={size * 0.1} height={size * 0.08} fill="#FFD700" opacity={0.5} />
        <text x={size * 0.5} y={size * 0.73} fontSize={size * 0.03} fill="#FFD700" textAnchor="middle">TOME</text>
      </g>
      
      {/* Second book */}
      <g>
        <rect x={size * 0.28} y={size * 0.55} width={size * 0.44} height={size * 0.12} fill={bookColors[1].base} />
        <rect x={size * 0.28} y={size * 0.55} width={size * 0.44} height={size * 0.02} fill={bookColors[1].light} />
        <rect x={size * 0.28} y={size * 0.65} width={size * 0.44} height={size * 0.02} fill={bookColors[1].dark} />
        <rect x={size * 0.28} y={size * 0.55} width={size * 0.03} height={size * 0.12} fill={bookColors[1].shadow} />
        {/* Gold clasp */}
        <rect x={size * 0.68} y={size * 0.59} width={size * 0.02} height={size * 0.04} fill="#FFD700" />
      </g>
      
      {/* Third book */}
      <g>
        <rect x={size * 0.3} y={size * 0.46} width={size * 0.4} height={size * 0.11} fill={bookColors[2].base} />
        <rect x={size * 0.3} y={size * 0.46} width={size * 0.4} height={size * 0.02} fill={bookColors[2].light} />
        <rect x={size * 0.3} y={size * 0.55} width={size * 0.4} height={size * 0.02} fill={bookColors[2].dark} />
        <rect x={size * 0.3} y={size * 0.46} width={size * 0.03} height={size * 0.11} fill={bookColors[2].shadow} />
        {/* Bookmark ribbon */}
        <rect x={size * 0.5} y={size * 0.44} width={size * 0.02} height={size * 0.15} fill="#DC143C" />
      </g>
      
      {/* Top book - smallest */}
      <g>
        <rect x={size * 0.32} y={size * 0.38} width={size * 0.36} height={size * 0.1} fill={bookColors[3].base} />
        <rect x={size * 0.32} y={size * 0.38} width={size * 0.36} height={size * 0.02} fill={bookColors[3].light} />
        <rect x={size * 0.32} y={size * 0.46} width={size * 0.36} height={size * 0.02} fill={bookColors[3].dark} />
        <rect x={size * 0.32} y={size * 0.38} width={size * 0.03} height={size * 0.1} fill={bookColors[3].shadow} />
        {/* Title on spine */}
        <rect x={size * 0.45} y={size * 0.41} width={size * 0.08} height={size * 0.04} fill="#FFFFFF" opacity={0.2} />
      </g>
      
      {/* Pages visible from side */}
      <rect x={size * 0.72} y={size * 0.67} width={size * 0.03} height={size * 0.11} fill="#F5F5DC" />
      <rect x={size * 0.7} y={size * 0.57} width={size * 0.02} height={size * 0.08} fill="#F5F5DC" />
      <rect x={size * 0.68} y={size * 0.48} width={size * 0.02} height={size * 0.07} fill="#F5F5DC" />
    </g>
  );
  
  const renderMessyStack = () => (
    <g filter={PIXEL_SHADOWS.soft}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.3} ry={size * 0.1} fill="#000000" opacity={0.2} />
      
      {/* Bottom tilted book */}
      <g transform={`rotate(-5 ${size * 0.4} ${size * 0.7})`}>
        <rect x={size * 0.2} y={size * 0.65} width={size * 0.45} height={size * 0.12} fill={bookColors[0].base} />
        <rect x={size * 0.2} y={size * 0.65} width={size * 0.03} height={size * 0.12} fill={bookColors[0].shadow} />
      </g>
      
      {/* Middle book tilted opposite */}
      <g transform={`rotate(8 ${size * 0.5} ${size * 0.55})`}>
        <rect x={size * 0.3} y={size * 0.5} width={size * 0.4} height={size * 0.1} fill={bookColors[1].base} />
        <rect x={size * 0.3} y={size * 0.5} width={size * 0.03} height={size * 0.1} fill={bookColors[1].shadow} />
      </g>
      
      {/* Open book on top */}
      <g>
        <path d={`M ${size * 0.35} ${size * 0.45} L ${size * 0.5} ${size * 0.4} L ${size * 0.65} ${size * 0.45} L ${size * 0.65} ${size * 0.55} L ${size * 0.5} ${size * 0.5} L ${size * 0.35} ${size * 0.55} Z`}
              fill={bookColors[2].base} />
        {/* Open pages */}
        <path d={`M ${size * 0.37} ${size * 0.46} L ${size * 0.5} ${size * 0.42} L ${size * 0.5} ${size * 0.52} L ${size * 0.37} ${size * 0.54} Z`}
              fill="#F5F5DC" />
        <path d={`M ${size * 0.63} ${size * 0.46} L ${size * 0.5} ${size * 0.42} L ${size * 0.5} ${size * 0.52} L ${size * 0.63} ${size * 0.54} Z`}
              fill="#FFFAF0" />
        {/* Text lines on pages */}
        <rect x={size * 0.39} y={size * 0.47} width={size * 0.08} height={size * 0.003} fill="#000000" opacity={0.3} />
        <rect x={size * 0.39} y={size * 0.48} width={size * 0.07} height={size * 0.003} fill="#000000" opacity={0.3} />
        <rect x={size * 0.53} y={size * 0.47} width={size * 0.08} height={size * 0.003} fill="#000000" opacity={0.3} />
        <rect x={size * 0.53} y={size * 0.48} width={size * 0.07} height={size * 0.003} fill="#000000" opacity={0.3} />
      </g>
      
      {/* Scattered single book */}
      <g transform={`rotate(-12 ${size * 0.7} ${size * 0.65})`}>
        <rect x={size * 0.6} y={size * 0.6} width={size * 0.25} height={size * 0.08} fill={bookColors[3].base} />
        <rect x={size * 0.6} y={size * 0.6} width={size * 0.02} height={size * 0.08} fill={bookColors[3].shadow} />
      </g>
    </g>
  );
  
  const renderLibraryShelf = () => (
    <g filter={PIXEL_SHADOWS.hard}>
      {/* Shadow */}
      <rect x={size * 0.15} y={size * 0.82} width={size * 0.7} height={size * 0.05} fill="#000000" opacity={0.3} />
      
      {/* Wooden shelf */}
      <rect x={size * 0.1} y={size * 0.78} width={size * 0.8} height={size * 0.04} fill="#8B4513" />
      <rect x={size * 0.1} y={size * 0.78} width={size * 0.8} height={size * 0.01} fill="#A0522D" />
      
      {/* Row of standing books */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const bookColor = bookColors[i % bookColors.length];
        const bookX = size * (0.15 + i * 0.1);
        const bookHeight = size * (0.35 + Math.random() * 0.1);
        const bookY = size * 0.78 - bookHeight;
        
        return (
          <g key={i}>
            <rect x={bookX} y={bookY} width={size * 0.08} height={bookHeight} fill={bookColor.base} />
            <rect x={bookX} y={bookY} width={size * 0.08} height={size * 0.02} fill={bookColor.light} />
            <rect x={bookX} y={bookY + bookHeight - size * 0.02} width={size * 0.08} height={size * 0.02} fill={bookColor.dark} />
            {/* Random decorations */}
            {i % 2 === 0 && (
              <rect x={bookX + size * 0.025} y={bookY + bookHeight * 0.3} width={size * 0.03} height={size * 0.01} fill="#FFD700" opacity={0.6} />
            )}
          </g>
        );
      })}
    </g>
  );
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {variant === 'neat' && renderNeatStack()}
      {variant === 'messy' && renderMessyStack()}
      {variant === 'library' && renderLibraryShelf()}
      {variant === 'single' && (
        <g filter={PIXEL_SHADOWS.medium}>
          <ellipse cx={size * 0.52} cy={size * 0.7} rx={size * 0.2} ry={size * 0.06} fill="#000000" opacity={0.2} />
          <rect x={size * 0.3} y={size * 0.45} width={size * 0.4} height={size * 0.2} fill={bookColors[0].base} />
          <rect x={size * 0.3} y={size * 0.45} width={size * 0.4} height={size * 0.03} fill={bookColors[0].light} />
          <rect x={size * 0.3} y={size * 0.62} width={size * 0.4} height={size * 0.03} fill={bookColors[0].dark} />
          <rect x={size * 0.3} y={size * 0.45} width={size * 0.04} height={size * 0.2} fill={bookColors[0].shadow} />
          <rect x={size * 0.45} y={size * 0.52} width={size * 0.1} height={size * 0.06} fill="#FFD700" opacity={0.5} />
          <text x={size * 0.5} y={size * 0.56} fontSize={size * 0.04} fill="#FFD700" textAnchor="middle">CODEX</text>
        </g>
      )}
    </svg>
  );
};