/**
 * DaisSymbol.tsx - Raised platform for thrones
 * Stardew Valley style with dollhouse perspective
 */

import React from 'react';
import { CulturalZone } from '../../../../types';

interface DaisSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone;
  era?: number;
  variant?: 'wood' | 'stone' | 'marble' | 'carpet';
}

export const DaisSymbol: React.FC<DaisSymbolProps> = ({ 
  x, 
  y, 
  size,
  variant = 'wood'
}) => {
  // Stardew Valley style colors with rich shadows
  const colors = {
    wood: {
      top: '#8B6341',      // Medium wood
      front: '#6B4A31',    // Darker wood front
      highlight: '#AB7A51', // Light wood highlight
      shadow: '#4B3A21'    // Deep shadow
    },
    stone: {
      top: '#8A8A8A',
      front: '#6A6A6A',
      highlight: '#AAAAAA',
      shadow: '#4A4A4A'
    },
    marble: {
      top: '#E8E0D8',
      front: '#D8CFC8',
      highlight: '#F8F0E8',
      shadow: '#C8BFB8'
    },
    carpet: {
      top: '#8B1538',      // Royal red
      front: '#6B0F28',
      highlight: '#AB2548',
      shadow: '#5B0518'
    }
  };

  const palette = colors[variant] || colors.wood;
  const platformHeight = size * 0.15; // Platform is 15% of tile height

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow under platform */}
      <rect
        x={size * 0.05}
        y={size * 0.85}
        width={size * 0.95}
        height={size * 0.1}
        fill="#000000"
        opacity={0.3}
      />
      
      {/* Platform front face (visible in dollhouse view) */}
      <rect
        x={0}
        y={size * 0.7}
        width={size}
        height={platformHeight}
        fill={palette.front}
      />
      
      {/* Platform top surface */}
      <rect
        x={0}
        y={size * 0.6}
        width={size}
        height={size * 0.1}
        fill={palette.top}
      />
      
      {/* Highlight edge */}
      <rect
        x={0}
        y={size * 0.6}
        width={size}
        height={size * 0.02}
        fill={palette.highlight}
      />
      
      {/* Shadow line between top and front */}
      <rect
        x={0}
        y={size * 0.69}
        width={size}
        height={size * 0.01}
        fill={palette.shadow}
      />
      
      {/* Decorative trim for royal variants */}
      {variant === 'carpet' && (
        <>
          {/* Gold trim */}
          <rect
            x={size * 0.1}
            y={size * 0.72}
            width={size * 0.8}
            height={size * 0.02}
            fill="#D4AF37"
          />
          <rect
            x={size * 0.1}
            y={size * 0.76}
            width={size * 0.8}
            height={size * 0.02}
            fill="#D4AF37"
          />
        </>
      )}
      
      {/* Wood grain detail */}
      {variant === 'wood' && (
        <>
          <line
            x1={size * 0.2}
            y1={size * 0.62}
            x2={size * 0.8}
            y2={size * 0.62}
            stroke={palette.shadow}
            strokeWidth={0.5}
            opacity={0.3}
          />
          <line
            x1={size * 0.15}
            y1={size * 0.65}
            x2={size * 0.85}
            y2={size * 0.65}
            stroke={palette.shadow}
            strokeWidth={0.5}
            opacity={0.3}
          />
        </>
      )}
    </g>
  );
};