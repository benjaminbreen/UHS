/**
 * generation/specialMap/landscapeService.ts
 * Contextual landscape generation for special maps
 */

import { Tile, BiomeType } from '../../types';
import { SpecialMapConfig, SpecialMapArchetype } from '../../types/specialMapTypes';
import { ValueNoise } from '../../utils/noise';

export interface LandscapeBounds {
  x: number;
  y: number; 
  width: number;
  height: number;
}

/**
 * Generate contextual landscape around a structure
 */
export function generateContextualLandscape(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  structureBounds: LandscapeBounds
): void {
  
  // First, fill with base terrain for the cultural zone
  const baseTerrain = selectBaseTerrain(config.culturalZone, config.climate);
  fillBaseLandscape(tiles, size, baseTerrain, noise);
  
  // Add cultural-specific landscape features
  if (config.culturalZone === 'MENA') {
    generateDesertLandscape(tiles, size, noise, structureBounds);
  } else if (config.culturalZone === 'EAST_ASIAN') {
    generateEastAsianLandscape(tiles, size, noise, structureBounds);
  } else if (config.culturalZone === 'EUROPEAN') {
    generateEuropeanLandscape(tiles, size, noise, structureBounds);
  } else if (config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    generateNativeAmericanLandscape(tiles, size, noise, structureBounds);
  } else if (config.culturalZone === 'SUB_SAHARAN_AFRICAN') {
    generateAfricanLandscape(tiles, size, noise, structureBounds);
  } else {
    // Default temperate landscape
    generateTemperateLandscape(tiles, size, noise, structureBounds);
  }
  
  // Add archetype-specific features
  addArchetypeFeatures(tiles, size, config.archetype, noise, structureBounds);
}

/**
 * Select base terrain type for cultural zone and climate
 */
function selectBaseTerrain(culturalZone: string, climate: string): BiomeType {
  if (culturalZone === 'MENA') {
    return climate === 'TROPICAL' ? BiomeType.SAVANNA : BiomeType.DESERT;
  } else if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
    return climate === 'TROPICAL' ? BiomeType.SAVANNA : BiomeType.GRASSLAND;
  } else if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    return climate === 'TROPICAL' ? BiomeType.FOREST : BiomeType.GRASSLAND;
  } else {
    return climate === 'TROPICAL' ? BiomeType.FOREST : BiomeType.GRASSLAND;
  }
}

/**
 * Fill the base landscape with natural variation
 */
function fillBaseLandscape(
  tiles: Tile[][],
  size: { width: number, height: number },
  baseTerrain: BiomeType,
  noise: ValueNoise
): void {
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const noiseValue = noise.noise(x * 0.08, y * 0.08);
      
      if (baseTerrain === BiomeType.DESERT) {
        // Desert with rocky outcrops
        tiles[y][x].biome = noiseValue > 0.4 ? BiomeType.MOUNTAIN : BiomeType.DESERT;
      } else if (baseTerrain === BiomeType.FOREST) {
        // Forest with clearings
        tiles[y][x].biome = noiseValue > 0.2 ? BiomeType.FOREST : BiomeType.GRASSLAND;
      } else if (baseTerrain === BiomeType.SAVANNA) {
        // Savanna with scattered trees
        tiles[y][x].biome = noiseValue > 0.6 ? BiomeType.FOREST : BiomeType.SAVANNA;
      } else {
        // Grassland with variety
        if (noiseValue > 0.7) {
          tiles[y][x].biome = BiomeType.FOREST;
        } else if (noiseValue < -0.3) {
          tiles[y][x].biome = BiomeType.WETLANDS;
        } else {
          tiles[y][x].biome = BiomeType.GRASSLAND;
        }
      }
    }
  }
}

/**
 * Generate MENA (Middle East/North Africa) landscape features
 */
