/**
 * Utility functions for special map layout generation
 * Extracted to avoid circular dependencies
 */

import { Tile, BiomeType, CulturalZone, HistoricalEra } from '../../types';
// Material type for cultural variations
export type MaterialType = 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel' | 
                          'mud_brick' | 'thatch' | 'bamboo' | 'adobe' | 'brick';

/**
 * Place a rectangular wall with optional openings
 */
export function placeWallRectangle(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  openings?: Array<{ side: 'north' | 'south' | 'east' | 'west'; offset: number }>
) {
  // Top and bottom walls
  for (let i = 0; i < width; i++) {
    const skipTop = openings?.some(o => o.side === 'north' && o.offset === i);
    const skipBottom = openings?.some(o => o.side === 'south' && o.offset === i);
    
    if (!skipTop && tiles[y] && tiles[y][x + i]) {
      tiles[y][x + i].biome = BiomeType.WALL;
      tiles[y][x + i].isBlocking = true;
    }
    if (!skipBottom && tiles[y + height - 1] && tiles[y + height - 1][x + i]) {
      tiles[y + height - 1][x + i].biome = BiomeType.WALL;
      tiles[y + height - 1][x + i].isBlocking = true;
    }
  }
  
  // Left and right walls
  for (let i = 0; i < height; i++) {
    const skipLeft = openings?.some(o => o.side === 'west' && o.offset === i);
    const skipRight = openings?.some(o => o.side === 'east' && o.offset === i);
    
    if (!skipLeft && tiles[y + i] && tiles[y + i][x]) {
      tiles[y + i][x].biome = BiomeType.WALL;
      tiles[y + i][x].isBlocking = true;
    }
    if (!skipRight && tiles[y + i] && tiles[y + i][x + width - 1]) {
      tiles[y + i][x + width - 1].biome = BiomeType.WALL;
      tiles[y + i][x + width - 1].isBlocking = true;
    }
  }
}

/**
 * Fill a rectangular area with a specific biome
 */
export function fillArea(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  biome: BiomeType
) {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      if (tiles[y + dy] && tiles[y + dy][x + dx]) {
        tiles[y + dy][x + dx].biome = biome;
        tiles[y + dy][x + dx].isBlocking = false;
      }
    }
  }
}

/**
 * Get the era key for material lookup
 */
function getEraKey(era: HistoricalEra): string {
  switch (era) {
    case HistoricalEra.PREHISTORY:
      return 'prehistoric';
    case HistoricalEra.ANTIQUITY:
      return 'antiquity';
    case HistoricalEra.MEDIEVAL:
      return 'medieval';
    case HistoricalEra.RENAISSANCE_EARLY_MODERN:
      return 'earlyModern';
    case HistoricalEra.INDUSTRIAL_ERA:
      return 'industrial';
    case HistoricalEra.MODERN_ERA:
      return 'modern';
    default:
      return 'medieval';
  }
}

/**
 * Get the material type for a given culture and era
 */
export function getCulturalMaterial(culturalZone: CulturalZone | string, era: HistoricalEra): MaterialType {
  // Simple material selection based on culture and era
  const eraKey = getEraKey(era);
  
  // Basic material mapping - cultural generators can override these
  if (culturalZone === 'EAST_ASIAN' || culturalZone === 'CHINESE' || culturalZone === 'JAPANESE') {
    return eraKey === 'modern' ? 'steel' : 'red_lacquer';
  }
  
  if (culturalZone === 'MENA' || culturalZone === 'ISLAMIC' || culturalZone === 'ARAB') {
    return eraKey === 'modern' ? 'steel' : 'sandstone';
  }
  
  if (culturalZone.includes('AFRICAN')) {
    return eraKey === 'modern' ? 'steel' : eraKey === 'prehistoric' ? 'wood' : 'sandstone';
  }
  
  if (culturalZone.includes('AMERICAN') || culturalZone === 'NATIVE_AMERICAN') {
    return eraKey === 'modern' ? 'steel' : eraKey === 'industrial' ? 'grey_stone' : 'wood';
  }
  
  if (culturalZone === 'OCEANIA' || culturalZone === 'OCEANIC') {
    return eraKey === 'modern' ? 'steel' : 'wood';
  }
  
  // European default
  if (eraKey === 'modern') return 'steel';
  if (eraKey === 'industrial') return 'grey_stone';
  if (eraKey === 'earlyModern' || eraKey === 'antiquity') return 'white_marble';
  if (eraKey === 'medieval') return 'grey_stone';
  return 'wood'; // prehistoric
}

/**
 * Convert material type to appropriate BiomeType for walls
 */
export function getWallBiomeForMaterial(material: MaterialType): BiomeType {
  // Always use base WALL type, differentiation comes from materialSubtype
  return BiomeType.WALL;
}

/**
 * Convert material type to appropriate BiomeType for floors
 */
export function getFloorBiomeForMaterial(material: MaterialType): BiomeType {
  switch (material) {
    case 'white_marble':
      return BiomeType.FLOOR_MARBLE;
    case 'red_lacquer':
    case 'wood':
      return BiomeType.FLOOR_WOOD;
    case 'sandstone':
      return BiomeType.FLOOR_STONE; // Use stone with sandstone subtype
    case 'steel':
      return BiomeType.FLOOR_TILE; // Use tile for modern steel floors
    case 'grey_stone':
    default:
      return BiomeType.FLOOR_STONE;
  }
}

