/**
 * generation/specialMap/archetypes/cultures/southeastAsianGenerators.ts
 * Southeast Asian architectural generators
 * Includes Angkor-style temples, Thai wats, Indonesian pendopo, Vietnamese pagodas
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
 * Generate an Angkor/Khmer style temple complex
 */
export function generateAngkorTemple(
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

  // Create stepped pyramid structure (prasat)
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  // Outer terrace
  const outerSize = Math.min(width - 4, height - 4);
  const outerStart = {
    x: centerX - Math.floor(outerSize / 2),
    y: centerY - Math.floor(outerSize / 2)
  };
  
  for (let y = outerStart.y; y < outerStart.y + outerSize; y++) {
    for (let x = outerStart.x; x < outerStart.x + outerSize; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (x === outerStart.x || x === outerStart.x + outerSize - 1 ||
            y === outerStart.y || y === outerStart.y + outerSize - 1) {
          tiles[y][x].biome = BiomeType.WALL;
        }
      }
    }
  }

  // Middle terrace
  const middleSize = Math.floor(outerSize * 0.7);
  const middleStart = {
    x: centerX - Math.floor(middleSize / 2),
    y: centerY - Math.floor(middleSize / 2)
  };
  
  for (let y = middleStart.y; y < middleStart.y + middleSize; y++) {
    for (let x = middleStart.x; x < middleStart.x + middleSize; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (x === middleStart.x || x === middleStart.x + middleSize - 1 ||
            y === middleStart.y || y === middleStart.y + middleSize - 1) {
          tiles[y][x].biome = BiomeType.FLOOR_STONE;
        }
      }
    }
  }

  // Inner sanctuary
  const innerSize = Math.floor(middleSize * 0.6);
  const innerStart = {
    x: centerX - Math.floor(innerSize / 2),
    y: centerY - Math.floor(innerSize / 2)
  };
  
  for (let y = innerStart.y; y < innerStart.y + innerSize; y++) {
    for (let x = innerStart.x; x < innerStart.x + innerSize; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (x === innerStart.x || x === innerStart.x + innerSize - 1 ||
            y === innerStart.y || y === innerStart.y + innerSize - 1) {
          tiles[y][x].biome = BiomeType.WALL;
        }
      }
    }
  }

  // Central shrine with lingam or Buddha statue
  if (centerY >= 0 && centerY < height && centerX >= 0 && centerX < width) {
    tiles[centerY][centerX].overlayObject = {
      type: OverlayObjectType.STATUE,
      rotation: 0,
      variant: 'khmer_deity'
    };
  }

  // Entrance causeway (south)
  for (let y = outerStart.y + outerSize; y < height - 1; y++) {
    if (y >= 0 && y < height && centerX >= 0 && centerX < width) {
      tiles[y][centerX].biome = BiomeType.FLOOR_STONE;
      if (centerX - 1 >= 0) tiles[y][centerX - 1].biome = BiomeType.FLOOR_STONE;
      if (centerX + 1 < width) tiles[y][centerX + 1].biome = BiomeType.FLOOR_STONE;
    }
  }

  // Doorways
  tiles[outerStart.y + outerSize - 1][centerX].biome = BiomeType.DOOR;
  tiles[middleStart.y + middleSize - 1][centerX].biome = BiomeType.DOOR;
  tiles[innerStart.y + innerSize - 1][centerX].biome = BiomeType.DOOR;

  // Guardian statues (dvarapala) at entrances
  const guardianPositions = [
    { x: centerX - 2, y: outerStart.y + outerSize },
    { x: centerX + 2, y: outerStart.y + outerSize }
  ];
  
  for (const pos of guardianPositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.STATUE,
      rotation: 0,
        variant: 'guardian'
      };
    }
  }

  // Bas-relief decorations (represented as wall carvings)
  for (let x = outerStart.x + 2; x < outerStart.x + outerSize - 2; x += 4) {
    if (outerStart.y + 1 < height && x < width) {
      tiles[outerStart.y + 1][x].overlayObject = {
        type: OverlayObjectType.RELIEF,
      rotation: 0,
        variant: 'apsara'
      };
    }
  }

  // Define rooms
  rooms.push({
    id: 'inner_sanctuary',
    name: 'Garbhagriha',
    bounds: { 
      x: innerStart.x, 
      y: innerStart.y, 
      width: innerSize, 
      height: innerSize 
    },
    type: 'sacred',
    description: 'Inner sanctuary'
  });

  rooms.push({
    id: 'middle_terrace',
    name: 'Middle Terrace',
    bounds: { 
      x: middleStart.x, 
      y: middleStart.y, 
      width: middleSize, 
      height: middleSize 
    },
    type: 'public',
    description: 'Middle terrace for rituals'
  });

  // Add interaction zones
  interactionZones.push({
    x: centerX,
    y: centerY,
    width: 1,
    height: 1,
    type: 'SHRINE',
    name: 'Central Shrine',
    description: 'Sacred center of the temple'
  });
}

