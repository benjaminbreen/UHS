/**
 * generation/specialMap/archetypes/palaceGeneratorEnhanced.ts
 * Enhanced generator for beautiful, realistic palace complex special maps
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';

export function generateEnhancedPalaceComplex(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  // Choose layout based on culture
  if (config.culturalZone === 'EAST_ASIAN') {
    generateEastAsianPalace(tiles, config, noise, size, interactionZones, exitZones, rooms);
  } else if (config.culturalZone === 'MENA') {
    generateIslamicPalace(tiles, config, noise, size, interactionZones, exitZones, rooms);
  } else if (config.culturalZone === 'EUROPEAN') {
    generateEuropeanPalace(tiles, config, noise, size, interactionZones, exitZones, rooms);
  } else {
    generateGenericPalace(tiles, config, noise, size, interactionZones, exitZones, rooms);
  }
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Generate East Asian palace complex (Chinese Forbidden City / Japanese Imperial Palace style)
 */
function generateEastAsianPalace(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
) {
  // Fill with stone courtyard
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_STONE);
  
  // Outer walls with traditional gates
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }, // Main south gate (Meridian Gate)
    { side: 'north', offset: Math.floor(size.width / 2) },
    { side: 'east', offset: Math.floor(size.height / 2) },
    { side: 'west', offset: Math.floor(size.height / 2) }
  ]);
  
  // Central axis - main ceremonial path
  const axisX = Math.floor(size.width / 2);
  for (let y = 1; y < size.height - 1; y++) {
    tiles[y][axisX].biome = BiomeType.FLOOR_MARBLE;
    if (axisX > 0) tiles[y][axisX - 1].biome = BiomeType.FLOOR_MARBLE;
    if (axisX < size.width - 1) tiles[y][axisX + 1].biome = BiomeType.FLOOR_MARBLE;
  }
  
  // Three main halls along central axis
  const hallPositions = [
    { y: size.height - 15, name: 'Gate of Supreme Harmony' },
    { y: Math.floor(size.height / 2), name: 'Hall of Central Harmony' },
    { y: 8, name: 'Hall of Preserving Harmony' }
  ];
  
  hallPositions.forEach((hall, index) => {
    const hallWidth = 20 - index * 2;
    const hallHeight = 12 - index;
    const hallX = Math.floor((size.width - hallWidth) / 2);
    
    // Hall platform (raised)
    fillArea(tiles, hallX - 1, hall.y - 1, hallWidth + 2, hallHeight + 2, BiomeType.FLOOR_MARBLE);
    
    // Hall walls
    placeWallRectangle(tiles, hallX, hall.y, hallWidth, hallHeight, [
      { side: 'south', offset: Math.floor(hallWidth / 2) }
    ]);
    
    // Hall interior
    fillArea(tiles, hallX + 1, hall.y + 1, hallWidth - 2, hallHeight - 2, BiomeType.FLOOR_WOOD);
    
    // Add room definition for this hall
    const roomType = index === 1 ? 'throne_room' : 'hall';
    rooms.push({
      id: `hall_${index}`,
      name: hall.name,
      bounds: { x: hallX, y: hall.y, width: hallWidth, height: hallHeight },
      description: index === 1 ? 'The grand throne room where imperial audiences are held' : 
                   index === 0 ? 'The ceremonial entrance hall' : 'A harmony hall for imperial ceremonies',
      roomType: roomType
    });
    
    // Throne in main hall
    if (index === 1) {
      const throneX = hallX + Math.floor(hallWidth / 2);
      const throneY = hall.y + 2;
      tiles[throneY][throneX].biome = BiomeType.THRONE;
      
      // Dragons pillars flanking throne
      tiles[throneY][throneX - 2].biome = BiomeType.PILLAR;
      tiles[throneY][throneX + 2].biome = BiomeType.PILLAR;
      
      // Carpet leading to throne
      for (let y = hall.y + 4; y < hall.y + hallHeight - 1; y++) {
        tiles[y][throneX].biome = BiomeType.CARPET;
      }
      
      interactionZones.push({
        id: 'throne_hall',
        bounds: { x: hallX, y: hall.y, width: hallWidth, height: hallHeight },
        type: 'throne',
        interactions: ['audience', 'ceremony', 'decree']
      });
    }
    
    // Add pillars
    for (let x = hallX + 3; x < hallX + hallWidth - 3; x += 3) {
      if (tiles[hall.y + 3]?.[x]) tiles[hall.y + 3][x].biome = BiomeType.PILLAR;
      if (tiles[hall.y + hallHeight - 3]?.[x]) tiles[hall.y + hallHeight - 3][x].biome = BiomeType.PILLAR;
    }
  });
  
  // Side gardens with pavilions
  generateChineseGarden(tiles, 5, 5, 15, 20, 'west');
  rooms.push({
    id: 'west_garden',
    name: 'Garden of Tranquil Longevity',
    bounds: { x: 5, y: 5, width: 15, height: 20 },
    description: 'A peaceful garden with ponds and pavilions',
    roomType: 'garden'
  });
  
  generateChineseGarden(tiles, size.width - 20, 5, 15, 20, 'east');
  rooms.push({
    id: 'east_garden',
    name: 'Garden of Eternal Spring',
    bounds: { x: size.width - 20, y: 5, width: 15, height: 20 },
    description: 'An ornamental garden with rare plants and rock formations',
    roomType: 'garden'
  });
  
  // Living quarters in the back (north)
  generateLivingQuarters(tiles, 10, 3, size.width - 20, 8, config);
  rooms.push({
    id: 'living_quarters',
    name: 'Imperial Residence',
    bounds: { x: 10, y: 3, width: size.width - 20, height: 8 },
    description: 'Private chambers of the imperial family',
    roomType: 'chamber'
  });
  
  // Add main courtyard as a room
  rooms.push({
    id: 'main_courtyard',
    name: 'Central Courtyard',
    bounds: { x: 20, y: 25, width: size.width - 40, height: size.height - 35 },
    description: 'The vast ceremonial courtyard',
    roomType: 'courtyard'
  });
  
  // Add decorative elements
  addEastAsianDecorations(tiles, config, noise, size);
  
  // Exit zones
  exitZones.push(
    { id: 'main_gate', location: [axisX, size.height - 1], label: 'Meridian Gate', destination: 'parent_map' },
    { id: 'north_gate', location: [axisX, 0], label: 'Gate of Divine Might', destination: 'parent_map' }
  );
}

