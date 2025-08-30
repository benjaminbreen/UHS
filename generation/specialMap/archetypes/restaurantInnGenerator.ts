/**
 * Restaurant/Inn Archetype Generator
 * Creates hospitality venues with common room, bar, kitchen, and private rooms
 */

import { Tile, BiomeType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { 
  placeTable, 
  placeLightSource, 
  placeFirepit,
  applyMaterial,
  addFloorPattern
} from '../multiTileSystem';
import { LANDSCAPE_BORDER_ROWS } from '../../../constants/specialMaps/specialMapAugmentation';

export function generateRestaurantInn(
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
  
  // Determine landscape border size
  const borderSize = config.hasLandscape ? 
    LANDSCAPE_BORDER_ROWS[config.mapSize || 'small'] : 0;
  
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
  
  // Create outer walls
  for (let y = buildingTop; y < buildingBottom; y++) {
    for (let x = buildingLeft; x < buildingRight; x++) {
      const tile = tiles[y][x];
      
      if (y === buildingTop || y === buildingBottom - 1 ||
          x === buildingLeft || x === buildingRight - 1) {
        // Walls
        tile.biome = BiomeType.WALL;
        tile.isBlocking = true;
        applyMaterial(tile, config.wallMaterial || 'wood');
      } else {
        // Floor
        tile.biome = BiomeType.FLOOR_WOOD;
        tile.isBlocking = false;
        applyMaterial(tile, config.floorMaterial || 'wood');
      }
    }
  }
  
  // Layout depends on size
  if (config.mapSize === 'xs' || config.mapSize === 'small') {
    // Small inn - just common room and bar
    createSmallInn(
      tiles, 
      buildingLeft, 
      buildingTop, 
      buildingWidth, 
      buildingHeight,
      config,
      interactionZones,
      exitZones,
      rooms
    );
  } else {
    // Larger inn - multiple rooms
    createLargeInn(
      tiles,
      buildingLeft,
      buildingTop,
      buildingWidth,
      buildingHeight,
      config,
      interactionZones,
      exitZones,
      rooms
    );
  }
  
  // Main entrance
  const entranceX = Math.floor((buildingLeft + buildingRight) / 2);
  const entranceY = buildingBottom - 1;
  
  tiles[entranceY][entranceX].biome = BiomeType.DOOR;
  tiles[entranceY][entranceX].isBlocking = false;
  tiles[entranceY][entranceX].structureType = 'inn_door';
  
  exitZones.push({
    x: entranceX,
    y: entranceY,
    width: 1,
    height: 1,
    targetMap: 'parent',
    label: 'Exit Inn'
  });
  
  return {
    tiles,
    interactionZones,
    exitZones,
    rooms
  };
}

/**
 * Create a small inn layout
 */
function createSmallInn(
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
  const era = config.specificYear || 1500;
  const furnitureMaterial = config.furnitureMaterial || 'wood';
  
  // Main common room
  rooms.push({
    id: 'common_room',
    name: 'Common Room',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'public',
    accessLevel: 'public'
  });
  
  // Bar counter along top wall
  for (let x = startX + 2; x < startX + width - 2; x++) {
    const tile = tiles[startY + 2][x];
    tile.biome = BiomeType.COUNTER;
    tile.isBlocking = true;
    tile.structureType = `bar_counter_${furnitureMaterial}`;
  }
  
  // Bartender position
  interactionZones.push({
    x: startX + Math.floor(width / 2),
    y: startY + 1,
    width: 1,
    height: 1,
    type: 'vendor',
    properties: {
      vendorType: 'bartender',
      goods: ['ale', 'wine', 'food']
    }
  });
  
  // Tables in common room
  const tableY = startY + height - 4;
  placeTable(tiles, startX + 2, tableY, furnitureMaterial, config.mapSize || 'small');
  
  if (width > 8) {
    placeTable(tiles, startX + width - 5, tableY, furnitureMaterial, config.mapSize || 'small');
  }
  
  // Fireplace or light
  if (era < 1800 && width > 6) {
    placeFirepit(tiles, startX + width - 3, startY + 3, 'grey_stone');
  } else {
    placeLightSource(tiles, startX + Math.floor(width / 2), startY + 3, era, true);
  }
  
  // Stairs to private rooms (if space)
  if (height > 6 && config.innerMapType) {
    const stairsX = startX + 1;
    const stairsY = startY + height - 3;
    
    tiles[stairsY][stairsX].biome = BiomeType.STAIRS_UP;
    tiles[stairsY][stairsX].structureType = 'inn_stairs';
    
    interactionZones.push({
      x: stairsX,
      y: stairsY,
      width: 1,
      height: 1,
      type: 'portal',
      properties: {
        targetMap: config.innerMapType,
        name: config.innerMapName || "Private Rooms",
        requiresAccess: false, // But costs money
        cost: 10
      }
    });
  }
}

/**
 * Create a large inn layout with multiple rooms
 */
function createLargeInn(
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
  const era = config.specificYear || 1500;
  const furnitureMaterial = config.furnitureMaterial || 'wood';
  const floorMaterial = config.floorMaterial || 'wood';
  
  // Divide into rooms
  const commonRoomHeight = Math.floor(height * 0.6);
  const kitchenWidth = Math.floor(width * 0.4);
  
  // Main common room (bottom)
  rooms.push({
    id: 'common_room',
    name: 'Common Room',
    bounds: { 
      x: startX + 1, 
      y: startY + height - commonRoomHeight, 
      width: width - 2, 
      height: commonRoomHeight - 1 
    },
    type: 'public',
    accessLevel: 'public'
  });
  
  // Add checkered floor pattern to common room
  addFloorPattern(
    tiles,
    startX + 1,
    startY + height - commonRoomHeight,
    width - 2,
    commonRoomHeight - 1,
    'checkerboard',
    floorMaterial as any,
    'grey_stone'
  );
  
  // Kitchen (top left)
  rooms.push({
    id: 'kitchen',
    name: 'Kitchen',
    bounds: { 
      x: startX + 1, 
      y: startY + 1, 
      width: kitchenWidth - 1, 
      height: height - commonRoomHeight - 2 
    },
    type: 'service',
    accessLevel: 'staff'
  });
  
  // Private dining room (top right)
  rooms.push({
    id: 'private_dining',
    name: 'Private Dining',
    bounds: { 
      x: startX + kitchenWidth + 1, 
      y: startY + 1, 
      width: width - kitchenWidth - 2, 
      height: height - commonRoomHeight - 2 
    },
    type: 'private',
    accessLevel: 'restricted'
  });
  
  // Internal walls
  for (let y = startY + 1; y < startY + height - commonRoomHeight; y++) {
    // Kitchen/dining divider
    tiles[y][startX + kitchenWidth].biome = BiomeType.WALL;
    tiles[y][startX + kitchenWidth].isBlocking = true;
    
    // Common room divider
    if (y < startY + height - commonRoomHeight - 1) {
      for (let x = startX + 1; x < startX + width - 1; x++) {
        if (x !== startX + Math.floor(width / 2)) { // Leave doorway
          tiles[startY + height - commonRoomHeight - 1][x].biome = BiomeType.WALL;
          tiles[startY + height - commonRoomHeight - 1][x].isBlocking = true;
        }
      }
    }
  }
  
  // Kitchen features
  const kitchenCenterX = startX + Math.floor(kitchenWidth / 2);
  
  // Stove
  tiles[startY + 2][kitchenCenterX].biome = BiomeType.STOVE;
  tiles[startY + 2][kitchenCenterX].isBlocking = true;
  tiles[startY + 2][kitchenCenterX].structureType = era < 1800 ? 'brick_oven' : 'iron_stove';
  
  // Counter
  for (let x = startX + 2; x < startX + kitchenWidth - 1; x++) {
    tiles[startY + 3][x].biome = BiomeType.COUNTER;
    tiles[startY + 3][x].isBlocking = true;
  }
  
  // Bar in common room
  const barY = startY + height - commonRoomHeight + 1;
  for (let x = startX + 2; x < startX + width - 2; x++) {
    if (Math.abs(x - (startX + width / 2)) > 2) { // Leave space in middle
      tiles[barY][x].biome = BiomeType.COUNTER;
      tiles[barY][x].isBlocking = true;
      tiles[barY][x].structureType = `bar_counter_${furnitureMaterial}`;
    }
  }
  
  // Tables in common room
  const tableSpacing = 5;
  for (let i = 0; i < Math.floor((width - 4) / tableSpacing); i++) {
    const tableX = startX + 2 + (i * tableSpacing);
    const tableY = startY + height - 4;
    placeTable(tiles, tableX, tableY, furnitureMaterial, config.mapSize || 'medium');
  }
  
  // Private dining table
  placeTable(
    tiles, 
    startX + kitchenWidth + 2, 
    startY + 3, 
    furnitureMaterial, 
    config.mapSize || 'medium'
  );
  
  // Lights
  placeLightSource(tiles, startX + Math.floor(width / 2), barY + 2, era, false);
  placeLightSource(tiles, startX + kitchenWidth + 3, startY + 2, era, true);
  
  // Vendor zones
  interactionZones.push({
    x: startX + Math.floor(width / 2),
    y: barY - 1,
    width: 1,
    height: 1,
    type: 'vendor',
    properties: {
      vendorType: 'innkeeper',
      goods: ['room', 'ale', 'wine', 'meal']
    }
  });
  
  // Private room entrance
  if (config.innerMapType) {
    const stairsX = startX + width - 2;
    const stairsY = startY + height - commonRoomHeight;
    
    tiles[stairsY][stairsX].biome = BiomeType.STAIRS_UP;
    tiles[stairsY][stairsX].structureType = 'inn_stairs';
    
    interactionZones.push({
      x: stairsX,
      y: stairsY,
      width: 1,
      height: 1,
      type: 'portal',
      properties: {
        targetMap: config.innerMapType,
        name: config.innerMapName || "Guest Rooms",
        requiresAccess: false,
        cost: 25
      }
    });
  }
}

/**
 * Fill landscape border (reused from campground)
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
            tile.vegetation = Math.random() < 0.1 ? 'flower' : 'grass';
            break;
          case 'tropical':
          case 'semitropical':
            tile.biome = BiomeType.JUNGLE;
            break;
          default:
            tile.biome = BiomeType.GRASSLAND;
        }
        
        tile.isBlocking = true;
      }
    }
  }
}