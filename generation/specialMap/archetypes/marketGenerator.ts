/**
 * generation/specialMap/archetypes/marketGenerator.ts
 * Generator for culturally-specific market bazaar special maps
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

export function generateMarketBazaar(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms?: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  console.log('[MarketGenerator] Generating market for:', {
    culturalZone: config.culturalZone,
    era: config.era,
    size: size
  });
  
  // Choose generation style based on culture
  if (config.culturalZone === 'MENA') {
    generateIslamicBazaar(tiles, config, noise, size, interactionZones, rooms);
  } else if (config.culturalZone === 'EAST_ASIAN') {
    generateAsianMarket(tiles, config, noise, size, interactionZones, rooms);
  } else if (config.culturalZone === 'SUB_SAHARAN_AFRICAN') {
    generateAfricanMarket(tiles, config, noise, size, interactionZones, rooms);
  } else if (config.culturalZone === 'EUROPEAN') {
    generateEuropeanMarket(tiles, config, noise, size, interactionZones, rooms);
  } else {
    generateDefaultMarket(tiles, config, noise, size, interactionZones, rooms);
  }
  
  // Exit zones (common to all)
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  exitZones.push(
    { id: 'south_exit', location: [centerX, size.height - 1], label: 'South Gate', destination: 'parent_map' },
    { id: 'north_exit', location: [centerX, 0], label: 'North Gate', destination: 'parent_map' },
    { id: 'east_exit', location: [size.width - 1, centerY], label: 'East Gate', destination: 'parent_map' },
    { id: 'west_exit', location: [0, centerY], label: 'West Gate', destination: 'parent_map' }
  );
  
  console.log('[MarketGenerator] Generated', rooms.length, 'rooms');
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Generate Islamic bazaar/souk with covered passages and courtyards
 */
function generateIslamicBazaar(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  // Outer walls with multiple entrances
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'south', offset: Math.floor(size.width / 4) },
    { side: 'south', offset: Math.floor(3 * size.width / 4) },
    { side: 'north', offset: Math.floor(size.width / 2) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  // Fill with patterned tile floor
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_TILE);
  
  // Central courtyard with fountain
  const courtyardSize = 12;
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  const courtyardX = centerX - courtyardSize / 2;
  const courtyardY = centerY - courtyardSize / 2;
  
  // Courtyard walls
  placeWallRectangle(tiles, courtyardX, courtyardY, courtyardSize, courtyardSize, [
    { side: 'south', offset: courtyardSize / 2 },
    { side: 'north', offset: courtyardSize / 2 },
    { side: 'east', offset: courtyardSize / 2 },
    { side: 'west', offset: courtyardSize / 2 }
  ]);
  
  // Courtyard interior
  fillArea(tiles, courtyardX + 1, courtyardY + 1, courtyardSize - 2, courtyardSize - 2, BiomeType.PLAZA);
  
  // Central fountain
  const fountainSize = 3;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles[centerY + dy][centerX + dx].biome = BiomeType.WATER;
    }
  }
  tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
  
  // Covered market passages (souks) radiating from center
  createCoveredPassages(tiles, centerX, centerY, size, noise);
  
  // Merchant stalls along passages
  createMerchantStalls(tiles, config, noise, size, 'islamic');
  
  // Add carpets, pillars, and decorative elements
  addIslamicDecorations(tiles, noise, size);
  
  // Interaction zones
  interactionZones.push({
    id: 'central_courtyard',
    bounds: { x: courtyardX, y: courtyardY, width: courtyardSize, height: courtyardSize },
    type: 'gathering',
    interactions: ['socialize', 'rest', 'listen_to_storyteller']
  });
  
  interactionZones.push({
    id: 'spice_market',
    bounds: { x: 3, y: 3, width: 15, height: 10 },
    type: 'market',
    interactions: ['trade_spices', 'haggle', 'sample_goods']
  });
  
  interactionZones.push({
    id: 'textile_bazaar',
    bounds: { x: size.width - 18, y: 3, width: 15, height: 10 },
    type: 'market',
    interactions: ['trade_textiles', 'commission_clothing', 'browse_fabrics']
  });
}

