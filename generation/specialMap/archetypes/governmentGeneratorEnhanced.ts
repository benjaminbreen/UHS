/**
 * generation/specialMap/archetypes/governmentGeneratorEnhanced.ts
 * Enhanced generator for realistic, multi-room government buildings
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition, ArchitecturalBiome, ProfessionCategory } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';

interface FloorPlan {
  rooms: RoomDefinition[];
  corridors: { x: number, y: number }[];
  mainChamber: RoomDefinition;
}

/**
 * Generate an enhanced government forum with realistic multi-room layout
 */
export function generateEnhancedGovernmentForum(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  // Clear all tiles to floor first
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }
  
  // Generate culture-specific layout
  if (config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    generateIroquoisLonghouse(tiles, size, config, noise, rooms, interactionZones, exitZones);
  } else if (config.culturalZone === 'MENA') {
    generateIslamicCouncilHall(tiles, size, config, noise, rooms, interactionZones, exitZones);
  } else if (config.culturalZone === 'EAST_ASIAN') {
    generateMandateHall(tiles, size, config, noise, rooms, interactionZones, exitZones);
  } else {
    // European/Generic style
    const floorPlan = generateFloorPlan(size, config, noise);
    buildExteriorWalls(tiles, size);
    buildMainEntrance(tiles, size, rooms, interactionZones);
    buildMainChamber(tiles, floorPlan.mainChamber, config);
    buildOfficeWing(tiles, size, rooms, config, noise, 'east');
    buildOfficeWing(tiles, size, rooms, config, noise, 'west');
    buildServiceRooms(tiles, size, rooms, config, noise);
    addDecorativeElements(tiles, size, config, noise);
    rooms.push(...floorPlan.rooms);
  }
  
  // Create exit zones
  exitZones.push(
    { 
      id: 'main_exit', 
      location: [Math.floor(size.width / 2), size.height - 1], 
      label: 'Main Entrance', 
      destination: 'parent_map' 
    },
    { 
      id: 'emergency_exit_west', 
      location: [1, Math.floor(size.height / 2)], 
      label: 'Emergency Exit', 
      destination: 'parent_map' 
    },
    { 
      id: 'emergency_exit_east', 
      location: [size.width - 2, Math.floor(size.height / 2)], 
      label: 'Emergency Exit', 
      destination: 'parent_map' 
    }
  );
  
  // Add interaction zones for key features
  interactionZones.push({
    id: 'speaker_podium',
    bounds: { 
      x: Math.floor(size.width / 2) - 2, 
      y: Math.floor(size.height * 0.25) - 1,
      width: 4, 
      height: 2 
    },
    type: 'podium',
    interactions: ['speak', 'address_assembly']
  });
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Generate an authentic Iroquois longhouse for confederacy meetings
 * Based on historical Haudenosaunee council house designs
 */
