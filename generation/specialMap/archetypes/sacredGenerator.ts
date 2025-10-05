/**
 * generation/specialMap/archetypes/sacredGenerator.ts
 * COMPLETELY REVAMPED Sacred Complex Generator
 * Features rich cultural differentiation, extensive overlay usage, and historically accurate layouts
 */

import { Tile, BiomeType, HistoricalEra } from '../../../types';
import { OverlayObjectType } from '../../../types/core/tile';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { placeWallRectangle, fillArea } from '../mapLayoutUtils';
import { createRoom, ensureRoomsDefined, RoomTemplates } from '../types/roomHelpers';
import { getCulturalGenerator } from '../culturalGeneratorRegistry';
import { applyNorthBackWall, applyRoomDivider } from '../backWallUtils';
import { placePillar } from '../multiTileSystem';

// Import cultural generators to ensure they register
import '../archetypes/cultures/nativeAmericanGenerators';
import '../archetypes/cultures/asianGenerators';
import '../archetypes/cultures/africanGenerators';
import '../archetypes/cultures/middleEasternGenerators';
import '../archetypes/cultures/europeanGenerators';

export function generateSacredComplex(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { tiles: Tile[][], interactionZones: InteractionZone[], exitZones: ExitZone[], rooms: RoomDefinition[] } {
  
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  console.log(`[SacredGenerator] Generating sacred complex for culture: ${config.culturalZone}, era: ${config.era}, region: ${config.region}`);
  
  // First check if there's a registered cultural generator
  const culturalGenerator = getCulturalGenerator('SACRED_COMPLEX', config.culturalZone);
  if (culturalGenerator) {
    console.log(`[SacredGenerator] Using registered cultural generator for ${config.culturalZone}`);
    culturalGenerator(tiles, size, config, interactionZones, rooms, noise);
  } else {
    console.log(`[SacredGenerator] No registered generator for ${config.culturalZone}, using built-in`);
    // Fall back to built-in switch statement
    switch (config.culturalZone) {
    case 'EUROPEAN':
      generateEuropeanSacred(tiles, size, config, interactionZones, rooms, noise);
      break;
    case 'MENA':
      generateMENASacred(tiles, size, config, interactionZones, rooms, noise);
      break;
    case 'EAST_ASIAN':
      generateEastAsianSacred(tiles, size, config, interactionZones, rooms, noise);
      break;
    case 'SOUTH_ASIAN':
      generateSouthAsianSacred(tiles, size, config, interactionZones, rooms, noise);
      break;
    case 'SUB_SAHARAN_AFRICAN':
      generateAfricanSacred(tiles, size, config, interactionZones, rooms, noise);
      break;
    case 'INDIGENOUS_AMERICAN':
    case 'NORTH_AMERICAN': // Handle both names
    case 'NORTH_AMERICAN_PRE_COLUMBIAN': // Also handle this variant
    case 'NORTH_AMERICAN_COLONIAL':
    case 'NATIVE_AMERICAN':
      generateIndigenousAmericanSacred(tiles, size, config, interactionZones, rooms, noise);
      break;
    case 'OCEANIC':
    case 'OCEANIA':
      generateOceanicSacred(tiles, size, config, interactionZones, rooms, noise);
      break;
    default:
      console.log(`[SacredGenerator] Using fallback for unknown culture: ${config.culturalZone}`);
      generateGenericSacred(tiles, size, config, interactionZones, rooms, noise);
      break;
    }
  }
  
  // Main exit at bottom center
  exitZones.push({
    id: 'main_exit',
    location: [Math.floor(size.width / 2), size.height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
  
  // Ensure at least one room is defined for NPC spawning
  const validatedRooms = ensureRoomsDefined(rooms, 'SACRED_COMPLEX', size);
  
  return { tiles, interactionZones, exitZones, rooms: validatedRooms };
}

/**
 * EUROPEAN SACRED SITES
 * Era progression: Classical temples → Medieval churches → Renaissance cathedrals → Modern churches
 */
function generateEuropeanSacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create sanctuary room for this sacred space
  rooms.push(RoomTemplates.sanctuary(centerX, centerY, Math.min(8, Math.floor(Math.min(size.width, size.height) / 3))));
  
  if (config.era === HistoricalEra.ANTIQUITY) {
    generateClassicalTemple(tiles, size, centerX, centerY, config, interactionZones);
  } else if (config.era === HistoricalEra.MEDIEVAL) {
    generateMedievalChurch(tiles, size, centerX, centerY, config, interactionZones);
  } else if (config.era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    generateRenaissanceCathedral(tiles, size, centerX, centerY, config, interactionZones);
  } else {
    generateModernChurch(tiles, size, centerX, centerY, config, interactionZones);
  }
}

function generateClassicalTemple(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[]
) {
  // Fill with marble floors
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_MARBLE);
  
  // Add back wall to north edge for depth
  applyNorthBackWall(tiles, 0, 0, size.width, config, {
    hasWindows: false, // Temples typically have solid back walls
    windowSpacing: 8
  });
  
  // Use proper multi-tile pillars for Greek/Roman temples
  const year = config.specificYear || -300; // Default to Classical period
  
  // Outer colonnade - massive marble columns around perimeter
  for (let x = 2; x < size.width - 2; x += 3) {
    // Front row of pillars (using multi-tile system)
    placePillar(tiles, x, size.height - 3, 'white_marble', year);
    
    // Back row against back wall
    if (x > 4 && x < size.width - 5) { // Don't put pillars too close to edges
      placePillar(tiles, x, 3, 'white_marble', year);
    }
  }
  
  // Side pillars
  for (let y = 5; y < size.height - 5; y += 3) {
    placePillar(tiles, 2, y, 'white_marble', year);
    placePillar(tiles, size.width - 3, y, 'white_marble', year);
  }
  
  // Inner cella (sanctuary)
  const cellaWidth = Math.min(12, size.width - 8);
  const cellaHeight = Math.min(10, size.height - 8);
  const cellaX = centerX - Math.floor(cellaWidth / 2);
  const cellaY = centerY - Math.floor(cellaHeight / 2);
  
  // Cella walls
  placeWallRectangle(tiles, cellaX, cellaY, cellaWidth, cellaHeight, [
    { side: 'south', offset: Math.floor(cellaWidth / 2) }
  ]);
  
  // Add back wall inside the cella for the inner sanctuary
  applyNorthBackWall(tiles, cellaX + 1, cellaY + 1, cellaWidth - 2, config, {
    hasWindows: false,
    windowSpacing: 0
  });
  
  // Sacred altar at back of cella
  tiles[cellaY + 2][centerX].overlayObject = { type: OverlayObjectType.ALTAR, rotation: 0 };
  tiles[cellaY + 2][centerX].isBlocking = true;
  
  // Statue of deity behind altar
  tiles[cellaY + 1][centerX].overlayObject = { type: OverlayObjectType.STATUE, rotation: 0 };
  tiles[cellaY + 1][centerX].isBlocking = true;
  
  // Offering tables flanking altar
  tiles[cellaY + 3][centerX - 2].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
  tiles[cellaY + 3][centerX + 2].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
  
  // Braziers for sacred fire
  tiles[cellaY + 4][centerX - 3].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };
  tiles[cellaY + 4][centerX + 3].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };
  
  // Treasury chests along walls
  tiles[cellaY + 2][cellaX + 1].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };
  tiles[cellaY + 2][cellaX + cellaWidth - 2].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };
  
  interactionZones.push({
    id: 'altar',
    bounds: { x: centerX - 3, y: cellaY + 1, width: 7, height: 4 },
    type: 'religious',
    interactions: ['pray', 'offering', 'consult_oracle']
  });
}

function generateMedievalChurch(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[]
) {
  // Stone floor base
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_STONE);
  
  // Add back wall with Gothic windows
  applyNorthBackWall(tiles, 0, 0, size.width, config, {
    hasWindows: true,
    windowSpacing: 4  // Gothic churches have more windows
  });
  
  // Cruciform layout - nave, transept, chancel
  const naveLength = Math.floor(size.height * 0.7);
  const naveWidth = Math.min(8, size.width - 4);
  const transeptLength = Math.min(size.width - 4, naveLength / 2);
  
  // Nave (main body) - checkerboard pattern
  const naveX = centerX - Math.floor(naveWidth / 2);
  for (let y = size.height - naveLength; y < size.height - 2; y++) {
    for (let x = naveX; x < naveX + naveWidth; x++) {
      if ((x + y) % 2 === 0) {
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      }
    }
  }
  
  // Transept (cross arms)
  const transeptY = Math.floor(size.height * 0.4);
  const transeptX = centerX - Math.floor(transeptLength / 2);
  fillArea(tiles, transeptX, transeptY - 2, transeptLength, 5, BiomeType.FLOOR_MARBLE);
  
  // Chancel (altar area) - elevated
  const chancelWidth = Math.min(6, naveWidth - 2);
  const chancelX = centerX - Math.floor(chancelWidth / 2);
  fillArea(tiles, chancelX, 2, chancelWidth, 8, BiomeType.FLOOR_TILE);
  
  // High altar
  tiles[4][centerX].overlayObject = { type: OverlayObjectType.ALTAR, rotation: 0 };
  tiles[4][centerX].isBlocking = true;
  
  // Rood screen separating nave and chancel
  for (let x = chancelX; x < chancelX + chancelWidth; x++) {
    if (x !== centerX) { // Leave gap for entrance
      tiles[10][x].overlayObject = { type: OverlayObjectType.BOOKSHELF, rotation: 0 }; // Use as screen
      tiles[10][x].isBlocking = true;
    }
  }
  
  // Side chapels in transept
  tiles[transeptY][transeptX + 2].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
  tiles[transeptY][transeptX + transeptLength - 3].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
  
  // Confessional booths
  tiles[transeptY + 3][transeptX + 1].overlayObject = { type: OverlayObjectType.BOOTH_BACK, rotation: 0 };
  tiles[transeptY + 4][transeptX + 1].overlayObject = { type: OverlayObjectType.BOOTH_FRONT, rotation: 0 };
  
  // Wooden pews in nave
  for (let y = size.height - naveLength + 5; y < size.height - 5; y += 3) {
    tiles[y][naveX + 1].overlayObject = { type: OverlayObjectType.BENCH_EAST_WEST, rotation: 0 };
    tiles[y][naveX + naveWidth - 2].overlayObject = { type: OverlayObjectType.BENCH_EAST_WEST, rotation: 0 };
  }
  
  // Candelabras for lighting
  for (let x = chancelX; x < chancelX + chancelWidth; x += 2) {
    if (x !== centerX) {
      tiles[6][x].overlayObject = { type: OverlayObjectType.CANDELABRA, rotation: 0 };
    }
  }
  
  // Baptismal font near entrance
  tiles[size.height - 5][centerX - 3].overlayObject = { type: OverlayObjectType.BASIN, rotation: 0 };
  
  interactionZones.push({
    id: 'altar',
    bounds: { x: chancelX, y: 2, width: chancelWidth, height: 8 },
    type: 'religious',
    interactions: ['pray', 'take_communion', 'light_candle']
  });
  
  interactionZones.push({
    id: 'confessional',
    bounds: { x: transeptX, y: transeptY + 2, width: 3, height: 3 },
    type: 'social',
    interactions: ['confess', 'seek_absolution']
  });
}

