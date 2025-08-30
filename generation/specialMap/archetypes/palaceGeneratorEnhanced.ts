/**
 * generation/specialMap/archetypes/palaceGeneratorEnhanced.ts
 * Enhanced generator for beautiful, realistic palace complex special maps
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition, ProfessionCategory } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../specialMapGenerator';
import { generateContextualLandscape } from '../landscapeService';
import { buildThickWalls, getWallConfigForArchetype } from '../wallBuilder';
import { applyCulturalFlooring } from '../culturalFlooringService';

export function generateEnhancedPalaceComplex(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  // Palace should be substantial but not fill the entire map - leave space for gardens and courtyards
  const palaceWidth = Math.floor(size.width * 0.65);
  const palaceHeight = Math.floor(size.height * 0.6);
  const palaceX = Math.floor((size.width - palaceWidth) / 2);
  const palaceY = Math.floor((size.height - palaceHeight) / 2) - 2; // Slightly toward back for impressive approach
  
  const palaceBounds = { x: palaceX, y: palaceY, width: palaceWidth, height: palaceHeight };
  
  // Generate landscape first (gardens, courtyards, water features, etc.)
  generateContextualLandscape(tiles, config, noise, size, palaceBounds);
  
  // Get wall configuration for this palace
  const wallConfig = getWallConfigForArchetype('PALACE_COMPLEX', config.culturalZone, config.era);
  
  // Build the outer palace walls (2-3 tiles thick, decorative)
  buildThickWalls(tiles, palaceBounds, wallConfig, size);
  
  // Generate interior palace layout based on culture
  if (config.culturalZone === 'EAST_ASIAN') {
    generateEastAsianPalace(tiles, config, noise, size, interactionZones, exitZones, rooms);
  } else if (config.culturalZone === 'MENA') {
    generateIslamicPalace(tiles, config, noise, size, interactionZones, exitZones, rooms);
  } else if (config.culturalZone === 'EUROPEAN') {
    generateRealisticEuropeanPalace(tiles, palaceBounds, config, noise, rooms, interactionZones, exitZones, size);
  } else {
    // Use generic palace for other cultures
    generateGenericPalace(tiles, config, noise, size, interactionZones, exitZones, rooms);
  }
  
  // Main exit zones are now handled by culture-specific functions
  // If no exit zones were created, add a default one
  if (exitZones.length === 0) {
    exitZones.push({ 
      id: 'main_entrance', 
      location: [palaceX + Math.floor(palaceWidth / 2), palaceY + palaceHeight - 1], 
      label: 'Palace Gates', 
      destination: 'parent_map' 
    });
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
    
    // Add room definition for this hall with access metadata
    const roomType = index === 1 ? 'throne_room' : 'hall';
    rooms.push({
      id: `hall_${index}`,
      name: hall.name,
      bounds: { x: hallX, y: hall.y, width: hallWidth, height: hallHeight },
      description: index === 1 ? 'The grand throne room where imperial audiences are held' : 
                   index === 0 ? 'The ceremonial entrance hall' : 'A harmony hall for imperial ceremonies',
      roomType: roomType as any,
      // Access control
      accessLevel: index === 1 ? 'restricted' : 'semi-public',
      allowedSocialClasses: index === 1 ? ['NOBILITY', 'SCHOLAR_OFFICIAL'] : ['NOBILITY', 'SCHOLAR_OFFICIAL', 'MERCHANT'],
      professionFilter: index === 1 ? {
        category: [ProfessionCategory.NOBILITY, ProfessionCategory.OFFICIAL],
        whitelist: ['Mandarin', 'Emperor', 'Empress', 'Prince', 'Princess', 'Chancellor', 'Imperial Guard']
      } : {
        category: [ProfessionCategory.NOBILITY, ProfessionCategory.OFFICIAL, ProfessionCategory.MILITARY]
      },
      npcDensity: index === 1 ? 'normal' : 'sparse'
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
    roomType: 'garden',
    accessLevel: 'semi-public',
    allowedSocialClasses: ['NOBILITY', 'SCHOLAR_OFFICIAL'],
    professionFilter: {
      category: [ProfessionCategory.NOBILITY, ProfessionCategory.SCHOLAR, ProfessionCategory.SERVANT]
    },
    npcDensity: 'sparse'
  });
  
  generateChineseGarden(tiles, size.width - 20, 5, 15, 20, 'east');
  rooms.push({
    id: 'east_garden',
    name: 'Garden of Eternal Spring',
    bounds: { x: size.width - 20, y: 5, width: 15, height: 20 },
    description: 'An ornamental garden with rare plants and rock formations',
    roomType: 'garden',
    accessLevel: 'semi-public',
    allowedSocialClasses: ['NOBILITY', 'SCHOLAR_OFFICIAL'],
    professionFilter: {
      category: [ProfessionCategory.NOBILITY, ProfessionCategory.SCHOLAR, ProfessionCategory.SERVANT]
    },
    npcDensity: 'sparse'
  });
  
  // Living quarters in the back (north)
  generateLivingQuarters(tiles, 10, 3, size.width - 20, 8, config);
  rooms.push({
    id: 'living_quarters',
    name: 'Imperial Residence',
    bounds: { x: 10, y: 3, width: size.width - 20, height: 8 },
    description: 'Private chambers of the imperial family',
    roomType: 'private_chamber' as any,
    accessLevel: 'restricted',
    allowedSocialClasses: ['NOBILITY'],
    professionFilter: {
      whitelist: ['Emperor', 'Empress', 'Prince', 'Princess', 'Concubine', 'Eunuch', 'Lady-in-Waiting', 'Imperial Guard']
    },
    genderRestriction: config.era === HistoricalEra.MEDIEVAL || config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN ? 'female' : 'any',
    npcDensity: 'normal'
  });
  
  // Add main courtyard as a room
  rooms.push({
    id: 'main_courtyard',
    name: 'Central Courtyard',
    bounds: { x: 20, y: 25, width: size.width - 40, height: size.height - 35 },
    description: 'The vast ceremonial courtyard',
    roomType: 'courtyard',
    accessLevel: 'public',
    allowedSocialClasses: ['COMMONER', 'MERCHANT', 'ARTISAN', 'SCHOLAR_OFFICIAL', 'NOBILITY'],
    npcDensity: 'crowded'
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
  exitZones: ExitZone[],
  rooms?: RoomDefinition[]
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
 * Generate realistic European palace with proper rooms, courtyards, and cultural features
 */