function generateIroquoisLonghouse(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  noise: ValueNoise,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  exitZones: ExitZone[]
) {
  // Longhouse should be oriented east-west, much longer than wide
  const longhouseLength = Math.min(size.width - 4, size.width * 0.9);
  const longhouseWidth = Math.floor(longhouseLength / 3.5); // Traditional 3.5:1 ratio
  
  const startX = Math.floor((size.width - longhouseLength) / 2);
  const startY = Math.floor((size.height - longhouseWidth) / 2);
  
  // Create natural landscape around the longhouse
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      // Create varied terrain - forest clearing with paths
      const distFromCenter = Math.sqrt(
        Math.pow(x - size.width/2, 2) + Math.pow(y - size.height/2, 2)
      );
      
      if (distFromCenter > Math.min(size.width, size.height) * 0.4) {
        // Outer forest
        if (noise.get(x * 0.1, y * 0.1) > 0.3) {
          tiles[y][x].biome = BiomeType.FOREST;
        } else {
          tiles[y][x].biome = BiomeType.GRASS;
        }
      } else {
        // Cleared area around longhouse
        tiles[y][x].biome = BiomeType.GRASS;
        
        // Add some natural paths
        if (Math.abs(y - size.height/2) < 2 || Math.abs(x - size.width/2) < 2) {
          tiles[y][x].biome = BiomeType.DIRT_PATH;
        }
      }
    }
  }
  
  // Longhouse exterior walls (bark and wood construction) - thick traditional construction
  for (let y = startY - 1; y <= startY + longhouseWidth; y++) {
    for (let x = startX - 1; x <= startX + longhouseLength; x++) {
      if (y < 0 || y >= size.height || x < 0 || x >= size.width) continue;
      
      // Create thick walls (2 tiles deep for substantial longhouse)
      const isOuterWall = (y === startY - 1 || y === startY + longhouseWidth || 
                          x === startX - 1 || x === startX + longhouseLength);
      const isInnerWall = (y === startY || y === startY + longhouseWidth - 1 || 
                          x === startX || x === startX + longhouseLength - 1);
      
      if (isOuterWall || isInnerWall) {
        // Double-thick walls for authentic longhouse construction
        tiles[y][x].biome = ArchitecturalBiome.WALL_WOOD as any || BiomeType.WALL;
      } else if (y > startY && y < startY + longhouseWidth - 1 && 
                 x > startX && x < startX + longhouseLength - 1) {
        // Interior floor
        tiles[y][x].biome = BiomeType.FLOOR_WOOD;
      }
    }
  }
  
  // Main entrance at the east end (traditionally facing east)
  const entranceX = startX + longhouseLength - 1;
  const entranceY = startY + Math.floor(longhouseWidth / 2);
  tiles[entranceY][entranceX].biome = ArchitecturalBiome.DOOR as any || BiomeType.FLOOR_WOOD;
  tiles[entranceY - 1][entranceX].biome = ArchitecturalBiome.DOOR as any || BiomeType.FLOOR_WOOD;
  tiles[entranceY + 1][entranceX].biome = ArchitecturalBiome.DOOR as any || BiomeType.FLOOR_WOOD;
  
  // Secondary entrance at west end
  const westEntranceX = startX;
  const westEntranceY = startY + Math.floor(longhouseWidth / 2);
  tiles[westEntranceY][westEntranceX].biome = ArchitecturalBiome.DOOR as any || BiomeType.FLOOR_WOOD;
  
  // Central council fire - the heart of the longhouse
  const fireX = startX + Math.floor(longhouseLength / 2);
  const fireY = startY + Math.floor(longhouseWidth / 2);
  tiles[fireY][fireX].biome = ArchitecturalBiome.FIRE_PIT as any || BiomeType.FLOOR_STONE;
  
  // Smoke hole above the fire (represented as special floor tile)
  tiles[fireY][fireX].biome = ArchitecturalBiome.FIRE_PIT as any || BiomeType.FLOOR_STONE;
  
  // Council seating arrangement - traditional clan positions
  // The Five Nations (later Six) sat in specific positions
  const seatRadius = Math.floor(longhouseWidth / 3);
  
  // Mohawk and Seneca (elder brothers) on the east
  const eastSeatingX = fireX + seatRadius;
  for (let offset = -2; offset <= 2; offset++) {
    const seatY = fireY + offset;
    if (seatY > startY && seatY < startY + longhouseWidth - 1) {
      tiles[seatY][eastSeatingX].biome = ArchitecturalBiome.BENCH as any || BiomeType.FLOOR_WOOD;
    }
  }
  
  // Oneida and Cayuga on the west
  const westSeatingX = fireX - seatRadius;
  for (let offset = -2; offset <= 2; offset++) {
    const seatY = fireY + offset;
    if (seatY > startY && seatY < startY + longhouseWidth - 1) {
      tiles[seatY][westSeatingX].biome = ArchitecturalBiome.BENCH as any || BiomeType.FLOOR_WOOD;
    }
  }
  
  // Onondaga (firekeepers) seats near the fire on both sides
  tiles[fireY - 1][fireX - 1].biome = ArchitecturalBiome.BENCH as any || BiomeType.FLOOR_WOOD;
  tiles[fireY - 1][fireX + 1].biome = ArchitecturalBiome.BENCH as any || BiomeType.FLOOR_WOOD;
  tiles[fireY + 1][fireX - 1].biome = ArchitecturalBiome.BENCH as any || BiomeType.FLOOR_WOOD;
  tiles[fireY + 1][fireX + 1].biome = ArchitecturalBiome.BENCH as any || BiomeType.FLOOR_WOOD;
  
  // Support posts along the length (traditional longhouse construction)
  const postSpacing = Math.floor(longhouseLength / 6);
  for (let i = 1; i < 6; i++) {
    const postX = startX + (i * postSpacing);
    // North side posts
    tiles[startY + 1][postX].biome = BiomeType.COLUMN;
    // South side posts
    tiles[startY + longhouseWidth - 2][postX].biome = BiomeType.COLUMN;
  }
  
  // Sacred objects area - traditionally on the north side
  const sacredX = startX + Math.floor(longhouseLength * 0.75);
  const sacredY = startY + 1;
  tiles[sacredY][sacredX].biome = ArchitecturalBiome.ALTAR as any || BiomeType.FLOOR_STONE;
  tiles[sacredY][sacredX + 1].biome = ArchitecturalBiome.TABLE as any || BiomeType.FLOOR_WOOD; // For wampum belts and sacred items
  
  // Women's area (traditionally important in Iroquois governance)
  const womensSeatingY = startY + longhouseWidth - 3;
  for (let x = startX + 3; x < startX + longhouseLength - 3; x += 3) {
    tiles[womensSeatingY][x].biome = ArchitecturalBiome.BENCH as any || BiomeType.FLOOR_WOOD;
  }
  
  // Define the main longhouse as a single room with cultural zones
  rooms.push({
    id: 'longhouse_main',
    name: 'Council Longhouse',
    bounds: { x: startX, y: startY, width: longhouseLength, height: longhouseWidth },
    description: 'The sacred council longhouse of the Haudenosaunee Confederacy, where the chiefs of the Five Nations gather to discuss matters affecting all peoples.',
    roomType: 'council_chamber',
    accessLevel: 'restricted',
    allowedSocialClasses: ['NOBILITY', 'OFFICIAL', 'ELDER'],
    professionFilter: {
      whitelist: ['Chief', 'Clan Mother', 'Elder', 'Sachem', 'War Chief', 'Peace Chief']
    },
    npcDensity: 'normal'
  });
  
  // Council fire interaction zone
  interactionZones.push({
    id: 'council_fire',
    bounds: { 
      x: fireX - 1, 
      y: fireY - 1,
      width: 3, 
      height: 3 
    },
    type: 'sacred_fire',
    interactions: ['speak_to_council', 'offer_tobacco', 'light_sacred_fire']
  });
  
  // Speaker's area (traditionally east of the fire)
  interactionZones.push({
    id: 'speakers_circle',
    bounds: { 
      x: fireX + 2, 
      y: fireY - 1,
      width: 3, 
      height: 3 
    },
    type: 'speaking_area',
    interactions: ['address_nations', 'present_proposal', 'hold_wampum']
  });
  
  // Sacred objects area
  interactionZones.push({
    id: 'sacred_area',
    bounds: { 
      x: sacredX, 
      y: sacredY,
      width: 2, 
      height: 1 
    },
    type: 'sacred_objects',
    interactions: ['view_wampum_belts', 'consult_law', 'ceremony']
  });
}

