/**
 * generation/specialMap/culturalFlooringService.ts
 * Historically accurate flooring patterns for different cultures and eras
 */

import { Tile, BiomeType } from '../../types';
import { SpecialMapConfig } from '../../types/specialMapTypes';
import { ValueNoise } from '../../utils/noise';

export interface FlooringPattern {
  primary: BiomeType;
  secondary: BiomeType;
  accent: BiomeType;
  border: BiomeType;
}

/**
 * Apply cultural-specific flooring pattern to an area
 */
export function applyCulturalFlooring(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  noise: ValueNoise,
  patternType: 'formal' | 'ceremonial' | 'residential' | 'courtyard' | 'entrance' = 'formal'
): void {
  
  const pattern = getCulturalFlooringPattern(config.culturalZone, config.era, patternType);
  
  if (config.culturalZone === 'MENA') {
    applyIslamicGeometricPattern(tiles, bounds, pattern, noise);
  } else if (config.culturalZone === 'EAST_ASIAN') {
    applyEastAsianPattern(tiles, bounds, pattern, noise);
  } else if (config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    applyPreColumbianPattern(tiles, bounds, pattern, noise, config.era);
  } else if (config.culturalZone === 'SOUTH_AMERICAN_PRE_COLUMBIAN') {
    applySouthAmericanPattern(tiles, bounds, pattern, noise, config.era);
  } else if (config.culturalZone === 'SUB_SAHARAN_AFRICAN') {
    applyAfricanPattern(tiles, bounds, pattern, noise);
  } else if (config.culturalZone === 'EUROPEAN') {
    applyEuropeanPattern(tiles, bounds, pattern, noise, config.era);
  } else {
    // Default geometric pattern
    applyGeometricPattern(tiles, bounds, pattern, noise);
  }
}

/**
 * Get appropriate flooring pattern for culture, era, and context
 */
function getCulturalFlooringPattern(
  culturalZone: string, 
  era: string, 
  patternType: string
): FlooringPattern {
  
  switch (culturalZone) {
    case 'MENA':
      return {
        primary: BiomeType.FLOOR_TILE,      // Terracotta base
        secondary: BiomeType.FLOOR_MARBLE,  // White marble inlay
        accent: BiomeType.PARK,            // Turquoise/blue (using park as blue-green)
        border: BiomeType.FLOOR_STONE      // Dark stone borders
      };
      
    case 'EAST_ASIAN':
      return {
        primary: BiomeType.FLOOR_WOOD,     // Natural wood
        secondary: BiomeType.FLOOR_STONE,  // Dark stone accents
        accent: BiomeType.FLOOR_MARBLE,    // Light marble
        border: BiomeType.WALL             // Dark borders
      };
      
    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      if (era === 'ANTIQUITY' || era === 'MEDIEVAL') {
        return {
          primary: BiomeType.FLOOR_WOOD,   // Wood planks/rushes
          secondary: BiomeType.DIRT_PATH || BiomeType.FLOOR_STONE, // Earth/clay
          accent: BiomeType.GRASS,         // Rush mats
          border: BiomeType.FLOOR_STONE    // Stone edging
        };
      } else {
        return {
          primary: BiomeType.FLOOR_STONE,  // Aztec-style carved stone
          secondary: BiomeType.FLOOR_TILE, // Clay tiles
          accent: BiomeType.FLOOR_MARBLE,  // Polished stone
          border: BiomeType.WALL           // Stone borders
        };
      }
      
    case 'SOUTH_AMERICAN_PRE_COLUMBIAN':
      if (era === 'EARLY_MODERN' || era === 'RENAISSANCE') {
        return {
          primary: BiomeType.FLOOR_MARBLE, // Baroque marble
          secondary: BiomeType.FLOOR_TILE, // Ceramic tiles
          accent: BiomeType.FLOOR_MOSAIC,  // Decorative mosaics
          border: BiomeType.FLOOR_STONE    // Stone borders
        };
      } else {
        return {
          primary: BiomeType.FLOOR_STONE,  // Inca-style fitted stone
          secondary: BiomeType.FLOOR_TILE, // Clay elements
          accent: BiomeType.FLOOR_MARBLE,  // Polished stone
          border: BiomeType.WALL           // Massive stone borders
        };
      }
      
    case 'SUB_SAHARAN_AFRICAN':
      return {
        primary: BiomeType.FLOOR_TILE,     // Clay tiles
        secondary: BiomeType.FLOOR_STONE,  // Local stone
        accent: BiomeType.FLOOR_WOOD,      // Wood inlays
        border: BiomeType.FLOOR_MARBLE     // Polished stone borders
      };
      
    case 'EUROPEAN':
      if (era === 'RENAISSANCE' || era === 'EARLY_MODERN') {
        return {
          primary: BiomeType.FLOOR_MARBLE, // Renaissance marble
          secondary: BiomeType.FLOOR_TILE, // Decorative tiles
          accent: BiomeType.FLOOR_MOSAIC,  // Complex mosaics
          border: BiomeType.FLOOR_STONE    // Stone borders
        };
      } else if (era === 'MEDIEVAL') {
        return {
          primary: BiomeType.FLOOR_STONE,  // Stone flags
          secondary: BiomeType.FLOOR_TILE, // Clay tiles
          accent: BiomeType.FLOOR_WOOD,    // Wood accents
          border: BiomeType.WALL           // Stone borders
        };
      } else {
        return {
          primary: BiomeType.FLOOR_MARBLE, // Roman marble
          secondary: BiomeType.FLOOR_TILE, // Roman tiles
          accent: BiomeType.FLOOR_MOSAIC,  // Roman mosaics
          border: BiomeType.FLOOR_STONE    // Stone borders
        };
      }
      
    default:
      return {
        primary: BiomeType.FLOOR_MARBLE,
        secondary: BiomeType.FLOOR_TILE,
        accent: BiomeType.FLOOR_MOSAIC,
        border: BiomeType.FLOOR_STONE
      };
  }
}

