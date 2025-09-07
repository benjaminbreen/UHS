/**
 * Cultural Furniture System
 * Comprehensive system for placing culturally and era-appropriate furniture and decorations
 */

import { Tile, BiomeType } from '../../types';
import { SpecialMapConfig } from '../../types/specialMapTypes';
import { placePillar, placeTable, placeLightSource, placeFirepit } from './multiTileSystem';

export interface FurnitureSet {
  floors: BiomeType[];
  seating: BiomeType[];
  storage: BiomeType[];
  lighting: BiomeType[];
  decoration: BiomeType[];
  religious?: BiomeType[];
  military?: BiomeType[];
  work?: BiomeType[];
  heating?: BiomeType[];
  centralFeature?: string;
  decorative?: BiomeType[];
}

/**
 * Get era-appropriate flooring
 */
export function getEraFloor(config: SpecialMapConfig): BiomeType {
  const { culturalZone, era } = config;
  
  // Prehistoric always uses basic floors
  if (era === 'PREHISTORY') {
    return BiomeType.FLOOR_STONE; // Packed earth
  }
  
  // Cultural zone specific
  if (culturalZone === 'EUROPEAN') {
    if (era === 'ANTIQUITY') return BiomeType.FLOOR_MARBLE;
    if (era === 'MEDIEVAL') return BiomeType.FLOOR_STONE;
    if (era === 'RENAISSANCE_EARLY_MODERN') return BiomeType.FLOOR_MARBLE;
    if (era === 'INDUSTRIAL_ERA') return BiomeType.FLOOR_WOOD;
    if (era === 'MODERN_ERA') return BiomeType.FLOOR_TILE;
  }
  
  if (culturalZone === 'EAST_ASIAN') {
    return BiomeType.FLOOR_WOOD; // Raised floors/tatami
  }
  
  if (culturalZone === 'MENA') {
    if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
      return BiomeType.FLOOR_TILE; // Geometric tiles
    }
    return BiomeType.FLOOR_STONE;
  }
  
  if (culturalZone === 'AFRICAN' || culturalZone === 'SUB_SAHARAN_AFRICAN') {
    return BiomeType.FLOOR_STONE; // Packed earth
  }
  
  if (culturalZone === 'AMERICAS' || culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    return BiomeType.FLOOR_STONE;
  }
  
  if (culturalZone === 'OCEANIA') {
    return BiomeType.FLOOR_STONE; // Coral/sand
  }
  
  return BiomeType.FLOOR_STONE;
}

/**
 * Get complete furniture set for a culture/era/archetype
 */