function generateDesertLandscape(
  tiles: Tile[][],
  size: { width: number, height: number },
  noise: ValueNoise,
  structureBounds: LandscapeBounds
): void {
  // Create oasis near structure
  const oasisX = structureBounds.x - 8;
  const oasisY = structureBounds.y + Math.floor(structureBounds.height / 2);
  
  if (oasisX >= 0 && oasisY >= 0 && oasisX < size.width && oasisY < size.height) {
    // Water source
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = oasisX + dx;
        const y = oasisY + dy;
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist <= 2) {
            tiles[y][x].biome = BiomeType.WATER;
          } else if (dist <= 4) {
            tiles[y][x].biome = BiomeType.GRASSLAND; // Green around water
          }
        }
      }
    }
  }
  
  // Palm trees around oasis
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const palmX = oasisX + Math.floor(Math.cos(angle) * 6);
    const palmY = oasisY + Math.floor(Math.sin(angle) * 4);
    
    if (palmX >= 0 && palmX < size.width && palmY >= 0 && palmY < size.height) {
      tiles[palmY][palmX].biome = BiomeType.FOREST;
    }
  }
  
  // Wadi (dry riverbed) leading to structure
  const wadiBend = Math.floor(size.width * 0.3);
  for (let x = 0; x < wadiBend; x++) {
    const y = Math.floor(size.height * 0.7 + Math.sin(x * 0.1) * 3);
    if (y >= 0 && y < size.height) {
      tiles[y][x].biome = BiomeType.DESERT;
      if (y > 0) tiles[y-1][x].biome = BiomeType.DESERT;
      if (y < size.height-1) tiles[y+1][x].biome = BiomeType.DESERT;
    }
  }
}

/**
 * Generate East Asian landscape features
 */
function generateEastAsianLandscape(
  tiles: Tile[][],
  size: { width: number, height: number },
  noise: ValueNoise,
  structureBounds: LandscapeBounds
): void {
  // Formal approach path
  const pathY = structureBounds.y + structureBounds.height + 2;
  if (pathY < size.height) {
    for (let x = 0; x < size.width; x++) {
      tiles[pathY][x].biome = BiomeType.FLOOR_STONE;
    }
  }
  
  // Ornamental water feature (pond or stream)
  const pondX = structureBounds.x + structureBounds.width + 5;
  const pondY = structureBounds.y + Math.floor(structureBounds.height / 2);
  
  if (pondX < size.width - 8 && pondY > 4 && pondY < size.height - 4) {
    // Create L-shaped water feature
    for (let dx = 0; dx < 8; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        if (pondX + dx < size.width && pondY + dy >= 0 && pondY + dy < size.height) {
          tiles[pondY + dy][pondX + dx].biome = BiomeType.WATER;
        }
      }
    }
    
    // Connecting stream
    for (let dy = -6; dy <= -2; dy++) {
      if (pondY + dy >= 0) {
        tiles[pondY + dy][pondX + 3].biome = BiomeType.WATER;
        tiles[pondY + dy][pondX + 4].biome = BiomeType.WATER;
      }
    }
  }
  
  // Bamboo groves
  for (let i = 0; i < 4; i++) {
    const groveX = Math.floor(noise.noise(i * 17, 42) * size.width * 0.3);
    const groveY = Math.floor(noise.noise(i * 23, 67) * size.height * 0.3);
    
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = groveX + dx;
        const y = groveY + dy;
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          if (Math.abs(dx) + Math.abs(dy) <= 3) {
            tiles[y][x].biome = BiomeType.FOREST;
          }
        }
      }
    }
  }
}

/**
 * Generate European landscape features
 */