/**
 * MENA SACRED SITES
 * Islamic mosques, ancient temples, Zoroastrian fire temples
 */
function generateMENASacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create prayer hall room
  rooms.push(createRoom(
    'prayer_hall',
    'Prayer Hall',
    2,
    2,
    size.width - 4,
    size.height - 4,
    'sanctuary',
    'normal'
  ));
  
  if (config.era >= HistoricalEra.MEDIEVAL) {
    generateIslamicMosque(tiles, size, centerX, centerY, config, interactionZones);
  } else if (config.era === HistoricalEra.ANTIQUITY) {
    generateAncientMENATemple(tiles, size, centerX, centerY, config, interactionZones);
  } else {
    generateZoroastrianTemple(tiles, size, centerX, centerY, config, interactionZones);
  }
}

function generateIslamicMosque(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[]
) {
  // Geometric tile patterns throughout
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_TILE);
  
  // Add decorated back wall with geometric patterns (no windows in qibla wall)
  applyNorthBackWall(tiles, 0, 0, size.width, config, {
    hasWindows: false,  // Qibla wall traditionally has no windows
    windowSpacing: 0
  });
  
  // Prayer hall - large open space
  const hallWidth = size.width - 6;
  const hallHeight = Math.floor(size.height * 0.7);
  const hallX = 3;
  const hallY = 3;
  
  // Qibla wall (facing Mecca) at the front
  const qiblaY = hallY + 2;
  for (let x = hallX; x < hallX + hallWidth; x++) {
    tiles[qiblaY][x].overlayObject = { type: OverlayObjectType.MENA_DECORATIVE_TILE_PANEL, rotation: 0 };
  }
  
  // Mihrab (prayer niche) at center of qibla wall
  tiles[qiblaY][centerX].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
  
  // Minbar (pulpit) next to mihrab
  tiles[qiblaY + 1][centerX + 2].overlayObject = { type: OverlayObjectType.PODIUM, rotation: 0 };
  tiles[qiblaY + 1][centerX + 2].isBlocking = true;
  
  // Prayer carpets in orderly rows
  for (let y = qiblaY + 4; y < hallY + hallHeight - 2; y += 3) {
    for (let x = hallX + 1; x < hallX + hallWidth - 1; x += 4) {
      tiles[y][x].biome = BiomeType.CARPET;
    }
  }
  
  // Columns supporting the roof
  for (let y = qiblaY + 6; y < hallY + hallHeight; y += 4) {
    for (let x = hallX + 3; x < hallX + hallWidth - 3; x += 6) {
      tiles[y][x].overlayObject = { type: OverlayObjectType.COLUMN, rotation: 0 };
      tiles[y][x].isBlocking = true;
    }
  }
  
  // Ablution fountain in courtyard area
  tiles[hallY + hallHeight + 2][centerX].overlayObject = { type: OverlayObjectType.FOUNTAIN, rotation: 0 };
  
  // Shoe storage near entrance
  for (let x = centerX - 2; x <= centerX + 2; x += 2) {
    tiles[size.height - 3][x].overlayObject = { type: OverlayObjectType.CABINET, rotation: 0 };
  }
  
  // Reading stands for Quran
  tiles[qiblaY + 2][hallX + 2].overlayObject = { type: OverlayObjectType.DESK_FACING_SOUTH, rotation: 0 };
  tiles[qiblaY + 2][hallX + hallWidth - 3].overlayObject = { type: OverlayObjectType.DESK_FACING_SOUTH, rotation: 0 };
  
  // Hanging lanterns
  for (let y = qiblaY + 5; y < hallY + hallHeight - 2; y += 5) {
    for (let x = hallX + 5; x < hallX + hallWidth - 5; x += 8) {
      tiles[y][x].overlayObject = { type: OverlayObjectType.HANGING_LANTERN, rotation: 0 };
    }
  }
  
  interactionZones.push({
    id: 'prayer_hall',
    bounds: { x: hallX, y: hallY, width: hallWidth, height: hallHeight },
    type: 'religious',
    interactions: ['pray', 'read_quran', 'meditate']
  });
  
  interactionZones.push({
    id: 'ablution',
    bounds: { x: centerX - 2, y: hallY + hallHeight, width: 5, height: 4 },
    type: 'ritual',
    interactions: ['perform_wudu', 'cleanse']
  });
}

/**
 * INDIGENOUS AMERICAN SACRED SITES
 * Platform mounds, medicine wheels, pueblo kivas, longhouse ceremonies
 */
function generateIndigenousAmericanSacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create ceremonial room for Native American sacred space
  const radius = Math.min(8, Math.floor(Math.min(size.width, size.height) / 3));
  rooms.push(createRoom(
    'ceremonial_circle',
    'Sacred Ceremonial Circle',
    centerX - radius,
    centerY - radius,
    radius * 2,
    radius * 2,
    'sanctuary',
    'normal'  // Normal density for community gathering
  ));
  
  // Determine specific type based on region
  if (config.region?.includes('mound') || config.structureName?.toLowerCase().includes('mound')) {
    generatePlatformMound(tiles, size, centerX, centerY, config, interactionZones);
  } else if (config.region?.includes('plains') || config.region?.includes('prairie')) {
    generateMedicineWheel(tiles, size, centerX, centerY, config, interactionZones);
  } else if (config.region?.includes('southwest') || config.region?.includes('pueblo')) {
    generateKiva(tiles, size, centerX, centerY, config, interactionZones);
  } else if (config.region?.includes('woodland') || config.region?.includes('forest')) {
    generateLonghouse(tiles, size, centerX, centerY, config, interactionZones);
  } else {
    // Default to platform mound for ceremonial centers
    generatePlatformMound(tiles, size, centerX, centerY, config, interactionZones);
  }
}

function generatePlatformMound(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[]
) {
  console.log(`[SacredGenerator] Generating Platform Mound for Indigenous American site`);
  
  // Base platform - earthen construction
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_EARTH);
  
  // Raised central platform
  const platformWidth = Math.min(12, size.width - 6);
  const platformHeight = Math.min(10, size.height - 6);
  const platformX = centerX - Math.floor(platformWidth / 2);
  const platformY = centerY - Math.floor(platformHeight / 2);
  
  fillArea(tiles, platformX, platformY, platformWidth, platformHeight, BiomeType.FLOOR_STONE);
  
  // Sacred fire at center - most important element
  tiles[centerY][centerX].overlayObject = { type: OverlayObjectType.FIRE_PIT, rotation: 0 };
  tiles[centerY][centerX].isBlocking = true;
  
  // Chief's ceremonial seat
  tiles[platformY + 1][centerX].overlayObject = { type: OverlayObjectType.THRONE, rotation: 0 };
  tiles[platformY + 1][centerX].isBlocking = true;
  
  // Medicine bundles and sacred objects around the fire
  const sacredPositions = [
    [centerX - 2, centerY - 2], [centerX + 2, centerY - 2],
    [centerX - 2, centerY + 2], [centerX + 2, centerY + 2]
  ];
  
  sacredPositions.forEach(([x, y]) => {
    tiles[y][x].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
  });
  
  // Ceremonial drums
  tiles[centerY - 1][centerX - 3].overlayObject = { type: OverlayObjectType.BARREL, rotation: 0 }; // Use barrel as drum
  tiles[centerY - 1][centerX + 3].overlayObject = { type: OverlayObjectType.BARREL, rotation: 0 };
  
  // Offering areas
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const offerX = centerX + Math.round(Math.cos(angle) * 4);
    const offerY = centerY + Math.round(Math.sin(angle) * 4);
    tiles[offerY][offerX].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
  }
  
  // Seating for council/ceremony - benches arranged in arc
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI + (i * Math.PI) / 6; // Half circle at bottom
    const seatX = centerX + Math.round(Math.cos(angle) * 6);
    const seatY = centerY + Math.round(Math.sin(angle) * 6);
    if (seatX >= 0 && seatX < size.width && seatY >= 0 && seatY < size.height) {
      tiles[seatY][seatX].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
    }
  }
  
  // Storage for ceremonial items
  tiles[platformY + platformHeight - 2][platformX + 1].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };
  tiles[platformY + platformHeight - 2][platformX + platformWidth - 2].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };
  
  // Sacred poles/markers at cardinal directions
  if (platformX > 2) tiles[centerY][platformX - 2].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
  if (platformX + platformWidth < size.width - 2) tiles[centerY][platformX + platformWidth + 1].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
  if (platformY > 2) tiles[platformY - 2][centerX].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
  if (platformY + platformHeight < size.height - 2) tiles[platformY + platformHeight + 1][centerX].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
  
  interactionZones.push({
    id: 'ceremonial_platform',
    bounds: { x: platformX - 2, y: platformY - 2, width: platformWidth + 4, height: platformHeight + 4 },
    type: 'religious',
    interactions: ['conduct_ceremony', 'make_offering', 'seek_vision', 'council_meeting']
  });
  
  interactionZones.push({
    id: 'sacred_fire',
    bounds: { x: centerX - 3, y: centerY - 3, width: 7, height: 7 },
    type: 'ritual',
    interactions: ['tend_fire', 'burn_offering', 'receive_blessing']
  });
}

/**
 * EAST ASIAN SACRED SITES
 * Buddhist temples, Shinto shrines, Confucian academies, Taoist monasteries
 */
function generateEastAsianSacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  if (config.region === 'japan') {
    generateShintoShrine(tiles, size, centerX, centerY, config, interactionZones);
  } else {
    generateBuddhistTempleComplex(tiles, size, centerX, centerY, config, interactionZones);
  }
}