/**
 * Generate an Islamic council hall (majlis) with traditional Islamic architecture
 * Based on historical Islamic governance structures
 */
function generateIslamicCouncilHall(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  noise: ValueNoise,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  exitZones: ExitZone[]
) {
  // Central courtyard design with surrounding halls
  const courtyardSize = Math.floor(Math.min(size.width, size.height) * 0.4);
  const courtyardX = Math.floor((size.width - courtyardSize) / 2);
  const courtyardY = Math.floor((size.height - courtyardSize) / 2);
  
  // Clear to stone floor
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }
  
  // Central courtyard (open to sky)
  for (let y = courtyardY; y < courtyardY + courtyardSize; y++) {
    for (let x = courtyardX; x < courtyardX + courtyardSize; x++) {
      tiles[y][x].biome = BiomeType.GRASS;
    }
  }
  
  // Central fountain
  const fountainX = courtyardX + Math.floor(courtyardSize / 2);
  const fountainY = courtyardY + Math.floor(courtyardSize / 2);
  tiles[fountainY][fountainX].biome = ArchitecturalBiome.FOUNTAIN as any || BiomeType.WATER;
  
  // Surrounding arcades with columns
  const arcadeDepth = 4;
  
  // North arcade (main council hall)
  const hallY = courtyardY - arcadeDepth;
  const hallX = courtyardX - 2;
  const hallWidth = courtyardSize + 4;
  
  for (let y = hallY; y < courtyardY; y++) {
    for (let x = hallX; x < hallX + hallWidth; x++) {
      if (x >= 0 && x < size.width && y >= 0) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      }
    }
  }
  
  // Columns along the arcade
  for (let x = hallX + 2; x < hallX + hallWidth - 2; x += 4) {
    if (x >= 0 && x < size.width) {
      tiles[courtyardY][x].biome = BiomeType.COLUMN;
    }
  }
  
  // Mihrab (prayer niche) in the north wall
  const mihrabX = fountainX;
  const mihrabY = hallY;
  if (mihrabY >= 0) {
    tiles[mihrabY][mihrabX].biome = ArchitecturalBiome.ALTAR as any || BiomeType.FLOOR_STONE;
  }
  
  // Council seating arranged in a U-shape facing the mihrab
  for (let x = hallX + 3; x < hallX + hallWidth - 3; x += 2) {
    const seatY = hallY + 2;
    if (seatY >= 0 && x >= 0 && x < size.width) {
      tiles[seatY][x].biome = ArchitecturalBiome.CUSHION as any || BiomeType.FLOOR_MARBLE;
    }
  }
  
  // Side seating
  for (let y = hallY + 1; y < courtyardY - 1; y++) {
    const leftSeatX = hallX + 1;
    const rightSeatX = hallX + hallWidth - 2;
    if (leftSeatX >= 0 && rightSeatX < size.width && y >= 0) {
      tiles[y][leftSeatX].biome = ArchitecturalBiome.CUSHION as any || BiomeType.FLOOR_MARBLE;
      tiles[y][rightSeatX].biome = ArchitecturalBiome.CUSHION as any || BiomeType.FLOOR_MARBLE;
    }
  }
  
  // East and west side halls (smaller chambers)
  const sideHallWidth = 6;
  const sideHallHeight = 8;
  
  // East hall
  const eastHallX = courtyardX + courtyardSize + 1;
  const eastHallY = courtyardY + Math.floor((courtyardSize - sideHallHeight) / 2);
  
  if (eastHallX + sideHallWidth < size.width) {
    for (let y = eastHallY; y < eastHallY + sideHallHeight; y++) {
      for (let x = eastHallX; x < eastHallX + sideHallWidth; x++) {
        if (x < size.width && y >= 0 && y < size.height) {
          tiles[y][x].biome = BiomeType.FLOOR_TILE;
        }
      }
    }
  }
  
  // West hall
  const westHallX = courtyardX - sideHallWidth - 1;
  const westHallY = eastHallY;
  
  if (westHallX >= 0) {
    for (let y = westHallY; y < westHallY + sideHallHeight; y++) {
      for (let x = westHallX; x < westHallX + sideHallWidth; x++) {
        if (x >= 0 && y >= 0 && y < size.height) {
          tiles[y][x].biome = BiomeType.FLOOR_TILE;
        }
      }
    }
  }
  
  rooms.push({
    id: 'majlis_main',
    name: 'Council Chamber (Majlis)',
    bounds: { x: hallX, y: hallY, width: hallWidth, height: arcadeDepth },
    description: 'The main council chamber where the shura (consultation) takes place according to Islamic principles of governance.',
    roomType: 'council_chamber',
    accessLevel: 'restricted',
    allowedSocialClasses: ['NOBILITY', 'OFFICIAL', 'SCHOLAR'],
    professionFilter: {
      whitelist: ['Qadi', 'Wazir', 'Amir', 'Scholar', 'Sheikh']
    },
    npcDensity: 'normal'
  });
}