function generateEuropeanLandscape(
  tiles: Tile[][],
  size: { width: number, height: number },
  noise: ValueNoise,
  structureBounds: LandscapeBounds
): void {
  // Rolling hills effect
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const elevation = noise.noise(x * 0.05, y * 0.05);
      
      if (elevation > 0.4) {
        // Higher ground - mix of forest and grassland
        tiles[y][x].biome = noise.noise(x * 0.1, y * 0.1) > 0 ? BiomeType.FOREST : BiomeType.GRASSLAND;
      } else if (elevation < -0.3) {
        // Lower ground - wetlands or water
        tiles[y][x].biome = elevation < -0.5 ? BiomeType.WATER : BiomeType.WETLANDS;
      }
    }
  }
  
  // Add a road/path leading to the structure
  const roadY = structureBounds.y + structureBounds.height + 3;
  if (roadY < size.height - 2) {
    for (let x = 0; x < size.width; x++) {
      tiles[roadY][x].biome = BiomeType.DIRT_PATH;
      // Clear vegetation around road
      if (roadY - 1 >= 0) tiles[roadY - 1][x].biome = BiomeType.GRASSLAND;
      if (roadY + 1 < size.height) tiles[roadY + 1][x].biome = BiomeType.GRASSLAND;
    }
  }
  
  // Agricultural fields (if appropriate for the era)
  const fieldX = structureBounds.x - 12;
  const fieldY = structureBounds.y - 8;
  
  if (fieldX >= 0 && fieldY >= 0 && fieldX + 10 < size.width && fieldY + 6 < size.height) {
    for (let dy = 0; dy < 6; dy++) {
      for (let dx = 0; dx < 10; dx++) {
        tiles[fieldY + dy][fieldX + dx].biome = BiomeType.FARMLAND;
      }
    }
  }
}

/**
 * Generate Native American landscape features
 */
function generateNativeAmericanLandscape(
  tiles: Tile[][],
  size: { width: number, height: number },
  noise: ValueNoise,
  structureBounds: LandscapeBounds
): void {
  // Forest clearing with natural paths (already implemented in longhouse)
  const centerX = structureBounds.x + Math.floor(structureBounds.width / 2);
  const centerY = structureBounds.y + Math.floor(structureBounds.height / 2);
  
  // Natural paths through forest
  for (let x = 0; x < size.width; x++) {
    const pathY = Math.floor(centerY + Math.sin(x * 0.1) * 4);
    if (pathY >= 0 && pathY < size.height) {
      tiles[pathY][x].biome = BiomeType.DIRT_PATH;
      if (pathY > 0) tiles[pathY - 1][x].biome = BiomeType.GRASSLAND;
      if (pathY < size.height - 1) tiles[pathY + 1][x].biome = BiomeType.GRASSLAND;
    }
  }
  
  // River or stream nearby
  const riverX = structureBounds.x + structureBounds.width + 6;
  if (riverX < size.width - 4) {
    for (let y = 0; y < size.height; y++) {
      const width = 2 + Math.floor(Math.sin(y * 0.15) * 1);
      for (let w = 0; w < width; w++) {
        if (riverX + w < size.width) {
          tiles[y][riverX + w].biome = BiomeType.WATER;
        }
      }
      // Riverbank vegetation
      if (riverX - 1 >= 0) tiles[y][riverX - 1].biome = BiomeType.WETLANDS;
      if (riverX + width < size.width) tiles[y][riverX + width].biome = BiomeType.WETLANDS;
    }
  }
}

/**
 * Generate Sub-Saharan African landscape features  
 */
function generateAfricanLandscape(
  tiles: Tile[][],
  size: { width: number, height: number },
  noise: ValueNoise,
  structureBounds: LandscapeBounds
): void {
  // Savanna with scattered acacia trees
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const treeChance = noise.noise(x * 0.12, y * 0.12);
      if (treeChance > 0.6) {
        tiles[y][x].biome = BiomeType.FOREST; // Represents acacia trees
      }
    }
  }
  
  // Seasonal waterhole
  const waterholeX = structureBounds.x - 10;
  const waterholeY = structureBounds.y + Math.floor(structureBounds.height * 0.3);
  
  if (waterholeX >= 3 && waterholeY >= 3 && 
      waterholeX + 6 < size.width && waterholeY + 4 < size.height) {
    
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist <= 2.5) {
          tiles[waterholeY + dy][waterholeX + dx].biome = BiomeType.WATER;
        } else if (dist <= 4) {
          tiles[waterholeY + dy][waterholeX + dx].biome = BiomeType.WETLANDS;
        }
      }
    }
  }
  
  // Animal paths (game trails)
  const trailY1 = Math.floor(size.height * 0.25);
  const trailY2 = Math.floor(size.height * 0.75);
  
  for (let x = 0; x < size.width; x++) {
    if (trailY1 >= 0 && trailY1 < size.height) {
      tiles[trailY1][x].biome = BiomeType.DIRT_PATH;
    }
    if (trailY2 >= 0 && trailY2 < size.height) {
      tiles[trailY2][x].biome = BiomeType.DIRT_PATH;
    }
  }
}

