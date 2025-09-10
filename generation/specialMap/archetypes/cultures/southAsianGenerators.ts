/**
 * generation/specialMap/archetypes/cultures/southAsianGenerators.ts
 * South Asian (Indian Subcontinent) architectural generators
 * Includes Hindu temples, Mughal palaces, Buddhist stupas, etc.
 */

import { Tile, BiomeType } from '../../../../types';
import { 
  SpecialMapConfig, 
  InteractionZone, 
  RoomDefinition
} from '../../../../types/specialMapTypes';
import { OverlayObjectType } from '../../../../types/core/tile';
import { ValueNoise } from '../../../../utils/noise';
import { registerCulturalGenerator } from '../../culturalGeneratorRegistry';

/**
 * Generate a Hindu temple complex with mandapa, garbhagriha, and courtyard
 */
export function generateHinduTemple(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with stone floor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }

  // Create outer walls
  for (let x = 0; x < width; x++) {
    tiles[0][x].biome = BiomeType.WALL;
    tiles[height - 1][x].biome = BiomeType.WALL;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].biome = BiomeType.WALL;
    tiles[y][width - 1].biome = BiomeType.WALL;
  }

  // Create entrance with gopuram (tower gate)
  const entranceX = Math.floor(width / 2);
  tiles[height - 1][entranceX].biome = BiomeType.DOOR;
  tiles[height - 1][entranceX - 1].biome = BiomeType.DOOR;
  tiles[height - 1][entranceX + 1].biome = BiomeType.DOOR;

  // Garbhagriha (sanctum sanctorum) - innermost chamber
  const sanctumX = Math.floor(width / 2);
  const sanctumY = Math.floor(height / 4);
  const sanctumSize = 5;
  
  for (let y = sanctumY; y < sanctumY + sanctumSize; y++) {
    for (let x = sanctumX - 2; x < sanctumX + 3; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (y === sanctumY || y === sanctumY + sanctumSize - 1 ||
            x === sanctumX - 2 || x === sanctumX + 2) {
          tiles[y][x].biome = BiomeType.WALL;
        }
      }
    }
  }
  
  // Door to sanctum
  tiles[sanctumY + sanctumSize - 1][sanctumX].biome = BiomeType.DOOR;

  // Place deity statue in sanctum
  if (sanctumY + 2 < height && sanctumX < width) {
    tiles[sanctumY + 2][sanctumX].overlayObject = {
      type: OverlayObjectType.STATUE,
      rotation: 0,
      rotation: 0,
      variant: 'deity'
    };
  }

  // Mandapa (pillared hall) in front of sanctum
  const mandapaStartY = sanctumY + sanctumSize + 2;
  const mandapaEndY = Math.min(height - 3, mandapaStartY + 8);
  
  // Place ornate pillars in mandapa
  for (let y = mandapaStartY; y < mandapaEndY; y += 3) {
    for (let x = 3; x < width - 3; x += 3) {
      if (tiles[y] && tiles[y][x]) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.COLUMN,
      rotation: 0,
          rotation: 0,
          variant: 'ornate'
        };
      }
    }
  }

  // Add oil lamps throughout
  const lampPositions = [
    { x: 2, y: 2 },
    { x: width - 3, y: 2 },
    { x: 2, y: height - 3 },
    { x: width - 3, y: height - 3 },
    { x: sanctumX - 3, y: sanctumY },
    { x: sanctumX + 3, y: sanctumY }
  ];

  for (const pos of lampPositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.BRAZIER,
      rotation: 0,
        rotation: 0,
        variant: 'oil_lamp'
      };
    }
  }

  // Add flower offerings near sanctum
  if (sanctumY + sanctumSize < height && sanctumX - 1 >= 0) {
    tiles[sanctumY + sanctumSize][sanctumX - 1].overlayObject = {
      type: OverlayObjectType.ALTAR,
      rotation: 0,
      rotation: 0,
      variant: 'offerings'
    };
    tiles[sanctumY + sanctumSize][sanctumX + 1].overlayObject = {
      type: OverlayObjectType.ALTAR,
      rotation: 0,
      rotation: 0,
      variant: 'offerings'
    };
  }

  // Define rooms
  rooms.push({
    id: 'sanctum',
    name: 'Garbhagriha',
    bounds: { 
      x: sanctumX - 2, 
      y: sanctumY, 
      width: 5, 
      height: sanctumSize 
    },
    type: 'sacred',
    description: 'The innermost sanctum housing the deity'
  });

  rooms.push({
    id: 'mandapa',
    name: 'Mandapa',
    bounds: { 
      x: 2, 
      y: mandapaStartY, 
      width: width - 4, 
      height: mandapaEndY - mandapaStartY 
    },
    type: 'public',
    description: 'Pillared assembly hall for devotees'
  });

  // Add interaction zones
  interactionZones.push({
    x: sanctumX,
    y: sanctumY + 2,
    width: 1,
    height: 1,
    type: 'SHRINE',
    name: 'Deity Shrine',
    description: 'Offer prayers to the deity'
  });
}