function generateShintoShrine(
  tiles: Tile[][],
  size: { width: number, height: number },
  centerX: number,
  centerY: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[]
) {
  // Natural wooden floors
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_WOOD);
  
  // Approach path
  for (let y = size.height - 1; y >= centerY + 5; y--) {
    tiles[y][centerX].biome = BiomeType.PATH;
  }
  
  // Torii gate at entrance
  tiles[size.height - 4][centerX - 1].overlayObject = { type: OverlayObjectType.COLUMN, rotation: 0 };
  tiles[size.height - 4][centerX + 1].overlayObject = { type: OverlayObjectType.COLUMN, rotation: 0 };
  
  // Purification fountain (temizuya)
  tiles[centerY + 6][centerX - 2].overlayObject = { type: OverlayObjectType.BASIN, rotation: 0 };
  
  // Main shrine building
  const shrineWidth = Math.min(8, size.width - 6);
  const shrineHeight = Math.min(6, size.height - 10);
  const shrineX = centerX - Math.floor(shrineWidth / 2);
  const shrineY = centerY - Math.floor(shrineHeight / 2);
  
  // Shrine structure with raised floor
  fillArea(tiles, shrineX, shrineY, shrineWidth, shrineHeight, BiomeType.FLOOR_TILE);
  
  // Sacred mirror (shintai) at back of shrine
  tiles[shrineY + 1][centerX].overlayObject = { type: OverlayObjectType.MIRROR, rotation: 0 };
  tiles[shrineY + 1][centerX].isBlocking = true;
  
  // Offering table
  tiles[shrineY + 3][centerX].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
  
  // Paper lanterns
  for (let x = shrineX + 1; x < shrineX + shrineWidth - 1; x += 2) {
    tiles[shrineY + shrineHeight + 1][x].overlayObject = { type: OverlayObjectType.PAPER_LANTERN, rotation: 0 };
  }
  
  // Sacred sake vessels
  tiles[shrineY + 2][shrineX + 1].overlayObject = { type: OverlayObjectType.VASE, rotation: 0 };
  tiles[shrineY + 2][shrineX + shrineWidth - 2].overlayObject = { type: OverlayObjectType.VASE, rotation: 0 };
  
  // Meditation cushions for visitors
  for (let y = centerY + 2; y < centerY + 5; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x += 2) {
      if (x !== centerX) { // Leave path clear
        tiles[y][x].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
      }
    }
  }
  
  interactionZones.push({
    id: 'shrine',
    bounds: { x: shrineX, y: shrineY, width: shrineWidth, height: shrineHeight },
    type: 'religious',
    interactions: ['pray', 'make_offering', 'request_blessing']
  });
  
  interactionZones.push({
    id: 'purification',
    bounds: { x: centerX - 3, y: centerY + 5, width: 7, height: 3 },
    type: 'ritual',
    interactions: ['purify_hands', 'rinse_mouth']
  });
}

/**
 * Fallback generator for unknown cultural zones
 */
function generateGenericSacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
) {
  console.log(`[SacredGenerator] Using enhanced procedural sacred layout`);
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create generic sanctuary room
  rooms.push(RoomTemplates.sanctuary(centerX, centerY, Math.min(8, Math.floor(Math.min(size.width, size.height) / 3))));
  
  // Choose random layout style
  const layoutStyle = Math.floor(noise.random() * 4);
  
  // Choose floor materials with variety
  const floorMaterials = [
    [BiomeType.STONE, BiomeType.MARBLE],
    [BiomeType.SANDSTONE, BiomeType.TERRACOTTA],
    [BiomeType.BASALT, BiomeType.VOLCANIC_STONE],
    [BiomeType.MARBLE, BiomeType.GOLD_COAST]
  ];
  const [primaryFloor, accentFloor] = floorMaterials[Math.floor(noise.random() * floorMaterials.length)];
  
  // Generate varied floor patterns
  switch (layoutStyle) {
    case 0: // Checkered pattern
      for (let y = 0; y < size.height; y++) {
        for (let x = 0; x < size.width; x++) {
          tiles[y][x].biome = ((x + y) % 2 === 0) ? primaryFloor : accentFloor;
        }
      }
      break;
      
    case 1: // Radial pattern
      for (let y = 0; y < size.height; y++) {
        for (let x = 0; x < size.width; x++) {
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          tiles[y][x].biome = (Math.floor(dist / 3) % 2 === 0) ? primaryFloor : accentFloor;
        }
      }
      break;
      
    case 2: // Diamond pattern
      for (let y = 0; y < size.height; y++) {
        for (let x = 0; x < size.width; x++) {
          const manhattan = Math.abs(x - centerX) + Math.abs(y - centerY);
          tiles[y][x].biome = (manhattan % 4 < 2) ? primaryFloor : accentFloor;
        }
      }
      break;
      
    default: // Striped pattern
      for (let y = 0; y < size.height; y++) {
        for (let x = 0; x < size.width; x++) {
          tiles[y][x].biome = (x % 3 === 1) ? accentFloor : primaryFloor;
        }
      }
  }
  
  // Create paths with variety
  const pathStyle = Math.floor(noise.random() * 3);
  const pathMaterial = BiomeType.COBBLESTONE;
  
  switch (pathStyle) {
    case 0: // Cross paths
      for (let x = centerX - 1; x <= centerX + 1; x++) {
        for (let y = 0; y < size.height; y++) {
          if (x >= 0 && x < size.width) tiles[y][x].biome = pathMaterial;
        }
      }
      for (let y = centerY - 1; y <= centerY + 1; y++) {
        for (let x = 0; x < size.width; x++) {
          if (y >= 0 && y < size.height) tiles[y][x].biome = pathMaterial;
        }
      }
      break;
      
    case 1: // Diagonal paths
      for (let i = 0; i < Math.min(size.width, size.height); i++) {
        if (i < size.width && i < size.height) {
          tiles[i][i].biome = pathMaterial;
          tiles[i][size.width - 1 - i].biome = pathMaterial;
        }
      }
      break;
      
    case 2: // Circular path
      const radius = Math.min(size.width, size.height) / 3;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const x = Math.floor(centerX + Math.cos(angle) * radius);
        const y = Math.floor(centerY + Math.sin(angle) * radius);
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles[y][x].biome = pathMaterial;
        }
      }
      break;
  }
  
  // Central feature with variety
  const centralFeatures = [
    OverlayObjectType.SHRINE,
    OverlayObjectType.STATUE,
    OverlayObjectType.FOUNTAIN,
    OverlayObjectType.FIRE_PIT
  ];
  const centralFeature = centralFeatures[Math.floor(noise.random() * centralFeatures.length)];
  
  tiles[centerY][centerX].overlayObject = {
    type: centralFeature,
    rotation: 0
  };
  tiles[centerY][centerX].isBlocking = true;
  
  // Varied column/pillar arrangements
  const columnStyle = Math.floor(noise.random() * 3);
  const columnType = noise.random() > 0.5 ? OverlayObjectType.COLUMN : OverlayObjectType.PILLAR;
  
  switch (columnStyle) {
    case 0: // Square arrangement
      const positions = [
        { x: centerX - 5, y: centerY - 5 },
        { x: centerX + 5, y: centerY - 5 },
        { x: centerX - 5, y: centerY + 5 },
        { x: centerX + 5, y: centerY + 5 },
      ];
      positions.forEach(pos => {
        if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
          tiles[pos.y][pos.x].overlayObject = { type: columnType, rotation: 0 };
        }
      });
      break;
      
    case 1: // Circle of columns
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.floor(centerX + Math.cos(angle) * 6);
        const y = Math.floor(centerY + Math.sin(angle) * 6);
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles[y][x].overlayObject = { type: columnType, rotation: 0 };
        }
      }
      break;
      
    case 2: // Colonnade rows
      for (let x = 3; x < size.width - 3; x += 3) {
        if (x >= 0 && x < size.width) {
          if (3 < size.height) tiles[3][x].overlayObject = { type: columnType, rotation: 0 };
          if (size.height - 4 >= 0) tiles[size.height - 4][x].overlayObject = { type: columnType, rotation: 0 };
        }
      }
      break;
  }
  
  // Add varied decorative elements
  const decorStyle = Math.floor(noise.random() * 3);
  
  switch (decorStyle) {
    case 0: // Braziers in corners
      const brazierCorners = [
        { x: 2, y: 2 },
        { x: size.width - 3, y: 2 },
        { x: 2, y: size.height - 3 },
        { x: size.width - 3, y: size.height - 3 },
      ];
      brazierCorners.forEach(pos => {
        if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
          tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };
        }
      });
      break;
      
    case 1: // Torches along walls
      for (let x = 4; x < size.width - 4; x += 4) {
        if (1 < size.height && !tiles[1][x].overlayObject) 
          tiles[1][x].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
        if (size.height - 2 >= 0 && !tiles[size.height - 2][x].overlayObject) 
          tiles[size.height - 2][x].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
      }
      break;
      
    case 2: // Candelabras in pattern
      for (let y = 4; y < size.height - 4; y += 4) {
        for (let x = 4; x < size.width - 4; x += 4) {
          if (!tiles[y][x].overlayObject) {
            tiles[y][x].overlayObject = { type: OverlayObjectType.CANDELABRA, rotation: 0 };
          }
        }
      }
      break;
  }
  
  // Add varied seating arrangements
  const seatingStyle = Math.floor(noise.random() * 3);
  const seatType = noise.random() > 0.5 ? OverlayObjectType.BENCH : OverlayObjectType.CUSHION;
  
  switch (seatingStyle) {
    case 0: // Rows facing center
      for (let x = centerX - 3; x <= centerX + 3; x += 2) {
        const y = centerY + 5;
        if (x >= 0 && x < size.width && y >= 0 && y < size.height && !tiles[y][x].overlayObject) {
          tiles[y][x].overlayObject = { type: seatType, rotation: 0 };
        }
      }
      break;
      
    case 1: // Circle around center
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Math.PI / 16;
        const x = Math.floor(centerX + Math.cos(angle) * 4);
        const y = Math.floor(centerY + Math.sin(angle) * 4);
        if (x >= 0 && x < size.width && y >= 0 && y < size.height && !tiles[y][x].overlayObject) {
          tiles[y][x].overlayObject = { type: seatType, rotation: 0 };
        }
      }
      break;
      
    case 2: // Corners
      const cornerSeats = [
        { x: 3, y: 3 },
        { x: size.width - 4, y: 3 },
        { x: 3, y: size.height - 4 },
        { x: size.width - 4, y: size.height - 4 },
      ];
      cornerSeats.forEach(pos => {
        if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
          tiles[pos.y][pos.x].overlayObject = { type: seatType, rotation: 0 };
        }
      });
      break;
  }
  
  // Add offering areas with variety
  const offeringStyle = Math.floor(noise.random() * 2);
  
  if (offeringStyle === 0) {
    // Offering tables around center
    const offsets = [[-3, 0], [3, 0], [0, -3]];
    offsets.forEach(([dx, dy]) => {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < size.width && y >= 0 && y < size.height && !tiles[y][x].overlayObject) {
        tiles[y][x].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
      }
    });
  } else {
    // Additional shrines in corners
    const shrinePositions = [
      { x: centerX - 6, y: centerY - 6 },
      { x: centerX + 6, y: centerY - 6 },
    ];
    shrinePositions.forEach(pos => {
      if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
        tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
      }
    });
  }
  
  interactionZones.push({
    id: 'shrine',
    bounds: { x: centerX - 4, y: centerY - 2, width: 9, height: 8 },
    type: 'religious',
    interactions: ['pray', 'make_offering', 'meditate']
  });
}

/**
 * Renaissance Cathedral - elaborate architecture with side chapels, high dome, ornate decoration
 */
