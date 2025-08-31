/**
 * Fixed Government Forum Generator
 * Creates organized council chambers with proper room structure
 */

import { Tile } from '../../../types/mapTypes';
import { BiomeType } from '../../../types/biomes/base';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/valueNoise';
import { CULTURAL_LAYOUT_PATTERNS } from '../../../constants/specialMaps/specialMapAugmentation';
import { MultiTileObjectManager } from '../../../services/multiTileObjectService';
import { getFurnitureMaterial } from '../../../services/materialMappingService';

/**
 * Helper function to determine floor type based on culture and era
 */
function getFloorTypeForCulture(culturalZone: string, year: number): BiomeType {
  // Medieval and earlier use wood or stone
  if (year < 1500) {
    if (culturalZone === 'MENA' || culturalZone === 'SUB_SAHARAN_AFRICAN') {
      return BiomeType.FLOOR_TILE; // Terracotta/clay tiles
    } else if (culturalZone === 'EUROPEAN') {
      return BiomeType.FLOOR_STONE;
    } else {
      return BiomeType.FLOOR_WOOD;
    }
  }
  // Later periods use marble or tile
  else {
    if (culturalZone === 'EUROPEAN' || culturalZone === 'MENA') {
      return BiomeType.FLOOR_MARBLE;
    } else if (culturalZone === 'EAST_ASIAN') {
      return BiomeType.FLOOR_WOOD; // Polished wood
    } else {
      return BiomeType.FLOOR_TILE;
    }
  }
}

