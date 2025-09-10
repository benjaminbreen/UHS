/**
 * generation/specialMap/archetypes/cultures/middleEasternGenerators.ts
 * Cultural generators for Middle Eastern and North African (MENA) special maps
 * Includes Islamic, Arabic, Persian, and Ottoman architectural styles
 */

import { Tile, BiomeType } from '../../../../types';
import { SpecialMapConfig, InteractionZone, RoomDefinition } from '../../../../types/specialMapTypes';
import { OverlayObjectType } from '../../../../types/core/tile';
import { ValueNoise } from '../../../../utils/noise';
import { registerCulturalGenerator } from '../../culturalGeneratorRegistry';
import { createRoom } from '../../types/roomHelpers';

/**
 * Islamic Sacred Complex - Mosque with minaret and courtyard
 */
export function generateIslamicSacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create outer courtyard (sahn)
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      if (y === 1 || y === size.height - 2 || x === 1 || x === size.width - 2) {
        // Courtyard walls with geometric patterns
        tiles[y][x].biome = BiomeType.WALL_LOW;
        tiles[y][x].materialSubtype = 'geometric_stone';
      } else {
        // Marble courtyard floor
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
        tiles[y][x].materialSubtype = 'white_marble';
      }
    }
  }
  
  // Main prayer hall (musalla)
  const hallWidth = Math.min(14, size.width - 6);
  const hallHeight = Math.min(8, size.height - 8);
  const hallX = centerX - Math.floor(hallWidth / 2);
  const hallY = 3;
  
  for (let y = hallY; y < hallY + hallHeight; y++) {
    for (let x = hallX; x < hallX + hallWidth; x++) {
      if (y === hallY || y === hallY + hallHeight - 1 ||
          x === hallX || x === hallX + hallWidth - 1) {
        // Prayer hall walls
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].materialSubtype = 'decorated_stone';
      } else {
        // Carpeted prayer floor
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
        tiles[y][x].materialSubtype = 'prayer_carpet';
      }
    }
  }
  
  // Mihrab (prayer niche) pointing toward Mecca
  const mihrabY = hallY + 1;
  tiles[mihrabY][centerX].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    variant: 'mihrab'
  };
  
  // Minbar (pulpit) next to mihrab
  tiles[mihrabY][centerX + 2].overlayObject = {
    type: OverlayObjectType.PODIUM,
    rotation: 0,
    variant: 'minbar'
  };
  
  // Decorative tile panels
  tiles[hallY + 1][hallX + 1].overlayObject = {
    type: OverlayObjectType.MENA_DECORATIVE_TILE_PANEL,
    rotation: 0,
    variant: 'geometric'
  };
  tiles[hallY + 1][hallX + hallWidth - 2].overlayObject = {
    type: OverlayObjectType.MENA_DECORATIVE_TILE_PANEL,
    rotation: 0,
    variant: 'calligraphy'
  };
  
  // Pillars supporting the hall
  const pillarPositions = [
    [hallX + 3, hallY + 3], [hallX + hallWidth - 4, hallY + 3],
    [hallX + 3, hallY + 5], [hallX + hallWidth - 4, hallY + 5]
  ];
  
  for (const [px, py] of pillarPositions) {
    if (px >= 0 && px < size.width && py >= 0 && py < size.height) {
      tiles[py][px].overlayObject = {
        type: OverlayObjectType.PILLAR,
        rotation: 0,
        variant: 'islamic_column'
      };
    }
  }
  
  // Central fountain in courtyard
  tiles[centerY + 2][centerX].overlayObject = {
    type: OverlayObjectType.FOUNTAIN,
    rotation: 0,
    variant: 'courtyard_fountain'
  };
  
  // Ablution basins (wudu)
  const ablutionY = centerY + 4;
  for (let i = -2; i <= 2; i++) {
    if (i !== 0 && centerX + i * 2 >= 0 && centerX + i * 2 < size.width) {
      tiles[ablutionY][centerX + i * 2].overlayObject = {
        type: OverlayObjectType.BASIN,
        rotation: 0,
        variant: 'ablution'
      };
    }
  }
  
  // Prayer rugs for worshippers
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const rugX = hallX + 2 + col * 2;
      const rugY = hallY + 3 + row * 1.5;
      
      if (rugX < hallX + hallWidth - 1 && rugY < hallY + hallHeight - 1) {
        tiles[Math.floor(rugY)][rugX].overlayObject = {
          type: OverlayObjectType.PRAYER_MAT,
          rotation: 0,
          variant: 'individual'
        };
      }
    }
  }
  
  // Hanging lamps
  tiles[hallY + 2][centerX - 3].overlayObject = {
    type: OverlayObjectType.HANGING_LANTERN,
    rotation: 0,
    variant: 'mosque_lamp'
  };
  tiles[hallY + 2][centerX + 3].overlayObject = {
    type: OverlayObjectType.HANGING_LANTERN,
    rotation: 0,
    variant: 'mosque_lamp'
  };
  
  // Main entrance
  tiles[size.height - 2][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 2][centerX].materialSubtype = 'arched_entrance';
  
  // Prayer hall entrance
  tiles[hallY + hallHeight - 1][centerX].biome = BiomeType.DOOR;
  
  // Define rooms
  rooms.push(createRoom(
    'prayer_hall',
    'Prayer Hall',
    hallX + 1,
    hallY + 1,
    hallWidth - 2,
    hallHeight - 2,
    'sanctuary',
    'normal'
  ));
  
  rooms.push(createRoom(
    'courtyard',
    'Mosque Courtyard',
    2,
    hallY + hallHeight,
    size.width - 4,
    size.height - (hallY + hallHeight) - 2,
    'courtyard',
    'sparse'
  ));
  
  // Interaction zones
  interactionZones.push({
    id: 'mihrab',
    location: [centerX, mihrabY],
    label: 'Mihrab',
    action: 'pray',
    description: 'The niche indicating the direction of Mecca'
  });
  
  interactionZones.push({
    id: 'ablution_fountain',
    location: [centerX, centerY + 2],
    label: 'Ablution Fountain',
    action: 'cleanse',
    description: 'Fountain for ritual washing before prayer'
  });
}

