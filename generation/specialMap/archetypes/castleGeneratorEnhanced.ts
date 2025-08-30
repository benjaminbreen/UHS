/**
 * generation/specialMap/archetypes/castleGeneratorEnhanced.ts
 * Enhanced castle generator with landscape integration and thick walls
 */

import { Tile, BiomeType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition, ProfessionCategory } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { generateContextualLandscape } from '../landscapeService';
import { buildThickWalls, getWallConfigForArchetype, WallMaterial } from '../wallBuilder';

export function generateEnhancedCastle(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  // Castle should be substantial but not fill the entire map
  const castleWidth = Math.floor(size.width * 0.6);
  const castleHeight = Math.floor(size.height * 0.5);
  const castleX = Math.floor((size.width - castleWidth) / 2);
  const castleY = Math.floor((size.height - castleHeight) / 2) - 4; // Position higher for defensive advantage
  
  const castleBounds = { x: castleX, y: castleY, width: castleWidth, height: castleHeight };
  
  // Generate landscape first (hills, moats, etc.)
  generateContextualLandscape(tiles, config, noise, size, castleBounds);
  
  // Get wall configuration for this castle
  const wallConfig = getWallConfigForArchetype('CASTLE', config.culturalZone, config.era);
  
  // Build the outer defensive walls (4-5 tiles thick)
  buildThickWalls(tiles, castleBounds, wallConfig, size);
  
  // Generate interior castle layout
  generateCastleInterior(tiles, castleBounds, config, noise, rooms, interactionZones, size);
  
  // Add defensive structures
  addDefensiveStructures(tiles, castleBounds, config, noise, rooms, interactionZones, size);
  
  // Create exit zones
  exitZones.push(
    { 
      id: 'main_gate', 
      location: [castleX + Math.floor(castleWidth / 2), castleY + castleHeight - 1], 
      label: 'Castle Gates', 
      destination: 'parent_map' 
    },
    { 
      id: 'sally_port', 
      location: [castleX + castleWidth - 1, castleY + Math.floor(castleHeight / 2)], 
      label: 'Sally Port', 
      destination: 'parent_map' 
    }
  );
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Generate the interior layout of the castle
 */
function generateCastleInterior(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  noise: ValueNoise,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
): void {
  
  const wallThickness = 4; // Account for thick outer walls
  const interiorX = bounds.x + wallThickness;
  const interiorY = bounds.y + wallThickness;
  const interiorWidth = bounds.width - (wallThickness * 2);
  const interiorHeight = bounds.height - (wallThickness * 2);
  
  // Clear interior to stone courtyard
  for (let y = interiorY; y < interiorY + interiorHeight; y++) {
    for (let x = interiorX; x < interiorX + interiorWidth; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }
  
  // Keep (central tower) - the most defensible part
  const keepSize = Math.min(12, Math.floor(interiorWidth * 0.4));
  const keepX = interiorX + Math.floor((interiorWidth - keepSize) / 2);
  const keepY = interiorY + 3; // Toward the back (north)
  
  generateKeep(tiles, { x: keepX, y: keepY, width: keepSize, height: keepSize }, 
               config, rooms, interactionZones, size);
  
  // Great Hall - main living/dining area
  const hallWidth = Math.floor(interiorWidth * 0.7);
  const hallHeight = 8;
  const hallX = interiorX + Math.floor((interiorWidth - hallWidth) / 2);
  const hallY = keepY + keepSize + 3;
  
  if (hallY + hallHeight < interiorY + interiorHeight) {
    generateGreatHall(tiles, { x: hallX, y: hallY, width: hallWidth, height: hallHeight }, 
                      config, rooms, interactionZones, size);
  }
  
  // Barracks - for castle garrison
  const barracksWidth = 8;
  const barracksHeight = 6;
  const barracksX = interiorX + 2;
  const barracksY = interiorY + Math.floor(interiorHeight * 0.6);
  
  if (barracksX + barracksWidth < keepX - 2) {
    generateBarracks(tiles, { x: barracksX, y: barracksY, width: barracksWidth, height: barracksHeight }, 
                     config, rooms, interactionZones, size);
  }
  
  // Stables - for horses
  const stablesWidth = 8;
  const stablesHeight = 6;
  const stablesX = interiorX + interiorWidth - stablesWidth - 2;
  const stablesY = barracksY;
  
  if (stablesX > keepX + keepSize + 2) {
    generateStables(tiles, { x: stablesX, y: stablesY, width: stablesWidth, height: stablesHeight }, 
                    config, rooms, interactionZones, size);
  }
  
  // Armory - weapons and armor storage
  const armoryWidth = 6;
  const armoryHeight = 4;
  const armoryX = interiorX + 2;
  const armoryY = interiorY + 2;
  
  generateArmory(tiles, { x: armoryX, y: armoryY, width: armoryWidth, height: armoryHeight }, 
                 config, rooms, interactionZones, size);
  
  // Chapel - for spiritual needs
  const chapelWidth = 8;
  const chapelHeight = 6;
  const chapelX = interiorX + interiorWidth - chapelWidth - 2;
  const chapelY = interiorY + 2;
  
  generateChapel(tiles, { x: chapelX, y: chapelY, width: chapelWidth, height: chapelHeight }, 
                 config, rooms, interactionZones, size);
  
  // Kitchen - food preparation
  const kitchenWidth = 10;
  const kitchenHeight = 6;
  const kitchenX = interiorX + Math.floor((interiorWidth - kitchenWidth) / 2);
  const kitchenY = interiorY + interiorHeight - kitchenHeight - 2;
  
  if (kitchenY > hallY + hallHeight + 2) {
    generateKitchen(tiles, { x: kitchenX, y: kitchenY, width: kitchenWidth, height: kitchenHeight }, 
                    config, rooms, interactionZones, size);
  }
}

/**
 * Generate the central keep (donjon)
 */
function generateKeep(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
): void {
  
  // Keep walls (2 tiles thick)
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        const isWall = (x === bounds.x || x === bounds.x + bounds.width - 1 ||
                       y === bounds.y || y === bounds.y + bounds.height - 1 ||
                       x === bounds.x + 1 || x === bounds.x + bounds.width - 2 ||
                       y === bounds.y + 1 || y === bounds.y + bounds.height - 2);
        
        if (isWall) {
          tiles[y][x].biome = BiomeType.WALL;
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_STONE;
        }
      }
    }
  }
  
  // Keep entrance
  const doorX = bounds.x + Math.floor(bounds.width / 2);
  const doorY = bounds.y + bounds.height - 1;
  if (doorX >= 0 && doorX < size.width && doorY >= 0 && doorY < size.height) {
    tiles[doorY][doorX].biome = BiomeType.FLOOR_STONE;
    tiles[doorY - 1][doorX].biome = BiomeType.FLOOR_STONE; // Clear through thick wall
  }
  
  // Lord's throne
  const throneX = bounds.x + Math.floor(bounds.width / 2);
  const throneY = bounds.y + 3;
  if (throneX >= 0 && throneX < size.width && throneY >= 0 && throneY < size.height) {
    tiles[throneY][throneX].biome = BiomeType.THRONE;
  }
  
  // Treasure chest
  const treasureX = bounds.x + bounds.width - 4;
  const treasureY = bounds.y + 2;
  if (treasureX >= 0 && treasureX < size.width && treasureY >= 0 && treasureY < size.height) {
    tiles[treasureY][treasureX].biome = BiomeType.CHEST;
  }
  
  rooms.push({
    id: 'keep',
    name: 'The Keep',
    bounds: bounds,
    description: 'The heavily fortified central tower, last refuge of the castle garrison and seat of lordly power.',
    roomType: 'throne_room',
    accessLevel: 'restricted',
    allowedSocialClasses: ['NOBILITY', 'UPPER_CLASS', 'OFFICIAL'],
    professionFilter: {
      category: [ProfessionCategory.NOBILITY, ProfessionCategory.OFFICIAL],
      whitelist: ['Lord', 'Lady', 'Knight', 'Steward', 'Captain', 'Royal Guard']
    },
    npcDensity: 'sparse'
  });
  
  interactionZones.push({
    id: 'throne',
    bounds: { x: throneX - 1, y: throneY - 1, width: 3, height: 3 },
    type: 'throne',
    interactions: ['hold_court', 'receive_petitions', 'issue_decrees']
  });
}

