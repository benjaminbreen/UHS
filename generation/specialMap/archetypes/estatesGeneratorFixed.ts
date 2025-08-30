/**
 * Fixed Estate Generator with Symmetrical Room-Based Architecture
 */

import { Tile } from '../../../types/mapTypes';
import { BiomeType } from '../../../types/biomes/base';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { LANDSCAPE_BORDER_ROWS, MaterialType } from '../../../constants/specialMaps/specialMapAugmentation';
import { placePillar, placeTable, placeLightSource } from '../multiTileSystem';

/**
 * Main estate generation function
 */
export function generateEstates(
  tiles: Tile[][],
  size: { width: number; height: number },
  config: SpecialMapConfig
): {
  tiles: Tile[][];
  interactionZones: InteractionZone[];
  exitZones: ExitZone[];
  rooms: RoomDefinition[];
} {
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  // Determine landscape border
  const borderSize = config.hasLandscape ? 
    LANDSCAPE_BORDER_ROWS[config.mapSize || 'medium'] : 0;
  
  // Calculate building bounds
  const buildingLeft = borderSize;
  const buildingRight = size.width - borderSize;
  const buildingTop = borderSize;
  const buildingBottom = size.height - borderSize;
  const buildingWidth = buildingRight - buildingLeft;
  const buildingHeight = buildingBottom - buildingTop;
  
  // CRITICAL: Fill entire map with floor FIRST
  const floorMaterial = config.floorMaterial || 'grey_stone';
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR;
      applyMaterial(tiles[y][x], floorMaterial);
    }
  }
  
  // Then add landscape border if enabled
  if (config.hasLandscape && config.landscapeClimate) {
    fillLandscapeBorder(tiles, size, borderSize, config.landscapeClimate);
  }
  
  // Generate based on size
  switch (config.mapSize) {
    case 'xs':
    case 'small':
      generateSmallEstate(
        tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
        config, interactionZones, exitZones, rooms
      );
      break;
      
    case 'medium':
      generateMediumEstate(
        tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
        config, interactionZones, exitZones, rooms
      );
      break;
      
    case 'large':
      generateLargeEstate(
        tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
        config, interactionZones, exitZones, rooms
      );
      break;
      
    case 'xl':
      generateXLEstate(
        tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
        config, interactionZones, exitZones, rooms
      );
      break;
      
    default:
      generateLargeEstate(
        tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
        config, interactionZones, exitZones, rooms
      );
  }
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Small estate - single throne room with antechamber
 */