/**
 * Generate Chinese garden with geometric patterns
 */
function generateChineseGarden(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  side: 'east' | 'west'
) {
  console.log('[Garden] Creating Chinese garden at', x, y, 'size', width, 'x', height);
  
  // Garden grounds - use park as base
  fillArea(tiles, x, y, width, height, BiomeType.PARK);
  
  // Create geometric path pattern with volcanic soil as path borders
  // Central axis path
  const centerX = x + Math.floor(width / 2);
  for (let py = y + 1; py < y + height - 1; py++) {
    if (tiles[py]?.[centerX]) {
      tiles[py][centerX].biome = BiomeType.ROAD; // Stone path
      // Path borders
      if (tiles[py][centerX - 1]) tiles[py][centerX - 1].biome = BiomeType.VOLCANIC_SOIL;
      if (tiles[py][centerX + 1]) tiles[py][centerX + 1].biome = BiomeType.VOLCANIC_SOIL;
    }
  }
  
  // Cross path
  const centerY = y + Math.floor(height / 2);
  for (let px = x + 1; px < x + width - 1; px++) {
    if (tiles[centerY]?.[px]) {
      tiles[centerY][px].biome = BiomeType.ROAD;
      // Path borders
      if (tiles[centerY - 1]?.[px]) tiles[centerY - 1][px].biome = BiomeType.VOLCANIC_SOIL;
      if (tiles[centerY + 1]?.[px]) tiles[centerY + 1][px].biome = BiomeType.VOLCANIC_SOIL;
    }
  }
  
  // Pond in center with geometric shape
  const pondX = x + Math.floor(width / 2) - 2;
  const pondY = y + Math.floor(height / 2) - 2;
  fillArea(tiles, pondX, pondY, 5, 5, BiomeType.WATER);
  
  // Pavilion
  const pavilionX = side === 'west' ? x + 2 : x + width - 6;
  const pavilionY = y + Math.floor(height / 2) - 2;
  placeWallRectangle(tiles, pavilionX, pavilionY, 4, 4);
  fillArea(tiles, pavilionX + 1, pavilionY + 1, 2, 2, BiomeType.FLOOR_WOOD);
  
  // Rock formations (decorative)
  tiles[pondY - 1][pondX + 2].biome = BiomeType.STATUE;
  tiles[pondY + 5][pondX + 2].biome = BiomeType.STATUE;
  
  // Bridge over pond
  tiles[pondY + 2][pondX - 1].biome = BiomeType.FLOOR_WOOD;
  tiles[pondY + 2][pondX + 5].biome = BiomeType.FLOOR_WOOD;
}

