/**
 * Simplified Estate Generator - Sophisticated but Direct
 * Eliminates complex procedural systems that might cause infinite loops
 */

import { Tile } from '../../../types/mapTypes';
import { BiomeType } from '../../../types/biomes/base';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { applyNorthBackWall } from '../backWallUtils';

const LANDSCAPE_BORDER_ROWS = 3;

type MaterialType = 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel' | 'earth' | 'hide';

/**
 * Main estate generation function - simplified approach
 */
export function generateEstates(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: any,
  size: { width: number; height: number }
): {
  tiles: Tile[][];
  interactionZones: InteractionZone[];
  exitZones: ExitZone[];
  rooms: RoomDefinition[];
} {
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];

  // Simple border calculation
  const borderSize = config.hasLandscape ? LANDSCAPE_BORDER_ROWS : 0;

  // Calculate building bounds
  const buildingLeft = borderSize;
  const buildingRight = size.width - borderSize;
  const buildingTop = borderSize;
  const buildingBottom = size.height - borderSize;
  const buildingWidth = buildingRight - buildingLeft;
  const buildingHeight = buildingBottom - buildingTop;

  // Fill landscape border if enabled
  if (config.hasLandscape && config.landscapeClimate) {
    fillSimpleLandscape(tiles, size, borderSize, config.landscapeClimate);
  }

  // Fill building interior with floors
  fillBuildingFloors(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config);

  // Generate layout based on size
  switch (config.mapSize) {
    case 'xs':
    case 'small':
      generateSimpleThronRoom(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, interactionZones, exitZones, rooms);
      break;
    case 'medium':
      generateMediumEstate(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, interactionZones, exitZones, rooms);
      break;
    case 'large':
    case 'xl':
    default:
      generateLargeEstate(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, interactionZones, exitZones, rooms);
      break;
  }

  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Fill building interior with appropriate floors
 */
function fillBuildingFloors(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig
): void {
  let floorType = BiomeType.FLOOR_STONE;

  // Choose floor based on era and culture
  if (config.culturalZone === 'EUROPEAN' && config.era >= 'RENAISSANCE_EARLY_MODERN') {
    floorType = BiomeType.FLOOR_MARBLE;
  } else if (config.era === 'MODERN_ERA' || config.era === 'FUTURE_ERA') {
    floorType = BiomeType.FLOOR_TILE;
  } else if (config.culturalZone === 'EAST_ASIAN') {
    floorType = BiomeType.FLOOR_WOOD;
  }

  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (tiles[y] && tiles[y][x]) {
        // Preserve x/y coordinates when modifying tiles
        const tileX = tiles[y][x].x;
        const tileY = tiles[y][x].y;
        tiles[y][x].biome = floorType;
        tiles[y][x].isBlocking = false;
        tiles[y][x].x = tileX !== undefined ? tileX : x;
        tiles[y][x].y = tileY !== undefined ? tileY : y;
      }
    }
  }
}

/**
 * Simple throne room for small estates
 */