function generateRenaissanceCathedral(tiles: Tile[][], size: { width: number, height: number }, centerX: number, centerY: number, config: SpecialMapConfig, interactionZones: InteractionZone[]) {
  // Elaborate marble flooring with mosaic patterns
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_MARBLE);

  // Add decorative mosaic border
  for (let x = 0; x < size.width; x++) {
    tiles[0][x].biome = BiomeType.FLOOR_MOSAIC_BORDER;
    tiles[size.height - 1][x].biome = BiomeType.FLOOR_MOSAIC_BORDER;
  }
  for (let y = 0; y < size.height; y++) {
    tiles[y][0].biome = BiomeType.FLOOR_MOSAIC_BORDER;
    tiles[y][size.width - 1].biome = BiomeType.FLOOR_MOSAIC_BORDER;
  }

  // Large central mosaic medallion
  const mosaicRadius = 3;
  for (let dy = -mosaicRadius; dy <= mosaicRadius; dy++) {
    for (let dx = -mosaicRadius; dx <= mosaicRadius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const x = centerX + dx;
      const y = centerY + dy;
      if (dist <= mosaicRadius && x >= 0 && x < size.width && y >= 0 && y < size.height) {
        if (dist < 1) {
          tiles[y][x].biome = BiomeType.FLOOR_MOSAIC_CENTER;
        } else {
          tiles[y][x].biome = BiomeType.FLOOR_MOSAIC;
        }
      }
    }
  }

  // Back wall with large windows
  applyNorthBackWall(tiles, 0, 0, size.width, config, {
    hasWindows: true,
    windowSpacing: 3
  });

  // Grand nave with colonnade
  const naveWidth = Math.min(10, size.width - 8);
  const naveX = centerX - Math.floor(naveWidth / 2);

  // Double rows of massive columns forming nave
  for (let y = 4; y < size.height - 4; y += 4) {
    placePillar(tiles, naveX + 1, y, 'white_marble', config.specificYear || 1500);
    placePillar(tiles, naveX + naveWidth - 2, y, 'white_marble', config.specificYear || 1500);
  }

  // High altar with elaborate setup
  const altarY = 4;
  tiles[altarY][centerX].overlayObject = { type: OverlayObjectType.ALTAR, rotation: 0 };
  tiles[altarY][centerX].isBlocking = true;

  // Altar surrounded by candelabras
  tiles[altarY + 1][centerX - 2].overlayObject = { type: OverlayObjectType.CANDELABRA, rotation: 0 };
  tiles[altarY + 1][centerX + 2].overlayObject = { type: OverlayObjectType.CANDELABRA, rotation: 0 };
  tiles[altarY - 1][centerX - 1].overlayObject = { type: OverlayObjectType.CANDELABRA, rotation: 0 };
  tiles[altarY - 1][centerX + 1].overlayObject = { type: OverlayObjectType.CANDELABRA, rotation: 0 };

  // Side chapels along the walls (transepts)
  const chapelY = Math.floor(size.height * 0.4);

  // Left chapel
  const leftChapelX = 2;
  fillArea(tiles, leftChapelX, chapelY - 2, 4, 5, BiomeType.FLOOR_TILE);
  tiles[chapelY][leftChapelX + 1].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
  tiles[chapelY + 1][leftChapelX + 2].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };

  // Right chapel
  const rightChapelX = size.width - 6;
  fillArea(tiles, rightChapelX, chapelY - 2, 4, 5, BiomeType.FLOOR_TILE);
  tiles[chapelY][rightChapelX + 2].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
  tiles[chapelY + 1][rightChapelX + 1].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };

  // Confessional booths in side chapels
  tiles[chapelY - 1][leftChapelX].overlayObject = { type: OverlayObjectType.BOOTH_BACK, rotation: 0 };
  tiles[chapelY][leftChapelX].overlayObject = { type: OverlayObjectType.BOOTH_FRONT, rotation: 0 };

  // Organ position (represented by large bookshelf structure)
  const organY = 2;
  for (let x = centerX - 2; x <= centerX + 2; x++) {
    tiles[organY][x].overlayObject = { type: OverlayObjectType.BOOKSHELF, rotation: 0 };
    tiles[organY][x].isBlocking = true;
  }

  // Elaborate wooden pews in the nave
  for (let y = size.height - Math.floor(size.height * 0.6); y < size.height - 4; y += 3) {
    // Left pews
    for (let x = naveX + 2; x < centerX - 2; x++) {
      if (y >= 0 && y < size.height && !tiles[y][x].overlayObject) {
        tiles[y][x].overlayObject = { type: OverlayObjectType.BENCH_EAST_WEST, rotation: 0 };
        break; // One bench per row
      }
    }
    // Right pews
    for (let x = centerX + 3; x < naveX + naveWidth - 2; x++) {
      if (y >= 0 && y < size.height && !tiles[y][x].overlayObject) {
        tiles[y][x].overlayObject = { type: OverlayObjectType.BENCH_EAST_WEST, rotation: 0 };
        break;
      }
    }
  }

  // Pulpit
  tiles[Math.floor(size.height * 0.5)][naveX + 2].overlayObject = { type: OverlayObjectType.PODIUM, rotation: 0 };
  tiles[Math.floor(size.height * 0.5)][naveX + 2].isBlocking = true;

  // Baptismal font
  tiles[size.height - 5][centerX - 4].overlayObject = { type: OverlayObjectType.BASIN, rotation: 0 };

  // Treasury chests in sacristy areas
  tiles[3][2].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };
  tiles[3][size.width - 3].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };

  interactionZones.push({
    id: 'high_altar',
    bounds: { x: centerX - 3, y: altarY - 2, width: 7, height: 6 },
    type: 'religious',
    interactions: ['pray', 'take_communion', 'admire_art', 'light_candle']
  });

  interactionZones.push({
    id: 'side_chapels',
    bounds: { x: 2, y: chapelY - 2, width: size.width - 4, height: 5 },
    type: 'religious',
    interactions: ['pray', 'light_votive_candle', 'confess']
  });
}

/**
 * Modern Church - contemporary design with simple lines, open floor plan
 */
function generateModernChurch(tiles: Tile[][], size: { width: number, height: number }, centerX: number, centerY: number, config: SpecialMapConfig, interactionZones: InteractionZone[]) {
  // Modern tile flooring with clean pattern
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_TILE);

  // Checkered accent pattern
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if ((x + y) % 4 === 0) {
        tiles[y][x].biome = BiomeType.FLOOR_CHECKERED;
      }
    }
  }

  // Simple back wall with large windows for natural light
  applyNorthBackWall(tiles, 0, 0, size.width, config, {
    hasWindows: true,
    windowSpacing: 2  // Many windows for modern design
  });

  // Open floor plan - no colonnade, just open space
  const sanctuaryWidth = Math.min(12, size.width - 4);
  const sanctuaryX = centerX - Math.floor(sanctuaryWidth / 2);

  // Simple modern altar
  const altarY = 5;
  tiles[altarY][centerX].overlayObject = { type: OverlayObjectType.ALTAR, rotation: 0 };
  tiles[altarY][centerX].isBlocking = true;

  // Modern podium/lectern for preaching
  tiles[altarY + 2][centerX + 3].overlayObject = { type: OverlayObjectType.PODIUM, rotation: 0 };
  tiles[altarY + 2][centerX + 3].isBlocking = true;

  // Simple table for communion
  tiles[altarY][centerX - 3].overlayObject = { type: OverlayObjectType.TABLE, rotation: 0 };

  // Modern chairs instead of pews (more flexible seating)
  for (let y = Math.floor(size.height * 0.4); y < size.height - 4; y += 2) {
    for (let x = sanctuaryX + 1; x < sanctuaryX + sanctuaryWidth - 1; x += 3) {
      if (!tiles[y][x].overlayObject && x !== centerX && x !== centerX - 1 && x !== centerX + 1) {
        tiles[y][x].overlayObject = { type: OverlayObjectType.CHAIR, rotation: 0 };
      }
    }
  }

  // Welcome desk near entrance
  tiles[size.height - 4][centerX - 4].overlayObject = { type: OverlayObjectType.DESK_FACING_SOUTH, rotation: 0 };

  // Coffee/fellowship area (cabinets for supplies)
  tiles[size.height - 3][2].overlayObject = { type: OverlayObjectType.CABINET, rotation: 0 };
  tiles[size.height - 3][3].overlayObject = { type: OverlayObjectType.CABINET, rotation: 0 };

  // Bookshelf for free literature
  tiles[size.height - 4][size.width - 3].overlayObject = { type: OverlayObjectType.BOOKSHELF, rotation: 0 };

  // Modern lighting
  for (let y = 6; y < size.height - 6; y += 6) {
    for (let x = 4; x < size.width - 4; x += 6) {
      if (!tiles[y][x].overlayObject) {
        tiles[y][x].overlayObject = { type: OverlayObjectType.HANGING_LANTERN, rotation: 0 };
      }
    }
  }

  // Prayer room/quiet area in corner
  const prayerX = 2;
  const prayerY = 3;
  fillArea(tiles, prayerX, prayerY, 4, 4, BiomeType.CARPET);
  tiles[prayerY + 1][prayerX + 1].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
  tiles[prayerY + 2][prayerX + 2].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };

  // Nursery/children's area in opposite corner
  const nurseryX = size.width - 6;
  const nurseryY = 3;
  fillArea(tiles, nurseryX, nurseryY, 4, 4, BiomeType.CARPET);

  interactionZones.push({
    id: 'sanctuary',
    bounds: { x: sanctuaryX, y: altarY - 2, width: sanctuaryWidth, height: 8 },
    type: 'religious',
    interactions: ['pray', 'worship', 'take_communion']
  });

  interactionZones.push({
    id: 'fellowship_area',
    bounds: { x: 2, y: size.height - 5, width: size.width - 4, height: 4 },
    type: 'social',
    interactions: ['fellowship', 'get_coffee', 'take_literature']
  });
}

/**
 * Ancient MENA Temple - Mesopotamian/Egyptian/Persian temple architecture
 */
