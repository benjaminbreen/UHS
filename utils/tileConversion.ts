/**
 * Tile Conversion Utility
 * Helps migrate tiles from the old system (furniture as BiomeType) 
 * to the new overlay system (furniture as overlays on floor tiles)
 */

import { Tile, OverlayObjectType, OverlayObject } from '../types/core/tile';
import { BiomeType } from '../types/biomes/base';

/**
 * Map of furniture BiomeTypes to their overlay equivalents
 */
const FURNITURE_TO_OVERLAY_MAP: Record<string, OverlayObjectType> = {
  [BiomeType.CHAIR]: OverlayObjectType.CHAIR,
  [BiomeType.TABLE]: OverlayObjectType.TABLE,
  [BiomeType.DESK]: OverlayObjectType.DESK,
  [BiomeType.BOOKSHELF]: OverlayObjectType.BOOKSHELF,
  [BiomeType.CHEST]: OverlayObjectType.CHEST,
  [BiomeType.BED]: OverlayObjectType.BED,
  [BiomeType.THRONE]: OverlayObjectType.THRONE,
  [BiomeType.BENCH]: OverlayObjectType.BENCH,
  [BiomeType.CABINET]: OverlayObjectType.CABINET,
  [BiomeType.BRAZIER]: OverlayObjectType.BRAZIER,
  [BiomeType.TORCH]: OverlayObjectType.TORCH,
  [BiomeType.STATUE]: OverlayObjectType.STATUE,
  [BiomeType.FOUNTAIN]: OverlayObjectType.FOUNTAIN,
  [BiomeType.PODIUM]: OverlayObjectType.PODIUM,
  [BiomeType.ALTAR]: OverlayObjectType.ALTAR,
  [BiomeType.WEAPON_RACK]: OverlayObjectType.WEAPON_RACK,
  [BiomeType.ARMOR_STAND]: OverlayObjectType.ARMOR_STAND,
  [BiomeType.MIRROR]: OverlayObjectType.MIRROR,
  [BiomeType.BASIN]: OverlayObjectType.BASIN,
  [BiomeType.KITCHEN_STOVE]: OverlayObjectType.KITCHEN_STOVE,
  [BiomeType.KITCHEN_COUNTER]: OverlayObjectType.KITCHEN_COUNTER,
  [BiomeType.KITCHEN_SINK]: OverlayObjectType.KITCHEN_SINK,
  [BiomeType.BARREL]: OverlayObjectType.BARREL,
  [BiomeType.FILING_CABINET]: OverlayObjectType.FILING_CABINET,
  // Multi-tile objects
  [BiomeType.PILLAR]: OverlayObjectType.PILLAR_BASE,
  [BiomeType.TABLE_LEFT]: OverlayObjectType.TABLE_LEFT,
  [BiomeType.TABLE_CENTER]: OverlayObjectType.TABLE_CENTER,
  [BiomeType.TABLE_RIGHT]: OverlayObjectType.TABLE_RIGHT,
};

/**
 * Determine the appropriate floor type for a room based on context
 */
function getAppropriateFloorType(tile: Tile, adjacentTiles?: Tile[]): BiomeType {
  // If tile has cultural zone info, use appropriate floor
  if (tile.culturalZone) {
    switch (tile.culturalZone) {
      case 'EUROPEAN':
      case 'NORTH_AMERICAN':
        return BiomeType.FLOOR_WOOD;
      case 'MENA':
      case 'SOUTH_ASIAN':
        return BiomeType.FLOOR_TILE;
      case 'EAST_ASIAN':
        return BiomeType.FLOOR_WOOD; // Tatami or wood
      case 'AFRICAN':
        return BiomeType.FLOOR_STONE;
      default:
        return BiomeType.FLOOR_STONE;
    }
  }
  
  // Check adjacent tiles for floor types
  if (adjacentTiles) {
    const floorTypes = adjacentTiles
      .filter(t => t.biome.startsWith('FLOOR_'))
      .map(t => t.biome);
    
    if (floorTypes.length > 0) {
      // Use most common adjacent floor type
      const mode = getMostFrequent(floorTypes);
      return mode as BiomeType;
    }
  }
  
  // Default to stone floor
  return BiomeType.FLOOR_STONE;
}

/**
 * Get the most frequent element in an array
 */
function getMostFrequent<T>(arr: T[]): T {
  const frequency: Map<T, number> = new Map();
  arr.forEach(item => {
    frequency.set(item, (frequency.get(item) || 0) + 1);
  });
  
  let maxCount = 0;
  let mode: T = arr[0];
  
  frequency.forEach((count, item) => {
    if (count > maxCount) {
      maxCount = count;
      mode = item;
    }
  });
  
  return mode;
}

/**
 * Determine if a BiomeType is a furniture item
 */
export function isFurnitureBiome(biome: BiomeType): boolean {
  return biome in FURNITURE_TO_OVERLAY_MAP;
}

/**
 * Migrate a single tile from old system to new overlay system
 */
