/**
 * generation/specialMap/archetypes/arenaGenerator.ts
 * Generator for arena/sports venue special maps
 */

import { Tile, BiomeType } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../mapLayoutUtils';
import {
  lightRoom,
  placeChandelier,
  placeWallSconce,
  getCulturalLighting
} from '../advancedLightingSystem';
import {
  placeCulturalStorage,
  placeSpiceStorage
} from '../storageUtilitySystem';
import {
  placeSmartTable,
  placeRoundTable,
  placeBanquetTable
} from '../advancedFurnitureSystem';
import {
  placeBenchWithOrientation,
  placeCulturalDecoration
} from '../directionalFurniturePlacement';

/**
 * Arena zone types for procedural placement
 */
enum ArenaZoneType {
  ARENA_FLOOR = 'arena_floor',        // Main competition area
  AUDIENCE_TIER1 = 'audience_tier1',   // Primary seating
  AUDIENCE_TIER2 = 'audience_tier2',   // Upper seating  
  AUDIENCE_TIER3 = 'audience_tier3',   // Highest seating
  VIP_BOX = 'vip_box',                // Royal/elite viewing
  COMPETITOR_PREP = 'competitor_prep',  // Fighter preparation areas
  SERVICE_AREA = 'service_area',       // Storage, equipment
  ENTRANCE_GATE = 'entrance_gate',     // Entry corridors
  CEREMONIAL = 'ceremonial',           // Altars, statues
  UNDERGROUND = 'underground'          // Cells, hypogeum
}

/**
 * Cultural arena types based on historical context
 */
interface ArenaConfig {
  name: string;
  floorType: BiomeType;
  seatingStyle: 'tiered' | 'pavilion' | 'platform' | 'mat';
  centerpiece?: string;
  culturalElements: string[];
  lightingType: string;
  hasUnderground: boolean;
  shape: 'oval' | 'rectangular' | 'circular' | 'i_shaped';
}

export function generateArena(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms?: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  console.log('[ArenaGenerator] Generating arena for:', {
    culturalZone: config.culturalZone,
    era: config.era,
    year: config.specificYear,
    size: size
  });
  
  // Determine culturally appropriate arena configuration
  const arenaConfig = getCulturalArenaConfig(config);
  console.log('[ArenaGenerator] Selected arena type:', arenaConfig.name);
  
  // Create perimeter walls with culturally appropriate gates
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'north', offset: Math.floor(size.width / 4) },
    { side: 'north', offset: Math.floor(size.width * 3 / 4) },
    { side: 'south', offset: Math.floor(size.width / 4) },
    { side: 'south', offset: Math.floor(size.width * 3 / 4) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  // Fill with era-appropriate base flooring
  const baseFloor = getEraAppropriateFlooring(config);
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, baseFloor);
  
  // Define arena zones based on configuration and size
  const zones = defineArenaZones(size, arenaConfig);
  
  // Generate the arena procedurally
  procedurallyFurnishArena(tiles, zones, config, arenaConfig, size);
  
  // Add cultural decorations and atmosphere
  addCulturalArenaDecorations(tiles, zones, config, arenaConfig);
  
  // Create interaction zones based on arena layout
  createArenaInteractionZones(zones, arenaConfig, interactionZones);
  
  // Create room definitions
  rooms.push({
    id: 'main_arena',
    name: arenaConfig.name,
    bounds: { x: 0, y: 0, width: size.width, height: size.height },
    roomType: 'arena',
    accessLevel: 'public'
  });
  
  // Exit zones - culturally appropriate gates
  const gateStyle = getGateStyle(config);
  exitZones.push(
    { id: 'north_gate_1', location: [Math.floor(size.width / 4), 0], 
      label: gateStyle.northLabel, destination: 'parent_map' },
    { id: 'north_gate_2', location: [Math.floor(size.width * 3 / 4), 0], 
      label: gateStyle.northLabel, destination: 'parent_map' },
    { id: 'south_gate_1', location: [Math.floor(size.width / 4), size.height - 1], 
      label: gateStyle.southLabel, destination: 'parent_map' },
    { id: 'south_gate_2', location: [Math.floor(size.width * 3 / 4), size.height - 1], 
      label: gateStyle.southLabel, destination: 'parent_map' }
  );
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Get culturally appropriate arena configuration
 */