export function getCulturalFurnitureSet(
  config: SpecialMapConfig,
  archetype: string
): FurnitureSet {
  const { culturalZone, era } = config;
  
  // EUROPEAN FURNITURE SETS
  if (culturalZone === 'EUROPEAN') {
    if (era === 'PREHISTORY') {
      return {
        floors: [BiomeType.FLOOR_STONE],
        seating: [BiomeType.BENCH],
        storage: [BiomeType.CHEST, BiomeType.BARREL],
        lighting: [BiomeType.TORCH],
        decoration: [],
        heating: [BiomeType.FIRE_PIT]
      };
    }
    
    if (era === 'ANTIQUITY') {
      return {
        floors: [BiomeType.FLOOR_MARBLE, BiomeType.FLOOR_MOSAIC, BiomeType.FLOOR_MOSAIC_CENTER],
        seating: [BiomeType.BENCH, BiomeType.THRONE],
        storage: [BiomeType.CHEST, BiomeType.SCROLL_RACK],
        lighting: [BiomeType.TORCH, BiomeType.BRAZIER],
        decoration: [BiomeType.STATUE, BiomeType.FOUNTAIN],
        religious: [BiomeType.ALTAR]
      };
    }
    
    if (era === 'MEDIEVAL') {
      return {
        floors: [BiomeType.FLOOR_STONE, BiomeType.CARPET],
        seating: [BiomeType.THRONE, BiomeType.BENCH],
        storage: [BiomeType.CHEST, BiomeType.BARREL],
        lighting: [BiomeType.TORCH, BiomeType.BRAZIER],
        decoration: [BiomeType.CARPET],
        military: [BiomeType.WEAPON_RACK, BiomeType.ARMOR_STAND],
        heating: [BiomeType.FIRE_PIT, BiomeType.HEARTH],
        centralFeature: archetype === 'estates' ? 'hearth' : 'throne',
        decorative: [BiomeType.COLUMN]
      };
    }
    
    if (era === 'RENAISSANCE_EARLY_MODERN') {
      return {
        floors: [BiomeType.FLOOR_MARBLE, BiomeType.FLOOR_PATTERN, BiomeType.FLOOR_CHECKERED, BiomeType.CARPET],
        seating: [BiomeType.THRONE, BiomeType.CHAIR],
        storage: [BiomeType.CABINET, BiomeType.BOOKSHELF, BiomeType.CHEST],
        lighting: [BiomeType.BRAZIER, BiomeType.TORCH],
        decoration: [BiomeType.STATUE, BiomeType.FOUNTAIN, BiomeType.MIRROR, BiomeType.CARPET, BiomeType.PLANTER],
        work: [BiomeType.DESK, BiomeType.PODIUM]
      };
    }
    
    if (era === 'INDUSTRIAL_ERA') {
      return {
        floors: [BiomeType.FLOOR_WOOD, BiomeType.CARPET],
        seating: [BiomeType.CHAIR],
        storage: [BiomeType.FILING_CABINET, BiomeType.BOOKSHELF],
        lighting: [BiomeType.TORCH], // Gas lamps
        decoration: [BiomeType.MIRROR],
        work: [BiomeType.DESK, BiomeType.PODIUM, BiomeType.DOCUMENT_TABLE]
      };
    }
    
    if (era === 'MODERN_ERA' || era === 'FUTURE_ERA') {
      return {
        floors: [BiomeType.FLOOR_TILE, BiomeType.CARPET],
        seating: [BiomeType.CHAIR],
        storage: [BiomeType.FILING_CABINET],
        lighting: [BiomeType.TORCH], // Electric
        decoration: [],
        work: [BiomeType.DESK, BiomeType.PODIUM]
      };
    }
  }
  
  // EAST ASIAN FURNITURE SETS
  if (culturalZone === 'EAST_ASIAN') {
    return {
      floors: [BiomeType.FLOOR_WOOD, BiomeType.CARPET],
      seating: [BiomeType.BENCH, BiomeType.THRONE], // Floor seating
      storage: [BiomeType.CABINET, BiomeType.SCROLL_RACK],
      lighting: [BiomeType.LANTERN, BiomeType.TORCH, BiomeType.BRAZIER], // Lanterns are primary
      decoration: [BiomeType.SHRINE, BiomeType.FOUNTAIN, BiomeType.PLANTER, BiomeType.MIRROR],
      work: [BiomeType.DESK] // Low desks
    };
  }
  
  // MENA FURNITURE SETS
  if (culturalZone === 'MENA') {
    return {
      floors: [BiomeType.FLOOR_TILE, BiomeType.FLOOR_MOSAIC, BiomeType.FLOOR_PATTERN, BiomeType.CARPET],
      seating: [BiomeType.BENCH, BiomeType.THRONE],
      storage: [BiomeType.CHEST, BiomeType.CABINET],
      lighting: [BiomeType.BRAZIER, BiomeType.TORCH],
      decoration: [BiomeType.FOUNTAIN, BiomeType.CARPET, BiomeType.STATUE],
      religious: [BiomeType.CARPET] // Prayer rugs
    };
  }
  
  // AFRICAN FURNITURE SETS
  if (culturalZone === 'AFRICAN' || culturalZone === 'SUB_SAHARAN_AFRICAN') {
    return {
      floors: [BiomeType.FLOOR_STONE],
      seating: [BiomeType.BENCH, BiomeType.THRONE],
      storage: [BiomeType.CHEST, BiomeType.BARREL],
      lighting: [BiomeType.TORCH, BiomeType.FIRE_PIT],
      decoration: [BiomeType.SHRINE],
      military: [BiomeType.WEAPON_RACK]
    };
  }
  
  // AMERICAS FURNITURE SETS
  if (culturalZone === 'AMERICAS' || culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    return {
      floors: [BiomeType.FLOOR_STONE],
      seating: [BiomeType.BENCH],
      storage: [BiomeType.CHEST, BiomeType.BARREL],
      lighting: [BiomeType.TORCH, BiomeType.FIRE_PIT],
      decoration: [BiomeType.SHRINE, BiomeType.STATUE],
      military: [BiomeType.WEAPON_RACK],
      religious: [BiomeType.ALTAR],
      heating: [BiomeType.FIRE_PIT]
    };
  }
  
  // OCEANIA FURNITURE SETS
  if (culturalZone === 'OCEANIA') {
    return {
      floors: [BiomeType.FLOOR_STONE],
      seating: [BiomeType.BENCH],
      storage: [BiomeType.CHEST],
      lighting: [BiomeType.TORCH, BiomeType.FIRE_PIT],
      decoration: [BiomeType.STATUE, BiomeType.SHRINE]
    };
  }
  
  // Default fallback
  return {
    floors: [BiomeType.FLOOR_STONE],
    seating: [BiomeType.BENCH],
    storage: [BiomeType.CHEST],
    lighting: [BiomeType.TORCH],
    decoration: []
  };
}

