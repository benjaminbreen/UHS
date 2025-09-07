/**
 * VaseOverlay.tsx - Beautiful Stardew Valley/FF6 style decorative vase
 * Rich colors, proper shadows, cultural variations
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, PixelShadow } from '../PixelArtStyleGuide';

interface VaseOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  rotation?: number;
}

const VaseOverlay: React.FC<VaseOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  rotation = 0
}) => {
  const getVaseStyle = () => {
    switch (culturalZone) {
      case 'EAST_ASIAN':
        return {
          colors: getPixelColors('#4169E1'), // Royal blue porcelain
          accent: '#FFFFFF',
          pattern: '#87CEEB', // Sky blue
          gold: '#FFD700',
          shape: 'ming',
          hasFlowers: true
        };
      case 'MENA':
        return {
          colors: getPixelColors('#CD853F'), // Rich terracotta
          accent: '#4169E1',
          pattern: '#FFD700',
          gold: '#8B4513',
          shape: 'amphora',
          hasFlowers: false
        };
      case 'EUROPEAN':
        return {
          colors: getPixelColors('#8B7D6B'), // Refined clay
          accent: '#2F4F4F',
          pattern: '#B8860B',
          gold: '#FFD700',
          shape: 'urn',
          hasFlowers: true
        };
      case 'SOUTH_ASIAN':
        return {
          colors: getPixelColors('#DC143C'), // Crimson
          accent: '#FFD700',
          pattern: '#FF69B4',
          gold: '#FF8C00',
          shape: 'kalash',
          hasFlowers: true
        };
      case 'SUB_SAHARAN_AFRICAN':
        return {
          colors: getPixelColors('#8B4513'), // Rich brown
          accent: '#F4A460',
          pattern: '#FFE4B5',
          gold: '#D2691E',
          shape: 'gourd',
          hasFlowers: false
        };
      default:
        return {
          colors: getPixelColors('#A0522D'),
          accent: '#DEB887',
          pattern: '#F5DEB3',
          gold: '#DAA520',
          shape: 'simple',
          hasFlowers: false
        };
    }
  };
  
  const style = getVaseStyle();
  const vaseScale = 0.65; // Vase takes up 65% of tile (was 40%)
  const vaseX = size * (1 - vaseScale) / 2;
  const vaseY = size * 0.2;
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation} ${size/2} ${size/2})`}>
      {/* Enhanced shadow with gradient */}
      <defs>
        <radialGradient id={`vase-shadow-${x}-${y}`}>
          <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      
      <ellipse 
        cx={size * 0.52} 
        cy={size * 0.85} 
        rx={size * 0.25} 
        ry={size * 0.08} 
        fill={`url(#vase-shadow-${x}-${y})`}
      />
      
      {style.shape === 'ming' ? (
        <g filter={PIXEL_SHADOWS.medium}>
          {/* Base */}
          <ellipse cx={size * 0.5} cy={size * 0.75} rx={size * 0.08} ry={size * 0.03} fill={style.colors.dark} />
          
          {/* Main body with gradient */}
          <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.25} ry={size * 0.3} fill={style.colors.base} />
          <ellipse cx={size * 0.5} cy={size * 0.65} rx={size * 0.23} ry={size * 0.28} fill={style.colors.light} opacity={0.8} />
          
          {/* Neck with detail */}
          <rect x={size * 0.42} y={size * 0.35} width={size * 0.16} height={size * 0.15} fill={style.colors.base} />
          <rect x={size * 0.44} y={size * 0.35} width={size * 0.12} height={size * 0.15} fill={style.colors.light} opacity={0.6} />
          
          {/* Ornate rim */}
          <ellipse cx={size * 0.5} cy={size * 0.35} rx={size * 0.12} ry={size * 0.04} fill={style.colors.base} />
          <ellipse cx={size * 0.5} cy={size * 0.34} rx={size * 0.1} ry={size * 0.03} fill={style.colors.light} />
          
          {/* Intricate patterns */}
          <circle cx={size * 0.5} cy={size * 0.65} r={size * 0.15} fill="none" stroke={style.accent} strokeWidth={1} opacity={0.8} />
          <circle cx={size * 0.5} cy={size * 0.65} r={size * 0.1} fill="none" stroke={style.pattern} strokeWidth={0.5} opacity={0.6} />
          
          {/* Dragon motif */}
          <path d={`M ${size * 0.4} ${size * 0.6} Q ${size * 0.5} ${size * 0.55} ${size * 0.6} ${size * 0.6}`} 
                fill="none" stroke={style.gold} strokeWidth={1} opacity={0.7} />
          <path d={`M ${size * 0.4} ${size * 0.7} Q ${size * 0.5} ${size * 0.75} ${size * 0.6} ${size * 0.7}`} 
                fill="none" stroke={style.gold} strokeWidth={1} opacity={0.7} />
          
          {/* Highlight */}
          <ellipse cx={size * 0.45} cy={size * 0.55} rx={size * 0.08} ry={size * 0.12} fill="#FFFFFF" opacity={0.3} />
        </g>
      ) : style.shape === 'amphora' ? (
        <g filter={PIXEL_SHADOWS.medium}>
          {/* Amphora body with proper shading */}
          <path 
            d={`M ${size * 0.35} ${size * 0.6}
                Q ${size * 0.3} ${size * 0.65} ${size * 0.35} ${size * 0.75}
                Q ${size * 0.4} ${size * 0.82} ${size * 0.5} ${size * 0.82}
                Q ${size * 0.6} ${size * 0.82} ${size * 0.65} ${size * 0.75}
                Q ${size * 0.7} ${size * 0.65} ${size * 0.65} ${size * 0.6}
                Q ${size * 0.6} ${size * 0.45} ${size * 0.55} ${size * 0.35}
                L ${size * 0.45} ${size * 0.35}
                Q ${size * 0.4} ${size * 0.45} ${size * 0.35} ${size * 0.6} Z`}
            fill={style.colors.base}
          />
          
          {/* Shading layer */}
          <path 
            d={`M ${size * 0.37} ${size * 0.6}
                Q ${size * 0.32} ${size * 0.65} ${size * 0.37} ${size * 0.73}
                Q ${size * 0.42} ${size * 0.8} ${size * 0.5} ${size * 0.8}
                Q ${size * 0.45} ${size * 0.8} ${size * 0.4} ${size * 0.73}
                Q ${size * 0.38} ${size * 0.65} ${size * 0.4} ${size * 0.6}
                Q ${size * 0.42} ${size * 0.48} ${size * 0.45} ${size * 0.38}
                Q ${size * 0.42} ${size * 0.48} ${size * 0.37} ${size * 0.6} Z`}
            fill={style.colors.dark}
            opacity={0.5}
          />
          
          {/* Handles with thickness */}
          <path d={`M ${size * 0.38} ${size * 0.45} Q ${size * 0.28} ${size * 0.48} ${size * 0.32} ${size * 0.58}`} 
                fill="none" stroke={style.colors.dark} strokeWidth={3} strokeLinecap="round" />
          <path d={`M ${size * 0.62} ${size * 0.45} Q ${size * 0.72} ${size * 0.48} ${size * 0.68} ${size * 0.58}`} 
                fill="none" stroke={style.colors.dark} strokeWidth={3} strokeLinecap="round" />
          
          {/* Decorative bands */}
          <rect x={size * 0.35} y={size * 0.62} width={size * 0.3} height={size * 0.04} fill={style.accent} />
          <rect x={size * 0.35} y={size * 0.7} width={size * 0.3} height={size * 0.03} fill={style.pattern} />
          <rect x={size * 0.35} y={size * 0.76} width={size * 0.3} height={size * 0.02} fill={style.gold} opacity={0.8} />
          
          {/* Geometric pattern */}
          {[0, 1, 2, 3].map(i => (
            <rect key={i} x={size * (0.38 + i * 0.06)} y={size * 0.63} width={size * 0.02} height={size * 0.02} fill={style.gold} />
          ))}
          
          {/* Highlight */}
          <ellipse cx={size * 0.42} cy={size * 0.5} rx={size * 0.06} ry={size * 0.1} fill="#FFFFFF" opacity={0.4} />
        </g>
      ) : style.shape === 'kalash' ? (
        <g filter={PIXEL_SHADOWS.medium}>
          {/* Indian kalash with coconut top */}
          <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.22} ry={size * 0.25} fill={style.colors.base} />
          <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.2} ry={size * 0.23} fill={style.colors.light} opacity={0.7} />
          
          {/* Neck */}
          <rect x={size * 0.44} y={size * 0.45} width={size * 0.12} height={size * 0.1} fill={style.colors.base} />
          
          {/* Coconut on top */}
          <circle cx={size * 0.5} cy={size * 0.38} r={size * 0.08} fill="#8B4513" />
          <circle cx={size * 0.48} cy={size * 0.36} r={size * 0.02} fill="#654321" />
          
          {/* Mango leaves */}
          <path d={`M ${size * 0.45} ${size * 0.35} Q ${size * 0.42} ${size * 0.3} ${size * 0.43} ${size * 0.28}`} 
                fill="none" stroke="#228B22" strokeWidth={2} />
          <path d={`M ${size * 0.55} ${size * 0.35} Q ${size * 0.58} ${size * 0.3} ${size * 0.57} ${size * 0.28}`} 
                fill="none" stroke="#228B22" strokeWidth={2} />
          
          {/* Sacred patterns */}
          <path d={`M ${size * 0.4} ${size * 0.65} L ${size * 0.5} ${size * 0.6} L ${size * 0.6} ${size * 0.65}`} 
                fill="none" stroke={style.gold} strokeWidth={1.5} />
          <path d={`M ${size * 0.4} ${size * 0.75} L ${size * 0.5} ${size * 0.8} L ${size * 0.6} ${size * 0.75}`} 
                fill="none" stroke={style.gold} strokeWidth={1.5} />
          
          {/* Highlight */}
          <ellipse cx={size * 0.45} cy={size * 0.65} rx={size * 0.08} ry={size * 0.12} fill="#FFFFFF" opacity={0.3} />
        </g>
      ) : (
        <g filter={PIXEL_SHADOWS.medium}>
          {/* Enhanced simple vase */}
          <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.2} ry={size * 0.25} fill={style.colors.base} />
          <ellipse cx={size * 0.5} cy={size * 0.7} rx={size * 0.18} ry={size * 0.23} fill={style.colors.light} opacity={0.6} />
          
          {/* Neck */}
          <rect x={size * 0.43} y={size * 0.45} width={size * 0.14} height={size * 0.12} fill={style.colors.base} />
          <rect x={size * 0.45} y={size * 0.45} width={size * 0.1} height={size * 0.12} fill={style.colors.light} opacity={0.5} />
          
          {/* Rim with gold accent */}
          <ellipse cx={size * 0.5} cy={size * 0.45} rx={size * 0.1} ry={size * 0.03} fill={style.colors.base} />
          <ellipse cx={size * 0.5} cy={size * 0.44} rx={size * 0.08} ry={size * 0.02} fill={style.gold} opacity={0.8} />
          
          {/* Simple decoration */}
          <rect x={size * 0.35} y={size * 0.65} width={size * 0.3} height={size * 0.03} fill={style.accent} opacity={0.7} />
          <rect x={size * 0.35} y={size * 0.72} width={size * 0.3} height={size * 0.02} fill={style.pattern} opacity={0.6} />
          
          {/* Highlight */}
          <ellipse cx={size * 0.44} cy={size * 0.6} rx={size * 0.06} ry={size * 0.1} fill="#FFFFFF" opacity={0.35} />
        </g>
      )}
      
      {/* Optional flowers for certain styles */}
      {style.hasFlowers && (
        <g>
          {/* Flower stems */}
          <line x1={size * 0.48} y1={size * 0.4} x2={size * 0.46} y2={size * 0.25} stroke="#228B22" strokeWidth={1.5} />
          <line x1={size * 0.52} y1={size * 0.4} x2={size * 0.54} y2={size * 0.25} stroke="#228B22" strokeWidth={1.5} />
          
          {/* Flowers */}
          <circle cx={size * 0.46} cy={size * 0.24} r={size * 0.03} fill="#FF69B4" />
          <circle cx={size * 0.54} cy={size * 0.24} r={size * 0.03} fill="#FFB6C1" />
          <circle cx={size * 0.46} cy={size * 0.23} r={size * 0.015} fill="#FFD700" />
          <circle cx={size * 0.54} cy={size * 0.23} r={size * 0.015} fill="#FFD700" />
        </g>
      )}
    </g>
  );
};

export default VaseOverlay;