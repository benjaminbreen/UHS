/**
 * Back Wall Utilities for Special Maps
 * Creates SNES RPG-style "dollhouse" view with visible north walls
 */

import { Tile, BiomeType } from '../../types';
import { SpecialMapConfig } from '../../types/specialMapTypes';

/**
 * Apply back walls to the north edge of a room
 * Creates the "looking into a dollhouse" effect from classic SNES RPGs
 */
export function applyNorthBackWall(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  config: SpecialMapConfig,
  options?: {
    windowSpacing?: number;
    hasWindows?: boolean;
    hasDoor?: boolean;
    doorPosition?: number; // Offset from startX
  }
): void {
  const { windowSpacing = 5, hasWindows = true, hasDoor = false, doorPosition = Math.floor(width / 2) } = options || {};
  
  // Apply back wall across the north edge
  for (let x = startX; x < startX + width; x++) {
    if (startY < 0 || startY >= tiles.length || x < 0 || x >= tiles[0].length) continue;
    
    // Check if this position should have a door
    if (hasDoor && x === startX + doorPosition) {
      tiles[startY][x].biome = BiomeType.WALL_BACK_DOOR;
    }
    // Check if this position should have a window
    else if (hasWindows && (x - startX) % windowSpacing === Math.floor(windowSpacing / 2)) {
      tiles[startY][x].biome = BiomeType.WALL_BACK_WINDOW;
    }
    // Regular back wall
    else {
      tiles[startY][x].biome = BiomeType.WALL_BACK;
    }
    
    // Apply material based on culture/era
    tiles[startY][x].materialSubtype = getWallMaterial(config);
  }
}

/**
 * Apply back walls to an entire room perimeter (north edge only for dollhouse view)
 * But also supports room dividers as horizontal back walls
 */
export function applyRoomBackWalls(
  tiles: Tile[][],
  room: { x: number; y: number; width: number; height: number },
  config: SpecialMapConfig,
  options?: {
    hasWindows?: boolean;
    windowSpacing?: number;
  }
): void {
  // Apply back wall to north edge of room
  applyNorthBackWall(tiles, room.x, room.y, room.width, config, options);
}

/**
 * Apply a horizontal room divider using back walls
 * Used to separate throne rooms from antechambers, etc.
 */
export function applyRoomDivider(
  tiles: Tile[][],
  startX: number,
  y: number,
  width: number,
  config: SpecialMapConfig,
  doorPosition?: number // Where to place the door
): void {
  const door = doorPosition ?? Math.floor(width / 2);
  
  for (let x = startX; x < startX + width; x++) {
    if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) continue;
    
    // Leave space for door
    if (Math.abs(x - (startX + door)) <= 1) {
      if (x === startX + door) {
        tiles[y][x].biome = BiomeType.DOOR;
        tiles[y][x].isBlocking = false;
      }
    } else {
      // Use back wall for the divider
      tiles[y][x].biome = BiomeType.WALL_BACK;
      tiles[y][x].isBlocking = true;
      tiles[y][x].materialSubtype = getWallMaterial(config);
    }
  }
}

/**
 * Get appropriate wall material based on culture and era
 */
function getWallMaterial(config: SpecialMapConfig): string {
  const { culturalZone, era, specificYear } = config;
  const year = specificYear || 1000;
  
  switch (culturalZone) {
    case 'EUROPEAN':
      if (year < 500) return 'roman_marble';
      if (year < 1200) return 'grey_stone';
      if (year < 1500) return 'decorated_stone';
      if (year < 1800) return 'plaster_elegant';
      return 'modern_drywall';
      
    case 'EAST_ASIAN':
      if (config.region === 'japan') return 'paper_screen';
      if (year < 1400) return 'wood_lacquer';
      return 'painted_wood';
      
    case 'MENA':
      if (year < 0) return 'mud_brick';
      if (year < 1200) return 'sandstone';
      return 'decorated_tile';
      
    case 'SUB_SAHARAN_AFRICAN':
      if (year < 1500) return 'adobe_relief';
      return 'painted_adobe';
      
    case 'SOUTH_ASIAN':
      if (year < 500) return 'carved_sandstone';
      if (year < 1500) return 'red_sandstone';
      return 'marble_inlay';
      
    case 'AMERICAS':
    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      if (year < 1500) return 'fitted_stone';
      return 'adobe';
      
    case 'OCEANIA':
      return 'woven_panels';
      
    default:
      return 'stone';
  }
}

/**
 * Check if a room should have windows based on type and culture
 */
export function shouldHaveWindows(roomType: string, config: SpecialMapConfig): boolean {
  // Dungeons, storage, sacred inner sanctums typically don't have windows
  const noWindowRooms = ['dungeon', 'storage', 'treasury', 'inner_sanctum', 'crypt'];
  if (noWindowRooms.includes(roomType)) return false;
  
  // Some cultures/eras have less windows
  if (config.culturalZone === 'MENA' && config.specificYear && config.specificYear < 1000) {
    // Early Islamic architecture often had fewer external windows for privacy
    return roomType === 'courtyard' || roomType === 'reception';
  }
  
  // Japanese paper screens don't really have "windows" in the same way
  if (config.culturalZone === 'EAST_ASIAN' && config.region === 'japan') {
    return false; // The whole wall is translucent
  }
  
  return true;
}