/**
 * Generate Islamic palace (Alhambra style)
 */
function generateIslamicPalace(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  exitZones: ExitZone[]
) {
  // Fill with decorative tile
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_TILE);
  
  // Outer walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) }
  ]);
  
  // Court of Lions style central courtyard
  const courtX = Math.floor(size.width / 3);
  const courtY = Math.floor(size.height / 3);
  const courtWidth = Math.floor(size.width / 3);
  const courtHeight = Math.floor(size.height / 3);
  
  // Courtyard with colonnade
  for (let x = courtX; x < courtX + courtWidth; x += 2) {
    tiles[courtY][x].biome = BiomeType.PILLAR;
    tiles[courtY + courtHeight - 1][x].biome = BiomeType.PILLAR;
  }
  for (let y = courtY; y < courtY + courtHeight; y += 2) {
    tiles[y][courtX].biome = BiomeType.PILLAR;
    tiles[y][courtX + courtWidth - 1].biome = BiomeType.PILLAR;
  }
  
  // Central fountain
  const fountainX = courtX + Math.floor(courtWidth / 2);
  const fountainY = courtY + Math.floor(courtHeight / 2);
  tiles[fountainY][fountainX].biome = BiomeType.FOUNTAIN;
  
  // Water channels in cross pattern
  for (let x = courtX + 2; x < courtX + courtWidth - 2; x++) {
    if (tiles[fountainY][x].biome === BiomeType.FLOOR_TILE) {
      tiles[fountainY][x].biome = BiomeType.WATER;
    }
  }
  for (let y = courtY + 2; y < courtY + courtHeight - 2; y++) {
    if (tiles[y][fountainX].biome === BiomeType.FLOOR_TILE) {
      tiles[y][fountainX].biome = BiomeType.WATER;
    }
  }
  
  // Hall of Ambassadors (throne room)
  const throneHallX = 5;
  const throneHallY = 5;
  placeWallRectangle(tiles, throneHallX, throneHallY, 15, 12, [
    { side: 'south', offset: 7 }
  ]);
  fillArea(tiles, throneHallX + 1, throneHallY + 1, 13, 10, BiomeType.FLOOR_MARBLE);
  
  // Throne and decorations
  tiles[throneHallY + 2][throneHallX + 7].biome = BiomeType.THRONE;
  tiles[throneHallY + 2][throneHallX + 5].biome = BiomeType.PILLAR;
  tiles[throneHallY + 2][throneHallX + 9].biome = BiomeType.PILLAR;
  
  // Ornate carpet
  for (let y = throneHallY + 4; y < throneHallY + 10; y++) {
    for (let x = throneHallX + 5; x < throneHallX + 10; x++) {
      tiles[y][x].biome = BiomeType.CARPET;
    }
  }
  
  // Side halls with geometric patterns
  generateIslamicHall(tiles, size.width - 18, 8, 15, 10, 'prayer');
  generateIslamicHall(tiles, size.width - 18, size.height - 18, 15, 10, 'reception');
  
  // Gardens
  fillArea(tiles, 3, size.height - 12, 10, 10, BiomeType.PARK);
  tiles[size.height - 7][8].biome = BiomeType.FOUNTAIN;
  
  interactionZones.push({
    id: 'throne_hall',
    bounds: { x: throneHallX, y: throneHallY, width: 15, height: 12 },
    type: 'throne',
    interactions: ['audience', 'ceremony', 'feast']
  });
  
  exitZones.push({
    id: 'main_gate',
    location: [Math.floor(size.width / 2), size.height - 1],
    label: 'Palace Gate',
    destination: 'parent_map'
  });
}