function getCulturalArenaConfig(config: SpecialMapConfig): ArenaConfig {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const era = config.era || 'MEDIEVAL';
  const year = config.specificYear || 1400;
  
  // Roman/Byzantine arenas
  if (culturalZone === 'EUROPEAN' && (era === 'ANTIQUITY' || era === 'MEDIEVAL')) {
    return {
      name: era === 'ANTIQUITY' ? 'Roman Colosseum' : 'Medieval Tournament Ground',
      floorType: era === 'ANTIQUITY' ? BiomeType.SAND : BiomeType.FLOOR_STONE,
      seatingStyle: 'tiered',
      centerpiece: era === 'ANTIQUITY' ? 'imperial_box' : 'royal_pavilion',
      culturalElements: ['columns', 'statues', 'banners'],
      lightingType: 'torches',
      hasUnderground: era === 'ANTIQUITY',
      shape: era === 'ANTIQUITY' ? 'oval' : 'rectangular'
    };
  }
  
  // Mesoamerican ball courts
  if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN' || culturalZone === 'SOUTH_AMERICAN') {
    return {
      name: 'Sacred Ball Court',
      floorType: BiomeType.FLOOR_STONE,
      seatingStyle: 'platform',
      centerpiece: 'ritual_altar',
      culturalElements: ['stone_rings', 'carvings', 'feathered_serpent'],
      lightingType: 'torches',
      hasUnderground: false,
      shape: 'i_shaped'
    };
  }
  
  // East Asian arenas
  if (culturalZone === 'EAST_ASIAN') {
    return {
      name: year < 1600 ? 'Sumo Dohyo' : 'Martial Arts Ring',
      floorType: BiomeType.SAND,
      seatingStyle: year < 1800 ? 'mat' : 'platform',
      centerpiece: 'sacred_pillars',
      culturalElements: ['lanterns', 'dragons', 'cherry_blossoms'],
      lightingType: 'paper_lanterns',
      hasUnderground: false,
      shape: 'circular'
    };
  }
  
  // MENA arenas
  if (culturalZone === 'MENA') {
    return {
      name: era === 'ANTIQUITY' ? 'Hippodrome' : 'Desert Arena',
      floorType: BiomeType.SAND,
      seatingStyle: 'tiered',
      centerpiece: 'obelisk',
      culturalElements: ['mosaics', 'geometric_patterns', 'palm_fronds'],
      lightingType: 'braziers',
      hasUnderground: false,
      shape: era === 'ANTIQUITY' ? 'oval' : 'rectangular'
    };
  }
  
  // South Asian arenas
  if (culturalZone === 'SOUTH_ASIAN') {
    return {
      name: 'Royal Durbar Arena',
      floorType: BiomeType.FLOOR_MARBLE,
      seatingStyle: 'pavilion',
      centerpiece: 'maharaja_throne',
      culturalElements: ['elephants', 'silk_banners', 'lotus_patterns'],
      lightingType: 'oil_lamps',
      hasUnderground: false,
      shape: 'rectangular'
    };
  }
  
  // Sub-Saharan African arenas
  if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
    return {
      name: 'Tribal Competition Ground',
      floorType: BiomeType.SAND,
      seatingStyle: 'platform',
      centerpiece: 'ancestral_drums',
      culturalElements: ['masks', 'totems', 'animal_hides'],
      lightingType: 'fires',
      hasUnderground: false,
      shape: 'circular'
    };
  }
  
  // Oceania arenas
  if (culturalZone === 'OCEANIA') {
    return {
      name: 'Maori Haka Ground',
      floorType: BiomeType.GRASS,
      seatingStyle: 'mat',
      centerpiece: 'carved_totem',
      culturalElements: ['feathers', 'shells', 'wooden_carvings'],
      lightingType: 'fires',
      hasUnderground: false,
      shape: 'circular'
    };
  }
  
  // Default fallback
  return {
    name: 'Arena',
    floorType: BiomeType.FLOOR_STONE,
    seatingStyle: 'tiered',
    centerpiece: 'viewing_box',
    culturalElements: ['banners', 'columns'],
    lightingType: 'torches',
    hasUnderground: false,
    shape: 'rectangular'
  };
}

/**
 * Get era-appropriate base flooring
 */