function generateAncientMENATemple(tiles: Tile[][], size: { width: number, height: number }, centerX: number, centerY: number, config: SpecialMapConfig, interactionZones: InteractionZone[]) {
  // Stone floor base (sandstone for desert temples)
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_STONE);

  // Sacred inner sanctum with elevated floor
  const sanctumWidth = Math.min(8, size.width - 8);
  const sanctumHeight = Math.min(6, size.height - 8);
  const sanctumX = centerX - Math.floor(sanctumWidth / 2);
  const sanctumY = 3;
  fillArea(tiles, sanctumX, sanctumY, sanctumWidth, sanctumHeight, BiomeType.FLOOR_TILE);

  // Hypostyle hall - massive columns throughout
  const year = config.specificYear || -500;

  // Outer colonnade forming perimeter
  for (let x = 3; x < size.width - 3; x += 4) {
    placePillar(tiles, x, 2, 'sandstone', year);
    if (size.height - 3 >= 0) placePillar(tiles, x, size.height - 3, 'sandstone', year);
  }
  for (let y = 6; y < size.height - 6; y += 4) {
    placePillar(tiles, 3, y, 'sandstone', year);
    placePillar(tiles, size.width - 4, y, 'sandstone', year);
  }

  // Inner colonnade leading to sanctum
  for (let y = sanctumY + sanctumHeight + 2; y < size.height - 4; y += 3) {
    placePillar(tiles, centerX - 4, y, 'sandstone', year);
    placePillar(tiles, centerX + 4, y, 'sandstone', year);
  }

  // Back wall (typically solid in ancient temples)
  applyNorthBackWall(tiles, 0, 0, size.width, config, {
    hasWindows: false,
    windowSpacing: 0
  });

  // Cult statue of deity in sanctum
  tiles[sanctumY + 2][centerX].overlayObject = { type: OverlayObjectType.STATUE, rotation: 0 };
  tiles[sanctumY + 2][centerX].isBlocking = true;

  // Altar before the deity statue
  tiles[sanctumY + 4][centerX].overlayObject = { type: OverlayObjectType.ALTAR, rotation: 0 };
  tiles[sanctumY + 4][centerX].isBlocking = true;

  // Offering tables on both sides
  tiles[sanctumY + 3][sanctumX + 1].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
  tiles[sanctumY + 3][sanctumX + sanctumWidth - 2].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };

  // Sacred eternal flames in braziers
  tiles[sanctumY + 5][centerX - 2].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };
  tiles[sanctumY + 5][centerX + 2].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };

  // Treasury chests for temple wealth
  tiles[sanctumY + 1][sanctumX + 1].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };
  tiles[sanctumY + 1][sanctumX + sanctumWidth - 2].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };

  // Incense burners along approach
  for (let y = sanctumY + sanctumHeight + 3; y < size.height - 5; y += 4) {
    tiles[y][centerX - 2].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };
    tiles[y][centerX + 2].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };
  }

  // Priestly benches along walls for ritual attendants
  for (let x = 5; x < size.width - 5; x += 4) {
    if (x !== centerX && x !== centerX - 1 && x !== centerX + 1) {
      tiles[size.height - 5][x].overlayObject = { type: OverlayObjectType.BENCH, rotation: 0 };
    }
  }

  // Sacred pool/basin for ritual purification
  tiles[size.height - 4][centerX].overlayObject = { type: OverlayObjectType.BASIN, rotation: 0 };

  // Ritual tables for sacrifices in forecourt
  tiles[sanctumY + sanctumHeight + 5][centerX - 3].overlayObject = { type: OverlayObjectType.TABLE, rotation: 0 };
  tiles[sanctumY + sanctumHeight + 5][centerX + 3].overlayObject = { type: OverlayObjectType.TABLE, rotation: 0 };

  // Storage for ritual implements
  tiles[2][2].overlayObject = { type: OverlayObjectType.CABINET, rotation: 0 };
  tiles[2][size.width - 3].overlayObject = { type: OverlayObjectType.CABINET, rotation: 0 };

  interactionZones.push({
    id: 'inner_sanctum',
    bounds: { x: sanctumX - 1, y: sanctumY, width: sanctumWidth + 2, height: sanctumHeight },
    type: 'religious',
    interactions: ['pray_to_deity', 'make_offering', 'seek_oracle']
  });

  interactionZones.push({
    id: 'ritual_court',
    bounds: { x: centerX - 5, y: sanctumY + sanctumHeight, width: 11, height: size.height - sanctumY - sanctumHeight - 6 },
    type: 'ritual',
    interactions: ['perform_sacrifice', 'ritual_purification', 'consult_priests']
  });
}

/**
 * Zoroastrian Fire Temple - centered on sacred eternal flame
 */
function generateZoroastrianTemple(tiles: Tile[][], size: { width: number, height: number }, centerX: number, centerY: number, config: SpecialMapConfig, interactionZones: InteractionZone[]) {
  // Stone floor throughout
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_STONE);

  // Central fire chamber with elevated platform
  const chamberRadius = 4;
  for (let dy = -chamberRadius; dy <= chamberRadius; dy++) {
    for (let dx = -chamberRadius; dx <= chamberRadius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const x = centerX + dx;
      const y = centerY + dy;
      if (dist <= chamberRadius && x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.FLOOR_TILE;
      }
    }
  }

  // Back wall
  applyNorthBackWall(tiles, 0, 0, size.width, config, {
    hasWindows: false,  // Fire temples are typically enclosed
    windowSpacing: 0
  });

  // Sacred eternal fire at center - THE MOST IMPORTANT ELEMENT
  tiles[centerY][centerX].overlayObject = { type: OverlayObjectType.FIRE_PIT, rotation: 0 };
  tiles[centerY][centerX].isBlocking = true;

  // Four pillars around the sacred fire (representing the four elements)
  const pillarDist = 3;
  const year = config.specificYear || 500;
  placePillar(tiles, centerX - pillarDist, centerY - pillarDist, 'stone', year);
  placePillar(tiles, centerX + pillarDist, centerY - pillarDist, 'stone', year);
  placePillar(tiles, centerX - pillarDist, centerY + pillarDist, 'stone', year);
  placePillar(tiles, centerX + pillarDist, centerY + pillarDist, 'stone', year);

  // Outer circle of columns forming the temple perimeter
  const outerRadius = Math.min(size.width, size.height) / 2 - 3;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.floor(centerX + Math.cos(angle) * outerRadius);
    const y = Math.floor(centerY + Math.sin(angle) * outerRadius);
    if (x >= 2 && x < size.width - 2 && y >= 2 && y < size.height - 2) {
      placePillar(tiles, x, y, 'stone', year);
    }
  }

  // Braziers for additional sacred fires at cardinal directions
  const firePositions = [
    { x: centerX, y: centerY - 5 },      // North
    { x: centerX + 5, y: centerY },      // East
    { x: centerX, y: centerY + 5 },      // South
    { x: centerX - 5, y: centerY }       // West
  ];

  firePositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };
    }
  });

  // Prayer mats (cushions) arranged in concentric circles for worshippers
  const prayerRadius = 7;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const x = Math.floor(centerX + Math.cos(angle) * prayerRadius);
    const y = Math.floor(centerY + Math.sin(angle) * prayerRadius);
    if (x >= 0 && x < size.width && y >= 0 && y < size.height && !tiles[y][x].overlayObject) {
      tiles[y][x].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
    }
  }

  // Altar for offerings near the sacred fire
  if (centerY - 2 >= 0) {
    tiles[centerY - 2][centerX].overlayObject = { type: OverlayObjectType.ALTAR, rotation: 0 };
  }

  // Offering tables at intermediate positions
  if (centerX - 2 >= 0 && centerY + 3 < size.height) {
    tiles[centerY + 3][centerX - 2].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
  }
  if (centerX + 2 < size.width && centerY + 3 < size.height) {
    tiles[centerY + 3][centerX + 2].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
  }

  // Sacred texts storage (bookshelves for Avesta)
  if (size.height - 3 >= 0) {
    tiles[size.height - 3][2].overlayObject = { type: OverlayObjectType.BOOKSHELF, rotation: 0 };
    tiles[size.height - 3][size.width - 3].overlayObject = { type: OverlayObjectType.BOOKSHELF, rotation: 0 };
  }

  // Purification basin near entrance
  if (size.height - 4 >= 0) {
    tiles[size.height - 4][centerX].overlayObject = { type: OverlayObjectType.BASIN, rotation: 0 };
  }

  // Priest's implements storage
  tiles[2][2].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };
  tiles[2][size.width - 3].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };

  // Additional braziers along the walls for illumination
  for (let x = 5; x < size.width - 5; x += 5) {
    if (2 < size.height && !tiles[2][x].overlayObject) {
      tiles[2][x].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };
    }
  }

  interactionZones.push({
    id: 'sacred_fire',
    bounds: { x: centerX - 2, y: centerY - 2, width: 5, height: 5 },
    type: 'religious',
    interactions: ['tend_sacred_fire', 'pray_to_ahura_mazda', 'make_offering']
  });

  interactionZones.push({
    id: 'prayer_area',
    bounds: { x: centerX - 8, y: centerY - 8, width: 17, height: 17 },
    type: 'religious',
    interactions: ['pray', 'meditate', 'recite_mantras']
  });
}

/**
 * Buddhist Temple Complex - pagoda-style architecture with meditation hall
 */