/**
 * Generate the great hall
 */
function generateGreatHall(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
): void {
  
  // Hall walls
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        const isWall = (x === bounds.x || x === bounds.x + bounds.width - 1 ||
                       y === bounds.y || y === bounds.y + bounds.height - 1);
        
        if (isWall) {
          tiles[y][x].biome = BiomeType.WALL;
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_WOOD; // Wooden flooring for warmth
        }
      }
    }
  }
  
  // Multiple entrances
  const mainDoorX = bounds.x + Math.floor(bounds.width / 2);
  const mainDoorY = bounds.y + bounds.height - 1;
  tiles[mainDoorY][mainDoorX].biome = BiomeType.FLOOR_WOOD;
  
  // Side door
  const sideDoorX = bounds.x;
  const sideDoorY = bounds.y + Math.floor(bounds.height / 2);
  tiles[sideDoorY][sideDoorX].biome = BiomeType.FLOOR_WOOD;
  
  // Long dining tables
  for (let i = 0; i < 3; i++) {
    const tableY = bounds.y + 2 + (i * 2);
    if (tableY + 1 < bounds.y + bounds.height - 1) {
      for (let x = bounds.x + 2; x < bounds.x + bounds.width - 2; x += 2) {
        if (x < bounds.x + bounds.width - 2) {
          tiles[tableY][x].biome = BiomeType.TABLE;
          tiles[tableY + 1][x].biome = BiomeType.BENCH;
        }
      }
    }
  }
  
  // Great fireplace
  const fireplaceX = bounds.x + Math.floor(bounds.width / 2);
  const fireplaceY = bounds.y + 1;
  tiles[fireplaceY][fireplaceX].biome = BiomeType.FIRE_PIT;
  
  rooms.push({
    id: 'great_hall',
    name: 'Great Hall',
    bounds: bounds,
    description: 'The main gathering place of the castle, where feasts are held and the household assembles.',
    roomType: 'hall',
    accessLevel: 'semi-public',
    allowedSocialClasses: ['NOBILITY', 'UPPER_CLASS', 'MIDDLE_CLASS', 'OFFICIAL'],
    npcDensity: 'normal'
  });
  
  interactionZones.push({
    id: 'feast_tables',
    bounds: { x: bounds.x + 1, y: bounds.y + 1, width: bounds.width - 2, height: bounds.height - 2 },
    type: 'dining_hall',
    interactions: ['join_feast', 'hear_news', 'meet_nobles']
  });
}