function getEraAppropriateFlooring(config: SpecialMapConfig): BiomeType {
  const era = config.era || 'MEDIEVAL';
  const year = config.specificYear || 1400;
  
  if (year < 1000) return BiomeType.SAND;
  if (year < 1500) return BiomeType.FLOOR_STONE;
  if (year < 1800) return BiomeType.FLOOR_WOOD;
  return BiomeType.FLOOR_TILE;
}

/**
 * Define arena zones based on configuration and size
 */
function defineArenaZones(
  size: { width: number, height: number },
  arenaConfig: ArenaConfig
): { [key in ArenaZoneType]?: Array<{x: number, y: number, width: number, height: number}> } {
  const zones: { [key in ArenaZoneType]?: Array<{x: number, y: number, width: number, height: number}> } = {};
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Initialize all zone types
  Object.values(ArenaZoneType).forEach(zoneType => {
    zones[zoneType] = [];
  });
  
  // Define main arena floor based on shape
  switch (arenaConfig.shape) {
    case 'oval':
      zones[ArenaZoneType.ARENA_FLOOR]!.push({
        x: centerX - 12,
        y: centerY - 8,
        width: 24,
        height: 16
      });
      break;
    case 'circular':
      zones[ArenaZoneType.ARENA_FLOOR]!.push({
        x: centerX - 8,
        y: centerY - 8,
        width: 16,
        height: 16
      });
      break;
    case 'i_shaped':
      // Main alley
      zones[ArenaZoneType.ARENA_FLOOR]!.push({
        x: centerX - 2,
        y: centerY - 12,
        width: 4,
        height: 24
      });
      // End zones
      zones[ArenaZoneType.ARENA_FLOOR]!.push({
        x: centerX - 6,
        y: centerY - 15,
        width: 12,
        height: 3
      });
      zones[ArenaZoneType.ARENA_FLOOR]!.push({
        x: centerX - 6,
        y: centerY + 12,
        width: 12,
        height: 3
      });
      break;
    default: // rectangular
      zones[ArenaZoneType.ARENA_FLOOR]!.push({
        x: centerX - 10,
        y: centerY - 6,
        width: 20,
        height: 12
      });
  }
  
  // Define audience zones based on seating style
  switch (arenaConfig.seatingStyle) {
    case 'tiered':
      // Multiple tiers around the arena
      for (let tier = 1; tier <= 3; tier++) {
        const tierOffset = tier * 4;
        zones[ArenaZoneType.AUDIENCE_TIER1]!.push({
          x: 2 + tierOffset,
          y: 2 + tierOffset,
          width: size.width - 4 - tierOffset * 2,
          height: Math.floor((size.height - 4 - tierOffset * 2) / 3)
        });
      }
      break;
    case 'pavilion':
      // Scattered pavilions around perimeter
      zones[ArenaZoneType.AUDIENCE_TIER1]!.push(
        { x: 2, y: 2, width: 8, height: 6 },
        { x: size.width - 10, y: 2, width: 8, height: 6 },
        { x: 2, y: size.height - 8, width: 8, height: 6 },
        { x: size.width - 10, y: size.height - 8, width: 8, height: 6 }
      );
      break;
    case 'platform':
      // Raised platforms along sides
      zones[ArenaZoneType.AUDIENCE_TIER1]!.push(
        { x: 2, y: Math.floor(size.height * 0.3), width: 4, height: Math.floor(size.height * 0.4) },
        { x: size.width - 6, y: Math.floor(size.height * 0.3), width: 4, height: Math.floor(size.height * 0.4) }
      );
      break;
    case 'mat':
      // Floor seating areas
      zones[ArenaZoneType.AUDIENCE_TIER1]!.push({
        x: Math.floor(size.width * 0.1),
        y: Math.floor(size.height * 0.1),
        width: Math.floor(size.width * 0.8),
        height: Math.floor(size.height * 0.1)
      });
      break;
  }
  
  // VIP box positioning
  zones[ArenaZoneType.VIP_BOX]!.push({
    x: centerX - 3,
    y: 2,
    width: 6,
    height: 4
  });
  
  // Competitor preparation areas
  zones[ArenaZoneType.COMPETITOR_PREP]!.push(
    { x: 2, y: centerY - 4, width: 6, height: 8 },
    { x: size.width - 8, y: centerY - 4, width: 6, height: 8 }
  );
  
  // Service areas
  zones[ArenaZoneType.SERVICE_AREA]!.push(
    { x: 2, y: 2, width: 4, height: 4 },
    { x: size.width - 6, y: size.height - 6, width: 4, height: 4 }
  );
  
  // Underground areas (if applicable)
  if (arenaConfig.hasUnderground) {
    zones[ArenaZoneType.UNDERGROUND]!.push({
      x: centerX - 3,
      y: centerY - 2,
      width: 6,
      height: 4
    });
  }
  
  return zones;
}

