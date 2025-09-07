/**
 * generation/specialMap/archetypes/governmentGenerator.ts
 * Generator for culturally-specific government forum special maps
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition, ProfessionCategory } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../mapLayoutUtils';
import { generateEnhancedGovernmentForum } from './governmentGeneratorEnhanced';

export function generateGovernmentForum(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[] } {
  
  // Use enhanced multi-room generator for more modern eras and certain cultures
  const useEnhanced = (
    (config.era === HistoricalEra.INDUSTRIAL_ERA || config.era === HistoricalEra.MODERN_ERA) ||
    (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN && config.culturalZone === 'EUROPEAN')
  );
  
  if (useEnhanced) {
    // Use the new enhanced multi-room generator
    return generateEnhancedGovernmentForum(tiles, config, noise, size);
  }
  
  // Otherwise use the original culture-specific generators
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
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
      generateChineseImperialCourt(tiles, config, noise, size, interactionZones);
    } else if (config.region === 'japan') {
      generateJapaneseDaimyoHall(tiles, config, noise, size, interactionZones);
    } else {
      generateAsianCouncilHall(tiles, config, noise, size, interactionZones);
    }
  } else if (config.culturalZone === 'MENA') {
    if (config.era === HistoricalEra.MEDIEVAL || config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      generateIslamicMajlis(tiles, config, noise, size, interactionZones);
    } else {
      generateModernAssembly(tiles, config, noise, size, interactionZones);
    }
  } else if (config.culturalZone === 'SUB_SAHARAN_AFRICAN') {
    generateAfricanCouncilGround(tiles, config, noise, size, interactionZones);
  } else if (config.culturalZone === 'SOUTH_ASIAN') {
    generateIndianDurbar(tiles, config, noise, size, interactionZones);
  } else {
    generateDefaultForum(tiles, config, noise, size, interactionZones);
  }
  
  // Common exit zones
  const centerX = Math.floor(size.width / 2);
  exitZones.push(
    { id: 'main_exit', location: [centerX, size.height - 1], label: 'Exit Forum', destination: 'parent_map' },
    { id: 'north_exit', location: [centerX, 0], label: 'North Gate', destination: 'parent_map' }
  );
  
  return { tiles, interactionZones, exitZones, rooms };
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
  
  // Columns along walls
  for (let y = 10; y < size.height - 5; y += 6) {
    tiles[y][2].biome = BiomeType.PILLAR;
    tiles[y][2].materialSubtype = 'corinthian';
    tiles[y][size.width - 3].biome = BiomeType.PILLAR;
    tiles[y][size.width - 3].materialSubtype = 'corinthian';
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
  // Stone walls with multiple entrances
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'north', offset: Math.floor(size.width / 2) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  // Stone floor
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Great hall with long table
  const tableLength = Math.min(size.height - 16, 20);
  const tableY = centerY - tableLength / 2;
  
  // Long council table
  for (let y = tableY; y < tableY + tableLength; y++) {
    tiles[y][centerX].biome = BiomeType.TABLE;
    tiles[y][centerX].materialSubtype = 'oak_table';
    
    // Chairs on both sides
    tiles[y][centerX - 2].biome = BiomeType.CHAIR;
    tiles[y][centerX + 2].biome = BiomeType.CHAIR;
  }
  
  // Lord's throne at head of table using overlay system
  tiles[tableY - 3][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180,
    variant: 'high_seat'
  };
  tiles[tableY - 3][centerX].isBlocking = true;
  
  // Benches along walls for petitioners
  for (let y = 10; y < size.height - 10; y += 2) {
    tiles[y][3].biome = BiomeType.CHAIR;
    tiles[y][3].materialSubtype = 'wooden_bench';
    tiles[y][size.width - 4].biome = BiomeType.CHAIR;
    tiles[y][size.width - 4].materialSubtype = 'wooden_bench';
  }
  
  // Fireplace/hearth using overlay system
  tiles[5][centerX].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'great_hearth'
  };
  tiles[5][centerX].isBlocking = true;
  
  // Tapestries on walls
  for (let x = 8; x < size.width - 8; x += 8) {
    tiles[2][x].materialSubtype = 'tapestry';
    tiles[size.height - 3][x].materialSubtype = 'tapestry';
  }
  
  // Weapon racks (ceremonial)
  tiles[8][5].biome = BiomeType.CHEST;
  tiles[8][5].materialSubtype = 'weapon_rack';
  tiles[8][size.width - 6].biome = BiomeType.CHEST;
  tiles[8][size.width - 6].materialSubtype = 'weapon_rack';
  
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
  interactionZones: InteractionZone[]
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
  tiles[platformY + 1][centerX + 4].biome = BiomeType.CHEST;
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
  tiles[centerY + 2][centerX].biome = BiomeType.CHEST;
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
    tiles[drumY][drumX + i].biome = BiomeType.BARREL;
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
  
  // Weapon display (ceremonial)
  tiles[8][3].biome = BiomeType.CHEST;
  tiles[8][3].materialSubtype = 'sword_display';
  tiles[8][size.width - 4].biome = BiomeType.CHEST;
  tiles[8][size.width - 4].materialSubtype = 'sword_display';
  
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
 * Default forum generation
 */
function generateDefaultForum(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  const floorType = config.era === HistoricalEra.ANTIQUITY 
    ? BiomeType.FLOOR_STONE 
    : BiomeType.FLOOR_MARBLE;
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, floorType);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Simple amphitheater layout
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
  
  // Central speaking area
  tiles[centerY][centerX].biome = BiomeType.FLOOR_MARBLE;
  
  interactionZones.push({
    id: 'forum_center',
    bounds: { x: centerX - 5, y: centerY - 5, width: 10, height: 10 },
    type: 'council',
    interactions: ['speak', 'debate', 'vote']
  });
}