/**
 * Generate East Asian market with organized sections
 */
function generateAsianMarket(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Outer walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'north', offset: Math.floor(size.width / 2) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  // Wood or stone floor depending on era
  const floorType = config.era === HistoricalEra.MODERN_ERA ? BiomeType.FLOOR_TILE : BiomeType.FLOOR_WOOD;
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, floorType);
  
  // Main market street (wider than Islamic style)
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create main thoroughfare
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = centerX - 2; x <= centerX + 2; x++) {
      tiles[y][x].biome = BiomeType.ROAD;
    }
  }
  
  // Japanese style: Add small shrine
  if (config.region === 'japan') {
    const shrineX = 5;
    const shrineY = 5;
    placeWallRectangle(tiles, shrineX, shrineY, 6, 6);
    fillArea(tiles, shrineX + 1, shrineY + 1, 4, 4, BiomeType.FLOOR_WOOD);
    tiles[shrineY + 2][shrineX + 2].biome = BiomeType.SHRINE;
    tiles[shrineY + 2][shrineX + 3].biome = BiomeType.ALTAR;
  }
  
  // Chinese style: Add tea house
  if (config.region === 'china') {
    const teaHouseX = size.width - 11;
    const teaHouseY = 5;
    placeWallRectangle(tiles, teaHouseX, teaHouseY, 8, 8);
    fillArea(tiles, teaHouseX + 1, teaHouseY + 1, 6, 6, BiomeType.FLOOR_CARPET);
    // Tea tables
    tiles[teaHouseY + 2][teaHouseX + 2].biome = BiomeType.TABLE;
    tiles[teaHouseY + 2][teaHouseX + 5].biome = BiomeType.TABLE;
    tiles[teaHouseY + 5][teaHouseX + 2].biome = BiomeType.TABLE;
    tiles[teaHouseY + 5][teaHouseX + 5].biome = BiomeType.TABLE;
  }
  
  // Organized market sections
  createAsianMarketSections(tiles, config, noise, size);
  
  // Add lanterns and decorations
  addAsianDecorations(tiles, noise, size);
  
  // Interaction zones
  interactionZones.push({
    id: 'main_market',
    bounds: { x: centerX - 10, y: centerY - 10, width: 20, height: 20 },
    type: 'market',
    interactions: ['trade', 'browse', 'negotiate']
  });
  
  if (config.region === 'japan') {
    interactionZones.push({
      id: 'shrine',
      bounds: { x: 5, y: 5, width: 6, height: 6 },
      type: 'religious',
      interactions: ['pray', 'offer_incense', 'receive_blessing']
    });
  }
  
  if (config.region === 'china') {
    interactionZones.push({
      id: 'tea_house',
      bounds: { x: size.width - 11, y: 5, width: 8, height: 8 },
      type: 'social',
      interactions: ['drink_tea', 'socialize', 'play_game']
    });
  }
}

/**
 * Generate Sub-Saharan African market
 */
function generateAfricanMarket(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Open-air market with minimal walls
  // Only gates, no full perimeter
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Fill with dirt/earth floor
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.DIRT);
  
  // Create central gathering area
  const plazaSize = 16;
  const plazaX = centerX - plazaSize / 2;
  const plazaY = centerY - plazaSize / 2;
  fillArea(tiles, plazaX, plazaY, plazaSize, plazaSize, BiomeType.PLAZA);
  
  // Add shade structures (represented as partial walls/canopies)
  createShadeStructures(tiles, noise, size);
  
  // Market areas arranged in circular pattern
  createCircularMarketLayout(tiles, centerX, centerY, noise, size);
  
  // Central meeting tree or monument
  if (config.era === HistoricalEra.ANTIQUITY || config.era === HistoricalEra.MEDIEVAL) {
    // Ancient baobab or meeting tree
    tiles[centerY][centerX].biome = BiomeType.TREE;
    tiles[centerY][centerX].materialSubtype = 'baobab';
  } else {
    // Monument or statue
    tiles[centerY][centerX].biome = BiomeType.STATUE;
  }
  
  // Water well
  tiles[centerY + 5][centerX].biome = BiomeType.FOUNTAIN; // Using fountain as well
  tiles[centerY + 5][centerX].materialSubtype = 'well';
  
  // Craft areas
  createCraftAreas(tiles, config, noise, size);
  
  // Interaction zones
  interactionZones.push({
    id: 'central_plaza',
    bounds: { x: plazaX, y: plazaY, width: plazaSize, height: plazaSize },
    type: 'gathering',
    interactions: ['trade', 'socialize', 'hear_news', 'watch_performance']
  });
  
  interactionZones.push({
    id: 'craft_quarter',
    bounds: { x: 3, y: 3, width: 12, height: 12 },
    type: 'workshop',
    interactions: ['commission_craft', 'watch_artisan', 'buy_pottery']
  });
}

