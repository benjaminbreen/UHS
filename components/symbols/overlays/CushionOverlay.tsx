/**
 * CushionOverlay.tsx - Luxurious Stardew Valley/FF6 style cushion
 * Soft fabric textures with volume and cultural patterns
 */
import React from 'react';
import { getPixelColors, PIXEL_SHADOWS, MATERIAL_COLORS } from '../PixelArtStyleGuide';

interface CushionOverlayProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  rotation?: number;
}

const CushionOverlay: React.FC<CushionOverlayProps> = ({ 
  x, 
  y, 
  size,
  culturalZone = 'EUROPEAN',
  rotation = 0
}) => {
  const getCushionStyle = () => {
    switch (culturalZone) {
      case 'EAST_ASIAN':
        return {
          color: '#8B0000', // Deep red
          trim: '#FFD700', // Gold
          pattern: 'zabuton'
        };
      case 'MENA':
      case 'SOUTH_ASIAN':
        return {
          color: '#4B0082', // Indigo
          trim: '#FFD700', // Gold
          pattern: 'ornate'
        };
      case 'SUB_SAHARAN_AFRICAN':
        return {
          color: '#D2691E', // Chocolate
          trim: '#F4A460', // Sandy brown
          pattern: 'woven'
        };
      default:
        return {
          color: '#8B4513', // Saddle brown
          trim: '#D2691E', // Chocolate
          pattern: 'simple'
        };
    }
  };
  
  const style = getCushionStyle();
  
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation} ${size/2} ${size/2})`}>
      {/* Shadow at 45 degrees */}
      <ellipse 
        cx={size * 0.52} 
        cy={size * 0.75} 
        rx={size * 0.35} 
        ry={size * 0.12} 
        fill="#000000" 
        opacity={0.2} 
      />
      
      {/* Main cushion body */}
      <ellipse 
        cx={size * 0.5} 
        cy={size * 0.65} 
        rx={size * 0.35} 
        ry={size * 0.25} 
        fill={style.color}
        stroke={style.trim}
        strokeWidth={1}
      />
      
      {/* Top surface with slight 3D effect */}
      <ellipse 
        cx={size * 0.5} 
        cy={size * 0.62} 
        rx={size * 0.32} 
        ry={size * 0.22} 
        fill={style.color}
        opacity={0.9}
      />
      
      {style.pattern === 'zabuton' && (
        <>
          {/* Japanese square cushion corners */}
          <rect x={size * 0.25} y={size * 0.5} width={size * 0.5} height={size * 0.3} fill={style.color} rx={3} />
          {/* Tassels */}
          <circle cx={size * 0.25} cy={size * 0.5} r={size * 0.02} fill={style.trim} />
          <circle cx={size * 0.75} cy={size * 0.5} r={size * 0.02} fill={style.trim} />
          <circle cx={size * 0.25} cy={size * 0.8} r={size * 0.02} fill={style.trim} />
          <circle cx={size * 0.75} cy={size * 0.8} r={size * 0.02} fill={style.trim} />
        </>
      )}
      
      {style.pattern === 'ornate' && (
        <>
          {/* Decorative pattern */}
          <circle cx={size * 0.5} cy={size * 0.65} r={size * 0.08} fill="none" stroke={style.trim} strokeWidth={0.5} />
          <circle cx={size * 0.5} cy={size * 0.65} r={size * 0.15} fill="none" stroke={style.trim} strokeWidth={0.5} opacity={0.5} />
          {/* Center jewel */}
          <circle cx={size * 0.5} cy={size * 0.65} r={size * 0.03} fill={style.trim} opacity={0.8} />
        </>
      )}
      
      {style.pattern === 'woven' && (
        <>
          {/* Woven texture lines */}
          <line x1={size * 0.3} y1={size * 0.6} x2={size * 0.7} y2={size * 0.6} stroke={style.trim} strokeWidth={0.5} opacity={0.5} />
          <line x1={size * 0.3} y1={size * 0.65} x2={size * 0.7} y2={size * 0.65} stroke={style.trim} strokeWidth={0.5} opacity={0.5} />
          <line x1={size * 0.3} y1={size * 0.7} x2={size * 0.7} y2={size * 0.7} stroke={style.trim} strokeWidth={0.5} opacity={0.5} />
        </>
      )}
    </g>
  );
};

export default CushionOverlay;