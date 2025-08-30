/**
 * Unified Estates Archetype Generator
 * Creates royal and religious leader residences from XS huts to XL palaces
 * Scales complexity based on era and size, applies materials based on culture
 */

import { Tile, BiomeType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { 
  placePillar,
  placeTable,
  placeLightSource,
  placeDais,
  generatePillarRow,
  applyMaterial,
  addFloorPattern
} from '../multiTileSystem';
import { 
  LANDSCAPE_BORDER_ROWS,
  MaterialType 
} from '../../../constants/specialMaps/specialMapAugmentation';

export function generateEstates(
  tiles: Tile[][],
  config: SpecialMapConfig,
  noise: ValueNoise,
  size: { width: number; height: number }
): {
  tiles: Tile[][];
  interactionZones: InteractionZone[];
  exitZones: ExitZone[];
  rooms: RoomDefinition[];
} {
  const interactionZones: InteractionZone[] = [];
  const exitZones: ExitZone[] = [];
  const rooms: RoomDefinition[] = [];
  
  // Determine landscape border
  const borderSize = config.hasLandscape ? 
    LANDSCAPE_BORDER_ROWS[config.mapSize || 'medium'] : 0;
  
  // Calculate building bounds
  const buildingLeft = borderSize;
  const buildingRight = size.width - borderSize;
  const buildingTop = borderSize;
  const buildingBottom = size.height - borderSize;
  const buildingWidth = buildingRight - buildingLeft;
  const buildingHeight = buildingBottom - buildingTop;
  
  // Fill landscape if enabled
  if (config.hasLandscape && config.landscapeClimate) {
    fillLandscapeBorder(tiles, size, borderSize, config.landscapeClimate);
  }
  
  // Generate based on size
  switch (config.mapSize) {
    case 'xs':
      generateXSEstate(
        tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
        config, interactionZones, exitZones, rooms
      );
      break;
      
    case 'small':
      generateSmallEstate(
        tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
        config, interactionZones, exitZones, rooms
      );
      break;
      
    case 'medium':
      generateMediumEstate(
        tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
        config, interactionZones, exitZones, rooms
      );
      break;
      
    case 'large':
    case 'xl':
      generateLargeEstate(
        tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
        config, interactionZones, exitZones, rooms
      );
      break;
      
    default:
      generateMediumEstate(
        tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight,
        config, interactionZones, exitZones, rooms
      );
  }
  
  return {
    tiles,
    interactionZones,
    exitZones,
    rooms
  };
}

/**
 * Generate XS estate (8x8) - chief's hut, small shrine
 */
function generateXSEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + Math.floor(height / 2);
  const era = config.specificYear || -5000;
  
  if (config.isCircular) {
    // Circular hut
    generateCircularStructure(
      tiles, centerX, centerY, 
      Math.min(width, height) / 2 - 1,
      config
    );
  } else {
    // Rectangular hut
    generateRectangularWalls(
      tiles, startX, startY, width, height,
      config.wallMaterial || 'wood'
    );
  }
  
  // Simple floor
  for (let y = startY + 1; y < startY + height - 1; y++) {
    for (let x = startX + 1; x < startX + width - 1; x++) {
      if (tiles[y][x].biome !== BiomeType.WALL) {
        tiles[y][x].biome = config.floorMaterial === 'earth' ? 
          BiomeType.DIRT : BiomeType.FLOOR_WOOD;
        applyMaterial(tiles[y][x], config.floorMaterial || 'wood');
      }
    }
  }
  
  // Central feature - fire or shrine
  if (era < 0) {
    // Prehistoric - central fire
    tiles[centerY][centerX].biome = BiomeType.FIREPIT;
    tiles[centerY][centerX].structureType = 'fire';
    tiles[centerY][centerX].isLightSource = true;
  } else {
    // Small altar/throne
    tiles[centerY - 1][centerX].biome = BiomeType.THRONE;
    tiles[centerY - 1][centerX].isBlocking = true;
    applyMaterial(tiles[centerY - 1][centerX], config.furnitureMaterial || 'wood');
  }
  
  // Single room
  rooms.push({
    id: 'main_chamber',
    name: config.innerMapName || "Chief's Chamber",
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'throne_room',
    accessLevel: 'private'
  });
  
  // Entrance
  tiles[startY + height - 1][centerX].biome = BiomeType.DOOR;
  tiles[startY + height - 1][centerX].isBlocking = false;
  
  exitZones.push({
    x: centerX,
    y: startY + height - 1,
    width: 1,
    height: 1,
    targetMap: 'parent',
    label: 'Exit'
  });
}

/**
 * Generate small estate (10x10) - small palace, shrine
 */
function generateSmallEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const era = config.specificYear || 500;
  const wallMaterial = config.wallMaterial || 'grey_stone';
  const floorMaterial = config.floorMaterial || 'wood';
  
  // Outer walls
  generateRectangularWalls(tiles, startX, startY, width, height, wallMaterial);
  
  // Floor
  for (let y = startY + 1; y < startY + height - 1; y++) {
    for (let x = startX + 1; x < startX + width - 1; x++) {
      tiles[y][x].biome = BiomeType.FLOOR;
      applyMaterial(tiles[y][x], floorMaterial);
    }
  }
  
  // Two pillars flanking throne
  if (width >= 8) {
    const throneX = startX + Math.floor(width / 2);
    const throneY = startY + 2;
    
    placePillar(tiles, throneX - 2, throneY + 2, wallMaterial, era);
    placePillar(tiles, throneX + 2, throneY + 2, wallMaterial, era);
  }
  
  // Throne on dais
  const centerX = startX + Math.floor(width / 2);
  placeDais(tiles, centerX - 1, startY + 1, 3, 2, floorMaterial);
  
  tiles[startY + 1][centerX].biome = BiomeType.THRONE;
  tiles[startY + 1][centerX].isBlocking = true;
  applyMaterial(tiles[startY + 1][centerX], config.furnitureMaterial || 'wood');
  
  // Light sources
  placeLightSource(tiles, startX + 2, startY + 2, era, true);
  placeLightSource(tiles, startX + width - 3, startY + 2, era, true);
  
  // Main chamber
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'throne_room',
    accessLevel: config.isPrivate ? 'restricted' : 'public'
  });
  
  // Inner sanctum portal
  if (config.innerMapType) {
    interactionZones.push({
      x: centerX,
      y: startY + 1,
      width: 1,
      height: 1,
      type: 'portal',
      properties: {
        targetMap: config.innerMapType,
        name: config.innerMapName || "Inner Sanctum",
        requiresAccess: true
      }
    });
  }
  
  // Main entrance
  const entranceX = centerX;
  tiles[startY + height - 1][entranceX].biome = BiomeType.DOOR;
  tiles[startY + height - 1][entranceX].isBlocking = false;
  
  exitZones.push({
    x: entranceX,
    y: startY + height - 1,
    width: 1,
    height: 1,
    targetMap: 'parent',
    label: 'Exit Palace'
  });
}

/**
 * Generate medium estate (16x16) - standard palace
 */
function generateMediumEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const era = config.specificYear || 1200;
  const wallMaterial = config.wallMaterial || 'grey_stone';
  const floorMaterial = config.floorMaterial || 'white_marble';
  const furnitureMaterial = config.furnitureMaterial || 'wood';
  
  // Outer walls
  generateRectangularWalls(tiles, startX, startY, width, height, wallMaterial);
  
  // Main hall and antechamber division
  const antechamberHeight = Math.floor(height * 0.3);
  
  // Antechamber
  rooms.push({
    id: 'antechamber',
    name: 'Antechamber',
    bounds: { 
      x: startX + 1, 
      y: startY + height - antechamberHeight, 
      width: width - 2, 
      height: antechamberHeight - 1 
    },
    type: 'public',
    accessLevel: 'public'
  });
  
  // Throne room
  rooms.push({
    id: 'throne_room',
    name: 'Throne Room',
    bounds: { 
      x: startX + 1, 
      y: startY + 1, 
      width: width - 2, 
      height: height - antechamberHeight - 2 
    },
    type: 'throne_room',
    accessLevel: 'restricted'
  });
  
  // Floor with pattern
  addFloorPattern(
    tiles,
    startX + 1,
    startY + 1,
    width - 2,
    height - 2,
    'border',
    floorMaterial,
    'red_lacquer'
  );
  
  // Dividing wall with archway
  for (let x = startX + 1; x < startX + width - 1; x++) {
    const midY = startY + height - antechamberHeight - 1;
    if (Math.abs(x - (startX + width / 2)) > 2) {
      tiles[midY][x].biome = BiomeType.WALL;
      tiles[midY][x].isBlocking = true;
    } else if (x === startX + Math.floor(width / 2)) {
      tiles[midY][x].biome = BiomeType.ARCHWAY;
      tiles[midY][x].isBlocking = false;
    }
  }
  
  // Pillar rows in throne room
  const pillarSpacing = 4;
  const numPillars = Math.floor((width - 6) / pillarSpacing);
  
  generatePillarRow(
    tiles,
    startX + 3,
    startY + 5,
    numPillars,
    pillarSpacing,
    wallMaterial,
    era,
    false
  );
  
  // Throne on raised dais
  const centerX = startX + Math.floor(width / 2);
  placeDais(tiles, centerX - 2, startY + 1, 5, 3, floorMaterial);
  
  tiles[startY + 2][centerX].biome = BiomeType.THRONE;
  tiles[startY + 2][centerX].isBlocking = true;
  tiles[startY + 2][centerX].structureType = 'ornate_throne';
  applyMaterial(tiles[startY + 2][centerX], furnitureMaterial);
  
  // Tables for feasts
  placeTable(tiles, startX + 2, startY + 8, furnitureMaterial, config.mapSize || 'medium');
  placeTable(tiles, startX + width - 6, startY + 8, furnitureMaterial, config.mapSize || 'medium');
  
  // Light sources
  for (let i = 0; i < 4; i++) {
    const lightX = startX + 3 + (i * pillarSpacing);
    placeLightSource(tiles, lightX, startY + 4, era, false);
  }
  
  // Inner sanctum
  if (config.innerMapType) {
    interactionZones.push({
      x: centerX,
      y: startY + 2,
      width: 1,
      height: 1,
      type: 'portal',
      properties: {
        targetMap: config.innerMapType,
        name: config.innerMapName || "Royal Chambers",
        requiresAccess: true
      }
    });
  }
  
  // Main entrance
  tiles[startY + height - 1][centerX].biome = BiomeType.DOOR;
  tiles[startY + height - 1][centerX].isBlocking = false;
  tiles[startY + height - 1][centerX].structureType = 'grand_door';
  
  exitZones.push({
    x: centerX,
    y: startY + height - 1,
    width: 1,
    height: 1,
    targetMap: 'parent',
    label: 'Exit Palace'
  });
}