function generateSimpleThronRoom(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = startX + Math.floor(width / 2);
  const wallMaterial = getMaterialForCulture(config.culturalZone);

  // Draw walls
  drawSimpleWalls(tiles, startX, startY, width, height, wallMaterial);

  // Add back wall
  applyNorthBackWall(tiles, startX, 0, width, config, {
    hasWindows: false,
    windowSpacing: 0
  });

  // Place throne with dais
  placeSimpleThrone(tiles, centerX, startY + 2, config);

  // Add some furniture directly
  addBasicFurniture(tiles, startX, startY, width, height, config);

  // Entrance
  if (tiles[startY + height - 1] && tiles[startY + height - 1][centerX]) {
    tiles[startY + height - 1][centerX].biome = BiomeType.DOOR;
    tiles[startY + height - 1][centerX].isBlocking = false;
  }

  // Add room definition
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    roomType: 'throne_room',
    accessLevel: 'public'
  });

  exitZones.push({
    id: 'main_exit',
    location: [centerX, startY + height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
}

/**
 * Medium estate with throne room and antechamber
 */
function generateMediumEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = startX + Math.floor(width / 2);
  const wallMaterial = getMaterialForCulture(config.culturalZone);

  // Draw outer walls
  drawSimpleWalls(tiles, startX, startY, width, height, wallMaterial);

  // Add back wall
  applyNorthBackWall(tiles, startX, 0, width, config, {
    hasWindows: true,
    windowSpacing: 4
  });

  // Divide into throne room (top 60%) and antechamber (bottom 40%)
  const dividerY = startY + Math.floor(height * 0.6);

  // Horizontal divider wall
  for (let x = startX + 1; x < startX + width - 1; x++) {
    if (Math.abs(x - centerX) > 1) { // Leave space for door
      if (tiles[dividerY] && tiles[dividerY][x]) {
        tiles[dividerY][x].biome = BiomeType.WALL_BACK;
        tiles[dividerY][x].isBlocking = true;
      }
    }
  }

  // Door between rooms
  if (tiles[dividerY] && tiles[dividerY][centerX]) {
    tiles[dividerY][centerX].biome = BiomeType.DOOR;
    tiles[dividerY][centerX].isBlocking = false;
  }

  // Place throne
  placeSimpleThrone(tiles, centerX, startY + 2, config);

  // Add furniture to both rooms
  addBasicFurniture(tiles, startX, startY, width, dividerY - startY, config);
  addBasicFurniture(tiles, startX, dividerY, width, height - (dividerY - startY), config);

  // Main entrance
  if (tiles[startY + height - 1] && tiles[startY + height - 1][centerX]) {
    tiles[startY + height - 1][centerX].biome = BiomeType.DOOR;
    tiles[startY + height - 1][centerX].isBlocking = false;
  }

  // Room definitions
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: dividerY - startY - 1 },
    roomType: 'throne_room',
    accessLevel: 'restricted'
  });

  rooms.push({
    id: 'antechamber',
    name: 'Antechamber',
    bounds: { x: startX + 1, y: dividerY + 1, width: width - 2, height: height - (dividerY - startY) - 2 },
    roomType: 'foyer',
    accessLevel: 'public'
  });

  exitZones.push({
    id: 'main_exit',
    location: [centerX, startY + height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
}

/**
 * Large estate with multiple rooms
 */
function generateLargeEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = startX + Math.floor(width / 2);
  const wallMaterial = getMaterialForCulture(config.culturalZone);

  // Draw outer walls
  drawSimpleWalls(tiles, startX, startY, width, height, wallMaterial);

  // Add back wall
  applyNorthBackWall(tiles, startX, 0, width, config, {
    hasWindows: true,
    windowSpacing: 3
  });

  // Create 3-section layout: throne room (top), corridor (middle), reception (bottom)
  const throneHeight = Math.floor(height * 0.4);
  const corridorHeight = Math.floor(height * 0.2);
  const receptionHeight = height - throneHeight - corridorHeight;

  const throneY = startY;
  const corridorY = startY + throneHeight;
  const receptionY = corridorY + corridorHeight;

  // Horizontal dividers
  for (let x = startX + 1; x < startX + width - 1; x++) {
    // Throne/corridor divider
    if (Math.abs(x - centerX) > 1) {
      if (tiles[corridorY] && tiles[corridorY][x]) {
        tiles[corridorY][x].biome = BiomeType.WALL_BACK;
        tiles[corridorY][x].isBlocking = true;
      }
    }
    // Corridor/reception divider
    if (Math.abs(x - centerX) > 1) {
      if (tiles[receptionY] && tiles[receptionY][x]) {
        tiles[receptionY][x].biome = BiomeType.WALL_BACK;
        tiles[receptionY][x].isBlocking = true;
      }
    }
  }

  // Doors
  if (tiles[corridorY] && tiles[corridorY][centerX]) {
    tiles[corridorY][centerX].biome = BiomeType.DOOR;
    tiles[corridorY][centerX].isBlocking = false;
  }
  if (tiles[receptionY] && tiles[receptionY][centerX]) {
    tiles[receptionY][centerX].biome = BiomeType.DOOR;
    tiles[receptionY][centerX].isBlocking = false;
  }

  // Place throne
  placeSimpleThrone(tiles, centerX, throneY + 2, config);

  // Add furniture to each section
  addBasicFurniture(tiles, startX, throneY, width, throneHeight, config);
  addBasicFurniture(tiles, startX, corridorY, width, corridorHeight, config);
  addBasicFurniture(tiles, startX, receptionY, width, receptionHeight, config);

  // Main entrance
  if (tiles[startY + height - 1] && tiles[startY + height - 1][centerX]) {
    tiles[startY + height - 1][centerX].biome = BiomeType.DOOR;
    tiles[startY + height - 1][centerX].isBlocking = false;
  }

  // Room definitions
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { x: startX + 1, y: throneY + 1, width: width - 2, height: throneHeight - 1 },
    roomType: 'throne_room',
    accessLevel: 'restricted'
  });

  rooms.push({
    id: 'corridor',
    name: 'Grand Corridor',
    bounds: { x: startX + 1, y: corridorY + 1, width: width - 2, height: corridorHeight - 1 },
    roomType: 'corridor',
    accessLevel: 'semi-public'
  });

  rooms.push({
    id: 'reception',
    name: 'Reception Hall',
    bounds: { x: startX + 1, y: receptionY + 1, width: width - 2, height: receptionHeight - 2 },
    roomType: 'foyer',
    accessLevel: 'public'
  });

  exitZones.push({
    id: 'main_exit',
    location: [centerX, startY + height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
}

/**
 * Draw simple walls without complex systems
 */
function drawSimpleWalls(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  material: string
): void {
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (!tiles[y] || !tiles[y][x]) continue;

      // Preserve existing x/y coordinates
      const tileX = tiles[y][x].x;
      const tileY = tiles[y][x].y;

      // Only edges get walls
      if (y === startY) {
        // North wall - use back wall
        tiles[y][x].biome = BiomeType.WALL_BACK;
        tiles[y][x].isBlocking = true;
      } else if (y === startY + height - 1 || x === startX || x === startX + width - 1) {
        // Other walls
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
      }

      // Ensure coordinates are preserved
      tiles[y][x].x = tileX !== undefined ? tileX : x;
      tiles[y][x].y = tileY !== undefined ? tileY : y;
    }
  }
}