/**
 * Procedurally furnish arena with era and culture appropriate elements
 */
function procedurallyFurnishArena(
  tiles: Tile[][],
  zones: { [key in ArenaZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  arenaConfig: ArenaConfig,
  size: { width: number, height: number }
): void {
  console.log('[Arena] Starting procedural arena furnishing:', arenaConfig.name);
  
  // Furnish arena floor
  const arenaFloors = zones[ArenaZoneType.ARENA_FLOOR] || [];
  arenaFloors.forEach(floor => {
    furnishArenaFloor(tiles, floor, config, arenaConfig);
  });
  
  // Furnish audience areas
  const audienceAreas = zones[ArenaZoneType.AUDIENCE_TIER1] || [];
  audienceAreas.forEach(area => {
    furnishAudienceArea(tiles, area, config, arenaConfig);
  });
  
  // Furnish VIP boxes
  const vipBoxes = zones[ArenaZoneType.VIP_BOX] || [];
  vipBoxes.forEach(box => {
    furnishVIPBox(tiles, box, config, arenaConfig);
  });
  
  // Furnish competitor prep areas
  const prepAreas = zones[ArenaZoneType.COMPETITOR_PREP] || [];
  prepAreas.forEach(area => {
    furnishCompetitorArea(tiles, area, config, arenaConfig);
  });
  
  // Furnish service areas
  const serviceAreas = zones[ArenaZoneType.SERVICE_AREA] || [];
  serviceAreas.forEach(area => {
    furnishServiceArea(tiles, area, config, arenaConfig);
  });
  
  // Furnish underground areas
  if (arenaConfig.hasUnderground) {
    const undergroundAreas = zones[ArenaZoneType.UNDERGROUND] || [];
    undergroundAreas.forEach(area => {
      furnishUndergroundArea(tiles, area, config, arenaConfig);
    });
  }
  
  // Ensure adequate lighting
  ensureAdequateArenaLighting(tiles, zones, config, arenaConfig, size);
}

/**
 * Furnish the main arena floor
 */
function furnishArenaFloor(
  tiles: Tile[][],
  floor: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  arenaConfig: ArenaConfig
): void {
  // Fill with appropriate surface
  for (let y = floor.y; y < floor.y + floor.height; y++) {
    for (let x = floor.x; x < floor.x + floor.width; x++) {
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        tiles[y][x].biome = arenaConfig.floorType;
      }
    }
  }
  
  // Add centerpiece elements
  const centerX = floor.x + Math.floor(floor.width / 2);
  const centerY = floor.y + Math.floor(floor.height / 2);
  
  if (arenaConfig.centerpiece === 'obelisk' && centerX < tiles[0].length && centerY < tiles.length) {
    tiles[centerY][centerX].biome = BiomeType.STATUE;
  } else if (arenaConfig.centerpiece === 'sacred_pillars') {
    // Place sacred pillars in corners
    const corners = [
      { x: floor.x + 2, y: floor.y + 2 },
      { x: floor.x + floor.width - 3, y: floor.y + 2 },
      { x: floor.x + 2, y: floor.y + floor.height - 3 },
      { x: floor.x + floor.width - 3, y: floor.y + floor.height - 3 }
    ];
    corners.forEach(corner => {
      if (corner.x >= 0 && corner.x < tiles[0].length && corner.y >= 0 && corner.y < tiles.length) {
        tiles[corner.y][corner.x].biome = BiomeType.COLUMN;
      }
    });
  } else if (arenaConfig.centerpiece === 'ritual_altar') {
    if (centerX >= 0 && centerX < tiles[0].length && centerY >= 0 && centerY < tiles.length) {
      tiles[centerY][centerX].overlayObject = {
        type: OverlayObjectType.ALTAR,
        rotation: 0,
        variant: config.culturalZone
      };
    }
  }
}

/**
 * Furnish audience seating areas
 */
function furnishAudienceArea(
  tiles: Tile[][],
  area: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  arenaConfig: ArenaConfig
): void {
  switch (arenaConfig.seatingStyle) {
    case 'tiered':
      // Place tiered seating
      for (let y = area.y; y < area.y + area.height; y += 2) {
        for (let x = area.x; x < area.x + area.width; x += 2) {
          if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
            tiles[y][x].biome = BiomeType.CHAIR;
          }
        }
      }
      break;
      
    case 'pavilion':
      // Place pavilion structures
      for (let y = area.y; y < area.y + area.height; y += 3) {
        for (let x = area.x; x < area.x + area.width; x += 4) {
          if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
            tiles[y][x].biome = BiomeType.PAVILION;
          }
        }
      }
      break;
      
    case 'platform':
      // Create raised platforms
      for (let y = area.y; y < area.y + area.height; y++) {
        for (let x = area.x; x < area.x + area.width; x++) {
          if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
            tiles[y][x].biome = BiomeType.FLOOR_WOOD;
          }
        }
      }
      // Add benches on platforms
      for (let y = area.y + 1; y < area.y + area.height - 1; y += 2) {
        for (let x = area.x + 1; x < area.x + area.width - 1; x += 2) {
          if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
            placeBenchWithOrientation(tiles, x, y, 'south', config.culturalZone || 'EUROPEAN');
          }
        }
      }
      break;
      
    case 'mat':
      // Place floor mats
      for (let y = area.y; y < area.y + area.height; y++) {
        for (let x = area.x; x < area.x + area.width; x++) {
          if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
            tiles[y][x].overlayObject = { type: OverlayObjectType.CUSHION };
          }
        }
      }
      break;
  }
}

