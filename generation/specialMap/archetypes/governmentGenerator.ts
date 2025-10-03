/**
 * generation/specialMap/archetypes/governmentGenerator.ts
 * Generator for culturally-specific government forum special maps
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition, ProfessionCategory } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { 
  placeWallRectangle, 
  fillArea, 
  placeCulturalWallRectangle, 
  fillCulturalFloor,
  placeCulturalSymbol
} from '../mapLayoutUtils';
import { 
  generateCircularFloor, 
  generateOctagonalFloor,
  generateHexagonalFloor 
} from '../sacredShapeUtils';
import { applyCulturalFlooring } from '../culturalFlooringService';
import {
  getCulturalFurnitureSet,
  placeSeatingArrangement,
  placeCulturalLighting
} from '../culturalFurnitureSystem';
import { getCulturalGenerator } from '../culturalGeneratorRegistry';
import {
  placeContainerWithItems,
  placeChestWithItems,
  placeBarrelWithItems
} from '../storageUtilitySystem';
import { SpecialMapArchetype } from '../../../types/specialMapTypes';
import { multiTileObjectManager, MultiTileObjectManager } from '../../../services/multiTileObjectService';

// Import cultural generators to ensure they register
import '../archetypes/cultures/nativeAmericanGenerators';
import '../archetypes/cultures/asianGenerators';
import '../archetypes/cultures/africanGenerators';
import '../archetypes/cultures/middleEasternGenerators';
import '../archetypes/cultures/europeanGenerators';

// Utility function to safely set tile properties with bounds checking
function safeTileSet(tiles: Tile[][], y: number, x: number, updates: Partial<Tile>): boolean {
  if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
    Object.assign(tiles[y][x], updates);
    return true;
  }
  return false;
}

export function generateGovernmentForum(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  subtype?: 'town_hall' | 'assembly_hall' | 'administrative_complex'
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[], multiTileObjects?: any[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  console.log(`[GovernmentGenerator] Generating government forum for culture: ${config.culturalZone}, era: ${config.era}, region: ${config.region}`);
  
  // First check if there's a registered cultural generator
  const culturalGenerator = getCulturalGenerator('GOVERNMENT_FORUM', config.culturalZone);
  if (culturalGenerator) {
    console.log(`[GovernmentGenerator] Using registered cultural generator for ${config.culturalZone}`);
    culturalGenerator(tiles, size, config, interactionZones, rooms, noise);
    
    // Add standard exit zones
    const centerX = Math.floor(size.width / 2);
    exitZones.push(
      { id: 'main_exit', location: [centerX, size.height - 1], label: 'Exit Building', destination: 'parent_map' }
    );
    
    return { tiles, interactionZones, exitZones, rooms };
  }
  
  console.log(`[GovernmentGenerator] No registered generator for ${config.culturalZone}, using built-in`);
  
  // Branch based on subtype if provided
  if (subtype === 'town_hall') {
    return generateTownHall(tiles, config, noise, size, interactionZones, exitZones, rooms);
  } else if (subtype === 'assembly_hall') {
    return generateAssemblyHall(tiles, config, noise, size, interactionZones, exitZones, rooms);
  } else if (subtype === 'administrative_complex') {
    return generateAdministrativeComplex(tiles, config, noise, size, interactionZones, exitZones, rooms);
  }
  
  // Choose generation style based on culture and era
  if (config.culturalZone === 'EUROPEAN') {
    if (config.era === HistoricalEra.ANTIQUITY) {
      generateRomanSenate(tiles, config, noise, size, interactionZones, rooms);
    } else if (config.era === HistoricalEra.MEDIEVAL) {
      generateMedievalCouncilChamber(tiles, config, noise, size, interactionZones, rooms);
    } else {
      generateDefaultForum(tiles, config, noise, size, interactionZones, rooms);
    }
  } else if (config.culturalZone === 'EAST_ASIAN') {
    if (config.region === 'china') {
      generateChineseImperialCourt(tiles, config, noise, size, interactionZones, rooms);
    } else if (config.region === 'japan') {
      generateJapaneseDaimyoHall(tiles, config, noise, size, interactionZones, rooms);
    } else {
      generateAsianCouncilHall(tiles, config, noise, size, interactionZones, rooms);
    }
  } else if (config.culturalZone === 'MENA') {
    if (config.era === HistoricalEra.MEDIEVAL || config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      generateIslamicMajlis(tiles, config, noise, size, interactionZones, rooms);
    } else {
      generateModernAssembly(tiles, config, noise, size, interactionZones, rooms);
    }
  } else if (config.culturalZone === 'SUB_SAHARAN_AFRICAN') {
    generateAfricanCouncilGround(tiles, config, noise, size, interactionZones, rooms);
  } else if (config.culturalZone === 'SOUTH_ASIAN') {
    generateIndianDurbar(tiles, config, noise, size, interactionZones, rooms);
  } else if (config.culturalZone === 'SOUTH_AMERICAN') {
    generateAndeanKallanka(tiles, config, noise, size, interactionZones, rooms);
  } else if (config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || config.culturalZone === 'NORTH_AMERICAN_COLONIAL') {
    generateIndigenousCouncilGround(tiles, config, noise, size, interactionZones, rooms);
  } else {
    generateDefaultForum(tiles, config, noise, size, interactionZones, rooms);
  }
  
  // Common exit zones
  const centerX = Math.floor(size.width / 2);
  exitZones.push(
    { id: 'main_exit', location: [centerX, size.height - 1], label: 'Exit Forum', destination: 'parent_map' },
    { id: 'north_exit', location: [centerX, 0], label: 'North Gate', destination: 'parent_map' }
  );
  
  // Ensure at least one room exists for NPC generation
  if (rooms.length === 0) {
    rooms.push({
      id: 'default_forum_hall',
      name: 'Forum Hall',
      bounds: { x: 1, y: 1, width: size.width - 2, height: size.height - 2 },
      description: 'The main government assembly hall',
      roomType: 'assembly',
      accessLevel: 'public',
      npcDensity: 'normal'
    });
  }

  return { tiles, interactionZones, exitZones, rooms, multiTileObjects: multiTileObjectManager.getObjects() };
}

/**
 * Generate Roman Senate house (Curia)
 */
