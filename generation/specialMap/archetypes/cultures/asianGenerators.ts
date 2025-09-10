/**
 * generation/specialMap/archetypes/cultures/asianGenerators.ts
 * Cultural generators for East Asian and South Asian special maps
 * Includes Chinese, Japanese, Korean, and Indian architectural styles
 */

import { Tile, BiomeType } from '../../../../types';
import { SpecialMapConfig, InteractionZone, RoomDefinition } from '../../../../types/specialMapTypes';
import { OverlayObjectType } from '../../../../types/core/tile';
import { ValueNoise } from '../../../../utils/noise';
import { registerCulturalGenerator } from '../../culturalGeneratorRegistry';
import { createRoom } from '../../types/roomHelpers';

/**
 * Chinese Sacred Complex - Pagoda/Temple with courtyards
 */
export function generateChineseSacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create outer courtyard walls
  for (let y = 2; y < size.height - 2; y++) {
    for (let x = 2; x < size.width - 2; x++) {
      if (y === 2 || y === size.height - 3 || x === 2 || x === size.width - 3) {
        // Red walls with tile roofs
        tiles[y][x].biome = BiomeType.WALL_LOW;
        tiles[y][x].materialSubtype = 'red_brick';
      } else {
        // Stone courtyard floor
        tiles[y][x].biome = BiomeType.FLOOR_STONE;
        tiles[y][x].materialSubtype = 'grey_stone';
      }
    }
  }
  
  // Main temple building in center
  const templeWidth = Math.min(12, size.width - 8);
  const templeHeight = Math.min(8, size.height - 8);
  const templeX = centerX - Math.floor(templeWidth / 2);
  const templeY = centerY - Math.floor(templeHeight / 2);
  
  for (let y = templeY; y < templeY + templeHeight; y++) {
    for (let x = templeX; x < templeX + templeWidth; x++) {
      if (y === templeY || y === templeY + templeHeight - 1 || 
          x === templeX || x === templeX + templeWidth - 1) {
        // Temple walls
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].materialSubtype = 'lacquered_wood';
      } else {
        // Temple floor - wooden
        tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        tiles[y][x].materialSubtype = 'polished_wood';
      }
    }
  }
  
  // Central altar
  tiles[centerY][centerX].biome = BiomeType.FLOOR_WOOD;
  tiles[centerY][centerX].overlayObject = {
    type: OverlayObjectType.ALTAR,
    rotation: 0,
    variant: 'buddhist'
  };
  
  // Incense burners
  tiles[centerY][centerX - 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    variant: 'bronze'
  };
  tiles[centerY][centerX + 2].overlayObject = {
    type: OverlayObjectType.INCENSE_BURNER,
    rotation: 0,
    variant: 'bronze'
  };
  
  // Decorative scrolls on walls
  if (templeY - 1 >= 0) {
    tiles[templeY + 1][centerX].overlayObject = {
      type: OverlayObjectType.EAST_ASIAN_DECORATIVE_SCROLL,
      rotation: 0,
      variant: 'calligraphy'
    };
  }
  
  // Paper lanterns
  tiles[templeY + 1][templeX + 1].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    variant: 'paper_red'
  };
  tiles[templeY + 1][templeX + templeWidth - 2].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    variant: 'paper_red'
  };
  
  // Entrance (moon gate style)
  tiles[size.height - 3][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 3][centerX].materialSubtype = 'moon_gate';
  
  // Side entrances to temple
  tiles[centerY][templeX].biome = BiomeType.DOOR;
  tiles[centerY][templeX + templeWidth - 1].biome = BiomeType.DOOR;
  
  // Meditation cushions
  for (let i = -2; i <= 2; i++) {
    if (i !== 0 && centerY + 2 < size.height && centerX + i * 2 >= 0 && centerX + i * 2 < size.width) {
      tiles[centerY + 2][centerX + i * 2].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: 0,
        variant: 'meditation'
      };
    }
  }
  
  // Add rooms for NPC spawning
  rooms.push(createRoom(
    'inner_sanctum',
    'Inner Sanctum',
    templeX + 1,
    templeY + 1,
    templeWidth - 2,
    templeHeight - 2,
    'sanctuary',
    'sparse'
  ));
  
  rooms.push(createRoom(
    'courtyard',
    'Temple Courtyard',
    3,
    3,
    size.width - 6,
    size.height - 6,
    'courtyard',
    'normal'
  ));
  
  // Interaction zones
  interactionZones.push({
    id: 'main_altar',
    location: [centerX, centerY],
    label: 'Buddhist Altar',
    action: 'pray',
    description: 'An ornate altar with offerings and incense'
  });
}

