/**
 * Workshop Archetype Generator - Small craftsman buildings with single shopkeeper
 * Supports smithies, pottery workshops, weaving shops, carpentry, etc.
 */

import { Tile, BiomeType, OverlayObjectType } from '../../../types';
import { SpecialMapConfig, InteractionZone, ExitZone, RoomDefinition } from '../../../types/specialMapTypes';
import { ValueNoise } from '../../../utils/noise';
import {
  placeDeskWithChair,
  placeBookshelfAgainstWall,
  placeBenchWithOrientation
} from '../directionalFurniturePlacement';
import {
  placeSmartTable,
  placeRoundTable
} from '../advancedFurnitureSystem';
import {
  lightRoom,
  placeFireplace,
  getCulturalLighting
} from '../advancedLightingSystem';
import {
  getCulturalStorage,
  placeContainerWithItems,
  placeChestWithItems,
  placeBarrelWithItems
} from '../storageUtilitySystem';

// Simple border for workshops - they're usually standalone buildings
const LANDSCAPE_BORDER_ROWS = {
  xs: 1,
  small: 1,
  medium: 2,
  large: 2,
  xl: 2,
  xxl: 2
};

export function generateWorkshop(
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
  const businessType = (config as any).businessType || 'smithy';
  const population = (config as any).population || 500;
  const wealthLevel = (config as any).wealthLevel || 'modest';
  const settlementType = (config as any).settlementType || 'town';

  console.log('[Workshop Generator] businessType:', businessType, 'era:', era, 'population:', population, 'wealthLevel:', wealthLevel);

  // Generate workshop interior based on business type, culture, and era
  createWorkshopInterior(tiles, buildingLeft, buildingTop, buildingWidth, buildingHeight, config, era, businessType, interactionZones, rooms, population, wealthLevel, settlementType);

  // Main entrance (always at bottom center)
  const entranceX = Math.floor((buildingLeft + buildingRight) / 2);
  const entranceY = buildingBottom - 1;

  tiles[entranceY][entranceX].biome = BiomeType.DOOR;
  tiles[entranceY][entranceX].isBlocking = false;

  exitZones.push({
    id: 'main_exit',
    location: [entranceX, entranceY],
    label: 'Exit Workshop',
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
}

/**
 * Create workshop interior based on business type, culture, era, and context
 */
function createWorkshopInterior(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  businessType: string,
  interactionZones: InteractionZone[],
  rooms: RoomDefinition[],
  population: number,
  wealthLevel: string,
  settlementType: string
): void {
  // Define the main workshop room
  const room: RoomDefinition = {
    id: 'main_workshop',
    bounds: {
      x: startX + 1,
      y: startY + 1,
      width: width - 2,
      height: height - 2
    },
    type: 'workshop',
    name: getWorkshopRoomName(businessType)
  };
  rooms.push(room);

  // Place workshop-specific furniture and tools with era considerations
  if (businessType.includes('smith') || businessType.includes('forge')) {
    createSmithyWorkshop(tiles, startX, startY, width, height, config, era, interactionZones, population, wealthLevel);
  } else if (businessType.includes('potter') || businessType.includes('ceramic')) {
    createPotteryWorkshop(tiles, startX, startY, width, height, config, era, interactionZones, population, wealthLevel);
  } else if (businessType.includes('weav') || businessType.includes('textile')) {
    createWeavingWorkshop(tiles, startX, startY, width, height, config, era, interactionZones, population, wealthLevel);
  } else if (businessType.includes('baker') || businessType.includes('mill')) {
    createBakeryWorkshop(tiles, startX, startY, width, height, config, era, interactionZones, population, wealthLevel);
  } else if (businessType.includes('carpenter') || businessType.includes('wood')) {
    createCarpentryWorkshop(tiles, startX, startY, width, height, config, era, interactionZones, population, wealthLevel);
  } else {
    // Generic workshop with era-specific variations
    createGenericWorkshop(tiles, startX, startY, width, height, config, era, interactionZones, population, wealthLevel);
  }

  // Add lighting appropriate to era and culture
  lightRoom(tiles, room.bounds, config.culturalZone, era);
}

/**
 * Create smithy workshop with forge and anvil - Era and wealth variations
 */
function createSmithyWorkshop(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  population: number,
  wealthLevel: string
): void {
  // Population-based scaling for smithy complexity
  const isLargeSettlement = population > 2000;
  const isMajorCity = population > 5000;

  // Primary forge placement
  const forgeX = startX + Math.floor(width / 2);
  const forgeY = startY + 2;
  tiles[forgeY][forgeX].biome = BiomeType.FIRE_PIT;

  interactionZones.push({
    id: 'forge',
    location: [forgeX, forgeY],
    label: 'Use Forge',
    description: 'A hot forge for heating and shaping metal',
    interactionType: 'crafting'
  });

  // Place primary anvil in center
  const anvilX = startX + Math.floor(width / 2);
  const anvilY = startY + Math.floor(height / 2);
  tiles[anvilY][anvilX].biome = BiomeType.ANVIL;

  interactionZones.push({
    id: 'anvil',
    location: [anvilX, anvilY],
    label: 'Use Anvil',
    description: getEraAppropriateAnvilDescription(era),
    interactionType: 'crafting'
  });

  // Large settlements get additional workstations
  if (isLargeSettlement && width > 6) {
    // Secondary anvil for apprentices
    if (startX + width - 3 > startX && startY + 3 < startY + height) {
      tiles[startY + 3][startX + width - 3].biome = BiomeType.ANVIL;
      interactionZones.push({
        id: 'apprentice_anvil',
        location: [startX + width - 3, startY + 3],
        label: 'Apprentice Anvil',
        description: 'A smaller anvil for training apprentices',
        interactionType: 'crafting'
      });
    }
  }

  // Major cities get specialized equipment
  if (isMajorCity && width > 8) {
    // Quenching station
    if (startX + 1 < startX + width && startY + height - 2 > startY) {
      tiles[startY + height - 2][startX + 1].biome = BiomeType.BASIN;
      interactionZones.push({
        id: 'quench_basin',
        location: [startX + 1, startY + height - 2],
        label: 'Quenching Basin',
        description: 'For rapidly cooling hot metal',
        interactionType: 'crafting'
      });
    }
  }

  // Era and wealth-specific storage and tools
  if (era >= 1800) { // Industrial Era
    // Industrial smithy with multiple stations
    placeChestWithItems(tiles, startX + 2, startY + 2, 'steel_ingots');
    placeBarrelWithItems(tiles, startX + width - 3, startY + 2, 'coal');

    // Large settlements get steam power
    if (isLargeSettlement && wealthLevel === 'wealthy' && width > 8) {
      placeSmartTable(tiles, startX + width - 3, startY + height - 3, 'rectangle');
    }

    // Major cities get multiple material storage
    if (isMajorCity) {
      placeChestWithItems(tiles, startX + 1, startY + 1, 'alloy_ingots');
    }

  } else if (era >= 1000) { // Medieval Era
    // Traditional medieval smithy
    placeChestWithItems(tiles, startX + 2, startY + 2, 'iron_ingots');
    placeBarrelWithItems(tiles, startX + width - 3, startY + 2, 'charcoal');

    // Large settlements get guild infrastructure
    if (isLargeSettlement && wealthLevel === 'wealthy') {
      placeChestWithItems(tiles, startX + width - 2, startY + height - 2, 'masterwork_tools');
    }

    // Major cities get specialized materials
    if (isMajorCity) {
      placeChestWithItems(tiles, startX + 1, startY + 1, 'rare_metals');
    }

  } else { // Ancient Era
    // Primitive smithy with basic bronze working
    placeChestWithItems(tiles, startX + 2, startY + 2, 'bronze_ingots');
    placeBarrelWithItems(tiles, startX + width - 3, startY + 2, 'charcoal');

    // Large settlements get tin and copper storage
    if (isLargeSettlement) {
      placeChestWithItems(tiles, startX + 1, startY + 1, 'tin_ingots');
    }
  }

  // Base workbench for all smithies
  placeSmartTable(tiles, startX + 2, startY + height - 3, 'rectangle');

  // Large settlements get additional workspace
  if (isLargeSettlement && width > 6) {
    placeSmartTable(tiles, startX + width - 2, startY + 2, 'rectangle');
  }
}

/**
 * Create pottery workshop with kiln and wheel
 */
function createPotteryWorkshop(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  population: number,
  wealthLevel: string
): void {
  // Population-based scaling for pottery workshop
  const isLargeSettlement = population > 2000;
  const isMajorCity = population > 5000;

  // Primary kiln placement
  const kilnX = startX + 2;
  const kilnY = startY + 1;
  tiles[kilnY][kilnX].biome = BiomeType.OVEN_BRICK;

  interactionZones.push({
    id: 'kiln',
    location: [kilnX, kilnY],
    label: 'Use Kiln',
    description: 'A ceramic kiln for firing pottery',
    interactionType: 'crafting'
  });

  // Primary pottery wheel in center
  const wheelX = startX + Math.floor(width / 2);
  const wheelY = startY + Math.floor(height / 2);
  tiles[wheelY][wheelX].biome = BiomeType.SPINNING_WHEEL;

  interactionZones.push({
    id: 'pottery_wheel',
    location: [wheelX, wheelY],
    label: 'Use Pottery Wheel',
    description: 'A spinning wheel for shaping clay',
    interactionType: 'crafting'
  });

  // Large settlements get additional equipment
  if (isLargeSettlement && width > 6) {
    // Second pottery wheel for apprentices
    if (startX + width - 3 > startX && startY + 3 < startY + height) {
      tiles[startY + 3][startX + width - 3].biome = BiomeType.SPINNING_WHEEL;
      interactionZones.push({
        id: 'apprentice_wheel',
        location: [startX + width - 3, startY + 3],
        label: 'Apprentice Wheel',
        description: 'A smaller wheel for learning pottery',
        interactionType: 'crafting'
      });
    }
  }

  // Major cities get specialized drying area
  if (isMajorCity && width > 8) {
    // Drying shelves
    if (startX + 1 < startX + width && startY + height - 2 > startY) {
      tiles[startY + height - 2][startX + 1].biome = BiomeType.SHELF;
      interactionZones.push({
        id: 'drying_shelf',
        location: [startX + 1, startY + height - 2],
        label: 'Drying Shelf',
        description: 'For drying pottery before firing',
        interactionType: 'storage'
      });
    }
  }

  // Base storage for all pottery workshops
  placeBarrelWithItems(tiles, startX + width - 2, startY + 2, 'clay');
  getCulturalStorage(tiles, startX + 2, startY + height - 3, config.culturalZone, 'ceramics');

  // Large settlements get additional clay storage
  if (isLargeSettlement) {
    placeBarrelWithItems(tiles, startX + 1, startY + 1, 'fine_clay');
  }

  // Major cities get glazing materials
  if (isMajorCity) {
    placeChestWithItems(tiles, startX + width - 2, startY + 1, 'glazes_and_pigments');
  }
}

/**
 * Create weaving workshop with loom
 */
function createWeavingWorkshop(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  population: number,
  wealthLevel: string
): void {
  // Population-based scaling for weaving workshop
  const isLargeSettlement = population > 2000;
  const isMajorCity = population > 5000;

  // Primary loom against back wall
  const loomX = startX + 2;
  const loomY = startY + 1;
  tiles[loomY][loomX].biome = BiomeType.LOOM;
  tiles[loomY][loomX + 1].biome = BiomeType.LOOM; // 2-tile wide loom

  interactionZones.push({
    id: 'loom',
    location: [loomX, loomY],
    label: 'Use Loom',
    description: 'A large loom for weaving textiles',
    interactionType: 'crafting'
  });

  // Primary spinning wheel
  const wheelX = startX + Math.floor(width / 2);
  const wheelY = startY + Math.floor(height / 2);
  tiles[wheelY][wheelX].biome = BiomeType.SPINNING_WHEEL;

  interactionZones.push({
    id: 'spinning_wheel',
    location: [wheelX, wheelY],
    label: 'Use Spinning Wheel',
    description: 'A spinning wheel for creating thread',
    interactionType: 'crafting'
  });

  // Large settlements get additional spinning wheels
  if (isLargeSettlement && width > 6) {
    if (startX + width - 3 > startX && startY + height - 3 > startY) {
      tiles[startY + height - 3][startX + width - 3].biome = BiomeType.SPINNING_WHEEL;
      interactionZones.push({
        id: 'second_wheel',
        location: [startX + width - 3, startY + height - 3],
        label: 'Assistant Spinning Wheel',
        description: 'Additional wheel for increased production',
        interactionType: 'crafting'
      });
    }
  }

  // Major cities get fabric dyeing area
  if (isMajorCity && width > 8) {
    if (startX + 1 < startX + width && startY + height - 2 > startY) {
      tiles[startY + height - 2][startX + 1].biome = BiomeType.BASIN;
      interactionZones.push({
        id: 'dye_basin',
        location: [startX + 1, startY + height - 2],
        label: 'Dyeing Basin',
        description: 'For dyeing finished textiles',
        interactionType: 'crafting'
      });
    }
  }

  // Era and wealth-specific materials and setup
  if (era >= 1800) { // Industrial Era
    // Industrial textile production
    placeChestWithItems(tiles, startX + width - 2, startY + 2, 'cotton_thread');
    placeBarrelWithItems(tiles, startX + 2, startY + height - 2, 'cotton');

    if (isLargeSettlement && wealthLevel === 'wealthy') {
      // Steam-powered looms for wealthy textile operations
      interactionZones.push({
        id: 'steam_loom',
        location: [startX + width - 2, startY + 2],
        label: 'Steam Loom',
        description: 'A steam-powered loom for mass textile production',
        interactionType: 'crafting'
      });
    }

    // Major cities get synthetic materials
    if (isMajorCity) {
      placeChestWithItems(tiles, startX + 1, startY + 1, 'synthetic_fibers');
    }

  } else if (config.culturalZone === 'SOUTH_ASIAN' && era >= 1500) {
    // South Asian silk production
    placeChestWithItems(tiles, startX + width - 2, startY + 2, 'silk_thread');
    placeBarrelWithItems(tiles, startX + 2, startY + height - 2, 'silk');

    // Large settlements get premium silk storage
    if (isLargeSettlement) {
      placeChestWithItems(tiles, startX + 1, startY + 1, 'fine_silk');
    }

  } else {
    // Traditional materials
    placeChestWithItems(tiles, startX + width - 2, startY + 2, 'thread');
    placeBarrelWithItems(tiles, startX + 2, startY + height - 2, 'wool');

    // Large settlements get additional fiber storage
    if (isLargeSettlement) {
      placeBarrelWithItems(tiles, startX + 1, startY + 1, 'linen');
    }
  }
}

/**
 * Create bakery workshop with oven
 */
function createBakeryWorkshop(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  population: number,
  wealthLevel: string
): void {
  // Population-based scaling for bakery
  const isLargeSettlement = population > 2000;
  const isMajorCity = population > 5000;

  // Primary oven against back wall
  const ovenX = startX + Math.floor(width / 2);
  const ovenY = startY + 1;
  tiles[ovenY][ovenX].biome = BiomeType.OVEN_BRICK;

  interactionZones.push({
    id: 'oven',
    location: [ovenX, ovenY],
    label: 'Use Oven',
    description: 'A stone oven for baking bread',
    interactionType: 'crafting'
  });

  // Primary work table for kneading
  placeSmartTable(tiles, startX + 2, startY + Math.floor(height / 2), 'rectangle');

  // Large settlements get additional ovens
  if (isLargeSettlement && width > 6) {
    if (startX + width - 3 > startX && startY + 1 < startY + height) {
      tiles[startY + 1][startX + width - 3].biome = BiomeType.OVEN_BRICK;
      interactionZones.push({
        id: 'second_oven',
        location: [startX + width - 3, startY + 1],
        label: 'Additional Oven',
        description: 'Second oven for increased production',
        interactionType: 'crafting'
      });
    }
  }

  // Major cities get specialized pastry area
  if (isMajorCity && width > 8) {
    if (startX + 1 < startX + width && startY + height - 2 > startY) {
      placeSmartTable(tiles, startX + 1, startY + height - 2, 'round');
      interactionZones.push({
        id: 'pastry_table',
        location: [startX + 1, startY + height - 2],
        label: 'Pastry Table',
        description: 'Specialized table for making pastries',
        interactionType: 'crafting'
      });
    }
  }

  // Base storage for all bakeries
  placeBarrelWithItems(tiles, startX + width - 2, startY + 2, 'flour');
  placeBarrelWithItems(tiles, startX + 2, startY + height - 2, 'grain');

  // Large settlements get additional work surfaces
  if (isLargeSettlement && width > 6) {
    placeSmartTable(tiles, startX + width - 2, startY + height - 3, 'rectangle');
  }

  // Major cities get premium ingredients
  if (isMajorCity) {
    placeChestWithItems(tiles, startX + 1, startY + 1, 'spices_and_honey');
    placeBarrelWithItems(tiles, startX + width - 1, startY + 1, 'fine_flour');
  }
}

/**
 * Create carpentry workshop with workbench
 */
function createCarpentryWorkshop(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  population: number,
  wealthLevel: string
): void {
  // Population-based scaling for carpentry workshop
  const isLargeSettlement = population > 2000;
  const isMajorCity = population > 5000;

  // Primary workbench
  const benchX = startX + 2;
  const benchY = startY + Math.floor(height / 2);
  placeSmartTable(tiles, benchX, benchY, 'rectangle');
  tiles[benchY][benchX].biome = BiomeType.WORKBENCH;

  interactionZones.push({
    id: 'workbench',
    location: [benchX, benchY],
    label: 'Use Workbench',
    description: 'A sturdy workbench for woodworking',
    interactionType: 'crafting'
  });

  // Large settlements get additional workstations
  if (isLargeSettlement && width > 6) {
    // Second workbench for assistants
    if (startX + width - 3 > startX && startY + height - 3 > startY) {
      placeSmartTable(tiles, startX + width - 3, startY + height - 3, 'rectangle');
      tiles[startY + height - 3][startX + width - 3].biome = BiomeType.WORKBENCH;
      interactionZones.push({
        id: 'assistant_bench',
        location: [startX + width - 3, startY + height - 3],
        label: 'Assistant Workbench',
        description: 'Additional bench for apprentices',
        interactionType: 'crafting'
      });
    }
  }

  // Major cities get specialized wood treatment area
  if (isMajorCity && width > 8) {
    if (startX + 1 < startX + width && startY + height - 2 > startY) {
      tiles[startY + height - 2][startX + 1].biome = BiomeType.BASIN;
      interactionZones.push({
        id: 'treatment_basin',
        location: [startX + 1, startY + height - 2],
        label: 'Wood Treatment Basin',
        description: 'For treating and staining wood',
        interactionType: 'crafting'
      });
    }
  }

  // Base storage for all carpentry shops
  placeChestWithItems(tiles, startX + width - 2, startY + 2, 'tools');
  placeBarrelWithItems(tiles, startX + 2, startY + height - 2, 'lumber');

  // Large settlements get premium wood storage
  if (isLargeSettlement) {
    placeBarrelWithItems(tiles, startX + 1, startY + 1, 'hardwood');
  }

  // Major cities get specialized materials
  if (isMajorCity) {
    placeChestWithItems(tiles, startX + width - 1, startY + 1, 'exotic_woods');
    placeBarrelWithItems(tiles, startX + width - 2, startY + height - 1, 'wood_stains');
  }
}

/**
 * Create generic workshop
 */
function createGenericWorkshop(
  tiles: Tile[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
  config: SpecialMapConfig,
  era: number,
  interactionZones: InteractionZone[],
  population: number,
  wealthLevel: string
): void {
  // Population-based scaling for generic workshop
  const isLargeSettlement = population > 2000;
  const isMajorCity = population > 5000;

  // Primary work table
  const tableX = startX + Math.floor(width / 2);
  const tableY = startY + Math.floor(height / 2);
  placeSmartTable(tiles, tableX, tableY, 'round');

  interactionZones.push({
    id: 'work_table',
    location: [tableX, tableY],
    label: 'Work Table',
    description: 'A versatile table for various crafts',
    interactionType: 'crafting'
  });

  // Large settlements get additional work surface
  if (isLargeSettlement && width > 6) {
    if (startX + 2 < startX + width && startY + 2 < startY + height) {
      placeSmartTable(tiles, startX + 2, startY + 2, 'rectangle');
      interactionZones.push({
        id: 'assistant_table',
        location: [startX + 2, startY + 2],
        label: 'Assistant Table',
        description: 'Additional workspace for helpers',
        interactionType: 'crafting'
      });
    }
  }

  // Major cities get specialized storage room
  if (isMajorCity && width > 8) {
    if (startX + width - 2 > startX && startY + height - 2 > startY) {
      getCulturalStorage(tiles, startX + width - 2, startY + height - 2, config.culturalZone, 'rare_materials');
    }
  }

  // Base storage for all generic workshops
  getCulturalStorage(tiles, startX + 2, startY + 2, config.culturalZone, 'tools');
  getCulturalStorage(tiles, startX + width - 3, startY + height - 3, config.culturalZone, 'materials');

  // Large settlements get expanded storage
  if (isLargeSettlement) {
    getCulturalStorage(tiles, startX + 1, startY + height - 2, config.culturalZone, 'supplies');
  }
}

/**
 * Get appropriate floor type based on culture and era
 */
function getFloorType(culturalZone: string, era: number): BiomeType {
  // Culture-specific floor preferences
  if (culturalZone === 'EAST_ASIAN') {
    if (era >= 1500) {
      return BiomeType.FLOOR_WOOD; // Tatami mats or polished wood
    } else {
      return BiomeType.FLOOR_WOOD; // Traditional wood floors
    }
  } else if (culturalZone === 'MENA') {
    if (era >= 800) {
      return BiomeType.FLOOR_TILE; // Geometric Islamic tiles
    } else {
      return BiomeType.FLOOR_STONE; // Early Islamic stone
    }
  } else if (culturalZone === 'SOUTH_ASIAN') {
    if (era >= 1500) {
      return BiomeType.FLOOR_MARBLE; // Mughal marble inlay
    } else if (era >= 500) {
      return BiomeType.FLOOR_STONE; // Carved stone
    } else {
      return BiomeType.FLOOR_STONE; // Simple stone
    }
  } else if (culturalZone === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
    return BiomeType.FLOOR_WOOD; // Wooden planks or packed earth
  } else if (culturalZone === 'SUB_SAHARAN_AFRICAN') {
    if (era >= 1000) {
      return BiomeType.FLOOR_WOOD; // Hardwood with geometric patterns
    } else {
      return BiomeType.FLOOR_STONE; // Packed earth/clay
    }
  } else if (culturalZone === 'OCEANIA') {
    return BiomeType.FLOOR_WOOD; // Bamboo or tropical wood
  } else if (culturalZone === 'SOUTH_AMERICAN') {
    if (era >= 1200) {
      return BiomeType.FLOOR_STONE; // Inca fitted stone
    } else {
      return BiomeType.FLOOR_STONE; // Simple stone
    }
  } else { // European and others
    if (era >= 1800) {
      return BiomeType.FLOOR_WOOD; // Industrial era wood floors
    } else if (era >= 1500) {
      return BiomeType.FLOOR_STONE; // Renaissance stone
    } else if (era >= 1000) {
      return BiomeType.FLOOR_STONE; // Medieval stone
    } else {
      return BiomeType.FLOOR_STONE; // Ancient stone/dirt
    }
  }
}

/**
 * Get workshop room name based on business type
 */
function getWorkshopRoomName(businessType: string): string {
  const type = businessType.toLowerCase();

  if (type.includes('smith')) return 'Smithy';
  if (type.includes('potter')) return 'Pottery Workshop';
  if (type.includes('weav')) return 'Weaving Workshop';
  if (type.includes('baker')) return 'Bakery';
  if (type.includes('carpenter')) return 'Carpentry Workshop';

  return 'Workshop';
}

/**
 * Get era-appropriate anvil description
 */
function getEraAppropriateAnvilDescription(era: number): string {
  if (era >= 1800) {
    return 'A heavy iron anvil with precision surface for industrial metalworking';
  } else if (era >= 1000) {
    return 'A well-worn anvil used by generations of blacksmiths';
  } else {
    return 'A crude but functional bronze-age anvil for shaping metal';
  }
}

/**
 * Fill landscape border around workshop
 */
function fillLandscapeBorder(
  tiles: Tile[][],
  size: { width: number; height: number },
  borderSize: number,
  climate: string
): void {
  // Simple landscape - just grass or appropriate ground cover
  const landscapeBiome = climate === 'arid' ? BiomeType.SCRUB : BiomeType.GRASSLAND;

  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (x < borderSize || x >= size.width - borderSize ||
          y < borderSize || y >= size.height - borderSize) {
        tiles[y][x].biome = landscapeBiome;
        tiles[y][x].isBlocking = false;
      }
    }
  }
}