/**
 * Generate temperate landscape (fallback)
 */
function generateTemperateLandscape(
  tiles: Tile[][],
  size: { width: number, height: number },
  noise: ValueNoise,
  structureBounds: LandscapeBounds
): void {
  // Mixed forest and grassland
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const vegetation = noise.noise(x * 0.1, y * 0.1);
      if (vegetation > 0.3) {
        tiles[y][x].biome = BiomeType.FOREST;
      } else if (vegetation < -0.2) {
        tiles[y][x].biome = BiomeType.WETLANDS;
      } else {
        tiles[y][x].biome = BiomeType.GRASSLAND;
      }
    }
  }
}

/**
 * Add archetype-specific landscape features
 */
function addArchetypeFeatures(
  tiles: Tile[][],
  size: { width: number, height: number },
  archetype: SpecialMapArchetype,
  noise: ValueNoise,
  structureBounds: LandscapeBounds
): void {
  
  switch (archetype) {
    case SpecialMapArchetype.CASTLE:
      // Defensive features
      addMoatSystem(tiles, size, structureBounds);
      addDefensiveHills(tiles, size, noise, structureBounds);
      break;
      
    case SpecialMapArchetype.TEMPLE:
      // Sacred groves or pilgrimage paths
      addSacredGrove(tiles, size, noise, structureBounds);
      addPilgrimagePath(tiles, size, structureBounds);
      break;
      
    case SpecialMapArchetype.PALACE_COMPLEX:
      // Formal gardens
      addFormalGardens(tiles, size, structureBounds);
      break;
      
    case SpecialMapArchetype.MARKET_BAZAAR:
      // Trade routes and merchant camps
      addTradeRoutes(tiles, size, structureBounds);
      break;
      
    // Add more as needed
  }
}

/**
 * Add moat system around castle
 */
function addMoatSystem(
  tiles: Tile[][],
  size: { width: number, height: number },
  structureBounds: LandscapeBounds
): void {
  const moatDistance = 3;
  
  // Create moat around structure bounds
  for (let side = 0; side < 4; side++) {
    let startX, startY, endX, endY;
    
    switch (side) {
      case 0: // North
        startX = structureBounds.x - moatDistance;
        endX = structureBounds.x + structureBounds.width + moatDistance;
        startY = endY = structureBounds.y - moatDistance;
        break;
      case 1: // East  
        startX = endX = structureBounds.x + structureBounds.width + moatDistance;
        startY = structureBounds.y - moatDistance;
        endY = structureBounds.y + structureBounds.height + moatDistance;
        break;
      case 2: // South
        startX = structureBounds.x - moatDistance;
        endX = structureBounds.x + structureBounds.width + moatDistance;
        startY = endY = structureBounds.y + structureBounds.height + moatDistance;
        break;
      case 3: // West
        startX = endX = structureBounds.x - moatDistance;
        startY = structureBounds.y - moatDistance;
        endY = structureBounds.y + structureBounds.height + moatDistance;
        break;
    }
    
    // Draw moat line
    const dx = Math.sign(endX - startX);
    const dy = Math.sign(endY - startY);
    const steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
    
    for (let i = 0; i <= steps; i++) {
      const x = startX + (dx * i);
      const y = startY + (dy * i);
      
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.WATER;
        // Add marshy ground around moat
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < size.width && ny >= 0 && ny < size.height && 
                tiles[ny][nx].biome !== BiomeType.WATER) {
              tiles[ny][nx].biome = BiomeType.WETLANDS;
            }
          }
        }
      }
    }
  }
}

/**
 * Add defensive hills around castle
 */
