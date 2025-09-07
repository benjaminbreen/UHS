/**
 * Restaurant/Inn Archetype Generator - OVERLAY SYSTEM IMPLEMENTATION
 * Creates culturally-specific hospitality venues using the overlay system
 * Features multi-tile tables, cultural decorations, and era-appropriate lighting
 */

import { Tile, BiomeType, OverlayObjectType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
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
  
  // Create base structure with floor and walls
  createBaseStructure(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config);
  
  // Generate culturally-specific interior based on cultural zone and era
  const era = config.specificYear || 1500;
  
  if (config.culturalZone === 'MENA') {
    createMENARestaurant(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms);
  } else if (config.culturalZone === 'SOUTH_ASIAN') {
    createSouthAsianRestaurant(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms);
  } else if (config.culturalZone === 'EAST_ASIAN') {
    createEastAsianRestaurant(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms);
  } else if (config.culturalZone === 'NORTH_AMERICAN' && era >= 1900) {
    createAmericanDiner(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms);
  } else {
    // European or default tavern
    createEuropeanTavern(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, interactionZones, rooms);
  }
  
  // Main entrance
  const entranceX = Math.floor((buildingLeft + buildingRight) / 2);
  const entranceY = buildingBottom - 1;
  
  tiles[entranceY][entranceX].biome = BiomeType.FLOOR_STONE;
  tiles[entranceY][entranceX].overlayObject = {
    type: OverlayObjectType.DOOR,
    rotation: 0,
    material: getDoorMaterial(config.culturalZone, era)
  };
  tiles[entranceY][entranceX].isBlocking = false;
  
  exitZones.push({
    id: 'main_exit',
    location: [entranceX, entranceY],
    label: 'Exit Restaurant',
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
 * Create base structure with walls and floors
 */
function createBaseStructure(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig
): void {
  // Create walls and floors
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      const tile = tiles[y][x];
      
      if (y === startY || y === startY + height - 1 ||
          x === startX || x === startX + width - 1) {
        // Walls - just floor tiles, walls will be added as needed
        tile.biome = getFloorType(config.culturalZone, config.specificYear || 1500);
        tile.isBlocking = true;
      } else {
        // Interior floor
        tile.biome = getFloorType(config.culturalZone, config.specificYear || 1500);
        tile.isBlocking = false;
      }
    }
  }
  
  // Add back walls along north edge for 3/4 perspective
  for (let x = startX; x < startX + width; x++) {
    tiles[startY][x].biome = BiomeType.WALL_BACK;
    tiles[startY][x].isBlocking = true;
  }
  
  // Add windows to back wall
  const windowSpacing = Math.max(3, Math.floor(width / 4));
  for (let i = 1; i * windowSpacing < width - 1; i++) {
    const windowX = startX + i * windowSpacing;
    if (windowX < startX + width - 1) {
      tiles[startY][windowX].biome = BiomeType.WALL_BACK_WINDOW;
    }
  }
}

/**
 * Create MENA-style restaurant with central fountain and carpets
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
  
  // Central fountain for ambiance
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.FOUNTAIN,
    rotation: 0,
    material: 'marble'
  };
  
  // MENA-style carpets around fountain
  const carpetPositions = [
    [centerX - 2, centerY - 1], [centerX + 2, centerY - 1],
    [centerX - 2, centerY + 1], [centerX + 2, centerY + 1]
  ];
  
  carpetPositions.forEach(([x, y]) => {
    tiles[y][x].biome = BiomeType.CARPET;
  });
  
  // Low tables for floor seating (South Asian/MENA style)
  placeMultiTileTable(tiles, startX + 2, startY + 3, 3, 'horizontal', 'brass');
  placeMultiTileTable(tiles, startX + width - 5, startY + 3, 3, 'horizontal', 'brass');
  placeMultiTileTable(tiles, startX + 2, startY + height - 5, 3, 'horizontal', 'brass');
  
  // Cushions for seating instead of chairs
  const cushionPositions = [
    [startX + 2, startY + 2], [startX + 4, startY + 2],
    [startX + width - 4, startY + 2], [startX + width - 2, startY + 2],
    [startX + 2, startY + height - 4], [startX + 4, startY + height - 4]
  ];
  
  cushionPositions.forEach(([x, y]) => {
    tiles[y][x].overlayObject = {
      type: OverlayObjectType.CUSHION,
      rotation: 0,
      material: 'fabric'
    };
  });
  
  // Braziers for lighting
  tiles[startY + 2][startX + 1].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'bronze'
  };
  tiles[startY + 2][startX + width - 2].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'bronze'
  };
  
  // Decorative items
  tiles[startY + 1][centerX - 1].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0,
    material: 'ceramic'
  };
  tiles[startY + 1][centerX + 1].overlayObject = {
    type: OverlayObjectType.VASE,
    rotation: 0,
    material: 'ceramic'
  };
  
  rooms.push({
    id: 'main_dining',
    name: 'Main Dining Hall',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'public',
    accessLevel: 'public'
  });
}

/**
 * Create South Asian restaurant with low tables and decorative elements
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
  // Central shrine area
  const centerX = startX + Math.floor(width / 2);
  tiles[startY + 2][centerX].overlayObject = {
    type: OverlayObjectType.SHRINE,
    rotation: 0,
    material: 'wood'
  };
  
  // Low tables for floor dining
  placeMultiTileTable(tiles, startX + 2, startY + 4, 3, 'horizontal', 'wood');
  placeMultiTileTable(tiles, startX + width - 5, startY + 4, 3, 'horizontal', 'wood');
  
  if (height > 8) {
    placeMultiTileTable(tiles, startX + 2, startY + height - 5, 3, 'horizontal', 'wood');
  }
  
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
  
  // Traditional oil lamps/torches
  tiles[startY + 3][startX + 1].overlayObject = {
    type: OverlayObjectType.TORCH,
    rotation: 0,
    material: 'bronze'
  };
  tiles[startY + 3][startX + width - 2].overlayObject = {
    type: OverlayObjectType.TORCH,
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
 * Create East Asian restaurant with altar corner and cultural elements
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
  // Corner altar with braziers
  tiles[startY + 1][startX + width - 2].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    material: 'lacquered_wood'
  };
  
  // Braziers on either side of altar
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
  
  // Low dining tables in traditional style
  placeMultiTileTable(tiles, startX + 2, startY + 3, 4, 'horizontal', 'lacquered_wood');
  placeMultiTileTable(tiles, startX + 2, startY + 6, 4, 'horizontal', 'lacquered_wood');
  
  if (width > 10) {
    placeMultiTileTable(tiles, startX + 7, startY + 3, 4, 'horizontal', 'lacquered_wood');
    placeMultiTileTable(tiles, startX + 7, startY + 6, 4, 'horizontal', 'lacquered_wood');
  }
  
  // Floor cushions for seating
  const cushionPositions = [
    [startX + 1, startY + 3], [startX + 1, startY + 4],
    [startX + 1, startY + 6], [startX + 1, startY + 7]
  ];
  
  cushionPositions.forEach(([x, y]) => {
    tiles[y][x].overlayObject = {
      type: OverlayObjectType.CUSHION,
      rotation: 90,
      material: 'silk'
    };
  });
  
  // Decorative screens or room dividers
  if (height > 8) {
    tiles[startY + height - 3][startX + Math.floor(width / 2)].overlayObject = {
      type: OverlayObjectType.CABINET,
      rotation: 0,
      material: 'bamboo'
    };
  }
  
  rooms.push({
    id: 'tea_house',
    name: 'Tea House',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'public',
    accessLevel: 'public'
  });
}

/**
 * Create American diner with counter seating and kitchen
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
  // Kitchen area (back)
  const kitchenHeight = Math.floor(height * 0.3);
  
  // Kitchen counter with stove and sink
  for (let x = startX + 2; x < startX + width - 2; x++) {
    tiles[startY + 2][x].overlayObject = {
      type: OverlayObjectType.KITCHEN_COUNTER,
      rotation: 0,
      material: 'steel'
    };
  }
  
  // Stove in kitchen
  tiles[startY + 2][startX + 3].overlayObject = {
    type: OverlayObjectType.KITCHEN_STOVE,
    rotation: 0,
    material: 'steel'
  };
  
  // Kitchen sink
  tiles[startY + 2][startX + width - 3].overlayObject = {
    type: OverlayObjectType.KITCHEN_SINK,
    rotation: 0,
    material: 'steel'
  };
  
  // Diner counter for customers (facing kitchen)
  for (let x = startX + 2; x < startX + width - 2; x++) {
    tiles[startY + 4][x].overlayObject = {
      type: OverlayObjectType.KITCHEN_COUNTER,
      rotation: 180,
      material: 'formica'
    };
  }
  
  // Counter stools
  for (let x = startX + 2; x < startX + width - 2; x += 2) {
    tiles[startY + 5][x].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 0,
      material: 'vinyl'
    };
  }
  
  // Booth seating with tables
  if (height > 8) {
    // Left side booth
    placeMultiTileTable(tiles, startX + 1, startY + 7, 3, 'horizontal', 'formica');
    tiles[startY + 6][startX + 2].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 0,
      material: 'vinyl'
    };
    tiles[startY + 8][startX + 2].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 180,
      material: 'vinyl'
    };
    
    // Right side booth
    placeMultiTileTable(tiles, startX + width - 4, startY + 7, 3, 'horizontal', 'formica');
    tiles[startY + 6][startX + width - 3].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 0,
      material: 'vinyl'
    };
    tiles[startY + 8][startX + width - 3].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 180,
      material: 'vinyl'
    };
  }
  
  rooms.push({
    id: 'diner_main',
    name: 'Main Dining Area',
    bounds: { x: startX + 1, y: startY + 4, width: width - 2, height: height - 4 },
    type: 'public',
    accessLevel: 'public'
  });
  
  rooms.push({
    id: 'kitchen',
    name: 'Kitchen',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: 3 },
    type: 'service',
    accessLevel: 'staff'
  });
}

/**
 * Create European-style tavern
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
  // Central fireplace for medieval/renaissance
  const centerX = startX + Math.floor(width / 2);
  const centerY = startY + Math.floor(height / 2);
  
  if (era < 1800) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.FIRE_PIT,
      rotation: 0,
      material: 'stone'
    };
  }
  
  // Long dining tables
  placeMultiTileTable(tiles, startX + 2, startY + 3, 5, 'horizontal', 'oak');
  placeMultiTileTable(tiles, startX + 2, startY + height - 4, 5, 'horizontal', 'oak');
  
  // Benches along tables
  for (let x = startX + 2; x < startX + 7; x++) {
    tiles[startY + 2][x].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 0,
      material: 'oak'
    };
    tiles[startY + 4][x].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 180,
      material: 'oak'
    };
    
    tiles[startY + height - 5][x].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 0,
      material: 'oak'
    };
    tiles[startY + height - 3][x].overlayObject = {
      type: OverlayObjectType.BENCH,
      rotation: 180,
      material: 'oak'
    };
  }
  
  // Bar barrels
  tiles[startY + 2][startX + width - 2].overlayObject = {
    type: OverlayObjectType.BARREL,
    rotation: 0,
    material: 'oak'
  };
  tiles[startY + 3][startX + width - 2].overlayObject = {
    type: OverlayObjectType.BARREL,
    rotation: 0,
    material: 'oak'
  };
  
  // Wall torches
  tiles[startY + 2][startX + 1].overlayObject = {
    type: OverlayObjectType.TORCH,
    rotation: 0,
    material: 'iron'
  };
  tiles[startY + 2][startX + width - 2].overlayObject = {
    type: OverlayObjectType.TORCH,
    rotation: 0,
    material: 'iron'
  };
  
  rooms.push({
    id: 'tavern_main',
    name: 'Main Tavern',
    bounds: { x: startX + 1, y: startY + 1, width: width - 2, height: height - 2 },
    type: 'public',
    accessLevel: 'public'
  });
}

/**
 * Place a multi-tile table using left/center/right components
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
    // Vertical tables
    for (let i = 0; i < length; i++) {
      const y = startY + i;
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
 * Get appropriate floor type based on culture and era
 */
function getFloorType(culturalZone: string = 'EUROPEAN', era: number): BiomeType {
  if (culturalZone === 'MENA') {
    return era < 1000 ? BiomeType.FLOOR_STONE : BiomeType.FLOOR_TILE;
  } else if (culturalZone === 'EAST_ASIAN') {
    return BiomeType.FLOOR_WOOD;
  } else if (culturalZone === 'SOUTH_ASIAN') {
    return BiomeType.FLOOR_STONE;
  } else if (culturalZone === 'NORTH_AMERICAN' && era >= 1900) {
    return BiomeType.FLOOR_TILE;
  } else {
    return era < 1200 ? BiomeType.FLOOR_STONE : BiomeType.FLOOR_WOOD;
  }
}

/**
 * Get appropriate door material based on culture and era
 */
function getDoorMaterial(culturalZone: string = 'EUROPEAN', era: number): string {
  if (culturalZone === 'MENA') {
    return era < 1000 ? 'cedar' : 'mahogany';
  } else if (culturalZone === 'EAST_ASIAN') {
    return 'bamboo';
  } else if (culturalZone === 'SOUTH_ASIAN') {
    return 'teak';
  } else if (culturalZone === 'NORTH_AMERICAN' && era >= 1900) {
    return 'glass';
  } else {
    return era < 1200 ? 'oak' : 'pine';
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