/**
 * Generate barracks for the garrison
 */
function generateBarracks(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
): void {
  
  // Basic room structure
  buildBasicRoom(tiles, bounds, BiomeType.FLOOR_WOOD, size);
  
  // Bunk beds (using BENCH as bed placeholder)
  for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x += 2) {
    tiles[bounds.y + 1][x].biome = BiomeType.BENCH;
    tiles[bounds.y + bounds.height - 2][x].biome = BiomeType.BENCH;
  }
  
  // Weapon racks
  tiles[bounds.y + Math.floor(bounds.height / 2)][bounds.x + 1].biome = BiomeType.ARMOR_STAND;
  tiles[bounds.y + Math.floor(bounds.height / 2)][bounds.x + bounds.width - 2].biome = BiomeType.WEAPON_RACK;
  
  rooms.push({
    id: 'barracks',
    name: 'Barracks',
    bounds: bounds,
    description: 'Sleeping quarters for the castle garrison, with simple beds and weapon storage.',
    roomType: 'barracks',
    accessLevel: 'restricted',
    professionFilter: {
      whitelist: ['Soldier', 'Guard', 'Man-at-Arms', 'Sergeant', 'Captain']
    },
    npcDensity: 'normal'
  });
}

/**
 * Generate stables
 */
function generateStables(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
): void {
  
  buildBasicRoom(tiles, bounds, BiomeType.FLOOR_DIRT, size);
  
  // Horse stalls
  for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x += 3) {
    // Stall dividers (using COLUMN as fence placeholder)
    if (x + 2 < bounds.x + bounds.width - 1) {
      tiles[bounds.y + 2][x + 2].biome = BiomeType.COLUMN;
      tiles[bounds.y + bounds.height - 3][x + 2].biome = BiomeType.COLUMN;
    }
    
    // Hay/feed (using TABLE as placeholder for now)
    tiles[bounds.y + 1][x].biome = BiomeType.TABLE;
    tiles[bounds.y + bounds.height - 2][x].biome = BiomeType.TABLE;
  }
  
  rooms.push({
    id: 'stables',
    name: 'Stables',
    bounds: bounds,
    description: 'Horse stables with stalls and feed storage for the castle\'s mounts.',
    roomType: 'stables',
    accessLevel: 'semi-public',
    professionFilter: {
      whitelist: ['Stable Boy', 'Groom', 'Horseman', 'Knight']
    },
    npcDensity: 'sparse'
  });
}