function generateBuddhistTempleComplex(tiles: Tile[][], size: { width: number, height: number }, centerX: number, centerY: number, config: SpecialMapConfig, interactionZones: InteractionZone[]) {
  // Wooden floor throughout (traditional East Asian temple construction)
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_WOOD);

  // Back wall
  applyNorthBackWall(tiles, 0, 0, size.width, config, {
    hasWindows: true,
    windowSpacing: 4
  });

  // Main hall with Buddha statue
  const hallWidth = Math.min(10, size.width - 6);
  const hallHeight = Math.min(8, size.height - 8);
  const hallX = centerX - Math.floor(hallWidth / 2);
  const hallY = 3;

  // Elevated platform for Buddha hall
  fillArea(tiles, hallX, hallY, hallWidth, hallHeight, BiomeType.FLOOR_TILE);

  // Large Buddha statue at center back
  tiles[hallY + 2][centerX].overlayObject = { type: OverlayObjectType.STATUE, rotation: 0 };
  tiles[hallY + 2][centerX].isBlocking = true;

  // Altar before Buddha
  tiles[hallY + 4][centerX].overlayObject = { type: OverlayObjectType.ALTAR, rotation: 0 };

  // Offering tables with incense and flowers
  tiles[hallY + 3][centerX - 2].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
  tiles[hallY + 3][centerX + 2].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };

  // Additional bodhisattva statues flanking the main Buddha
  tiles[hallY + 2][hallX + 1].overlayObject = { type: OverlayObjectType.STATUE, rotation: 0 };
  tiles[hallY + 2][hallX + hallWidth - 2].overlayObject = { type: OverlayObjectType.STATUE, rotation: 0 };

  // Tiered pagoda represented by stacked pillars at corners
  const year = config.specificYear || 800;
  placePillar(tiles, hallX, hallY, 'wood', year);
  placePillar(tiles, hallX + hallWidth - 1, hallY, 'wood', year);
  placePillar(tiles, hallX, hallY + hallHeight - 1, 'wood', year);
  placePillar(tiles, hallX + hallWidth - 1, hallY + hallHeight - 1, 'wood', year);

  // Paper lanterns hanging throughout
  for (let y = hallY + 2; y < hallY + hallHeight - 2; y += 3) {
    for (let x = hallX + 2; x < hallX + hallWidth - 2; x += 4) {
      if (!tiles[y][x].overlayObject) {
        tiles[y][x].overlayObject = { type: OverlayObjectType.PAPER_LANTERN, rotation: 0 };
      }
    }
  }

  // Meditation hall (separate area with cushions)
  const meditationY = hallY + hallHeight + 2;
  const meditationWidth = hallWidth - 4;
  const meditationX = centerX - Math.floor(meditationWidth / 2);

  // Meditation cushions in orderly rows
  for (let y = meditationY; y < meditationY + 5; y += 2) {
    for (let x = meditationX; x < meditationX + meditationWidth; x += 2) {
      if (y < size.height && !tiles[y][x].overlayObject) {
        tiles[y][x].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
      }
    }
  }

  // Incense burners (braziers) around meditation area
  if (meditationY < size.height) {
    tiles[meditationY][meditationX - 1].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };
    tiles[meditationY][meditationX + meditationWidth].overlayObject = { type: OverlayObjectType.BRAZIER, rotation: 0 };
  }

  // Drum tower (barrel as drum)
  tiles[hallY][hallX - 2].overlayObject = { type: OverlayObjectType.BARREL, rotation: 0 };
  tiles[hallY][hallX - 2].isBlocking = true;

  // Bell tower (hanging lantern representing bell)
  tiles[hallY][hallX + hallWidth + 1].overlayObject = { type: OverlayObjectType.HANGING_LANTERN, rotation: 0 };

  // Sutra library (bookshelves)
  tiles[hallY + 1][hallX + 1].overlayObject = { type: OverlayObjectType.BOOKSHELF, rotation: 0 };
  tiles[hallY + 1][hallX + hallWidth - 2].overlayObject = { type: OverlayObjectType.BOOKSHELF, rotation: 0 };

  // Prayer wheels (represented by columns with decorative intent)
  const prayerWheelPositions = [
    { x: hallX - 2, y: hallY + 4 },
    { x: hallX + hallWidth + 1, y: hallY + 4 }
  ];
  prayerWheelPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.PILLAR, rotation: 0 };
    }
  });

  // Donation box (chest)
  tiles[hallY + hallHeight - 2][centerX].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };

  // Garden courtyard with fountain
  if (size.height - 5 >= 0) {
    tiles[size.height - 5][centerX].overlayObject = { type: OverlayObjectType.FOUNTAIN, rotation: 0 };
  }

  // Stone lanterns (pillars) flanking approach
  if (size.height - 6 >= 0) {
    placePillar(tiles, centerX - 3, size.height - 6, 'stone', year);
    placePillar(tiles, centerX + 3, size.height - 6, 'stone', year);
  }

  // Vases with flowers
  tiles[hallY + 5][hallX + 2].overlayObject = { type: OverlayObjectType.VASE, rotation: 0 };
  tiles[hallY + 5][hallX + hallWidth - 3].overlayObject = { type: OverlayObjectType.VASE, rotation: 0 };

  // Monks' benches along walls
  for (let x = hallX + 1; x < hallX + hallWidth - 1; x += 3) {
    if (hallY + hallHeight < size.height && !tiles[hallY + hallHeight][x].overlayObject) {
      tiles[hallY + hallHeight][x].overlayObject = { type: OverlayObjectType.BENCH, rotation: 0 };
    }
  }

  interactionZones.push({
    id: 'buddha_hall',
    bounds: { x: hallX, y: hallY, width: hallWidth, height: hallHeight },
    type: 'religious',
    interactions: ['pray_to_buddha', 'make_offering', 'light_incense', 'chant_sutras']
  });

  interactionZones.push({
    id: 'meditation_hall',
    bounds: { x: meditationX - 2, y: meditationY - 1, width: meditationWidth + 4, height: 7 },
    type: 'religious',
    interactions: ['meditate', 'practice_mindfulness', 'study_dharma']
  });
}

function generateSouthAsianSacred(tiles: Tile[][], size: { width: number, height: number }, config: SpecialMapConfig, interactionZones: InteractionZone[], rooms: RoomDefinition[], noise: ValueNoise) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Fill with ornate floor patterns
  const floorPattern = noise.random() > 0.5 ? BiomeType.SANDSTONE : BiomeType.MARBLE;
  const accentPattern = noise.random() > 0.5 ? BiomeType.VOLCANIC_STONE : BiomeType.TERRACOTTA;
  
  // Create mandala-inspired floor pattern
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const ringIndex = Math.floor(distFromCenter / 3);
      
      // Alternating concentric rings
      tiles[y][x].biome = ringIndex % 2 === 0 ? floorPattern : accentPattern;
      
      // Add radial patterns
      const angle = Math.atan2(y - centerY, x - centerX);
      const sector = Math.floor((angle + Math.PI) / (Math.PI / 4));
      if (sector % 2 === 0 && distFromCenter < 8 && distFromCenter > 2) {
        tiles[y][x].biome = BiomeType.GOLD_COAST;
      }
    }
  }
  
  // Create processional path from entrance
  for (let y = size.height - 1; y > centerY; y--) {
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      if (x >= 0 && x < size.width) {
        tiles[y][x].biome = BiomeType.MARBLE;
      }
    }
  }
  
  // Place ornate columns in symmetrical pattern
  const columnPositions = [
    { x: centerX - 6, y: centerY - 6 },
    { x: centerX + 6, y: centerY - 6 },
    { x: centerX - 6, y: centerY + 6 },
    { x: centerX + 6, y: centerY + 6 },
    { x: centerX - 3, y: centerY - 3 },
    { x: centerX + 3, y: centerY - 3 },
    { x: centerX - 3, y: centerY + 3 },
    { x: centerX + 3, y: centerY + 3 },
  ];
  
  columnPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.COLUMN,
        position: { x: pos.x, y: pos.y }
      };
    }
  });
  
  // Central shrine with offerings
  if (centerY >= 0 && centerY < size.height && centerX >= 0 && centerX < size.width) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.SHRINE,
      position: { x: centerX, y: centerY }
    };
    
    // Offering tables around shrine
    const offeringPositions = [
      { x: centerX - 2, y: centerY },
      { x: centerX + 2, y: centerY },
      { x: centerX, y: centerY - 2 },
    ];
    
    offeringPositions.forEach(pos => {
      if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
        tiles[pos.y][pos.x].overlayObject = {
          type: OverlayObjectType.OFFERING_TABLE,
          position: { x: pos.x, y: pos.y }
        };
      }
    });
  }
  
  // Add brass lamps (braziers) in corners
  const lampPositions = [
    { x: 2, y: 2 },
    { x: size.width - 3, y: 2 },
    { x: 2, y: size.height - 3 },
    { x: size.width - 3, y: size.height - 3 },
  ];
  
  lampPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.BRAZIER,
        position: { x: pos.x, y: pos.y }
      };
    }
  });
  
  // Add Persian rugs (using carpet/rug overlay if available, else cushions)
  const rugPositions = [
    { x: centerX - 4, y: centerY },
    { x: centerX + 4, y: centerY },
    { x: centerX, y: centerY + 4 },
  ];
  
  rugPositions.forEach(pos => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const rx = pos.x + dx;
        const ry = pos.y + dy;
        if (rx >= 0 && rx < size.width && ry >= 0 && ry < size.height && !tiles[ry][rx].overlayObject) {
          tiles[ry][rx].overlayObject = {
            type: OverlayObjectType.CUSHION,
            position: { x: rx, y: ry }
          };
        }
      }
    }
  });
  
  // Add fountains for ablution
  const fountainPositions = [
    { x: centerX - 8, y: centerY },
    { x: centerX + 8, y: centerY },
  ];
  
  fountainPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.FOUNTAIN,
        position: { x: pos.x, y: pos.y }
      };
    }
  });
  
  // Add interaction zone at shrine
  interactionZones.push({
    x: centerX,
    y: centerY,
    width: 3,
    height: 3,
    type: 'shrine',
    description: 'Sacred shrine',
    isActive: true
  });
}

function generateAfricanSacred(tiles: Tile[][], size: { width: number, height: number }, config: SpecialMapConfig, interactionZones: InteractionZone[], rooms: RoomDefinition[], noise: ValueNoise) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create organic, circular sacred space
  const baseFloor = noise.random() > 0.5 ? BiomeType.SAVANNA : BiomeType.TERRACOTTA;
  const pathMaterial = BiomeType.DIRT_DARK;
  
  // Fill with base floor
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = baseFloor;
    }
  }
  
  // Create spiral path pattern
  let angle = 0;
  let radius = 1;
  while (radius < Math.min(size.width, size.height) / 2) {
    const x = Math.floor(centerX + Math.cos(angle) * radius);
    const y = Math.floor(centerY + Math.sin(angle) * radius);
    
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      tiles[y][x].biome = pathMaterial;
      // Widen the path
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < size.width && ny >= 0 && ny < size.height && noise.random() > 0.3) {
            tiles[ny][nx].biome = pathMaterial;
          }
        }
      }
    }
    
    angle += 0.2;
    radius += 0.1;
  }
  
  // Central sacred fire
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.FIRE_PIT,
    position: { x: centerX, y: centerY }
  };
  
  // Ring of ceremonial drums around center
  const drumRadius = 5;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.floor(centerX + Math.cos(angle) * drumRadius);
    const y = Math.floor(centerY + Math.sin(angle) * drumRadius);
    
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.BARREL, // Used as drum
        position: { x, y }
      };
    }
  }
  
  // Ancestral shrines in cardinal directions
  const shrinePositions = [
    { x: centerX, y: centerY - 8 },
    { x: centerX + 8, y: centerY },
    { x: centerX, y: centerY + 8 },
    { x: centerX - 8, y: centerY },
  ];
  
  shrinePositions.forEach((pos, index) => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.SHRINE,
        position: { x: pos.x, y: pos.y }
      };
      
      // Offering stones around each shrine
      const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      offsets.forEach(([dx, dy]) => {
        const ox = pos.x + dx;
        const oy = pos.y + dy;
        if (ox >= 0 && ox < size.width && oy >= 0 && oy < size.height && !tiles[oy][ox].overlayObject) {
          tiles[oy][ox].biome = BiomeType.VOLCANIC_STONE;
        }
      });
    }
  });
  
  // Ceremonial seating areas (mats/cushions)
  const seatingRadius = 7;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.PI / 24; // Offset from drums
    const x = Math.floor(centerX + Math.cos(angle) * seatingRadius);
    const y = Math.floor(centerY + Math.sin(angle) * seatingRadius);
    
    if (x >= 0 && x < size.width && y >= 0 && y < size.height && !tiles[y][x].overlayObject) {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
        position: { x, y }
      };
    }
  }
  
  // Torches for night ceremonies
  const torchPositions = [
    { x: 2, y: 2 },
    { x: size.width - 3, y: 2 },
    { x: 2, y: size.height - 3 },
    { x: size.width - 3, y: size.height - 3 },
  ];
  
  torchPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.TORCH,
        position: { x: pos.x, y: pos.y }
      };
    }
  });
  
  // Add interaction zone at central fire
  interactionZones.push({
    x: centerX - 1,
    y: centerY - 1,
    width: 3,
    height: 3,
    type: 'sacred_fire',
    description: 'Sacred ceremonial fire',
    isActive: true
  });
}

