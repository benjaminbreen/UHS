/**
 * PixelArtStyleGuide.tsx
 * Shared styling utilities for consistent Stardew Valley/FF6 pixel art aesthetic
 */

import React from 'react';

export const PIXEL_SHADOWS = {
  soft: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.2))',
  medium: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))',
  hard: 'drop-shadow(3px 3px 3px rgba(0,0,0,0.4))',
  glow: 'drop-shadow(0px 0px 4px rgba(255,220,100,0.5))'
};

export const SHADOW_DIRECTION = {
  x: 2,  // Down-left shadow
  y: 2,
  blur: 2,
  opacity: 0.3
};

export interface PixelColors {
  base: string;
  light: string;
  dark: string;
  outline: string;
  highlight?: string;
  shadow?: string;
}

export const getPixelColors = (baseColor: string): PixelColors => {
  // Convert hex to RGB for manipulation
  const hex2rgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const rgb2hex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  
  const rgb = hex2rgb(baseColor);
  
  return {
    base: baseColor,
    light: rgb2hex(
      Math.min(255, rgb.r + 40),
      Math.min(255, rgb.g + 40),
      Math.min(255, rgb.b + 40)
    ),
    dark: rgb2hex(
      Math.max(0, rgb.r - 40),
      Math.max(0, rgb.g - 40),
      Math.max(0, rgb.b - 40)
    ),
    outline: rgb2hex(
      Math.max(0, rgb.r - 80),
      Math.max(0, rgb.g - 80),
      Math.max(0, rgb.b - 80)
    ),
    highlight: rgb2hex(
      Math.min(255, rgb.r + 60),
      Math.min(255, rgb.g + 60),
      Math.min(255, rgb.b + 60)
    ),
    shadow: rgb2hex(
      Math.max(0, rgb.r - 60),
      Math.max(0, rgb.g - 60),
      Math.max(0, rgb.b - 60)
    )
  };
};

// Material-specific color palettes
export const MATERIAL_COLORS = {
  wood: {
    oak: getPixelColors('#8B6F47'),
    walnut: getPixelColors('#5D4E37'),
    pine: getPixelColors('#C4A57B'),
    ebony: getPixelColors('#3A3A3A')
  },
  stone: {
    granite: getPixelColors('#8B8680'),
    marble: getPixelColors('#F0EDE5'),
    sandstone: getPixelColors('#D4A76A'),
    limestone: getPixelColors('#E0D7C6')
  },
  metal: {
    iron: getPixelColors('#434B4D'),
    bronze: getPixelColors('#CD7F32'),
    gold: getPixelColors('#FFD700'),
    silver: getPixelColors('#C0C0C0')
  },
  fabric: {
    wool: getPixelColors('#E5D4B0'),
    silk: getPixelColors('#F8E7D1'),
    cotton: getPixelColors('#FAF0E6'),
    velvet: getPixelColors('#8B1A1A')
  }
};

// Helper component for consistent pixel shadows
export const PixelShadow: React.FC<{
  x?: number;
  y?: number;
  width: number;
  height: number;
  opacity?: number;
}> = ({ x = 0, y = 0, width, height, opacity = 0.3 }) => (
  <rect
    x={x + SHADOW_DIRECTION.x}
    y={y + SHADOW_DIRECTION.y}
    width={width}
    height={height}
    fill="#000000"
    opacity={opacity}
  />
);

// Helper for 3/4 perspective transformation
export const get3QuarterTransform = (size: number) => {
  return {
    // Top surface is visible at ~45 degree angle
    topSkewY: -0.2,
    // Front face is full height
    frontHeight: size * 0.6,
    // Top face is compressed
    topHeight: size * 0.4,
    // Depth offset for 3D effect
    depthOffset: size * 0.1
  };
};

// Standard sizes for consistency
export const STANDARD_SIZES = {
  furniture: 0.7,      // 70% of tile for furniture
  decoration: 0.5,     // 50% of tile for decorations
  wall: 1.0,          // Full tile for walls
  item: 0.3,          // 30% for small items
  large: 0.85         // 85% for large furniture
};

// Lighting effects for different times of day
export const getLightingFilter = (timeOfDay: 'dawn' | 'day' | 'dusk' | 'night') => {
  switch (timeOfDay) {
    case 'dawn':
      return 'sepia(0.2) brightness(1.1) hue-rotate(-10deg)';
    case 'day':
      return 'brightness(1.0)';
    case 'dusk':
      return 'sepia(0.3) brightness(0.9) hue-rotate(10deg)';
    case 'night':
      return 'brightness(0.6) contrast(1.1)';
    default:
      return 'brightness(1.0)';
  }
};

// Get appropriate detail level based on zoom
export const getDetailLevel = (size: number): 'low' | 'medium' | 'high' => {
  if (size < 24) return 'low';
  if (size < 48) return 'medium';
  return 'high';
};

// Cultural pattern overlays
export const getCulturalPattern = (culture: string, type: 'geometric' | 'floral' | 'abstract') => {
  const patterns: Record<string, Record<string, string>> = {
    EUROPEAN: {
      geometric: 'M0,0 L2,2 L0,4 L-2,2 Z',  // Diamond pattern
      floral: 'M0,0 Q2,2 0,4 T0,8',         // Vine pattern
      abstract: 'M0,0 L4,0 L2,4 Z'          // Triangle pattern
    },
    MENA: {
      geometric: 'M0,0 L3,0 L3,3 L0,3 Z M1,1 L2,1 L2,2 L1,2 Z',  // Islamic tile
      floral: 'M0,2 Q2,0 4,2 T8,2',         // Arabesque
      abstract: 'M0,0 L2,3 L4,0 L2,1 Z'     // Star pattern
    },
    ASIAN: {
      geometric: 'M0,1 L1,0 L2,1 L1,2 Z',   // Lattice
      floral: 'M0,4 Q2,2 4,4 Q2,3 0,4',     // Cherry blossom
      abstract: 'M0,0 Q4,2 0,4'             // Wave pattern
    }
  };
  
  return patterns[culture]?.[type] || patterns.EUROPEAN[type];
};

// Add pixelated edge effect
export const PixelatedEdge: React.FC<{
  size: number;
  color: string;
}> = ({ size, color }) => {
  const pixelSize = Math.max(1, size / 32);
  return (
    <g>
      {[0, 1, 2, 3].map(i => (
        <rect
          key={i}
          x={i * pixelSize}
          y={i * pixelSize}
          width={pixelSize}
          height={pixelSize}
          fill={color}
          opacity={1 - (i * 0.25)}
        />
      ))}
    </g>
  );
};