/**
 * Generate an East Asian mandate hall with traditional Chinese court architecture
 * Based on historical imperial court and local magistrate halls
 */
function generateMandateHall(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  noise: ValueNoise,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  exitZones: ExitZone[]
) {
  // Traditional Chinese hall layout - rectangular with raised platform
  const hallWidth = Math.floor(size.width * 0.8);
  const hallHeight = Math.floor(size.height * 0.7);
  const hallX = Math.floor((size.width - hallWidth) / 2);
  const hallY = Math.floor((size.height - hallHeight) / 2);
  
  // Clear to courtyard stone
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }
  
  // Main hall floor (raised platform traditionally)
  for (let y = hallY; y < hallY + hallHeight; y++) {
    for (let x = hallX; x < hallX + hallWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD; // Traditional wooden flooring
    }
  }
  
  // Exterior walls with traditional Chinese architecture
  for (let y = hallY; y < hallY + hallHeight; y++) {
    for (let x = hallX; x < hallX + hallWidth; x++) {
      if (x === hallX || x === hallX + hallWidth - 1 || 
          y === hallY || y === hallY + hallHeight - 1) {
        tiles[y][x].biome = ArchitecturalBiome.WALL_DECORATIVE as any || BiomeType.WALL;
      }
    }
  }
  
  // Main entrance (south-facing traditionally)
  const entranceX = hallX + Math.floor(hallWidth / 2);
  const entranceY = hallY + hallHeight - 1;
  for (let i = -2; i <= 2; i++) {
    tiles[entranceY][entranceX + i].biome = ArchitecturalBiome.DOOR as any || BiomeType.FLOOR_WOOD;
  }
  
  // Magistrate's throne/seat at the north end (facing south)
  const throneX = entranceX;
  const throneY = hallY + 2;
  tiles[throneY][throneX].biome = ArchitecturalBiome.THRONE as any || BiomeType.FLOOR_WOOD;
  
  // Screen behind the throne (traditional)
  tiles[throneY - 1][throneX].biome = ArchitecturalBiome.SCREEN as any || BiomeType.WALL;
  tiles[throneY - 1][throneX - 1].biome = ArchitecturalBiome.SCREEN as any || BiomeType.WALL;
  tiles[throneY - 1][throneX + 1].biome = ArchitecturalBiome.SCREEN as any || BiomeType.WALL;
  
  // Court officials' positions (east and west sides)
  const officialRowY = throneY + 3;
  
  // East side officials (civil officials)
  for (let i = 0; i < 4; i++) {
    const seatX = hallX + 2 + (i * 2);
    if (seatX < hallX + hallWidth - 2) {
      tiles[officialRowY][seatX].biome = ArchitecturalBiome.CUSHION as any || BiomeType.FLOOR_WOOD;
    }
  }
  
  // West side officials (military officials)
  for (let i = 0; i < 4; i++) {
    const seatX = hallX + hallWidth - 3 - (i * 2);
    if (seatX > hallX + 2) {
      tiles[officialRowY][seatX].biome = ArchitecturalBiome.CUSHION as any || BiomeType.FLOOR_WOOD;
    }
  }
  
  // Central aisle for petitioners
  const aisleStartY = officialRowY + 3;
  const aisleEndY = entranceY - 2;
  for (let y = aisleStartY; y < aisleEndY; y++) {
    tiles[y][entranceX].biome = BiomeType.FLOOR_MARBLE; // Polished central path
  }
  
  // Drum and gong for court proceedings
  tiles[hallY + 1][hallX + 2].biome = ArchitecturalBiome.DRUM as any || BiomeType.FLOOR_WOOD;
  tiles[hallY + 1][hallX + hallWidth - 3].biome = ArchitecturalBiome.GONG as any || BiomeType.FLOOR_WOOD;
  
  // Support columns (traditional Chinese hall construction)
  const columnSpacing = Math.floor(hallWidth / 4);
  for (let i = 1; i < 4; i++) {
    const colX = hallX + (i * columnSpacing);
    tiles[hallY + 3][colX].biome = BiomeType.COLUMN;
    tiles[hallY + hallHeight - 4][colX].biome = BiomeType.COLUMN;
  }
  
  // Side chambers for records and deliberation
  const sideRoomWidth = 4;
  const sideRoomHeight = 6;
  
  // East records room
  if (hallX + hallWidth + sideRoomWidth < size.width) {
    const recordsX = hallX + hallWidth;
    const recordsY = hallY + 2;
    
    for (let y = recordsY; y < recordsY + sideRoomHeight; y++) {
      for (let x = recordsX; x < recordsX + sideRoomWidth; x++) {
        if (x < size.width && y < hallY + hallHeight - 2) {
          tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        }
      }
    }
    
    tiles[recordsY + 2][recordsX + 1].biome = ArchitecturalBiome.FILING_CABINET as any || BiomeType.FLOOR_WOOD;
    tiles[recordsY + 2][recordsX + 2].biome = ArchitecturalBiome.TABLE as any || BiomeType.FLOOR_WOOD;
  }
  
  rooms.push({
    id: 'mandate_hall',
    name: 'Hall of Heavenly Mandate',
    bounds: { x: hallX, y: hallY, width: hallWidth, height: hallHeight },
    description: 'The formal hall where the magistrate holds court under the Mandate of Heaven, dispensing justice and managing local governance.',
    roomType: 'court_hall',
    accessLevel: 'restricted',
    allowedSocialClasses: ['NOBILITY', 'OFFICIAL', 'SCHOLAR'],
    professionFilter: {
      whitelist: ['Magistrate', 'Prefect', 'Scholar-Official', 'Military Officer', 'Court Scribe']
    },
    npcDensity: 'normal'
  });
}