/**
 * Furnish VIP viewing boxes
 */
function furnishVIPBox(
  tiles: Tile[][],
  box: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  arenaConfig: ArenaConfig
): void {
  const centerX = box.x + Math.floor(box.width / 2);
  const centerY = box.y + Math.floor(box.height / 2);
  
  // Place elevated platform
  for (let y = box.y; y < box.y + box.height; y++) {
    for (let x = box.x; x < box.x + box.width; x++) {
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        tiles[y][x].biome = BiomeType.PAVILION;
      }
    }
  }
  
  // Place throne/elite seating
  if (centerX >= 0 && centerX < tiles[0].length && centerY >= 0 && centerY < tiles.length) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.THRONE,
      rotation: 180, // Facing the arena
      variant: config.culturalZone
    };
    tiles[centerY][centerX].isBlocking = true;
  }
  
  // Add luxury elements
  if (arenaConfig.culturalElements.includes('columns')) {
    // Place decorative columns
    if (box.x >= 0 && box.x < tiles[0].length && box.y >= 0 && box.y < tiles.length) {
      tiles[box.y][box.x].biome = BiomeType.COLUMN;
    }
    if (box.x + box.width - 1 >= 0 && box.x + box.width - 1 < tiles[0].length && box.y >= 0 && box.y < tiles.length) {
      tiles[box.y][box.x + box.width - 1].biome = BiomeType.COLUMN;
    }
  }
}

/**
 * Furnish competitor preparation areas
 */
function furnishCompetitorArea(
  tiles: Tile[][],
  area: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  arenaConfig: ArenaConfig
): void {
  // Add weapon racks/equipment storage
  const storageX = area.x + 1;
  const storageY = area.y + 1;
  if (storageX >= 0 && storageX < tiles[0].length && storageY >= 0 && storageY < tiles.length) {
    placeCulturalStorage(tiles, storageX, storageY, config.culturalZone || 'EUROPEAN', config.specificYear || 1400);
  }
  
  // Add seating/preparation benches
  const benchX = area.x + Math.floor(area.width / 2);
  const benchY = area.y + Math.floor(area.height / 2);
  if (benchX >= 0 && benchX < tiles[0].length && benchY >= 0 && benchY < tiles.length) {
    placeBenchWithOrientation(tiles, benchX, benchY, 'north', config.culturalZone || 'EUROPEAN');
  }
  
  // Add equipment tables
  for (let i = 0; i < 2; i++) {
    const tableX = area.x + 2 + i * 2;
    const tableY = area.y + area.height - 2;
    if (tableX >= 0 && tableX < tiles[0].length && tableY >= 0 && tableY < tiles.length) {
      placeSmartTable(tiles, tableX, tableY, config.culturalZone || 'EUROPEAN', config.specificYear || 1400);
    }
  }
}

/**
 * Furnish service areas with storage and utilities
 */