function generateRomanSenate(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  // Outer walls with single entrance
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Marble floor
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_MARBLE);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Raised platform at north end (tribunal)
  const platformY = 3;
  const platformWidth = size.width - 10;
  const platformHeight = 5;
  fillArea(tiles, 5, platformY, platformWidth, platformHeight, BiomeType.FLOOR_MARBLE);
  
  // Curule chairs (seats of honor) on platform
  for (let x = 8; x < size.width - 8; x += 3) {
    tiles[platformY + 2][x].overlayObject = {
      type: OverlayObjectType.THRONE,
      rotation: 180,
      variant: 'curule_chair'
    };
    tiles[platformY + 2][x].isBlocking = true;
  }
  
  // Tiered marble benches along sides
  for (let tier = 0; tier < 3; tier++) {
    const benchY = platformY + platformHeight + 3 + tier * 3;
    
    // Left side benches
    for (let y = benchY; y < benchY + 2 && y < size.height - 3; y++) {
      for (let x = 3 + tier; x < 8 + tier; x++) {
        tiles[y][x].biome = BiomeType.CHAIR;
        tiles[y][x].materialSubtype = 'marble_bench';
      }
    }
    
    // Right side benches
    for (let y = benchY; y < benchY + 2 && y < size.height - 3; y++) {
      for (let x = size.width - 8 - tier; x < size.width - 3 - tier; x++) {
        tiles[y][x].biome = BiomeType.CHAIR;
        tiles[y][x].materialSubtype = 'marble_bench';
      }
    }
  }
  
  // Central speaking area (rostra)
  const rostraY = centerY + 3;
  tiles[rostraY][centerX].biome = BiomeType.FLOOR_MARBLE;
  tiles[rostraY][centerX].materialSubtype = 'speaking_platform';
  
  // Columns along walls (culturally appropriate)
  for (let y = 10; y < size.height - 5; y += 6) {
    placeCulturalSymbol(tiles, 2, y, BiomeType.PILLAR, 
      config.culturalZone, config.era, 'corinthian');
    placeCulturalSymbol(tiles, size.width - 3, y, BiomeType.PILLAR, 
      config.culturalZone, config.era, 'corinthian');
  }
  
  // Statue of goddess or emperor
  tiles[5][centerX].biome = BiomeType.STATUE;
  tiles[5][centerX].materialSubtype = 'imperial_statue';
  
  // Altar for religious ceremonies
  tiles[platformY + 1][centerX].biome = BiomeType.ALTAR;
  
  // Room definitions with access metadata
  rooms.push({
    id: 'senate_floor',
    name: 'Senate Floor',
    bounds: { x: 10, y: centerY - 8, width: size.width - 20, height: 16 },
    description: 'The main assembly hall of the Roman Senate',
    roomType: 'assembly',
    accessLevel: 'restricted',
    allowedSocialClasses: ['PATRICIAN', 'NOBILITY', 'UPPER_CLASS'],
    professionFilter: {
      category: [ProfessionCategory.NOBILITY, ProfessionCategory.OFFICIAL],
      whitelist: ['Senator', 'Consul', 'Praetor', 'Magistrate', 'Tribune', 'Patrician']
    },
    genderRestriction: 'male', // Roman Senate was male-only
    npcDensity: 'normal'
  });
  
  rooms.push({
    id: 'tribunal',
    name: 'Tribunal Platform',
    bounds: { x: 5, y: platformY, width: platformWidth, height: platformHeight },
    description: 'The raised platform for presiding officials',
    roomType: 'throne_room',
    accessLevel: 'restricted',
    professionFilter: {
      whitelist: ['Consul', 'Praetor', 'Magistrate']
    },
    genderRestriction: 'male',
    npcDensity: 'sparse'
  });
  
  rooms.push({
    id: 'entrance_hall',
    name: 'Forum Entrance',
    bounds: { x: Math.floor(size.width / 2) - 5, y: size.height - 10, width: 10, height: 10 },
    description: 'The entrance to the Senate house',
    roomType: 'entrance',
    accessLevel: 'semi-public',
    allowedSocialClasses: ['PATRICIAN', 'CITIZEN', 'PLEBEIAN'],
    professionFilter: {
      category: [ProfessionCategory.MILITARY, ProfessionCategory.COMMONER],
      whitelist: ['Guard', 'Lictor', 'Citizen', 'Messenger']
    },
    npcDensity: 'normal'
  });
  
  // Interaction zones
  interactionZones.push({
    id: 'tribunal',
    bounds: { x: 5, y: platformY, width: platformWidth, height: platformHeight },
    type: 'council',
    interactions: ['preside', 'judge', 'decree'],
    requiredStatus: ['consul', 'praetor', 'senator']
  });
  
  interactionZones.push({
    id: 'senate_floor',
    bounds: { x: centerX - 5, y: rostraY - 2, width: 10, height: 6 },
    type: 'debate',
    interactions: ['speak', 'debate', 'vote', 'filibuster']
  });
}

/**
 * Generate Medieval council chamber
 */
function generateMedievalCouncilChamber(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Culturally appropriate walls with multiple entrances
  placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height,
    config.culturalZone, config.era, [
      { side: 'south', offset: Math.floor(size.width / 2) },
      { side: 'north', offset: Math.floor(size.width / 2) },
      { side: 'east', offset: Math.floor(size.height / 2) },
      { side: 'west', offset: Math.floor(size.height / 2) }
    ]);
  
  // Culturally appropriate floor
  fillCulturalFloor(tiles, 1, 1, size.width - 2, size.height - 2,
    config.culturalZone, config.era);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Great hall with long table
  const tableLength = Math.min(size.height - 16, 20);
  const tableY = centerY - tableLength / 2;
  
  // Long council table with bounds checking
  for (let y = Math.max(1, Math.floor(tableY)); y < Math.min(size.height - 1, Math.floor(tableY + tableLength)); y++) {
    if (y >= 0 && y < tiles.length && centerX >= 0 && centerX < tiles[0].length) {
      tiles[y][centerX].biome = BiomeType.TABLE;
      tiles[y][centerX].materialSubtype = 'oak_table';
      
      // Chairs on both sides with bounds checking
      if (centerX - 2 >= 0) tiles[y][centerX - 2].biome = BiomeType.CHAIR;
      if (centerX + 2 < tiles[0].length) tiles[y][centerX + 2].biome = BiomeType.CHAIR;
    }
  }
  
  // Lord's throne at head of table using overlay system with bounds checking
  const throneY = Math.max(1, Math.floor(tableY - 3));
  if (throneY >= 0 && throneY < tiles.length && centerX >= 0 && centerX < tiles[0].length) {
    tiles[throneY][centerX].overlayObject = {
      type: OverlayObjectType.THRONE,
      rotation: 180,
      variant: 'high_seat'
    };
    tiles[throneY][centerX].isBlocking = true;
  }
  
  // Benches along walls for petitioners with bounds checking
  for (let y = Math.max(1, 10); y < Math.min(size.height - 1, size.height - 10); y += 2) {
    if (y >= 0 && y < tiles.length) {
      if (3 >= 0 && 3 < tiles[0].length) {
        tiles[y][3].biome = BiomeType.CHAIR;
        tiles[y][3].materialSubtype = 'wooden_bench';
      }
      if (size.width - 4 >= 0 && size.width - 4 < tiles[0].length) {
        tiles[y][size.width - 4].biome = BiomeType.CHAIR;
        tiles[y][size.width - 4].materialSubtype = 'wooden_bench';
      }
    }
  }
  
  // Fireplace/hearth using overlay system with bounds checking
  if (5 >= 0 && 5 < tiles.length && centerX >= 0 && centerX < tiles[0].length) {
    tiles[5][centerX].overlayObject = {
      type: OverlayObjectType.BRAZIER,
      rotation: 0,
      variant: 'great_hearth'
    };
    tiles[5][centerX].isBlocking = true;
  }
  
  // Tapestries on walls
  for (let x = 8; x < size.width - 8; x += 8) {
    tiles[2][x].materialSubtype = 'tapestry';
    tiles[size.height - 3][x].materialSubtype = 'tapestry';
  }
  
  // Weapon racks (ceremonial) with valuable items
  placeChestWithItems(
    tiles, 5, 8,
    SpecialMapArchetype.GOVERNMENT_FORUM,
    config.culturalZone as any,
    config.era,
    'private', // Lord's hall is private
    'ornate'
  );
  placeChestWithItems(
    tiles, size.width - 6, 8,
    SpecialMapArchetype.GOVERNMENT_FORUM,
    config.culturalZone as any,
    config.era,
    'private',
    'ornate'
  );
  
  // Interaction zones
  interactionZones.push({
    id: 'high_seat',
    bounds: { x: centerX - 3, y: tableY - 4, width: 6, height: 4 },
    type: 'throne',
    interactions: ['hold_court', 'grant_audience', 'pass_judgment'],
    requiredStatus: ['lord', 'noble', 'knight']
  });
  
  interactionZones.push({
    id: 'council_table',
    bounds: { x: centerX - 4, y: tableY, width: 8, height: tableLength },
    type: 'council',
    interactions: ['discuss', 'advise', 'feast', 'plot']
  });
}

/**
 * Generate Chinese Imperial Court
 */
