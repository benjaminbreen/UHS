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
      {/* Full tile base fill */}
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill={palette.top}
      />
      
      {/* Subtle shadow border */}
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill="none"
        stroke={palette.shadow}
        strokeWidth={1}
        opacity={0.3}
      />
      
      {/* Raised platform effect - lighter highlight on top edge */}
      <rect
        x={0}
        y={0}
        width={size}
        height={size * 0.1}
        fill={palette.highlight}
        opacity={0.4}
      />
      
      {/* Left side highlight */}
      <rect
        x={0}
        y={0}
        width={size * 0.05}
        height={size}
        fill={palette.highlight}
        opacity={0.3}
      />
      
      {/* Wood grain detail for full tile */}
      {variant === 'wood' && (
        <>
          <line
            x1={size * 0.1}
            y1={size * 0.3}
            x2={size * 0.9}
            y2={size * 0.3}
            stroke={palette.shadow}
            strokeWidth={0.8}
            opacity={0.25}
          />
          <line
            x1={size * 0.05}
            y1={size * 0.6}
            x2={size * 0.95}
            y2={size * 0.6}
            stroke={palette.shadow}
            strokeWidth={0.8}
            opacity={0.25}
          />
          <line
            x1={size * 0.15}
            y1={size * 0.8}
            x2={size * 0.85}
            y2={size * 0.8}
            stroke={palette.shadow}
            strokeWidth={0.8}
            opacity={0.25}
          />
        </>
      )}
      
      {/* Decorative trim for royal variants */}
      {variant === 'carpet' && (
        <>
          {/* Gold border */}
          <rect
            x={size * 0.05}
            y={size * 0.05}
            width={size * 0.9}
            height={size * 0.9}
            fill="none"
            stroke="#D4AF37"
            strokeWidth={2}
          />
          <rect
            x={size * 0.1}
            y={size * 0.1}
            width={size * 0.8}
            height={size * 0.8}
            fill="none"
            stroke="#D4AF37"
            strokeWidth={1}
            opacity={0.6}
          />
        </>
      )}
    </g>
  );
};