function generateOceanicSacred(tiles: Tile[][], size: { width: number, height: number }, config: SpecialMapConfig, interactionZones: InteractionZone[], rooms: RoomDefinition[], noise: ValueNoise) {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Base with sand/volcanic stone
  const baseFloor = noise.random() > 0.5 ? BiomeType.SAND : BiomeType.VOLCANIC_STONE;
  const sacredFloor = BiomeType.BASALT;
  
  // Fill with base
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = baseFloor;
    }
  }
  
  // Create marae-style rectangular sacred platform
  const platformWidth = Math.min(12, size.width - 4);
  const platformHeight = Math.min(8, size.height - 8);
  const platformStartX = centerX - Math.floor(platformWidth / 2);
  const platformStartY = centerY - Math.floor(platformHeight / 2);
  
  for (let y = platformStartY; y < platformStartY + platformHeight; y++) {
    for (let x = platformStartX; x < platformStartX + platformWidth; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = sacredFloor;
      }
    }
  }
  
  // Create stone circle pattern around platform
  const stoneRadius = Math.max(platformWidth, platformHeight) / 2 + 3;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const x = Math.floor(centerX + Math.cos(angle) * stoneRadius);
    const y = Math.floor(centerY + Math.sin(angle) * stoneRadius);
    
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      // Standing stones (pillars)
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.PILLAR,
        position: { x, y }
      };
      tiles[y][x].biome = BiomeType.VOLCANIC_STONE;
    }
  }
  
  // Central ceremonial area with tiki/totem
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.STATUE,
    position: { x: centerX, y: centerY }
  };
  
  // Sacred fire pits at platform ends
  const firePositions = [
    { x: platformStartX + 2, y: centerY },
    { x: platformStartX + platformWidth - 3, y: centerY },
  ];
  
  firePositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.FIRE_PIT,
        position: { x: pos.x, y: pos.y }
      };
    }
  });
  
  // Offering platforms
  const offeringPositions = [
    { x: centerX, y: platformStartY + 1 },
    { x: centerX - 3, y: centerY },
    { x: centerX + 3, y: centerY },
  ];
  
  offeringPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.OFFERING_TABLE,
        position: { x: pos.x, y: pos.y }
      };
    }
  });
  
  // Ceremonial seating (woven mats represented by cushions)
  for (let y = platformStartY + platformHeight + 1; y < platformStartY + platformHeight + 3; y++) {
    for (let x = platformStartX + 2; x < platformStartX + platformWidth - 2; x += 2) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.CUSHION,
          position: { x, y }
        };
      }
    }
  }
  
  // Water basins for purification
  const basinPositions = [
    { x: centerX - 6, y: centerY - 6 },
    { x: centerX + 6, y: centerY - 6 },
  ];
  
  basinPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.FOUNTAIN,
        position: { x: pos.x, y: pos.y }
      };
    }
  });
  
  // Add interaction zone at central totem
  interactionZones.push({
    x: centerX - 1,
    y: centerY - 1,
    width: 3,
    height: 3,
    type: 'totem',
    description: 'Sacred totem',
    isActive: true
  });
}

/**
 * Medicine Wheel - Plains Indian sacred circle with four directions
 */
function generateMedicineWheel(tiles: Tile[][], size: { width: number, height: number }, centerX: number, centerY: number, config: SpecialMapConfig, interactionZones: InteractionZone[]) {
  console.log(`[SacredGenerator] Generating Medicine Wheel for Plains sacred site`);

  // Prairie grassland base
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.PRAIRIE);

  // Central stone cairn
  const cairnRadius = 2;
  for (let dy = -cairnRadius; dy <= cairnRadius; dy++) {
    for (let dx = -cairnRadius; dx <= cairnRadius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const x = centerX + dx;
      const y = centerY + dy;
      if (dist <= cairnRadius && x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }

  // Sacred fire at center
  tiles[centerY][centerX].overlayObject = { type: OverlayObjectType.FIRE_PIT, rotation: 0 };
  tiles[centerY][centerX].isBlocking = true;

  // 28 stone spokes radiating outward (representing lunar month)
  const wheelRadius = Math.min(size.width, size.height) / 2 - 2;
  const numSpokes = 28;

  for (let i = 0; i < numSpokes; i++) {
    const angle = (i / numSpokes) * Math.PI * 2;
    // Draw spoke from center outward
    for (let r = cairnRadius + 1; r < wheelRadius; r++) {
      const x = Math.floor(centerX + Math.cos(angle) * r);
      const y = Math.floor(centerY + Math.sin(angle) * r);
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }

  // Outer circle of stones
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    const x = Math.floor(centerX + Math.cos(angle) * wheelRadius);
    const y = Math.floor(centerY + Math.sin(angle) * wheelRadius);
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
      tiles[y][x].overlayObject = { type: OverlayObjectType.PILLAR, rotation: 0 };
    }
  }

  // Four cardinal direction markers (larger stones/pillars)
  const cardinalDist = wheelRadius + 2;
  const cardinalDirections = [
    { x: centerX, y: centerY - cardinalDist, name: 'north' },      // North
    { x: centerX + cardinalDist, y: centerY, name: 'east' },       // East
    { x: centerX, y: centerY + cardinalDist, name: 'south' },      // South
    { x: centerX - cardinalDist, y: centerY, name: 'west' }        // West
  ];

  cardinalDirections.forEach(dir => {
    if (dir.x >= 0 && dir.x < size.width && dir.y >= 0 && dir.y < size.height) {
      const year = config.specificYear || 1000;
      placePillar(tiles, dir.x, dir.y, 'stone', year);
      // Offering table at each direction
      const offsetX = dir.x === centerX ? dir.x : (dir.x > centerX ? dir.x - 1 : dir.x + 1);
      const offsetY = dir.y === centerY ? dir.y : (dir.y > centerY ? dir.y - 1 : dir.y + 1);
      if (offsetX >= 0 && offsetX < size.width && offsetY >= 0 && offsetY < size.height && !tiles[offsetY][offsetX].overlayObject) {
        tiles[offsetY][offsetX].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
      }
    }
  });

  // Sacred bundles at intermediate directions (NE, SE, SW, NW)
  const intermediateDist = Math.floor(wheelRadius * 0.7);
  const intermediateDirections = [
    { x: centerX + intermediateDist, y: centerY - intermediateDist },  // NE
    { x: centerX + intermediateDist, y: centerY + intermediateDist },  // SE
    { x: centerX - intermediateDist, y: centerY + intermediateDist },  // SW
    { x: centerX - intermediateDist, y: centerY - intermediateDist }   // NW
  ];

  intermediateDirections.forEach(dir => {
    if (dir.x >= 0 && dir.x < size.width && dir.y >= 0 && dir.y < size.height) {
      tiles[dir.y][dir.x].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
    }
  });

  // Prayer stations (cushions) in the four quadrants
  const prayerPositions = [
    { x: centerX - 3, y: centerY - 3 },
    { x: centerX + 3, y: centerY - 3 },
    { x: centerX + 3, y: centerY + 3 },
    { x: centerX - 3, y: centerY + 3 }
  ];

  prayerPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
    }
  });

  // Torches at cardinal points for night ceremonies
  if (centerY - wheelRadius - 1 >= 0) {
    tiles[centerY - wheelRadius - 1][centerX].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
  }
  if (centerY + wheelRadius + 1 < size.height) {
    tiles[centerY + wheelRadius + 1][centerX].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
  }
  if (centerX - wheelRadius - 1 >= 0) {
    tiles[centerY][centerX - wheelRadius - 1].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
  }
  if (centerX + wheelRadius + 1 < size.width) {
    tiles[centerY][centerX + wheelRadius + 1].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
  }

  interactionZones.push({
    id: 'medicine_wheel',
    bounds: { x: centerX - wheelRadius - 3, y: centerY - wheelRadius - 3, width: (wheelRadius * 2) + 6, height: (wheelRadius * 2) + 6 },
    type: 'religious',
    interactions: ['vision_quest', 'pray_to_spirits', 'make_offering', 'seek_guidance']
  });

  interactionZones.push({
    id: 'central_fire',
    bounds: { x: centerX - 3, y: centerY - 3, width: 7, height: 7 },
    type: 'ritual',
    interactions: ['tend_sacred_fire', 'smoke_ceremony', 'drum_prayer']
  });
}

/**
 * Kiva - Pueblo underground ceremonial chamber (circular sunken room)
 */