/**
 * Middle Eastern Government - Divan/Palace audience hall
 */
export function generateMiddleEasternGovernment(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create palace hall layout
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      if (y === 1 || y === size.height - 2 || x === 1 || x === size.width - 2) {
        // Ornate walls
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].materialSubtype = 'mosaic_walls';
      } else {
        // Rich carpeted floor
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
        tiles[y][x].materialSubtype = 'persian_carpet';
      }
    }
  }
  
  // Raised throne platform (dais)
  const throneY = 3;
  for (let y = throneY; y < throneY + 3; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      tiles[y][x].materialSubtype = 'gold_inlay';
    }
  }
  
  // Sultan's/Caliph's throne
  tiles[throneY + 1][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 0,
    variant: 'ottoman_throne'
  };
  
  // Decorative screens (mashrabiya)
  tiles[2][3].overlayObject = {
    type: OverlayObjectType.CABINET,
    rotation: 0,
    variant: 'mashrabiya_screen'
  };
  tiles[2][size.width - 4].overlayObject = {
    type: OverlayObjectType.CABINET,
    rotation: 0,
    variant: 'mashrabiya_screen'
  };
  
  // Ornate pillars
  const pillarPositions = [
    [5, 5], [size.width - 6, 5],
    [5, size.height - 6], [size.width - 6, size.height - 6]
  ];
  
  for (const [px, py] of pillarPositions) {
    if (px >= 0 && px < size.width && py >= 0 && py < size.height) {
      tiles[py][px].overlayObject = {
        type: OverlayObjectType.COLUMN,
        rotation: 0,
        variant: 'persian_column'
      };
    }
  }
  
  // Courtiers' seating areas (divans)
  const divanPositions = [
    [3, centerY], [3, centerY + 2],
    [size.width - 4, centerY], [size.width - 4, centerY + 2]
  ];
  
  for (const [dx, dy] of divanPositions) {
    if (dx >= 0 && dx < size.width && dy >= 0 && dy < size.height) {
      tiles[dy][dx].overlayObject = {
        type: OverlayObjectType.BENCH,
        rotation: 0,
        variant: 'divan_couch'
      };
    }
  }
  
  // Water feature/fountain
  tiles[centerY + 4][centerX].overlayObject = {
    type: OverlayObjectType.FOUNTAIN,
    rotation: 0,
    variant: 'palace_fountain'
  };
  
  // Incense burners
  tiles[throneY + 1][centerX - 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    variant: 'palace_incense'
  };
  tiles[throneY + 1][centerX + 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    variant: 'palace_incense'
  };
  
  // Decorative tile panels with calligraphy
  tiles[2][centerX - 2].overlayObject = {
    type: OverlayObjectType.MENA_DECORATIVE_TILE_PANEL,
    rotation: 0,
    variant: 'royal_calligraphy'
  };
  tiles[2][centerX + 2].overlayObject = {
    type: OverlayObjectType.MENA_DECORATIVE_TILE_PANEL,
    rotation: 0,
    variant: 'geometric_royal'
  };
  
  // Braziers for warmth and light
  tiles[6][3].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'palace_brazier'
  };
  tiles[6][size.width - 4].overlayObject = {
    type: OverlayObjectType.BRAZIER,
    rotation: 0,
    variant: 'palace_brazier'
  };
  
  // Main entrance with arched doorway
  tiles[size.height - 2][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 2][centerX].materialSubtype = 'horseshoe_arch';
  
  // Define rooms
  rooms.push(createRoom(
    'throne_room',
    'Throne Room',
    2,
    2,
    size.width - 4,
    8,
    'throne_room',
    'sparse'
  ));
  
  rooms.push(createRoom(
    'audience_hall',
    'Audience Hall',
    2,
    8,
    size.width - 4,
    size.height - 10,
    'administrative',
    'normal'
  ));
  
  // Interaction zones
  interactionZones.push({
    id: 'sultans_throne',
    location: [centerX, throneY + 1],
    label: 'Royal Throne',
    action: 'audience',
    description: 'The ornate throne of the ruler'
  });
  
  interactionZones.push({
    id: 'palace_fountain',
    location: [centerX, centerY + 4],
    label: 'Palace Fountain',
    action: 'admire',
    description: 'An elegant fountain with geometric patterns'
  });
}