function generateRealisticEuropeanPalace(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  noise: ValueNoise,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  size: { width: number, height: number }
) {
  const wallThickness = 2; // Account for thick decorative walls
  const interiorX = bounds.x + wallThickness;
  const interiorY = bounds.y + wallThickness;
  const interiorWidth = bounds.width - (wallThickness * 2);
  const interiorHeight = bounds.height - (wallThickness * 2);
  
  // Clear interior space with base marble flooring
  for (let y = interiorY; y < interiorY + interiorHeight; y++) {
    for (let x = interiorX; x < interiorX + interiorWidth; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE; // Base floor
      }
    }
  }
  
  // **THRONE ROOM** - The heart of the palace (center-north)
  const throneRoomWidth = Math.floor(interiorWidth * 0.6);
  const throneRoomHeight = Math.floor(interiorHeight * 0.25);
  const throneRoomX = interiorX + Math.floor((interiorWidth - throneRoomWidth) / 2);
  const throneRoomY = interiorY + 2;
  
  generateThroneRoom(tiles, { x: throneRoomX, y: throneRoomY, width: throneRoomWidth, height: throneRoomHeight }, 
                    config, rooms, interactionZones, size);
  
  // **GREAT HALL** - For feasts and gatherings (center)
  const hallWidth = Math.floor(interiorWidth * 0.8);
  const hallHeight = Math.floor(interiorHeight * 0.2);
  const hallX = interiorX + Math.floor((interiorWidth - hallWidth) / 2);
  const hallY = throneRoomY + throneRoomHeight + 3;
  
  if (hallY + hallHeight < interiorY + interiorHeight - 10) {
    generateGreatHall(tiles, { x: hallX, y: hallY, width: hallWidth, height: hallHeight }, 
                      config, rooms, interactionZones, size);
  }
  
  // **ROYAL CHAMBERS** - Private quarters (east wing)
  const chambersWidth = Math.floor(interiorWidth * 0.25);
  const chambersHeight = Math.floor(interiorHeight * 0.4);
  const chambersX = interiorX + interiorWidth - chambersWidth - 2;
  const chambersY = interiorY + 2;
  
  generateRoyalChambers(tiles, { x: chambersX, y: chambersY, width: chambersWidth, height: chambersHeight }, 
                        config, rooms, interactionZones, size);
  
  // **CHAPEL** - Sacred space (west wing)
  const chapelWidth = Math.floor(interiorWidth * 0.25);
  const chapelHeight = Math.floor(interiorHeight * 0.3);
  const chapelX = interiorX + 2;
  const chapelY = interiorY + 2;
  
  generatePalaceChapel(tiles, { x: chapelX, y: chapelY, width: chapelWidth, height: chapelHeight }, 
                       config, rooms, interactionZones, size);
  
  // **LIBRARY/STUDY** - For scholarly pursuits (west wing, lower)
  const libraryWidth = Math.floor(interiorWidth * 0.25);
  const libraryHeight = Math.floor(interiorHeight * 0.2);
  const libraryX = interiorX + 2;
  const libraryY = chapelY + chapelHeight + 3;
  
  generatePalaceLibrary(tiles, { x: libraryX, y: libraryY, width: libraryWidth, height: libraryHeight }, 
                        config, rooms, interactionZones, size);
  
  // **TREASURY** - Secure vault (east wing, lower)
  const treasuryWidth = Math.floor(interiorWidth * 0.15);
  const treasuryHeight = Math.floor(interiorHeight * 0.15);
  const treasuryX = chambersX;
  const treasuryY = chambersY + chambersHeight + 3;
  
  generateTreasury(tiles, { x: treasuryX, y: treasuryY, width: treasuryWidth, height: treasuryHeight }, 
                   config, rooms, interactionZones, size);
  
  // **KITCHEN COMPLEX** - Food preparation (south wing)
  const kitchenWidth = Math.floor(interiorWidth * 0.4);
  const kitchenHeight = Math.floor(interiorHeight * 0.2);
  const kitchenX = interiorX + Math.floor((interiorWidth - kitchenWidth) / 2);
  const kitchenY = interiorY + interiorHeight - kitchenHeight - 2;
  
  generatePalaceKitchen(tiles, { x: kitchenX, y: kitchenY, width: kitchenWidth, height: kitchenHeight }, 
                        config, rooms, interactionZones, size);
  
  // **SERVANTS' QUARTERS** - Staff accommodation (southwest)
  const servantsWidth = Math.floor(interiorWidth * 0.2);
  const servantsHeight = Math.floor(interiorHeight * 0.15);
  const servantsX = interiorX + 2;
  const servantsY = interiorY + interiorHeight - servantsHeight - 2;
  
  generateServantsQuarters(tiles, { x: servantsX, y: servantsY, width: servantsWidth, height: servantsHeight }, 
                           config, rooms, interactionZones, size);
  
  // **ARMORY/GUARD HOUSE** - Security (southeast)
  const armoryWidth = Math.floor(interiorWidth * 0.15);
  const armoryHeight = Math.floor(interiorHeight * 0.15);
  const armoryX = interiorX + interiorWidth - armoryWidth - 2;
  const armoryY = interiorY + interiorHeight - armoryHeight - 2;
  
  generatePalaceArmory(tiles, { x: armoryX, y: armoryY, width: armoryWidth, height: armoryHeight }, 
                       config, rooms, interactionZones, size);
  
  // **COURTYARDS** - Open spaces within the palace
  generateInnerCourtyard(tiles, bounds, config, noise, rooms, interactionZones, size);
  
  // **HALL OF MIRRORS** - Gallery space (calculated position)
  const galleryWidth = size.width - 10;
  const galleryHeight = 8;
  const galleryY = Math.max(hallY + hallHeight + 2, libraryY + libraryHeight + 2);
  
  // **FORMAL GARDENS** - Garden space (positioned near bottom)
  const gardenY = Math.max(kitchenY + kitchenHeight + 2, size.height - 12);
  
  // Add room definitions with access metadata
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { x: throneRoomX, y: throneRoomY, width: 16, height: 10 },
    description: 'The grand throne room for royal audiences',
    roomType: 'throne_room',
    accessLevel: 'restricted',
    allowedSocialClasses: ['NOBILITY', 'CLERGY', 'UPPER_CLASS'],
    professionFilter: {
      category: [ProfessionCategory.NOBILITY, ProfessionCategory.CLERGY],
      whitelist: ['King', 'Queen', 'Prince', 'Princess', 'Duke', 'Duchess', 'Knight', 'Bishop', 'Cardinal', 'Royal Guard', 'Guard Captain']
    },
    npcDensity: 'normal'
  });
  
  rooms.push({
    id: 'hall_of_mirrors',
    name: 'Hall of Mirrors',
    bounds: { x: 5, y: galleryY, width: size.width - 10, height: galleryHeight },
    description: 'A magnificent gallery for court events',
    roomType: 'gallery',
    accessLevel: 'semi-public',
    allowedSocialClasses: ['NOBILITY', 'UPPER_CLASS', 'MERCHANT'],
    professionFilter: {
      category: [ProfessionCategory.NOBILITY, ProfessionCategory.ARTISAN, ProfessionCategory.MERCHANT],
      whitelist: ['Courtier', 'Noble', 'Aristocrat', 'Musician', 'Artist', 'Merchant Prince']
    },
    npcDensity: 'normal'
  });
  
  rooms.push({
    id: 'formal_gardens',
    name: 'Royal Gardens',
    bounds: { x: 10, y: gardenY, width: size.width - 20, height: 8 },
    description: 'Meticulously maintained palace gardens',
    roomType: 'garden',
    accessLevel: 'semi-public',
    allowedSocialClasses: ['NOBILITY', 'UPPER_CLASS'],
    professionFilter: {
      category: [ProfessionCategory.NOBILITY, ProfessionCategory.SERVANT],
      whitelist: ['Noble', 'Courtier', 'Gardener', 'Guard']
    },
    npcDensity: 'sparse'
  });
  
  interactionZones.push({
    id: 'throne_room',
    bounds: { x: throneRoomX, y: throneRoomY, width: 16, height: 10 },
    type: 'throne',
    interactions: ['audience', 'ceremony', 'court']
  });
  
  interactionZones.push({
    id: 'hall_of_mirrors',
    bounds: { x: 5, y: galleryY, width: size.width - 10, height: galleryHeight },
    type: 'social' as any,
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
 * Generate ornate throne room with cultural flooring patterns
 */
function generateThroneRoom(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
) {
  // Build room walls
  buildPalaceRoom(tiles, bounds, size);
  
  // Apply cultural flooring patterns
  applyCulturalFlooring(tiles, bounds, config, new ValueNoise(), 'ceremonial');
  
  // Central throne on a dais
  const throneX = bounds.x + Math.floor(bounds.width / 2);
  const throneY = bounds.y + 3;
  
  // Throne dais (raised platform)
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = throneX + dx;
      const y = throneY + dy;
      if (x >= bounds.x && x < bounds.x + bounds.width && y >= bounds.y && y < bounds.y + bounds.height) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE; // Raised marble platform
      }
    }
  }
  
  // The throne itself
  tiles[throneY][throneX].biome = BiomeType.THRONE;
  
  // Royal carpet leading to throne
  for (let y = throneY + 2; y < bounds.y + bounds.height - 2; y++) {
    tiles[y][throneX].biome = BiomeType.RUG;
  }
  
  // Ceremonial columns
  const colX1 = bounds.x + Math.floor(bounds.width * 0.25);
  const colX2 = bounds.x + Math.floor(bounds.width * 0.75);
  tiles[throneY + 2][colX1].biome = BiomeType.COLUMN;
  tiles[throneY + 2][colX2].biome = BiomeType.COLUMN;
  
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: bounds,
    description: 'The magnificent throne room where the sovereign holds court and receives petitions.',
    roomType: 'throne_room',
    accessLevel: 'restricted',
    allowedSocialClasses: ['NOBILITY', 'CLERGY', 'OFFICIAL'],
    professionFilter: {
      category: [ProfessionCategory.NOBILITY, ProfessionCategory.OFFICIAL]
    },
    npcDensity: 'normal'
  });
  
  interactionZones.push({
    id: 'throne',
    bounds: { x: throneX - 2, y: throneY - 1, width: 5, height: 3 },
    type: 'throne',
    interactions: ['hold_court', 'receive_petitions', 'royal_decree']
  });
}