function generateSmallEstate(
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
  const wallMaterial = config.wallMaterial || 'grey_stone';
  const centerX = startX + Math.floor(width / 2);
  
  // Single-tile thick walls
  drawWalls(tiles, startX, startY, width, height, wallMaterial);
  
  // Throne at north
  tiles[startY + 2][centerX].biome = BiomeType.THRONE;
  tiles[startY + 2][centerX].isBlocking = true;
  
  // Entrance at south
  tiles[startY + height - 1][centerX].biome = BiomeType.DOOR;
  tiles[startY + height - 1][centerX].isBlocking = false;
  
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
 * Medium estate - throne room, antechamber, side chambers
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
  const wallMaterial = config.wallMaterial || 'grey_stone';
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + Math.floor(height / 2);
  
  // Outer walls
  drawWalls(tiles, startX, startY, width, height, wallMaterial);
  
  // Symmetrical room division
  const throneRoomHeight = Math.floor(height * 0.5);
  const antechamberY = startY + throneRoomHeight;
  
  // Horizontal dividing wall with central archway
  for (let x = startX + 1; x < startX + width - 1; x++) {
    if (Math.abs(x - centerX) > 1) {
      tiles[antechamberY][x].biome = BiomeType.WALL;
      tiles[antechamberY][x].isBlocking = true;
      applyMaterial(tiles[antechamberY][x], wallMaterial);
    }
  }
  
  // Archway
  tiles[antechamberY][centerX].biome = BiomeType.DOOR;
  tiles[antechamberY][centerX].isBlocking = false;
  
  // Throne
  tiles[startY + 2][centerX].biome = BiomeType.THRONE;
  tiles[startY + 2][centerX].isBlocking = true;
  
  // Symmetrical pillars
  if (width >= 12) {
    placePillar(tiles, centerX - 3, startY + 4, wallMaterial, config.specificYear || 1200);
    placePillar(tiles, centerX + 3, startY + 4, wallMaterial, config.specificYear || 1200);
  }
  
  // Main entrance
  tiles[startY + height - 1][centerX].biome = BiomeType.DOOR;
  tiles[startY + height - 1][centerX].isBlocking = false;
  
  // Room definitions
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: throneRoomHeight - 1 },
    roomType: 'throne_room',
    accessLevel: 'restricted'
  });
  
  rooms.push({
    id: 'antechamber',
    name: 'Antechamber',
    bounds: { x: startX + 1, y: antechamberY + 1, width: width - 2, height: height - throneRoomHeight - 2 },
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
 * Large estate - multiple rooms with symmetrical layout
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
  const wallMaterial = config.wallMaterial || 'grey_stone';
  const centerX = startX + Math.floor(width / 2);
  
  // Outer walls
  drawWalls(tiles, startX, startY, width, height, wallMaterial);
  
  // Create symmetrical room layout
  // Reception hall at bottom (30%)
  // Side hallways (20% each side)
  // Throne room at top center (40%)
  // Side chambers
  
  const receptionHeight = Math.floor(height * 0.3);
  const throneRoomHeight = Math.floor(height * 0.4);
  const hallwayWidth = Math.floor(width * 0.2);
  
  // Reception/Foyer dividing wall
  const receptionY = startY + height - receptionHeight;
  for (let x = startX + 1; x < startX + width - 1; x++) {
    if (Math.abs(x - centerX) > 2) { // Leave space for double doors
      tiles[receptionY][x].biome = BiomeType.WALL;
      tiles[receptionY][x].isBlocking = true;
      applyMaterial(tiles[receptionY][x], wallMaterial);
    }
  }
  
  // Side hallway walls (vertical)
  for (let y = startY + 1; y < receptionY; y++) {
    // Left hallway wall
    tiles[y][startX + hallwayWidth].biome = BiomeType.WALL;
    tiles[y][startX + hallwayWidth].isBlocking = true;
    applyMaterial(tiles[y][startX + hallwayWidth], wallMaterial);
    
    // Right hallway wall
    tiles[y][startX + width - hallwayWidth - 1].biome = BiomeType.WALL;
    tiles[y][startX + width - hallwayWidth - 1].isBlocking = true;
    applyMaterial(tiles[y][startX + width - hallwayWidth - 1], wallMaterial);
  }
  
  // Throne room back wall
  const throneY = startY + throneRoomHeight;
  for (let x = startX + hallwayWidth + 1; x < startX + width - hallwayWidth - 1; x++) {
    if (Math.abs(x - centerX) > 1) { // Leave space for door to private chambers
      tiles[throneY][x].biome = BiomeType.WALL;
      tiles[throneY][x].isBlocking = true;
      applyMaterial(tiles[throneY][x], wallMaterial);
    }
  }
  
  // Doors
  // Main entrance
  tiles[startY + height - 1][centerX].biome = BiomeType.DOOR;
  tiles[startY + height - 1][centerX].isBlocking = false;
  
  // Reception to throne room
  tiles[receptionY][centerX].biome = BiomeType.DOOR;
  tiles[receptionY][centerX].isBlocking = false;
  
  // Hallway doors
  tiles[receptionY - 2][startX + hallwayWidth].biome = BiomeType.DOOR;
  tiles[receptionY - 2][startX + hallwayWidth].isBlocking = false;
  
  tiles[receptionY - 2][startX + width - hallwayWidth - 1].biome = BiomeType.DOOR;
  tiles[receptionY - 2][startX + width - hallwayWidth - 1].isBlocking = false;
  
  // Throne
  tiles[startY + 2][centerX].biome = BiomeType.THRONE;
  tiles[startY + 2][centerX].isBlocking = true;
  
  // Symmetrical pillars in throne room
  const throneRoomWidth = width - (2 * hallwayWidth) - 2;
  if (throneRoomWidth >= 8) {
    const pillarY = startY + Math.floor(throneRoomHeight / 2);
    placePillar(tiles, centerX - 3, pillarY, wallMaterial, config.specificYear || 1500);
    placePillar(tiles, centerX + 3, pillarY, wallMaterial, config.specificYear || 1500);
  }
  
  // Room definitions
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { 
      x: startX + hallwayWidth + 1, 
      y: startY + 1, 
      width: width - (2 * hallwayWidth) - 2, 
      height: throneRoomHeight - 1 
    },
    roomType: 'throne_room',
    accessLevel: 'restricted'
  });
  
  rooms.push({
    id: 'reception',
    name: 'Reception Hall',
    bounds: { 
      x: startX + 1, 
      y: receptionY + 1, 
      width: width - 2, 
      height: receptionHeight - 2 
    },
    roomType: 'foyer',
    accessLevel: 'public'
  });
  
  rooms.push({
    id: 'left_hallway',
    name: 'West Corridor',
    bounds: { 
      x: startX + 1, 
      y: startY + 1, 
      width: hallwayWidth - 1, 
      height: receptionY - startY - 1 
    },
    roomType: 'corridor',
    accessLevel: 'semi-public'
  });
  
  rooms.push({
    id: 'right_hallway',
    name: 'East Corridor',
    bounds: { 
      x: startX + width - hallwayWidth, 
      y: startY + 1, 
      width: hallwayWidth - 1, 
      height: receptionY - startY - 1 
    },
    roomType: 'corridor',
    accessLevel: 'semi-public'
  });
  
  exitZones.push({
    id: 'main_exit',
    location: [centerX, startY + height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
}

/**
 * XL estate - grand palace with many rooms
 */
function generateXLEstate(
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
  // Similar to large but with more rooms and detail
  generateLargeEstate(tiles, startX, startY, width, height, config, interactionZones, exitZones, rooms);
  
  // Add additional features for XL size
  const centerX = startX + Math.floor(width / 2);
  
  // Add more pillars for grandeur
  if (width >= 20) {
    for (let i = 0; i < 4; i++) {
      const pillarX = startX + 4 + (i * 4);
      if (pillarX < startX + width - 4) {
        placePillar(tiles, pillarX, startY + 6, config.wallMaterial || 'white_marble', config.specificYear || 1700);
      }
    }
  }
}

/**
 * Draw single-tile thick walls
 */
function drawWalls(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  material: MaterialType
): void {
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      // Only edges, single tile thick
      if (y === startY || y === startY + height - 1 ||
          x === startX || x === startX + width - 1) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
        applyMaterial(tiles[y][x], material);
      }
    }
  }
}