function generateChineseImperialCourt(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  // Outer walls with ceremonial gates
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Patterned tile floor
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_TILE);
  
  const centerX = Math.floor(size.width / 2);
  
  // Three-tiered platform for throne
  const platforms = [
    { y: 3, width: size.width - 10, height: 3 },
    { y: 6, width: size.width - 16, height: 3 },
    { y: 9, width: size.width - 22, height: 3 }
  ];
  
  platforms.forEach(platform => {
    const startX = centerX - platform.width / 2;
    fillArea(tiles, startX, platform.y, platform.width, platform.height, BiomeType.FLOOR_MARBLE);
    
    // Platform edges
    for (let x = startX; x < startX + platform.width; x++) {
      tiles[platform.y][x].materialSubtype = 'jade_inlay';
    }
  });
  
  // Dragon throne using overlay system
  tiles[10][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: 'dragon_throne'
  };
  tiles[10][centerX].isBlocking = true;
  
  // Red pillars with gold decoration
  const pillarPositions = [
    { x: 8, y: 15 }, { x: size.width - 9, y: 15 },
    { x: 8, y: 20 }, { x: size.width - 9, y: 20 },
    { x: 8, y: 25 }, { x: size.width - 9, y: 25 }
  ];
  
  pillarPositions.forEach(pos => {
    tiles[pos.y][pos.x].biome = BiomeType.PILLAR;
    tiles[pos.y][pos.x].materialSubtype = 'red_lacquer_gold';
  });
  
  // Kowtow area (where officials prostrate)
  const kowtowY = 20;
  fillArea(tiles, centerX - 8, kowtowY, 16, 6, BiomeType.FLOOR_CARPET);
  for (let y = kowtowY; y < kowtowY + 6; y++) {
    for (let x = centerX - 8; x < centerX + 8; x++) {
      tiles[y][x].materialSubtype = 'yellow_silk';
    }
  }
  
  // Official standing positions (by rank)
  // Civil officials on left, military on right
  for (let rank = 0; rank < 3; rank++) {
    const y = 18 + rank * 4;
    
    // Civil (left)
    for (let x = 5; x < 12; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_TILE;
      tiles[y][x].materialSubtype = `rank_${rank + 1}_civil`;
    }
    
    // Military (right)
    for (let x = size.width - 12; x < size.width - 5; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_TILE;
      tiles[y][x].materialSubtype = `rank_${rank + 1}_military`;
    }
  }
  
  // Incense burners using overlay system
  tiles[12][centerX - 4].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'incense_burner'
  };
  tiles[12][centerX - 4].isBlocking = true;
  tiles[12][centerX + 4].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'incense_burner'
  };
  tiles[12][centerX + 4].isBlocking = true;
  
  // Screen behind throne
  for (let x = centerX - 6; x <= centerX + 6; x++) {
    tiles[7][x].biome = BiomeType.WALL;
    tiles[7][x].materialSubtype = 'painted_screen';
  }
  
  // Interaction zones
  interactionZones.push({
    id: 'dragon_throne',
    bounds: { x: centerX - 2, y: 9, width: 4, height: 3 },
    type: 'throne',
    interactions: ['hold_court', 'issue_edict', 'grant_title'],
    requiredStatus: ['emperor', 'empress', 'regent']
  });
  
  interactionZones.push({
    id: 'kowtow_area',
    bounds: { x: centerX - 8, y: kowtowY, width: 16, height: 6 },
    type: 'ceremony',
    interactions: ['kowtow', 'present_memorial', 'receive_decree']
  });
  
  interactionZones.push({
    id: 'civil_officials',
    bounds: { x: 5, y: 18, width: 7, height: 12 },
    type: 'council',
    interactions: ['advise', 'report', 'debate_policy']
  });
}

/**
 * Generate Japanese Daimyo Hall
 */
function generateJapaneseDaimyoHall(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Minimal walls with sliding screens
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Mark walls as shoji screens
  for (let x = 0; x < size.width; x++) {
    tiles[0][x].materialSubtype = 'shoji';
    tiles[size.height - 1][x].materialSubtype = 'shoji';
  }
  for (let y = 0; y < size.height; y++) {
    tiles[y][0].materialSubtype = 'shoji';
    tiles[y][size.width - 1].materialSubtype = 'shoji';
  }
  
  // Tatami mat floor
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_WOOD);
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      tiles[y][x].materialSubtype = 'tatami';
    }
  }
  
  const centerX = Math.floor(size.width / 2);
  
  // Raised platform (tokonoma) for daimyo
  const platformY = 3;
  fillArea(tiles, centerX - 6, platformY, 12, 4, BiomeType.FLOOR_WOOD);
  for (let y = platformY; y < platformY + 4; y++) {
    for (let x = centerX - 6; x < centerX + 6; x++) {
      tiles[y][x].materialSubtype = 'polished_wood';
    }
  }
  
  // Daimyo's seat
  tiles[platformY + 2][centerX].biome = BiomeType.CHAIR;
  tiles[platformY + 2][centerX].materialSubtype = 'zabuton_cushion';
  
  // Decorative alcove with scroll
  tiles[platformY + 1][centerX - 4].biome = BiomeType.BOOKSHELF;
  tiles[platformY + 1][centerX - 4].materialSubtype = 'scroll_alcove';
  
  // Weapon stand
  // Place ornate chest with valuable government documents
  placeChestWithItems(
    tiles, centerX + 4, platformY + 1,
    SpecialMapArchetype.GOVERNMENT_FORUM,
    config.culturalZone as any,
    config.era,
    'restricted', // Very restricted area
    'ornate'
  );
  tiles[platformY + 1][centerX + 4].materialSubtype = 'katana_stand';
  
  // Seating areas for retainers (in order of rank)
  const retainerPositions = [
    { x: centerX - 8, y: 12, rank: 'high' },
    { x: centerX + 8, y: 12, rank: 'high' },
    { x: centerX - 8, y: 16, rank: 'mid' },
    { x: centerX + 8, y: 16, rank: 'mid' },
    { x: centerX - 8, y: 20, rank: 'low' },
    { x: centerX + 8, y: 20, rank: 'low' }
  ];
  
  retainerPositions.forEach(pos => {
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        tiles[pos.y + dy][pos.x + dx].biome = BiomeType.CHAIR;
        tiles[pos.y + dy][pos.x + dx].materialSubtype = 'seiza_position';
      }
    }
  });
  
  // Tea preparation area
  tiles[size.height - 5][5].biome = BiomeType.TABLE;
  tiles[size.height - 5][5].materialSubtype = 'tea_table';
  tiles[size.height - 5][6].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'tea_brazier'
  };
  tiles[size.height - 5][6].isBlocking = true;
  
  // Garden view (marked area)
  for (let x = 10; x < size.width - 10; x++) {
    tiles[1][x].materialSubtype = 'garden_view';
  }
  
  // Interaction zones
  interactionZones.push({
    id: 'daimyo_seat',
    bounds: { x: centerX - 6, y: platformY, width: 12, height: 4 },
    type: 'throne',
    interactions: ['hold_court', 'grant_fief', 'declare_war', 'tea_ceremony'],
    requiredStatus: ['daimyo', 'shogun', 'samurai']
  });
  
  interactionZones.push({
    id: 'retainer_area',
    bounds: { x: centerX - 10, y: 10, width: 20, height: 14 },
    type: 'council',
    interactions: ['advise', 'report', 'swear_loyalty', 'seppuku']
  });
}

/**
 * Generate Islamic Majlis (council)
 */
function generateIslamicMajlis(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Ornate walls with arched doorways
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'north', offset: Math.floor(size.width / 2) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  // Geometric patterned tile floor
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_TILE);
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      tiles[y][x].materialSubtype = 'geometric_pattern';
    }
  }
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Central courtyard with fountain
  const courtyardSize = 10;
  const courtX = centerX - courtyardSize / 2;
  const courtY = centerY - courtyardSize / 2;
  
  // Courtyard floor
  fillArea(tiles, courtX, courtY, courtyardSize, courtyardSize, BiomeType.PLAZA);
  
  // Central fountain
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles[centerY + dy][centerX + dx].biome = BiomeType.WATER;
    }
  }
  tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
  tiles[centerY][centerX].materialSubtype = 'octagonal_fountain';
  
  // Covered arcades around courtyard
  const arcadePositions = [
    { x: courtX - 2, y: courtY, width: 2, height: courtyardSize },
    { x: courtX + courtyardSize, y: courtY, width: 2, height: courtyardSize },
    { x: courtX, y: courtY - 2, width: courtyardSize, height: 2 },
    { x: courtX, y: courtY + courtyardSize, width: courtyardSize, height: 2 }
  ];
  
  arcadePositions.forEach(arcade => {
    for (let y = arcade.y; y < arcade.y + arcade.height; y++) {
      for (let x = arcade.x; x < arcade.x + arcade.width; x++) {
        if (y % 3 === 0 || x % 3 === 0) {
          tiles[y][x].biome = BiomeType.PILLAR;
          tiles[y][x].materialSubtype = 'horseshoe_arch';
        }
      }
    }
  });
  
  // Majlis seating areas (cushions around walls)
  // North side - place of honor
  for (let x = 5; x < size.width - 5; x++) {
    tiles[3][x].biome = BiomeType.CARPET;
    tiles[3][x].materialSubtype = 'silk_cushions';
    tiles[4][x].biome = BiomeType.CARPET;
    tiles[4][x].materialSubtype = 'persian_rug';
  }
  
  // Side seating
  for (let y = 8; y < size.height - 8; y++) {
    tiles[y][3].biome = BiomeType.CARPET;
    tiles[y][3].materialSubtype = 'floor_cushions';
    tiles[y][size.width - 4].biome = BiomeType.CARPET;
    tiles[y][size.width - 4].materialSubtype = 'floor_cushions';
  }
  
  // Caliph/Sultan's seat using overlay system
  tiles[3][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: 'cushioned_throne'
  };
  tiles[3][centerX].isBlocking = true;
  
  // Braziers for incense using overlay system
  tiles[6][8].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'incense_brazier'
  };
  tiles[6][8].isBlocking = true;
  tiles[6][size.width - 9].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'incense_brazier'
  };
  tiles[6][size.width - 9].isBlocking = true;
  
  // Scribes' desks
  tiles[8][5].biome = BiomeType.DESK;
  tiles[8][5].materialSubtype = 'scribe_desk';
  tiles[8][size.width - 6].biome = BiomeType.DESK;
  tiles[8][size.width - 6].materialSubtype = 'scribe_desk';
  
  // Interaction zones
  interactionZones.push({
    id: 'ruler_divan',
    bounds: { x: centerX - 4, y: 2, width: 8, height: 4 },
    type: 'throne',
    interactions: ['hold_court', 'issue_fatwa', 'grant_waqf', 'receive_ambassador'],
    requiredStatus: ['caliph', 'sultan', 'emir', 'vizier']
  });
  
  interactionZones.push({
    id: 'courtyard_majlis',
    bounds: { x: courtX, y: courtY, width: courtyardSize, height: courtyardSize },
    type: 'gathering',
    interactions: ['discuss', 'poetry_recital', 'theological_debate', 'negotiate']
  });
}