/**
 * Generate large/XL estate (20x20 or 25x25) - grand palace complex
 */
function generateLargeEstate(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  exitZones: ExitZone[],
  rooms: RoomDefinition[]
): void {
  const era = config.specificYear || 1700;
  const wallMaterial = config.wallMaterial || 'white_marble';
  const floorMaterial = config.floorMaterial || 'white_marble';
  const furnitureMaterial = config.furnitureMaterial || 'red_lacquer';
  
  // This would be a full palace with multiple rooms
  // For now, create a grand throne room with side chambers
  
  // Outer walls
  generateRectangularWalls(tiles, startX, startY, width, height, wallMaterial);
  
  // Side chamber width
  const sideWidth = Math.floor(width * 0.25);
  
  // Left chamber
  rooms.push({
    id: 'left_chamber',
    name: 'Council Chamber',
    bounds: { 
      x: startX + 1, 
      y: startY + 1, 
      width: sideWidth - 1, 
      height: height - 2 
    },
    type: 'meeting',
    accessLevel: 'restricted'
  });
  
  // Right chamber
  rooms.push({
    id: 'right_chamber',
    name: 'Treasury',
    bounds: { 
      x: startX + width - sideWidth, 
      y: startY + 1, 
      width: sideWidth - 1, 
      height: height - 2 
    },
    type: 'treasury',
    accessLevel: 'restricted'
  });
  
  // Grand hall
  rooms.push({
    id: 'grand_hall',
    name: 'Grand Hall',
    bounds: { 
      x: startX + sideWidth, 
      y: startY + 1, 
      width: width - (sideWidth * 2), 
      height: height - 2 
    },
    type: 'throne_room',
    accessLevel: 'public'
  });
  
  // Ornate floor pattern in grand hall
  addFloorPattern(
    tiles,
    startX + sideWidth,
    startY + 1,
    width - (sideWidth * 2),
    height - 2,
    'center_medallion',
    floorMaterial,
    'red_lacquer'
  );
  
  // Side chamber floors
  for (let y = startY + 1; y < startY + height - 1; y++) {
    for (let x = startX + 1; x < startX + sideWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR;
      applyMaterial(tiles[y][x], floorMaterial);
    }
    for (let x = startX + width - sideWidth; x < startX + width - 1; x++) {
      tiles[y][x].biome = BiomeType.FLOOR;
      applyMaterial(tiles[y][x], floorMaterial);
    }
  }
  
  // Chamber dividing walls
  for (let y = startY + 1; y < startY + height - 1; y++) {
    // Left wall
    tiles[y][startX + sideWidth].biome = BiomeType.WALL;
    tiles[y][startX + sideWidth].isBlocking = true;
    
    // Right wall
    tiles[y][startX + width - sideWidth - 1].biome = BiomeType.WALL;
    tiles[y][startX + width - sideWidth - 1].isBlocking = true;
    
    // Add doorways
    if (y === startY + Math.floor(height / 2)) {
      tiles[y][startX + sideWidth].biome = BiomeType.DOOR;
      tiles[y][startX + sideWidth].isBlocking = false;
      
      tiles[y][startX + width - sideWidth - 1].biome = BiomeType.DOOR;
      tiles[y][startX + width - sideWidth - 1].isBlocking = false;
    }
  }
  
  // Grand pillar colonnade
  const hallWidth = width - (sideWidth * 2);
  const numPillarsPerRow = Math.floor((hallWidth - 4) / 4);
  
  for (let i = 0; i < numPillarsPerRow; i++) {
    const pillarX = startX + sideWidth + 2 + (i * 4);
    placePillar(tiles, pillarX, startY + 6, wallMaterial, era);
    placePillar(tiles, pillarX, startY + height - 7, wallMaterial, era);
  }
  
  // Massive throne on grand dais
  const centerX = startX + Math.floor(width / 2);
  placeDais(tiles, centerX - 3, startY + 2, 7, 4, wallMaterial);
  
  tiles[startY + 3][centerX].biome = BiomeType.THRONE;
  tiles[startY + 3][centerX].isBlocking = true;
  tiles[startY + 3][centerX].structureType = 'imperial_throne';
  applyMaterial(tiles[startY + 3][centerX], 'red_lacquer');
  
  // Council table in left chamber
  placeTable(
    tiles, 
    startX + Math.floor(sideWidth / 2) - 2, 
    startY + Math.floor(height / 2),
    furnitureMaterial,
    'large',
    true
  );
  
  // Treasury chests in right chamber
  for (let i = 0; i < 3; i++) {
    const chestX = startX + width - sideWidth + 2;
    const chestY = startY + 3 + (i * 3);
    tiles[chestY][chestX].biome = BiomeType.CHEST;
    tiles[chestY][chestX].isBlocking = true;
    tiles[chestY][chestX].structureType = 'treasure_chest';
  }
  
  // Chandeliers
  for (let i = 0; i < 3; i++) {
    const lightY = startY + 5 + (i * 5);
    placeLightSource(tiles, centerX, lightY, era, false);
  }
  
  // Portals
  if (config.innerMapType) {
    interactionZones.push({
      x: centerX,
      y: startY + 3,
      width: 1,
      height: 1,
      type: 'portal',
      properties: {
        targetMap: config.innerMapType,
        name: config.innerMapName || "Imperial Chambers",
        requiresAccess: true
      }
    });
  }
  
  // Grand entrance
  tiles[startY + height - 1][centerX].biome = BiomeType.DOOR;
  tiles[startY + height - 1][centerX - 1].biome = BiomeType.DOOR;
  tiles[startY + height - 1][centerX + 1].biome = BiomeType.DOOR;
  tiles[startY + height - 1][centerX].isBlocking = false;
  tiles[startY + height - 1][centerX - 1].isBlocking = false;
  tiles[startY + height - 1][centerX + 1].isBlocking = false;
  
  exitZones.push({
    x: centerX - 1,
    y: startY + height - 1,
    width: 3,
    height: 1,
    targetMap: 'parent',
    label: 'Exit Palace'
  });
}

