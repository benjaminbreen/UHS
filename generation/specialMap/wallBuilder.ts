/**
 * generation/specialMap/wallBuilder.ts  
 * Multi-row wall building system for substantial architectural structures
 */

import { Tile, BiomeType } from '../../types';
import { ArchitecturalBiome } from '../../types/specialMapTypes';

export interface WallConfig {
  thickness: number;          // 1-5 tiles thick
  material: WallMaterial;     // Determines BiomeType used  
  hasGates: boolean;          // Whether to include gate openings
  hasTowers: boolean;         // Whether to add corner towers
  defensive: boolean;         // Includes battlements, arrow slits
  decorative: boolean;        // Ornamental elements
}

export enum WallMaterial {
  STONE = 'stone',
  WOOD = 'wood', 
  BRICK = 'brick',
  MUD_BRICK = 'mud_brick',
  BAMBOO = 'bamboo',
  CORAL = 'coral'
}

export interface WallBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Build thick, multi-row walls around a rectangular area
 */
export function buildThickWalls(
  tiles: Tile[][],
  bounds: WallBounds,
  config: WallConfig,
  size: { width: number, height: number }
): void {
  
  const wallBiome = getWallBiome(config.material);
  const thickness = Math.max(1, Math.min(5, config.thickness));
  
  // Build walls layer by layer from outside to inside
  for (let layer = 0; layer < thickness; layer++) {
    const layerBounds = {
      x: bounds.x - layer,
      y: bounds.y - layer,
      width: bounds.width + (layer * 2),
      height: bounds.height + (layer * 2)
    };
    
    buildWallLayer(tiles, layerBounds, wallBiome, size, layer, config);
  }
  
  // Add decorative elements
  if (config.decorative) {
    addDecorativeElements(tiles, bounds, config, size);
  }
  
  // Add defensive features
  if (config.defensive) {
    addDefensiveFeatures(tiles, bounds, config, size);
  }
  
  // Add corner towers
  if (config.hasTowers) {
    addCornerTowers(tiles, bounds, config, size);
  }
  
  // Add gates
  if (config.hasGates) {
    addGateOpenings(tiles, bounds, config, size);
  }
}

/**
 * Get the appropriate BiomeType for wall material
 */
function getWallBiome(material: WallMaterial): BiomeType {
  switch (material) {
    case WallMaterial.STONE:
      return BiomeType.WALL;
    case WallMaterial.WOOD:
      return ArchitecturalBiome.WALL_WOOD as any || BiomeType.WALL;
    case WallMaterial.BRICK:
      return ArchitecturalBiome.WALL_BRICK as any || BiomeType.WALL;
    case WallMaterial.MUD_BRICK:
      return ArchitecturalBiome.WALL_ADOBE as any || BiomeType.WALL;
    case WallMaterial.BAMBOO:
      return ArchitecturalBiome.WALL_BAMBOO as any || BiomeType.WALL;
    case WallMaterial.CORAL:
      return ArchitecturalBiome.WALL_CORAL as any || BiomeType.WALL;
    default:
      return BiomeType.WALL;
  }
}

/**
 * Build a single layer of wall
 */
function buildWallLayer(
  tiles: Tile[][],
  bounds: WallBounds,
  wallBiome: BiomeType,
  size: { width: number, height: number },
  layer: number,
  config: WallConfig
): void {
  
  // Top wall
  for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
    if (x >= 0 && x < size.width && bounds.y >= 0 && bounds.y < size.height) {
      tiles[bounds.y][x].biome = wallBiome;
    }
  }
  
  // Bottom wall
  const bottomY = bounds.y + bounds.height - 1;
  for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
    if (x >= 0 && x < size.width && bottomY >= 0 && bottomY < size.height) {
      tiles[bottomY][x].biome = wallBiome;
    }
  }
  
  // Left wall
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    if (bounds.x >= 0 && bounds.x < size.width && y >= 0 && y < size.height) {
      tiles[y][bounds.x].biome = wallBiome;
    }
  }
  
  // Right wall
  const rightX = bounds.x + bounds.width - 1;
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    if (rightX >= 0 && rightX < size.width && y >= 0 && y < size.height) {
      tiles[y][rightX].biome = wallBiome;
    }
  }
}

/**
 * Add decorative elements to walls
 */
