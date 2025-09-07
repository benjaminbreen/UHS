/**
 * Test function to generate a special map using the overlay system
 */

import { Tile, OverlayObjectType } from '../../types/core/tile';
import { BiomeType } from '../../types/biomes/base';
import { createTestRoomWithOverlays } from './overlayTestUtility';
import { migrateMapToOverlaySystem } from '../../utils/tileConversion';

/**
 * Generate a test great hall using the overlay system
 */
export function generateOverlayTestHall(): Tile[][] {
  const width = 20;
  const height = 15;
  const tiles: Tile[][] = [];
  
  // Initialize all tiles as stone floor
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        x,
        y,
        altitude: 0,
        biome: BiomeType.FLOOR_STONE,
        isLand: true,
        isCoast: false,
        qualities: {
          flammability: 0.2,
          biodiversity: 0,
          healthiness: 0.8,
          sacrality: 0,
          safety: 0.9
        },
        isBlocking: false
      };
    }
  }
  
  // Add walls
  for (let x = 0; x < width; x++) {
    tiles[0][x].biome = BiomeType.WALL;
    tiles[0][x].isBlocking = true;
    tiles[height - 1][x].biome = BiomeType.WALL;
    tiles[height - 1][x].isBlocking = true;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].biome = BiomeType.WALL;
    tiles[y][0].isBlocking = true;
    tiles[y][width - 1].biome = BiomeType.WALL;
    tiles[y][width - 1].isBlocking = true;
  }
  
  // Add doors
  tiles[height - 1][Math.floor(width / 2)].biome = BiomeType.DOOR;
  tiles[height - 1][Math.floor(width / 2)].isBlocking = false;
  tiles[height - 1][Math.floor(width / 2)].overlayObject = {
    type: OverlayObjectType.DOOR,
    rotation: 0
  };
  
  // Add windows along north wall
  for (let x = 3; x < width - 3; x += 3) {
    tiles[0][x].biome = BiomeType.WALL_WINDOW;
  }
  
  // Place throne at the north end using overlay
  const throneX = Math.floor(width / 2);
  const throneY = 2;
  tiles[throneY][throneX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 180, // Face south
    material: 'gold'
  };
  tiles[throneY][throneX].isBlocking = true;
  
  // Dais for throne
  tiles[throneY][throneX].biome = BiomeType.DAIS;
  
  // Long feast table using multi-tile table
  const tableY = Math.floor(height / 2);
  const tableStartX = 5;
  const tableEndX = width - 5;
  
  // Left end of table
  tiles[tableY][tableStartX].overlayObject = {
    type: OverlayObjectType.TABLE_LEFT,
    rotation: 0,
    material: 'wood'
  };
  tiles[tableY][tableStartX].isBlocking = true;
  
  // Center sections of table
  for (let x = tableStartX + 1; x < tableEndX - 1; x++) {
    tiles[tableY][x].overlayObject = {
      type: OverlayObjectType.TABLE_CENTER,
      rotation: 0,
      material: 'wood'
    };
    tiles[tableY][x].isBlocking = true;
  }
  
  // Right end of table
  tiles[tableY][tableEndX - 1].overlayObject = {
    type: OverlayObjectType.TABLE_RIGHT,
    rotation: 0,
    material: 'wood'
  };
  tiles[tableY][tableEndX - 1].isBlocking = true;
  
  // Chairs along both sides of table
  for (let x = tableStartX; x < tableEndX; x += 2) {
    // North side chairs
    if (tableY > 1) {
      tiles[tableY - 1][x].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 180, // Face south (toward table)
        material: 'wood'
      };
      tiles[tableY - 1][x].isBlocking = true;
    }
    
    // South side chairs
    if (tableY < height - 2) {
      tiles[tableY + 1][x].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 0, // Face north (toward table)
        material: 'wood'
      };
      tiles[tableY + 1][x].isBlocking = true;
    }
  }
  
  // Braziers in corners for light
  tiles[2][2].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'bronze'
  };
  tiles[2][2].isBlocking = true;
  
  tiles[2][width - 3].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'bronze'
  };
  tiles[2][width - 3].isBlocking = true;
  
  // Weapon racks along west wall
  for (let y = 4; y < height - 4; y += 3) {
    tiles[y][1].overlayObject = {
      type: OverlayObjectType.WEAPON_RACK,
      rotation: 90, // Face east
      material: 'wood'
    };
    tiles[y][1].isBlocking = true;
  }
  
  // Armor stands along east wall
  for (let y = 4; y < height - 4; y += 3) {
    tiles[y][width - 2].overlayObject = {
      type: OverlayObjectType.ARMOR_STAND,
      rotation: 270, // Face west
      material: 'iron'
    };
    tiles[y][width - 2].isBlocking = true;
  }
  
  return tiles;
}

/**
 * Test converting an old-style map to overlay system
 */