/**
 * Generate armory
 */
function generateArmory(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
): void {
  
  buildBasicRoom(tiles, bounds, BiomeType.FLOOR_STONE, size);
  
  // Weapon racks and armor stands
  tiles[bounds.y + 1][bounds.x + 1].biome = BiomeType.WEAPON_RACK;
  tiles[bounds.y + 1][bounds.x + bounds.width - 2].biome = BiomeType.WEAPON_RACK;
  tiles[bounds.y + bounds.height - 2][bounds.x + 1].biome = BiomeType.ARMOR_STAND;
  tiles[bounds.y + bounds.height - 2][bounds.x + bounds.width - 2].biome = BiomeType.ARMOR_STAND;
  
  // Central table for weapon maintenance
  tiles[bounds.y + Math.floor(bounds.height / 2)][bounds.x + Math.floor(bounds.width / 2)].biome = BiomeType.TABLE;
  
  rooms.push({
    id: 'armory',
    name: 'Armory',
    bounds: bounds,
    description: 'Secure storage for weapons, armor, and military equipment.',
    roomType: 'armory',
    accessLevel: 'restricted',
    professionFilter: {
      whitelist: ['Armorer', 'Blacksmith', 'Captain', 'Sergeant', 'Quartermaster']
    },
    npcDensity: 'sparse'
  });
}

/**
 * Generate chapel
 */
function generateChapel(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
): void {
  
  buildBasicRoom(tiles, bounds, BiomeType.FLOOR_MARBLE, size);
  
  // Altar at the front
  const altarX = bounds.x + Math.floor(bounds.width / 2);
  const altarY = bounds.y + 1;
  tiles[altarY][altarX].biome = BiomeType.ALTAR;
  
  // Pews
  for (let row = 0; row < 2; row++) {
    const pewY = bounds.y + 3 + row;
    for (let x = bounds.x + 2; x < bounds.x + bounds.width - 2; x += 2) {
      tiles[pewY][x].biome = BiomeType.BENCH;
    }
  }
  
  rooms.push({
    id: 'chapel',
    name: 'Castle Chapel',
    bounds: bounds,
    description: 'A small sacred space for prayer and religious ceremonies.',
    roomType: 'chapel',
    accessLevel: 'public',
    allowedSocialClasses: ['NOBILITY', 'UPPER_CLASS', 'MIDDLE_CLASS', 'LOWER_CLASS', 'CLERGY'],
    professionFilter: {
      category: [ProfessionCategory.CLERGY]
    },
    npcDensity: 'sparse'
  });
}