function furnishServiceArea(
  tiles: Tile[][],
  area: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  arenaConfig: ArenaConfig
): void {
  // Storage containers
  const storagePositions = [
    { x: area.x + 1, y: area.y + 1 },
    { x: area.x + area.width - 2, y: area.y + area.height - 2 }
  ];
  
  storagePositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < tiles[0].length && pos.y >= 0 && pos.y < tiles.length) {
      placeCulturalStorage(tiles, pos.x, pos.y, config.culturalZone || 'EUROPEAN', config.specificYear || 1400);
    }
  });
  
  // Service tables
  const centerX = area.x + Math.floor(area.width / 2);
  const centerY = area.y + Math.floor(area.height / 2);
  if (centerX >= 0 && centerX < tiles[0].length && centerY >= 0 && centerY < tiles.length) {
    placeSmartTable(tiles, centerX, centerY, config.culturalZone || 'EUROPEAN', config.specificYear || 1400);
  }
}

/**
 * Furnish underground areas (Roman-style hypogeum)
 */
function furnishUndergroundArea(
  tiles: Tile[][],
  area: {x: number, y: number, width: number, height: number},
  config: SpecialMapConfig,
  arenaConfig: ArenaConfig
): void {
  // Prison cells
  for (let y = area.y; y < area.y + area.height; y += 2) {
    for (let x = area.x; x < area.x + area.width; x += 3) {
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        tiles[y][x].biome = BiomeType.CELL;
      }
    }
  }
  
  // Animal cages (represented as storage)
  const cageX = area.x + Math.floor(area.width / 2);
  const cageY = area.y + Math.floor(area.height / 2);
  if (cageX >= 0 && cageX < tiles[0].length && cageY >= 0 && cageY < tiles.length) {
    placeCulturalStorage(tiles, cageX, cageY, config.culturalZone || 'EUROPEAN', config.specificYear || 1400);
  }
}

/**
 * Ensure adequate arena lighting
 */