/**
 * Generate a floor plan with room placement
 */
function generateFloorPlan(
  size: { width: number, height: number },
  config: SpecialMapConfig,
  noise: ValueNoise
): FloorPlan {
  const rooms: RoomDefinition[] = [];
  const corridors: { x: number, y: number }[] = [];
  
  // Main chamber - center-north, but smaller than the whole building
  const chamberWidth = Math.floor(size.width * 0.5);
  const chamberHeight = Math.floor(size.height * 0.4);
  const chamberX = Math.floor((size.width - chamberWidth) / 2);
  const chamberY = Math.floor(size.height * 0.15);
  
  const mainChamber: RoomDefinition = {
    id: 'main_chamber',
    name: 'Assembly Chamber',
    bounds: { x: chamberX, y: chamberY, width: chamberWidth, height: chamberHeight },
    description: 'The main legislative chamber',
    roomType: 'assembly',
    accessLevel: 'restricted',
    allowedSocialClasses: ['NOBILITY', 'OFFICIAL', 'SCHOLAR'],
    professionFilter: {
      category: [ProfessionCategory.NOBILITY, ProfessionCategory.OFFICIAL]
    },
    npcDensity: 'normal'
  };
  
  rooms.push(mainChamber);
  
  return { rooms, corridors, mainChamber };
}

/**
 * Build exterior walls with proper windows
 */
function buildExteriorWalls(tiles: Tile[][], size: { width: number, height: number }) {
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      // Exterior walls
      if (x === 0 || x === size.width - 1 || y === 0 || y === size.height - 1) {
        // Add windows at regular intervals
        if ((x % 4 === 2 || y % 4 === 2) && x !== 0 && y !== 0 && 
            x !== size.width - 1 && y !== size.height - 1) {
          tiles[y][x].biome = ArchitecturalBiome.WALL_WINDOW as any;
        } else {
          tiles[y][x].biome = BiomeType.WALL;
        }
      }
    }
  }
}

/**
 * Build the main entrance area with foyer, guard booths, and atrium
 */