/**
 * Apply material styling to a tile
 */
function applyMaterial(tile: Tile, material: MaterialType): void {
  switch (material) {
    case 'white_marble':
      tile.structureType = 'marble';
      break;
    case 'grey_stone':
      tile.structureType = 'stone';
      break;
    case 'red_lacquer':
      tile.structureType = 'lacquered';
      break;
    case 'sandstone':
      tile.structureType = 'sandstone';
      break;
    case 'wood':
      tile.structureType = 'wooden';
      break;
    case 'steel':
      tile.structureType = 'metal';
      break;
    default:
      tile.structureType = 'stone';
  }
}

/**
 * Fill landscape border
 */
function fillLandscapeBorder(
  tiles: Tile[][],
  size: { width: number; height: number },
  borderSize: number,
  climate: string
): void {
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      // Only fill actual border area
      if (x < borderSize || x >= size.width - borderSize ||
          y < borderSize || y >= size.height - borderSize) {
        
        const tile = tiles[y][x];
        
        switch (climate) {
          case 'arid':
            tile.biome = BiomeType.DESERT;
            break;
          case 'temperate':
            tile.biome = BiomeType.GRASSLAND;
            break;
          case 'cold':
            tile.biome = BiomeType.SNOW;
            break;
          case 'tropical':
          case 'semitropical':
            tile.biome = BiomeType.JUNGLE;
            break;
          case 'ocean':
            tile.biome = BiomeType.OCEAN;
            break;
          default:
            tile.biome = BiomeType.GRASSLAND;
        }
        
        tile.isBlocking = false;
      }
    }
  }
}