function ensureAdequateArenaLighting(
  tiles: Tile[][],
  zones: { [key in ArenaZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  arenaConfig: ArenaConfig,
  size: { width: number, height: number }
): void {
  const lightingType = arenaConfig.lightingType;
  
  // Key areas that need lighting
  [ArenaZoneType.ARENA_FLOOR, ArenaZoneType.VIP_BOX, ArenaZoneType.AUDIENCE_TIER1].forEach(zoneType => {
    const zoneAreas = zones[zoneType];
    if (zoneAreas) {
      zoneAreas.forEach((zone, index) => {
        const lightsNeeded = Math.max(2, Math.floor(zone.width * zone.height / 25));
        for (let i = 0; i < lightsNeeded; i++) {
          const lightX = zone.x + Math.floor((zone.width / lightsNeeded) * i) + 1;
          const lightY = zone.y + 1;
          
          if (lightX >= 0 && lightX < tiles[0].length && lightY >= 0 && lightY < tiles.length) {
            addArenaLighting(tiles, lightX, lightY, lightingType, config);
          }
        }
      });
    }
  });
}

/**
 * Add culturally appropriate arena lighting
 */
function addArenaLighting(
  tiles: Tile[][],
  x: number,
  y: number,
  lightingType: string,
  config: SpecialMapConfig
): void {
  switch (lightingType) {
    case 'torches':
      tiles[y][x].overlayObject = { type: OverlayObjectType.TORCH };
      break;
    case 'braziers':
      tiles[y][x].overlayObject = { type: OverlayObjectType.BRAZIER };
      break;
    case 'paper_lanterns':
      tiles[y][x].overlayObject = { type: OverlayObjectType.LANTERN };
      break;
    case 'oil_lamps':
      tiles[y][x].overlayObject = { type: OverlayObjectType.CANDLE };
      break;
    case 'fires':
      tiles[y][x].overlayObject = { type: OverlayObjectType.FIRE_PIT };
      break;
    default:
      getCulturalLighting(tiles, x, y, config.culturalZone || 'EUROPEAN', config.specificYear || 1400);
  }
}

/**
 * Get culturally appropriate gate style
 */
function getGateStyle(config: SpecialMapConfig): { northLabel: string, southLabel: string } {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  
  if (culturalZone === 'EUROPEAN') {
    return { northLabel: 'North Gate', southLabel: 'South Gate' };
  } else if (culturalZone === 'EAST_ASIAN') {
    return { northLabel: 'Dragon Gate', southLabel: 'Phoenix Gate' };
  } else if (culturalZone === 'MENA') {
    return { northLabel: 'Victory Gate', southLabel: 'Honor Gate' };
  } else if (culturalZone === 'SOUTH_ASIAN') {
    return { northLabel: 'Elephant Gate', southLabel: 'Lotus Gate' };
  }
  
  return { northLabel: 'North Entrance', southLabel: 'South Entrance' };
}

/**
 * Add cultural arena decorations and atmosphere
 */
function addCulturalArenaDecorations(
  tiles: Tile[][],
  zones: { [key in ArenaZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  arenaConfig: ArenaConfig
): void {
  console.log('[Arena] Adding cultural decorations for:', arenaConfig.name);
  
  // Add decorations based on cultural elements
  arenaConfig.culturalElements.forEach(element => {
    addDecorationByType(tiles, zones, config, element);
  });
  
  // Add era-specific atmospheric elements
  addAtmosphericElements(tiles, zones, config, arenaConfig);
}

/**
 * Add specific decoration types throughout the arena
 */
function addDecorationByType(
  tiles: Tile[][],
  zones: { [key in ArenaZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  decoration: string
): void {
  const audienceAreas = zones[ArenaZoneType.AUDIENCE_TIER1] || [];
  
  audienceAreas.forEach(area => {
    const decorationCount = Math.floor(area.width * area.height / 30); // Sparse decoration density
    
    for (let i = 0; i < decorationCount; i++) {
      const x = area.x + Math.floor(Math.random() * area.width);
      const y = area.y + Math.floor(Math.random() * area.height);
      
      if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
        switch (decoration) {
          case 'banners':
          case 'flags':
            tiles[y][x].overlayObject = { type: OverlayObjectType.BANNER };
            break;
          case 'statues':
          case 'sculptures':
            tiles[y][x].biome = BiomeType.STATUE;
            break;
          case 'columns':
            tiles[y][x].biome = BiomeType.COLUMN;
            break;
          case 'lanterns':
            tiles[y][x].overlayObject = { type: OverlayObjectType.LANTERN };
            break;
          case 'totems':
          case 'masks':
            placeCulturalDecoration(tiles, x, y, config.culturalZone || 'EUROPEAN', decoration);
            break;
        }
      }
    }
  });
}

/**
 * Add atmospheric elements based on era and culture
 */
function addAtmosphericElements(
  tiles: Tile[][],
  zones: { [key in ArenaZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  config: SpecialMapConfig,
  arenaConfig: ArenaConfig
): void {
  const culturalZone = config.culturalZone || 'EUROPEAN';
  
  // Add cultural-specific atmosphere
  if (culturalZone === 'MENA' && arenaConfig.culturalElements.includes('geometric_patterns')) {
    // Enhanced floor patterns for MENA arenas
    const arenaFloors = zones[ArenaZoneType.ARENA_FLOOR] || [];
    arenaFloors.forEach(floor => {
      for (let y = floor.y; y < floor.y + floor.height; y += 4) {
        for (let x = floor.x; x < floor.x + floor.width; x += 4) {
          if (x >= 0 && x < tiles[0].length && y >= 0 && y < tiles.length) {
            tiles[y][x].biome = BiomeType.FLOOR_TILE;
          }
        }
      }
    });
  }
  
  if (culturalZone === 'EAST_ASIAN' && arenaConfig.culturalElements.includes('dragons')) {
    // Add dragon motifs around VIP areas
    const vipBoxes = zones[ArenaZoneType.VIP_BOX] || [];
    vipBoxes.forEach(box => {
      if (box.x - 1 >= 0 && box.x - 1 < tiles[0].length && box.y >= 0 && box.y < tiles.length) {
        tiles[box.y][box.x - 1].biome = BiomeType.STATUE;
      }
      if (box.x + box.width >= 0 && box.x + box.width < tiles[0].length && box.y >= 0 && box.y < tiles.length) {
        tiles[box.y][box.x + box.width].biome = BiomeType.STATUE;
      }
    });
  }
  
  if (culturalZone === 'SOUTH_ASIAN' && arenaConfig.culturalElements.includes('elephants')) {
    // Add elephant representations at entrances
    const entranceAreas = zones[ArenaZoneType.ENTRANCE_GATE] || [];
    entranceAreas.forEach(entrance => {
      const centerX = entrance.x + Math.floor(entrance.width / 2);
      const centerY = entrance.y + Math.floor(entrance.height / 2);
      if (centerX >= 0 && centerX < tiles[0].length && centerY >= 0 && centerY < tiles.length) {
        tiles[centerY][centerX].biome = BiomeType.STATUE;
      }
    });
  }
}

/**
 * Create interaction zones based on arena layout
 */
function createArenaInteractionZones(
  zones: { [key in ArenaZoneType]?: Array<{x: number, y: number, width: number, height: number}> },
  arenaConfig: ArenaConfig,
  interactionZones: InteractionZone[]
): void {
  console.log('[Arena] Creating interaction zones for:', arenaConfig.name);
  
  // Create interaction zones for different arena zone types
  Object.entries(zones).forEach(([zoneType, zoneAreas]) => {
    if (!zoneAreas || zoneAreas.length === 0) return;
    
    zoneAreas.forEach((zone, index) => {
      const zoneId = `${zoneType.toLowerCase()}_${index}`;
      
      switch (zoneType as ArenaZoneType) {
        case ArenaZoneType.ARENA_FLOOR:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'arena',
            interactions: ['compete', 'fight', 'perform', 'challenge']
          });
          break;
          
        case ArenaZoneType.AUDIENCE_TIER1:
        case ArenaZoneType.AUDIENCE_TIER2:
        case ArenaZoneType.AUDIENCE_TIER3:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'audience',
            interactions: ['watch', 'cheer', 'socialize', 'bet']
          });
          break;
          
        case ArenaZoneType.VIP_BOX:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'vip',
            interactions: ['observe', 'judge', 'command', 'preside']
          });
          break;
          
        case ArenaZoneType.COMPETITOR_PREP:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'preparation',
            interactions: ['prepare', 'equip', 'train', 'rest']
          });
          break;
          
        case ArenaZoneType.SERVICE_AREA:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'service',
            interactions: ['store', 'maintain', 'supply']
          });
          break;
          
        case ArenaZoneType.UNDERGROUND:
          interactionZones.push({
            id: zoneId,
            bounds: zone,
            type: 'underground',
            interactions: ['imprison', 'release', 'interrogate']
          });
          break;
      }
    });
  });
  
  // Add activity-specific interaction zones
  if (arenaConfig.shape === 'i_shaped') {
    // Ball court specific interactions
    const arenaFloors = zones[ArenaZoneType.ARENA_FLOOR] || [];
    arenaFloors.forEach((floor, index) => {
      interactionZones.push({
        id: `ball_court_${index}`,
        bounds: floor,
        type: 'ball_game',
        interactions: ['play_ball', 'score', 'ritual_ceremony']
      });
    });
  }
  
  if (arenaConfig.shape === 'circular' && arenaConfig.centerpiece === 'sacred_pillars') {
    // Sumo ring specific interactions
    const arenaFloors = zones[ArenaZoneType.ARENA_FLOOR] || [];
    arenaFloors.forEach((floor, index) => {
      interactionZones.push({
        id: `sumo_ring_${index}`,
        bounds: {
          x: floor.x + Math.floor(floor.width / 2) - 4,
          y: floor.y + Math.floor(floor.height / 2) - 4,
          width: 8,
          height: 8
        },
        type: 'sumo',
        interactions: ['wrestle', 'bow', 'purify', 'throw_salt']
      });
    });
  }
}

// Legacy function - replaced by getCulturalArenaConfig but kept for compatibility
function getArenaType(config: SpecialMapConfig): string {
  const arenaConfig = getCulturalArenaConfig(config);
  
  if (arenaConfig.name.includes('Colosseum')) return 'colosseum';
  if (arenaConfig.name.includes('Ball Court')) return 'ballcourt';
  if (arenaConfig.name.includes('Tournament')) return 'tournament';
  if (arenaConfig.name.includes('Sumo') || arenaConfig.name.includes('Martial Arts')) return 'sumo';
  if (arenaConfig.name.includes('Hippodrome')) return 'hippodrome';
  if (arenaConfig.name.includes('Durbar')) return 'polo';
  
  return 'generic';
}

// All legacy generation functions have been replaced by the comprehensive procedural system above.
// The new system uses getCulturalArenaConfig() to determine arena type and zones, then 
// procedurallyFurnishArena() to generate culturally appropriate layouts.
