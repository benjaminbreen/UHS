/**
 * Round Table Symbol Component
 * Multi-tile round tables for dining and meeting areas
 */

import React from 'react';
import { PIXEL_SHADOWS, MATERIAL_COLORS, getPixelColors } from '../../PixelArtStyleGuide';

interface RoundTableSymbolProps {
  x: number;
  y: number;
  size: number;
  variant?: string;
  material?: string;
  isLit?: boolean;
}

const RoundTableSymbol: React.FC<RoundTableSymbolProps> = ({ 
  x, 
  y, 
  size,
  variant = 'small',
  material = 'oak',
  isLit = true
}) => {
  const colors = getPixelColors(material, isLit);
  const shadow = isLit ? PIXEL_SHADOWS.MEDIUM : PIXEL_SHADOWS.SOFT;
  
  // Small round table (single tile)
  if (variant === 'small') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Table shadow */}
        <ellipse 
          cx={size/2} 
          cy={size/2 + 2} 
          rx={size * 0.35} 
          ry={size * 0.15}
          fill={shadow}
          opacity={0.3}
        />
        
        {/* Table legs (visible corners) */}
        <rect x={size * 0.2} y={size * 0.65} width={2} height={4} fill={colors.dark} />
        <rect x={size * 0.75} y={size * 0.65} width={2} height={4} fill={colors.dark} />
        
        {/* Table top */}
        <ellipse 
          cx={size/2} 
          cy={size/2} 
          rx={size * 0.4} 
          ry={size * 0.25}
          fill={colors.base}
        />
        
        {/* Table top rim */}
        <ellipse 
          cx={size/2} 
          cy={size/2} 
          rx={size * 0.4} 
          ry={size * 0.25}
          fill="none"
          stroke={colors.dark}
          strokeWidth={1}
        />
        
        {/* Wood grain detail */}
        <line 
          x1={size * 0.15} 
          y1={size * 0.45} 
          x2={size * 0.85} 
          y2={size * 0.45}
          stroke={colors.detail}
          strokeWidth={0.5}
          opacity={0.4}
        />
        <line 
          x1={size * 0.2} 
          y1={size * 0.55} 
          x2={size * 0.8} 
          y2={size * 0.55}
          stroke={colors.detail}
          strokeWidth={0.5}
          opacity={0.4}
        />
        
        {/* Table surface highlight */}
        <ellipse 
          cx={size * 0.45} 
          cy={size * 0.4} 
          rx={size * 0.15} 
          ry={size * 0.08}
          fill={colors.light}
          opacity={0.3}
        />
      </g>
    );
  }
  
  // Medium round table part (3x3 grid)
  // Variant indicates position: top, bottom, left, right, center, corners
  if (variant.startsWith('medium_')) {
    const position = variant.replace('medium_', '');
    
    return (
      <g transform={`translate(${x}, ${y})`}>
        {position === 'center' && (
          <>
            {/* Center pedestal */}
            <rect 
              x={size * 0.35} 
              y={size * 0.35} 
              width={size * 0.3} 
              height={size * 0.3}
              fill={colors.dark}
            />
            {/* Decorative center */}
            <circle 
              cx={size/2} 
              cy={size/2} 
              r={size * 0.1}
              fill={colors.detail}
            />
          </>
        )}
        
        {/* Table surface sections */}
        {position === 'top' && (
          <path 
            d={`M ${size * 0.2} ${size * 0.8} 
                Q ${size * 0.5} ${size * 0.2} ${size * 0.8} ${size * 0.8}`}
            fill={colors.base}
            stroke={colors.dark}
            strokeWidth={1}
          />
        )}
        
        {position === 'bottom' && (
          <path 
            d={`M ${size * 0.2} ${size * 0.2} 
                Q ${size * 0.5} ${size * 0.8} ${size * 0.8} ${size * 0.2}`}
            fill={colors.base}
            stroke={colors.dark}
            strokeWidth={1}
          />
        )}
        
        {position === 'left' && (
          <path 
            d={`M ${size * 0.8} ${size * 0.2} 
                Q ${size * 0.2} ${size * 0.5} ${size * 0.8} ${size * 0.8}`}
            fill={colors.base}
            stroke={colors.dark}
            strokeWidth={1}
          />
        )}
        
        {position === 'right' && (
          <path 
            d={`M ${size * 0.2} ${size * 0.2} 
                Q ${size * 0.8} ${size * 0.5} ${size * 0.2} ${size * 0.8}`}
            fill={colors.base}
            stroke={colors.dark}
            strokeWidth={1}
          />
        )}
        
        {/* Corner pieces */}
        {position.includes('top_left') && (
          <path 
            d={`M ${size * 0.5} ${size} 
                A ${size * 0.5} ${size * 0.5} 0 0 1 ${size} ${size * 0.5}
                L ${size} ${size}
                Z`}
            fill={colors.base}
            stroke={colors.dark}
            strokeWidth={1}
          />
        )}
        
        {position.includes('top_right') && (
          <path 
            d={`M 0 ${size * 0.5} 
                A ${size * 0.5} ${size * 0.5} 0 0 1 ${size * 0.5} ${size}
                L 0 ${size}
                Z`}
            fill={colors.base}
            stroke={colors.dark}
            strokeWidth={1}
          />
        )}
        
        {position.includes('bottom_left') && (
          <path 
            d={`M ${size * 0.5} 0 
                A ${size * 0.5} ${size * 0.5} 0 0 0 ${size} ${size * 0.5}
                L ${size} 0
                Z`}
            fill={colors.base}
            stroke={colors.dark}
            strokeWidth={1}
          />
        )}
        
        {position.includes('bottom_right') && (
          <path 
            d={`M 0 ${size * 0.5} 
                A ${size * 0.5} ${size * 0.5} 0 0 0 ${size * 0.5} 0
                L 0 0
                Z`}
            fill={colors.base}
            stroke={colors.dark}
            strokeWidth={1}
          />
        )}
        
        {/* Wood grain for straight sections */}
        {(position === 'top' || position === 'bottom' || 
          position === 'left' || position === 'right') && (
          <>
            <line 
              x1={size * 0.3} 
              y1={size * 0.5} 
              x2={size * 0.7} 
              y2={size * 0.5}
              stroke={colors.detail}
              strokeWidth={0.5}
              opacity={0.3}
            />
          </>
        )}
      </g>
    );
  }
  
  // Default fallback
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={size} height={size} fill={colors.base} />
    </g>
  );
};

export default RoundTableSymbol;