function buildMainEntrance(
  tiles: Tile[][],
  size: { width: number, height: number },
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[]
) {
  const centerX = Math.floor(size.width / 2);
  const entranceY = size.height - 1;
  
  // Main doors (3 tiles wide)
  tiles[entranceY][centerX].biome = ArchitecturalBiome.DOOR as any;
  tiles[entranceY][centerX - 1].biome = ArchitecturalBiome.DOOR as any;
  tiles[entranceY][centerX + 1].biome = ArchitecturalBiome.DOOR as any;
  
  // Foyer area (just inside the entrance)
  const foyerDepth = 8;
  const foyerWidth = 16;
  const foyerStartX = centerX - Math.floor(foyerWidth / 2);
  
  for (let y = entranceY - foyerDepth; y < entranceY; y++) {
    for (let x = foyerStartX; x < foyerStartX + foyerWidth; x++) {
      if (x > 0 && x < size.width - 1 && y > 0) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      }
    }
  }
  
  rooms.push({
    id: 'foyer',
    name: 'Grand Foyer',
    bounds: { x: foyerStartX, y: entranceY - foyerDepth, width: foyerWidth, height: foyerDepth },
    description: 'The impressive entrance foyer',
    roomType: 'foyer',
    accessLevel: 'public',
    npcDensity: 'sparse'
  });
  
  // Guard booths flanking the entrance
  const boothSize = 3;
  
  // Left guard booth
  for (let y = entranceY - boothSize - 1; y < entranceY - 1; y++) {
    for (let x = foyerStartX - boothSize - 1; x < foyerStartX - 1; x++) {
      if (x > 0 && y > 0) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }
  tiles[entranceY - 2][foyerStartX - 1].biome = ArchitecturalBiome.GUARD_POST as any;
  
  rooms.push({
    id: 'guard_booth_left',
    name: 'Security Post',
    bounds: { x: foyerStartX - boothSize - 1, y: entranceY - boothSize - 1, width: boothSize, height: boothSize },
    description: 'Security checkpoint',
    roomType: 'guard_booth',
    accessLevel: 'restricted',
    professionFilter: {
      whitelist: ['Guard', 'Soldier', 'Security']
    },
    npcDensity: 'normal'
  });
  
  // Right guard booth
  for (let y = entranceY - boothSize - 1; y < entranceY - 1; y++) {
    for (let x = foyerStartX + foyerWidth + 1; x < foyerStartX + foyerWidth + boothSize + 1; x++) {
      if (x < size.width - 1 && y > 0) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }
  tiles[entranceY - 2][foyerStartX + foyerWidth].biome = ArchitecturalBiome.GUARD_POST as any;
  
  rooms.push({
    id: 'guard_booth_right',
    name: 'Security Post',
    bounds: { x: foyerStartX + foyerWidth + 1, y: entranceY - boothSize - 1, width: boothSize, height: boothSize },
    description: 'Security checkpoint',
    roomType: 'guard_booth',
    accessLevel: 'restricted',
    professionFilter: {
      whitelist: ['Guard', 'Soldier', 'Security']
    },
    npcDensity: 'normal'
  });
  
  // Decorative mosaic pattern in foyer center
  createMosaicPattern(tiles, centerX, entranceY - 4, 'star');
}

/**
 * Build the main assembly chamber with tiered seating
 */
function buildMainChamber(
  tiles: Tile[][],
  chamber: RoomDefinition,
  config: SpecialMapConfig
) {
  const { x: startX, y: startY, width, height } = chamber.bounds;
  
  // Chamber walls
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (y === startY || y === startY + height - 1 || 
          x === startX || x === startX + width - 1) {
        tiles[y][x].biome = BiomeType.WALL;
      }
    }
  }
  
  // Chamber doors
  tiles[startY + height - 1][startX + Math.floor(width / 2)].biome = ArchitecturalBiome.DOOR as any;
  tiles[startY + Math.floor(height / 2)][startX].biome = ArchitecturalBiome.DOOR as any;
  tiles[startY + Math.floor(height / 2)][startX + width - 1].biome = ArchitecturalBiome.DOOR as any;
  
  // Floor
  for (let y = startY + 1; y < startY + height - 1; y++) {
    for (let x = startX + 1; x < startX + width - 1; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
    }
  }
  
  // Speaker's podium at the front
  const podiumX = startX + Math.floor(width / 2);
  const podiumY = startY + 2;
  tiles[podiumY][podiumX].biome = ArchitecturalBiome.PODIUM as any;
  
  // Semicircular seating arrangement
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + 4;
  const maxRadius = Math.min(width / 2 - 2, height - 8);
  
  for (let radius = 3; radius < maxRadius; radius += 2) {
    for (let angle = 0; angle < Math.PI; angle += 0.15) {
      const seatX = Math.floor(centerX + radius * Math.cos(angle));
      const seatY = Math.floor(centerY + radius * Math.sin(angle));
      
      if (seatX > startX && seatX < startX + width - 1 && 
          seatY > startY && seatY < startY + height - 1) {
        tiles[seatY][seatX].biome = ArchitecturalBiome.BENCH as any;
      }
    }
  }
  
  // Add decorative columns
  tiles[startY + 2][startX + 3].biome = BiomeType.COLUMN;
  tiles[startY + 2][startX + width - 4].biome = BiomeType.COLUMN;
}

/**
 * Build office wings on either side of the main chamber
 */