/**
 * Generate great hall for feasting and ceremonies
 */
function generateGreatHall(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
) {
  buildPalaceRoom(tiles, bounds, size);
  applyCulturalFlooring(tiles, bounds, config, new ValueNoise(), 'formal');
  
  // Long banquet tables
  const tableCount = Math.floor(bounds.height / 6);
  for (let i = 0; i < tableCount; i++) {
    const tableY = bounds.y + 2 + (i * 4);
    const tableLength = bounds.width - 6;
    
    for (let x = bounds.x + 3; x < bounds.x + 3 + tableLength; x += 3) {
      tiles[tableY][x].biome = BiomeType.TABLE;
      tiles[tableY + 1][x].biome = BiomeType.BENCH; // Seating
      tiles[tableY - 1][x].biome = BiomeType.BENCH; // Seating on other side
    }
  }
  
  // Grand fireplace
  const fireplaceX = bounds.x + Math.floor(bounds.width / 2);
  const fireplaceY = bounds.y + 1;
  tiles[fireplaceY][fireplaceX].biome = BiomeType.FIRE_PIT;
  
  // Decorative tapestries (using rug)
  tiles[bounds.y + 1][bounds.x + 2].biome = BiomeType.RUG;
  tiles[bounds.y + 1][bounds.x + bounds.width - 3].biome = BiomeType.RUG;
  
  rooms.push({
    id: 'great_hall',
    name: 'Great Hall',
    bounds: bounds,
    description: 'The grand hall where nobles feast, celebrations are held, and important announcements are made.',
    roomType: 'dining_hall',
    accessLevel: 'semi-public',
    allowedSocialClasses: ['NOBILITY', 'UPPER_CLASS', 'OFFICIAL'],
    npcDensity: 'normal'
  });
}