/**
 * Generate circular structure
 */
function generateCircularStructure(
  tiles: Tile[][],
  centerX: number,
  centerY: number,
  radius: number,
  config: SpecialMapConfig
): void {
  const wallMaterial = config.wallMaterial || 'wood';
  
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      
      if (distance <= radius && distance > radius - 1) {
        // Wall
        if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
          tiles[y][x].biome = BiomeType.WALL;
          tiles[y][x].isBlocking = true;
          applyMaterial(tiles[y][x], wallMaterial);
        }
      }
    }
  }
}

/**
 * Generate rectangular walls
 */
function generateRectangularWalls(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  material: MaterialType
): void {
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (y === startY || y === startY + height - 1 ||
          x === startX || x === startX + width - 1) {
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].isBlocking = true;
        applyMaterial(tiles[y][x], material);
      }
    }
  }
}

/**
 * Fill landscape border
 */
function fillLandscapeBorder(
  tiles: Tile[][],
  size: { width: number; height: number },
  borderSize: number,
  climate: string
): void {
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (x < borderSize || x >= size.width - borderSize ||
          y < borderSize || y >= size.height - borderSize) {
        
        const tile = tiles[y][x];
        
        switch (climate) {
          case 'arid':
            tile.biome = BiomeType.DESERT;
            break;
          case 'cold':
            tile.biome = BiomeType.SNOW;
            break;
          case 'temperate':
            tile.biome = BiomeType.GRASSLAND;
            tile.vegetation = Math.random() < 0.2 ? 'tree' : 'grass';
            break;
          case 'tropical':
          case 'semitropical':
            tile.biome = BiomeType.JUNGLE;
            tile.vegetation = 'palm';
            break;
          case 'ocean':
            tile.biome = BiomeType.OCEAN;
            tile.isWater = true;
            break;
          default:
            tile.biome = BiomeType.GRASSLAND;
        }
        
        tile.isBlocking = true;
      }
    }
  }
}