export function migrateTileToOverlay(
  tile: Tile, 
  adjacentTiles?: Tile[],
  intelligentRotation: boolean = false
): Tile {
  // Check if this tile needs migration
  if (!isFurnitureBiome(tile.biome)) {
    return tile; // No migration needed
  }
  
  // If tile already has an overlay, skip migration
  if (tile.overlayObject) {
    return tile;
  }
  
  // Get the overlay type
  const overlayType = FURNITURE_TO_OVERLAY_MAP[tile.biome];
  if (!overlayType) {
    return tile; // Unknown furniture type, skip
  }
  
  // Determine rotation based on adjacent tiles
  let rotation = 0;
  if (intelligentRotation && adjacentTiles) {
    rotation = calculateIntelligentRotation(overlayType, tile, adjacentTiles);
  }
  
  // Determine material based on cultural zone
  const material = determineMaterial(tile.culturalZone);
  
  // Create the overlay object
  const overlayObject: OverlayObject = {
    type: overlayType,
    rotation,
    material,
    variant: undefined
  };
  
  // Return migrated tile
  return {
    ...tile,
    biome: getAppropriateFloorType(tile, adjacentTiles),
    overlayObject,
    isBlocking: isBlockingObject(overlayType) || tile.isBlocking
  };
}

/**
 * Calculate intelligent rotation for furniture based on context
 */
function calculateIntelligentRotation(
  objectType: OverlayObjectType,
  tile: Tile,
  adjacentTiles: Tile[]
): number {
  // Get adjacent tiles in cardinal directions
  const north = adjacentTiles.find(t => t.x === tile.x && t.y === tile.y - 1);
  const south = adjacentTiles.find(t => t.x === tile.x && t.y === tile.y + 1);
  const east = adjacentTiles.find(t => t.x === tile.x + 1 && t.y === tile.y);
  const west = adjacentTiles.find(t => t.x === tile.x - 1 && t.y === tile.y);
  
  // Furniture-specific rotation logic
  switch (objectType) {
    case OverlayObjectType.DESK:
    case OverlayObjectType.BOOKSHELF:
    case OverlayObjectType.CABINET:
      // These should face away from walls
      if (north && isWall(north.biome)) return 180; // Face south
      if (south && isWall(south.biome)) return 0;   // Face north
      if (east && isWall(east.biome)) return 270;   // Face west
      if (west && isWall(west.biome)) return 90;    // Face east
      break;
      
    case OverlayObjectType.CHAIR:
    case OverlayObjectType.THRONE:
      // Chairs should face toward desks/tables if adjacent
      if (north && (north.biome === BiomeType.DESK || north.biome === BiomeType.TABLE)) return 0;
      if (south && (south.biome === BiomeType.DESK || south.biome === BiomeType.TABLE)) return 180;
      if (east && (east.biome === BiomeType.DESK || east.biome === BiomeType.TABLE)) return 90;
      if (west && (west.biome === BiomeType.DESK || west.biome === BiomeType.TABLE)) return 270;
      
      // Otherwise face center of room (simplified: face south)
      return 180;
      
    case OverlayObjectType.BED:
      // Beds should have headboard against wall
      if (north && isWall(north.biome)) return 0;
      if (east && isWall(east.biome)) return 90;
      if (south && isWall(south.biome)) return 180;
      if (west && isWall(west.biome)) return 270;
      break;
      
    case OverlayObjectType.TORCH:
    case OverlayObjectType.BRAZIER:
      // Light sources don't need rotation
      return 0;
  }
  
  return 0; // Default rotation
}

/**
 * Check if a biome type is a wall
 */
function isWall(biome: BiomeType): boolean {
  return biome === BiomeType.WALL || 
         biome === BiomeType.WALL_GATE ||
         biome === BiomeType.WALL_WINDOW ||
         biome.startsWith('WALL_');
}

/**
 * Determine if an overlay object blocks movement
 */
function isBlockingObject(objectType: OverlayObjectType): boolean {
  const nonBlockingObjects = [
    OverlayObjectType.TORCH,
    OverlayObjectType.MIRROR,
    OverlayObjectType.DOOR, // Doors can be opened
  ];
  
  return !nonBlockingObjects.includes(objectType);
}

/**
 * Determine material based on cultural zone
 */
function determineMaterial(culturalZone?: string): string {
  if (!culturalZone) return 'wood';
  
  switch (culturalZone) {
    case 'EUROPEAN':
    case 'NORTH_AMERICAN':
      return 'wood';
    case 'MENA':
    case 'AFRICAN':
      return 'sandstone';
    case 'EAST_ASIAN':
      return 'red_lacquer';
    case 'SOUTH_ASIAN':
      return 'wood';
    case 'OCEANIC':
      return 'wood';
    default:
      return 'wood';
  }
}

/**
 * Migrate an entire map from old system to new overlay system
 */
export function migrateMapToOverlaySystem(tiles: Tile[][]): Tile[][] {
  const height = tiles.length;
  const width = tiles[0]?.length || 0;
  
  // Create a new array to avoid mutating the original
  const migratedTiles: Tile[][] = tiles.map(row => [...row]);
  
  // Process each tile
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = migratedTiles[y][x];
      
      // Get adjacent tiles for context
      const adjacentTiles: Tile[] = [];
      if (y > 0) adjacentTiles.push(tiles[y - 1][x]);
      if (y < height - 1) adjacentTiles.push(tiles[y + 1][x]);
      if (x > 0) adjacentTiles.push(tiles[y][x - 1]);
      if (x < width - 1) adjacentTiles.push(tiles[y][x + 1]);
      
      // Migrate the tile
      migratedTiles[y][x] = migrateTileToOverlay(tile, adjacentTiles, true);
    }
  }
  
  return migratedTiles;
}

/**
 * Check if a map uses the new overlay system
 */
export function usesOverlaySystem(tiles: Tile[][]): boolean {
  for (const row of tiles) {
    for (const tile of row) {
      if (tile.overlayObject) {
        return true;
      }
    }
  }
  return false;
}