/**
 * Generate a Thai Buddhist wat (temple)
 */
export function generateThaiWat(
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

  // Main entrance
  const entranceX = Math.floor(width / 2);
  tiles[height - 1][entranceX].biome = BiomeType.DOOR;
  tiles[height - 1][entranceX - 1].biome = BiomeType.DOOR;
  tiles[height - 1][entranceX + 1].biome = BiomeType.DOOR;

  // Ubosot (ordination hall) - main building
  const ubosotY = 3;
  const ubosotHeight = Math.floor(height / 3);
  const ubosotWidth = Math.floor(width * 0.6);
  const ubosotX = Math.floor((width - ubosotWidth) / 2);
  
  // Ubosot walls
  for (let y = ubosotY; y < ubosotY + ubosotHeight; y++) {
    for (let x = ubosotX; x < ubosotX + ubosotWidth; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (y === ubosotY || y === ubosotY + ubosotHeight - 1 ||
            x === ubosotX || x === ubosotX + ubosotWidth - 1) {
          tiles[y][x].biome = BiomeType.WALL;
        }
      }
    }
  }
  
  // Ubosot entrance
  tiles[ubosotY + ubosotHeight - 1][entranceX].biome = BiomeType.DOOR;

  // Main Buddha statue
  const buddhaY = ubosotY + 2;
  const buddhaX = entranceX;
  if (buddhaY >= 0 && buddhaY < height && buddhaX >= 0 && buddhaX < width) {
    tiles[buddhaY][buddhaX].overlayObject = {
      type: OverlayObjectType.STATUE,
      rotation: 0,
      variant: 'thai_buddha'
    };
  }

  // Smaller Buddha statues flanking main one
  if (buddhaY >= 0 && buddhaY < height) {
    if (buddhaX - 2 >= 0) {
      tiles[buddhaY][buddhaX - 2].overlayObject = {
        type: OverlayObjectType.STATUE,
      rotation: 0,
        variant: 'small_buddha'
      };
    }
    if (buddhaX + 2 < width) {
      tiles[buddhaY][buddhaX + 2].overlayObject = {
        type: OverlayObjectType.STATUE,
      rotation: 0,
        variant: 'small_buddha'
      };
    }
  }

  // Chedi (stupa) in courtyard
  const chediX = Math.floor(width * 0.75);
  const chediY = Math.floor(height * 0.6);
  if (chediY >= 0 && chediY < height && chediX >= 0 && chediX < width) {
    tiles[chediY][chediX].overlayObject = {
      type: OverlayObjectType.STUPA,
      rotation: 0,
      variant: 'thai'
    };
  }

  // Bell tower
  const bellX = Math.floor(width * 0.25);
  const bellY = Math.floor(height * 0.6);
  if (bellY >= 0 && bellY < height && bellX >= 0 && bellX < width) {
    tiles[bellY][bellX].overlayObject = {
      type: OverlayObjectType.BELL_TOWER,
      rotation: 0,
      variant: 'temple'
    };
  }

  // Meditation mats in main hall
  for (let y = ubosotY + 4; y < ubosotY + ubosotHeight - 2; y += 2) {
    for (let x = ubosotX + 2; x < ubosotX + ubosotWidth - 2; x += 3) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.CUSHION,
      rotation: 0,
          variant: 'meditation'
        };
      }
    }
  }

  // Incense and flower offerings
  if (buddhaY + 1 < height) {
    if (buddhaX - 1 >= 0) {
      tiles[buddhaY + 1][buddhaX - 1].overlayObject = {
        type: OverlayObjectType.ALTAR,
      rotation: 0,
        variant: 'offerings'
      };
    }
    if (buddhaX + 1 < width) {
      tiles[buddhaY + 1][buddhaX + 1].overlayObject = {
        type: OverlayObjectType.ALTAR,
      rotation: 0,
        variant: 'offerings'
      };
    }
  }

  // Define rooms
  rooms.push({
    id: 'ubosot',
    name: 'Ubosot',
    bounds: { 
      x: ubosotX, 
      y: ubosotY, 
      width: ubosotWidth, 
      height: ubosotHeight 
    },
    type: 'sacred',
    description: 'Main ordination hall'
  });

  rooms.push({
    id: 'courtyard',
    name: 'Temple Courtyard',
    bounds: { 
      x: 1, 
      y: ubosotY + ubosotHeight, 
      width: width - 2, 
      height: height - ubosotY - ubosotHeight - 1 
    },
    type: 'public',
    description: 'Open courtyard with chedi'
  });

  // Add interaction zones
  interactionZones.push({
    x: buddhaX,
    y: buddhaY,
    width: 1,
    height: 1,
    type: 'SHRINE',
    name: 'Main Buddha',
    description: 'Offer prayers and merit'
  });

  interactionZones.push({
    x: bellX,
    y: bellY,
    width: 1,
    height: 1,
    type: 'BELL',
    name: 'Temple Bell',
    description: 'Ring for merit'
  });
}