/**
 * Generate Islamic hall with decorations
 */
function generateIslamicHall(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  type: 'prayer' | 'reception'
) {
  placeWallRectangle(tiles, x, y, width, height, [
    { side: 'west', offset: Math.floor(height / 2) }
  ]);
  fillArea(tiles, x + 1, y + 1, width - 2, height - 2, BiomeType.FLOOR_MARBLE);
  
  if (type === 'prayer') {
    // Prayer niche (mihrab)
    tiles[y + 2][x + width - 2].biome = BiomeType.ALTAR;
    // Prayer carpets
    for (let py = y + 3; py < y + height - 2; py += 2) {
      for (let px = x + 2; px < x + width - 3; px += 3) {
        tiles[py][px].biome = BiomeType.CARPET;
      }
    }
  } else {
    // Reception hall - seating areas
    for (let px = x + 2; px < x + width - 2; px += 4) {
      tiles[y + 2][px].biome = BiomeType.CHAIR;
      tiles[y + height - 3][px].biome = BiomeType.CHAIR;
    }
    // Central table
    tiles[y + Math.floor(height / 2)][x + Math.floor(width / 2)].biome = BiomeType.TABLE;
  }
}

/**
 * Generate European palace (Versailles style)
 */
function generateEuropeanPalace(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  exitZones: ExitZone[]
) {
  // Fill with marble floors
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_MARBLE);
  
  // Outer walls
  placeWallRectangle(tiles, 0, 0, size.width, size.height, [
    { side: 'south', offset: Math.floor(size.width / 2) },
    { side: 'north', offset: Math.floor(size.width / 2) }
  ]);
  
  // Hall of Mirrors (central gallery)
  const galleryY = Math.floor(size.height / 2) - 5;
  const galleryHeight = 10;
  placeWallRectangle(tiles, 5, galleryY, size.width - 10, galleryHeight, [
    { side: 'west', offset: 5 },
    { side: 'east', offset: 5 }
  ]);
  
  // Gallery interior
  fillArea(tiles, 6, galleryY + 1, size.width - 12, galleryHeight - 2, BiomeType.FLOOR_MARBLE);
  
  // Columns along gallery
  for (let x = 10; x < size.width - 10; x += 4) {
    tiles[galleryY + 2][x].biome = BiomeType.PILLAR;
    tiles[galleryY + galleryHeight - 3][x].biome = BiomeType.PILLAR;
  }
  
  // Throne room
  const throneRoomX = Math.floor(size.width / 2) - 8;
  const throneRoomY = 3;
  placeWallRectangle(tiles, throneRoomX, throneRoomY, 16, 10, [
    { side: 'south', offset: 8 }
  ]);
  fillArea(tiles, throneRoomX + 1, throneRoomY + 1, 14, 8, BiomeType.FLOOR_WOOD);
  
  // Throne setup
  tiles[throneRoomY + 2][throneRoomX + 8].biome = BiomeType.THRONE;
  // Red carpet to throne
  for (let y = throneRoomY + 3; y < throneRoomY + 9; y++) {
    tiles[y][throneRoomX + 8].biome = BiomeType.CARPET;
    tiles[y][throneRoomX + 7].biome = BiomeType.CARPET;
    tiles[y][throneRoomX + 9].biome = BiomeType.CARPET;
  }
  
  // Royal apartments
  generateRoyalApartments(tiles, 5, size.height - 18, 20, 15, 'west');
  generateRoyalApartments(tiles, size.width - 25, size.height - 18, 20, 15, 'east');
  
  // Formal gardens
  const gardenY = galleryY + galleryHeight + 3;
  fillArea(tiles, 10, gardenY, size.width - 20, 8, BiomeType.PARK);
  
  // Fountains in gardens
  tiles[gardenY + 4][15].biome = BiomeType.FOUNTAIN;
  tiles[gardenY + 4][size.width - 15].biome = BiomeType.FOUNTAIN;
  tiles[gardenY + 4][Math.floor(size.width / 2)].biome = BiomeType.FOUNTAIN;
  
  interactionZones.push({
    id: 'throne_room',
    bounds: { x: throneRoomX, y: throneRoomY, width: 16, height: 10 },
    type: 'throne',
    interactions: ['audience', 'ceremony', 'court']
  });
  
  interactionZones.push({
    id: 'hall_of_mirrors',
    bounds: { x: 5, y: galleryY, width: size.width - 10, height: galleryHeight },
    type: 'social',
    interactions: ['dance', 'feast', 'reception']
  });
  
  exitZones.push({
    id: 'main_entrance',
    location: [Math.floor(size.width / 2), size.height - 1],
    label: 'Palace Entrance',
    destination: 'parent_map'
  });
}