/**
 * Japanese Sacred Complex - Shinto Shrine with torii gates
 */
export function generateJapaneseSacred(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create gravel/sand garden paths
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      // Default to gravel
      tiles[y][x].biome = BiomeType.FLOOR_STONE;
      tiles[y][x].materialSubtype = 'gravel';
    }
  }
  
  // Main shrine building (smaller, raised)
  const shrineWidth = Math.min(10, size.width - 10);
  const shrineHeight = Math.min(6, size.height - 10);
  const shrineX = centerX - Math.floor(shrineWidth / 2);
  const shrineY = centerY - Math.floor(shrineHeight / 2) - 2;
  
  // Raised platform
  for (let y = shrineY - 1; y < shrineY + shrineHeight + 1; y++) {
    for (let x = shrineX - 1; x < shrineX + shrineWidth + 1; x++) {
      if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
        tiles[y][x].biome = BiomeType.FLOOR_WOOD;
        tiles[y][x].materialSubtype = 'tatami';
      }
    }
  }
  
  // Shrine walls
  for (let y = shrineY; y < shrineY + shrineHeight; y++) {
    for (let x = shrineX; x < shrineX + shrineWidth; x++) {
      if (y === shrineY || y === shrineY + shrineHeight - 1 || 
          x === shrineX || x === shrineX + shrineWidth - 1) {
        tiles[y][x].biome = BiomeType.WALL_LOW;
        tiles[y][x].materialSubtype = 'shoji_screen';
      }
    }
  }
  
  // Inner shrine
  tiles[shrineY + 2][centerX].biome = BiomeType.FLOOR_WOOD;
  tiles[shrineY + 2][centerX].overlayObject = {
    type: OverlayObjectType.SHRINE,
    rotation: 0,
    variant: 'shinto'
  };
  
  // Offering table
  tiles[shrineY + 3][centerX].overlayObject = {
    type: OverlayObjectType.OFFERING_TABLE,
    rotation: 0,
    variant: 'japanese'
  };
  
  // Bell (suzu)
  tiles[shrineY + 4][centerX].overlayObject = {
    type: OverlayObjectType.BELL,
    rotation: 0,
    variant: 'shinto_suzu'
  };
  
  // Torii gate at entrance
  for (let x = centerX - 3; x <= centerX + 3; x++) {
    if (x === centerX - 3 || x === centerX + 3) {
      // Torii pillars
      tiles[size.height - 4][x].biome = BiomeType.WALL_LOW;
      tiles[size.height - 4][x].materialSubtype = 'vermillion_pillar';
      tiles[size.height - 5][x].biome = BiomeType.WALL_LOW;
      tiles[size.height - 5][x].materialSubtype = 'vermillion_pillar';
    }
  }
  
  // Stone lanterns
  tiles[shrineY + shrineHeight + 2][shrineX - 2].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    variant: 'stone'
  };
  tiles[shrineY + shrineHeight + 2][shrineX + shrineWidth + 1].overlayObject = {
    type: OverlayObjectType.LANTERN,
    rotation: 0,
    variant: 'stone'
  };
  
  // Purification basin
  tiles[size.height - 6][centerX - 4].overlayObject = {
    type: OverlayObjectType.BASIN,
    rotation: 0,
    variant: 'purification'
  };
  
  // Define rooms
  rooms.push(createRoom(
    'main_shrine',
    'Main Shrine',
    shrineX,
    shrineY,
    shrineWidth,
    shrineHeight,
    'sanctuary',
    'sparse'
  ));
  
  rooms.push(createRoom(
    'shrine_grounds',
    'Shrine Grounds',
    0,
    0,
    size.width,
    size.height,
    'courtyard',
    'sparse'
  ));
  
  // Interaction zones
  interactionZones.push({
    id: 'shrine_bell',
    location: [centerX, shrineY + 4],
    label: 'Ring Bell',
    action: 'interact',
    description: 'Ring the bell to alert the kami of your presence'
  });
  
  interactionZones.push({
    id: 'purification_basin',
    location: [centerX - 4, size.height - 6],
    label: 'Purification Basin',
    action: 'cleanse',
    description: 'Cleanse yourself before approaching the shrine'
  });
}