/**
 * Generate African Council Ground
 */
function generateAfricanCouncilGround(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Open-air meeting ground with minimal walls
  // Only ceremonial entrance markers
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Earth floor
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.DIRT);
  
  // Central speaking circle
  const circleRadius = 12;
  for (let y = centerY - circleRadius; y <= centerY + circleRadius; y++) {
    for (let x = centerX - circleRadius; x <= centerX + circleRadius; x++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (dist <= circleRadius && dist >= circleRadius - 1) {
        // Circle boundary stones
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
        tiles[y][x].materialSubtype = 'boundary_stone';
      } else if (dist < circleRadius - 1) {
        // Packed earth in circle
        tiles[y][x].biome = BiomeType.PLAZA;
        tiles[y][x].materialSubtype = 'packed_earth';
      }
    }
  }
  
  // Central fire pit using overlay system
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'fire_pit'
  };
  tiles[centerY][centerX].isBlocking = true;
  
  // Elder's seats (carved stools) in inner circle
  const elderPositions = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.floor(centerX + Math.cos(angle) * 6);
    const y = Math.floor(centerY + Math.sin(angle) * 6);
    tiles[y][x].biome = BiomeType.CHAIR;
    tiles[y][x].materialSubtype = 'carved_stool';
    elderPositions.push({ x, y });
  }
  
  // Chief's seat (elevated) using overlay system
  tiles[centerY - 8][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: 'leopard_skin_throne'
  };
  tiles[centerY - 8][centerX].isBlocking = true;
  
  // Speaking staff location
  // Central chest with important documents
  placeChestWithItems(
    tiles, centerX, centerY + 2,
    SpecialMapArchetype.GOVERNMENT_FORUM,
    config.culturalZone as any,
    config.era,
    'restricted',
    'reinforced'
  );
  tiles[centerY + 2][centerX].materialSubtype = 'speaking_staff_holder';
  
  // Shade trees (represented as pillars with canopy note)
  const treePositions = [
    { x: 5, y: 5 }, { x: size.width - 6, y: 5 },
    { x: 5, y: size.height - 6 }, { x: size.width - 6, y: size.height - 6 }
  ];
  
  treePositions.forEach(pos => {
    tiles[pos.y][pos.x].biome = BiomeType.TREE;
    tiles[pos.y][pos.x].materialSubtype = 'acacia_shade';
  });
  
  // Drum circle area
  const drumX = size.width - 10;
  const drumY = centerY;
  for (let i = 0; i < 3; i++) {
    // Place barrel with supplies
    placeBarrelWithItems(
      tiles, drumX + i, drumY,
      SpecialMapArchetype.TRIBAL_COUNCIL,
      config.culturalZone as any,
      config.era,
      'council_chamber'
    );
    tiles[drumY][drumX + i].materialSubtype = 'ceremonial_drum';
  }
  
  // Entrance totems
  tiles[size.height - 2][centerX - 2].biome = BiomeType.STATUE;
  tiles[size.height - 2][centerX - 2].materialSubtype = 'ancestor_totem';
  tiles[size.height - 2][centerX + 2].biome = BiomeType.STATUE;
  tiles[size.height - 2][centerX + 2].materialSubtype = 'ancestor_totem';
  
  // Interaction zones
  interactionZones.push({
    id: 'chief_seat',
    bounds: { x: centerX - 2, y: centerY - 9, width: 4, height: 3 },
    type: 'throne',
    interactions: ['speak_first', 'pass_judgment', 'declare_decision', 'invoke_ancestors'],
    requiredStatus: ['chief', 'elder', 'griot']
  });
  
  interactionZones.push({
    id: 'elder_circle',
    bounds: { x: centerX - 8, y: centerY - 8, width: 16, height: 16 },
    type: 'council',
    interactions: ['speak_with_staff', 'share_wisdom', 'tell_history', 'consensus_building']
  });
  
  interactionZones.push({
    id: 'drum_circle',
    bounds: { x: drumX - 1, y: drumY - 2, width: 5, height: 4 },
    type: 'ceremony',
    interactions: ['call_to_meeting', 'celebration', 'send_message']
  });
}

/**
 * Generate Indian Durbar Hall
 */
function generateIndianDurbar(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Ornate walls with multiple arched entrances
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'south', offset: Math.floor(size.width / 4) },
    { side: 'south', offset: Math.floor(3 * size.width / 4) }
  ]);
  
  // Marble floor with inlay
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_MARBLE);
  
  const centerX = Math.floor(size.width / 2);
  
  // Raised platform with canopy (shamiana)
  const platformY = 4;
  const platformWidth = 16;
  const platformHeight = 6;
  const platformX = centerX - platformWidth / 2;
  
  fillArea(tiles, platformX, platformY, platformWidth, platformHeight, BiomeType.FLOOR_MARBLE);
  for (let y = platformY; y < platformY + platformHeight; y++) {
    for (let x = platformX; x < platformX + platformWidth; x++) {
      tiles[y][x].materialSubtype = 'marble_inlay';
    }
  }
  
  // Peacock throne or gaddi using overlay system
  tiles[platformY + 2][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN ? 'peacock_throne' : 'gaddi'
  };
  tiles[platformY + 2][centerX].isBlocking = true;
  if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    tiles[platformY + 2][centerX].materialSubtype = 'peacock_throne';
  } else {
    tiles[platformY + 2][centerX].materialSubtype = 'rajasthani_gaddi';
  }
  
  // Pillars with intricate carvings
  const pillarPattern = [
    { x: 6, y: 12 }, { x: size.width - 7, y: 12 },
    { x: 6, y: 18 }, { x: size.width - 7, y: 18 },
    { x: 6, y: 24 }, { x: size.width - 7, y: 24 }
  ];
  
  pillarPattern.forEach(pos => {
    tiles[pos.y][pos.x].biome = BiomeType.PILLAR;
    tiles[pos.y][pos.x].materialSubtype = 'carved_sandstone';
  });
  
  // Carpet runners
  for (let y = platformY + platformHeight + 2; y < size.height - 2; y++) {
    tiles[y][centerX].biome = BiomeType.CARPET;
    tiles[y][centerX].materialSubtype = 'kashmiri_carpet';
    tiles[y][centerX - 1].biome = BiomeType.CARPET;
    tiles[y][centerX - 1].materialSubtype = 'kashmiri_carpet';
    tiles[y][centerX + 1].biome = BiomeType.CARPET;
    tiles[y][centerX + 1].materialSubtype = 'kashmiri_carpet';
  }
  
  // Seating for nobles (cushioned areas)
  const nobleSeating = [
    { x: 8, y: 14, rank: 'high' },
    { x: size.width - 12, y: 14, rank: 'high' },
    { x: 8, y: 20, rank: 'mid' },
    { x: size.width - 12, y: 20, rank: 'mid' }
  ];
  
  nobleSeating.forEach(seat => {
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 4; dx++) {
        tiles[seat.y + dy][seat.x + dx].biome = BiomeType.CARPET;
        tiles[seat.y + dy][seat.x + dx].materialSubtype = `silk_cushion_${seat.rank}`;
      }
    }
  });
  
  // Incense holders using overlay system
  tiles[platformY + 1][platformX - 1].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'silver_incense'
  };
  tiles[platformY + 1][platformX - 1].isBlocking = true;
  tiles[platformY + 1][platformX + platformWidth].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'silver_incense'
  };
  tiles[platformY + 1][platformX + platformWidth].isBlocking = true;
  
  // Weapon display (ceremonial) with valuable items
  placeContainerWithItems(
    tiles, 3, 8,
    OverlayObjectType.WEAPON_RACK,
    SpecialMapArchetype.ADMINISTRATIVE_COMPLEX,
    config.culturalZone as any,
    config.era,
    'office',
    'private',
    'oak'
  );
  placeContainerWithItems(
    tiles, size.width - 4, 8,
    OverlayObjectType.WEAPON_RACK,
    SpecialMapArchetype.ADMINISTRATIVE_COMPLEX,
    config.culturalZone as any,
    config.era,
    'office',
    'private',
    'oak'
  );
  
  // Interaction zones
  interactionZones.push({
    id: 'throne_platform',
    bounds: { x: platformX, y: platformY, width: platformWidth, height: platformHeight },
    type: 'throne',
    interactions: ['hold_durbar', 'grant_mansab', 'receive_tribute', 'issue_farman'],
    requiredStatus: ['maharaja', 'nawab', 'raja', 'sultan']
  });
  
  interactionZones.push({
    id: 'noble_assembly',
    bounds: { x: 6, y: 12, width: size.width - 12, height: 16 },
    type: 'council',
    interactions: ['present_nazrana', 'receive_khilat', 'petition', 'swear_allegiance']
  });
}

