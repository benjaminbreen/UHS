/**
 * Directional Furniture Placement Utilities
 * Helps generators place furniture in appropriate directions based on room layout
 */

import { Tile, OverlayObjectType } from '../../types/core/tile';
import { BiomeType } from '../../types/biomes/base';

/**
 * Determines the best direction for a desk based on nearby walls
 */
export function getBestDeskDirection(
  tiles: Tile[][],
  x: number,
  y: number
): OverlayObjectType {
  const isWall = (tile: Tile | undefined) => 
    tile?.biome === BiomeType.WALL || tile?.biome === BiomeType.WALL_STONE;

  // Check each direction for walls - desk should face away from wall
  const northWall = isWall(tiles[y - 1]?.[x]);
  const southWall = isWall(tiles[y + 1]?.[x]);
  const eastWall = isWall(tiles[y]?.[x + 1]);
  const westWall = isWall(tiles[y]?.[x - 1]);

  // Prefer facing center of room (away from walls)
  if (northWall) return OverlayObjectType.DESK_FACING_SOUTH;
  if (southWall) return OverlayObjectType.DESK_FACING_NORTH;
  if (eastWall) return OverlayObjectType.DESK_FACING_WEST;
  if (westWall) return OverlayObjectType.DESK_FACING_EAST;

  // Default to facing south if no walls detected
  return OverlayObjectType.DESK_FACING_SOUTH;
}

/**
 * Determines the best direction for a bookshelf based on adjacent walls
 */
export function getBestBookshelfDirection(
  tiles: Tile[][],
  x: number,
  y: number
): OverlayObjectType {
  const isWall = (tile: Tile | undefined) => 
    tile?.biome === BiomeType.WALL || tile?.biome === BiomeType.WALL_STONE;

  // Check each direction for walls - bookshelf should be against wall
  const northWall = isWall(tiles[y - 1]?.[x]);
  const southWall = isWall(tiles[y + 1]?.[x]);
  const eastWall = isWall(tiles[y]?.[x + 1]);
  const westWall = isWall(tiles[y]?.[x - 1]);

  // Prefer being against a wall
  if (northWall) return OverlayObjectType.BOOKSHELF_AGAINST_NORTH_WALL;
  if (southWall) return OverlayObjectType.BOOKSHELF_AGAINST_SOUTH_WALL;
  if (eastWall) return OverlayObjectType.BOOKSHELF_AGAINST_EAST_WALL;
  if (westWall) return OverlayObjectType.BOOKSHELF_AGAINST_WEST_WALL;

  // Default to north wall if no walls detected
  return OverlayObjectType.BOOKSHELF_AGAINST_NORTH_WALL;
}

/**
 * Determines the best bench orientation for a given space
 */
export function getBestBenchOrientation(
  tiles: Tile[][],
  x: number,
  y: number,
  roomWidth: number,
  roomHeight: number
): OverlayObjectType {
  // If room is wider than tall, use east-west benches (people face north/south)
  if (roomWidth > roomHeight) {
    return OverlayObjectType.BENCH_EAST_WEST;
  }
  // If room is taller than wide, use north-south benches (people face east/west)
  else {
    return OverlayObjectType.BENCH_NORTH_SOUTH;
  }
}

/**
 * Determines the best bed orientation for a given room
 */
export function getBestBedOrientation(
  tiles: Tile[][],
  x: number,
  y: number,
  roomWidth: number,
  roomHeight: number
): OverlayObjectType {
  // For bedrooms, orient bed to fit room shape efficiently
  // Wide rooms get horizontal beds, tall rooms get vertical beds
  if (roomWidth >= roomHeight) {
    return OverlayObjectType.BED_HORIZONTAL;
  } else {
    return OverlayObjectType.BED_VERTICAL;
  }
}

/**
 * Gets appropriate cultural decoration for a given cultural zone
 */
