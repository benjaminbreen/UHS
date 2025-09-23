/**
 * generation/specialMap/archetypes/cultures/europeanGenerators.ts
 * Cultural generators for European Medieval special maps
 * Includes Gothic, Romanesque, and Medieval architectural styles
 */

import { Tile, BiomeType } from '../../../../types';
import { SpecialMapConfig, InteractionZone, RoomDefinition } from '../../../../types/specialMapTypes';
import { OverlayObjectType } from '../../../../types/core/tile';
import { ValueNoise } from '../../../../utils/noise';
import { registerCulturalGenerator } from '../../culturalGeneratorRegistry';
import { createRoom } from '../../types/roomHelpers';

/**
 * European Sacred Complex - Gothic Cathedral
 */
export function generateEuropeanSacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create cathedral nave
  for (let y = 2; y < size.height - 2; y++) {
    for (let x = 3; x < size.width - 3; x++) {
      if (y === 2 || y === size.height - 3 || x === 3 || x === size.width - 4) {
        // Stone cathedral walls
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].materialSubtype = 'gothic_stone';
      } else {
        // Stone floor with patterns
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
        tiles[y][x].materialSubtype = 'cathedral_stone';
      }
    }
  }
  
  // Chancel (altar area) - raised
  const altarWidth = Math.min(8, size.width - 8);
  const altarX = centerX - Math.floor(altarWidth / 2);
  const altarY = 3;
  
  for (let y = altarY; y < altarY + 4; y++) {
    for (let x = altarX; x < altarX + altarWidth; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      tiles[y][x].materialSubtype = 'altar_marble';
    }
  }
  
  // High altar
  tiles[altarY + 1][centerX].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    variant: 'gothic_altar'
  };
  
  // Gothic pillars supporting vaulted ceiling
  const pillarPositions = [
    [5, 7], [size.width - 6, 7],
    [5, 11], [size.width - 6, 11],
    [5, 15], [size.width - 6, 15]
  ];
  
  for (const [px, py] of pillarPositions) {
    if (px >= 0 && px < size.width && py >= 0 && py < size.height) {
      tiles[py][px].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'gothic_pillar'
      };
    }
  }
  
  // Wooden pews for congregation
  for (let row = 0; row < 4; row++) {
    const pewY = 9 + row * 2;
    if (pewY < size.height - 3) {
      // Left pews
      for (let x = 5; x < centerX - 1; x++) {
        tiles[pewY][x].overlayObject = {
          type: OverlayObjectType.BENCH_EAST_WEST,
          rotation: 0,
          variant: 'church_pew'
        };
      }
      
      // Right pews
      for (let x = centerX + 2; x < size.width - 5; x++) {
        tiles[pewY][x].overlayObject = {
          type: OverlayObjectType.BENCH_EAST_WEST,
          rotation: 0,
          variant: 'church_pew'
        };
      }
    }
  }
  
  // Pulpit
  tiles[8][centerX + 3].overlayObject = {
    type: OverlayObjectType.PODIUM,
    rotation: 0,
    variant: 'stone_pulpit'
  };
  
  // Baptismal font
  tiles[size.height - 5][5].overlayObject = {
    type: OverlayObjectType.BASIN,
    rotation: 0,
    variant: 'baptismal_font'
  };
  
  // Candelabras
  tiles[altarY + 1][centerX - 2].overlayObject = {
    type: OverlayObjectType.CANDELABRA,
    rotation: 0,
    variant: 'altar_candles'
  };
  tiles[altarY + 1][centerX + 2].overlayObject = {
    type: OverlayObjectType.CANDELABRA,
    rotation: 0,
    variant: 'altar_candles'
  };
  
  // Heraldic shields on walls
  tiles[3][5].overlayObject = {
    type: OverlayObjectType.EUROPEAN_HERALDIC_SHIELD,
    rotation: 0,
    variant: 'noble'
  };
  tiles[3][size.width - 6].overlayObject = {
    type: OverlayObjectType.EUROPEAN_HERALDIC_SHIELD,
    rotation: 0,
    variant: 'royal'
  };
  
  // Iron braziers for light and warmth
  tiles[8][4].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'iron_church'
  };
  tiles[8][size.width - 5].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'iron_church'
  };
  
  // West entrance (main door)
  tiles[size.height - 3][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 3][centerX].materialSubtype = 'cathedral_door';
  
  // Define rooms
  rooms.push(createRoom(
    'chancel',
    'Chancel',
    altarX,
    altarY,
    altarWidth,
    4,
    'sanctuary',
    'sparse'
  ));
  
  rooms.push(createRoom(
    'nave',
    'Nave',
    4,
    8,
    size.width - 8,
    size.height - 11,
    'sanctuary',
    'normal'
  ));
  
  // Interaction zones
  interactionZones.push({
    id: 'high_altar',
    location: [centerX, altarY + 1],
    label: 'High Altar',
    action: 'pray',
    description: 'The sacred altar of the cathedral'
  });
  
  interactionZones.push({
    id: 'baptismal_font',
    location: [5, size.height - 5],
    label: 'Baptismal Font',
    action: 'bless',
    description: 'Sacred font for baptisms'
  });
}