/**
 * Generate Modern Assembly/Parliament
 */
function generateModernAssembly(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Modern walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'north', offset: Math.floor(size.width / 2) }
  ]);
  
  // Modern flooring
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_TILE);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Hemicycle seating arrangement
  for (let tier = 0; tier < 6; tier++) {
    const radius = 8 + tier * 3;
    for (let angle = 0; angle <= Math.PI; angle += 0.15) {
      const x = Math.floor(centerX + Math.cos(angle) * radius);
      const y = Math.floor(centerY + 5 - Math.sin(angle) * radius);
      if (y > 0 && y < size.height - 1 && x > 0 && x < size.width - 1) {
        tiles[y][x].biome = BiomeType.CHAIR;
        tiles[y][x].materialSubtype = 'modern_seat';
        
        // Desk in front of seat
        if (y + 1 < size.height - 1) {
          tiles[y + 1][x].biome = BiomeType.DESK;
          tiles[y + 1][x].materialSubtype = 'delegate_desk';
        }
      }
    }
  }
  
  // Speaker's podium
  tiles[centerY + 3][centerX].biome = BiomeType.DESK;
  tiles[centerY + 3][centerX].materialSubtype = 'speaker_podium';
  tiles[centerY + 2][centerX].biome = BiomeType.CHAIR;
  tiles[centerY + 2][centerX].materialSubtype = 'speaker_chair';
  
  // Press gallery
  for (let x = 5; x < size.width - 5; x++) {
    tiles[3][x].biome = BiomeType.CHAIR;
    tiles[3][x].materialSubtype = 'press_seat';
  }
  
  // Interaction zones
  interactionZones.push({
    id: 'speaker_podium',
    bounds: { x: centerX - 3, y: centerY, width: 6, height: 5 },
    type: 'podium',
    interactions: ['address_assembly', 'call_to_order', 'recognize_speaker']
  });
  
  interactionZones.push({
    id: 'assembly_floor',
    bounds: { x: 3, y: 8, width: size.width - 6, height: size.height - 12 },
    type: 'parliament',
    interactions: ['debate', 'vote', 'filibuster', 'propose_bill']
  });
}

/**
 * Generate Asian Council Hall (generic)
 */
function generateAsianCouncilHall(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Simple layout with hierarchical seating
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_WOOD);
  
  const centerX = Math.floor(size.width / 2);
  
  // Raised platform for leaders
  fillArea(tiles, centerX - 8, 3, 16, 4, BiomeType.FLOOR_WOOD);
  tiles[5][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: 'presidential'
  };
  tiles[5][centerX].isBlocking = true;
  
  // Floor seating in rows
  for (let y = 10; y < size.height - 5; y += 3) {
    for (let x = 5; x < size.width - 5; x += 3) {
      tiles[y][x].biome = BiomeType.CHAIR;
      tiles[y][x].materialSubtype = 'floor_cushion';
    }
  }
  
  interactionZones.push({
    id: 'council_hall',
    bounds: { x: 3, y: 3, width: size.width - 6, height: size.height - 6 },
    type: 'council',
    interactions: ['discuss', 'report', 'decide']
  });
}

/**
 * Generate Renaissance Parliament
 */
function generateRenaissanceParliament(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Elaborate walls with columns
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'north', offset: Math.floor(size.width / 2) }
  ]);
  
  // Marble floor
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_MARBLE);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Two opposing sets of tiered benches (like British Parliament)
  const benchWidth = 8;
  const benchLength = size.height - 20;
  const leftBenchX = centerX - 12;
  const rightBenchX = centerX + 4;
  const benchStartY = 10;
  
  // Left benches (government)
  for (let tier = 0; tier < 3; tier++) {
    for (let y = benchStartY; y < benchStartY + benchLength; y++) {
      for (let x = leftBenchX + tier * 2; x < leftBenchX + tier * 2 + 2; x++) {
        tiles[y][x].biome = BiomeType.CHAIR;
        tiles[y][x].materialSubtype = 'green_bench';
      }
    }
  }
  
  // Right benches (opposition)
  for (let tier = 0; tier < 3; tier++) {
    for (let y = benchStartY; y < benchStartY + benchLength; y++) {
      for (let x = rightBenchX + benchWidth - tier * 2 - 2; x < rightBenchX + benchWidth - tier * 2; x++) {
        tiles[y][x].biome = BiomeType.CHAIR;
        tiles[y][x].materialSubtype = 'red_bench';
      }
    }
  }
  
  // Speaker's chair using overlay system
  tiles[5][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: 'speaker_chair'
  };
  tiles[5][centerX].isBlocking = true;
  
  // Mace table (symbol of authority)
  tiles[8][centerX].biome = BiomeType.TABLE;
  tiles[8][centerX].materialSubtype = 'mace_table';
  
  // Columns
  for (let y = 8; y < size.height - 8; y += 8) {
    tiles[y][3].biome = BiomeType.PILLAR;
    tiles[y][3].materialSubtype = 'ionic';
    tiles[y][size.width - 4].biome = BiomeType.PILLAR;
    tiles[y][size.width - 4].materialSubtype = 'ionic';
  }
  
  // Interaction zones
  interactionZones.push({
    id: 'speaker_chair',
    bounds: { x: centerX - 2, y: 4, width: 4, height: 4 },
    type: 'speaker',
    interactions: ['moderate_debate', 'call_order', 'recognize_member'],
    requiredStatus: ['speaker', 'deputy_speaker']
  });
  
  interactionZones.push({
    id: 'government_benches',
    bounds: { x: leftBenchX, y: benchStartY, width: 6, height: benchLength },
    type: 'parliament',
    interactions: ['propose_legislation', 'defend_policy', 'question_time']
  });
  
  interactionZones.push({
    id: 'opposition_benches',
    bounds: { x: rightBenchX, y: benchStartY, width: 6, height: benchLength },
    type: 'parliament',
    interactions: ['oppose_motion', 'scrutinize', 'no_confidence']
  });
}

/**
 * Generate Modern Parliament (US Congress/modern style)
 */