/**
 * Generate a Mughal-style palace audience hall (Diwan-i-Khas/Diwan-i-Aam)
 */
export function generateMughalPalace(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with marble floor (light stone)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }

  // Create outer walls with arched design
  for (let x = 0; x < width; x++) {
    tiles[0][x].biome = BiomeType.WALL;
    tiles[height - 1][x].biome = BiomeType.WALL;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].biome = BiomeType.WALL;
    tiles[y][width - 1].biome = BiomeType.WALL;
  }

  // Grand entrance with multiple arches
  const entranceWidth = 5;
  const entranceStart = Math.floor((width - entranceWidth) / 2);
  for (let x = entranceStart; x < entranceStart + entranceWidth; x++) {
    tiles[height - 1][x].biome = BiomeType.DOOR;
  }

  // Throne platform at the far end
  const throneY = 2;
  const throneX = Math.floor(width / 2);
  const platformWidth = 7;
  const platformDepth = 3;
  
  // Create raised platform
  for (let y = throneY; y < throneY + platformDepth; y++) {
    for (let x = throneX - 3; x < throneX + 4; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        tiles[y][x].biome = BiomeType.FLOOR_DIRT;
      }
    }
  }

  // Place throne
  if (throneY + 1 < height && throneX < width) {
    tiles[throneY + 1][throneX].overlayObject = {
      type: OverlayObjectType.THRONE,
      rotation: 0,
      variant: 'mughal'
    };
  }

  // Ornamental pillars with Islamic arches
  const pillarRows = [6, height - 6];
  for (const y of pillarRows) {
    for (let x = 4; x < width - 4; x += 4) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.COLUMN,
      rotation: 0,
          variant: 'islamic_arch'
        };
      }
    }
  }

  // Water fountain in center (char bagh influence)
  const fountainY = Math.floor(height / 2);
  const fountainX = Math.floor(width / 2);
  if (fountainY >= 0 && fountainY < height && fountainX >= 0 && fountainX < width) {
    tiles[fountainY][fountainX].overlayObject = {
      type: OverlayObjectType.FOUNTAIN,
      rotation: 0,
      variant: 'octagonal'
    };
  }

  // Decorative carpets leading to throne
  for (let y = throneY + platformDepth + 1; y < fountainY - 1; y++) {
    if (y >= 0 && y < height && throneX >= 0 && throneX < width) {
      tiles[y][throneX].biome = BiomeType.FLOOR_DIRT;
      if (throneX - 1 >= 0) tiles[y][throneX - 1].biome = BiomeType.FLOOR_DIRT;
      if (throneX + 1 < width) tiles[y][throneX + 1].biome = BiomeType.FLOOR_DIRT;
    }
  }

  // Ornate braziers
  const brazierPositions = [
    { x: 2, y: 2 },
    { x: width - 3, y: 2 },
    { x: 2, y: height - 3 },
    { x: width - 3, y: height - 3 }
  ];

  for (const pos of brazierPositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.BRAZIER,
      rotation: 0,
        variant: 'ornate'
      };
    }
  }

  // Define rooms
  rooms.push({
    id: 'throne_room',
    name: 'Diwan-i-Khas',
    bounds: { 
      x: 1, 
      y: 1, 
      width: width - 2, 
      height: Math.floor(height / 2) - 1 
    },
    type: 'throne',
    description: 'Private audience hall of the emperor'
  });

  rooms.push({
    id: 'court',
    name: 'Audience Court',
    bounds: { 
      x: 1, 
      y: Math.floor(height / 2), 
      width: width - 2, 
      height: Math.floor(height / 2) - 1 
    },
    type: 'public',
    description: 'Public court for petitioners'
  });

  // Add interaction zones
  interactionZones.push({
    x: throneX,
    y: throneY + 1,
    width: 1,
    height: 1,
    type: 'THRONE',
    name: 'Emperor\'s Throne',
    description: 'The seat of Mughal power'
  });
}