/**
 * Middle Eastern Market - Traditional bazaar with covered stalls
 */
export function generateMiddleEasternMarket(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Stone floor throughout
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
      tiles[y][x].materialSubtype = 'bazaar_stones';
    }
  }
  
  // Create covered walkways with pillars
  for (let x = 4; x < size.width - 4; x += 6) {
    for (let y = 2; y < size.height - 2; y += 8) {
      if (x < size.width && y < size.height) {
        tiles[y][x].overlayObject = {
          type: OverlayObjectType.PILLAR,
          rotation: 0,
          variant: 'bazaar_pillar'
        };
      }
    }
  }
  
  // Merchant stalls along the sides
  const stallPositions = [
    // Left side stalls
    [2, 4, 'spices'], [2, 7, 'textiles'], [2, 10, 'jewelry'],
    [2, 13, 'carpets'], [2, 16, 'pottery'],
    // Right side stalls  
    [size.width - 3, 4, 'weapons'], [size.width - 3, 7, 'leather'],
    [size.width - 3, 10, 'books'], [size.width - 3, 13, 'perfumes'],
    [size.width - 3, 16, 'brass']
  ];
  
  for (const [x, y, goods] of stallPositions) {
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      // Stall counter
      tiles[y][x].overlayObject = {
        type: OverlayObjectType.STALL,
        rotation: 0,
        variant: 'bazaar_stall'
      };
      
      // Display goods
      if (y + 1 < size.height) {
        tiles[y + 1][x].overlayObject = {
          type: OverlayObjectType.DISPLAY_CASE,
          rotation: 0,
          variant: goods
        };
      }
      
      // Merchant's seat
      if (x === 2 && x + 1 < size.width) {
        tiles[y][x + 1].overlayObject = {
          type: OverlayObjectType.CUSHION,
          rotation: 0,
          variant: 'merchant_seat'
        };
      } else if (x === size.width - 3 && x - 1 >= 0) {
        tiles[y][x - 1].overlayObject = {
          type: OverlayObjectType.CUSHION,
          rotation: 0,
          variant: 'merchant_seat'
        };
      }
    }
  }
  
  // Central tea area
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.TABLE_ROUND_SMALL,
    rotation: 0,
    variant: 'tea_table'
  };
  
  // Cushions around tea table
  const teaCushions = [
    [centerX - 1, centerY - 1], [centerX + 1, centerY - 1],
    [centerX - 1, centerY + 1], [centerX + 1, centerY + 1]
  ];
  
  for (const [cx, cy] of teaCushions) {
    if (cx >= 0 && cx < size.width && cy >= 0 && cy < size.height) {
      tiles[cy][cx].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: 0,
        variant: 'floor_cushion'
      };
    }
  }
  
  // Hanging lamps for atmosphere
  tiles[3][centerX - 4].overlayObject = {
    type: OverlayObjectType.HANGING_LANTERN,
    rotation: 0,
    variant: 'bazaar_lamp'
  };
  tiles[3][centerX + 4].overlayObject = {
    type: OverlayObjectType.HANGING_LANTERN,
    rotation: 0,
    variant: 'bazaar_lamp'
  };
  
  // Water carrier's station
  tiles[centerY + 4][centerX].overlayObject = {
    type: OverlayObjectType.BARREL,
    rotation: 0,
    variant: 'water_jars'
  };
  
  // Define rooms
  rooms.push(createRoom(
    'main_bazaar',
    'Main Bazaar',
    1,
    1,
    size.width - 2,
    size.height - 2,
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
      description: `A merchant selling ${goods}`
    });
    zoneIndex++;
  }
  
  interactionZones.push({
    id: 'tea_area',
    location: [centerX, centerY],
    label: 'Tea Corner',
    action: 'rest',
    description: 'A place to rest and drink tea'
  });
  
  interactionZones.push({
    id: 'water_station',
    location: [centerX, centerY + 4],
    label: 'Water Station',
    action: 'drink',
    description: 'Fresh water for travelers'
  });
}