function generateModernParliament(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'north', offset: Math.floor(size.width / 2) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_MARBLE);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Semicircular seating (like US House)
  for (let row = 0; row < 8; row++) {
    const radius = 10 + row * 2;
    const seatsInRow = Math.floor(Math.PI * radius / 2);
    
    for (let i = 0; i < seatsInRow; i++) {
      const angle = (i / seatsInRow) * Math.PI;
      const x = Math.floor(centerX + Math.cos(angle) * radius);
      const y = Math.floor(centerY + 8 - Math.sin(angle) * radius);
      
      if (y > 5 && y < size.height - 3 && x > 2 && x < size.width - 3) {
        tiles[y][x].biome = BiomeType.CHAIR;
        tiles[y][x].materialSubtype = 'legislative_seat';
        
        // Desk attached
        if (y + 1 < size.height - 2) {
          tiles[y + 1][x].biome = BiomeType.DESK;
          tiles[y + 1][x].materialSubtype = 'legislative_desk';
        }
      }
    }
  }
  
  // Speaker's rostrum
  tiles[centerY + 6][centerX].biome = BiomeType.DESK;
  tiles[centerY + 6][centerX].materialSubtype = 'speaker_rostrum';
  tiles[centerY + 5][centerX - 1].biome = BiomeType.CHAIR;
  tiles[centerY + 5][centerX].biome = BiomeType.CHAIR;
  tiles[centerY + 5][centerX + 1].biome = BiomeType.CHAIR;
  
  // Gallery
  for (let x = 8; x < size.width - 8; x++) {
    tiles[3][x].biome = BiomeType.CHAIR;
    tiles[3][x].materialSubtype = 'gallery_seat';
  }
  
  // Flag positions
  tiles[centerY + 4][centerX - 5].biome = BiomeType.STATUE;
  tiles[centerY + 4][centerX - 5].materialSubtype = 'flag_stand';
  tiles[centerY + 4][centerX + 5].biome = BiomeType.STATUE;
  tiles[centerY + 4][centerX + 5].materialSubtype = 'flag_stand';
  
  interactionZones.push({
    id: 'house_floor',
    bounds: { x: 5, y: 10, width: size.width - 10, height: size.height - 15 },
    type: 'legislature',
    interactions: ['introduce_bill', 'debate', 'vote', 'yield_time']
  });
  
  interactionZones.push({
    id: 'speaker_rostrum',
    bounds: { x: centerX - 3, y: centerY + 4, width: 6, height: 4 },
    type: 'speaker',
    interactions: ['gavel', 'recognize', 'rule_on_point']
  });
}

/**
 * Default forum generation with cultural layout patterns
 */
function generateDefaultForum(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Choose layout pattern based on culture
  let layoutPattern: 'circular' | 'rectangular' | 'octagonal' | 'hexagonal' = 'rectangular';
  
  if (config.culturalZone === 'MENA' || config.culturalZone === 'SUB_SAHARAN_AFRICAN') {
    layoutPattern = 'circular'; // Circular councils common in these cultures
  } else if (config.culturalZone === 'EAST_ASIAN' && config.era !== HistoricalEra.MODERN_ERA) {
    layoutPattern = 'octagonal'; // Bagua/octagonal influence
  } else if (config.culturalZone === 'SOUTH_ASIAN') {
    layoutPattern = 'hexagonal'; // Mandala-inspired
  }
  
  // Apply the chosen layout pattern
  if (layoutPattern === 'circular') {
    // Circular walls and floor
    placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height, 
      config.culturalZone, config.era, [
        { side: 'south', offset: centerX }
      ]);
    
    // Create circular floor pattern
    const radius = Math.min(size.width, size.height) / 2 - 3;
    generateCircularFloor(tiles, centerX, centerY, radius);
    
    // Apply cultural floor material to the circular area
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        if (tiles[y][x].biome === BiomeType.FLOOR_STONE) {
          fillCulturalFloor(tiles, x, y, 1, 1, config.culturalZone, config.era);
        }
      }
    }
    
    // Circular seating arrangement
    for (let tier = 1; tier <= 3; tier++) {
      const seatRadius = radius - tier * 3;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
        const x = Math.floor(centerX + Math.cos(angle) * seatRadius);
        const y = Math.floor(centerY + Math.sin(angle) * seatRadius);
        if (y > 0 && y < size.height - 1 && x > 0 && x < size.width - 1) {
          tiles[y][x].biome = BiomeType.CHAIR;
        }
      }
    }
  } else if (layoutPattern === 'octagonal') {
    // Octagonal layout
    placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height, 
      config.culturalZone, config.era, [
        { side: 'south', offset: centerX }
      ]);
    
    const radius = Math.min(size.width, size.height) / 2 - 3;
    generateOctagonalFloor(tiles, centerX, centerY, radius);
    
    // Apply cultural floor material
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        if (tiles[y][x].biome === BiomeType.FLOOR_TILE) {
          fillCulturalFloor(tiles, x, y, 1, 1, config.culturalZone, config.era);
        }
      }
    }
  } else if (layoutPattern === 'hexagonal') {
    // Hexagonal layout
    placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height, 
      config.culturalZone, config.era, [
        { side: 'south', offset: centerX }
      ]);
    
    const radius = Math.min(size.width, size.height) / 2 - 3;
    generateHexagonalFloor(tiles, centerX, centerY, radius);
    
    // Apply cultural floor material
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        if (tiles[y][x].biome === BiomeType.FLOOR_PATTERN) {
          fillCulturalFloor(tiles, x, y, 1, 1, config.culturalZone, config.era);
        }
      }
    }
  } else {
    // Default rectangular layout
    placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height, 
      config.culturalZone, config.era, [
        { side: 'south', offset: centerX }
      ]);
    
    fillCulturalFloor(tiles, 1, 1, size.width - 2, size.height - 2, 
      config.culturalZone, config.era);
    
    // Traditional amphitheater seating
    for (let tier = 1; tier <= 3; tier++) {
      const radius = 8 + tier * 3;
      for (let angle = 0; angle <= Math.PI; angle += 0.1) {
        const x = Math.floor(centerX + Math.cos(angle) * radius);
        const y = Math.floor(centerY - Math.sin(angle) * radius);
        if (y > 0 && y < size.height - 1 && x > 0 && x < size.width - 1) {
          tiles[y][x].biome = BiomeType.CHAIR;
        }
      }
    }
  }
  
  // Apply cultural flooring patterns to the central area
  applyCulturalFlooring(
    tiles,
    { x: centerX - 5, y: centerY - 5, width: 10, height: 10 },
    config,
    noise,
    'ceremonial'
  );
  
  // Central feature - culturally appropriate
  if (config.culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || 
      config.culturalZone === 'NATIVE_AMERICAN') {
    // Central sacred fire instead of speaking platform
    tiles[centerY][centerX].biome = BiomeType.FIRE_PIT;
    tiles[centerY][centerX].materialSubtype = 'sacred_fire';
  } else {
    // Default speaking area
    tiles[centerY][centerX].biome = BiomeType.FLOOR_MARBLE;
  }
  
  // Add culturally appropriate lighting around the forum
  const furnitureSet = getCulturalFurnitureSet(config, 'government');
  
  // Place lighting at corners of the room
  if (furnitureSet.lighting && furnitureSet.lighting.length > 0) {
    placeCulturalLighting(tiles, 3, 3, config);
    placeCulturalLighting(tiles, size.width - 4, 3, config);
    placeCulturalLighting(tiles, 3, size.height - 4, config);
    placeCulturalLighting(tiles, size.width - 4, size.height - 4, config);
  }
  
  interactionZones.push({
    id: 'forum_center',
    bounds: { x: centerX - 5, y: centerY - 5, width: 10, height: 10 },
    type: 'council',
    interactions: ['speak', 'debate', 'vote']
  });
  
  // Add default room definition
  rooms.push({
    id: 'main_forum',
    name: 'Forum Hall',
    bounds: { x: 1, y: 1, width: size.width - 2, height: size.height - 2 },
    description: 'The main assembly hall',
    roomType: 'assembly',
    accessLevel: 'public',
    npcDensity: 'normal'
  });
}

/**
 * Generate Andean Kallanka (Inca administrative/ceremonial hall)
 * Long rectangular structure for ceremonies, feasts, and state administration
 */