/**
 * Generate European market square
 */
function generateEuropeanMarket(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[]
) {
  // Stone walls with arched gates
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'north', offset: Math.floor(size.width / 2) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  // Cobblestone floor
  const floorType = config.era === HistoricalEra.MEDIEVAL ? BiomeType.FLOOR_STONE : 
                    config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN ? BiomeType.FLOOR_MARBLE :
                    BiomeType.FLOOR_TILE;
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, floorType);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Medieval: Market cross or Renaissance: Fountain
  if (config.era === HistoricalEra.MEDIEVAL) {
    tiles[centerY][centerX].biome = BiomeType.STATUE;
    tiles[centerY][centerX].materialSubtype = 'market_cross';
  } else {
    // Renaissance fountain
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= 2) {
          tiles[centerY + dy][centerX + dx].biome = BiomeType.WATER;
        }
      }
    }
    tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
  }
  
  // Guild halls and shops around perimeter
  createGuildHalls(tiles, config, noise, size);
  
  // Market stalls in organized rows
  createEuropeanMarketStalls(tiles, config, noise, size);
  
  // Add architectural elements
  addEuropeanDecorations(tiles, config, noise, size);
  
  // Interaction zones
  interactionZones.push({
    id: 'market_square',
    bounds: { x: centerX - 12, y: centerY - 12, width: 24, height: 24 },
    type: 'market',
    interactions: ['trade', 'hire_worker', 'hear_proclamation', 'watch_execution']
  });
  
  interactionZones.push({
    id: 'guild_quarter',
    bounds: { x: 3, y: 3, width: 10, height: size.height - 6 },
    type: 'guild',
    interactions: ['join_guild', 'commission_work', 'learn_trade']
  });
}

/**
 * Default market generation
 */
function generateDefaultMarket(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
) {
  // Basic layout from original
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'north', offset: Math.floor(size.width / 2) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  fillArea(tiles, 1, 1, size.width - 2, size.height - 2, BiomeType.FLOOR_STONE);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create crossroads
  for (let y = 1; y < size.height - 1; y++) {
    tiles[y][centerX].biome = BiomeType.ROAD;
  }
  for (let x = 1; x < size.width - 1; x++) {
    tiles[centerY][x].biome = BiomeType.ROAD;
  }
  
  createBasicMarketStalls(tiles, noise, size, config);
  
  interactionZones.push({
    id: 'central_market',
    bounds: { x: centerX - 8, y: centerY - 8, width: 16, height: 16 },
    type: 'market',
    interactions: ['trade', 'haggle', 'browse']
  });
}

// Helper functions