/**
 * Get flooring appropriate for room type and culture
 */
export function getFlooringForRoom(config: SpecialMapConfig, roomType: string): BiomeType {
  const furnitureSet = getCulturalFurnitureSet(config, roomType);
  return furnitureSet.floors[0] || BiomeType.FLOOR_STONE;
}

/**
 * Get seating arrangement for cultural context
 */
export function getSeatingArrangement(config: SpecialMapConfig, archetype: string, roomSize: number): {
  arrangement: 'semicircular' | 'parallel' | 'circular' | 'tiered' | 'rows';
  furniture: { primary: BiomeType, secondary?: BiomeType };
} {
  const furnitureSet = getCulturalFurnitureSet(config, archetype);
  const { culturalZone, era } = config;
  
  let arrangement: 'semicircular' | 'parallel' | 'circular' | 'tiered' | 'rows' = 'rows';
  
  if (culturalZone === 'EUROPEAN') {
    arrangement = roomSize > 200 ? 'semicircular' : 'rows';
  } else if (culturalZone === 'EAST_ASIAN') {
    arrangement = 'parallel';
  } else if (culturalZone === 'MENA') {
    arrangement = 'semicircular';
  } else if (culturalZone === 'AFRICAN' || culturalZone === 'SUB_SAHARAN_AFRICAN') {
    arrangement = 'circular';
  } else if (culturalZone === 'AMERICAS' || culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    arrangement = 'circular';
  } else if (culturalZone === 'OCEANIA') {
    arrangement = 'circular';
  }
  
  const primary = furnitureSet.seating[0] || BiomeType.BENCH;
  const secondary = furnitureSet.work ? furnitureSet.work[0] : undefined;
  
  return { arrangement, furniture: { primary, secondary } };
}

/**
 * Get cultural lighting elements
 */
export function getCulturalLighting(config: SpecialMapConfig, archetype: string): {
  wall?: BiomeType;
  standing?: BiomeType;
  ceiling?: BiomeType;
} {
  const furnitureSet = getCulturalFurnitureSet(config, archetype);
  const { era } = config;
  
  const lighting: { wall?: BiomeType; standing?: BiomeType; ceiling?: BiomeType } = {};
  
  if (furnitureSet.lighting.length > 0) {
    lighting.wall = furnitureSet.lighting[0];
    if (furnitureSet.lighting.length > 1) {
      lighting.standing = furnitureSet.lighting[1];
    }
  }
  
  return lighting;
}

/**
 * Get cultural storage furniture
 */
export function getCulturalStorage(config: SpecialMapConfig, roomType: string): BiomeType[] {
  const furnitureSet = getCulturalFurnitureSet(config, roomType);
  return furnitureSet.storage || [];
}

/**
 * Get religious/ceremonial elements
 */
export function getCulturalReligiousElements(config: SpecialMapConfig, archetype: string): BiomeType[] {
  const furnitureSet = getCulturalFurnitureSet(config, archetype);
  return furnitureSet.religious || [];
}

/**
 * Get cultural floor pattern for decorative areas
 */
export function getCulturalFloorPattern(config: SpecialMapConfig, patternType: 'ceremonial' | 'decorative'): BiomeType[] {
  const { culturalZone, era } = config;
  
  if (culturalZone === 'MENA' && era !== 'PREHISTORY') {
    return [BiomeType.FLOOR_MOSAIC, BiomeType.FLOOR_PATTERN, BiomeType.FLOOR_TILE];
  }
  
  if (culturalZone === 'EUROPEAN' && era === 'ANTIQUITY') {
    return [BiomeType.FLOOR_MOSAIC_CENTER, BiomeType.FLOOR_MOSAIC_BORDER, BiomeType.FLOOR_MOSAIC];
  }
  
  if (culturalZone === 'EUROPEAN' && era === 'RENAISSANCE_EARLY_MODERN') {
    return [BiomeType.FLOOR_CHECKERED, BiomeType.FLOOR_PATTERN];
  }
  
  if (patternType === 'ceremonial') {
    return [BiomeType.CARPET];
  }
  
  return [];
}