export function getCulturalDecoration(
  culturalZone: string,
  variant?: string
): { type: OverlayObjectType; variant: string } {
  switch (culturalZone) {
    case 'EUROPEAN':
      return {
        type: OverlayObjectType.EUROPEAN_HERALDIC_SHIELD,
        variant: variant || 'noble'
      };
    case 'EAST_ASIAN':
      return {
        type: OverlayObjectType.EAST_ASIAN_DECORATIVE_SCROLL,
        variant: variant || 'calligraphy'
      };
    case 'MENA':
      return {
        type: OverlayObjectType.MENA_DECORATIVE_TILE_PANEL,
        variant: variant || 'geometric'
      };
    case 'AFRICAN':
      return {
        type: OverlayObjectType.AFRICAN_DECORATIVE_MASK,
        variant: variant || 'ceremonial'
      };
    case 'NORTH_AMERICAN':
    case 'SOUTH_AMERICAN':
      return {
        type: OverlayObjectType.INDIGENOUS_DECORATIVE_DREAMCATCHER,
        variant: variant || 'traditional'
      };
    default:
      return {
        type: OverlayObjectType.EUROPEAN_HERALDIC_SHIELD,
        variant: variant || 'noble'
      };
  }
}

/**
 * Places a desk with appropriate direction and adds a chair in front of it
 */
export function placeDeskWithChair(
  tiles: Tile[][],
  x: number,
  y: number,
  culturalZone: string,
  material: string = 'wood'
): void {
  // Place desk with appropriate direction
  const deskDirection = getBestDeskDirection(tiles, x, y);
  tiles[y][x].overlayObject = {
    type: deskDirection,
    rotation: 0,
    material,
    variant: 'scholar'
  };
  tiles[y][x].isBlocking = true;

  // Place chair in appropriate position relative to desk
  let chairX = x, chairY = y;
  
  switch (deskDirection) {
    case OverlayObjectType.DESK_FACING_NORTH:
      chairY = y + 1; // Chair south of desk
      break;
    case OverlayObjectType.DESK_FACING_SOUTH:
      chairY = y - 1; // Chair north of desk
      break;
    case OverlayObjectType.DESK_FACING_EAST:
      chairX = x - 1; // Chair west of desk
      break;
    case OverlayObjectType.DESK_FACING_WEST:
      chairX = x + 1; // Chair east of desk
      break;
  }

  // Only place chair if the position is valid and empty
  if (tiles[chairY]?.[chairX] && 
      tiles[chairY][chairX].biome !== BiomeType.WALL &&
      !tiles[chairY][chairX].overlayObject) {
    tiles[chairY][chairX].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 0,
      material,
      variant: undefined
    };
    tiles[chairY][chairX].isBlocking = true;
  }
}

/**
 * Places a bookshelf against the most appropriate wall
 */
export function placeBookshelfAgainstWall(
  tiles: Tile[][],
  x: number,
  y: number,
  culturalZone: string,
  material: string = 'wood'
): void {
  const bookshelfDirection = getBestBookshelfDirection(tiles, x, y);
  tiles[y][x].overlayObject = {
    type: bookshelfDirection,
    rotation: 0,
    material,
    variant: 'scholar'
  };
  tiles[y][x].isBlocking = true;
}

/**
 * Places a bench with appropriate orientation for the room
 */
export function placeBenchWithOrientation(
  tiles: Tile[][],
  x: number,
  y: number,
  roomWidth: number,
  roomHeight: number,
  culturalZone: string,
  material: string = 'wood'
): void {
  const benchOrientation = getBestBenchOrientation(tiles, x, y, roomWidth, roomHeight);
  tiles[y][x].overlayObject = {
    type: benchOrientation,
    rotation: 0,
    material,
    variant: 'simple'
  };
  tiles[y][x].isBlocking = true;
}

/**
 * Places a bed with appropriate orientation for the room
 */
export function placeBedWithOrientation(
  tiles: Tile[][],
  x: number,
  y: number,
  roomWidth: number,
  roomHeight: number,
  culturalZone: string,
  material: string = 'wood'
): void {
  const bedOrientation = getBestBedOrientation(tiles, x, y, roomWidth, roomHeight);
  tiles[y][x].overlayObject = {
    type: bedOrientation,
    rotation: 0,
    material,
    variant: 'simple'
  };
  tiles[y][x].isBlocking = true;
}

/**
 * Places a cultural decoration on a wall
 */
export function placeCulturalDecoration(
  tiles: Tile[][],
  x: number,
  y: number,
  culturalZone: string,
  variant?: string
): void {
  const decoration = getCulturalDecoration(culturalZone, variant);
  tiles[y][x].overlayObject = {
    type: decoration.type,
    rotation: 0,
    variant: decoration.variant
  };
  // Decorations don't block movement
  tiles[y][x].isBlocking = false;
}