function createCoveredPassages(tiles: Tile[][], centerX: number, centerY: number, size: any, noise: ValueNoise) {
  // Create covered walkways with pillars
  const passages = [
    { startX: centerX - 6, startY: 3, endX: centerX - 6, endY: centerY - 7 },
    { startX: centerX + 6, startY: 3, endX: centerX + 6, endY: centerY - 7 },
    { startX: centerX - 6, startY: centerY + 7, endX: centerX - 6, endY: size.height - 3 },
    { startX: centerX + 6, startY: centerY + 7, endX: centerX + 6, endY: size.height - 3 },
    { startX: 3, startY: centerY - 6, endX: centerX - 7, endY: centerY - 6 },
    { startX: centerX + 7, startY: centerY - 6, endX: size.width - 3, endY: centerY - 6 },
    { startX: 3, startY: centerY + 6, endX: centerX - 7, endY: centerY + 6 },
    { startX: centerX + 7, startY: centerY + 6, endX: size.width - 3, endY: centerY + 6 }
  ];
  
  passages.forEach(passage => {
    if (passage.startX === passage.endX) {
      // Vertical passage
      for (let y = Math.min(passage.startY, passage.endY); y <= Math.max(passage.startY, passage.endY); y++) {
        tiles[y][passage.startX].biome = BiomeType.ROAD;
        // Add pillars on sides
        if (y % 4 === 0) {
          if (passage.startX - 2 > 0) tiles[y][passage.startX - 2].biome = BiomeType.PILLAR;
          if (passage.startX + 2 < size.width) tiles[y][passage.startX + 2].biome = BiomeType.PILLAR;
        }
      }
    } else {
      // Horizontal passage
      for (let x = Math.min(passage.startX, passage.endX); x <= Math.max(passage.startX, passage.endX); x++) {
        tiles[passage.startY][x].biome = BiomeType.ROAD;
        // Add pillars on sides
        if (x % 4 === 0) {
          if (passage.startY - 2 > 0) tiles[passage.startY - 2][x].biome = BiomeType.PILLAR;
          if (passage.startY + 2 < size.height) tiles[passage.startY + 2][x].biome = BiomeType.PILLAR;
        }
      }
    }
  });
}

function createMerchantStalls(tiles: Tile[][], config: SpecialMapConfig, noise: ValueNoise, size: any, style: string) {
  // Create different types of stalls based on style
  const stallLocations = [];
  
  // Find suitable locations along walls and passages
  for (let y = 3; y < size.height - 3; y += 3) {
    for (let x = 3; x < size.width - 3; x += 3) {
      if (tiles[y][x].biome === BiomeType.FLOOR_STONE || tiles[y][x].biome === BiomeType.FLOOR_TILE) {
        // Check if near a wall or passage
        let nearStructure = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (tiles[y + dy][x + dx].biome === BiomeType.WALL || 
                tiles[y + dy][x + dx].biome === BiomeType.ROAD) {
              nearStructure = true;
            }
          }
        }
        
        if (nearStructure && noise.random() > 0.4) {
          stallLocations.push({ x, y });
        }
      }
    }
  }
  
  // Place stalls
  stallLocations.forEach(loc => {
    tiles[loc.y][loc.x].biome = BiomeType.TABLE;
    
    // Add goods based on culture
    if (style === 'islamic') {
      // Carpets near some stalls
      if (noise.random() > 0.5) {
        if (tiles[loc.y + 1][loc.x].biome.includes('FLOOR')) {
          tiles[loc.y + 1][loc.x].biome = BiomeType.CARPET;
        }
      }
      // Barrels for storage
      if (noise.random() > 0.6 && tiles[loc.y][loc.x + 1].biome.includes('FLOOR')) {
        tiles[loc.y][loc.x + 1].biome = BiomeType.BARREL;
      }
    }
  });
}

function addIslamicDecorations(tiles: Tile[][], noise: ValueNoise, size: any) {
  // Add carpets in key areas
  for (let y = 5; y < size.height - 5; y += 8) {
    for (let x = 5; x < size.width - 5; x += 8) {
      if (tiles[y][x].biome.includes('FLOOR') && noise.random() > 0.5) {
        // 2x2 carpet area
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            if (tiles[y + dy][x + dx].biome.includes('FLOOR')) {
              tiles[y + dy][x + dx].biome = BiomeType.CARPET;
            }
          }
        }
      }
    }
  }
  
  // Add braziers for light
  for (let y = 10; y < size.height - 10; y += 12) {
    for (let x = 10; x < size.width - 10; x += 12) {
      if (tiles[y][x].biome.includes('FLOOR')) {
        tiles[y][x].biome = BiomeType.BRAZIER;
      }
    }
  }
}