/**
 * Generate royal private chambers
 */
function generateRoyalChambers(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
) {
  buildPalaceRoom(tiles, bounds, size);
  applyCulturalFlooring(tiles, bounds, config, new ValueNoise(), 'residential');
  
  // Royal bed chamber
  const bedX = bounds.x + bounds.width - 3;
  const bedY = bounds.y + 2;
  tiles[bedY][bedX].biome = BiomeType.THRONE; // Use throne as fancy bed
  
  // Royal desk/writing area
  const deskX = bounds.x + 2;
  const deskY = bounds.y + 2;
  tiles[deskY][deskX].biome = BiomeType.DESK;
  tiles[deskY][deskX + 1].biome = BiomeType.CHAIR;
  
  // Wardrobe
  tiles[bounds.y + bounds.height - 3][bounds.x + 2].biome = BiomeType.CABINET;
  
  // Privacy screen
  tiles[bounds.y + Math.floor(bounds.height / 2)][bounds.x + Math.floor(bounds.width / 2)].biome = BiomeType.RUG;
  
  rooms.push({
    id: 'royal_chambers',
    name: 'Royal Chambers',
    bounds: bounds,
    description: 'The private quarters of the royal family, richly appointed and heavily guarded.',
    roomType: 'bedroom',
    accessLevel: 'restricted',
    allowedSocialClasses: ['NOBILITY'],
    professionFilter: {
      whitelist: ['King', 'Queen', 'Prince', 'Princess', 'Royal Guard', 'Lady-in-Waiting', 'Valet']
    },
    npcDensity: 'sparse'
  });
}