function addDecorativeElements(
  tiles: Tile[][],
  bounds: WallBounds,
  config: WallConfig,
  size: { width: number, height: number }
): void {
  
  // Add columns at regular intervals
  const columnSpacing = 6;
  
  // Top wall columns
  for (let x = bounds.x + columnSpacing; x < bounds.x + bounds.width - columnSpacing; x += columnSpacing) {
    if (x >= 0 && x < size.width && bounds.y - 1 >= 0) {
      tiles[bounds.y - 1][x].biome = BiomeType.COLUMN;
    }
  }
  
  // Add decorative windows
  if (config.material === WallMaterial.STONE || config.material === WallMaterial.BRICK) {
    const windowSpacing = 8;
    const wallY = bounds.y;
    
    for (let x = bounds.x + windowSpacing; x < bounds.x + bounds.width - windowSpacing; x += windowSpacing) {
      if (x >= 0 && x < size.width && wallY >= 0 && wallY < size.height) {
        tiles[wallY][x].biome = ArchitecturalBiome.WALL_WINDOW as any || wallBiome;
      }
    }
  }
}

/**
 * Add defensive features like battlements and arrow slits
 */
function addDefensiveFeatures(
  tiles: Tile[][],
  bounds: WallBounds,
  config: WallConfig,
  size: { width: number, height: number }
): void {
  
  // Add battlements (alternating high/low wall sections)
  const battlement = ArchitecturalBiome.BATTLEMENT as any || BiomeType.WALL;
  
  // Top wall battlements
  for (let x = bounds.x + 2; x < bounds.x + bounds.width - 2; x += 3) {
    if (x >= 0 && x < size.width && bounds.y - 1 >= 0) {
      tiles[bounds.y - 1][x].biome = battlement;
    }
  }
  
  // Arrow slits in walls
  const arrowSlit = ArchitecturalBiome.ARROW_SLIT as any || BiomeType.WALL;
  const slitSpacing = 10;
  
  // Left wall arrow slits
  for (let y = bounds.y + 3; y < bounds.y + bounds.height - 3; y += slitSpacing) {
    if (bounds.x >= 0 && bounds.x < size.width && y >= 0 && y < size.height) {
      tiles[y][bounds.x].biome = arrowSlit;
    }
  }
  
  // Right wall arrow slits
  const rightX = bounds.x + bounds.width - 1;
  for (let y = bounds.y + 3; y < bounds.y + bounds.height - 3; y += slitSpacing) {
    if (rightX >= 0 && rightX < size.width && y >= 0 && y < size.height) {
      tiles[y][rightX].biome = arrowSlit;
    }
  }
}

/**
 * Add corner towers
 */
function addCornerTowers(
  tiles: Tile[][],
  bounds: WallBounds,
  config: WallConfig,
  size: { width: number, height: number }
): void {
  
  const towerSize = Math.max(3, config.thickness + 1);
  const wallBiome = getWallBiome(config.material);
  
  // Corner positions
  const corners = [
    { x: bounds.x - Math.floor(towerSize/2), y: bounds.y - Math.floor(towerSize/2) }, // Top-left
    { x: bounds.x + bounds.width - Math.ceil(towerSize/2), y: bounds.y - Math.floor(towerSize/2) }, // Top-right  
    { x: bounds.x - Math.floor(towerSize/2), y: bounds.y + bounds.height - Math.ceil(towerSize/2) }, // Bottom-left
    { x: bounds.x + bounds.width - Math.ceil(towerSize/2), y: bounds.y + bounds.height - Math.ceil(towerSize/2) } // Bottom-right
  ];
  
  for (const corner of corners) {
    // Build square tower
    for (let dy = 0; dy < towerSize; dy++) {
      for (let dx = 0; dx < towerSize; dx++) {
        const x = corner.x + dx;
        const y = corner.y + dy;
        
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          // Tower walls
          if (dx === 0 || dx === towerSize - 1 || dy === 0 || dy === towerSize - 1) {
            tiles[y][x].biome = wallBiome;
          } else {
            // Tower interior
            tiles[y][x].biome = BiomeType.FLOOR_STONE;
          }
        }
      }
    }
    
    // Add tower entrance
    const entranceX = corner.x + Math.floor(towerSize/2);
    const entranceY = corner.y + towerSize - 1;
    
    if (entranceX >= 0 && entranceX < size.width && entranceY >= 0 && entranceY < size.height) {
      tiles[entranceY][entranceX].biome = ArchitecturalBiome.DOOR as any || BiomeType.FLOOR_STONE;
    }
  }
}