function generateAndeanKallanka(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  // Characteristic long rectangular hall with culturally appropriate walls
  placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height,
    config.culturalZone, config.era, [
      { side: 'south', offset: Math.floor(size.width / 2) },
      { side: 'north', offset: Math.floor(size.width / 2) }
    ]);
  
  // Culturally appropriate floor - will be sandstone for pre-Columbian Americas
  fillCulturalFloor(tiles, 1, 1, size.width - 2, size.height - 2,
    config.culturalZone, config.era);
  
  // Apply cultural flooring patterns for Andean architecture
  applyCulturalFlooring(
    tiles,
    { x: 1, y: 1, width: size.width - 2, height: size.height - 2 },
    config,
    noise,
    'ceremonial'
  );
  
  // Apply Inca stonework pattern to floor tiles as additional detail
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      tiles[y][x].materialSubtype = 'inca_fitted_stone';
    }
  }
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Raised ceremonial platform (ushnu) at the far end
  const platformWidth = Math.min(12, size.width - 4);
  const platformHeight = 4;
  const platformX = centerX - platformWidth / 2;
  const platformY = 2;
  
  fillArea(tiles, platformX, platformY, platformWidth, platformHeight, BiomeType.FLOOR_STONE);
  for (let y = platformY; y < platformY + platformHeight; y++) {
    for (let x = platformX; x < platformX + platformWidth; x++) {
      tiles[y][x].materialSubtype = 'ceremonial_stone_platform';
      tiles[y][x].elevation = 1; // Raised platform
    }
  }
  
  // Central throne/seat for the Curaca or Sapa Inca
  const throneX = centerX;
  const throneY = platformY + 1;
  tiles[throneY][throneX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: 'inca_stone_throne'
  };
  tiles[throneY][throneX].materialSubtype = 'carved_andesite';
  tiles[throneY][throneX].isBlocking = true;
  
  // Stone pillars supporting the roof - characteristic Inca trapezoidal openings
  const pillarSpacing = Math.floor((size.width - 4) / 4);
  for (let i = 1; i <= 3; i++) {
    const x1 = 2 + i * pillarSpacing;
    const x2 = size.width - 2 - i * pillarSpacing;
    
    // Left side supports (culturally appropriate)
    if (x1 < size.width - 1) {
      placeCulturalSymbol(tiles, x1, centerY - 2, BiomeType.PILLAR,
        config.culturalZone, config.era, 'inca_stone_pillar');
      placeCulturalSymbol(tiles, x1, centerY + 2, BiomeType.PILLAR,
        config.culturalZone, config.era, 'inca_stone_pillar');
    }
    
    // Right side supports (culturally appropriate)
    if (x2 > 0 && x2 !== x1) {
      placeCulturalSymbol(tiles, x2, centerY - 2, BiomeType.PILLAR,
        config.culturalZone, config.era, 'inca_stone_pillar');
      placeCulturalSymbol(tiles, x2, centerY + 2, BiomeType.PILLAR,
        config.culturalZone, config.era, 'inca_stone_pillar');
    }
  }
  
  // Ceremonial fire pits/braziers along the sides for illumination and rituals
  const brazierY1 = centerY - 4;
  const brazierY2 = centerY + 4;
  
  for (let i = 0; i < 3; i++) {
    const brazierX = 4 + i * Math.floor((size.width - 8) / 3);
    if (brazierX < size.width - 2) {
      // Left side braziers
      tiles[brazierY1][brazierX].overlayObject = {
        type: OverlayObjectType.BRAZIER,
        rotation: 0,
        variant: 'stone_fire_bowl'
      };
      tiles[brazierY1][brazierX].materialSubtype = 'ceremonial_fire_bowl';
      
      // Right side braziers
      if (brazierY2 < size.height - 1) {
        tiles[brazierY2][brazierX].overlayObject = {
          type: OverlayObjectType.BRAZIER,
          rotation: 0,
          variant: 'stone_fire_bowl'
        };
        tiles[brazierY2][brazierX].materialSubtype = 'ceremonial_fire_bowl';
      }
    }
  }
  
  // Sacred niches (tocapu) along the walls for ceremonial objects
  const nicheY = Math.floor(size.height * 0.3);
  for (let x = 3; x < size.width - 3; x += 6) {
    tiles[nicheY][x].overlayObject = {
      type: OverlayObjectType.WALL_NICHE,
      rotation: 0,
      variant: 'inca_ceremonial_niche'
    };
    tiles[nicheY][x].materialSubtype = 'sacred_wall_niche';
  }
  
  // Interaction zones
  interactionZones.push({
    id: 'inca_throne',
    bounds: { x: throneX - 2, y: throneY - 1, width: 4, height: 3 },
    type: 'throne',
    interactions: ['hold_court', 'receive_tribute', 'conduct_ceremony']
  });
  
  interactionZones.push({
    id: 'ceremonial_platform',
    bounds: { x: platformX, y: platformY, width: platformWidth, height: platformHeight },
    type: 'ceremony',
    interactions: ['perform_ritual', 'make_proclamation', 'feast_ceremony']
  });
  
  interactionZones.push({
    id: 'assembly_hall',
    bounds: { x: 2, y: centerY - 6, width: size.width - 4, height: 12 },
    type: 'assembly',
    interactions: ['tribal_council', 'administrative_meeting', 'receive_delegates']
  });
  
  // Room definition for the entire kallanka
  rooms.push({
    id: 'main_kallanka_hall',
    name: config.era === HistoricalEra.MEDIEVAL ? 'Great Kallanka' : 'Administrative Hall',
    bounds: { x: 1, y: 1, width: size.width - 2, height: size.height - 2 },
    roomType: 'ceremonial_hall',
    description: 'A grand Andean assembly hall built from precisely fitted stone blocks, used for state ceremonies, feasts, and administrative functions.',
    culturalContext: 'Inca imperial architecture featuring trapezoidal openings and ceremonial platforms',
    isEntryPoint: true
  });
}

/**
 * Generate Indigenous North American council ground
 */
function generateIndigenousCouncilGround(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Open-air or longhouse design based on region/era
  if (config.region === 'northeast' || config.era === HistoricalEra.MEDIEVAL) {
    // Iroquois longhouse style
    const wallLength = Math.min(size.width - 2, size.height - 2);
    placeWallRectangle(tiles, 1, 1, size.width - 2, size.height - 2, [
      { side: 'east', offset: Math.floor(size.height / 2) },
      { side: 'west', offset: Math.floor(size.height / 2) }
    ]);
    
    // Bark/wood floor
    fillArea(tiles, 2, 2, size.width - 4, size.height - 4, BiomeType.FLOOR_WOOD);
    
    // Central fire pit
    const centerX = Math.floor(size.width / 2);
    const centerY = Math.floor(size.height / 2);
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.FIRE_PIT,
      rotation: 0,
      variant: 'council_fire'
    };
  } else {
    // Open-air council circle
    fillArea(tiles, 0, 0, size.width, size.height, BiomeType.GRASS);
    
    const centerX = Math.floor(size.width / 2);
    const centerY = Math.floor(size.height / 2);
    
    // Sacred fire at center
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.FIRE_PIT,
      rotation: 0,
      variant: 'sacred_council_fire'
    };
    
    // Circle of seating stones
    const radius = Math.min(size.width, size.height) / 3;
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 8) {
      const x = Math.floor(centerX + Math.cos(angle) * radius);
      const y = Math.floor(centerY + Math.sin(angle) * radius);
      if (x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1) {
        tiles[y][x].biome = BiomeType.CHAIR;
        tiles[y][x].materialSubtype = 'council_stone';
      }
    }
  }
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  interactionZones.push({
    id: 'council_fire',
    bounds: { x: centerX - 3, y: centerY - 3, width: 6, height: 6 },
    type: 'sacred_fire',
    interactions: ['speak_to_council', 'pass_talking_stick', 'make_treaty']
  });
}

// SUBTYPE GENERATORS - Enhanced layouts for specific government building types

