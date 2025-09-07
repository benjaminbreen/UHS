/**
 * ScrollSymbol.tsx - Beautiful Stardew Valley/FF6 style scroll or manuscript
 * Rich parchment textures, cultural writing systems, proper 3D perspective
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../../PixelArtStyleGuide';

interface ScrollSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  variant?: 'rolled' | 'open' | 'sealed' | 'ancient';
}

export const ScrollSymbol: React.FC<ScrollSymbolProps> = ({ 
  x = 0, 
  y = 0, 
  size = 32,
  culturalZone = 'EUROPEAN',
  variant = 'rolled'
}) => {
  const getScrollStyle = () => {
    switch (culturalZone) {
      case 'EAST_ASIAN':
        return {
          parchment: getPixelColors('#F5E6D3'), // Rice paper
          ink: '#000000',
          seal: '#DC143C', // Red wax seal
          ribbon: '#8B0000',
          script: '書道春夏秋冬'
        };
      case 'MENA':
        return {
          parchment: getPixelColors('#E8D7C3'), // Papyrus
          ink: '#2F4F4F',
          seal: '#4169E1', // Blue seal
          ribbon: '#FFD700',
          script: 'بِسْمِ اللَّهِ'
        };
      case 'EUROPEAN':
        return {
          parchment: getPixelColors('#DEB887'), // Vellum
          ink: '#1C1C1C',
          seal: '#8B0000', // Red wax
          ribbon: '#4B0082',
          script: 'Lorem ipsum'
        };
      case 'SOUTH_ASIAN':
        return {
          parchment: getPixelColors('#F4E4BC'), // Palm leaf
          ink: '#8B4513',
          seal: '#FFD700',
          ribbon: '#DC143C',
          script: 'संस्कृत'
        };
      default:
        return {
          parchment: getPixelColors('#D2B48C'),
          ink: '#000000',
          seal: '#654321',
          ribbon: '#8B7355',
          script: 'Ancient text'
        };
    }
  };
  
  const style = getScrollStyle();
  
  const renderRolledScroll = () => (
    <g filter={PIXEL_SHADOWS.medium}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.75} rx={size * 0.3} ry={size * 0.08} fill="#000000" opacity={0.25} />
      
      {/* Main rolled cylinder */}
      <rect x={size * 0.25} y={size * 0.35} width={size * 0.5} height={size * 0.35} fill={style.parchment.base} />
      <rect x={size * 0.25} y={size * 0.35} width={size * 0.08} height={size * 0.35} fill={style.parchment.light} opacity={0.6} />
      <rect x={size * 0.67} y={size * 0.35} width={size * 0.08} height={size * 0.35} fill={style.parchment.shadow} opacity={0.5} />
      
      {/* Top circular end */}
      <ellipse cx={size * 0.5} cy={size * 0.35} rx={size * 0.125} ry={size * 0.04} fill={style.parchment.dark} />
      <ellipse cx={size * 0.5} cy={size * 0.34} rx={size * 0.1} ry={size * 0.03} fill={style.parchment.base} />
      
      {/* Bottom circular end */}
      <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.125} ry={size * 0.04} fill={style.parchment.shadow} />
      
      {/* Ribbon/tie */}
      <rect x={size * 0.48} y={size * 0.45} width={size * 0.04} height={size * 0.15} fill={style.ribbon} />
      <circle cx={size * 0.5} cy={size * 0.52} r={size * 0.06} fill="none" stroke={style.ribbon} strokeWidth={2} />
      
      {/* Wax seal */}
      <circle cx={size * 0.5} cy={size * 0.52} r={size * 0.05} fill={style.seal} />
      <circle cx={size * 0.5} cy={size * 0.52} r={size * 0.04} fill={style.seal} opacity={0.8} />
      <text x={size * 0.5} y={size * 0.535} fontSize={size * 0.04} fill={style.parchment.light} textAnchor="middle">S</text>
      
      {/* Aged texture */}
      <circle cx={size * 0.35} cy={size * 0.45} r={size * 0.015} fill={style.parchment.shadow} opacity={0.3} />
      <circle cx={size * 0.65} cy={size * 0.6} r={size * 0.01} fill={style.parchment.shadow} opacity={0.3} />
    </g>
  );
  
  const renderOpenScroll = () => (
    <g filter={PIXEL_SHADOWS.soft}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.85} rx={size * 0.35} ry={size * 0.1} fill="#000000" opacity={0.2} />
      
      {/* Unrolled parchment */}
      <path d={`M ${size * 0.15} ${size * 0.3} 
                Q ${size * 0.15} ${size * 0.25} ${size * 0.2} ${size * 0.25}
                L ${size * 0.8} ${size * 0.25}
                Q ${size * 0.85} ${size * 0.25} ${size * 0.85} ${size * 0.3}
                L ${size * 0.85} ${size * 0.75}
                Q ${size * 0.85} ${size * 0.8} ${size * 0.8} ${size * 0.8}
                L ${size * 0.2} ${size * 0.8}
                Q ${size * 0.15} ${size * 0.8} ${size * 0.15} ${size * 0.75}
                Z`}
            fill={style.parchment.base} />
      
      {/* Rolled edges */}
      <ellipse cx={size * 0.17} cy={size * 0.525} rx={size * 0.04} ry={size * 0.15} fill={style.parchment.dark} />
      <ellipse cx={size * 0.83} cy={size * 0.525} rx={size * 0.04} ry={size * 0.15} fill={style.parchment.dark} />
      
      {/* Written text */}
      <text x={size * 0.5} y={size * 0.4} fontSize={size * 0.05} fill={style.ink} textAnchor="middle">{style.script}</text>
      {/* Text lines */}
      <rect x={size * 0.25} y={size * 0.45} width={size * 0.5} height={size * 0.005} fill={style.ink} opacity={0.3} />
      <rect x={size * 0.25} y={size * 0.5} width={size * 0.45} height={size * 0.005} fill={style.ink} opacity={0.3} />
      <rect x={size * 0.25} y={size * 0.55} width={size * 0.48} height={size * 0.005} fill={style.ink} opacity={0.3} />
      <rect x={size * 0.25} y={size * 0.6} width={size * 0.4} height={size * 0.005} fill={style.ink} opacity={0.3} />
      <rect x={size * 0.25} y={size * 0.65} width={size * 0.5} height={size * 0.005} fill={style.ink} opacity={0.3} />
      
      {/* Illuminated letter (for European style) */}
      {culturalZone === 'EUROPEAN' && (
        <g>
          <rect x={size * 0.25} y={size * 0.35} width={size * 0.08} height={size * 0.08} fill="#FFD700" opacity={0.5} />
          <text x={size * 0.29} y={size * 0.41} fontSize={size * 0.07} fill="#8B0000" textAnchor="middle">L</text>
        </g>
      )}
      
      {/* Age spots and texture */}
      <circle cx={size * 0.3} cy={size * 0.7} r={size * 0.02} fill={style.parchment.shadow} opacity={0.2} />
      <circle cx={size * 0.7} cy={size * 0.35} r={size * 0.015} fill={style.parchment.shadow} opacity={0.2} />
      <circle cx={size * 0.6} cy={size * 0.7} r={size * 0.01} fill={style.parchment.shadow} opacity={0.2} />
    </g>
  );
  
  const renderAncientScroll = () => (
    <g filter={PIXEL_SHADOWS.hard}>
      {/* Shadow */}
      <ellipse cx={size * 0.52} cy={size * 0.8} rx={size * 0.28} ry={size * 0.08} fill="#000000" opacity={0.3} />
      
      {/* Weathered rolled scroll */}
      <rect x={size * 0.3} y={size * 0.4} width={size * 0.4} height={size * 0.35} fill={style.parchment.shadow} />
      <rect x={size * 0.3} y={size * 0.4} width={size * 0.06} height={size * 0.35} fill={style.parchment.dark} opacity={0.7} />
      
      {/* Torn edges */}
      <path d={`M ${size * 0.7} ${size * 0.4} L ${size * 0.68} ${size * 0.42} L ${size * 0.7} ${size * 0.44} L ${size * 0.69} ${size * 0.46}`}
            fill={style.parchment.shadow} />
      
      {/* Ancient seal remnants */}
      <ellipse cx={size * 0.5} cy={size * 0.57} rx={size * 0.04} ry={size * 0.05} fill={style.seal} opacity={0.5} />
      
      {/* Mystical glow for ancient scrolls */}
      <circle cx={size * 0.5} cy={size * 0.57} r={size * 0.1} fill={style.seal} opacity={0.1} />
      
      {/* Visible ancient text peeking out */}
      <rect x={size * 0.32} y={size * 0.5} width={size * 0.03} height={size * 0.002} fill={style.ink} opacity={0.5} />
      <rect x={size * 0.32} y={size * 0.52} width={size * 0.025} height={size * 0.002} fill={style.ink} opacity={0.5} />
      <rect x={size * 0.32} y={size * 0.54} width={size * 0.028} height={size * 0.002} fill={style.ink} opacity={0.5} />
    </g>
  );
  
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {variant === 'rolled' && renderRolledScroll()}
      {variant === 'open' && renderOpenScroll()}
      {variant === 'ancient' && renderAncientScroll()}
      {variant === 'sealed' && renderRolledScroll()} {/* Sealed uses rolled with emphasis on seal */}
    </svg>
  );
};