/**
 * Add gate openings
 */
function addGateOpenings(
  tiles: Tile[][],
  bounds: WallBounds,
  config: WallConfig,
  size: { width: number, height: number }
): void {
  
  const gateWidth = Math.max(3, config.thickness + 1);
  const gateBiome = ArchitecturalBiome.DOOR as any || BiomeType.FLOOR_STONE;
  
  // Main gate (south wall)
  const mainGateX = bounds.x + Math.floor(bounds.width / 2) - Math.floor(gateWidth / 2);
  const mainGateY = bounds.y + bounds.height - 1;
  
  for (let dx = 0; dx < gateWidth; dx++) {
    const x = mainGateX + dx;
    if (x >= 0 && x < size.width && mainGateY >= 0 && mainGateY < size.height) {
      tiles[mainGateY][x].biome = gateBiome;
      
      // Clear gate passage through thick walls
      for (let layer = 0; layer < config.thickness; layer++) {
        const layerY = mainGateY + layer;
        if (layerY >= 0 && layerY < size.height) {
          tiles[layerY][x].biome = gateBiome;
        }
      }
    }
  }
  
  // Smaller side gates if wall is big enough
  if (bounds.width > 20) {
    // East gate
    const eastGateX = bounds.x + bounds.width - 1;
    const eastGateY = bounds.y + Math.floor(bounds.height / 2);
    
    if (eastGateX >= 0 && eastGateX < size.width && eastGateY >= 0 && eastGateY < size.height) {
      tiles[eastGateY][eastGateX].biome = gateBiome;
    }
    
    // West gate  
    const westGateX = bounds.x;
    const westGateY = bounds.y + Math.floor(bounds.height / 2);
    
    if (westGateX >= 0 && westGateX < size.width && westGateY >= 0 && westGateY < size.height) {
      tiles[westGateY][westGateX].biome = gateBiome;
    }
  }
}

/**
 * Get recommended wall configuration for different building types and cultures
 */
export function getWallConfigForArchetype(
  archetype: string, 
  culturalZone: string,
  era: string
): WallConfig {
  
  switch (archetype) {
    case 'CASTLE':
      return {
        thickness: 4,
        material: WallMaterial.STONE,
        hasGates: true,
        hasTowers: true,
        defensive: true,
        decorative: false
      };
      
    case 'PALACE_COMPLEX':
      return {
        thickness: 2,
        material: getMaterialForCulture(culturalZone, 'palace'),
        hasGates: true,
        hasTowers: false,
        defensive: false,
        decorative: true
      };
      
    case 'TEMPLE':
      return {
        thickness: 3,
        material: getMaterialForCulture(culturalZone, 'temple'),
        hasGates: true,
        hasTowers: false,
        defensive: false,
        decorative: true
      };
      
    case 'GOVERNMENT_FORUM':
      return {
        thickness: 2,
        material: getMaterialForCulture(culturalZone, 'government'),
        hasGates: true,
        hasTowers: false,
        defensive: false,
        decorative: true
      };
      
    case 'MARKET_BAZAAR':
      return {
        thickness: 1,
        material: getMaterialForCulture(culturalZone, 'market'),
        hasGates: true,
        hasTowers: false,
        defensive: false,
        decorative: false
      };
      
    default:
      return {
        thickness: 2,
        material: WallMaterial.STONE,
        hasGates: true,
        hasTowers: false,
        defensive: false,
        decorative: false
      };
  }
}

/**
 * Get appropriate wall material for cultural zone and building type
 */
function getMaterialForCulture(culturalZone: string, buildingType: string): WallMaterial {
  switch (culturalZone) {
    case 'MENA':
      return buildingType === 'palace' ? WallMaterial.BRICK : WallMaterial.MUD_BRICK;
      
    case 'EAST_ASIAN':
      return buildingType === 'temple' ? WallMaterial.STONE : WallMaterial.WOOD;
      
    case 'SUB_SAHARAN_AFRICAN':
      return buildingType === 'palace' ? WallMaterial.STONE : WallMaterial.MUD_BRICK;
      
    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      return WallMaterial.WOOD;
      
    case 'OCEANIC':
      return WallMaterial.BAMBOO;
      
    case 'CARIBBEAN':
      return WallMaterial.CORAL;
      
    case 'EUROPEAN':
    default:
      return buildingType === 'castle' ? WallMaterial.STONE : WallMaterial.BRICK;
  }
}