/**
 * Apply Islamic geometric patterns (8-fold star and cross pattern)
 */
function applyIslamicGeometricPattern(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  pattern: FlooringPattern,
  noise: ValueNoise
): void {
  
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
      
      const relX = x - bounds.x;
      const relY = y - bounds.y;
      
      // 8-fold star pattern
      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;
      const distFromCenter = Math.sqrt((relX - centerX) ** 2 + (relY - centerY) ** 2);
      const angle = Math.atan2(relY - centerY, relX - centerX);
      
      // Create 8-fold symmetry
      const octantAngle = ((angle + Math.PI) / (Math.PI / 4)) % 8;
      const starRadius = Math.min(bounds.width, bounds.height) * 0.3;
      
      // Border pattern
      if (relX === 0 || relX === bounds.width - 1 || relY === 0 || relY === bounds.height - 1) {
        tiles[y][x].biome = pattern.border;
      }
      // Central star
      else if (distFromCenter < starRadius && Math.floor(octantAngle) % 2 === 0) {
        tiles[y][x].biome = pattern.accent; // Turquoise blue
      }
      // Secondary geometric pattern
      else if ((relX + relY) % 4 === 0 || (relX - relY) % 4 === 0) {
        tiles[y][x].biome = pattern.secondary; // White marble
      }
      // Primary background
      else {
        tiles[y][x].biome = pattern.primary; // Terracotta
      }
    }
  }
}

/**
 * Apply East Asian patterns (nature-inspired with geometric elements)
 */
function applyEastAsianPattern(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  pattern: FlooringPattern,
  noise: ValueNoise
): void {
  
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
      
      const relX = x - bounds.x;
      const relY = y - bounds.y;
      
      // Tatami-inspired rectangular pattern
      const tatamiWidth = 6;
      const tatamiHeight = 3;
      
      const tatamiX = Math.floor(relX / tatamiWidth);
      const tatamiY = Math.floor(relY / tatamiHeight);
      
      // Border
      if (relX === 0 || relX === bounds.width - 1 || relY === 0 || relY === bounds.height - 1) {
        tiles[y][x].biome = pattern.border;
      }
      // Tatami borders
      else if (relX % tatamiWidth === 0 || relY % tatamiHeight === 0) {
        tiles[y][x].biome = pattern.secondary; // Dark stone
      }
      // Alternating tatami pattern
      else if ((tatamiX + tatamiY) % 2 === 0) {
        tiles[y][x].biome = pattern.primary; // Natural wood
      }
      else {
        tiles[y][x].biome = pattern.accent; // Light marble
      }
    }
  }
}

