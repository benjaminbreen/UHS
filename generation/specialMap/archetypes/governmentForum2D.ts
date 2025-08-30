/**
 * governmentForum2D.ts
 * Beautiful 2.5D government forum generator with Stardew Valley/FF6 style rendering
 * Uses the new two-tier wall system and decorative elements
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { 
  SpecialMapConfig, 
  InteractionZone, 
  ExitZone, 
  RoomDefinition, 
  ArchitecturalBiome,
  ProfessionCategory 
} from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { generateContextualLandscape } from '../landscapeService';

/**
 * Main entry point for beautiful 2.5D government forum generation
 */
export function generateGovernmentForum2D(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  // Create the main building structure
  const buildingBounds = {
    x: 4,
    y: 3,
    width: size.width - 8,
    height: size.height - 6
  };
  
  // Generate beautiful landscape around the building (gardens, paths, etc.)
  generateContextualLandscape(tiles, config, noise, size, buildingBounds);
  
  // Then, lay down beautiful flooring inside the building based on culture
  applyGovernmentFlooring(tiles, size, config);
  
  // Build the beautiful walls using our two-tier system
  buildBeautifulWalls(tiles, buildingBounds, config);
  
  // Create the main assembly hall
  const assemblyHall = createAssemblyHall(tiles, buildingBounds, config, rooms, interactionZones);
  
  // Add side chambers based on culture
  if (config.culturalZone === 'EUROPEAN') {
    createEuropeanSideRooms(tiles, buildingBounds, config, rooms);
  } else if (config.culturalZone === 'EAST_ASIAN') {
    createEastAsianSideRooms(tiles, buildingBounds, config, rooms);
  } else if (config.culturalZone === 'MENA') {
    createMENASideRooms(tiles, buildingBounds, config, rooms);
  }
  
  // Add beautiful furniture and decorations
  addGovernmentFurniture(tiles, assemblyHall, config);
  
  // Create exit zones with proper positioning
  exitZones.push(
    { 
      id: 'main_entrance', 
      location: [Math.floor(size.width / 2), buildingBounds.y + buildingBounds.height], 
      label: 'Main Entrance', 
      destination: 'parent_map' 
    }
  );
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Apply culturally appropriate flooring patterns
 */
function applyGovernmentFlooring(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig
) {
  // Start with base floor type based on culture
  let baseFloor = BiomeType.FLOOR_STONE;
  let accentFloor = BiomeType.FLOOR_MARBLE;
  
  if (config.culturalZone === 'EUROPEAN' && config.era >= 1500) {
    baseFloor = BiomeType.FLOOR_MARBLE;
    accentFloor = BiomeType.FLOOR_CHECKERED;
  } else if (config.culturalZone === 'EAST_ASIAN') {
    baseFloor = BiomeType.FLOOR_WOOD;
    accentFloor = BiomeType.FLOOR_PATTERN;
  } else if (config.culturalZone === 'MENA') {
    baseFloor = BiomeType.FLOOR_TILE;
    accentFloor = BiomeType.FLOOR_MOSAIC;
  }
  
  // Apply base flooring
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = baseFloor;
    }
  }
  
  // Add decorative floor patterns
  // Central pathway with accent tiles
  for (let y = 0; y < size.height; y++) {
    const centerX = Math.floor(size.width / 2);
    tiles[y][centerX - 1].biome = accentFloor;
    tiles[y][centerX].biome = accentFloor;
    tiles[y][centerX + 1].biome = accentFloor;
  }
  
  // Add carpet runners in key areas
  if (config.culturalZone === 'EUROPEAN' || config.culturalZone === 'MENA') {
    for (let y = 5; y < size.height - 5; y++) {
      if (y % 3 === 0) {
        for (let x = 6; x < size.width - 6; x++) {
          if (x >= size.width / 2 - 6 && x <= size.width / 2 + 6) {
            tiles[y][x].biome = BiomeType.CARPET;
          }
        }
      }
    }
  }
}

/**
 * Build beautiful walls using the two-tier system
 */
function buildBeautifulWalls(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig
) {
  const { x, y, width, height } = bounds;
  
  // Place boundary walls on all four sides
  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      // Only place walls on the edges
      if (py === y || py === y + height - 1 || px === x || px === x + width - 1) {
        // Skip corners for doors
        if ((px === x + Math.floor(width / 2) && py === y + height - 1) ||
            (px === x + Math.floor(width / 2) - 1 && py === y + height - 1) ||
            (px === x + Math.floor(width / 2) + 1 && py === y + height - 1)) {
          // Main entrance - use door
          if (px === x + Math.floor(width / 2)) {
            tiles[py][px].biome = BiomeType.DOOR;
          }
        } else {
          // Regular walls
          tiles[py][px].biome = BiomeType.WALL;
        }
      }
    }
  }
  
  // Add decorative elements to north walls
  // These will be rendered with WallSymbol2D for the dollhouse effect
  for (let px = x + 1; px < x + width - 1; px++) {
    if (px % 4 === 0) {
      // Mark some tiles for decorative elements (handled by renderer)
      tiles[y][px].hasDecoration = true;
    }
  }
}

