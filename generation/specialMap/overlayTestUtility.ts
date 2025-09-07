/**
 * Overlay Test Utility
 * Simple test functions to verify the overlay system works correctly
 */

import { Tile, OverlayObjectType } from '../../types/core/tile';
import { BiomeType } from '../../types/biomes/base';

/**
 * Create a simple test room using the overlay system
 * This demonstrates how to place furniture as overlays on floor tiles
 */
export function createTestRoomWithOverlays(width: number = 10, height: number = 10): Tile[][] {
  const tiles: Tile[][] = [];
  
  // Initialize all tiles as floor tiles
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
  
  // Add walls around the perimeter
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
  
  // Add a door on the south wall
  const doorX = Math.floor(width / 2);
  tiles[height - 1][doorX].biome = BiomeType.DOOR;
  tiles[height - 1][doorX].isBlocking = false;
  
  // Place a desk against the north wall using overlay system
  const deskX = Math.floor(width / 2);
  const deskY = 2;
  tiles[deskY][deskX].overlayObject = {
    type: OverlayObjectType.DESK,
    rotation: 180, // Face south (away from wall)
    material: 'wood'
  };
  tiles[deskY][deskX].isBlocking = true;
  
  // Place a chair in front of the desk
  const chairY = deskY + 1;
  tiles[chairY][deskX].overlayObject = {
    type: OverlayObjectType.CHAIR,
    rotation: 0, // Face north (toward desk)
    material: 'wood'
  };
  tiles[chairY][deskX].isBlocking = true;
  
  // Place bookshelves along the west wall
  for (let y = 2; y < height - 2; y += 2) {
    tiles[y][1].overlayObject = {
      type: OverlayObjectType.BOOKSHELF,
      rotation: 90, // Face east (away from wall)
      material: 'wood'
    };
    tiles[y][1].isBlocking = true;
  }
  
  // Place a table in the center with chairs around it
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  // Table
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.TABLE,
    rotation: 0,
    material: 'wood'
  };
  tiles[centerY][centerX].isBlocking = true;
  
  // Chairs around table
  // North chair
  if (centerY > 1) {
    tiles[centerY - 1][centerX].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 180, // Face south
      material: 'wood'
    };
    tiles[centerY - 1][centerX].isBlocking = true;
  }
  
  // South chair
  if (centerY < height - 2) {
    tiles[centerY + 1][centerX].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 0, // Face north
      material: 'wood'
    };
    tiles[centerY + 1][centerX].isBlocking = true;
  }
  
  // East chair
  if (centerX < width - 2) {
    tiles[centerY][centerX + 1].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 270, // Face west
      material: 'wood'
    };
    tiles[centerY][centerX + 1].isBlocking = true;
  }
  
  // West chair
  if (centerX > 1) {
    tiles[centerY][centerX - 1].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 90, // Face east
      material: 'wood'
    };
    tiles[centerY][centerX - 1].isBlocking = true;
  }
  
  // Add a brazier in the corner for light
  tiles[2][width - 2].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    material: 'bronze'
  };
  tiles[2][width - 2].isBlocking = true;
  
  return tiles;
}

/**
 * Convert a desk/chair pair to use the overlay system
 * This is a helper for migrating existing generators
 */