/**
 * Apply Pre-Columbian North American patterns
 */
function applyPreColumbianPattern(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  pattern: FlooringPattern,
  noise: ValueNoise,
  era: string
): void {
  
  if (era === 'ANTIQUITY' || era === 'MEDIEVAL') {
    // Natural materials - wood planks with rush mat borders
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
        
        const relX = x - bounds.x;
        const relY = y - bounds.y;
        
        // Rush mat border
        if (relX < 2 || relX >= bounds.width - 2 || relY < 2 || relY >= bounds.height - 2) {
          tiles[y][x].biome = pattern.accent; // Rush mats
        }
        // Wood plank pattern
        else if (relY % 3 === 0) {
          tiles[y][x].biome = pattern.border; // Plank separators
        }
        else {
          tiles[y][x].biome = pattern.primary; // Wood planks
        }
      }
    }
  } else {
    // Aztec-style carved stone patterns
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
        
        const relX = x - bounds.x;
        const relY = y - bounds.y;
        
        // Stepped pyramid pattern
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;
        const distFromCenter = Math.max(Math.abs(relX - centerX), Math.abs(relY - centerY));
        const stepSize = Math.max(1, Math.floor(Math.min(bounds.width, bounds.height) / 8));
        
        if (distFromCenter % (stepSize * 2) < stepSize) {
          tiles[y][x].biome = pattern.accent; // Polished stone
        } else if (distFromCenter % stepSize === 0) {
          tiles[y][x].biome = pattern.border; // Step edges
        } else {
          tiles[y][x].biome = pattern.primary; // Carved stone base
        }
      }
    }
  }
}

/**
 * Apply South American patterns (Inca or Baroque depending on era)
 */
function applySouthAmericanPattern(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  pattern: FlooringPattern,
  noise: ValueNoise,
  era: string
): void {
  
  if (era === 'EARLY_MODERN' || era === 'RENAISSANCE') {
    // Baroque colonial patterns
    applyBaroquePattern(tiles, bounds, pattern, noise);
  } else {
    // Inca-style fitted stone
    applyIncaStonePattern(tiles, bounds, pattern, noise);
  }
}

/**
 * Apply Baroque colonial pattern
 */
function applyBaroquePattern(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  pattern: FlooringPattern,
  noise: ValueNoise
): void {
  
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
      
      const relX = x - bounds.x;
      const relY = y - bounds.y;
      
      // Ornate baroque pattern with curves
      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;
      const waveX = Math.sin((relX / bounds.width) * Math.PI * 4) * 2;
      const waveY = Math.sin((relY / bounds.height) * Math.PI * 4) * 2;
      
      if (Math.abs(relX - centerX + waveX) < 2 || Math.abs(relY - centerY + waveY) < 2) {
        tiles[y][x].biome = pattern.accent; // Decorative mosaics
      } else if ((relX + relY) % 6 < 2) {
        tiles[y][x].biome = pattern.secondary; // Ceramic tiles
      } else {
        tiles[y][x].biome = pattern.primary; // Marble base
      }
    }
  }
}

/**
 * Apply Inca-style fitted stone pattern
 */
function applyIncaStonePattern(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  pattern: FlooringPattern,
  noise: ValueNoise
): void {
  
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
      
      const relX = x - bounds.x;
      const relY = y - bounds.y;
      
      // Irregular fitted stone pattern
      const stoneSize = 3 + Math.floor(noise.get(x * 0.1, y * 0.1) * 3);
      const stoneX = Math.floor(relX / stoneSize);
      const stoneY = Math.floor(relY / stoneSize);
      
      // Stone joints
      if (relX % stoneSize === 0 || relY % stoneSize === 0) {
        tiles[y][x].biome = pattern.border; // Stone joints
      }
      // Alternating stone types
      else if ((stoneX + stoneY) % 3 === 0) {
        tiles[y][x].biome = pattern.accent; // Polished stone
      } else if ((stoneX + stoneY) % 3 === 1) {
        tiles[y][x].biome = pattern.secondary; // Clay elements
      } else {
        tiles[y][x].biome = pattern.primary; // Base stone
      }
    }
  }
}

/**
 * Apply African patterns
 */