/**
 * European Government - Medieval Great Hall
 */
export function generateEuropeanGovernment(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create great hall layout
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      if (y === 1 || y === size.height - 2 || x === 1 || x === size.width - 2) {
        // Stone castle walls
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].materialSubtype = 'castle_stone';
      } else {
        // Flagstone floor with rushes
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
        tiles[y][x].materialSubtype = 'flagstone_rushes';
      }
    }
  }
  
  // Raised dais for lord's table
  const daisY = 3;
  for (let y = daisY; y < daisY + 2; y++) {
    for (let x = centerX - 4; x <= centerX + 4; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
      tiles[y][x].materialSubtype = 'oak_planks';
    }
  }
  
  // Lord's high table
  for (let x = centerX - 3; x <= centerX + 3; x++) {
    tiles[daisY][x].overlayObject = {
      type: OverlayObjectType.BANQUET_TABLE_TOP_CENTER,
      rotation: 0,
      variant: 'oak_high_table'
    };
  }
  
  // Lord's throne
  tiles[daisY + 1][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 0,
    variant: 'oak_throne'
  };
  
  // Noble chairs at high table
  const nobleSeats = [centerX - 2, centerX - 1, centerX + 1, centerX + 2];
  for (const seatX of nobleSeats) {
    tiles[daisY + 1][seatX].overlayObject = {
      type: OverlayObjectType.CHAIR,
      rotation: 0,
      variant: 'noble_chair'
    };
  }
  
  // Long tables for retainers and guests
  const tableRows = [8, 11, 14];
  for (const tableY of tableRows) {
    if (tableY < size.height - 3) {
      // Left table
      for (let x = 4; x < centerX - 1; x++) {
        tiles[tableY][x].overlayObject = {
          type: OverlayObjectType.TABLE_CENTER,
          rotation: 0,
          variant: 'trestle_table'
        };
        // Benches on both sides
        if (tableY - 1 >= 0) {
          tiles[tableY - 1][x].overlayObject = {
            type: OverlayObjectType.BENCH_EAST_WEST,
            rotation: 0,
            variant: 'wooden_bench'
          };
        }
        if (tableY + 1 < size.height) {
          tiles[tableY + 1][x].overlayObject = {
            type: OverlayObjectType.BENCH_EAST_WEST,
            rotation: 0,
            variant: 'wooden_bench'
          };
        }
      }
      
      // Right table
      for (let x = centerX + 2; x < size.width - 4; x++) {
        tiles[tableY][x].overlayObject = {
          type: OverlayObjectType.TABLE_CENTER,
          rotation: 0,
          variant: 'trestle_table'
        };
        // Benches on both sides
        if (tableY - 1 >= 0) {
          tiles[tableY - 1][x].overlayObject = {
            type: OverlayObjectType.BENCH_EAST_WEST,
            rotation: 0,
            variant: 'wooden_bench'
          };
        }
        if (tableY + 1 < size.height) {
          tiles[tableY + 1][x].overlayObject = {
            type: OverlayObjectType.BENCH_EAST_WEST,
            rotation: 0,
            variant: 'wooden_bench'
          };
        }
      }
    }
  }
  
  // Great fireplace for warmth and cooking
  const fireplaceY = 2;
  const fireplaceX = size.width - 3;
  tiles[fireplaceY + 1][fireplaceX - 1].overlayObject = {
    type: OverlayObjectType.FIREPLACE_STONE,
    rotation: 0,
    variant: 'great_hall'
  };
  
  // Weapons on walls
  tiles[2][3].overlayObject = {
    type: OverlayObjectType.WEAPON_RACK,
    rotation: 0,
    variant: 'medieval_weapons'
  };
  tiles[2][size.width - 4].overlayObject = {
    type: OverlayObjectType.WEAPON_RACK,
    rotation: 0,
    variant: 'medieval_shields'
  };
  
  // Tapestries for decoration and warmth
  tiles[2][centerX - 1].overlayObject = {
    type: OverlayObjectType.TAPESTRY,
    rotation: 0,
    variant: 'hunting_scene'
  };
  tiles[2][centerX + 1].overlayObject = {
    type: OverlayObjectType.TAPESTRY,
    rotation: 0,
    variant: 'coat_of_arms'
  };
  
  // Iron chandeliers
  tiles[6][centerX - 3].overlayObject = {
    type: OverlayObjectType.CHANDELIER_IRON,
    rotation: 0,
    variant: 'great_hall'
  };
  tiles[6][centerX + 3].overlayObject = {
    type: OverlayObjectType.CHANDELIER_IRON,
    rotation: 0,
    variant: 'great_hall'
  };
  
  // Storage chests along walls
  tiles[size.height - 3][3].overlayObject = {
    type: OverlayObjectType.CHEST_REINFORCED,
    rotation: 0,
    variant: 'iron_bound'
  };
  tiles[size.height - 3][size.width - 4].overlayObject = {
    type: OverlayObjectType.CHEST_REINFORCED,
    rotation: 0,
    variant: 'treasure_chest'
  };
  
  // Main entrance
  tiles[size.height - 2][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 2][centerX].materialSubtype = 'great_hall_door';
  
  // Define rooms
  rooms.push(createRoom(
    'high_table',
    'High Table',
    centerX - 4,
    daisY,
    8,
    2,
    'throne_room',
    'sparse'
  ));
  
  rooms.push(createRoom(
    'great_hall',
    'Great Hall',
    2,
    6,
    size.width - 4,
    size.height - 8,
    'administrative',
    'normal'
  ));
  
  // Interaction zones
  interactionZones.push({
    id: 'lords_throne',
    location: [centerX, daisY + 1],
    label: 'Lord\'s Throne',
    action: 'audience',
    description: 'The seat of the lord of the hall'
  });
  
  interactionZones.push({
    id: 'great_fireplace',
    location: [fireplaceX - 1, fireplaceY + 1],
    label: 'Great Fireplace',
    action: 'warm',
    description: 'The massive fireplace that warms the hall'
  });
}

