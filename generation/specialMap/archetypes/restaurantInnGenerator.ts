/**
 * Restaurant/Inn Archetype Generator V2 - COMPLETE OVERLAY IMPLEMENTATION
 * Features proper walls, multi-room layouts, and rich cultural variations
 */

import { Tile, BiomeType, OverlayObjectType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import { LANDSCAPE_BORDER_ROWS } from '../../../constants/specialMaps/specialMapAugmentation';
import { 
  placeDeskWithChair, 
  placeBookshelfAgainstWall, 
  placeBenchWithOrientation,
  placeBedWithOrientation 
} from '../directionalFurniturePlacement';
import { 
  placeRoundTable,
  placeLShapedTable,
  placeBoothSeating,
  placeFourPosterBed,
  placeSmartTable 
} from '../advancedFurnitureSystem';
import { 
  lightRoom,
  placeFireplace,
  getCulturalLighting 
} from '../advancedLightingSystem';
import {
  placeWineRack,
  placeKitchenWorkTriangle,
  createBathroom
} from '../storageUtilitySystem';

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
  
  // Create complete base structure with proper walls
  createCompleteBaseStructure(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config);
  
  const era = config.specificYear || 1500;
  const mapSize = config.mapSize || 'medium';
  
  // For large maps, add inn rooms
  if (mapSize === 'large' || mapSize === 'xl' || mapSize === 'xxl') {
    createInnWithRooms(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms, exitZones);
  } else {
    // Generate culturally-specific restaurant
    if (config.culturalZone === 'MENA') {
      createMENARestaurant(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms);
    } else if (config.culturalZone === 'SOUTH_ASIAN') {
      createSouthAsianRestaurant(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms);
    } else if (config.culturalZone === 'EAST_ASIAN') {
      createEastAsianRestaurant(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms);
    } else if (config.culturalZone === 'NORTH_AMERICAN' && era >= 1900) {
      createAmericanDiner(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms);
    } else {
      createEuropeanTavern(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms);
    }
  }
  
  // Main entrance (always at bottom center)
  const entranceX = Math.floor((buildingLeft + buildingRight) / 2);
  const entranceY = buildingBottom - 1;
  
  tiles[entranceY][entranceX].biome = BiomeType.DOOR;
  tiles[entranceY][entranceX].isBlocking = false;
  
  exitZones.push({
    id: 'main_exit',
    location: [entranceX, entranceY],
    label: 'Exit Inn',
    destination: 'parent_map'
  });
  
  return {
    tiles,
    interactionZones,
    exitZones,
    rooms
  };
}

/**
 * Create complete base structure with ALL walls
 */
function createCompleteBaseStructure(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig
): void {
  const floorType = getFloorType(config.culturalZone, config.specificYear || 1500);
  
  // First, fill entire area with floor
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      const tile = tiles[y][x];
      tile.biome = floorType;
      tile.isBlocking = false;
    }
  }
  
  // Add proper walls on ALL perimeter tiles
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      const tile = tiles[y][x];
      
      // North wall (back wall with windows)
      if (y === startY) {
        tile.biome = BiomeType.WALL_BACK;
        tile.isBlocking = true;
      }
      // South wall (front wall)
      else if (y === startY + height - 1) {
        tile.biome = BiomeType.WALL;
        tile.isBlocking = true;
      }
      // West wall
      else if (x === startX) {
        tile.biome = BiomeType.WALL;
        tile.isBlocking = true;
      }
      // East wall
      else if (x === startX + width - 1) {
        tile.biome = BiomeType.WALL;
        tile.isBlocking = true;
      }
    }
  }
  
  // Add windows to back wall
  const windowSpacing = Math.max(4, Math.floor(width / 3));
  for (let i = 1; i * windowSpacing < width - 1; i++) {
    const windowX = startX + i * windowSpacing;
    if (windowX < startX + width - 1) {
      tiles[startY][windowX].biome = BiomeType.WALL_BACK_WINDOW;
    }
  }
  
  // Add side windows too for more light
  if (height > 6) {
    tiles[startY + Math.floor(height / 2)][startX].biome = BiomeType.WALL_WINDOW;
    tiles[startY + Math.floor(height / 2)][startX + width - 1].biome = BiomeType.WALL_WINDOW;
  }
}