/**
 * Chinese Government Forum - Imperial court style
 */
export function generateChineseGovernment(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Create throne hall layout
  for (let y = 1; y < size.height - 1; y++) {
    for (let x = 1; x < size.width - 1; x++) {
      if (y === 1 || y === size.height - 2 || x === 1 || x === size.width - 2) {
        // Palace walls with decorative elements
        tiles[y][x].biome = BiomeType.WALL;
        tiles[y][x].materialSubtype = 'imperial_red';
      } else {
        // Polished floor
        tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
        tiles[y][x].materialSubtype = 'jade_green';
      }
    }
  }
  
  // Raised throne platform
  const throneY = 3;
  for (let y = throneY; y < throneY + 3; y++) {
    for (let x = centerX - 2; x <= centerX + 2; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_MARBLE;
      tiles[y][x].materialSubtype = 'gold_inlay';
    }
  }
  
  // Dragon throne
  tiles[throneY + 1][centerX].overlayObject = {
    type: OverlayObjectType.THRONE,
    rotation: 0,
    variant: 'dragon_throne'
  };
  
  // Pillars with dragon motifs
  const pillarPositions = [
    [4, 6], [size.width - 5, 6],
    [4, size.height - 7], [size.width - 5, size.height - 7]
  ];
  
  for (const [px, py] of pillarPositions) {
    if (px >= 0 && px < size.width && py >= 0 && py < size.height) {
      tiles[py][px].overlayObject = {
        type: OverlayObjectType.PILLAR,
        rotation: 0,
        variant: 'dragon_carved'
      };
    }
  }
  
  // Official desks on sides
  for (let i = 0; i < 3; i++) {
    const leftX = 3;
    const rightX = size.width - 4;
    const deskY = 8 + i * 3;
    
    if (deskY < size.height - 2) {
      // Left side desks
      tiles[deskY][leftX].overlayObject = {
        type: OverlayObjectType.DESK_FACING_EAST,
        rotation: 0,
        variant: 'scholar'
      };
      tiles[deskY][leftX + 1].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 90,
        variant: 'official'
      };
      
      // Right side desks
      tiles[deskY][rightX].overlayObject = {
        type: OverlayObjectType.DESK_FACING_WEST,
        rotation: 0,
        variant: 'scholar'
      };
      tiles[deskY][rightX - 1].overlayObject = {
        type: OverlayObjectType.CHAIR,
        rotation: 270,
        variant: 'official'
      };
    }
  }
  
  // Decorative scrolls
  tiles[2][centerX - 3].overlayObject = {
    type: OverlayObjectType.EAST_ASIAN_DECORATIVE_SCROLL,
    rotation: 0,
    variant: 'imperial_edict'
  };
  tiles[2][centerX + 3].overlayObject = {
    type: OverlayObjectType.EAST_ASIAN_DECORATIVE_SCROLL,
    rotation: 0,
    variant: 'imperial_edict'
  };
  
  // Main entrance
  tiles[size.height - 2][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 2][centerX].materialSubtype = 'imperial_gate';
  
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
    'officials_area',
    'Officials Area',
    2,
    8,
    size.width - 4,
    size.height - 10,
    'administrative',
    'normal'
  ));
  
  // Interaction zones
  interactionZones.push({
    id: 'dragon_throne',
    location: [centerX, throneY + 1],
    label: 'Imperial Throne',
    action: 'audience',
    description: 'The Dragon Throne of the Emperor'
  });
}

/**
 * Japanese Government - Shogunate/Daimyo court
 */