/**
 * Generate royal apartments
 */
function generateRoyalApartments(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  wing: 'east' | 'west'
) {
  placeWallRectangle(tiles, x, y, width, height, [
    { side: 'north', offset: Math.floor(width / 2) }
  ]);
  
  // Bedroom
  const bedX = x + (wing === 'west' ? 2 : width - 5);
  const bedY = y + 2;
  placeWallRectangle(tiles, bedX, bedY, 6, 5);
  fillArea(tiles, bedX + 1, bedY + 1, 4, 3, BiomeType.FLOOR_WOOD);
  tiles[bedY + 2][bedX + 2].biome = BiomeType.BED;
  
  // Study
  const studyX = x + (wing === 'west' ? 10 : 2);
  const studyY = y + 2;
  placeWallRectangle(tiles, studyX, studyY, 6, 5);
  fillArea(tiles, studyX + 1, studyY + 1, 4, 3, BiomeType.FLOOR_WOOD);
  tiles[studyY + 2][studyX + 2].biome = BiomeType.DESK;
  tiles[studyY + 2][studyX + 4].biome = BiomeType.BOOKSHELF;
  
  // Sitting room
  const sittingX = x + Math.floor(width / 2) - 3;
  const sittingY = y + 8;
  placeWallRectangle(tiles, sittingX, sittingY, 6, 5);
  fillArea(tiles, sittingX + 1, sittingY + 1, 4, 3, BiomeType.FLOOR_CARPET);
  tiles[sittingY + 2][sittingX + 2].biome = BiomeType.CHAIR;
  tiles[sittingY + 2][sittingX + 3].biome = BiomeType.TABLE;
  tiles[sittingY + 2][sittingX + 4].biome = BiomeType.CHAIR;
}

/**
 * Generate living quarters
 */
function generateLivingQuarters(
  tiles: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number,
  config: SpecialMapConfig
) {
  // Row of small chambers
  const numChambers = Math.floor(width / 6);
  for (let i = 0; i < numChambers; i++) {
    const chamberX = x + i * 6;
    placeWallRectangle(tiles, chamberX, y, 5, height);
    fillArea(tiles, chamberX + 1, y + 1, 3, height - 2, BiomeType.FLOOR_WOOD);
    
    // Furniture
    tiles[y + 2][chamberX + 2].biome = BiomeType.BED;
    tiles[y + height - 3][chamberX + 2].biome = BiomeType.CHEST;
  }
}