/**
 * Generate a Buddhist stupa/monastery complex
 */
export function generateBuddhistMonastery(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with stone floor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
    }
  }

  // Create outer walls
  for (let x = 0; x < width; x++) {
    tiles[0][x].biome = BiomeType.WALL;
    tiles[height - 1][x].biome = BiomeType.WALL;
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0].biome = BiomeType.WALL;
    tiles[y][width - 1].biome = BiomeType.WALL;
  }

  // Entrance
  const entranceX = Math.floor(width / 2);
  tiles[height - 1][entranceX].biome = BiomeType.DOOR;

  // Central stupa (circular structure)
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const radius = Math.min(4, Math.floor(Math.min(width, height) / 6));
  
  // Create circular stupa base
  for (let y = centerY - radius; y <= centerY + radius; y++) {
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (dist <= radius) {
          tiles[y][x].biome = BiomeType.FLOOR_STONE;
        }
      }
    }
  }

  // Buddha statue at center
  if (centerY >= 0 && centerY < height && centerX >= 0 && centerX < width) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.STATUE,
      rotation: 0,
      variant: 'buddha'
    };
  }

  // Prayer wheels around stupa
  const wheelPositions = [
    { x: centerX - radius - 1, y: centerY },
    { x: centerX + radius + 1, y: centerY },
    { x: centerX, y: centerY - radius - 1 },
    { x: centerX, y: centerY + radius + 1 }
  ];

  for (const pos of wheelPositions) {
    if (pos.x >= 1 && pos.x < width - 1 && pos.y >= 1 && pos.y < height - 1) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.PRAYER_WHEEL,
      rotation: 0,
        variant: 'tibetan'
      };
    }
  }

  // Meditation cells along walls
  const cellSize = 3;
  for (let x = 2; x < width - cellSize; x += cellSize + 1) {
    // Top row cells
    if (2 < height - 1) {
      tiles[2][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
      rotation: 0,
        variant: 'meditation'
      };
    }
    // Bottom row cells
    if (height - 3 >= 0 && height - 3 < height) {
      tiles[height - 3][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
      rotation: 0,
        variant: 'meditation'
      };
    }
  }

  // Incense burners
  const incensePositions = [
    { x: 2, y: 2 },
    { x: width - 3, y: 2 },
    { x: 2, y: height - 3 },
    { x: width - 3, y: height - 3 }
  ];

  for (const pos of incensePositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.BRAZIER,
      rotation: 0,
        variant: 'incense'
      };
    }
  }

  // Define rooms
  rooms.push({
    id: 'stupa',
    name: 'Central Stupa',
    bounds: { 
      x: centerX - radius - 1, 
      y: centerY - radius - 1, 
      width: radius * 2 + 2, 
      height: radius * 2 + 2 
    },
    type: 'sacred',
    description: 'Sacred stupa for circumambulation'
  });

  rooms.push({
    id: 'meditation_hall',
    name: 'Meditation Hall',
    bounds: { 
      x: 1, 
      y: 1, 
      width: width - 2, 
      height: height - 2 
    },
    type: 'public',
    description: 'Hall for meditation and teachings'
  });

  // Add interaction zones
  interactionZones.push({
    x: centerX,
    y: centerY,
    width: 1,
    height: 1,
    type: 'SHRINE',
    name: 'Buddha Shrine',
    description: 'Offer prayers and meditate'
  });
}

/**
 * Generate a South Asian marketplace/bazaar
 */
