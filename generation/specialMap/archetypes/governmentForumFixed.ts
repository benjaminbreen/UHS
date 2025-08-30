/**
 * Fixed Government Forum Generator
 * Creates organized council chambers with proper room structure
 */

import { Tile } from '../../../types/mapTypes';
import { BiomeType } from '../../../types/biomes/base';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/valueNoise';

export function generateGovernmentForumFixed(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number, height: number }
): { 
  tiles: Tile[][], 
  interactionZones: InteractionZone[], 
  exitZones: ExitZone[], 
  rooms: RoomDefinition[] 
} {
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  // Initialize all tiles as wood floor (Stardew Valley style)
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
      tiles[y][x].isBlocking = false;
    }
  }
  
  // Government forums are always XL (25x25)
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create main chamber structure
  createMainChamber(tiles, size, config, rooms, interactionZones);
  
  // Create entrance foyer
  createFoyer(tiles, size, rooms);
  
  // Add side offices
  createSideOffices(tiles, size, rooms);
  
  // Add main exit
  tiles[size.height - 1][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 1][centerX].isBlocking = false;
  
  exitZones.push({
    id: 'main_exit',
    location: [centerX, size.height - 1],
    label: 'Exit',
    destination: 'parent_map'
  });
  
  return { tiles, interactionZones, exitZones, rooms };
}

/**
 * Create the main council chamber with seating
 */
function createMainChamber(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  rooms: RoomDefinition[],
  interactionZones: InteractionZone[]
): void {
  const chamberX = 4;
  const chamberY = 2;
  const chamberWidth = size.width - 8;
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
  
  // Leader's podium/throne
  const podiumX = chamberX + Math.floor(chamberWidth / 2);
  tiles[platformY + 1][podiumX].biome = BiomeType.THRONE;
  tiles[platformY + 1][podiumX].isBlocking = true;
  
  // Semicircular seating arrangement (like a parliament)
  createSemicircularSeating(tiles, chamberX, chamberY + 6, chamberWidth, chamberHeight - 8);
  
  // Central carpet runner
  for (let y = platformY + platformHeight + 1; y < chamberY + chamberHeight - 2; y++) {
    const centerX = chamberX + Math.floor(chamberWidth / 2);
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      tiles[y][x].biome = BiomeType.CARPET;
    }
  }
  
  // Add pillars for grandeur
  const pillarSpacing = 5;
  for (let x = chamberX + pillarSpacing; x < chamberX + chamberWidth - pillarSpacing; x += pillarSpacing) {
    if (Math.abs(x - (chamberX + Math.floor(chamberWidth / 2))) > 3) {
      tiles[chamberY + 5][x].biome = BiomeType.PILLAR;
      tiles[chamberY + 5][x].isBlocking = true;
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
  const foyerX = 6;
  const foyerWidth = size.width - 12;
  
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