/**
 * Create inn with guest rooms for large maps
 */
function createInnWithRooms(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  exitZones: ExitZone[]
): void {
  // Divide space: main tavern area (60%) and hallway with rooms (40%)
  const tavernHeight = Math.floor(height * 0.6);
  const hallwayStart = startY + tavernHeight;
  
  // Create dividing wall between tavern and hallway
  for (let x = startX + 1; x < startX + width - 1; x++) {
    tiles[hallwayStart][x].biome = BiomeType.WALL;
    tiles[hallwayStart][x].isBlocking = true;
  }
  
  // Create hallway entrance
  const hallwayDoorX = startX + Math.floor(width * 0.75);
  tiles[hallwayStart][hallwayDoorX].biome = BiomeType.DOOR;
  tiles[hallwayStart][hallwayDoorX].isBlocking = false;
  
  // Add stairs near hallway entrance
  tiles[hallwayStart - 1][hallwayDoorX].biome = BiomeType.STAIRS_UP;
  tiles[hallwayStart - 1][hallwayDoorX].isBlocking = false;
  
  // Create hallway
  const hallwayWidth = width - 2;
  const roomWidth = Math.floor(hallwayWidth / 4);
  const roomHeight = height - tavernHeight - 2;
  
  // Add 3-4 guest rooms
  const numRooms = Math.min(4, Math.floor(hallwayWidth / roomWidth));
  
  for (let i = 0; i < numRooms; i++) {
    const roomX = startX + 1 + (i * roomWidth);
    const roomY = hallwayStart + 1;
    
    // Room walls
    for (let y = roomY; y < roomY + roomHeight; y++) {
      // Vertical walls between rooms
      if (i < numRooms - 1) {
        tiles[y][roomX + roomWidth].biome = BiomeType.WALL;
        tiles[y][roomX + roomWidth].isBlocking = true;
      }
    }
    
    // Room door to hallway
    const doorX = roomX + Math.floor(roomWidth / 2);
    tiles[roomY][doorX].biome = BiomeType.DOOR;
    tiles[roomY][doorX].isBlocking = false;
    
    // Furnish room
    // Determine if this is a luxury inn
    const isLuxury = config.wealthLevel === 'wealthy' || config.mapSize === 'xl';
    
    // Bed - use four-poster for luxury inns in appropriate eras
    if (isLuxury && era >= 1400 && era < 1900 && roomWidth >= 4 && roomHeight >= 4) {
      placeFourPosterBed(tiles, roomX + 1, roomY + 1, config.culturalZone || 'EUROPEAN', 'mahogany');
    } else {
      placeBedWithOrientation(tiles, roomX + 1, roomY + 1, roomWidth, roomHeight, config.culturalZone || 'EUROPEAN', getWoodMaterial(config.culturalZone, era));
    }
    
    // Storage - use appropriate type for era and culture
    const storageType = getCulturalStorage(config.culturalZone || 'EUROPEAN', era, 'clothing');
    tiles[roomY + 1][roomX + roomWidth - 1].overlayObject = {
      type: storageType,
      rotation: 0,
      material: getWoodMaterial(config.culturalZone, era)
    };
    tiles[roomY + 1][roomX + roomWidth - 1].isBlocking = true;
    
    // Chair or writing desk for luxury rooms
    if (isLuxury && roomWidth >= 5) {
      placeDeskWithChair(tiles, roomX + 2, roomY + 2, config.culturalZone || 'EUROPEAN', getWoodMaterial(config.culturalZone, era));
    } else {
      tiles[roomY + 2][roomX + 2].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 90,
        material: getWoodMaterial(config.culturalZone, era)
      };
    }
    
    // Small chest for valuables
    if (roomHeight > 3) {
      const chestType = isLuxury ? OverlayObjectType.CHEST_ORNATE : OverlayObjectType.CHEST;
      tiles[roomY + roomHeight - 2][roomX + 1].overlayObject = {
        type: chestType,
        rotation: 0,
        material: getWoodMaterial(config.culturalZone, era)
      };
      tiles[roomY + roomHeight - 2][roomX + 1].isBlocking = true;
    }
    
    // Add proper room lighting
    lightRoom(tiles, roomX, roomY, roomWidth, roomHeight, 
              config.culturalZone || 'EUROPEAN', era, 'bedroom', isLuxury);
    
    // Add bathroom for modern luxury rooms
    if (isLuxury && era >= 1850 && roomWidth >= 6 && roomHeight >= 5) {
      // Create small ensuite bathroom in corner
      createBathroom(tiles, roomX + roomWidth - 3, roomY + roomHeight - 3, 3, 3, era, true);
    }
    
    rooms.push({
      id: `guest_room_${i + 1}`,
      name: `Guest Room ${i + 1}`,
      bounds: { x: roomX, y: roomY, width: roomWidth, height: roomHeight },
      type: 'private',
      accessLevel: 'restricted'
    });
  }
  
  // Now furnish the main tavern area
  createEuropeanTavern(tiles, startX, startY, width, tavernHeight, config, era, interactionZones, rooms);
}