/**
 * Place lighting appropriate to era
 */
export function placeCulturalLighting(
  tiles: Tile[][],
  x: number,
  y: number,
  config: SpecialMapConfig
): void {
  const { era } = config;
  
  if (era === 'PREHISTORY' || era === 'ANTIQUITY') {
    tiles[y][x].biome = BiomeType.TORCH;
  } else if (era === 'MEDIEVAL' || era === 'RENAISSANCE_EARLY_MODERN') {
    tiles[y][x].biome = BiomeType.BRAZIER;
  } else {
    tiles[y][x].biome = BiomeType.TORCH; // Modern = electric
  }
  tiles[y][x].isBlocking = false;
}

/**
 * Place era-appropriate seating arrangement
 */
export function placeSeatingArrangement(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  arrangement: 'semicircular' | 'parallel' | 'circular' | 'tiered' | 'rows'
): void {
  const furnitureSet = getCulturalFurnitureSet(config, 'government');
  const seatingType = furnitureSet.seating[0] || BiomeType.BENCH;
  
  switch (arrangement) {
    case 'semicircular':
      // Parliamentary style
      const centerX = startX + Math.floor(width / 2);
      const centerY = startY + Math.floor(height / 2);
      
      for (let row = 0; row < 3; row++) {
        const radius = 4 + row * 2;
        for (let angle = Math.PI * 0.25; angle < Math.PI * 0.75; angle += Math.PI / 8) {
          const x = Math.round(centerX + Math.cos(angle) * radius);
          const y = Math.round(centerY + Math.sin(angle) * (radius / 2));
          
          if (x > startX && x < startX + width - 1 && y > startY && y < startY + height - 1) {
            tiles[y][x].biome = seatingType;
            tiles[y][x].isBlocking = true;
            
            // Add desks for modern eras
            if (config.era === 'INDUSTRIAL_ERA' || config.era === 'MODERN_ERA') {
              if (y > startY + 1 && tiles[y - 1][x].biome !== BiomeType.WALL) {
                tiles[y - 1][x].biome = BiomeType.DESK;
                tiles[y - 1][x].isBlocking = true;
              }
            }
          }
        }
      }
      break;
      
    case 'parallel':
      // East Asian style - facing rows
      const leftX = startX + Math.floor(width * 0.25);
      const rightX = startX + Math.floor(width * 0.75);
      
      for (let y = startY + 2; y < startY + height - 2; y += 2) {
        tiles[y][leftX].biome = seatingType;
        tiles[y][leftX].isBlocking = true;
        tiles[y][rightX].biome = seatingType;
        tiles[y][rightX].isBlocking = true;
        
        // Add low desks for East Asian
        if (config.culturalZone === 'EAST_ASIAN') {
          tiles[y][leftX + 1].biome = BiomeType.DESK;
          tiles[y][leftX + 1].isBlocking = true;
          tiles[y][rightX - 1].biome = BiomeType.DESK;
          tiles[y][rightX - 1].isBlocking = true;
        }
      }
      break;
      
    case 'circular':
      // Indigenous/African style
      const circleX = startX + Math.floor(width / 2);
      const circleY = startY + Math.floor(height / 2);
      const circleRadius = Math.min(width, height) / 3;
      
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
        const x = Math.round(circleX + Math.cos(angle) * circleRadius);
        const y = Math.round(circleY + Math.sin(angle) * circleRadius);
        
        if (x > startX && x < startX + width - 1 && y > startY && y < startY + height - 1) {
          tiles[y][x].biome = seatingType;
          tiles[y][x].isBlocking = true;
        }
      }
      break;
      
    case 'tiered':
      // Amphitheater style
      for (let tier = 0; tier < 4 && tier * 2 < height; tier++) {
        const tierY = startY + tier * 2;
        for (let x = startX + 2 + tier; x < startX + width - 2 - tier; x += 2) {
          if (tierY < startY + height - 1) {
            tiles[tierY][x].biome = seatingType;
            tiles[tierY][x].isBlocking = true;
          }
        }
      }
      break;
      
    case 'rows':
      // Modern auditorium
      for (let y = startY + 2; y < startY + height - 2; y += 2) {
        for (let x = startX + 2; x < startX + width - 2; x += 2) {
          tiles[y][x].biome = BiomeType.CHAIR;
          tiles[y][x].isBlocking = true;
        }
      }
      break;
  }
}