/**
 * Generate palace chapel for worship
 */
function generatePalaceChapel(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
) {
  buildPalaceRoom(tiles, bounds, size);
  
  // Sacred flooring
  for (let y = bounds.y + 1; y < bounds.y + bounds.height - 1; y++) {
    for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_MARBLE; // Sacred marble
    }
  }
  
  // Altar at the front
  const altarX = bounds.x + Math.floor(bounds.width / 2);
  const altarY = bounds.y + 2;
  tiles[altarY][altarX].biome = BiomeType.ALTAR;
  
  // Pews for congregation
  const pewRows = Math.min(3, Math.floor((bounds.height - 6) / 2));
  for (let row = 0; row < pewRows; row++) {
    const pewY = bounds.y + 4 + (row * 2);
    for (let x = bounds.x + 2; x < bounds.x + bounds.width - 2; x += 2) {
      tiles[pewY][x].biome = BiomeType.BENCH;
    }
  }
  
  // Sacred font or vessel
  tiles[altarY][altarX - 2].biome = BiomeType.BASIN;
  
  rooms.push({
    id: 'palace_chapel',
    name: 'Palace Chapel',
    bounds: bounds,
    description: 'The sacred chapel where the royal family and court attend religious services.',
    roomType: 'chapel',
    accessLevel: 'semi-public',
    allowedSocialClasses: ['NOBILITY', 'CLERGY', 'UPPER_CLASS'],
    professionFilter: {
      category: [ProfessionCategory.CLERGY]
    },
    npcDensity: 'sparse'
  });
}