function addDefensiveHills(
  tiles: Tile[][],
  size: { width: number, height: number },
  noise: ValueNoise,
  structureBounds: LandscapeBounds
): void {
  const centerX = structureBounds.x + Math.floor(structureBounds.width / 2);
  const centerY = structureBounds.y + Math.floor(structureBounds.height / 2);
  
  // Elevated position for castle
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const distToCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const elevation = Math.max(0, 1 - (distToCenter / (size.width * 0.3)));
      const hillNoise = noise.noise(x * 0.03, y * 0.03) * 0.3;
      
      const finalElevation = elevation + hillNoise;
      
      if (finalElevation > 0.4 && tiles[y][x].biome !== BiomeType.WATER) {
        tiles[y][x].biome = BiomeType.MOUNTAIN;
      }
    }
  }
}

/**
 * Add sacred grove around temple
 */
function addSacredGrove(
  tiles: Tile[][],
  size: { width: number, height: number },
  noise: ValueNoise,
  structureBounds: LandscapeBounds
): void {
  const groveX = structureBounds.x - 8;
  const groveY = structureBounds.y - 6;
  
  if (groveX >= 0 && groveY >= 0) {
    for (let dy = 0; dy < 12; dy++) {
      for (let dx = 0; dx < 12; dx++) {
        const x = groveX + dx;
        const y = groveY + dy;
        
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          const treeChance = noise.noise(x * 0.15, y * 0.15);
          if (treeChance > 0.2) {
            tiles[y][x].biome = BiomeType.FOREST;
          }
        }
      }
    }
  }
}

/**
 * Add pilgrimage path to temple
 */
function addPilgrimagePath(
  tiles: Tile[][],
  size: { width: number, height: number },
  structureBounds: LandscapeBounds
): void {
  const pathStartY = size.height - 1;
  const pathEndY = structureBounds.y + structureBounds.height;
  const pathX = structureBounds.x + Math.floor(structureBounds.width / 2);
  
  for (let y = pathStartY; y >= pathEndY; y--) {
    if (pathX >= 0 && pathX < size.width && y >= 0) {
      tiles[y][pathX].biome = BiomeType.DIRT_PATH;
    }
  }
}

/**
 * Add formal gardens around palace
 */
function addFormalGardens(
  tiles: Tile[][],
  size: { width: number, height: number },
  structureBounds: LandscapeBounds
): void {
  const gardenStartY = structureBounds.y + structureBounds.height + 2;
  const gardenHeight = Math.min(8, size.height - gardenStartY - 1);
  
  if (gardenStartY < size.height && gardenHeight > 0) {
    // Formal garden layout
    for (let dy = 0; dy < gardenHeight; dy++) {
      for (let dx = 0; dx < structureBounds.width; dx++) {
        const x = structureBounds.x + dx;
        const y = gardenStartY + dy;
        
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          // Geometric pattern
          if ((dx + dy) % 4 === 0) {
            tiles[y][x].biome = BiomeType.WATER; // Fountains
          } else if (dx % 2 === 0 || dy % 2 === 0) {
            tiles[y][x].biome = BiomeType.FLOOR_STONE; // Walkways
          } else {
            tiles[y][x].biome = BiomeType.PARK; // Planted areas
          }
        }
      }
    }
  }
}

/**
 * Add trade routes to market
 */
function addTradeRoutes(
  tiles: Tile[][],
  size: { width: number, height: number },
  structureBounds: LandscapeBounds
): void {
  // Main trade route (horizontal)
  const routeY = structureBounds.y + Math.floor(structureBounds.height / 2);
  
  for (let x = 0; x < size.width; x++) {
    if (routeY >= 0 && routeY < size.height) {
      tiles[routeY][x].biome = BiomeType.DIRT_PATH;
    }
  }
  
  // Secondary route (vertical) 
  const routeX = structureBounds.x + Math.floor(structureBounds.width / 2);
  
  for (let y = 0; y < size.height; y++) {
    if (routeX >= 0 && routeX < size.width) {
      tiles[y][routeX].biome = BiomeType.DIRT_PATH;
    }
  }
}