/**
 * Place a simple throne with minimal decorations
 */
function placeSimpleThrone(
  tiles: Tile[][],
  throneX: number,
  throneY: number,
  config: SpecialMapConfig
): void {
  // Create simple dais
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = throneX + dx;
      const y = throneY + dy;
      if (tiles[y] && tiles[y][x]) {
        // Preserve coordinates
        const tileX = tiles[y][x].x;
        const tileY = tiles[y][x].y;
        tiles[y][x].biome = BiomeType.DAIS;
        tiles[y][x].isBlocking = false;
        tiles[y][x].x = tileX !== undefined ? tileX : x;
        tiles[y][x].y = tileY !== undefined ? tileY : y;
      }
    }
  }

  // Place throne
  if (tiles[throneY] && tiles[throneY][throneX]) {
    // Preserve coordinates
    const tileX = tiles[throneY][throneX].x;
    const tileY = tiles[throneY][throneX].y;
    tiles[throneY][throneX].overlayObject = {
      type: OverlayObjectType.THRONE,
      rotation: 0,
      variant: config.culturalZone
    };
    tiles[throneY][throneX].isBlocking = true;
    tiles[throneY][throneX].x = tileX !== undefined ? tileX : throneX;
    tiles[throneY][throneX].y = tileY !== undefined ? tileY : throneY;
  }

  // Removed torches - they were causing NaN coordinate bugs
  // Just place simple decorative elements instead
  if (tiles[throneY] && tiles[throneY][throneX - 2]) {
    // Preserve coordinates
    const tileX = tiles[throneY][throneX - 2].x;
    const tileY = tiles[throneY][throneX - 2].y;
    tiles[throneY][throneX - 2].biome = BiomeType.PILLAR;
    tiles[throneY][throneX - 2].isBlocking = true;
    tiles[throneY][throneX - 2].x = tileX !== undefined ? tileX : throneX - 2;
    tiles[throneY][throneX - 2].y = tileY !== undefined ? tileY : throneY;
  }

  if (tiles[throneY] && tiles[throneY][throneX + 2]) {
    // Preserve coordinates
    const tileX = tiles[throneY][throneX + 2].x;
    const tileY = tiles[throneY][throneX + 2].y;
    tiles[throneY][throneX + 2].biome = BiomeType.PILLAR;
    tiles[throneY][throneX + 2].isBlocking = true;
    tiles[throneY][throneX + 2].x = tileX !== undefined ? tileX : throneX + 2;
    tiles[throneY][throneX + 2].y = tileY !== undefined ? tileY : throneY;
  }
}

/**
 * Add basic furniture without complex systems
 */