function generateKiva(tiles: Tile[][], size: { width: number, height: number }, centerX: number, centerY: number, config: SpecialMapConfig, interactionZones: InteractionZone[]) {
  console.log(`[SacredGenerator] Generating Kiva for Pueblo sacred site`);

  // Desert sand/dirt floor around the kiva
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_EARTH);

  // Circular kiva chamber (sunken floor represented by different tile type)
  const kivaRadius = Math.min(6, Math.floor(Math.min(size.width, size.height) / 3));
  for (let dy = -kivaRadius; dy <= kivaRadius; dy++) {
    for (let dx = -kivaRadius; dx <= kivaRadius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const x = centerX + dx;
      const y = centerY + dy;
      if (dist <= kivaRadius && x >= 0 && x < size.width && y >= 0 && y < size.height) {
        // Sunken chamber floor
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
      }
    }
  }

  // Sipapu (spiritual hole to underworld) at center
  tiles[centerY][centerX].overlayObject = { type: OverlayObjectType.BASIN, rotation: 0 }; // Represents hole
  tiles[centerY][centerX].isBlocking = false; // Can walk over it

  // Sacred fire pit slightly offset from center
  tiles[centerY - 1][centerX].overlayObject = { type: OverlayObjectType.FIRE_PIT, rotation: 0 };
  tiles[centerY - 1][centerX].isBlocking = true;

  // Six roof support pillars forming hexagon (typical kiva architecture)
  const pillarDist = kivaRadius - 1;
  const year = config.specificYear || 1100;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.floor(centerX + Math.cos(angle) * pillarDist);
    const y = Math.floor(centerY + Math.sin(angle) * pillarDist);
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      placePillar(tiles, x, y, 'wood', year);
    }
  }

  // Bench seating along circular wall (banquette)
  const benchRadius = kivaRadius - 0.5;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const x = Math.floor(centerX + Math.cos(angle) * benchRadius);
    const y = Math.floor(centerY + Math.sin(angle) * benchRadius);
    if (x >= 0 && x < size.width && y >= 0 && y < size.height && !tiles[y][x].overlayObject) {
      tiles[y][x].overlayObject = { type: OverlayObjectType.BENCH, rotation: 0 };
    }
  }

  // Ladder entrance (represented by path leading down)
  const ladderY = centerY + kivaRadius + 1;
  for (let y = ladderY; y < Math.min(ladderY + 3, size.height); y++) {
    tiles[y][centerX].biome = BiomeType.PATH;
    tiles[y][centerX - 1].biome = BiomeType.PATH;
    tiles[y][centerX + 1].biome = BiomeType.PATH;
  }

  // Deflector stone between fire and sipapu
  if (centerY + 1 < size.height) {
    tiles[centerY + 1][centerX].overlayObject = { type: OverlayObjectType.PILLAR, rotation: 0 };
  }

  // Ventilation shaft (represented by opening on one side)
  const ventX = centerX + kivaRadius;
  const ventY = centerY;
  if (ventX < size.width) {
    tiles[ventY][ventX].biome = BiomeType.PATH;
    if (ventX + 1 < size.width) tiles[ventY][ventX + 1].biome = BiomeType.PATH;
  }

  // Sacred objects storage niches in walls (chests)
  const nichePositions = [
    { x: centerX - kivaRadius + 1, y: centerY - 2 },
    { x: centerX + kivaRadius - 1, y: centerY + 2 }
  ];
  nichePositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };
    }
  });

  // Ceremonial drums (barrels)
  const drumPositions = [
    { x: centerX - 3, y: centerY - 3 },
    { x: centerX + 3, y: centerY - 3 }
  ];
  drumPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.BARREL, rotation: 0 };
    }
  });

  // Prayer altar on north side
  if (centerY - kivaRadius + 2 >= 0) {
    tiles[centerY - kivaRadius + 2][centerX].overlayObject = { type: OverlayObjectType.ALTAR, rotation: 0 };
  }

  // Offering tables
  const offeringPositions = [
    { x: centerX - 2, y: centerY + 2 },
    { x: centerX + 2, y: centerY + 2 }
  ];
  offeringPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
    }
  });

  // Sacred masks and fetishes (shrines) at cardinal directions
  const shrinePositions = [
    { x: centerX, y: centerY - kivaRadius + 1 },     // North
    { x: centerX + kivaRadius - 1, y: centerY },     // East
    { x: centerX, y: centerY + kivaRadius - 1 },     // South
    { x: centerX - kivaRadius + 1, y: centerY }      // West
  ];
  shrinePositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
    }
  });

  // Torches for illumination
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const torchDist = kivaRadius - 2;
    const x = Math.floor(centerX + Math.cos(angle) * torchDist);
    const y = Math.floor(centerY + Math.sin(angle) * torchDist);
    if (x >= 0 && x < size.width && y >= 0 && y < size.height && !tiles[y][x].overlayObject) {
      tiles[y][x].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
    }
  }

  interactionZones.push({
    id: 'kiva_chamber',
    bounds: { x: centerX - kivaRadius - 1, y: centerY - kivaRadius - 1, width: (kivaRadius * 2) + 2, height: (kivaRadius * 2) + 2 },
    type: 'religious',
    interactions: ['ceremony', 'pray_to_kachinas', 'tribal_council', 'initiation_rite']
  });

  interactionZones.push({
    id: 'sipapu',
    bounds: { x: centerX - 1, y: centerY - 1, width: 3, height: 3 },
    type: 'ritual',
    interactions: ['commune_with_spirits', 'journey_to_underworld', 'ancestral_prayer']
  });
}

/**
 * Longhouse - Woodland Indian ceremonial and community gathering space
 */
function generateLonghouse(tiles: Tile[][], size: { width: number, height: number }, centerX: number, centerY: number, config: SpecialMapConfig, interactionZones: InteractionZone[]) {
  console.log(`[SacredGenerator] Generating Longhouse for Woodland sacred site`);

  // Dirt floor throughout (typical of longhouses)
  fillArea(tiles, 0, 0, size.width, size.height, BiomeType.FLOOR_EARTH);

  // Longhouse is rectangular, running north-south
  const longhouseWidth = Math.min(8, size.width - 4);
  const longhouseLength = Math.min(size.height - 4, Math.floor(longhouseWidth * 2.5)); // Traditionally 2-3x longer than wide
  const longhouseX = centerX - Math.floor(longhouseWidth / 2);
  const longhouseY = Math.floor((size.height - longhouseLength) / 2);

  // Bark floor inside longhouse
  fillArea(tiles, longhouseX, longhouseY, longhouseWidth, longhouseLength, BiomeType.FLOOR_WOOD);

  // Central corridor with fire pits
  const numFirePits = Math.min(3, Math.floor(longhouseLength / 8));
  const firePitSpacing = Math.floor(longhouseLength / (numFirePits + 1));

  for (let i = 1; i <= numFirePits; i++) {
    const fireY = longhouseY + (i * firePitSpacing);
    if (fireY >= 0 && fireY < size.height) {
      tiles[fireY][centerX].overlayObject = { type: OverlayObjectType.FIRE_PIT, rotation: 0 };
      tiles[fireY][centerX].isBlocking = true;
    }
  }

  // Support posts along the sides (wooden pillars)
  const year = config.specificYear || 1400;
  for (let y = longhouseY + 2; y < longhouseY + longhouseLength - 2; y += 4) {
    placePillar(tiles, longhouseX + 1, y, 'wood', year);
    placePillar(tiles, longhouseX + longhouseWidth - 2, y, 'wood', year);
  }

  // Sleeping platforms/benches along walls
  for (let y = longhouseY + 3; y < longhouseY + longhouseLength - 3; y += 3) {
    // Left side sleeping platforms
    if (!tiles[y][longhouseX + 1].overlayObject) {
      tiles[y][longhouseX + 1].overlayObject = { type: OverlayObjectType.BENCH_EAST_WEST, rotation: 0 };
    }
    // Right side sleeping platforms
    if (!tiles[y][longhouseX + longhouseWidth - 2].overlayObject) {
      tiles[y][longhouseX + longhouseWidth - 2].overlayObject = { type: OverlayObjectType.BENCH_EAST_WEST, rotation: 0 };
    }
  }

  // Storage areas (chests and barrels) along walls
  const storagePositions = [
    { x: longhouseX + 1, y: longhouseY + 1 },
    { x: longhouseX + longhouseWidth - 2, y: longhouseY + 1 },
    { x: longhouseX + 1, y: longhouseY + longhouseLength - 2 },
    { x: longhouseX + longhouseWidth - 2, y: longhouseY + longhouseLength - 2 }
  ];

  storagePositions.forEach((pos, index) => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      if (index % 2 === 0) {
        tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.CHEST, rotation: 0 };
      } else {
        tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.BARREL, rotation: 0 };
      }
    }
  });

  // Council area at north end with seating circle
  const councilY = longhouseY + 2;
  const councilSeats = [
    { x: centerX - 2, y: councilY },
    { x: centerX + 2, y: councilY },
    { x: centerX - 3, y: councilY + 1 },
    { x: centerX + 3, y: councilY + 1 },
    { x: centerX - 2, y: councilY + 2 },
    { x: centerX + 2, y: councilY + 2 }
  ];

  councilSeats.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.CUSHION, rotation: 0 };
    }
  });

  // Elder's seat (throne) at head of council
  if (councilY - 1 >= 0 && !tiles[councilY - 1][centerX].overlayObject) {
    tiles[councilY - 1][centerX].overlayObject = { type: OverlayObjectType.THRONE, rotation: 0 };
    tiles[councilY - 1][centerX].isBlocking = true;
  }

  // Ceremonial altar at south end
  const altarY = longhouseY + longhouseLength - 3;
  if (altarY >= 0 && altarY < size.height) {
    tiles[altarY][centerX].overlayObject = { type: OverlayObjectType.ALTAR, rotation: 0 };
    tiles[altarY][centerX].isBlocking = true;
  }

  // Sacred bundles and medicine objects (shrines) near altar
  const sacredPositions = [
    { x: centerX - 2, y: altarY },
    { x: centerX + 2, y: altarY }
  ];

  sacredPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.SHRINE, rotation: 0 };
    }
  });

  // Offering tables
  if (altarY + 1 < size.height) {
    tiles[altarY + 1][centerX - 1].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
    tiles[altarY + 1][centerX + 1].overlayObject = { type: OverlayObjectType.OFFERING_TABLE, rotation: 0 };
  }

  // Ceremonial drums (barrels as drums)
  const drumPositions = [
    { x: longhouseX + 2, y: longhouseY + Math.floor(longhouseLength / 2) },
    { x: longhouseX + longhouseWidth - 3, y: longhouseY + Math.floor(longhouseLength / 2) }
  ];

  drumPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.BARREL, rotation: 0 };
    }
  });

  // Cooking/food preparation area near middle fire
  const cookingY = longhouseY + Math.floor(longhouseLength / 2);
  const cookingPositions = [
    { x: longhouseX + 2, y: cookingY - 1 },
    { x: longhouseX + longhouseWidth - 3, y: cookingY - 1 }
  ];

  cookingPositions.forEach(pos => {
    if (pos.x >= 0 && pos.x < size.width && pos.y >= 0 && pos.y < size.height && !tiles[pos.y][pos.x].overlayObject) {
      tiles[pos.y][pos.x].overlayObject = { type: OverlayObjectType.TABLE, rotation: 0 };
    }
  });

  // Torches for lighting along central corridor
  for (let y = longhouseY + 4; y < longhouseY + longhouseLength - 4; y += 6) {
    if (!tiles[y][centerX - 1].overlayObject) {
      tiles[y][centerX - 1].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
    }
    if (!tiles[y][centerX + 1].overlayObject) {
      tiles[y][centerX + 1].overlayObject = { type: OverlayObjectType.TORCH, rotation: 0 };
    }
  }

  // Entrances at both ends (represented by paths)
  // North entrance
  for (let x = centerX - 1; x <= centerX + 1; x++) {
    if (longhouseY - 1 >= 0) {
      tiles[longhouseY - 1][x].biome = BiomeType.PATH;
    }
  }
  // South entrance
  for (let x = centerX - 1; x <= centerX + 1; x++) {
    if (longhouseY + longhouseLength < size.height) {
      tiles[longhouseY + longhouseLength][x].biome = BiomeType.PATH;
    }
  }

  interactionZones.push({
    id: 'council_fire',
    bounds: { x: centerX - 4, y: councilY - 2, width: 9, height: 6 },
    type: 'social',
    interactions: ['attend_council', 'speak_to_elders', 'hear_stories', 'settle_disputes']
  });

  interactionZones.push({
    id: 'ceremonial_area',
    bounds: { x: centerX - 3, y: altarY - 2, width: 7, height: 5 },
    type: 'religious',
    interactions: ['ceremony', 'seasonal_ritual', 'healing_ceremony', 'initiation']
  });

  interactionZones.push({
    id: 'communal_fires',
    bounds: { x: longhouseX, y: longhouseY, width: longhouseWidth, height: longhouseLength },
    type: 'social',
    interactions: ['share_meal', 'tell_stories', 'craft', 'socialize']
  });
}