function generateTownHall(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[], multiTileObjects?: any[] } {
  
  const centerX = Math.floor(size.width / 2);
  
  // Create walls and floor
  placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height,
    config.culturalZone, config.era, [
      { side: 'south', offset: centerX }
    ]);
  
  fillCulturalFloor(tiles, 1, 1, size.width - 2, size.height - 2,
    config.culturalZone, config.era);

  // MULTI-TILE PILLARS - Grand civic architecture
  const pillarHeight = MultiTileObjectManager.getPillarHeight(config);
  const pillarMaterial = MultiTileObjectManager.getMaterialForContext(config);

  console.log(`[TownHall Debug] Adding pillars with height ${pillarHeight}, material ${pillarMaterial}`);

  // Place pillars in the council chamber to create a grand civic feel
  if (size.width >= 12 && size.height >= 10) {
    // Two pillars flanking the council area
    const leftPillarX = Math.floor(size.width * 0.25);
    const rightPillarX = Math.floor(size.width * 0.75);
    const pillarY = 5; // In the council chamber area

    // Left pillar
    console.log(`[TownHall Debug] Placing left pillar at (${leftPillarX}, ${pillarY})`);
    multiTileObjectManager.placePillar(tiles, leftPillarX, pillarY, pillarHeight, pillarMaterial);

    // Right pillar
    console.log(`[TownHall Debug] Placing right pillar at (${rightPillarX}, ${pillarY})`);
    multiTileObjectManager.placePillar(tiles, rightPillarX, pillarY, pillarHeight, pillarMaterial);
  }

  // MAIN COUNCIL CHAMBER - North section
  const councilY = 3;
  const councilWidth = size.width - 4;
  
  // Council table - central meeting space
  for (let x = 2; x < size.width - 2; x += 2) {
    safeTileSet(tiles, councilY, x, { 
      biome: BiomeType.TABLE,
      materialSubtype: 'council_table'
    });
  }
  
  // MUNICIPAL OFFICES - Side rooms
  const officeWidth = Math.floor((size.width - 6) / 2);
  
  // Left office - Records and permits
  for (let y = councilY + 3; y < councilY + 6; y++) {
    for (let x = 1; x < 1 + officeWidth; x++) {
      if (x === 1 || y === councilY + 3) continue; // Entrance
      safeTileSet(tiles, y, x, { biome: BiomeType.WALL });
    }
  }
  
  // Office furniture
  safeTileSet(tiles, councilY + 4, 2, { 
    biome: BiomeType.TABLE,
    materialSubtype: 'clerk_desk'
  });
  
  // Right office - Tax collection
  for (let y = councilY + 3; y < councilY + 6; y++) {
    for (let x = size.width - 1 - officeWidth; x < size.width - 1; x++) {
      if (x === size.width - 1 - officeWidth || y === councilY + 3) continue;
      safeTileSet(tiles, y, x, { biome: BiomeType.WALL });
    }
  }
  
  safeTileSet(tiles, councilY + 4, size.width - 3, { 
    biome: BiomeType.TABLE,
    materialSubtype: 'tax_desk'
  });
  
  // PUBLIC RECEPTION AREA - South section
  const receptionY = councilY + 7;
  
  // Waiting benches
  for (let x = 3; x < size.width - 3; x += 3) {
    safeTileSet(tiles, receptionY, x, { 
      biome: BiomeType.CHAIR,
      materialSubtype: 'waiting_bench'
    });
  }
  
  // Rooms for NPC placement
  rooms.push(
    {
      id: 'council_chamber',
      name: 'Council Chamber',
      bounds: { x: 1, y: 1, width: size.width - 2, height: councilY + 2 },
      description: 'Where municipal decisions are made',
      roomType: 'council',
      accessLevel: 'restricted',
      npcDensity: 'low'
    },
    {
      id: 'public_area',
      name: 'Public Reception',
      bounds: { x: 1, y: receptionY, width: size.width - 2, height: size.height - receptionY - 1 },
      description: 'Where citizens conduct municipal business',
      roomType: 'reception',
      accessLevel: 'public',
      npcDensity: 'normal'
    }
  );

  return { tiles, interactionZones, exitZones, rooms, multiTileObjects: multiTileObjectManager.getObjects() };
}

function generateAssemblyHall(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[], multiTileObjects?: any[] } {
  
  const centerX = Math.floor(size.width / 2);
  
  // Create walls and floor
  placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height,
    config.culturalZone, config.era, [
      { side: 'south', offset: centerX }
    ]);
  
  fillCulturalFloor(tiles, 1, 1, size.width - 2, size.height - 2,
    config.culturalZone, config.era);
  
  // SPEAKER'S PODIUM - North center
  const podiumY = 2;
  safeTileSet(tiles, podiumY, centerX, { 
    biome: BiomeType.FLOOR_MARBLE,
    materialSubtype: 'speaker_platform'
  });
  
  if (safeTileSet(tiles, podiumY, centerX, { biome: BiomeType.TABLE })) {
    tiles[podiumY][centerX].overlayObject = {
      type: OverlayObjectType.PODIUM,
      rotation: 180,
      variant: 'parliamentary'
    };
  }
  
  // SEMICIRCULAR SEATING - Modern parliamentary style
  const seatRadius = Math.min(5, Math.floor(size.height / 2));
  const seatY = podiumY + 3;
  
  for (let row = 0; row < 3; row++) {
    const currentRadius = seatRadius + row;
    const seatsInRow = Math.floor(currentRadius * Math.PI / 2); // Semicircle
    
    for (let seat = 0; seat < seatsInRow; seat++) {
      const angle = (seat / seatsInRow) * Math.PI; // 0 to PI (semicircle)
      const seatX = Math.floor(centerX + currentRadius * Math.cos(angle));
      const y = Math.floor(seatY + currentRadius * Math.sin(angle));
      
      if (y < size.height - 1 && seatX >= 1 && seatX < size.width - 1) {
        safeTileSet(tiles, y, seatX, { 
          biome: BiomeType.CHAIR,
          materialSubtype: 'assembly_seat'
        });
      }
    }
  }
  
  // VOTING SYSTEM - Modern assemblies have electronic voting
  if (config.era === HistoricalEra.INDUSTRIAL_ERA || config.era === HistoricalEra.MODERN_ERA) {
    safeTileSet(tiles, podiumY, centerX - 2, {
      biome: BiomeType.TABLE,
      materialSubtype: 'voting_machine'
    });
  }
  
  rooms.push({
    id: 'assembly_chamber',
    name: 'Assembly Hall',
    bounds: { x: 1, y: 1, width: size.width - 2, height: size.height - 2 },
    description: 'Democratic assembly chamber for legislative proceedings',
    roomType: 'assembly',
    accessLevel: 'restricted',
    npcDensity: 'high'
  });

  return { tiles, interactionZones, exitZones, rooms, multiTileObjects: multiTileObjectManager.getObjects() };
}

function generateAdministrativeComplex(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[], multiTileObjects?: any[] } {
  
  const centerX = Math.floor(size.width / 2);
  
  // Create walls and floor
  placeCulturalWallRectangle(tiles, 0, 0, size.width, size.height,
    config.culturalZone, config.era, [
      { side: 'south', offset: centerX }
    ]);
  
  fillCulturalFloor(tiles, 1, 1, size.width - 2, size.height - 2,
    config.culturalZone, config.era);
  
  // CUBICLES/OFFICE SPACES - Grid layout for bureaucracy
  const officeSize = 3;
  const officesPerRow = Math.floor((size.width - 2) / officeSize);
  const officeRows = Math.floor((size.height - 4) / officeSize);
  
  for (let row = 0; row < officeRows; row++) {
    for (let col = 0; col < officesPerRow; col++) {
      const startX = 1 + col * officeSize;
      const startY = 2 + row * officeSize;
      
      // Office walls (cubicle partitions)
      if (col > 0) { // Vertical partition
        for (let y = startY; y < startY + officeSize - 1; y++) {
          safeTileSet(tiles, y, startX, { 
            biome: BiomeType.WALL_LOW,
            materialSubtype: 'office_partition'
          });
        }
      }
      
      if (row > 0) { // Horizontal partition
        for (let x = startX; x < startX + officeSize - 1; x++) {
          safeTileSet(tiles, startY, x, { 
            biome: BiomeType.WALL_LOW,
            materialSubtype: 'office_partition'
          });
        }
      }
      
      // Desk in each office
      safeTileSet(tiles, startY + 1, startX + 1, { 
        biome: BiomeType.TABLE,
        materialSubtype: 'office_desk'
      });
      
      // Chair
      safeTileSet(tiles, startY + 2, startX + 1, { 
        biome: BiomeType.CHAIR,
        materialSubtype: 'office_chair'
      });
    }
  }
  
  // CENTRAL CORRIDOR
  const corridorY = Math.floor(size.height / 2);
  for (let x = 1; x < size.width - 1; x++) {
    safeTileSet(tiles, corridorY, x, { 
      biome: BiomeType.FLOOR_STONE,
      materialSubtype: 'office_corridor'
    });
  }
  
  // ARCHIVE/FILING ROOM - Corner office
  const archiveX = size.width - 4;
  const archiveY = 2;
  
  for (let y = archiveY; y < archiveY + 3; y++) {
    for (let x = archiveX; x < size.width - 1; x++) {
      safeTileSet(tiles, y, x, { 
        biome: BiomeType.CHEST,
        materialSubtype: 'filing_cabinet'
      });
    }
  }
  
  rooms.push({
    id: 'office_complex',
    name: 'Administrative Offices',
    bounds: { x: 1, y: 1, width: size.width - 2, height: size.height - 2 },
    description: 'Bureaucratic offices for government administration',
    roomType: 'office',
    accessLevel: 'restricted',
    npcDensity: 'high'
  });

  return { tiles, interactionZones, exitZones, rooms, multiTileObjects: multiTileObjectManager.getObjects() };
}