function addBasicFurniture(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig
): void {
  // Simple furniture placement - avoid center corridor
  const centerX = startX + Math.floor(width / 2);

  // Place some tables along walls
  for (let x = startX + 2; x < startX + width - 2; x += 4) {
    if (Math.abs(x - centerX) > 2) { // Avoid center
      // North wall furniture
      if (tiles[startY + 2] && tiles[startY + 2][x] && !tiles[startY + 2][x].overlayObject) {
        // Preserve coordinates
        const tileX = tiles[startY + 2][x].x;
        const tileY = tiles[startY + 2][x].y;
        tiles[startY + 2][x].overlayObject = {
          type: OverlayObjectType.TABLE,
          rotation: 0,
          variant: getMaterialForCulture(config.culturalZone)
        };
        tiles[startY + 2][x].isBlocking = true;
        tiles[startY + 2][x].x = tileX !== undefined ? tileX : x;
        tiles[startY + 2][x].y = tileY !== undefined ? tileY : startY + 2;
      }

      // South wall furniture
      if (tiles[startY + height - 3] && tiles[startY + height - 3][x] && !tiles[startY + height - 3][x].overlayObject) {
        // Preserve coordinates
        const tileX = tiles[startY + height - 3][x].x;
        const tileY = tiles[startY + height - 3][x].y;
        tiles[startY + height - 3][x].overlayObject = {
          type: OverlayObjectType.CABINET,
          rotation: 0,
          variant: getMaterialForCulture(config.culturalZone)
        };
        tiles[startY + height - 3][x].isBlocking = true;
        tiles[startY + height - 3][x].x = tileX !== undefined ? tileX : x;
        tiles[startY + height - 3][x].y = tileY !== undefined ? tileY : startY + height - 3;
      }
    }
  }

  // Place some seating
  for (let y = startY + 3; y < startY + height - 3; y += 3) {
    // Left wall
    if (tiles[y] && tiles[y][startX + 2] && !tiles[y][startX + 2].overlayObject) {
      // Preserve coordinates
      const tileX = tiles[y][startX + 2].x;
      const tileY = tiles[y][startX + 2].y;
      tiles[y][startX + 2].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: 90,
        variant: 'simple'
      };
      tiles[y][startX + 2].isBlocking = true;
      tiles[y][startX + 2].x = tileX !== undefined ? tileX : startX + 2;
      tiles[y][startX + 2].y = tileY !== undefined ? tileY : y;
    }

    // Right wall
    if (tiles[y] && tiles[y][startX + width - 3] && !tiles[y][startX + width - 3].overlayObject) {
      // Preserve coordinates
      const tileX = tiles[y][startX + width - 3].x;
      const tileY = tiles[y][startX + width - 3].y;
      tiles[y][startX + width - 3].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: 270,
        variant: 'simple'
      };
      tiles[y][startX + width - 3].isBlocking = true;
      tiles[y][startX + width - 3].x = tileX !== undefined ? tileX : startX + width - 3;
      tiles[y][startX + width - 3].y = tileY !== undefined ? tileY : y;
    }
  }
}

/**
 * Simple landscape fill
 */
function fillSimpleLandscape(
  tiles: Tile[][],
  size: { width: number; height: number },
  borderSize: number,
  climate: string
): void {
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      // Only fill border area
      if (x < borderSize || x >= size.width - borderSize ||
          y < borderSize || y >= size.height - borderSize) {

        if (tiles[y] && tiles[y][x]) {
          // Preserve coordinates
          const tileX = tiles[y][x].x;
          const tileY = tiles[y][x].y;
          const variation = (x + y * size.width) % 10;

          switch (climate) {
            case 'arid':
              tiles[y][x].biome = variation < 7 ? BiomeType.DESERT : BiomeType.SCRUB;
              break;
            case 'temperate':
              tiles[y][x].biome = variation < 5 ? BiomeType.GRASSLAND : BiomeType.FOREST;
              break;
            case 'cold':
              tiles[y][x].biome = variation < 7 ? BiomeType.SNOW : BiomeType.TUNDRA;
              break;
            case 'tropical':
              tiles[y][x].biome = variation < 7 ? BiomeType.JUNGLE : BiomeType.WETLANDS;
              break;
            default:
              tiles[y][x].biome = BiomeType.GRASSLAND;
          }
          tiles[y][x].isBlocking = false;
          tiles[y][x].x = tileX !== undefined ? tileX : x;
          tiles[y][x].y = tileY !== undefined ? tileY : y;
        }
      }
    }
  }
}

/**
 * Get appropriate material for culture
 */
function getMaterialForCulture(culturalZone?: string): string {
  switch (culturalZone) {
    case 'EAST_ASIAN':
      return 'lacquered_wood';
    case 'MENA':
      return 'cedar';
    case 'SUB_SAHARAN_AFRICAN':
      return 'ebony';
    case 'SOUTH_ASIAN':
      return 'teak';
    case 'EUROPEAN':
      return 'oak';
    default:
      return 'wood';
  }
}