/**
 * Generate an Indonesian pendopo (open pavilion)
 */
export function generateIndonesianPendopo(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const { width, height } = size;
  
  // Initialize with wood floor for raised platform
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles[y][x].biome = BiomeType.DIRT_PATH;
    }
  }

  // Create raised wooden platform
  const platformMargin = 3;
  for (let y = platformMargin; y < height - platformMargin; y++) {
    for (let x = platformMargin; x < width - platformMargin; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
    }
  }

  // Joglo-style pillars (no walls, open air)
  const pillarSpacing = 4;
  for (let y = platformMargin; y < height - platformMargin; y += pillarSpacing) {
    for (let x = platformMargin; x < width - platformMargin; x += pillarSpacing) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.COLUMN,
      rotation: 0,
          variant: 'carved_wood'
        };
      }
    }
  }

  // Central performance/meeting area
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  // Gamelan instruments on one side
  const gamelanY = centerY - 2;
  for (let x = centerX - 4; x <= centerX + 4; x += 2) {
    if (gamelanY >= 0 && gamelanY < height && x >= 0 && x < width) {
      tiles[gamelanY][x].overlayObject = {
        type: OverlayObjectType.INSTRUMENT,
      rotation: 0,
        variant: x < centerX ? 'gong' : 'metallophone'
      };
    }
  }

  // Seating area with woven mats
  for (let y = centerY + 1; y < centerY + 4; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x += 2) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.CUSHION,
      rotation: 0,
          variant: 'woven_mat'
        };
      }
    }
  }

  // Wayang (puppet show) screen area
  if (centerY - 4 >= 0 && centerX >= 0 && centerX < width) {
    tiles[centerY - 4][centerX].overlayObject = {
      type: OverlayObjectType.SCREEN,
      rotation: 0,
      variant: 'wayang'
    };
  }

  // Oil lamps for evening performances
  const lampPositions = [
    { x: platformMargin + 1, y: platformMargin + 1 },
    { x: width - platformMargin - 2, y: platformMargin + 1 },
    { x: platformMargin + 1, y: height - platformMargin - 2 },
    { x: width - platformMargin - 2, y: height - platformMargin - 2 }
  ];

  for (const pos of lampPositions) {
    if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
      tiles[pos.y][pos.x].overlayObject = {
        type: OverlayObjectType.BRAZIER,
      rotation: 0,
        variant: 'oil_lamp'
      };
    }
  }

  // Decorative batik banners
  for (let x = platformMargin + 2; x < width - platformMargin - 2; x += 5) {
    if (platformMargin + 1 < height && x < width) {
      tiles[platformMargin + 1][x].overlayObject = {
        type: OverlayObjectType.BANNER,
      rotation: 0,
        variant: 'batik'
      };
    }
  }

  // Define rooms
  rooms.push({
    id: 'pendopo',
    name: 'Pendopo',
    bounds: { 
      x: platformMargin, 
      y: platformMargin, 
      width: width - platformMargin * 2, 
      height: height - platformMargin * 2 
    },
    type: 'public',
    description: 'Open pavilion for gatherings'
  });

  rooms.push({
    id: 'performance_area',
    name: 'Performance Area',
    bounds: { 
      x: centerX - 5, 
      y: centerY - 5, 
      width: 10, 
      height: 10 
    },
    type: 'entertainment',
    description: 'Area for cultural performances'
  });

  // Add interaction zones
  interactionZones.push({
    x: centerX,
    y: gamelanY,
    width: 1,
    height: 1,
    type: 'INSTRUMENT',
    name: 'Gamelan',
    description: 'Traditional orchestra'
  });
}

/**
 * Generate a Vietnamese communal house (đình)
 */