/**
 * Enhanced MENA restaurant with more details
 */
function createMENARestaurant(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + Math.floor(height / 2);
  
  // Central fountain
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.FOUNTAIN,
    rotation: 0,
    material: 'marble'
  };
  tiles[centerY][centerX].isBlocking = true;
  
  // Ornate carpets around fountain
  const carpetPositions = [
    [centerX - 2, centerY - 2], [centerX + 2, centerY - 2],
    [centerX - 2, centerY + 2], [centerX + 2, centerY + 2]
  ];
  
  carpetPositions.forEach(([x, y]) => {
    if (x > startX && x < startX + width - 1 && y > startY && y < startY + height - 1) {
      tiles[y][x].biome = BiomeType.CARPET;
    }
  });
  
  // Low tables with full multi-tile setup
  if (width > 10) {
    placeMultiTileTable(tiles, startX + 2, startY + 3, 3, 'horizontal', 'brass');
    placeMultiTileTable(tiles, startX + width - 5, startY + 3, 3, 'horizontal', 'brass');
    placeMultiTileTable(tiles, startX + 2, startY + height - 4, 3, 'horizontal', 'brass');
    placeMultiTileTable(tiles, startX + width - 5, startY + height - 4, 3, 'horizontal', 'brass');
  }
  
  // Cushions for seating
  placeSeatingAroundTable(tiles, startX + 2, startY + 3, 3, 'horizontal', 'cushion');
  placeSeatingAroundTable(tiles, startX + width - 5, startY + 3, 3, 'horizontal', 'cushion');
  
  // Decorative vases in corners
  tiles[startY + 1][startX + 1].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0,
    material: 'ceramic'
  };
  tiles[startY + 1][startX + width - 2].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0,
    material: 'ceramic'
  };
  
  // Braziers for lighting
  tiles[startY + 2][startX + 2].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'bronze'
  };
  tiles[startY + 2][startX + width - 3].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'bronze'
  };
  
  // Incense burners for atmosphere
  tiles[centerY - 1][centerX - 1].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'brass'
  };
  tiles[centerY - 1][centerX + 1].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'brass'
  };
  
  // Kitchen area with counter
  for (let x = startX + 2; x < startX + 6; x++) {
    tiles[startY + 1][x].overlayObject = {
      type: OverlayObjectType.KITCHEN_COUNTER,
      rotation: 0,
      material: 'stone'
    };
    tiles[startY + 1][x].isBlocking = true;
  }
  
  rooms.push({
    id: 'main_dining',
    name: 'Main Dining Hall',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'public',
    accessLevel: 'public'
  });
}

/**
 * Enhanced South Asian restaurant
 */