function applyAfricanPattern(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  pattern: FlooringPattern,
  noise: ValueNoise
): void {
  
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
      
      const relX = x - bounds.x;
      const relY = y - bounds.y;
      
      // Circular/radial patterns common in African design
      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;
      const distFromCenter = Math.sqrt((relX - centerX) ** 2 + (relY - centerY) ** 2);
      const angle = Math.atan2(relY - centerY, relX - centerX);
      
      // Concentric circles with radial elements
      const ringSpacing = Math.max(2, Math.floor(Math.min(bounds.width, bounds.height) / 8));
      const ringIndex = Math.floor(distFromCenter / ringSpacing);
      const radialSegment = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 12); // 12 segments
      
      if (Math.floor(distFromCenter) % ringSpacing === 0) {
        tiles[y][x].biome = pattern.border; // Ring borders
      } else if (ringIndex % 2 === 0 && radialSegment % 3 === 0) {
        tiles[y][x].biome = pattern.accent; // Wood inlays
      } else if (ringIndex % 2 === 1) {
        tiles[y][x].biome = pattern.secondary; // Stone
      } else {
        tiles[y][x].biome = pattern.primary; // Clay tiles
      }
    }
  }
}

/**
 * Apply European patterns based on era
 */
function applyEuropeanPattern(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  pattern: FlooringPattern,
  noise: ValueNoise,
  era: string
): void {
  
  if (era === 'RENAISSANCE' || era === 'EARLY_MODERN') {
    // Renaissance checkerboard with ornate borders
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
        
        const relX = x - bounds.x;
        const relY = y - bounds.y;
        
        // Ornate border
        if (relX < 3 || relX >= bounds.width - 3 || relY < 3 || relY >= bounds.height - 3) {
          if ((relX + relY) % 2 === 0) {
            tiles[y][x].biome = pattern.accent; // Mosaic
          } else {
            tiles[y][x].biome = pattern.border; // Stone
          }
        }
        // Central checkerboard
        else {
          const checkSize = 4;
          const checkX = Math.floor(relX / checkSize);
          const checkY = Math.floor(relY / checkSize);
          
          if ((checkX + checkY) % 2 === 0) {
            tiles[y][x].biome = pattern.primary; // Marble
          } else {
            tiles[y][x].biome = pattern.secondary; // Tiles
          }
        }
      }
    }
  } else {
    // Medieval/Roman patterns
    applyRomanPattern(tiles, bounds, pattern, noise);
  }
}

/**
 * Apply Roman mosaic patterns
 */
function applyRomanPattern(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  pattern: FlooringPattern,
  noise: ValueNoise
): void {
  
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
      
      const relX = x - bounds.x;
      const relY = y - bounds.y;
      
      // Roman meander pattern
      const meanderSize = 8;
      const meanderX = relX % meanderSize;
      const meanderY = relY % meanderSize;
      
      // Meander key pattern
      if ((meanderX === 0 || meanderX === meanderSize - 1) || 
          (meanderY === 0 || meanderY === meanderSize - 1) ||
          (meanderX === meanderSize / 2 && meanderY < meanderSize / 2) ||
          (meanderY === meanderSize / 2 && meanderX < meanderSize / 2)) {
        tiles[y][x].biome = pattern.accent; // Mosaic pattern
      } else if (meanderX < meanderSize / 2 && meanderY < meanderSize / 2) {
        tiles[y][x].biome = pattern.secondary; // Tiles
      } else {
        tiles[y][x].biome = pattern.primary; // Marble
      }
    }
  }
}

/**
 * Apply generic geometric pattern (fallback)
 */
function applyGeometricPattern(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  pattern: FlooringPattern,
  noise: ValueNoise
): void {
  
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x < 0 || x >= tiles[0].length || y < 0 || y >= tiles.length) continue;
      
      const relX = x - bounds.x;
      const relY = y - bounds.y;
      
      // Simple diamond pattern
      if ((relX + relY) % 6 === 0) {
        tiles[y][x].biome = pattern.accent;
      } else if ((relX + relY) % 3 === 0) {
        tiles[y][x].biome = pattern.secondary;
      } else if (Math.abs((relX % 6) - 3) + Math.abs((relY % 6) - 3) <= 2) {
        tiles[y][x].biome = pattern.border;
      } else {
        tiles[y][x].biome = pattern.primary;
      }
    }
  }
}