export function generateVietnameseDinh(
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

  // Main entrance with three doors (tam quan)
  const centerX = Math.floor(width / 2);
  tiles[height - 1][centerX].biome = BiomeType.DOOR;
  tiles[height - 1][centerX - 2].biome = BiomeType.DOOR;
  tiles[height - 1][centerX + 2].biome = BiomeType.DOOR;

  // Main altar area at the back
  const altarY = 2;
  const altarWidth = 7;
  const altarX = centerX - 3;
  
  for (let x = altarX; x < altarX + altarWidth; x++) {
    if (altarY >= 0 && altarY < height && x >= 0 && x < width) {
      tiles[altarY][x].biome = BiomeType.FLOOR_STONE;
    }
  }

  // Ancestor tablets and incense
  if (altarY >= 0 && altarY < height && centerX >= 0 && centerX < width) {
    tiles[altarY][centerX].overlayObject = {
      type: OverlayObjectType.ANCESTOR_TABLET,
      rotation: 0,
      variant: 'vietnamese'
    };
  }

  // Incense burners
  if (altarY + 1 < height) {
    if (centerX - 2 >= 0) {
      tiles[altarY + 1][centerX - 2].overlayObject = {
        type: OverlayObjectType.BRAZIER,
      rotation: 0,
        variant: 'incense'
      };
    }
    if (centerX + 2 < width) {
      tiles[altarY + 1][centerX + 2].overlayObject = {
        type: OverlayObjectType.BRAZIER,
      rotation: 0,
        variant: 'incense'
      };
    }
  }

  // Wooden pillars with carvings
  const pillarY = [6, height - 6];
  for (const y of pillarY) {
    for (let x = 4; x < width - 4; x += 4) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.COLUMN,
      rotation: 0,
          variant: 'lacquered_wood'
        };
      }
    }
  }

  // Meeting area with low tables
  const meetingY = Math.floor(height / 2);
  for (let x = centerX - 4; x <= centerX + 4; x += 4) {
    if (meetingY >= 0 && meetingY < height && x >= 0 && x < width) {
      tiles[meetingY][x].overlayObject = {
        type: OverlayObjectType.TABLE,
      rotation: 0,
        variant: 'low_wooden'
      };
    }
  }

  // Sitting mats around tables
  for (let x = centerX - 4; x <= centerX + 4; x += 2) {
    if (meetingY + 1 < height && x >= 0 && x < width) {
      tiles[meetingY + 1][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
      rotation: 0,
        variant: 'bamboo_mat'
      };
    }
    if (meetingY - 1 >= 0 && x >= 0 && x < width) {
      tiles[meetingY - 1][x].overlayObject = {
        type: OverlayObjectType.CUSHION,
      rotation: 0,
        variant: 'bamboo_mat'
      };
    }
  }

  // Decorative elements - drums and gongs
  if (3 < height && 2 < width) {
    tiles[3][2].overlayObject = {
      type: OverlayObjectType.DRUM,
      rotation: 0,
      variant: 'ceremonial'
    };
  }
  if (3 < height && width - 3 >= 0 && width - 3 < width) {
    tiles[3][width - 3].overlayObject = {
      type: OverlayObjectType.GONG,
      rotation: 0,
      variant: 'bronze'
    };
  }

  // Define rooms
  rooms.push({
    id: 'altar_area',
    name: 'Ancestor Altar',
    bounds: { 
      x: altarX, 
      y: altarY, 
      width: altarWidth, 
      height: 3 
    },
    type: 'sacred',
    description: 'Ancestor worship area'
  });

  rooms.push({
    id: 'meeting_hall',
    name: 'Community Hall',
    bounds: { 
      x: 2, 
      y: 5, 
      width: width - 4, 
      height: height - 10 
    },
    type: 'public',
    description: 'Village meeting hall'
  });

  // Add interaction zones
  interactionZones.push({
    x: centerX,
    y: altarY,
    width: 1,
    height: 1,
    type: 'SHRINE',
    name: 'Ancestor Altar',
    description: 'Honor the ancestors'
  });
}

// Register all Southeast Asian generators
registerCulturalGenerator('SACRED_COMPLEX', 'SOUTHEAST_ASIAN', generateAngkorTemple);
registerCulturalGenerator('SACRED_COMPLEX', 'KHMER', generateAngkorTemple);
registerCulturalGenerator('SACRED_COMPLEX', 'THAI', generateThaiWat);
registerCulturalGenerator('GOVERNMENT_FORUM', 'SOUTHEAST_ASIAN', generateVietnameseDinh);
registerCulturalGenerator('GOVERNMENT_FORUM', 'VIETNAMESE', generateVietnameseDinh);
registerCulturalGenerator('GOVERNMENT_FORUM', 'INDONESIAN', generateIndonesianPendopo);
registerCulturalGenerator('PALACE_COMPLEX', 'SOUTHEAST_ASIAN', generateAngkorTemple);
registerCulturalGenerator('THEATER', 'SOUTHEAST_ASIAN', generateIndonesianPendopo);

// Export for direct use
export {
  generateAngkorTemple as generateSoutheastAsianSacred,
  generateThaiWat as generateSoutheastAsianTemple,
  generateIndonesianPendopo as generateSoutheastAsianPavilion,
  generateVietnameseDinh as generateSoutheastAsianGovernment
};