function createSouthAsianRestaurant(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  // Central shrine
  const centerX = startX + Math.floor(width / 2);
  tiles[startY + 1][centerX].overlayObject = {
    type: OverlayObjectType.SHRINE,
    rotation: 0,
    material: 'wood'
  };
  tiles[startY + 1][centerX].isBlocking = true;
  
  // Statue near shrine
  tiles[startY + 1][centerX - 1].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'stone'
  };
  tiles[startY + 1][centerX + 1].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    material: 'stone'
  };
  
  // Low tables
  placeMultiTileTable(tiles, startX + 2, startY + 4, 4, 'horizontal', 'teak');
  placeMultiTileTable(tiles, startX + width - 6, startY + 4, 4, 'horizontal', 'teak');
  
  if (height > 8) {
    placeMultiTileTable(tiles, startX + 2, startY + height - 4, 4, 'horizontal', 'teak');
    placeMultiTileTable(tiles, startX + width - 6, startY + height - 4, 4, 'horizontal', 'teak');
  }
  
  // Floor cushions for seating
  placeSeatingAroundTable(tiles, startX + 2, startY + 4, 4, 'horizontal', 'cushion');
  placeSeatingAroundTable(tiles, startX + width - 6, startY + 4, 4, 'horizontal', 'cushion');
  
  // Decorative pillars
  tiles[startY + 2][startX + 1].overlayObject = {
    type: OverlayObjectType.PILLAR_BASE,
    rotation: 0,
    material: 'stone'
  };
  tiles[startY + 2][startX + width - 2].overlayObject = {
    type: OverlayObjectType.PILLAR_BASE,
    rotation: 0,
    material: 'stone'
  };
  
  // Oil lamps
  tiles[startY + 3][startX + 2].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    material: 'brass'
  };
  tiles[startY + 3][startX + width - 3].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    material: 'brass'
  };
  
  // Incense for atmosphere
  tiles[startY + 1][centerX - 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'bronze'
  };
  tiles[startY + 1][centerX + 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'bronze'
  };
  
  rooms.push({
    id: 'dining_hall',
    name: 'Dining Hall',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'public',
    accessLevel: 'public'
  });
}

/**
 * Enhanced East Asian restaurant
 */
function createEastAsianRestaurant(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  // Corner altar with offerings
  tiles[startY + 1][startX + width - 2].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    material: 'lacquered_wood'
  };
  tiles[startY + 1][startX + width - 2].isBlocking = true;
  
  // Braziers flanking altar
  tiles[startY + 2][startX + width - 3].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'bronze'
  };
  tiles[startY + 2][startX + width - 1].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'bronze'
  };
  
  // Incense on altar
  tiles[startY + 1][startX + width - 3].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    material: 'jade'
  };
  
  // Multiple low tables in organized rows
  const tableY1 = startY + 3;
  const tableY2 = startY + 6;
  
  placeMultiTileTable(tiles, startX + 2, tableY1, 3, 'horizontal', 'lacquered_wood');
  placeMultiTileTable(tiles, startX + 6, tableY1, 3, 'horizontal', 'lacquered_wood');
  
  if (width > 12) {
    placeMultiTileTable(tiles, startX + 10, tableY1, 3, 'horizontal', 'lacquered_wood');
  }
  
  if (height > 8) {
    placeMultiTileTable(tiles, startX + 2, tableY2, 3, 'horizontal', 'lacquered_wood');
    placeMultiTileTable(tiles, startX + 6, tableY2, 3, 'horizontal', 'lacquered_wood');
  }
  
  // Floor cushions
  placeSeatingAroundTable(tiles, startX + 2, tableY1, 3, 'horizontal', 'cushion');
  placeSeatingAroundTable(tiles, startX + 6, tableY1, 3, 'horizontal', 'cushion');
  
  // Decorative screens (using cabinets as room dividers)
  if (height > 10) {
    tiles[startY + Math.floor(height / 2)][startX + 3].overlayObject = {
      type: OverlayObjectType.CABINET,
      rotation: 0,
      material: 'bamboo'
    };
    tiles[startY + Math.floor(height / 2)][startX + width - 4].overlayObject = {
      type: OverlayObjectType.CABINET,
      rotation: 0,
      material: 'bamboo'
    };
  }
  
  // Paper lanterns
  tiles[startY + 2][startX + 2].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    material: 'paper'
  };
  tiles[startY + 2][startX + width - 3].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    material: 'paper'
  };
  
  // Decorative vases
  tiles[startY + height - 2][startX + 1].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0,
    material: 'porcelain'
  };
  tiles[startY + height - 2][startX + width - 2].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0,
    material: 'porcelain'
  };
  
  rooms.push({
    id: 'tea_house',
    name: 'Tea House',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'public',
    accessLevel: 'public'
  });
}