export function generateSouthAsianBazaar(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with dirt floor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.DIRT_PATH;
    }
  }

  // Create market stalls in rows
  const stallWidth = 3;
  const stallDepth = 2;
  const aisleWidth = 3;
  
  let currentX = 2;
  let stallNumber = 0;
  
  while (currentX + stallWidth < width - 2) {
    // Top row of stalls
    for (let y = 2; y < 2 + stallDepth; y++) {
      for (let x = currentX; x < currentX + stallWidth; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        }
      }
    }
    
    // Add merchant table
    if (currentX + 1 < width && 2 < height) {
      tiles[2][currentX + 1].overlayObject = {
        type: OverlayObjectType.TABLE,
      rotation: 0,
        variant: 'merchant'
      };
    }
    
    // Add goods
    if (currentX < width && 3 < height) {
      const goods = ['spices', 'textiles', 'pottery', 'jewelry'];
      tiles[3][currentX].overlayObject = {
        type: OverlayObjectType.CRATE,
      rotation: 0,
        variant: goods[stallNumber % goods.length]
      };
    }
    
    // Bottom row of stalls
    for (let y = height - 4; y < height - 2; y++) {
      for (let x = currentX; x < currentX + stallWidth; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        }
      }
    }
    
    // Add merchant table
    if (currentX + 1 < width && height - 4 >= 0 && height - 4 < height) {
      tiles[height - 4][currentX + 1].overlayObject = {
        type: OverlayObjectType.TABLE,
      rotation: 0,
        variant: 'merchant'
      };
    }
    
    currentX += stallWidth + aisleWidth;
    stallNumber++;
  }

  // Central fountain or well
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  if (centerY >= 0 && centerY < height && centerX >= 0 && centerX < width) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.WELL,
      rotation: 0,
      variant: 'stone'
    };
  }

  // Add some decorative elements - hanging lanterns
  for (let x = 4; x < width - 4; x += 6) {
    if (5 < height && x < width) {
      tiles[5][x].overlayObject = {
        type: OverlayObjectType.BRAZIER,
      rotation: 0,
        variant: 'hanging_lantern'
      };
    }
    if (height - 6 >= 0 && height - 6 < height && x < width) {
      tiles[height - 6][x].overlayObject = {
        type: OverlayObjectType.BRAZIER,
      rotation: 0,
        variant: 'hanging_lantern'
      };
    }
  }

  // Define rooms for each stall area
  rooms.push({
    id: 'market_north',
    name: 'Northern Stalls',
    bounds: { 
      x: 2, 
      y: 2, 
      width: width - 4, 
      height: stallDepth + 1 
    },
    type: 'shop',
    description: 'Merchant stalls'
  });

  rooms.push({
    id: 'market_south',
    name: 'Southern Stalls',
    bounds: { 
      x: 2, 
      y: height - 4, 
      width: width - 4, 
      height: stallDepth + 1 
    },
    type: 'shop',
    description: 'Merchant stalls'
  });

  rooms.push({
    id: 'market_center',
    name: 'Market Square',
    bounds: { 
      x: 2, 
      y: 5, 
      width: width - 4, 
      height: height - 10 
    },
    type: 'public',
    description: 'Open market area'
  });

  // Add interaction zones for trading
  interactionZones.push({
    x: centerX,
    y: centerY,
    width: 1,
    height: 1,
    type: 'WELL',
    name: 'Market Well',
    description: 'Gather water and gossip'
  });
}

// Register all South Asian generators
registerCulturalGenerator('SACRED_COMPLEX', 'SOUTH_ASIAN', generateHinduTemple);
registerCulturalGenerator('SACRED_COMPLEX', 'HINDU', generateHinduTemple);
registerCulturalGenerator('SACRED_COMPLEX', 'BUDDHIST', generateBuddhistMonastery);
registerCulturalGenerator('PALACE_COMPLEX', 'SOUTH_ASIAN', generateMughalPalace);
registerCulturalGenerator('PALACE_COMPLEX', 'MUGHAL', generateMughalPalace);
registerCulturalGenerator('GOVERNMENT_FORUM', 'SOUTH_ASIAN', generateMughalPalace);
registerCulturalGenerator('MARKET_BAZAAR', 'SOUTH_ASIAN', generateSouthAsianBazaar);

// Export for direct use
export {
  generateHinduTemple as generateSouthAsianSacred,
  generateMughalPalace as generateSouthAsianGovernment,
  generateBuddhistMonastery as generateSouthAsianMonastery,
  generateSouthAsianBazaar as generateSouthAsianMarket
};