function createAsianMarketSections(tiles: Tile[][], config: SpecialMapConfig, noise: ValueNoise, size: any) {
  // Organized sections with clear divisions
  const sections = [
    { x: 3, y: 15, width: 12, height: 8, type: 'food' },
    { x: size.width - 15, y: 15, width: 12, height: 8, type: 'crafts' },
    { x: 3, y: size.height - 12, width: 12, height: 8, type: 'textiles' },
    { x: size.width - 15, y: size.height - 12, width: 12, height: 8, type: 'tools' }
  ];
  
  sections.forEach(section => {
    // Create section boundary
    placeWallRectangle(tiles, section.x, section.y, section.width, section.height, [
      { side: 'south', offset: section.width / 2 }
    ]);
    
    // Fill with appropriate floor
    fillArea(tiles, section.x + 1, section.y + 1, section.width - 2, section.height - 2, BiomeType.FLOOR_WOOD);
    
    // Add stalls
    for (let y = section.y + 2; y < section.y + section.height - 2; y += 3) {
      for (let x = section.x + 2; x < section.x + section.width - 2; x += 3) {
        if (noise.random() > 0.3) {
          tiles[y][x].biome = BiomeType.TABLE;
          // Add storage
          if (noise.random() > 0.5 && x + 1 < section.x + section.width - 1) {
            tiles[y][x + 1].biome = BiomeType.CHEST;
          }
        }
      }
    }
  });
}

function addAsianDecorations(tiles: Tile[][], noise: ValueNoise, size: any) {
  // Add lanterns (using torches with special subtype)
  for (let y = 5; y < size.height - 5; y += 10) {
    for (let x = 5; x < size.width - 5; x += 10) {
      if (tiles[y][x].biome.includes('FLOOR') || tiles[y][x].biome === BiomeType.ROAD) {
        tiles[y][x].biome = BiomeType.TORCH;
        tiles[y][x].materialSubtype = 'lantern';
      }
    }
  }
}

function createShadeStructures(tiles: Tile[][], noise: ValueNoise, size: any) {
  // Create open-sided structures with posts
  const structures = [
    { x: 8, y: 8, width: 8, height: 6 },
    { x: size.width - 16, y: 8, width: 8, height: 6 },
    { x: 8, y: size.height - 14, width: 8, height: 6 },
    { x: size.width - 16, y: size.height - 14, width: 8, height: 6 }
  ];
  
  structures.forEach(struct => {
    // Corner posts only
    tiles[struct.y][struct.x].biome = BiomeType.PILLAR;
    tiles[struct.y][struct.x + struct.width - 1].biome = BiomeType.PILLAR;
    tiles[struct.y + struct.height - 1][struct.x].biome = BiomeType.PILLAR;
    tiles[struct.y + struct.height - 1][struct.x + struct.width - 1].biome = BiomeType.PILLAR;
    
    // Market tables under shade
    for (let y = struct.y + 1; y < struct.y + struct.height - 1; y += 2) {
      for (let x = struct.x + 1; x < struct.x + struct.width - 1; x += 3) {
        tiles[y][x].biome = BiomeType.TABLE;
      }
    }
  });
}

function createCircularMarketLayout(tiles: Tile[][], centerX: number, centerY: number, noise: ValueNoise, size: any) {
  // Create circular arrangement of market areas
  const radius = 20;
  const numStalls = 16;
  
  for (let i = 0; i < numStalls; i++) {
    const angle = (i / numStalls) * Math.PI * 2;
    const x = Math.floor(centerX + Math.cos(angle) * radius);
    const y = Math.floor(centerY + Math.sin(angle) * radius);
    
    if (x > 2 && x < size.width - 3 && y > 2 && y < size.height - 3) {
      // Place market furniture
      tiles[y][x].biome = BiomeType.TABLE;
      
      // Add storage nearby
      const dx = Math.sign(Math.cos(angle + Math.PI / 2));
      const dy = Math.sign(Math.sin(angle + Math.PI / 2));
      if (tiles[y + dy]?.[x + dx] && tiles[y + dy][x + dx].biome === BiomeType.DIRT) {
        tiles[y + dy][x + dx].biome = noise.random() > 0.5 ? BiomeType.BARREL : BiomeType.CHEST;
      }
    }
  }
}