export function testMigrationToOverlay(): Tile[][] {
  const width = 10;
  const height = 10;
  const tiles: Tile[][] = [];
  
  // Create old-style map with furniture as biomes
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        x,
        y,
        altitude: 0,
        biome: BiomeType.FLOOR_WOOD,
        isLand: true,
        isCoast: false,
        qualities: {
          flammability: 0.5,
          biodiversity: 0,
          healthiness: 0.7,
          sacrality: 0,
          safety: 0.8
        },
        isBlocking: false,
        culturalZone: 'EUROPEAN'
      };
    }
  }
  
  // Add walls
  for (let x = 0; x < width; x++) {
    tiles[0][x].biome = BiomeType.WALL;
    tiles[0][x].isBlocking = true;
    tiles[height - 1][x].biome = BiomeType.WALL;
    tiles[height - 1][x].isBlocking = true;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].biome = BiomeType.WALL;
    tiles[y][0].isBlocking = true;
    tiles[y][width - 1].biome = BiomeType.WALL;
    tiles[y][width - 1].isBlocking = true;
  }
  
  // Add furniture using OLD biome system (will be migrated)
  tiles[2][4].biome = BiomeType.DESK;
  tiles[2][4].isBlocking = true;
  
  tiles[3][4].biome = BiomeType.CHAIR;
  tiles[3][4].isBlocking = true;
  
  tiles[5][2].biome = BiomeType.BOOKSHELF;
  tiles[5][2].isBlocking = true;
  
  tiles[5][5].biome = BiomeType.TABLE;
  tiles[5][5].isBlocking = true;
  
  tiles[4][5].biome = BiomeType.CHAIR;
  tiles[4][5].isBlocking = true;
  
  tiles[6][5].biome = BiomeType.CHAIR;
  tiles[6][5].isBlocking = true;
  
  // Migrate to overlay system
  const migratedTiles = migrateMapToOverlaySystem(tiles);
  
  return migratedTiles;
}

/**
 * Generate a culturally-specific room
 */
export function generateCulturalRoom(culturalZone: string): Tile[][] {
  const width = 12;
  const height = 12;
  const tiles: Tile[][] = [];
  
  // Determine floor type based on culture
  let floorType = BiomeType.FLOOR_STONE;
  let material = 'wood';
  
  switch (culturalZone) {
    case 'EAST_ASIAN':
      floorType = BiomeType.FLOOR_WOOD; // Tatami
      material = 'red_lacquer';
      break;
    case 'MENA':
      floorType = BiomeType.FLOOR_TILE;
      material = 'sandstone';
      break;
    case 'EUROPEAN':
      floorType = BiomeType.FLOOR_WOOD;
      material = 'wood';
      break;
    case 'SOUTH_ASIAN':
      floorType = BiomeType.FLOOR_MARBLE;
      material = 'marble';
      break;
  }
  
  // Initialize floor
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = {
        x,
        y,
        altitude: 0,
        biome: floorType,
        isLand: true,
        isCoast: false,
        qualities: {
          flammability: 0.3,
          biodiversity: 0,
          healthiness: 0.8,
          sacrality: 0.2,
          safety: 0.9
        },
        isBlocking: false,
        culturalZone
      };
    }
  }
  
  // Add walls
  for (let x = 0; x < width; x++) {
    tiles[0][x].biome = BiomeType.WALL;
    tiles[0][x].isBlocking = true;
    tiles[height - 1][x].biome = BiomeType.WALL;
    tiles[height - 1][x].isBlocking = true;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].biome = BiomeType.WALL;
    tiles[y][0].isBlocking = true;
    tiles[y][width - 1].biome = BiomeType.WALL;
    tiles[y][width - 1].isBlocking = true;
  }
  
  // Add culturally-specific furniture
  if (culturalZone === 'EAST_ASIAN') {
    // Low table in center
    tiles[6][6].overlayObject = {
      type: OverlayObjectType.TABLE,
      rotation: 0,
      material,
      variant: 'low'
    };
    tiles[6][6].isBlocking = true;
    
    // Floor cushions (represented as low chairs)
    const cushionPositions = [[5, 6], [7, 6], [6, 5], [6, 7]];
    cushionPositions.forEach(([y, x]) => {
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 0,
        material: 'silk',
        variant: 'cushion'
      };
      tiles[y][x].isBlocking = false; // Cushions don't block
    });
  } else if (culturalZone === 'MENA') {
    // Carpets
    for (let y = 3; y < 9; y++) {
      for (let x = 3; x < 9; x++) {
        tiles[y][x].biome = BiomeType.CARPET;
      }
    }
    
    // Low seating along walls
    for (let x = 2; x < width - 2; x += 2) {
      tiles[1][x].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: 180,
        material,
        variant: 'cushioned'
      };
      tiles[1][x].isBlocking = true;
    }
    
    // Brazier in center
    tiles[6][6].overlayObject = {
      type: OverlayObjectType.BRAZIER,
      rotation: 0,
      material: 'brass'
    };
    tiles[6][6].isBlocking = true;
  }
  
  return tiles;
}