/**
 * American diner with modern fixtures
 */
function createAmericanDiner(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  // Kitchen counter along back wall
  for (let x = startX + 2; x < startX + width - 2; x++) {
    tiles[startY + 2][x].overlayObject = {
      type: OverlayObjectType.KITCHEN_COUNTER,
      rotation: 0,
      material: 'steel'
    };
    tiles[startY + 2][x].isBlocking = true;
  }
  
  // Kitchen equipment
  tiles[startY + 2][startX + 3].overlayObject = {
    type: OverlayObjectType.KITCHEN_STOVE,
    rotation: 0,
    material: 'steel'
  };
  
  tiles[startY + 2][startX + width - 3].overlayObject = {
    type: OverlayObjectType.KITCHEN_SINK,
    rotation: 0,
    material: 'steel'
  };
  
  // Customer counter (facing kitchen)
  for (let x = startX + 2; x < startX + width - 2; x++) {
    tiles[startY + 4][x].overlayObject = {
      type: OverlayObjectType.KITCHEN_COUNTER,
      rotation: 180,
      material: 'formica'
    };
    tiles[startY + 4][x].isBlocking = true;
  }
  
  // Counter stools
  for (let x = startX + 2; x < startX + width - 2; x += 2) {
    tiles[startY + 5][x].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 0,
      material: 'chrome'
    };
  }
  
  // Booth seating with tables (American diner style)
  if (height > 9) {
    // Left booths
    placeMultiTileTable(tiles, startX + 2, startY + 7, 2, 'horizontal', 'formica');
    tiles[startY + 6][startX + 2].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 0,
      material: 'vinyl_red'
    };
    tiles[startY + 6][startX + 3].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 0,
      material: 'vinyl_red'
    };
    tiles[startY + 8][startX + 2].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 180,
      material: 'vinyl_red'
    };
    tiles[startY + 8][startX + 3].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 180,
      material: 'vinyl_red'
    };
    
    // Right booths
    placeMultiTileTable(tiles, startX + width - 4, startY + 7, 2, 'horizontal', 'formica');
    tiles[startY + 6][startX + width - 4].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 0,
      material: 'vinyl_red'
    };
    tiles[startY + 6][startX + width - 3].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 0,
      material: 'vinyl_red'
    };
    tiles[startY + 8][startX + width - 4].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 180,
      material: 'vinyl_red'
    };
    tiles[startY + 8][startX + width - 3].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 180,
      material: 'vinyl_red'
    };
  }
  
  // Jukebox in corner
  tiles[startY + height - 2][startX + 1].overlayObject = {
    type: OverlayObjectType.CABINET,
    rotation: 0,
    material: 'chrome'
  };
  
  rooms.push({
    id: 'diner_main',
    name: 'Main Dining Area',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'public',
    accessLevel: 'public'
  });
}

/**
 * Enhanced European tavern
 */