function createCraftAreas(tiles: Tile[][], config: SpecialMapConfig, noise: ValueNoise, size: any) {
  // Pottery and craft areas
  const craftArea = { x: 3, y: 3, width: 12, height: 12 };
  
  // Create workshop spaces
  for (let y = craftArea.y; y < craftArea.y + craftArea.height; y += 4) {
    for (let x = craftArea.x; x < craftArea.x + craftArea.width; x += 4) {
      if (x + 3 < size.width && y + 3 < size.height) {
        // Workshop boundary (partial walls)
        tiles[y][x].biome = BiomeType.PILLAR;
        tiles[y][x + 3].biome = BiomeType.PILLAR;
        tiles[y + 3][x].biome = BiomeType.PILLAR;
        tiles[y + 3][x + 3].biome = BiomeType.PILLAR;
        
        // Work table
        tiles[y + 1][x + 1].biome = BiomeType.TABLE;
        
        // Storage
        tiles[y + 2][x + 1].biome = BiomeType.BARREL;
      }
    }
  }
}

function createGuildHalls(tiles: Tile[][], config: SpecialMapConfig, noise: ValueNoise, size: any) {
  // Create guild buildings along the edges
  const guilds = [
    { x: 3, y: 3, width: 10, height: 8, name: 'Merchants' },
    { x: size.width - 13, y: 3, width: 10, height: 8, name: 'Smiths' },
    { x: 3, y: size.height - 11, width: 10, height: 8, name: 'Weavers' },
    { x: size.width - 13, y: size.height - 11, width: 10, height: 8, name: 'Bakers' }
  ];
  
  guilds.forEach(guild => {
    // Guild hall walls
    placeWallRectangle(tiles, guild.x, guild.y, guild.width, guild.height, [
      { side: 'south', offset: guild.width / 2 }
    ]);
    
    // Interior
    fillArea(tiles, guild.x + 1, guild.y + 1, guild.width - 2, guild.height - 2, BiomeType.FLOOR_WOOD);
    
    // Guild furniture
    tiles[guild.y + 2][guild.x + guild.width / 2].biome = BiomeType.DESK;
    tiles[guild.y + 4][guild.x + 2].biome = BiomeType.CHAIR;
    tiles[guild.y + 4][guild.x + guild.width - 3].biome = BiomeType.CHAIR;
    
    // Storage
    tiles[guild.y + guild.height - 2][guild.x + 2].biome = BiomeType.CHEST;
    tiles[guild.y + guild.height - 2][guild.x + guild.width - 3].biome = BiomeType.BARREL;
  });
}

function createEuropeanMarketStalls(tiles: Tile[][], config: SpecialMapConfig, noise: ValueNoise, size: any) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create organized rows of stalls
  const rows = [
    { y: centerY - 8, startX: centerX - 15, endX: centerX - 4 },
    { y: centerY - 8, startX: centerX + 4, endX: centerX + 15 },
    { y: centerY + 8, startX: centerX - 15, endX: centerX - 4 },
    { y: centerY + 8, startX: centerX + 4, endX: centerX + 15 }
  ];
  
  rows.forEach(row => {
    for (let x = row.startX; x <= row.endX; x += 3) {
      if (tiles[row.y][x].biome.includes('FLOOR')) {
        // Stall with canopy (represented by partial walls)
        tiles[row.y][x].biome = BiomeType.TABLE;
        
        // Add goods
        if (noise.random() > 0.5 && tiles[row.y - 1][x].biome.includes('FLOOR')) {
          tiles[row.y - 1][x].biome = BiomeType.BARREL;
        }
        if (noise.random() > 0.5 && tiles[row.y + 1][x].biome.includes('FLOOR')) {
          tiles[row.y + 1][x].biome = BiomeType.CHEST;
        }
      }
    }
  });
}