/**
 * Register all Middle Eastern cultural generators
 */
export function registerMiddleEasternGenerators(): void {
  // Sacred complexes
  registerCulturalGenerator('SACRED_COMPLEX', 'MENA', generateIslamicSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'MIDDLE_EASTERN', generateIslamicSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'ISLAMIC', generateIslamicSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'ARAB', generateIslamicSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'PERSIAN', generateIslamicSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'OTTOMAN', generateIslamicSacred);
  
  // Government buildings
  registerCulturalGenerator('GOVERNMENT_FORUM', 'MENA', generateMiddleEasternGovernment);
  registerCulturalGenerator('GOVERNMENT_FORUM', 'MIDDLE_EASTERN', generateMiddleEasternGovernment);
  registerCulturalGenerator('GOVERNMENT_FORUM', 'ISLAMIC', generateMiddleEasternGovernment);
  registerCulturalGenerator('GOVERNMENT_FORUM', 'ARAB', generateMiddleEasternGovernment);
  registerCulturalGenerator('GOVERNMENT_FORUM', 'PERSIAN', generateMiddleEasternGovernment);
  registerCulturalGenerator('GOVERNMENT_FORUM', 'OTTOMAN', generateMiddleEasternGovernment);
  
  // Markets
  registerCulturalGenerator('MARKET_BAZAAR', 'MENA', generateMiddleEasternMarket);
  registerCulturalGenerator('MARKET_BAZAAR', 'MIDDLE_EASTERN', generateMiddleEasternMarket);
  registerCulturalGenerator('MARKET_BAZAAR', 'ISLAMIC', generateMiddleEasternMarket);
  registerCulturalGenerator('MARKET_BAZAAR', 'ARAB', generateMiddleEasternMarket);
  registerCulturalGenerator('MARKET_BAZAAR', 'PERSIAN', generateMiddleEasternMarket);
  registerCulturalGenerator('MARKET_BAZAAR', 'OTTOMAN', generateMiddleEasternMarket);
  
  console.log('[MiddleEasternGenerators] Registered all Middle Eastern cultural generators');
}

// Auto-register when imported
registerMiddleEasternGenerators();