function createEuropeanTavern(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[]
): void {
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + Math.floor(height / 2);
  
  // Add fireplace on north wall for warmth
  if (era < 1900 && height > 8 && width > 8) {
    const fireplaceType = era >= 1600 ? 'brick' : 'stone';
    placeFireplace(tiles, centerX, startY + 1, 'north', fireplaceType, true);
  }
  
  // Add appropriate tavern lighting
  lightRoom(tiles, startX, startY, width, height, 
            config.culturalZone || 'EUROPEAN', era, 'casual', false);
  
  // Dining area with smart table placement
  const isLargeTavern = width > 12 && height > 12;
  
  if (isLargeTavern) {
    // Large tavern - use banquet tables
    placeBanquetTable(tiles, startX + 2, startY + 4, Math.min(10, width - 4), 2, 'oak');
    placeBanquetTable(tiles, startX + 2, startY + height - 6, Math.min(10, width - 4), 2, 'oak');
  } else if (width > 8) {
    // Medium tavern - use regular long tables
    placeMultiTileTable(tiles, startX + 2, startY + 3, Math.min(5, width - 6), 'horizontal', 'oak');
    placeMultiTileTable(tiles, startX + 2, startY + height - 4, Math.min(5, width - 6), 'horizontal', 'oak');
  }
  
  // Benches along tables - use directional placement for better orientation
  for (let x = startX + 2; x < startX + Math.min(7, width - 4); x++) {
    placeBenchWithOrientation(tiles, x, tableY1 - 1, width, height, config.culturalZone || 'EUROPEAN', 'oak');
    placeBenchWithOrientation(tiles, x, tableY1 + 1, width, height, config.culturalZone || 'EUROPEAN', 'oak');
    
    if (tableY2 > tableY1 + 2) {
      placeBenchWithOrientation(tiles, x, tableY2 - 1, width, height, config.culturalZone || 'EUROPEAN', 'oak');
      placeBenchWithOrientation(tiles, x, tableY2 + 1, width, height, config.culturalZone || 'EUROPEAN', 'oak');
    }
  }
  
  // Bar area with wine storage
  const hasWineStorage = era >= 1200 && config.culturalZone === 'EUROPEAN';
  
  if (hasWineStorage && width > 10) {
    // Wine rack instead of just barrels
    placeWineRack(tiles, startX + width - 3, startY + 1, 'large', 'oak');
  } else {
    // Traditional barrels
    tiles[startY + 1][startX + width - 2].overlayObject = {
      type: OverlayObjectType.BARREL,
      rotation: 0,
      material: 'oak'
    };
    tiles[startY + 2][startX + width - 2].overlayObject = {
      type: OverlayObjectType.BARREL,
      rotation: 0,
      material: 'oak'
    };
  }
  
  // Bar counter
  for (let x = startX + width - 5; x < startX + width - 2; x++) {
    tiles[startY + 1][x].overlayObject = {
      type: OverlayObjectType.KITCHEN_COUNTER,
      rotation: 0,
      material: 'oak'
    };
    tiles[startY + 1][x].isBlocking = true;
  }
  
  // Kitchen area if large enough
  if (width > 12 && height > 10) {
    // Create small kitchen in corner
    const kitchenX = startX + 1;
    const kitchenY = startY + height - 6;
    const kitchenWidth = Math.min(6, Math.floor(width / 3));
    const kitchenHeight = 5;
    
    // Add kitchen work triangle
    placeKitchenWorkTriangle(tiles, kitchenX, kitchenY, kitchenWidth, kitchenHeight, 
                             config.culturalZone || 'EUROPEAN', era);
  }
  
  if (width > 8) {
    tiles[startY + 2][startX + width - 2].overlayObject = {
      type: OverlayObjectType.TORCH,
      rotation: 0,
      material: 'iron'
    };
    tiles[startY + height - 3][startX + width - 2].overlayObject = {
      type: OverlayObjectType.TORCH,
      rotation: 0,
      material: 'iron'
    };
  }
  
  // Weapon rack (for decoration)
  if (era < 1600) {
    tiles[startY + 1][startX + 2].overlayObject = {
      type: OverlayObjectType.WEAPON_RACK,
      rotation: 0,
      material: 'oak'
    };
  }
  
  // Add some chests for storage
  tiles[startY + height - 2][startX + width - 3].overlayObject = {
    type: OverlayObjectType.CHEST,
    rotation: 0,
    material: 'oak'
  };
  tiles[startY + height - 2][startX + width - 3].isBlocking = true;
  
  rooms.push({
    id: 'tavern_main',
    name: 'Main Tavern',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'public',
    accessLevel: 'public'
  });
}

/**
 * Helper function to place seating around tables
 */