/**
 * Create the main assembly hall
 */
function createAssemblyHall(
  tiles: Tile[][],
  buildingBounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[]
): RoomDefinition {
  
  const hallBounds = {
    x: buildingBounds.x + 4,
    y: buildingBounds.y + 2,
    width: buildingBounds.width - 8,
    height: Math.floor(buildingBounds.height * 0.6)
  };
  
  // Create raised platform/stage at the north end
  const platformY = hallBounds.y + 2;
  const platformWidth = Math.floor(hallBounds.width * 0.6);
  const platformX = hallBounds.x + Math.floor((hallBounds.width - platformWidth) / 2);
  
  // Platform flooring - use special material
  for (let py = platformY; py < platformY + 3; py++) {
    for (let px = platformX; px < platformX + platformWidth; px++) {
      tiles[py][px].biome = BiomeType.FLOOR_MARBLE;
    }
  }
  
  // Speaker's podium
  const podiumX = hallBounds.x + Math.floor(hallBounds.width / 2);
  const podiumY = platformY + 1;
  tiles[podiumY][podiumX].biome = BiomeType.PODIUM || BiomeType.ALTAR;
  
  // Throne or ceremonial chair for leader
  if (config.culturalZone === 'EUROPEAN' || config.culturalZone === 'MENA') {
    tiles[podiumY][podiumX - 2].biome = BiomeType.THRONE;
  }
  
  // Assembly seating - benches in rows
  const seatingStartY = platformY + 5;
  for (let row = 0; row < 4; row++) {
    const rowY = seatingStartY + (row * 3);
    if (rowY >= hallBounds.y + hallBounds.height - 2) break;
    
    // Left side benches
    for (let bx = hallBounds.x + 2; bx < hallBounds.x + Math.floor(hallBounds.width / 2) - 3; bx += 3) {
      tiles[rowY][bx].biome = BiomeType.BENCH;
    }
    
    // Right side benches
    for (let bx = hallBounds.x + Math.floor(hallBounds.width / 2) + 3; bx < hallBounds.x + hallBounds.width - 2; bx += 3) {
      tiles[rowY][bx].biome = BiomeType.BENCH;
    }
  }
  
  // Add columns for grandeur (European/MENA styles)
  if (config.culturalZone === 'EUROPEAN' || config.culturalZone === 'MENA') {
    for (let colY = hallBounds.y + 2; colY < hallBounds.y + hallBounds.height - 2; colY += 4) {
      // Left columns
      tiles[colY][hallBounds.x + 2].biome = BiomeType.COLUMN;
      // Right columns
      tiles[colY][hallBounds.x + hallBounds.width - 3].biome = BiomeType.COLUMN;
    }
  }
  
  // Create room definition
  const assemblyHall: RoomDefinition = {
    id: 'assembly_hall',
    name: 'Assembly Hall',
    bounds: hallBounds,
    description: 'The main hall for governmental proceedings',
    roomType: 'assembly',
    accessLevel: 'public',
    allowedSocialClasses: ['NOBILITY', 'CLERGY', 'MERCHANT', 'COMMONER'],
    professionFilter: {
      category: [ProfessionCategory.GOVERNMENT, ProfessionCategory.NOBILITY],
      whitelist: ['Governor', 'Mayor', 'Judge', 'Magistrate', 'Councilor']
    },
    npcDensity: 'normal'
  };
  
  rooms.push(assemblyHall);
  
  // Add interaction zone for podium
  interactionZones.push({
    id: 'speaker_podium',
    bounds: { 
      x: podiumX - 1, 
      y: podiumY - 1,
      width: 3, 
      height: 3 
    },
    type: 'podium',
    interactions: ['speak', 'address_assembly', 'make_declaration']
  });
  
  return assemblyHall;
}

/**
 * Create European-style side rooms (offices, archives)
 */
function createEuropeanSideRooms(
  tiles: Tile[][],
  buildingBounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[]
) {
  // West wing - Archives
  const archiveX = buildingBounds.x + 2;
  const archiveY = buildingBounds.y + buildingBounds.height - 10;
  const archiveWidth = 8;
  const archiveHeight = 8;
  
  // Archive room walls
  for (let y = archiveY; y < archiveY + archiveHeight; y++) {
    for (let x = archiveX; x < archiveX + archiveWidth; x++) {
      if (y === archiveY || y === archiveY + archiveHeight - 1 ||
          x === archiveX || x === archiveX + archiveWidth - 1) {
        // Door on the east wall
        if (x === archiveX + archiveWidth - 1 && y === archiveY + 3) {
          tiles[y][x].biome = BiomeType.DOOR;
        } else if (!(x === archiveX && (y === buildingBounds.y || y === buildingBounds.y + buildingBounds.height - 1))) {
          tiles[y][x].biome = BiomeType.WALL;
        }
      }
    }
  }
  
  // Add bookshelves
  for (let y = archiveY + 1; y < archiveY + archiveHeight - 1; y += 2) {
    tiles[y][archiveX + 1].biome = BiomeType.BOOKSHELF;
    tiles[y][archiveX + archiveWidth - 2].biome = BiomeType.BOOKSHELF;
  }
  
  // Add reading desk
  tiles[archiveY + 4][archiveX + 4].biome = BiomeType.DESK;
  tiles[archiveY + 4][archiveX + 3].biome = BiomeType.CHAIR;
  
  // East wing - Office
  const officeX = buildingBounds.x + buildingBounds.width - 10;
  const officeY = buildingBounds.y + buildingBounds.height - 10;
  
  // Office furniture
  tiles[officeY + 3][officeX + 4].biome = BiomeType.DESK;
  tiles[officeY + 3][officeX + 3].biome = BiomeType.CHAIR;
  tiles[officeY + 5][officeX + 2].biome = BiomeType.CABINET;
  
  rooms.push({
    id: 'archives',
    name: 'Archives',
    bounds: { x: archiveX, y: archiveY, width: archiveWidth, height: archiveHeight },
    description: 'Repository of governmental records',
    roomType: 'office',
    accessLevel: 'restricted',
    npcDensity: 'sparse'
  });
}