/**
 * Generate palace library and study
 */
function generatePalaceLibrary(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
) {
  buildPalaceRoom(tiles, bounds, size);
  applyCulturalFlooring(tiles, bounds, config, new ValueNoise(), 'formal');
  
  // Bookshelves along walls
  for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x += 2) {
    tiles[bounds.y + 1][x].biome = BiomeType.BOOKSHELF;
    tiles[bounds.y + bounds.height - 2][x].biome = BiomeType.BOOKSHELF;
  }
  
  // Study desks
  const desk1X = bounds.x + 2;
  const desk1Y = bounds.y + Math.floor(bounds.height / 2);
  tiles[desk1Y][desk1X].biome = BiomeType.DESK;
  tiles[desk1Y][desk1X + 1].biome = BiomeType.CHAIR;
  
  // Scroll racks for important documents
  tiles[bounds.y + 2][bounds.x + bounds.width - 2].biome = BiomeType.SCROLL_RACK;
  
  rooms.push({
    id: 'palace_library',
    name: 'Palace Library',
    bounds: bounds,
    description: 'The royal library containing books, scrolls, and important state documents.',
    roomType: 'library',
    accessLevel: 'semi-public',
    allowedSocialClasses: ['NOBILITY', 'SCHOLAR', 'CLERGY'],
    professionFilter: {
      category: [ProfessionCategory.SCHOLAR, ProfessionCategory.CLERGY]
    },
    npcDensity: 'sparse'
  });
}

/**
 * Generate secure treasury
 */
function generateTreasury(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
) {
  buildPalaceRoom(tiles, bounds, size);
  
  // Stone flooring for security
  for (let y = bounds.y + 1; y < bounds.y + bounds.height - 1; y++) {
    for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }
  
  // Treasure chests
  tiles[bounds.y + 1][bounds.x + 1].biome = BiomeType.CHEST;
  tiles[bounds.y + 1][bounds.x + bounds.width - 2].biome = BiomeType.CHEST;
  tiles[bounds.y + bounds.height - 2][bounds.x + 1].biome = BiomeType.CHEST;
  tiles[bounds.y + bounds.height - 2][bounds.x + bounds.width - 2].biome = BiomeType.CHEST;
  
  // Central vault table
  const centerX = bounds.x + Math.floor(bounds.width / 2);
  const centerY = bounds.y + Math.floor(bounds.height / 2);
  tiles[centerY][centerX].biome = BiomeType.TABLE;
  
  rooms.push({
    id: 'treasury',
    name: 'Royal Treasury',
    bounds: bounds,
    description: 'The heavily guarded vault containing the royal treasure and state funds.',
    roomType: 'treasury',
    accessLevel: 'restricted',
    professionFilter: {
      whitelist: ['Treasurer', 'Royal Guard', 'King', 'Queen', 'Steward']
    },
    npcDensity: 'sparse'
  });
}