/**
 * European Market - Medieval Market Square
 */
export function generateEuropeanMarket(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Cobblestone square
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
      tiles[y][x].materialSubtype = 'cobblestone';
    }
  }
  
  // Guild hall or market hall on one side
  for (let y = 1; y < 6; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      if (y === 1 || y === 5 || x === 1 || x === size.width - 2) {
        tiles[y][x].biome = BiomeType.WALL_LOW;
        tiles[y][x].materialSubtype = 'timber_frame';
      } else {
        tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        tiles[y][x].materialSubtype = 'oak_floor';
      }
    }
  }
  
  // Market stalls around the square
  const stallPositions = [
    // Top row
    [3, 7, 'bread'], [6, 7, 'cloth'], [9, 7, 'tools'], [12, 7, 'pottery'],
    // Bottom row
    [3, size.height - 4, 'meat'], [6, size.height - 4, 'vegetables'],
    [9, size.height - 4, 'leather'], [12, size.height - 4, 'metalwork'],
    // Left side
    [2, 10, 'herbs'], [2, 13, 'candles'],
    // Right side
    [size.width - 3, 10, 'ale'], [size.width - 3, 13, 'wool']
  ];
  
  for (const [x, y, goods] of stallPositions) {
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      // Market stall
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.STALL,
        rotation: 0,
        variant: 'wooden_stall'
      };
      
      // Goods display
      if (y + 1 < size.height) {
        tiles[y + 1][x].overlayObject = {
          type: OverlayObjectType.BARREL,
          rotation: 0,
          variant: goods
        };
      }
    }
  }
  
  // Central well or cross
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.WELL,
    rotation: 0,
    variant: 'town_well'
  };
  
  // Pillory for public punishment
  tiles[centerY - 2][centerX + 3].overlayObject = {
    type: OverlayObjectType.STATUE,
    rotation: 0,
    variant: 'pillory'
  };
  
  // Merchant scales
  tiles[8][centerX - 2].overlayObject = {
    type: OverlayObjectType.SCALE,
    rotation: 0,
    variant: 'merchant_scales'
  };
  tiles[8][centerX + 2].overlayObject = {
    type: OverlayObjectType.SCALE,
    rotation: 0,
    variant: 'merchant_scales'
  };
  
  // Ale benches
  tiles[centerY + 3][4].overlayObject = {
    type: OverlayObjectType.BENCH,
    rotation: 0,
    variant: 'drinking_bench'
  };
  tiles[centerY + 3][size.width - 5].overlayObject = {
    type: OverlayObjectType.BENCH,
    rotation: 0,
    variant: 'drinking_bench'
  };
  
  // Define rooms
  rooms.push(createRoom(
    'guild_hall',
    'Guild Hall',
    2,
    2,
    size.width - 4,
    3,
    'administrative',
    'sparse'
  ));
  
  rooms.push(createRoom(
    'market_square',
    'Market Square',
    1,
    6,
    size.width - 2,
    size.height - 7,
    'market',
    'crowded'
  ));
  
  // Interaction zones for stalls
  let zoneIndex = 0;
  for (const [x, y, goods] of stallPositions) {
    interactionZones.push({
      id: `stall_${zoneIndex}`,
      location: [x, y],
      label: `${goods} Merchant`,
      action: 'trade',
      description: `A stall selling ${goods}`
    });
    zoneIndex++;
  }
  
  interactionZones.push({
    id: 'town_well',
    location: [centerX, centerY],
    label: 'Town Well',
    action: 'draw_water',
    description: 'The central well of the market square'
  });
  
  interactionZones.push({
    id: 'guild_hall',
    location: [centerX, 3],
    label: 'Guild Hall',
    action: 'enter',
    description: 'The hall where merchants conduct official business'
  });
}

/**
 * Register all European cultural generators
 */
export function registerEuropeanGenerators(): void {
  // Sacred complexes
  registerCulturalGenerator('SACRED_COMPLEX', 'EUROPEAN', generateEuropeanSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'MEDIEVAL', generateEuropeanSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'GOTHIC', generateEuropeanSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'CHRISTIAN', generateEuropeanSacred);
  
  // Government buildings
  registerCulturalGenerator('GOVERNMENT_FORUM', 'EUROPEAN', generateEuropeanGovernment);
  registerCulturalGenerator('GOVERNMENT_FORUM', 'MEDIEVAL', generateEuropeanGovernment);
  registerCulturalGenerator('GOVERNMENT_FORUM', 'FEUDAL', generateEuropeanGovernment);
  
  // Markets
  registerCulturalGenerator('MARKET_BAZAAR', 'EUROPEAN', generateEuropeanMarket);
  registerCulturalGenerator('MARKET_BAZAAR', 'MEDIEVAL', generateEuropeanMarket);
  registerCulturalGenerator('MARKET_BAZAAR', 'GUILD', generateEuropeanMarket);
  
}

// Auto-register when imported
registerEuropeanGenerators();