function buildOfficeWing(
  tiles: Tile[][],
  size: { width: number, height: number },
  rooms: RoomDefinition[],
  config: SpecialMapConfig,
  noise: ValueNoise,
  side: 'east' | 'west'
) {
  const officeWidth = 5;
  const officeHeight = 4;
  const corridorWidth = 3;
  
  const wingStartX = side === 'west' ? 2 : size.width - 20;
  const wingEndX = side === 'west' ? 18 : size.width - 2;
  const wingStartY = 5;
  const wingEndY = size.height - 10;
  
  // Main corridor
  for (let y = wingStartY; y < wingEndY; y++) {
    const corridorX = side === 'west' ? wingStartX + 6 : wingEndX - 6;
    for (let x = corridorX; x < corridorX + corridorWidth; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.FLOOR_TILE;
      }
    }
  }
  
  // Generate offices along the corridor
  let officeY = wingStartY + 2;
  let officeCount = 0;
  
  while (officeY + officeHeight < wingEndY && officeCount < 6) {
    const officeX = side === 'west' ? wingStartX : wingEndX - officeWidth - 2;
    
    // Office walls
    for (let y = officeY; y < officeY + officeHeight; y++) {
      for (let x = officeX; x < officeX + officeWidth; x++) {
        if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
          if (y === officeY || y === officeY + officeHeight - 1 || 
              x === officeX || x === officeX + officeWidth - 1) {
            tiles[y][x].biome = BiomeType.WALL;
          } else {
            tiles[y][x].biome = BiomeType.FLOOR_WOOD;
          }
        }
      }
    }
    
    // Office door
    const doorX = side === 'west' ? officeX + officeWidth - 1 : officeX;
    tiles[officeY + 1][doorX].biome = ArchitecturalBiome.DOOR as any;
    
    // Office furniture
    tiles[officeY + 1][officeX + 2].biome = ArchitecturalBiome.DESK as any;
    tiles[officeY + 2][officeX + 2].biome = ArchitecturalBiome.CHAIR as any;
    tiles[officeY + 1][officeX + 1].biome = ArchitecturalBiome.FILING_CABINET as any;
    
    // Determine office type
    const officeType = officeCount < 2 ? 'senator_office' : 'clerk_office';
    const officeName = officeCount < 2 ? `Senator's Office ${officeCount + 1}` : `Clerk Office ${officeCount - 1}`;
    
    rooms.push({
      id: `office_${side}_${officeCount}`,
      name: officeName,
      bounds: { x: officeX, y: officeY, width: officeWidth, height: officeHeight },
      description: 'A government office',
      roomType: officeType,
      accessLevel: officeType === 'senator_office' ? 'restricted' : 'semi-public',
      professionFilter: {
        whitelist: officeType === 'senator_office' ? 
          ['Senator', 'Minister', 'Official'] : 
          ['Clerk', 'Scribe', 'Secretary']
      },
      npcDensity: 'sparse'
    });
    
    officeY += officeHeight + 2;
    officeCount++;
  }
}

/**
 * Build service rooms (bathrooms, kitchen, storage)
 */
function buildServiceRooms(
  tiles: Tile[][],
  size: { width: number, height: number },
  rooms: RoomDefinition[],
  config: SpecialMapConfig,
  noise: ValueNoise
) {
  // Bathrooms
  const bathroomWidth = 4;
  const bathroomHeight = 3;
  
  // West bathroom
  let bathX = 3;
  let bathY = size.height - 15;
  
  for (let y = bathY; y < bathY + bathroomHeight; y++) {
    for (let x = bathX; x < bathX + bathroomWidth; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        if (y === bathY || y === bathY + bathroomHeight - 1 || 
            x === bathX || x === bathX + bathroomWidth - 1) {
          tiles[y][x].biome = BiomeType.WALL;
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_TILE;
        }
      }
    }
  }
  
  tiles[bathY + 1][bathX + bathroomWidth - 1].biome = ArchitecturalBiome.DOOR as any;
  tiles[bathY + 1][bathX + 1].biome = ArchitecturalBiome.TOILET as any;
  tiles[bathY + 1][bathX + 2].biome = ArchitecturalBiome.BASIN as any;
  
  rooms.push({
    id: 'bathroom_west',
    name: 'Restroom',
    bounds: { x: bathX, y: bathY, width: bathroomWidth, height: bathroomHeight },
    description: 'Public restroom',
    roomType: 'bathroom',
    accessLevel: 'public',
    npcDensity: 'empty'
  });
  
  // East bathroom (similar)
  bathX = size.width - 7;
  
  for (let y = bathY; y < bathY + bathroomHeight; y++) {
    for (let x = bathX; x < bathX + bathroomWidth; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        if (y === bathY || y === bathY + bathroomHeight - 1 || 
            x === bathX || x === bathX + bathroomWidth - 1) {
          tiles[y][x].biome = BiomeType.WALL;
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_TILE;
        }
      }
    }
  }
  
  tiles[bathY + 1][bathX].biome = ArchitecturalBiome.DOOR as any;
  tiles[bathY + 1][bathX + 2].biome = ArchitecturalBiome.TOILET as any;
  tiles[bathY + 1][bathX + 1].biome = ArchitecturalBiome.BASIN as any;
  
  rooms.push({
    id: 'bathroom_east',
    name: 'Restroom',
    bounds: { x: bathX, y: bathY, width: bathroomWidth, height: bathroomHeight },
    description: 'Public restroom',
    roomType: 'bathroom',
    accessLevel: 'public',
    npcDensity: 'empty'
  });
  
  // Small kitchen/break room
  const kitchenX = Math.floor(size.width / 2) - 4;
  const kitchenY = 2;
  const kitchenWidth = 8;
  const kitchenHeight = 5;
  
  for (let y = kitchenY; y < kitchenY + kitchenHeight; y++) {
    for (let x = kitchenX; x < kitchenX + kitchenWidth; x++) {
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        if (y === kitchenY || y === kitchenY + kitchenHeight - 1 || 
            x === kitchenX || x === kitchenX + kitchenWidth - 1) {
          tiles[y][x].biome = BiomeType.WALL;
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_TILE;
        }
      }
    }
  }
  
  tiles[kitchenY + kitchenHeight - 1][kitchenX + 4].biome = ArchitecturalBiome.DOOR as any;
  tiles[kitchenY + 1][kitchenX + 1].biome = ArchitecturalBiome.KITCHEN_STOVE as any;
  tiles[kitchenY + 1][kitchenX + 2].biome = ArchitecturalBiome.KITCHEN_COUNTER as any;
  tiles[kitchenY + 1][kitchenX + 3].biome = ArchitecturalBiome.KITCHEN_SINK as any;
  tiles[kitchenY + 2][kitchenX + 5].biome = ArchitecturalBiome.TABLE as any;
  tiles[kitchenY + 2][kitchenX + 6].biome = ArchitecturalBiome.CHAIR as any;
  
  rooms.push({
    id: 'kitchen',
    name: 'Staff Kitchen',
    bounds: { x: kitchenX, y: kitchenY, width: kitchenWidth, height: kitchenHeight },
    description: 'Kitchen and break room',
    roomType: 'kitchen',
    accessLevel: 'semi-public',
    professionFilter: {
      whitelist: ['Cook', 'Servant', 'Staff']
    },
    npcDensity: 'sparse'
  });
}