function placeSeatingAroundTable(
  tiles: Tile[][],
  tableX: number,
  tableY: number,
  tableLength: number,
  orientation: 'horizontal' | 'vertical',
  seatType: 'chair' | 'bench' | 'cushion'
): void {
  const seatOverlay = seatType === 'chair' ? OverlayObjectType.CHAIR :
                     seatType === 'bench' ? OverlayObjectType.BENCH :
                     OverlayObjectType.CUSHION;
  
  if (orientation === 'horizontal') {
    // Seats above and below table
    for (let i = 0; i < tableLength; i++) {
      // Above table
      if (tiles[tableY - 1] && tiles[tableY - 1][tableX + i]) {
        tiles[tableY - 1][tableX + i].overlayObject = {
          type: seatOverlay,
          rotation: 180,
          material: 'fabric'
        };
      }
      // Below table
      if (tiles[tableY + 1] && tiles[tableY + 1][tableX + i]) {
        tiles[tableY + 1][tableX + i].overlayObject = {
          type: seatOverlay,
          rotation: 0,
          material: 'fabric'
        };
      }
    }
  } else {
    // Seats left and right of table
    for (let i = 0; i < tableLength; i++) {
      // Left of table
      if (tiles[tableY + i] && tiles[tableY + i][tableX - 1]) {
        tiles[tableY + i][tableX - 1].overlayObject = {
          type: seatOverlay,
          rotation: 90,
          material: 'fabric'
        };
      }
      // Right of table
      if (tiles[tableY + i] && tiles[tableY + i][tableX + 1]) {
        tiles[tableY + i][tableX + 1].overlayObject = {
          type: seatOverlay,
          rotation: 270,
          material: 'fabric'
        };
      }
    }
  }
}

/**
 * Place multi-tile table
 */
function placeMultiTileTable(
  tiles: Tile[][],
  startX: number,
  startY: number,
  length: number,
  orientation: 'horizontal' | 'vertical',
  material: string
): void {
  if (orientation === 'horizontal') {
    for (let i = 0; i < length; i++) {
      const x = startX + i;
      if (!tiles[startY] || !tiles[startY][x]) continue;
      
      let overlayType: OverlayObjectType;
      if (i === 0) {
        overlayType = OverlayObjectType.TABLE_LEFT;
      } else if (i === length - 1) {
        overlayType = OverlayObjectType.TABLE_RIGHT;
      } else {
        overlayType = OverlayObjectType.TABLE_CENTER;
      }
      
      tiles[startY][x].overlayObject = {
        type: overlayType,
        rotation: 0,
        material
      };
      tiles[startY][x].isBlocking = true;
    }
  } else {
    for (let i = 0; i < length; i++) {
      const y = startY + i;
      if (!tiles[y] || !tiles[y][startX]) continue;
      
      let overlayType: OverlayObjectType;
      if (i === 0) {
        overlayType = OverlayObjectType.TABLE_LEFT;
      } else if (i === length - 1) {
        overlayType = OverlayObjectType.TABLE_RIGHT;
      } else {
        overlayType = OverlayObjectType.TABLE_CENTER;
      }
      
      tiles[y][startX].overlayObject = {
        type: overlayType,
        rotation: 90,
        material
      };
      tiles[y][startX].isBlocking = true;
    }
  }
}

/**
 * Get culturally appropriate wood material
 */
function getWoodMaterial(culturalZone: string = 'EUROPEAN', era: number): string {
  if (culturalZone === 'EAST_ASIAN') return 'lacquered_wood';
  if (culturalZone === 'SOUTH_ASIAN') return 'teak';
  if (culturalZone === 'MENA') return 'cedar';
  if (culturalZone === 'NORTH_AMERICAN' && era >= 1900) return 'pine';
  return 'oak';
}

/**
 * Get appropriate floor type
 */
function getFloorType(culturalZone: string = 'EUROPEAN', era: number): BiomeType {
  if (culturalZone === 'MENA') {
    return era < 1000 ? BiomeType.FLOOR_STONE : BiomeType.FLOOR_TILE;
  } else if (culturalZone === 'EAST_ASIAN') {
    return BiomeType.FLOOR_WOOD;
  } else if (culturalZone === 'SOUTH_ASIAN') {
    return BiomeType.FLOOR_STONE;
  } else if (culturalZone === 'NORTH_AMERICAN' && era >= 1900) {
    return BiomeType.FLOOR_CHECKERED;
  } else {
    return era < 1200 ? BiomeType.FLOOR_STONE : BiomeType.FLOOR_WOOD;
  }
}

/**
 * Get appropriate door material
 */
function getDoorMaterial(culturalZone: string = 'EUROPEAN', era: number): string {
  if (culturalZone === 'MENA') return 'cedar';
  if (culturalZone === 'EAST_ASIAN') return 'bamboo';
  if (culturalZone === 'SOUTH_ASIAN') return 'teak';
  if (culturalZone === 'NORTH_AMERICAN' && era >= 1900) return 'glass';
  return era < 1200 ? 'oak' : 'pine';
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