function addEuropeanDecorations(tiles: Tile[][], config: SpecialMapConfig, noise: ValueNoise, size: any) {
  // Add columns for Renaissance/later periods
  if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN || 
      config.era === HistoricalEra.INDUSTRIAL_ERA) {
    // Colonnade around market square
    for (let x = 10; x < size.width - 10; x += 6) {
      if (tiles[10][x].biome.includes('FLOOR')) {
        tiles[10][x].biome = BiomeType.PILLAR;
      }
      if (tiles[size.height - 11][x].biome.includes('FLOOR')) {
        tiles[size.height - 11][x].biome = BiomeType.PILLAR;
      }
    }
    
    for (let y = 10; y < size.height - 10; y += 6) {
      if (tiles[y][10].biome.includes('FLOOR')) {
        tiles[y][10].biome = BiomeType.PILLAR;
      }
      if (tiles[y][size.width - 11].biome.includes('FLOOR')) {
        tiles[y][size.width - 11].biome = BiomeType.PILLAR;
      }
    }
  }
  
  // Add statues for classical feel
  if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    const statuePositions = [
      { x: 15, y: 15 },
      { x: size.width - 16, y: 15 },
      { x: 15, y: size.height - 16 },
      { x: size.width - 16, y: size.height - 16 }
    ];
    
    statuePositions.forEach(pos => {
      if (tiles[pos.y][pos.x].biome.includes('FLOOR')) {
        tiles[pos.y][pos.x].biome = BiomeType.STATUE;
      }
    });
  }
  
  // Add torches for medieval period
  if (config.era === HistoricalEra.MEDIEVAL) {
    for (let y = 5; y < size.height - 5; y += 10) {
      for (let x = 5; x < size.width - 5; x += 10) {
        if (tiles[y][x].biome === BiomeType.WALL) {
          // Wall torch
          tiles[y][x].materialSubtype = 'wall_torch';
        } else if (tiles[y][x].biome.includes('FLOOR')) {
          tiles[y][x].biome = BiomeType.TORCH;
        }
      }
    }
  }
}

function createBasicMarketStalls(tiles: Tile[][], noise: ValueNoise, size: any, config: SpecialMapConfig) {
  console.log('[MarketStalls] Creating stalls for era:', config.era, 'culture:', config.culturalZone);
  
  // Create organized market rows instead of random placement
  const stallRows = [];
  const rowSpacing = 6;
  const stallSpacing = 4;
  
  // Define market areas - leave center and edges clear
  for (let y = 8; y < size.height - 8; y += rowSpacing) {
    const row = [];
    for (let x = 8; x < size.width - 8; x += stallSpacing) {
      // Skip center area for fountain/gathering
      const centerX = Math.floor(size.width / 2);
      const centerY = Math.floor(size.height / 2);
      if (Math.abs(x - centerX) < 6 && Math.abs(y - centerY) < 6) continue;
      
      if (tiles[y][x].biome.includes('FLOOR') && noise.random() > 0.2) {
        // Use appropriate stall type based on era
        if (config.era === HistoricalEra.PREHISTORY) {
          // Simple ground displays
          tiles[y][x].biome = BiomeType.CHEST; // Baskets/containers
        } else if (config.era === HistoricalEra.MODERN_ERA || config.era === HistoricalEra.CONTEMPORARY) {
          // Modern stands
          tiles[y][x].biome = BiomeType.TABLE;
          // Add signage (statue as placeholder for now)
          if (noise.random() > 0.7 && tiles[y-1]?.[x]) {
            tiles[y-1][x].biome = BiomeType.PLAZA; // Use plaza to indicate modern paving
          }
        } else {
          // Historical markets - tables and goods
          tiles[y][x].biome = BiomeType.TABLE;
        }
        
        row.push({x, y});
        
        // Add storage/goods display
        if (noise.random() > 0.4) {
          const dx = noise.random() > 0.5 ? 1 : -1;
          if (tiles[y]?.[x + dx]?.biome.includes('FLOOR')) {
            tiles[y][x + dx].biome = noise.random() > 0.5 ? BiomeType.BARREL : BiomeType.CHEST;
          }
        }
      }
    }
    if (row.length > 0) stallRows.push(row);
  }
  
  console.log('[MarketStalls] Created', stallRows.length, 'rows of stalls');
}