/**
 * Add decorative elements like mosaics, plants, statues
 */
function addDecorativeElements(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  noise: ValueNoise
) {
  const centerX = Math.floor(size.width / 2);
  
  // Add cultural-specific mosaic patterns in key areas
  if (config.culturalZone === 'EUROPEAN' && config.era === HistoricalEra.ANTIQUITY) {
    // Roman-style geometric patterns
    createMosaicPattern(tiles, centerX, size.height - 12, 'roman');
  } else if (config.culturalZone === 'MENA') {
    // Islamic geometric patterns
    createMosaicPattern(tiles, centerX, size.height - 12, 'islamic');
  } else if (config.culturalZone === 'EAST_ASIAN') {
    // East Asian patterns
    createMosaicPattern(tiles, centerX, size.height - 12, 'eastasian');
  }
  
  // Add statues in the foyer
  tiles[size.height - 6][centerX - 6].biome = BiomeType.STATUE;
  tiles[size.height - 6][centerX + 6].biome = BiomeType.STATUE;
  
  // Add planters
  tiles[size.height - 8][centerX - 8].biome = ArchitecturalBiome.PLANTER as any;
  tiles[size.height - 8][centerX + 8].biome = ArchitecturalBiome.PLANTER as any;
}

/**
 * Create a decorative mosaic pattern
 */
function createMosaicPattern(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  style: 'star' | 'roman' | 'islamic' | 'eastasian'
) {
  const size = 5;
  
  switch (style) {
    case 'star':
      // Eight-pointed star pattern
      for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist <= size) {
            const y = centerY + dy;
            const x = centerX + dx;
            if (tiles[y] && tiles[y][x]) {
              if (dist === 0) {
                tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC_CENTER as any;
              } else if (dist <= 2) {
                tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC as any;
              } else if (dist === size) {
                tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC_BORDER as any;
              }
            }
          }
        }
      }
      break;
      
    case 'roman':
      // Roman square pattern with border
      for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
          const y = centerY + dy;
          const x = centerX + dx;
          if (tiles[y] && tiles[y][x]) {
            if (Math.abs(dx) === size || Math.abs(dy) === size) {
              tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC_BORDER as any;
            } else if ((dx + dy) % 2 === 0) {
              tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC as any;
            } else {
              tiles[y][x].biome = ArchitecturalBiome.FLOOR_PATTERN as any;
            }
          }
        }
      }
      break;
      
    case 'islamic':
      // Islamic geometric pattern
      for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
          const y = centerY + dy;
          const x = centerX + dx;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (tiles[y] && tiles[y][x] && dist <= size) {
            if (dist < 2) {
              tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC_CENTER as any;
            } else if (Math.abs(dx) === Math.abs(dy)) {
              tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC as any;
            } else if (dx === 0 || dy === 0) {
              tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC as any;
            }
          }
        }
      }
      break;
      
    case 'eastasian':
      // East Asian circular pattern
      for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
          const y = centerY + dy;
          const x = centerX + dx;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (tiles[y] && tiles[y][x]) {
            if (dist <= 1.5) {
              tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC_CENTER as any;
            } else if (dist <= 3 && dist > 2) {
              tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC as any;
            } else if (dist <= size && dist > size - 1) {
              tiles[y][x].biome = ArchitecturalBiome.FLOOR_MOSAIC_BORDER as any;
            }
          }
        }
      }
      break;
  }
}