/**
 * Place a culturally-appropriate rectangular wall with optional openings
 */
export function placeCulturalWallRectangle(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  culturalZone: CulturalZone | string,
  era: HistoricalEra,
  openings?: Array<{ side: 'north' | 'south' | 'east' | 'west'; offset: number }>
) {
  const material = getCulturalMaterial(culturalZone, era);
  const wallBiome = getWallBiomeForMaterial(material);
  
  // Top and bottom walls
  for (let i = 0; i < width; i++) {
    const skipTop = openings?.some(o => o.side === 'north' && o.offset === i);
    const skipBottom = openings?.some(o => o.side === 'south' && o.offset === i);
    
    if (!skipTop && tiles[y] && tiles[y][x + i]) {
      tiles[y][x + i].biome = wallBiome;
      tiles[y][x + i].materialSubtype = material;
      tiles[y][x + i].isBlocking = true;
    }
    if (!skipBottom && tiles[y + height - 1] && tiles[y + height - 1][x + i]) {
      tiles[y + height - 1][x + i].biome = wallBiome;
      tiles[y + height - 1][x + i].materialSubtype = material;
      tiles[y + height - 1][x + i].isBlocking = true;
    }
  }
  
  // Left and right walls
  for (let i = 0; i < height; i++) {
    const skipLeft = openings?.some(o => o.side === 'west' && o.offset === i);
    const skipRight = openings?.some(o => o.side === 'east' && o.offset === i);
    
    if (!skipLeft && tiles[y + i] && tiles[y + i][x]) {
      tiles[y + i][x].biome = wallBiome;
      tiles[y + i][x].materialSubtype = material;
      tiles[y + i][x].isBlocking = true;
    }
    if (!skipRight && tiles[y + i] && tiles[y + i][x + width - 1]) {
      tiles[y + i][x + width - 1].biome = wallBiome;
      tiles[y + i][x + width - 1].materialSubtype = material;
      tiles[y + i][x + width - 1].isBlocking = true;
    }
  }
}

/**
 * Get culturally appropriate symbol replacements
 */
export function getCulturalSymbol(
  baseSymbol: BiomeType,
  culturalZone: CulturalZone | string,
  era: HistoricalEra
): BiomeType {
  // PILLARS/COLUMNS
  if (baseSymbol === BiomeType.PILLAR) {
    if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || 
        culturalZone === 'NATIVE_AMERICAN') {
      return BiomeType.TORCH; // Torch posts instead of columns
    }
    if (culturalZone === 'SOUTH_AMERICAN' && era <= HistoricalEra.MEDIEVAL) {
      return BiomeType.WALL; // Stone walls instead of columns
    }
    if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
      return BiomeType.TORCH; // Wooden torch posts
    }
    if (culturalZone === 'OCEANIA') {
      return BiomeType.TORCH; // Tiki torches
    }
    // Default keeps pillar for European/Asian/MENA
  }
  
  // LIGHTING
  if (baseSymbol === BiomeType.BRAZIER || baseSymbol === BiomeType.CANDLE) {
    if (era <= HistoricalEra.MEDIEVAL) {
      return BiomeType.TORCH; // Pre-modern always uses torches
    }
    if (era === HistoricalEra.INDUSTRIAL_ERA) {
      return BiomeType.LANTERN; // Gas lamps
    }
    // Modern keeps original
  }
  
  // SEATING
  if (baseSymbol === BiomeType.THRONE) {
    if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || 
        culturalZone === 'NATIVE_AMERICAN') {
      return BiomeType.BENCH; // Chiefs sat with others
    }
    if (culturalZone === 'SUB_SAHARAN_AFRICAN' && era <= HistoricalEra.MEDIEVAL) {
      return BiomeType.BENCH; // Traditional benches/stools
    }
  }
  
  // RELIGIOUS
  if (baseSymbol === BiomeType.ALTAR) {
    if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
      return BiomeType.FIRE_PIT; // Sacred fire instead of altar
    }
  }
  
  return baseSymbol; // Keep original if no cultural override
}

/**
 * Place a culturally appropriate symbol
 */
export function placeCulturalSymbol(
  tiles: Tile[][],
  x: number,
  y: number,
  baseSymbol: BiomeType,
  culturalZone: CulturalZone | string,
  era: HistoricalEra,
  materialSubtype?: string
) {
  if (!tiles[y] || !tiles[y][x]) return;
  
  const culturalSymbol = getCulturalSymbol(baseSymbol, culturalZone, era);
  tiles[y][x].biome = culturalSymbol;
  
  // Add material subtype if provided
  if (materialSubtype) {
    tiles[y][x].materialSubtype = materialSubtype;
  } else {
    // Auto-assign material based on culture
    const material = getCulturalMaterial(culturalZone, era);
    tiles[y][x].materialSubtype = material;
  }
}

/**
 * Fill a rectangular area with culturally-appropriate floor
 */
export function fillCulturalFloor(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  culturalZone: CulturalZone | string,
  era: HistoricalEra
) {
  const material = getCulturalMaterial(culturalZone, era);
  const floorBiome = getFloorBiomeForMaterial(material);
  
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      if (tiles[y + dy] && tiles[y + dy][x + dx]) {
        tiles[y + dy][x + dx].biome = floorBiome;
        tiles[y + dy][x + dx].materialSubtype = material;
        tiles[y + dy][x + dx].isBlocking = false;
      }
    }
  }
}