/**
 * Generate palace kitchen complex
 */
function generatePalaceKitchen(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
) {
  buildPalaceRoom(tiles, bounds, size);
  
  // Kitchen tile flooring
  for (let y = bounds.y + 1; y < bounds.y + bounds.height - 1; y++) {
    for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_TILE;
    }
  }
  
  // Large cooking hearths
  const hearth1X = bounds.x + 2;
  const hearth1Y = bounds.y + 2;
  tiles[hearth1Y][hearth1X].biome = BiomeType.KITCHEN_STOVE;
  
  const hearth2X = bounds.x + bounds.width - 3;
  const hearth2Y = bounds.y + 2;
  tiles[hearth2Y][hearth2X].biome = BiomeType.KITCHEN_STOVE;
  
  // Prep tables
  for (let x = bounds.x + 2; x < bounds.x + bounds.width - 2; x += 3) {
    tiles[bounds.y + Math.floor(bounds.height / 2)][x].biome = BiomeType.TABLE;
  }
  
  // Food storage
  tiles[bounds.y + bounds.height - 2][bounds.x + 2].biome = BiomeType.CHEST; // Food storage
  tiles[bounds.y + bounds.height - 2][bounds.x + bounds.width - 3].biome = BiomeType.CHEST;
  
  // Kitchen sink/wash area
  tiles[bounds.y + bounds.height - 3][bounds.x + Math.floor(bounds.width / 2)].biome = BiomeType.KITCHEN_SINK;
  
  rooms.push({
    id: 'palace_kitchen',
    name: 'Palace Kitchen',
    bounds: bounds,
    description: 'The bustling kitchen complex where elaborate royal feasts are prepared.',
    roomType: 'kitchen',
    accessLevel: 'semi-public',
    professionFilter: {
      whitelist: ['Cook', 'Chef', 'Kitchen Maid', 'Scullery Boy', 'Baker', 'Butcher']
    },
    npcDensity: 'normal'
  });
}

/**
 * Generate servants' quarters
 */
function generateServantsQuarters(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
) {
  buildPalaceRoom(tiles, bounds, size);
  
  // Simple wood flooring
  for (let y = bounds.y + 1; y < bounds.y + bounds.height - 1; y++) {
    for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
    }
  }
  
  // Simple beds (using bench)
  for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x += 3) {
    tiles[bounds.y + 1][x].biome = BiomeType.BENCH;
    tiles[bounds.y + bounds.height - 2][x].biome = BiomeType.BENCH;
  }
  
  // Simple storage
  tiles[bounds.y + Math.floor(bounds.height / 2)][bounds.x + 1].biome = BiomeType.CHEST;
  
  rooms.push({
    id: 'servants_quarters',
    name: 'Servants\' Quarters',
    bounds: bounds,
    description: 'Simple but adequate accommodations for the palace staff.',
    roomType: 'servants_quarters',
    accessLevel: 'restricted',
    professionFilter: {
      category: [ProfessionCategory.SERVICE]
    },
    npcDensity: 'normal'
  });
}

/**
 * Generate palace armory and guard house
 */