export function generateGovernmentForumFixed(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { 
  tiles: Tile[][], 
  interactionZones: InteractionZone[], 
  exitZones: ExitZone[], 
  rooms: RoomDefinition[],
  multiTileObjects?: any[] 
} {
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  const multiTileManager = new MultiTileObjectManager();
  
  // Get cultural layout pattern
  const culturalZone = config.culturalZone || 'EUROPEAN';
  const layoutPattern = CULTURAL_LAYOUT_PATTERNS.GOVERNMENT[culturalZone as keyof typeof CULTURAL_LAYOUT_PATTERNS.GOVERNMENT] || 
                       CULTURAL_LAYOUT_PATTERNS.GOVERNMENT.EUROPEAN;
  
  // Initialize floor tiles based on cultural zone
  const floorType = getFloorTypeForCulture(culturalZone, config.historicalEra || 1500);
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = floorType;
      tiles[y][x].isBlocking = false;
    }
  }
  
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Adapt layout to map size
  if (size.width <= 10) {
    // XS/Small: Simple single room
    createSimpleCouncilRoom(tiles, size, config, rooms, interactionZones, layoutPattern);
  } else if (size.width <= 16) {
    // Medium: Main chamber with small foyer
    if (layoutPattern.shape === 'circular') {
      createCircularChamber(tiles, size, config, rooms, interactionZones, layoutPattern);
    } else {
      createMainChamber(tiles, size, config, rooms, interactionZones, layoutPattern, multiTileManager);
    }
  } else {
    // Large/XL: Full complex with offices and foyer
    if (layoutPattern.shape === 'circular') {
      createCircularChamber(tiles, size, config, rooms, interactionZones, layoutPattern);
    } else {
      createMainChamber(tiles, size, config, rooms, interactionZones, layoutPattern, multiTileManager);
    }
    createFoyer(tiles, size, rooms);
    if (size.width >= 20) {
      createSideOffices(tiles, size, rooms);
    }
  }
  
  // Add main exit
  tiles[size.height - 1][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 1][centerX].isBlocking = false;
  
  exitZones.push({
    id: 'main_exit',
    location: [centerX, size.height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
  
  return { 
    tiles, 
    interactionZones, 
    exitZones, 
    rooms,
    multiTileObjects: multiTileManager.getObjects() 
  };
}

/**
 * Create the main council chamber with seating
 */
function createMainChamber(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  layoutPattern: any,
  multiTileManager: MultiTileObjectManager
): void {
  // Scale chamber dimensions based on map size
  const padding = Math.max(2, Math.floor(size.width * 0.15));
  const chamberX = padding;
  const chamberY = Math.floor(size.height * 0.1);
  const chamberWidth = size.width - (padding * 2);
  const chamberHeight = Math.floor(size.height * 0.6);
  
  // Outer walls of chamber
  drawWalls(tiles, chamberX, chamberY, chamberWidth, chamberHeight);
  
  // Create raised platform for speaker/leader
  const platformX = chamberX + Math.floor(chamberWidth / 2) - 3;
  const platformY = chamberY + 2;
  const platformWidth = 6;
  const platformHeight = 3;
  
  // Dais/platform area
  for (let y = platformY; y < platformY + platformHeight; y++) {
    for (let x = platformX; x < platformX + platformWidth; x++) {
      tiles[y][x].biome = BiomeType.DAIS;
    }
  }
  
  // Central feature based on culture
  const podiumX = chamberX + Math.floor(chamberWidth / 2);
  if (layoutPattern.centralFeature === 'throne') {
    tiles[platformY + 1][podiumX].biome = BiomeType.THRONE;
  } else if (layoutPattern.centralFeature === 'fountain') {
    tiles[platformY + 1][podiumX].biome = BiomeType.FOUNTAIN;
  } else if (layoutPattern.centralFeature === 'firepit') {
    tiles[platformY + 1][podiumX].biome = BiomeType.FIREPLACE;
  } else if (layoutPattern.centralFeature === 'altar') {
    tiles[platformY + 1][podiumX].biome = BiomeType.ALTAR;
  } else {
    tiles[platformY + 1][podiumX].biome = BiomeType.PODIUM;
  }
  tiles[platformY + 1][podiumX].isBlocking = true;
  
  // Seating arrangement based on cultural pattern
  if (layoutPattern.seatingArrangement === 'semicircular') {
    createSemicircularSeating(tiles, chamberX, chamberY + 6, chamberWidth, chamberHeight - 8);
  } else if (layoutPattern.seatingArrangement === 'parallel') {
    createParallelSeating(tiles, chamberX, chamberY + 6, chamberWidth, chamberHeight - 8);
  } else if (layoutPattern.seatingArrangement === 'circular') {
    createCircularSeating(tiles, chamberX, chamberY + 6, chamberWidth, chamberHeight - 8);
  } else if (layoutPattern.seatingArrangement === 'tiered') {
    createTieredSeating(tiles, chamberX, chamberY + 6, chamberWidth, chamberHeight - 8);
  }
  
  // Central carpet runner
  for (let y = platformY + platformHeight + 1; y < chamberY + chamberHeight - 2; y++) {
    const centerX = chamberX + Math.floor(chamberWidth / 2);
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      tiles[y][x].biome = BiomeType.CARPET;
    }
  }
  
  // Add multi-tile pillars for grandeur
  const pillarMaterial = MultiTileObjectManager.getMaterialForContext(config);
  const pillarHeight = MultiTileObjectManager.getPillarHeight(config);
  const pillarSpacing = 5;
  
  for (let x = chamberX + pillarSpacing; x < chamberX + chamberWidth - pillarSpacing; x += pillarSpacing) {
    if (Math.abs(x - (chamberX + Math.floor(chamberWidth / 2))) > 3) {
      // Place multi-tile pillar if there's room above
      const pillarY = chamberY + 5;
      if (pillarY - pillarHeight + 1 >= chamberY) {
        multiTileManager.placePillar(tiles, x, pillarY, pillarHeight, pillarMaterial);
      } else {
        // Fallback to single-tile pillar if not enough height
        tiles[pillarY][x].biome = BiomeType.PILLAR;
        tiles[pillarY][x].isBlocking = true;
      }
    }
  }
  
  // Add room definition
  rooms.push({
    id: 'council_chamber',
    name: 'Council Chamber',
    bounds: { x: chamberX, y: chamberY, width: chamberWidth, height: chamberHeight },
    roomType: 'assembly',
    accessLevel: 'restricted'
  });
  
  // Interaction zone for speaking
  interactionZones.push({
    id: 'speaker_podium',
    bounds: { x: platformX, y: platformY, width: platformWidth, height: platformHeight },
    type: 'podium',
    interactions: ['speak', 'address_council']
  });
}

/**
 * Create semicircular seating like a parliament
 */
function createSemicircularSeating(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): void {
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + Math.floor(height / 2);
  
  // Create three rows of benches
  for (let row = 0; row < 3; row++) {
    const radius = 6 + row * 2;
    const angleStep = Math.PI / 12; // Seats every 15 degrees
    
    for (let angle = Math.PI * 0.25; angle < Math.PI * 0.75; angle += angleStep) {
      const x = Math.round(centerX + Math.cos(angle) * radius);
      const y = Math.round(centerY + Math.sin(angle) * (radius / 2));
      
      if (x > startX + 1 && x < startX + width - 1 && 
          y > startY && y < startY + height - 1) {
        tiles[y][x].biome = BiomeType.BENCH;
        tiles[y][x].isBlocking = true;
        
        // Add desk in front of bench
        if (y > startY + 1) {
          tiles[y - 1][x].biome = BiomeType.DESK;
          tiles[y - 1][x].isBlocking = true;
        }
      }
    }
  }
}

/**
 * Create entrance foyer
 */
function createFoyer(
  tiles: Tile[][],
  size: { width: number, height: number },
  rooms: RoomDefinition[]
): void {
  const foyerY = Math.floor(size.height * 0.65);
  const foyerHeight = size.height - foyerY - 1;
  const padding = Math.max(2, Math.floor(size.width * 0.2));
  const foyerX = padding;
  const foyerWidth = size.width - (padding * 2);
  
  // Foyer walls
  drawWalls(tiles, foyerX, foyerY, foyerWidth, foyerHeight);
  
  // Doorway to chamber
  const centerX = Math.floor(size.width / 2);
  for (let x = centerX - 1; x <= centerX + 1; x++) {
    tiles[foyerY][x].biome = BiomeType.DOOR;
    tiles[foyerY][x].isBlocking = false;
  }
  
  // Reception desk
  tiles[foyerY + 2][foyerX + 2].biome = BiomeType.DESK;
  tiles[foyerY + 2][foyerX + 2].isBlocking = true;
  tiles[foyerY + 2][foyerX + 3].biome = BiomeType.DESK;
  tiles[foyerY + 2][foyerX + 3].isBlocking = true;
  
  // Waiting benches
  for (let x = foyerX + foyerWidth - 5; x < foyerX + foyerWidth - 2; x++) {
    tiles[foyerY + 2][x].biome = BiomeType.BENCH;
    tiles[foyerY + 2][x].isBlocking = true;
  }
  
  rooms.push({
    id: 'foyer',
    name: 'Reception Foyer',
    bounds: { x: foyerX, y: foyerY, width: foyerWidth, height: foyerHeight },
    roomType: 'foyer',
    accessLevel: 'public'
  });
}

/**
 * Create side offices
 */
function createSideOffices(
  tiles: Tile[][],
  size: { width: number, height: number },
  rooms: RoomDefinition[]
): void {
  // Left office
  const leftOfficeX = 1;
  const leftOfficeY = 4;
  const officeWidth = 5;
  const officeHeight = 6;
  
  drawWalls(tiles, leftOfficeX, leftOfficeY, officeWidth, officeHeight);
  
  // Door
  tiles[leftOfficeY + officeHeight - 1][leftOfficeX + 2].biome = BiomeType.DOOR;
  tiles[leftOfficeY + officeHeight - 1][leftOfficeX + 2].isBlocking = false;
  
  // Desk and chair
  tiles[leftOfficeY + 2][leftOfficeX + 2].biome = BiomeType.DESK;
  tiles[leftOfficeY + 2][leftOfficeX + 2].isBlocking = true;
  tiles[leftOfficeY + 3][leftOfficeX + 2].biome = BiomeType.CHAIR;
  tiles[leftOfficeY + 3][leftOfficeX + 2].isBlocking = true;
  
  // Bookshelf
  tiles[leftOfficeY + 1][leftOfficeX + 1].biome = BiomeType.BOOKSHELF;
  tiles[leftOfficeY + 1][leftOfficeX + 1].isBlocking = true;
  
  rooms.push({
    id: 'left_office',
    name: 'Clerk Office',
    bounds: { x: leftOfficeX, y: leftOfficeY, width: officeWidth, height: officeHeight },
    roomType: 'office',
    accessLevel: 'restricted'
  });
  
  // Right office (mirror)
  const rightOfficeX = size.width - officeWidth - 1;
  
  drawWalls(tiles, rightOfficeX, leftOfficeY, officeWidth, officeHeight);
  
  // Door
  tiles[leftOfficeY + officeHeight - 1][rightOfficeX + 2].biome = BiomeType.DOOR;
  tiles[leftOfficeY + officeHeight - 1][rightOfficeX + 2].isBlocking = false;
  
  // Desk and chair
  tiles[leftOfficeY + 2][rightOfficeX + 2].biome = BiomeType.DESK;
  tiles[leftOfficeY + 2][rightOfficeX + 2].isBlocking = true;
  tiles[leftOfficeY + 3][rightOfficeX + 2].biome = BiomeType.CHAIR;
  tiles[leftOfficeY + 3][rightOfficeX + 2].isBlocking = true;
  
  // Cabinet
  tiles[leftOfficeY + 1][rightOfficeX + 3].biome = BiomeType.CABINET;
  tiles[leftOfficeY + 1][rightOfficeX + 3].isBlocking = true;
  
  rooms.push({
    id: 'right_office',
    name: 'Secretary Office',
    bounds: { x: rightOfficeX, y: leftOfficeY, width: officeWidth, height: officeHeight },
    roomType: 'office',
    accessLevel: 'restricted'
  });
}

/**
 * Create simple council room for small maps
 */
function createSimpleCouncilRoom(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  layoutPattern: any
): void {
  // Draw walls
  drawWalls(tiles, 0, 0, size.width, size.height);
  
  // Central feature
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  if (layoutPattern.centralFeature === 'firepit') {
    tiles[centerY][centerX].biome = BiomeType.FIREPLACE;
  } else if (layoutPattern.centralFeature === 'fountain') {
    tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
  } else {
    tiles[centerY][centerX].biome = BiomeType.PODIUM;
  }
  tiles[centerY][centerX].isBlocking = true;
  
  // Simple seating around edges
  for (let x = 2; x < size.width - 2; x += 2) {
    if (x !== centerX) {
      tiles[2][x].biome = BiomeType.BENCH;
      tiles[2][x].isBlocking = true;
      tiles[size.height - 3][x].biome = BiomeType.BENCH;
      tiles[size.height - 3][x].isBlocking = true;
    }
  }
  
  // Door
  tiles[size.height - 1][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 1][centerX].isBlocking = false;
  
  rooms.push({
    id: 'council_room',
    name: 'Council Room',
    bounds: { x: 0, y: 0, width: size.width, height: size.height },
    roomType: 'assembly',
    accessLevel: 'restricted'
  });
}

/**
 * Create circular chamber for cultures with round buildings
 */
function createCircularChamber(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[],
  layoutPattern: any
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  const radius = Math.min(size.width, size.height) / 2 - 2;
  
  // Draw circular walls
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      if (Math.abs(dist - radius) < 1.5) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
      }
    }
  }
  
  // Central feature
  if (layoutPattern.centralFeature === 'firepit') {
    tiles[centerY][centerX].biome = BiomeType.FIREPLACE;
  } else if (layoutPattern.centralFeature === 'fountain') {
    tiles[centerY][centerX].biome = BiomeType.FOUNTAIN;
  } else {
    tiles[centerY][centerX].biome = BiomeType.PODIUM;
  }
  tiles[centerY][centerX].isBlocking = true;
  
  // Circular seating
  createCircularSeating(tiles, 2, 2, size.width - 4, size.height - 4);
  
  // Add room definition
  rooms.push({
    id: 'circular_council',
    name: 'Council Circle',
    bounds: { x: 0, y: 0, width: size.width, height: size.height },
    roomType: 'assembly',
    accessLevel: 'restricted'
  });
}