/**
 * Generate kitchen
 */
function generateKitchen(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
): void {
  
  buildBasicRoom(tiles, bounds, BiomeType.FLOOR_TILE, size);
  
  // Cooking hearth
  tiles[bounds.y + 1][bounds.x + Math.floor(bounds.width / 2)].biome = BiomeType.FIRE_PIT;
  
  // Prep tables and storage
  for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x += 3) {
    tiles[bounds.y + 3][x].biome = BiomeType.TABLE;
    tiles[bounds.y + bounds.height - 2][x].biome = BiomeType.CHEST; // Food storage
  }
  
  rooms.push({
    id: 'kitchen',
    name: 'Castle Kitchen',
    bounds: bounds,
    description: 'The busy kitchen where meals are prepared for the entire castle household.',
    roomType: 'kitchen',
    accessLevel: 'semi-public',
    professionFilter: {
      whitelist: ['Cook', 'Scullery Maid', 'Baker', 'Brewer', 'Kitchen Boy']
    },
    npcDensity: 'normal'
  });
}

/**
 * Helper function to build a basic room with walls and floor
 */
function buildBasicRoom(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  floorType: BiomeType,
  size: { width: number, height: number }
): void {
  
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        const isWall = (x === bounds.x || x === bounds.x + bounds.width - 1 ||
                       y === bounds.y || y === bounds.y + bounds.height - 1);
        
        if (isWall) {
          tiles[y][x].biome = BiomeType.WALL;
        } else {
          tiles[y][x].biome = floorType;
        }
      }
    }
  }
  
  // Add door
  const doorX = bounds.x + Math.floor(bounds.width / 2);
  const doorY = bounds.y + bounds.height - 1;
  if (doorX >= 0 && doorX < size.width && doorY >= 0 && doorY < size.height) {
    tiles[doorY][doorX].biome = floorType;
  }
}

/**
 * Add defensive structures like watchtowers and wall walks
 */
function addDefensiveStructures(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  noise: ValueNoise,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
): void {
  
  // Gatehouse complex
  const gatehouseWidth = 8;
  const gatehouseHeight = 6;
  const gatehouseX = bounds.x + Math.floor(bounds.width / 2) - Math.floor(gatehouseWidth / 2);
  const gatehouseY = bounds.y + bounds.height - gatehouseHeight;
  
  if (gatehouseY >= bounds.y) {
    for (let y = gatehouseY; y < gatehouseY + gatehouseHeight; y++) {
      for (let x = gatehouseX; x < gatehouseX + gatehouseWidth; x++) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          const isWall = (x === gatehouseX || x === gatehouseX + gatehouseWidth - 1 ||
                         y === gatehouseY || y === gatehouseY + gatehouseHeight - 1);
          
          if (isWall) {
            tiles[y][x].biome = BiomeType.WALL;
          } else {
            tiles[y][x].biome = BiomeType.FLOOR_STONE;
          }
        }
      }
    }
    
    // Portcullis mechanism (using CHEST as placeholder)
    tiles[gatehouseY + 2][gatehouseX + Math.floor(gatehouseWidth / 2)].biome = BiomeType.CHEST;
    
    rooms.push({
      id: 'gatehouse',
      name: 'Gatehouse',
      bounds: { x: gatehouseX, y: gatehouseY, width: gatehouseWidth, height: gatehouseHeight },
      description: 'The fortified entrance to the castle, controlling access through the main gates.',
      roomType: 'gatehouse',
      accessLevel: 'restricted',
      professionFilter: {
        whitelist: ['Guard', 'Gatekeeper', 'Captain', 'Sergeant']
      },
      npcDensity: 'normal'
    });
  }
}