/**
 * Symbol2DUtils.ts
 * Utilities and constants for 2.5D symbol rendering system
 */

import { CulturalZone, HistoricalEra } from '../../../../../types';

// Perspective and rendering constants
export const PERSPECTIVE_CONSTANTS = {
  WALL_HEIGHT: 20,  // px above floor
  FURNITURE_FRONT_RATIO: 0.6,  // Front face is 60% of height
  SHADOW_OFFSET_X: 2,
  SHADOW_OFFSET_Y: 1,
  SHADOW_BLUR: 2,
  EDGE_HIGHLIGHT_RATIO: 1.2,  // 20% brighter
  EDGE_SHADOW_RATIO: 0.8,     // 20% darker
  ISOMETRIC_ANGLE: 30,        // degrees
  THREE_QUARTER_ANGLE: 45     // degrees
};

// Material definitions with color and texture properties
export const MATERIAL_PROPERTIES = {
  wood: {
    baseColor: '#8B4513',
    highlight: '#A0522D',
    shadow: '#654321',
    texture: 'grain',
    roughness: 0.7
  },
  stone: {
    baseColor: '#808080',
    highlight: '#A9A9A9',
    shadow: '#696969',
    texture: 'rough',
    roughness: 0.9
  },
  metal: {
    baseColor: '#708090',
    highlight: '#B0C4DE',
    shadow: '#2F4F4F',
    texture: 'smooth',
    roughness: 0.2
  },
  fabric: {
    baseColor: '#8B7D6B',
    highlight: '#A0937F',
    shadow: '#705C4A',
    texture: 'woven',
    roughness: 0.8
  },
  marble: {
    baseColor: '#F5F5F5',
    highlight: '#FFFFFF',
    shadow: '#E0E0E0',
    texture: 'veined',
    roughness: 0.1
  }
};

// Cultural color palettes
export const CULTURAL_PALETTES = {
  EUROPEAN: {
    primary: '#654321',    // Dark wood
    secondary: '#8B4513',  // Medium wood
    accent: '#2F4F4F',     // Iron/metal
    stone: '#808080',      // Gray stone
    fabric: '#8B0000'      // Deep red
  },
  EAST_ASIAN: {
    primary: '#8B4513',    // Natural wood
    secondary: '#DEB887',  // Bamboo
    accent: '#8B0000',     // Red lacquer
    stone: '#696969',      // Dark stone
    fabric: '#000080'      // Deep blue
  },
  MENA: {
    primary: '#DEB887',    // Sandstone
    secondary: '#CD853F',  // Tan
    accent: '#DAA520',     // Gold/brass
    stone: '#F5DEB3',      // Light stone
    fabric: '#4169E1'      // Royal blue
  },
  AFRICAN: {
    primary: '#8B4513',    // Dark wood
    secondary: '#D2691E',  // Carved wood
    accent: '#B8860B',     // Bronze
    stone: '#A0522D',      // Earth stone
    fabric: '#DC143C'      // Crimson
  }
};

// Utility functions

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((num >> 16) * percent));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) * percent));
  const b = Math.min(255, Math.floor((num & 0x0000FF) * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.floor((num >> 16) * percent));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * percent));
  const b = Math.max(0, Math.floor((num & 0x0000FF) * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Get material colors based on cultural zone
 */
export function getMaterialColors(
  material: keyof typeof MATERIAL_PROPERTIES,
  culturalZone: CulturalZone | string
): { base: string; highlight: string; shadow: string } {
  const baseMaterial = MATERIAL_PROPERTIES[material];
  const culturalPalette = CULTURAL_PALETTES[culturalZone as keyof typeof CULTURAL_PALETTES];
  
  if (!culturalPalette) {
    return {
      base: baseMaterial.baseColor,
      highlight: baseMaterial.highlight,
      shadow: baseMaterial.shadow
    };
  }
  
  // Adjust material colors based on cultural zone
  if (material === 'wood') {
    return {
      base: culturalPalette.primary,
      highlight: lightenColor(culturalPalette.primary, PERSPECTIVE_CONSTANTS.EDGE_HIGHLIGHT_RATIO),
      shadow: darkenColor(culturalPalette.primary, PERSPECTIVE_CONSTANTS.EDGE_SHADOW_RATIO)
    };
  }
  
  return {
    base: baseMaterial.baseColor,
    highlight: baseMaterial.highlight,
    shadow: baseMaterial.shadow
  };
}

/**
 * Generate wood grain texture lines
 */
export function generateWoodGrain(
  width: number, 
  height: number, 
  color: string,
  horizontal: boolean = true
): JSX.Element[] {
  const lines: JSX.Element[] = [];
  const spacing = horizontal ? height / 4 : width / 4;
  
  for (let i = 1; i < 4; i++) {
    const pos = spacing * i;
    lines.push(
      <line
        key={`grain-${i}`}
        x1={horizontal ? 0 : pos}
        y1={horizontal ? pos : 0}
        x2={horizontal ? width : pos}
        y2={horizontal ? pos : height}
        stroke={color}
        strokeWidth="0.5"
        opacity="0.3"
      />
    );
  }
  
  return lines;
}

/**
 * Generate stone texture dots
 */
export function generateStoneTexture(
  width: number,
  height: number,
  color: string,
  seed: number = 0
): JSX.Element[] {
  const dots: JSX.Element[] = [];
  const random = (n: number) => ((seed * 9301 + 49297) % 233280) / 233280;
  
  for (let i = 0; i < 8; i++) {
    const x = random(i) * width;
    const y = random(i + 100) * height;
    const r = 0.5 + random(i + 200) * 0.5;
    
    dots.push(
      <circle
        key={`stone-${i}`}
        cx={x}
        cy={y}
        r={r}
        fill={color}
        opacity="0.2"
      />
    );
  }
  
  return dots;
}

/**
 * Create a drop shadow filter
 */
export function createDropShadow(id: string): JSX.Element {
  return (
    <filter id={id}>
      <feGaussianBlur in="SourceAlpha" stdDeviation={PERSPECTIVE_CONSTANTS.SHADOW_BLUR} />
      <feOffset dx={PERSPECTIVE_CONSTANTS.SHADOW_OFFSET_X} dy={PERSPECTIVE_CONSTANTS.SHADOW_OFFSET_Y} />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.2" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

/**
 * Calculate 3/4 perspective transform
 */
export function calculate3QuarterTransform(
  height: number,
  frontRatio: number = PERSPECTIVE_CONSTANTS.FURNITURE_FRONT_RATIO
): {
  frontHeight: number;
  topHeight: number;
  sideOffset: number;
} {
  return {
    frontHeight: height * frontRatio,
    topHeight: height * (1 - frontRatio),
    sideOffset: height * 0.2 // Slight offset for 3D effect
  };
}