/**
 * Add decorative patterns to floors
 */
export function addFloorPattern(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig
): void {
  const { culturalZone, era } = config;
  
  if (culturalZone === 'MENA' && era !== 'PREHISTORY') {
    // Geometric patterns
    for (let y = startY; y < startY + height; y += 2) {
      for (let x = startX; x < startX + width; x += 2) {
        if (tiles[y] && tiles[y][x] && tiles[y][x].biome === BiomeType.FLOOR_TILE) {
          tiles[y][x].biome = BiomeType.FLOOR_PATTERN;
        }
      }
    }
  } else if (culturalZone === 'EUROPEAN' && era === 'ANTIQUITY') {
    // Roman mosaics
    const centerX = startX + Math.floor(width / 2);
    const centerY = startY + Math.floor(height / 2);
    
    // Central medallion
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const y = centerY + dy;
        const x = centerX + dx;
        if (y >= startY && y < startY + height && x >= startX && x < startX + width) {
          if (Math.abs(dx) + Math.abs(dy) <= 2) {
            tiles[y][x].biome = BiomeType.FLOOR_MOSAIC_CENTER;
          }
        }
      }
    }
    
    // Border
    for (let y = startY; y < startY + height; y++) {
      if (tiles[y][startX]) tiles[y][startX].biome = BiomeType.FLOOR_MOSAIC_BORDER;
      if (tiles[y][startX + width - 1]) tiles[y][startX + width - 1].biome = BiomeType.FLOOR_MOSAIC_BORDER;
    }
    for (let x = startX; x < startX + width; x++) {
      if (tiles[startY][x]) tiles[startY][x].biome = BiomeType.FLOOR_MOSAIC_BORDER;
      if (tiles[startY + height - 1][x]) tiles[startY + height - 1][x].biome = BiomeType.FLOOR_MOSAIC_BORDER;
    }
  } else if (culturalZone === 'EUROPEAN' && era === 'RENAISSANCE_EARLY_MODERN') {
    // Checkered marble
    for (let y = startY; y < startY + height; y++) {
      for (let x = startX; x < startX + width; x++) {
        if ((x + y) % 2 === 0 && tiles[y][x].biome === BiomeType.FLOOR_MARBLE) {
          tiles[y][x].biome = BiomeType.FLOOR_CHECKERED;
        }
      }
    }
  }
}

/**
 * Place storage furniture appropriate to culture/era
 */
export function placeStorageFurniture(
  tiles: Tile[][],
  x: number,
  y: number,
  config: SpecialMapConfig
): void {
  const furnitureSet = getCulturalFurnitureSet(config, 'general');
  const storageOptions = furnitureSet.storage;
  
  if (storageOptions.length > 0) {
    const storage = storageOptions[Math.floor(Math.random() * storageOptions.length)];
    tiles[y][x].biome = storage;
    tiles[y][x].isBlocking = true;
  }
}

/**
 * Add religious elements based on culture
 */
export function placeReligiousElements(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  config: SpecialMapConfig
): void {
  const { culturalZone, era } = config;
  
  if (culturalZone === 'EUROPEAN' && era === 'ANTIQUITY') {
    tiles[centerY][centerX].biome = BiomeType.ALTAR;
  } else if (culturalZone === 'MENA') {
    // Prayer rugs
    for (let dy = -1; dy <= 1; dy++) {
      tiles[centerY + dy][centerX].biome = BiomeType.CARPET;
    }
  } else if (culturalZone === 'EAST_ASIAN') {
    tiles[centerY][centerX].biome = BiomeType.SHRINE;
  } else if (culturalZone === 'AMERICAS') {
    tiles[centerY][centerX].biome = BiomeType.ALTAR;
  }
  
  if (tiles[centerY][centerX].biome === BiomeType.ALTAR || 
      tiles[centerY][centerX].biome === BiomeType.SHRINE) {
    tiles[centerY][centerX].isBlocking = true;
  }
}