/**
 * Create East Asian-style side rooms
 */
function createEastAsianSideRooms(
  tiles: Tile[][],
  buildingBounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[]
) {
  // Tea room for informal meetings
  const teaRoomX = buildingBounds.x + 2;
  const teaRoomY = buildingBounds.y + 2;
  const teaRoomSize = 6;
  
  // Use tatami mat flooring
  for (let y = teaRoomY; y < teaRoomY + teaRoomSize; y++) {
    for (let x = teaRoomX; x < teaRoomX + teaRoomSize; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_PATTERN;
    }
  }
  
  // Low table in center
  tiles[teaRoomY + 3][teaRoomX + 3].biome = BiomeType.TABLE;
  
  // Cushions around table (use carpets as cushions)
  tiles[teaRoomY + 2][teaRoomX + 3].biome = BiomeType.CARPET;
  tiles[teaRoomY + 4][teaRoomX + 3].biome = BiomeType.CARPET;
  tiles[teaRoomY + 3][teaRoomX + 2].biome = BiomeType.CARPET;
  tiles[teaRoomY + 3][teaRoomX + 4].biome = BiomeType.CARPET;
  
  // Meditation/waiting area on the east
  const meditationX = buildingBounds.x + buildingBounds.width - 8;
  const meditationY = buildingBounds.y + 2;
  
  for (let y = meditationY; y < meditationY + 6; y++) {
    for (let x = meditationX; x < meditationX + 6; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
    }
  }
  
  // Add shrine
  tiles[meditationY + 1][meditationX + 3].biome = BiomeType.SHRINE;
}

/**
 * Create MENA-style side rooms
 */
function createMENASideRooms(
  tiles: Tile[][],
  buildingBounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[]
) {
  // Fountain courtyard
  const courtyardX = buildingBounds.x + Math.floor(buildingBounds.width / 2) - 4;
  const courtyardY = buildingBounds.y + buildingBounds.height - 8;
  
  // Central fountain
  tiles[courtyardY + 3][courtyardX + 4].biome = BiomeType.FOUNTAIN;
  
  // Decorative tile pattern around fountain
  for (let y = courtyardY + 2; y <= courtyardY + 4; y++) {
    for (let x = courtyardX + 3; x <= courtyardX + 5; x++) {
      if (!(y === courtyardY + 3 && x === courtyardX + 4)) {
        tiles[y][x].biome = BiomeType.FLOOR_MOSAIC;
      }
    }
  }
  
  // Seating areas with carpets
  tiles[courtyardY + 1][courtyardX + 1].biome = BiomeType.CARPET;
  tiles[courtyardY + 1][courtyardX + 7].biome = BiomeType.CARPET;
  tiles[courtyardY + 5][courtyardX + 1].biome = BiomeType.CARPET;
  tiles[courtyardY + 5][courtyardX + 7].biome = BiomeType.CARPET;
}

/**
 * Add furniture and decorative elements
 */
function addGovernmentFurniture(
  tiles: Tile[][],
  assemblyHall: RoomDefinition,
  config: SpecialMapConfig
) {
  const { x, y, width, height } = assemblyHall.bounds;
  
  // Add statues for grandeur
  if (config.culturalZone === 'EUROPEAN' || config.culturalZone === 'MENA') {
    // Entrance statues
    tiles[y + height - 2][x + 2].biome = BiomeType.STATUE;
    tiles[y + height - 2][x + width - 3].biome = BiomeType.STATUE;
  }
  
  // Add decorative elements based on era
  if (config.era >= 1500) {
    // More ornate decorations in later periods
    // Paintings on walls (marked for renderer)
    for (let px = x + 4; px < x + width - 4; px += 6) {
      tiles[y][px].hasDecoration = true;
    }
  }
  
  // Add torch holders or light fixtures
  if (config.era < 1800) {
    // Torches for pre-modern era
    for (let py = y + 3; py < y + height - 3; py += 5) {
      tiles[py][x + 1].hasTorch = true;
      tiles[py][x + width - 2].hasTorch = true;
    }
  }
}