function generatePalaceArmory(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
) {
  buildPalaceRoom(tiles, bounds, size);
  
  // Stone flooring
  for (let y = bounds.y + 1; y < bounds.y + bounds.height - 1; y++) {
    for (let x = bounds.x + 1; x < bounds.x + bounds.width - 1; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }
  
  // Weapon racks
  tiles[bounds.y + 1][bounds.x + 1].biome = BiomeType.WEAPON_RACK;
  tiles[bounds.y + 1][bounds.x + bounds.width - 2].biome = BiomeType.WEAPON_RACK;
  
  // Armor stands
  tiles[bounds.y + bounds.height - 2][bounds.x + 1].biome = BiomeType.ARMOR_STAND;
  tiles[bounds.y + bounds.height - 2][bounds.x + bounds.width - 2].biome = BiomeType.ARMOR_STAND;
  
  rooms.push({
    id: 'palace_armory',
    name: 'Palace Armory',
    bounds: bounds,
    description: 'The armory where the palace guard\'s weapons and armor are stored.',
    roomType: 'armory',
    accessLevel: 'restricted',
    professionFilter: {
      whitelist: ['Royal Guard', 'Captain', 'Armorer', 'Weapons Master']
    },
    npcDensity: 'sparse'
  });
}

/**
 * Generate inner courtyard with fountains and gardens
 */
function generateInnerCourtyard(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  config: SpecialMapConfig,
  noise: ValueNoise,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  size: { width: number, height: number }
) {
  // Find open central area for courtyard
  const courtyardWidth = Math.floor(bounds.width * 0.3);
  const courtyardHeight = Math.floor(bounds.height * 0.25);
  const courtyardX = bounds.x + Math.floor((bounds.width - courtyardWidth) / 2);
  const courtyardY = bounds.y + Math.floor((bounds.height - courtyardHeight) / 2);
  
  // Create courtyard space
  for (let y = courtyardY; y < courtyardY + courtyardHeight; y++) {
    for (let x = courtyardX; x < courtyardX + courtyardWidth; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        if (tiles[y][x].biome === BiomeType.FLOOR_MARBLE) { // Only if it's an open space
          tiles[y][x].biome = BiomeType.PARK; // Garden space
        }
      }
    }
  }
  
  // Central fountain
  const fountainX = courtyardX + Math.floor(courtyardWidth / 2);
  const fountainY = courtyardY + Math.floor(courtyardHeight / 2);
  if (fountainX >= 0 && fountainX < size.width && fountainY >= 0 && fountainY < size.height) {
    tiles[fountainY][fountainX].biome = BiomeType.FOUNTAIN;
  }
  
  rooms.push({
    id: 'inner_courtyard',
    name: 'Palace Courtyard',
    bounds: { x: courtyardX, y: courtyardY, width: courtyardWidth, height: courtyardHeight },
    description: 'A peaceful inner courtyard with gardens and fountains for the royal family to enjoy.',
    roomType: 'courtyard',
    accessLevel: 'semi-public',
    allowedSocialClasses: ['NOBILITY', 'UPPER_CLASS'],
    npcDensity: 'sparse'
  });
}

/**
 * Helper function to build a basic palace room with walls and door
 */
function buildPalaceRoom(
  tiles: Tile[][],
  bounds: { x: number, y: number, width: number, height: number },
  size: { width: number, height: number }
) {
  // Build walls
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        const isWall = (x === bounds.x || x === bounds.x + bounds.width - 1 ||
                       y === bounds.y || y === bounds.y + bounds.height - 1);
        
        if (isWall) {
          tiles[y][x].biome = BiomeType.WALL;
        }
      }
    }
  }
  
  // Add door
  const doorX = bounds.x + Math.floor(bounds.width / 2);
  const doorY = bounds.y + bounds.height - 1;
  if (doorX >= 0 && doorX < size.width && doorY >= 0 && doorY < size.height) {
    tiles[doorY][doorX].biome = BiomeType.DOOR;
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
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
) {
  // Use the realistic European palace system as default
  const bounds = { 
    x: Math.floor(size.width * 0.175), 
    y: Math.floor(size.height * 0.2), 
    width: Math.floor(size.width * 0.65), 
    height: Math.floor(size.height * 0.6) 
  };
  
  generateRealisticEuropeanPalace(tiles, bounds, config, noise, rooms, interactionZones, exitZones, size);
}