/**
 * Create parallel seating (East Asian style)
 */
function createParallelSeating(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): void {
  // Two parallel rows of seats facing each other
  const leftX = startX + Math.floor(width * 0.2);
  const rightX = startX + Math.floor(width * 0.8);
  
  for (let y = startY + 2; y < startY + height - 2; y += 3) {
    // Left side benches
    tiles[y][leftX].biome = BiomeType.BENCH;
    tiles[y][leftX].isBlocking = true;
    tiles[y][leftX + 1].biome = BiomeType.DESK;
    tiles[y][leftX + 1].isBlocking = true;
    
    // Right side benches
    tiles[y][rightX].biome = BiomeType.BENCH;
    tiles[y][rightX].isBlocking = true;
    tiles[y][rightX - 1].biome = BiomeType.DESK;
    tiles[y][rightX - 1].isBlocking = true;
  }
}

/**
 * Create circular seating arrangement
 */
function createCircularSeating(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): void {
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + Math.floor(height / 2);
  const radius = Math.min(width, height) / 3;
  
  // Create circle of benches
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
    const x = Math.round(centerX + Math.cos(angle) * radius);
    const y = Math.round(centerY + Math.sin(angle) * radius);
    
    if (x > startX + 1 && x < startX + width - 1 && 
        y > startY + 1 && y < startY + height - 1) {
      tiles[y][x].biome = BiomeType.BENCH;
      tiles[y][x].isBlocking = true;
    }
  }
}

/**
 * Create tiered seating (amphitheater style)
 */
function createTieredSeating(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): void {
  // Create ascending tiers
  for (let tier = 0; tier < 4; tier++) {
    const tierY = startY + tier * 3;
    for (let x = startX + 2 + tier; x < startX + width - 2 - tier; x += 2) {
      if (tierY < startY + height - 1) {
        tiles[tierY][x].biome = BiomeType.BENCH;
        tiles[tierY][x].isBlocking = true;
      }
    }
  }
}

/**
 * Draw single-tile thick walls and mark them as blocking
 */
function drawWalls(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number
): void {
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (y === startY || y === startY + height - 1 ||
          x === startX || x === startX + width - 1) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true; // CRITICAL: Mark walls as blocking!
      }
    }
  }
}