export function generateJapaneseGovernment(
  tiles: Tile[][],
  size: { width: number, height: number },
  config: SpecialMapConfig,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  noise: ValueNoise
): void {
  const centerX = Math.floor(size.width / 2);
  const centerY = Math.floor(size.height / 2);
  
  // Tatami mat flooring throughout
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
      tiles[y][x].materialSubtype = 'tatami';
    }
  }
  
  // Shoji screen walls
  for (let y = 2; y < size.height - 2; y++) {
    for (let x = 2; x < size.width - 2; x++) {
      if (y === 2 || y === size.height - 3 || x === 2 || x === size.width - 3) {
        tiles[y][x].biome = BiomeType.WALL_LOW;
        tiles[y][x].materialSubtype = 'shoji_screen';
      }
    }
  }
  
  // Raised platform for lord
  const platformY = 4;
  for (let y = platformY; y < platformY + 2; y++) {
    for (let x = centerX - 3; x <= centerX + 3; x++) {
      tiles[y][x].biome = BiomeType.FLOOR_WOOD;
      tiles[y][x].materialSubtype = 'polished_cedar';
    }
  }
  
  // Lord's seat (zabuton cushion)
  tiles[platformY][centerX].overlayObject = {
    type: OverlayObjectType.CUSHION,
    rotation: 0,
    variant: 'daimyo'
  };
  
  // Weapon racks on walls
  tiles[3][3].overlayObject = {
    type: OverlayObjectType.WEAPON_RACK,
    rotation: 0,
    variant: 'katana_stand'
  };
  tiles[3][size.width - 4].overlayObject = {
    type: OverlayObjectType.WEAPON_RACK,
    rotation: 0,
    variant: 'katana_stand'
  };
  
  // Seating cushions for retainers
  const cushionPositions = [
    [centerX - 4, centerY], [centerX - 2, centerY],
    [centerX + 2, centerY], [centerX + 4, centerY],
    [centerX - 4, centerY + 2], [centerX - 2, centerY + 2],
    [centerX + 2, centerY + 2], [centerX + 4, centerY + 2]
  ];
  
  for (const [cx, cy] of cushionPositions) {
    if (cx >= 0 && cx < size.width && cy >= 0 && cy < size.height) {
      tiles[cy][cx].overlayObject = {
        type: OverlayObjectType.CUSHION,
        rotation: 0,
        variant: 'zabuton'
      };
    }
  }
  
  // Decorative scroll
  tiles[3][centerX].overlayObject = {
    type: OverlayObjectType.EAST_ASIAN_DECORATIVE_SCROLL,
    rotation: 0,
    variant: 'bushido'
  };
  
  // Sliding door entrance
  tiles[size.height - 3][centerX].biome = BiomeType.DOOR;
  tiles[size.height - 3][centerX].materialSubtype = 'sliding_door';
  
  // Define rooms
  rooms.push(createRoom(
    'audience_hall',
    'Audience Hall',
    3,
    3,
    size.width - 6,
    size.height - 6,
    'throne_room',
    'normal'
  ));
  
  // Interaction zones
  interactionZones.push({
    id: 'daimyo_seat',
    location: [centerX, platformY],
    label: 'Daimyo Seat',
    action: 'audience',
    description: 'The seat of the local lord'
  });
}

/**
 * Register all Asian cultural generators
 */
export function registerAsianGenerators(): void {
  // Sacred complexes
  registerCulturalGenerator('SACRED_COMPLEX', 'CHINESE', generateChineseSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'EAST_ASIAN', generateChineseSacred);
  registerCulturalGenerator('SACRED_COMPLEX', 'JAPANESE', generateJapaneseSacred);
  
  // Government buildings
  registerCulturalGenerator('GOVERNMENT_FORUM', 'CHINESE', generateChineseGovernment);
  registerCulturalGenerator('GOVERNMENT_FORUM', 'EAST_ASIAN', generateChineseGovernment);
  registerCulturalGenerator('GOVERNMENT_FORUM', 'JAPANESE', generateJapaneseGovernment);
  
  // Also register for TRIBAL_COUNCIL as these can be community meetings
  registerCulturalGenerator('TRIBAL_COUNCIL', 'CHINESE', generateChineseGovernment);
  registerCulturalGenerator('TRIBAL_COUNCIL', 'JAPANESE', generateJapaneseGovernment);
  
  console.log('[AsianGenerators] Registered all Asian cultural generators');
}

// Auto-register when imported
registerAsianGenerators();