/**
 * Add East Asian decorative elements
 */
function addEastAsianDecorations(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
) {
  console.log('[Decorations] Adding East Asian decorations for era:', config.era);
  
  // Era-specific decorations
  if (config.era === HistoricalEra.PREHISTORY || config.era === HistoricalEra.ANTIQUITY) {
    // Ancient period - simpler decorations
    // Bronze cauldrons
    const positions = [
      { x: 8, y: size.height - 8 },
      { x: size.width - 8, y: size.height - 8 }
    ];
    
    positions.forEach(pos => {
      if (tiles[pos.y]?.[pos.x]?.biome === BiomeType.FLOOR_STONE) {
        tiles[pos.y][pos.x].biome = BiomeType.BRAZIER;
      }
    });
    
    // Simple stone markers
    if (tiles[size.height - 5]?.[Math.floor(size.width / 2)]) {
      tiles[size.height - 5][Math.floor(size.width / 2)].biome = BiomeType.STATUE;
    }
  } else if (config.era === HistoricalEra.MEDIEVAL || config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    // Peak imperial period - elaborate decorations
    // Bronze cauldrons/incense burners at corners
    const positions = [
      { x: 8, y: size.height - 8 },
      { x: size.width - 8, y: size.height - 8 },
      { x: 8, y: 8 },
      { x: size.width - 8, y: 8 }
    ];
    
    positions.forEach(pos => {
      if (tiles[pos.y]?.[pos.x]?.biome === BiomeType.FLOOR_STONE) {
        tiles[pos.y][pos.x].biome = BiomeType.BRAZIER;
      }
    });
    
    // Guardian lions/dragons at main entrances
    const centerX = Math.floor(size.width / 2);
    if (tiles[size.height - 5]?.[centerX - 3]) {
      tiles[size.height - 5][centerX - 3].biome = BiomeType.STATUE;
    }
    if (tiles[size.height - 5]?.[centerX + 3]) {
      tiles[size.height - 5][centerX + 3].biome = BiomeType.STATUE;
    }
    
    // Additional statues in courtyards
    for (let i = 0; i < 4; i++) {
      const sx = 15 + noise.random() * (size.width - 30);
      const sy = 15 + noise.random() * (size.height - 30);
      if (tiles[Math.floor(sy)]?.[Math.floor(sx)]?.biome === BiomeType.FLOOR_STONE) {
        tiles[Math.floor(sy)][Math.floor(sx)].biome = BiomeType.STATUE;
      }
    }
    
    // Fountains in gardens
    if (tiles[12]?.[12]?.biome === BiomeType.PARK) {
      tiles[12][12].biome = BiomeType.FOUNTAIN;
    }
    if (tiles[12]?.[size.width - 12]?.biome === BiomeType.PARK) {
      tiles[12][size.width - 12].biome = BiomeType.FOUNTAIN;
    }
  } else {
    // Modern period - mix of traditional and contemporary
    // Fewer braziers, more fountains
    if (tiles[size.height / 2]?.[size.width / 2]) {
      tiles[Math.floor(size.height / 2)][Math.floor(size.width / 2)].biome = BiomeType.FOUNTAIN;
    }
    
    // Modern statues
    const centerX = Math.floor(size.width / 2);
    if (tiles[size.height - 8]?.[centerX]) {
      tiles[size.height - 8][centerX].biome = BiomeType.STATUE;
    }
  }
}

/**
 * Generate generic palace for other cultures
 */
function generateGenericPalace(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number },
  interactionZones: InteractionZone[],
  exitZones: ExitZone[]
) {
  // Use the European style as default but simpler
  generateEuropeanPalace(tiles, config, noise, size, interactionZones, exitZones);
}