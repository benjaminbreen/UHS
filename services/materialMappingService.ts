/**
 * materialMappingService.ts
 * Bridges the augmentation material system with the rendering material system
 * Ensures consistent material appearance across all special map symbols
 */

import { SpecialMapConfig } from '../types/specialMapTypes';

export type AugmentationMaterial = 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel';
export type RenderMaterial = 'wood' | 'stone' | 'metal' | 'fabric' | 'marble';

interface MaterialStyle {
  base: string;
  highlight: string;
  shadow: string;
  detail: string;
  texture?: string;
}

/**
 * Comprehensive material color definitions matching augmentation system
 */
export const AUGMENTATION_MATERIAL_STYLES: Record<AugmentationMaterial, MaterialStyle> = {
  white_marble: {
    base: '#f8f8f6',
    highlight: '#ffffff',
    shadow: '#d4d4d0',
    detail: '#e8e8e4',
    texture: 'veined'
  },
  grey_stone: {
    base: '#8a8a8a',
    highlight: '#a8a8a8',
    shadow: '#5a5a5a',
    detail: '#7a7a7a',
    texture: 'rough'
  },
  red_lacquer: {
    base: '#8b2222',
    highlight: '#ab3232',
    shadow: '#5b1212',
    detail: '#7b1c1c',
    texture: 'glossy'
  },
  sandstone: {
    base: '#c4a572',
    highlight: '#d4b582',
    shadow: '#947852',
    detail: '#b49562',
    texture: 'grainy'
  },
  wood: {
    base: '#8b6f47',
    highlight: '#9b7f57',
    shadow: '#6b4f37',
    detail: '#7b5f37',
    texture: 'grain'
  },
  steel: {
    base: '#b0b0c0',
    highlight: '#d0d0e0',
    shadow: '#808090',
    detail: '#9090a0',
    texture: 'smooth'
  }
};

/**
 * Map augmentation materials to render materials for Symbol2D system
 */
export function mapAugmentationToRenderMaterial(augMaterial: AugmentationMaterial): RenderMaterial {
  switch (augMaterial) {
    case 'white_marble':
      return 'marble';
    case 'grey_stone':
    case 'sandstone':
      return 'stone';
    case 'red_lacquer':
    case 'wood':
      return 'wood';
    case 'steel':
      return 'metal';
    default:
      return 'wood';
  }
}

/**
 * Get material style for a given augmentation material
 */
export function getMaterialStyle(material: AugmentationMaterial): MaterialStyle {
  return AUGMENTATION_MATERIAL_STYLES[material];
}

/**
 * Determine appropriate material for furniture based on config
 */
export function getFurnitureMaterial(
  config: SpecialMapConfig,
  furnitureType: 'table' | 'chair' | 'throne' | 'desk' | 'bench'
): AugmentationMaterial {
  const { culturalZone, era } = config;
  
  // Modern era uses steel for most furniture
  if (era === 'MODERN_ERA' || era === 'FUTURE_ERA') {
    return 'steel';
  }
  
  // Thrones use more prestigious materials
  if (furnitureType === 'throne') {
    if (culturalZone === 'EUROPEAN' && era !== 'PREHISTORY') {
      return era === 'MEDIEVAL' ? 'grey_stone' : 'white_marble';
    }
    if (culturalZone === 'EAST_ASIAN') {
      return 'red_lacquer';
    }
    if (culturalZone === 'MENA' || culturalZone === 'AFRICAN') {
      return 'sandstone';
    }
  }
  
  // Regular furniture defaults
  switch (culturalZone) {
    case 'EUROPEAN':
      return era === 'ANTIQUITY' ? 'white_marble' : 'wood';
    case 'EAST_ASIAN':
      return era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN' ? 'red_lacquer' : 'wood';
    case 'MENA':
    case 'AFRICAN':
      return furnitureType === 'bench' ? 'sandstone' : 'wood';
    case 'AMERICAS':
    case 'OCEANIA':
      return 'wood';
    default:
      return 'wood';
  }
}

/**
 * Apply material style to SVG element attributes
 */
export function applyMaterialStyle(
  material: AugmentationMaterial,
  elementType: 'fill' | 'stroke' | 'both' = 'fill'
): { fill?: string; stroke?: string } {
  const style = getMaterialStyle(material);
  
  if (elementType === 'fill') {
    return { fill: style.base };
  } else if (elementType === 'stroke') {
    return { stroke: style.shadow };
  } else {
    return { fill: style.base, stroke: style.shadow };
  }
}