export function placeDeskWithChairOverlay(
  tiles: Tile[][],
  deskX: number,
  deskY: number,
  facingDirection: 'north' | 'south' | 'east' | 'west' = 'south'
): void {
  // Rotation mapping
  const rotations = {
    north: 0,
    east: 90,
    south: 180,
    west: 270
  };
  
  // Place desk as overlay
  tiles[deskY][deskX].biome = BiomeType.FLOOR_WOOD; // Ensure floor tile
  tiles[deskY][deskX].overlayObject = {
    type: OverlayObjectType.DESK,
    rotation: rotations[facingDirection],
    material: 'wood'
  };
  tiles[deskY][deskX].isBlocking = true;
  
  // Calculate chair position (opposite of facing direction)
  let chairX = deskX;
  let chairY = deskY;
  let chairRotation = 0;
  
  switch (facingDirection) {
    case 'north':
      chairY = deskY + 1;
      chairRotation = 0; // Face north toward desk
      break;
    case 'south':
      chairY = deskY - 1;
      chairRotation = 180; // Face south toward desk
      break;
    case 'east':
      chairX = deskX - 1;
      chairRotation = 90; // Face east toward desk
      break;
    case 'west':
      chairX = deskX + 1;
      chairRotation = 270; // Face west toward desk
      break;
  }
  
  // Place chair if position is valid
  if (chairY >= 0 && chairY < tiles.length && 
      chairX >= 0 && chairX < tiles[0].length &&
      !tiles[chairY][chairX].isBlocking) {
    tiles[chairY][chairX].biome = BiomeType.FLOOR_WOOD;
    tiles[chairY][chairX].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: chairRotation,
      material: 'wood'
    };
    tiles[chairY][chairX].isBlocking = true;
  }
}

/**
 * Helper to detect if a tile should have furniture face away from it
 */
export function isWallOrWindow(tile: Tile): boolean {
  return tile.biome === BiomeType.WALL ||
         tile.biome === BiomeType.WALL_WINDOW ||
         tile.biome === BiomeType.WALL_GATE ||
         tile.biome.startsWith('WALL_');
}

/**
 * Calculate optimal rotation for furniture based on adjacent walls
 */
export function calculateFurnitureRotation(
  tiles: Tile[][],
  x: number,
  y: number,
  furnitureType: OverlayObjectType
): number {
  const north = y > 0 ? tiles[y - 1][x] : null;
  const south = y < tiles.length - 1 ? tiles[y + 1][x] : null;
  const east = x < tiles[0].length - 1 ? tiles[y][x + 1] : null;
  const west = x > 0 ? tiles[y][x - 1] : null;
  
  // Furniture that should be against walls
  const wallFurniture = [
    OverlayObjectType.DESK,
    OverlayObjectType.BOOKSHELF,
    OverlayObjectType.CABINET,
    OverlayObjectType.BED,
    OverlayObjectType.MIRROR
  ];
  
  if (wallFurniture.includes(furnitureType)) {
    // Face away from nearest wall
    if (north && isWallOrWindow(north)) return 180; // Face south
    if (south && isWallOrWindow(south)) return 0;   // Face north
    if (east && isWallOrWindow(east)) return 270;   // Face west
    if (west && isWallOrWindow(west)) return 90;    // Face east
  }
  
  // Default rotation
  return 0;
}

/**
 * Test function to verify overlay system is working
 */
export function testOverlaySystem(): void {
  console.log('Testing Overlay System...');
  
  // Create a test room
  const testRoom = createTestRoomWithOverlays(8, 8);
  
  // Count tiles with overlays
  let overlayCount = 0;
  let furnitureTypes = new Set<string>();
  
  for (const row of testRoom) {
    for (const tile of row) {
      if (tile.overlayObject) {
        overlayCount++;
        furnitureTypes.add(tile.overlayObject.type);
      }
    }
  }
  
  console.log(`Created ${testRoom.length}x${testRoom[0].length} room`);
  console.log(`Placed ${overlayCount} overlay objects`);
  console.log(`Furniture types: ${Array.from(furnitureTypes).join(', ')}`);
  
  // Verify rotations
  const deskTile = testRoom[2][4]; // Desk position
  const chairTile = testRoom[3][4]; // Chair position
  
  if (deskTile.overlayObject && chairTile.overlayObject) {
    console.log(`Desk rotation: ${deskTile.overlayObject.rotation}° (should face south: 180°)`);
    console.log(`Chair rotation: ${chairTile.overlayObject.rotation}° (should face north: 0°)`);
  }
  
  console.log('Overlay System Test Complete!');
}